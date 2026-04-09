"""Run this once to seed real LinkedIn jobs into Supabase."""
import asyncio, sys
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()
from services.linkedin_scraper import scrape_linkedin_jobs
from services.supabase_client import get_supabase

SEARCHES = [
    ('software engineer', 'India'),
    ('frontend developer', 'India'),
    ('backend developer', 'India'),
    ('data scientist', 'India'),
    ('full stack developer', 'India'),
]

async def seed():
    db = get_supabase()
    recruiter = db.table("profiles").select("id").eq("role", "recruiter").limit(1).execute()
    if not recruiter.data:
        print("ERROR: No recruiter found. Create a recruiter account first.")
        return
    recruiter_id = recruiter.data[0]["id"]

    total = 0
    for keywords, location in SEARCHES:
        print(f"Scraping: {keywords} in {location}...")
        jobs = await scrape_linkedin_jobs(keywords, location, limit=8)
        print(f"  Got {len(jobs)} jobs")

        for job in jobs:
            source_url = job.pop("source_url", "")
            job.pop("company_domain", "")
            job.pop("linkedin_job_id", "")
            try:
                db.table("jobs").insert({
                    "recruiter_id": recruiter_id,
                    "title": job["title"],
                    "description": job["description"],
                    "location": job["location"],
                    "type": job["type"],
                    "salary_range": job.get("salary_range"),
                    "requirements": job.get("requirements", ""),
                    "status": "open",
                    "source_url": source_url,
                }).execute()
                total += 1
            except Exception as e:
                print(f"  Skip (duplicate?): {e}")

        await asyncio.sleep(2)

    print(f"\nDone! Inserted {total} real jobs into Supabase.")

asyncio.run(seed())
