import os
import httpx
from dotenv import load_dotenv

load_dotenv()

# Two separate API keys — one per endpoint
EMAIL_FINDER_KEY = os.environ.get("HUNTER_EMAIL_FINDER_API_KEY", "")
DOMAIN_SEARCH_KEY = os.environ.get("HUNTER_DOMAIN_SEARCH_API_KEY", "")
BASE_URL = "https://api.hunter.io/v2"


async def find_email_by_name(domain: str, first_name: str, last_name: str) -> dict:
    """
    Email Finder — use when you have the hiring manager's name.
    Uses HUNTER_EMAIL_FINDER_API_KEY.
    GET /v2/email-finder?domain=...&first_name=...&last_name=...
    Returns: {email, confidence, source}
    """
    if not EMAIL_FINDER_KEY:
        return {"email": None, "confidence": 0, "source": "email_finder_disabled"}

    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE_URL}/email-finder", params={
            "domain": domain,
            "first_name": first_name,
            "last_name": last_name,
            "api_key": EMAIL_FINDER_KEY
        })
        if resp.status_code == 200:
            data = resp.json().get("data", {})
            email = data.get("email")
            if email:
                return {
                    "email": email,
                    "confidence": data.get("score", 0),
                    "source": "email_finder"
                }

    return {"email": None, "confidence": 0, "source": "email_finder_no_result"}


async def search_domain_emails(domain: str) -> dict:
    """
    Domain Search — use when you only have the company domain, no name.
    Uses HUNTER_DOMAIN_SEARCH_API_KEY.
    GET /v2/domain-search?domain=...
    Returns the top verified email found at that domain.
    """
    if not DOMAIN_SEARCH_KEY:
        return {"email": None, "confidence": 0, "source": "domain_search_disabled"}

    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE_URL}/domain-search", params={
            "domain": domain,
            "limit": 1,
            "api_key": DOMAIN_SEARCH_KEY
        })
        if resp.status_code == 200:
            data = resp.json().get("data", {})
            emails = data.get("emails", [])
            if emails:
                top = emails[0]
                return {
                    "email": top.get("value"),
                    "confidence": top.get("confidence", 0),
                    "source": "domain_search"
                }

    return {"email": None, "confidence": 0, "source": "domain_search_no_result"}


async def find_hiring_manager_email(
    domain: str,
    first_name: str = "",
    last_name: str = ""
) -> dict:
    """
    Main entry point used by the jobs router.
    Uses Email Finder if name is provided, Domain Search as fallback.
    """
    if first_name and last_name:
        result = await find_email_by_name(domain, first_name, last_name)
        if result["email"]:
            return result

    # Fallback to domain search
    return await search_domain_emails(domain)
