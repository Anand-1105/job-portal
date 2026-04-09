from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from services.auth import get_user_id
from services.supabase_client import get_supabase

router = APIRouter(prefix="/jobs", tags=["jobs"])

class CompatibilityPayload(BaseModel):
    candidate_id: str
    job_ids: list[str]

class LookupEmailPayload(BaseModel):
    company_domain: str
    job_title: str
    first_name: str = ""
    last_name: str = ""

class QuickApplyPayload(BaseModel):
    candidate_id: str
    job_id: str
    resume_text: str

class AutoApplyPayload(BaseModel):
    candidate_id: str
    job_id: str
    cover_letter: str = ""


class ScrapePayload(BaseModel):
    keywords: str
    location: str = ""
    limit: int = 10

@router.post("/compatibility")
async def get_compatibility(payload: CompatibilityPayload, user_id: str = Depends(get_user_id)):
    from chains.job_compatibility import score_compatibility
    from services.hunter_client import find_hiring_manager_email
    import asyncio

    db = get_supabase()

    # Fetch candidate profile
    profile = db.table("candidate_profiles").select("*") \
        .eq("candidate_id", payload.candidate_id).single().execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    readiness = db.table("readiness_results").select("skill_scores") \
        .eq("candidate_id", payload.candidate_id).single().execute()
    skill_scores = readiness.data.get("skill_scores", {}) if readiness.data else {}

    # Fetch jobs
    jobs_res = db.table("jobs").select("*").in_("id", payload.job_ids).execute()
    jobs_data = jobs_res.data or []

    # Fetch existing cache
    cached_res = db.table("job_compatibility").select("*") \
        .eq("candidate_id", payload.candidate_id) \
        .in_("job_id", payload.job_ids).execute()
    
    cache_map = {c["job_id"]: c for c in (cached_res.data or [])}
    
    final_scores = []
    jobs_to_compute = []

    for job in jobs_data:
        if job["id"] in cache_map:
            cached = cache_map[job["id"]]
            final_scores.append({
                "job_id": job["id"],
                "score": cached["score"],
                "reasoning": cached["reasoning"],
                "hiring_manager_email": cached["hiring_manager_email"]
            })
        else:
            jobs_to_compute.append(job)

    if not jobs_to_compute:
        return {"scores": final_scores}

    async def compute_single_job(job):
        # Compute score
        result = await score_compatibility(
            skills=profile.data.get("skills", []),
            skill_scores=skill_scores,
            resume_text=profile.data.get("resume_text", ""),
            job_title=job["title"],
            job_description=job["description"],
            requirements=job.get("requirements", "")
        )

        hiring_email = job.get("hiring_manager_email")
        if not hiring_email:
            domain = job.get("company_domain", "")
            if domain:
                try:
                    email_result = await find_hiring_manager_email(domain)
                    hiring_email = email_result.get("email")
                except: pass

        # Cache result
        try:
            db.table("job_compatibility").upsert({
                "candidate_id": payload.candidate_id,
                "job_id": job["id"],
                "score": result.get("score", 0),
                "reasoning": result.get("reasoning", ""),
                "hiring_manager_email": hiring_email
            }, on_conflict="candidate_id,job_id").execute()
        except: pass

        return {
            "job_id": job["id"],
            "score": result.get("score", 0),
            "reasoning": result.get("reasoning", ""),
            "hiring_manager_email": hiring_email
        }

    # Run remaining in parallel
    computed_results = await asyncio.gather(*[compute_single_job(j) for j in jobs_to_compute])
    final_scores.extend(computed_results)

    return {"scores": final_scores}


@router.post("/lookup-email")
async def lookup_email(payload: LookupEmailPayload, user_id: str = Depends(get_user_id)):
    from services.hunter_client import find_hiring_manager_email
    result = await find_hiring_manager_email(
        domain=payload.company_domain,
        first_name=payload.first_name,
        last_name=payload.last_name
    )
    return result


@router.post("/quick-apply")
async def quick_apply(payload: QuickApplyPayload, background_tasks: BackgroundTasks, user_id: str = Depends(get_user_id)):
    """Sends confirmation email after application. Frontend handles the DB insert."""
    import resend
    import os
    db = get_supabase()

    candidate = db.table("profiles").select("full_name").eq("id", payload.candidate_id).single().execute()
    job = db.table("jobs").select("title").eq("id", payload.job_id).single().execute()

    if not candidate.data or not job.data:
        return {"confirmation_sent": True}  # Don't fail the UX

    def _send_email():
        try:
            resend.api_key = os.environ.get("RESEND_API_KEY", "")
            if not resend.api_key:
                return

            # In dev mode: Resend free tier only allows sending to the account owner's email.
            # Set RESEND_DEV_EMAIL in ai-backend/.env to override the recipient.
            dev_email = os.environ.get("RESEND_DEV_EMAIL", "")
            auth_user = db.auth.admin.get_user_by_id(payload.candidate_id)
            real_email = auth_user.user.email if auth_user and auth_user.user else ""
            to_addr = dev_email or real_email
            if not to_addr:
                return

            candidate_name = candidate.data.get('full_name') or 'there'
            job_title = job.data['title']

            resend.Emails.send({
                "from": "Chosen <onboarding@resend.dev>",
                "to": to_addr,
                "subject": f"✅ Application submitted: {job_title}",
                "html": f"""
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
                  <h2 style="color:#7c3aed">Application Confirmed 🎉</h2>
                  <p>Hi {candidate_name},</p>
                  <p>Your application for <strong>{job_title}</strong> has been submitted on <strong>Chosen</strong>.</p>
                  <p style="color:#6b7280">We'll notify you when there's an update from the recruiter.</p>
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
                  <p style="color:#9ca3af;font-size:12px">— The Chosen Team</p>
                </div>
                """
            })
            print(f"[Resend] Confirmation sent to {to_addr}")
        except Exception as e:
            print(f"[Resend] Email failed: {e}")

    background_tasks.add_task(_send_email)
    return {"confirmation_sent": True}


