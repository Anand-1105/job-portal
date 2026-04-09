import os
import asyncio
from apify_client import ApifyClient
from dotenv import load_dotenv

load_dotenv()

APIFY_API_KEY = os.environ.get("APIFY_API_KEY", "")

# Apify LinkedIn Jobs Scraper actor ID
ACTOR_ID = "curious_coder/linkedin-jobs-scraper"


async def scrape_linkedin_jobs(keywords: str, location: str = "", limit: int = 20) -> list[dict]:
    """
    Scrape LinkedIn jobs using Apify.
    Returns list of normalized job dicts ready to insert into Supabase.
    """
    if not APIFY_API_KEY:
        raise RuntimeError("APIFY_API_KEY not set in ai-backend/.env")

    client = ApifyClient(APIFY_API_KEY)

    run_input = {
        "searchQueries": [keywords],
        "location": location or "Worldwide",
        "maxResults": limit,
        "scrapeCompany": False,
    }

    loop = asyncio.get_event_loop()

    def _run():
        run = client.actor(ACTOR_ID).call(run_input=run_input)
        items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
        return items

    raw_items = await loop.run_in_executor(None, _run)
    return [_normalize(item) for item in raw_items if item.get("title")]


def _normalize(item: dict) -> dict:
    """Map Apify LinkedIn scraper output to our jobs table schema."""
    title = item.get("title", "").strip()
    company = item.get("companyName", "").strip()
    description = item.get("description", "") or item.get("descriptionText", "") or ""
    location = item.get("location", "Remote").strip()
    url = item.get("jobUrl", "") or item.get("url", "")

    # Map LinkedIn employment type to our enum
    emp_type = (item.get("employmentType", "") or "").lower()
    if "intern" in emp_type:
        job_type = "internship"
    elif "contract" in emp_type or "freelance" in emp_type:
        job_type = "contract"
    else:
        job_type = "full-time"

    # Extract company domain for Hunter.io lookup later
    company_domain = _extract_domain(item)

    return {
        "title": f"{title} at {company}" if company else title,
        "description": description[:3000],
        "location": location,
        "type": job_type,
        "salary_range": item.get("salary") or None,
        "requirements": item.get("requirements", "") or "",
        "status": "open",
        "company_domain": company_domain,
        "source_url": url,
    }


def _extract_domain(item: dict) -> str:
    """Try to get company domain from Apify data."""
    company_url = item.get("companyUrl", "") or item.get("companyLinkedinUrl", "") or ""
    company_name = item.get("companyName", "").lower().strip()

    # Try to extract from company URL
    if company_url and "linkedin.com/company/" in company_url:
        slug = company_url.split("linkedin.com/company/")[-1].strip("/").split("/")[0]
        return f"{slug}.com"

    # Fallback: clean company name to domain guess
    if company_name:
        clean = company_name.replace(" ", "").replace(",", "").replace(".", "")
        clean = clean.replace("inc", "").replace("ltd", "").replace("llc", "")
        return f"{clean}.com"

    return ""
