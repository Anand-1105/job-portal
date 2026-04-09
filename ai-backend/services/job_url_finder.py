"""
Job URL Finder — searches for the company's job on known ATS platforms.
Uses httpx + DuckDuckGo as a free, no-API-key search.
"""
import httpx
import re
from urllib.parse import quote_plus

ATS_DOMAINS = [
    "boards.greenhouse.io",
    "jobs.lever.co",
    "jobs.ashbyhq.com",
    "jobs.smartrecruiters.com",
]

def detect_ats(url: str) -> str:
    """Returns the ATS type from a URL, or 'generic'."""
    if "greenhouse.io" in url:
        return "greenhouse"
    if "lever.co" in url:
        return "lever"
    if "ashbyhq.com" in url:
        return "ashby"
    if "smartrecruiters.com" in url:
        return "smartrecruiters"
    if "myworkdayjobs.com" in url or "workday.com" in url:
        return "workday"
    return "generic"


async def find_ats_url(company_name: str, job_title: str) -> dict:
    """
    Search DuckDuckGo for the job on known ATS platforms.
    Returns { url, ats_type } or None if not found.
    """
    site_filter = " OR ".join(f"site:{d}" for d in ATS_DOMAINS)
    query = f'"{company_name}" "{job_title}" ({site_filter})'
    encoded = quote_plus(query)

    try:
        async with httpx.AsyncClient(
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
            follow_redirects=True,
            timeout=10
        ) as client:
            resp = await client.get(
                f"https://html.duckduckgo.com/html/?q={encoded}"
            )
            html = resp.text

        # Extract hrefs from DDG results
        urls = re.findall(r'href="(https?://[^"]+)"', html)
        for url in urls:
            for domain in ATS_DOMAINS:
                if domain in url:
                    return {"url": url, "ats_type": detect_ats(url)}

    except Exception as e:
        print(f"[URLFinder] Search failed: {e}")

    return None


def parse_company_from_job_title(job_title: str) -> str:
    """Extract company name from scraped titles like 'Software Engineer at Google'."""
    if " at " in job_title:
        return job_title.split(" at ")[-1].strip()
    return ""