@router.post("/scrape")
async def scrape_jobs(payload: ScrapePayload, user_id: str = Depends(get_user_id)):
    """Scrape LinkedIn jobs directly, enrich with Hunter.io emails, save to Supabase."""
    from services.linkedin_scraper import scrape_linkedin_jobs
    from services.hunter_client import find_hiring_manager_email

    db = get_supabase()

    recruiter = db.table("profiles").select("id").eq("role", "recruiter").limit(1).execute()
    if not recruiter.data:
        raise HTTPException(status_code=400, detail="No recruiter account found.")
    recruiter_id = recruiter.data[0]["id"]

    jobs = await scrape_linkedin_jobs(
        keywords=payload.keywords,
        location=payload.location or "India",
        limit=min(payload.limit, 20)
    )

    if not jobs:
        return {"inserted": 0, "message": "No jobs found"}

    inserted = 0
    for job in jobs:
        company_domain = job.pop("company_domain", "")
        job.pop("source_url", "")
        job.pop("linkedin_job_id", "")

        hiring_email = None
        if company_domain:
            try:
                email_result = await find_hiring_manager_email(company_domain)
                hiring_email = email_result.get("email")
            except Exception:
                pass

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
                "hiring_manager_email": hiring_email,
            }).execute()
            inserted += 1
        except Exception as e:
            print(f"[Scraper] Failed to insert: {e}")

    return {"inserted": inserted, "total_scraped": len(jobs)}



@router.post("/auto-apply")
async def auto_apply(
    payload: AutoApplyPayload,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_user_id)
):
    """
    Fires off an ATS-aware auto-apply in the background.
    Returns immediately with a task_id for polling.
    """
    from services.task_store import create_task, update_task
    from agents.ats_apply_agent import auto_apply_ats

    db = get_supabase()

    candidate = db.table("profiles").select("full_name").eq("id", payload.candidate_id).single().execute()
    cp = db.table("candidate_profiles").select("resume_text").eq("candidate_id", payload.candidate_id).single().execute()
    job = db.table("jobs").select("title, source_url").eq("id", payload.job_id).single().execute()

    if not job.data:
        raise HTTPException(status_code=404, detail="Job not found.")

    source_url = job.data.get("source_url") or ""
    job_title = job.data.get("title", "")

    try:
        auth_user = db.auth.admin.get_user_by_id(payload.candidate_id)
        email = auth_user.user.email if auth_user.user else ""
    except Exception:
        email = ""

    candidate_name = candidate.data.get("full_name", "") if candidate.data else ""
    resume_text = cp.data.get("resume_text", "") if cp.data else ""

    # Parse company name from title (e.g. "Engineer at Google" → "Google")
    company_name = job_title.split(" at ")[-1].strip() if " at " in job_title else ""

    # Create background task
    task_id = create_task()

    async def _run():
        result = await auto_apply_ats(
            job_url=source_url,
            job_title=job_title,
            company_name=company_name,
            candidate_name=candidate_name,
            candidate_email=email,
            candidate_phone="",
            resume_text=resume_text,
            cover_letter=payload.cover_letter,
            task_id=task_id
        )
        # Log successful applications to DB
        if result.get("success"):
            try:
                db.table("applications").insert({
                    "job_id": payload.job_id,
                    "candidate_id": payload.candidate_id,
                    "full_name": candidate_name,
                    "email": email,
                    "status": "pending",
                    "cover_letter": payload.cover_letter,
                }).execute()
            except Exception as e:
                print(f"[ApplyDB] Insert failed: {e}")

    background_tasks.add_task(_run)

    return {
        "task_id": task_id,
        "status": "queued",
        "message": "🚀 Auto-apply started in background. Poll /jobs/apply-status/{task_id} for updates."
    }


@router.get("/apply-status/{task_id}")
async def apply_status(task_id: str, user_id: str = Depends(get_user_id)):
    """Poll this endpoint to get the current status of a background auto-apply."""
    from services.task_store import get_task
    task = get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    return task

