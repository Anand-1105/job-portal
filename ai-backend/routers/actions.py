from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from services.auth import get_user_id
from services.supabase_client import get_supabase

router = APIRouter(prefix="/actions", tags=["actions"])

class TailorPayload(BaseModel):
    candidate_id: str
    job_id: str

class ColdEmailPayload(BaseModel):
    candidate_id: str
    job_id: str

class AutoApplyPayload(BaseModel):
    candidate_id: str
    job_url: str


@router.post("/linkedin-apply")
async def linkedin_apply(payload: AutoApplyPayload, user_id: str = Depends(get_user_id)):
    from agents.linkedin_apply_agent import auto_apply_linkedin

    db = get_supabase()

    # Fetch candidate info
    candidate = db.table("profiles").select("full_name").eq("id", payload.candidate_id).single().execute()
    profile = db.table("candidate_profiles").select("resume_text").eq("candidate_id", payload.candidate_id).single().execute()

    if not profile.data or not profile.data.get("resume_text"):
        raise HTTPException(status_code=400, detail="Please upload/save your resume in your profile first.")

    # Get email from auth if possible (or just use candidate.data if stored there)
    # For now, we'll try to get it from the profile or assume the agent can find it
    email = ""
    try:
        auth_user = db.auth.admin.get_user_by_id(payload.candidate_id)
        email = auth_user.user.email if auth_user.user else ""
    except: pass

    result = await auto_apply_linkedin(
        job_url=payload.job_url,
        candidate_name=candidate.data["full_name"] if candidate.data else "Candidate",
        candidate_email=email,
        candidate_phone="8639392032", # Hardcoded from user request
        resume_text=profile.data["resume_text"]
    )

    print(f"[Backend-Action] LinkedIn result: {result}")
    return result


@router.post("/tailor-resume")
async def tailor_resume(payload: TailorPayload, user_id: str = Depends(get_user_id)):
    from chains.resume_tailor import tailor_resume as run_tailor

    db = get_supabase()

    profile = db.table("candidate_profiles").select("resume_text") \
        .eq("candidate_id", payload.candidate_id).single().execute()
    job = db.table("jobs").select("title, description, requirements") \
        .eq("id", payload.job_id).single().execute()

    if not profile.data or not profile.data.get("resume_text"):
        raise HTTPException(status_code=400, detail="No resume text found. Save profile with resume first.")
    if not job.data:
        raise HTTPException(status_code=404, detail="Job not found")

    jd = f"{job.data['title']}\n{job.data['description']}\n{job.data.get('requirements','')}"
    tailored = await run_tailor(profile.data["resume_text"], jd)

    # Store artifact
    res = db.table("ai_artifacts").insert({
        "candidate_id": payload.candidate_id,
        "job_id": payload.job_id,
        "type": "tailored_resume",
        "content": tailored
    }).execute()

    return {"artifact_id": res.data[0]["id"], "tailored_resume": tailored}


@router.post("/cold-email")
async def cold_email(payload: ColdEmailPayload, user_id: str = Depends(get_user_id)):
    from chains.cold_email import generate_cold_email

    db = get_supabase()

    candidate = db.table("profiles").select("full_name").eq("id", payload.candidate_id).single().execute()
    profile = db.table("candidate_profiles").select("skills").eq("candidate_id", payload.candidate_id).single().execute()
    job = db.table("jobs").select("title, description").eq("id", payload.job_id).single().execute()
    compat = db.table("job_compatibility").select("hiring_manager_email") \
        .eq("candidate_id", payload.candidate_id).eq("job_id", payload.job_id).execute()

    if not job.data:
        raise HTTPException(status_code=404, detail="Job not found")

    hiring_manager_email = compat.data[0].get("hiring_manager_email") if compat.data else None

    # Extract company name from job description (naive: use job title domain)
    company = job.data["title"].split(" at ")[-1] if " at " in job.data["title"] else "the company"

    result = await generate_cold_email(
        candidate_name=candidate.data["full_name"] if candidate.data else "Candidate",
        skills=profile.data.get("skills", []) if profile.data else [],
        job_title=job.data["title"],
        company=company,
        hiring_manager_name="Hiring Manager"
    )

    # Store artifact
    res = db.table("ai_artifacts").insert({
        "candidate_id": payload.candidate_id,
        "job_id": payload.job_id,
        "type": "cold_email",
        "content": f"Subject: {result['subject']}\n\n{result['body']}"
    }).execute()

    return {
        "artifact_id": res.data[0]["id"],
        "subject": result["subject"],
        "body": result["body"],
        "hiring_manager_email": hiring_manager_email
    }


@router.get("/artifacts/{candidate_id}")
async def get_artifacts(candidate_id: str, user_id: str = Depends(get_user_id)):
    res = get_supabase().table("ai_artifacts").select("*").eq("candidate_id", candidate_id).execute()
    return {"artifacts": res.data}


@router.get("/test-ping")
async def test_ping():
    return {"status": "alive", "version": "2.1-debug", "path": __file__}
