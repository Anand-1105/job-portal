"""
Direct LinkedIn job scraper — no Apify needed.
Uses LinkedIn's public guest API (no login required).
"""
import asyncio
import httpx
from bs4 import BeautifulSoup


HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}

JOB_SEARCH_URL = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
JOB_DETAIL_URL = "https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{job_id}"


async def scrape_linkedin_jobs(keywords: str, location: str = "India", limit: int = 15) -> list[dict]:
    """Scrape LinkedIn jobs and return normalized list ready for Supabase insert."""
    jobs = []
    start = 0
    batch = 10

    async with httpx.AsyncClient(headers=HEADERS, timeout=20, follow_redirects=True) as client:
        while len(jobs) < limit:
            resp = await client.get(JOB_SEARCH_URL, params={
                "keywords": keywords,
                "location": location,
                "start": start,
                "count": batch,
            })

            if resp.status_code != 200:
                break

            soup = BeautifulSoup(resp.text, "html.parser")
            cards = soup.find_all("li")

            if not cards:
                break

            for card in cards:
                if len(jobs) >= limit:
                    break

                job = _parse_card(card)
                if job:
                    jobs.append(job)

            start += batch
            if len(cards) < batch:
                break

            await asyncio.sleep(1)  # be polite

    return jobs


def _parse_card(card) -> dict | None:
    """Parse a single job card from LinkedIn search results HTML."""
    try:
        # Job ID
        entity = card.find("div", {"data-entity-urn": True})
        if not entity:
            return None
        urn = entity.get("data-entity-urn", "")
        job_id = urn.split(":")[-1] if urn else None

        # Title
        title_el = card.find("h3", class_=lambda c: c and "base-search-card__title" in c)
        title = title_el.get_text(strip=True) if title_el else None
        if not title:
            return None

        # Company
        company_el = card.find("h4", class_=lambda c: c and "base-search-card__subtitle" in c)
        company = company_el.get_text(strip=True) if company_el else "Company"

        # Location
        location_el = card.find("span", class_=lambda c: c and "job-search-card__location" in c)
        location = location_el.get_text(strip=True) if location_el else "India"

        # Job URL
        link_el = card.find("a", class_=lambda c: c and "base-card__full-link" in c)
        job_url = link_el.get("href", "").split("?")[0] if link_el else ""

        # Employment type (guess from title)
        title_lower = title.lower()
        if "intern" in title_lower:
            job_type = "internship"
        elif "contract" in title_lower or "freelance" in title_lower:
            job_type = "contract"
        else:
            job_type = "full-time"

        # Company domain guess for Hunter.io
        company_clean = company.lower().replace(" ", "").replace(",", "").replace(".", "")
        for suffix in ["inc", "ltd", "llc", "pvtltd", "pvt", "technologies", "tech", "solutions", "services"]:
            company_clean = company_clean.replace(suffix, "")
        company_domain = f"{company_clean}.com" if company_clean else ""

        return {
            "title": f"{title} at {company}",
            "description": f"Join {company} as a {title}. This is a {job_type} position based in {location}. Apply now to be considered for this exciting opportunity.",
            "location": location,
            "type": job_type,
            "salary_range": None,
            "requirements": "",
            "status": "open",
            "company_domain": company_domain,
            "source_url": job_url,
            "linkedin_job_id": job_id,
        }
    except Exception:
        return None
