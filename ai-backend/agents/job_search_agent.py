"""
Agentic job search — decides what to search for based on candidate readiness.
Triggered automatically after assessment evaluation.
"""
from services.linkedin_scraper import scrape_linkedin_jobs
from services.supabase_client import get_supabase


def _build_search_queries(tier: str, skills: list[str], domain_interests: list[str]) -> list[tuple[str, str]]:
    """
    Agent decides search queries based on readiness tier + skills.
    Returns list of (keywords, location) tuples.
    """
    top_skills = skills[:3] if skills else ["software engineer"]
    location = "India"

    if tier == "ready":
        # Senior/mid-level roles
        queries = []
        for skill in top_skills:
            queries.append((f"{skill} developer", location))
        if domain_interests:
            for domain in domain_interests[:2]:
                queries.append((f"{domain} engineer", location))
        return queries[:4]

    elif tier == "partial":
        # Junior roles + associate
        queries = []
        for skill in top_skills:
            queries.append((f"junior {skill} developer", location))
            queries.append((f"{skill} associate engineer", location))
        return queries[:4]

    else:  # not_ready
        # Internships + entry level only
        queries = []
        for skill in top_skills:
            queries.append((f"{skill} intern", location))
            queries.append((f"{skill} trainee", location))
        return queries[:4]


async def scrape_jobs_for_candidate(candidate_id: str) -> int:
    """
    Main agent function — reads candidate profile + readiness,
    decides what to search, scrapes LinkedIn, stores in Supabase.
    Returns number of jobs inserted.
    """
    db = get_supabase()

    # Fetch readiness result
    readiness = db.table("readiness_results") \
        .select("tier, skill_scores") \
        .eq("candidate_id", candidate_id) \
        .single().execute()

    if not readiness.data:
        print(f"[JobAgent] No readiness result for {candidate_id}")
        return 0

    tier = readiness.data["tier"]
    skill_scores = readiness.data.get("skill_scores", {})
    skills = list(skill_scores.keys())

    # Fetch domain interests
    profile = db.table("candidate_profiles") \
        .select("domain_interests, skills") \
        .eq("candidate_id", candidate_id) \
        .single().execute()

    domain_interests = []
    if profile.data:
        domain_interests = profile.data.get("domain_interests", [])
        if not skills:
            skills = profile.data.get("skills", [])

    # Agent decides search queries
    queries = _build_search_queries(tier, skills, domain_interests)
    print(f"[JobAgent] Tier={tier}, searching: {queries}")

    # Get a recruiter to assign jobs to
    recruiter = db.table("profiles").select("id").eq("role", "recruiter").limit(1).execute()
    if not recruiter.data:
        print("[JobAgent] No recruiter found, skipping job scrape")
        return 0
    recruiter_id = recruiter.data[0]["id"]

    # Scrape and insert
    inserted = 0
    seen_titles = set()

    for keywords, location in queries:
        try:
            jobs = await scrape_linkedin_jobs(keywords, location, limit=5)
            for job in jobs:
                title = job["title"]
                if title in seen_titles:
                    continue
                seen_titles.add(title)

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
                    inserted += 1
                except Exception:
                    pass

        except Exception as e:
            print(f"[JobAgent] Scrape failed for '{keywords}': {e}")

    print(f"[JobAgent] Inserted {inserted} jobs for candidate {candidate_id} (tier={tier})")
    return inserted
