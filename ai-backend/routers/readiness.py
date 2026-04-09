from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from services.auth import get_user_id
from services.supabase_client import get_supabase

router = APIRouter(prefix="/readiness", tags=["readiness"])

class ProfilePayload(BaseModel):
    skills: list[str]
    domain_interests: list[str]
    resume_text: str

class GenerateTestPayload(BaseModel):
    candidate_id: str

class SubmitPayload(BaseModel):
    assessment_id: str
    answers: list[dict]  # [{selected_index: int}]

class EvaluatePayload(BaseModel):
    candidate_id: str


@router.post("/profile")
async def save_profile(payload: ProfilePayload, user_id: str = Depends(get_user_id)):
    res = get_supabase().table("candidate_profiles").upsert({
        "candidate_id": user_id,
        "skills": payload.skills,
        "domain_interests": payload.domain_interests,
        "resume_text": payload.resume_text,
    }, on_conflict="candidate_id").execute()
    return {"candidate_profile_id": res.data[0]["id"]}


@router.post("/generate-test")
async def generate_test(payload: GenerateTestPayload, user_id: str = Depends(get_user_id)):
    from chains.mcq_generator import generate_mcq, ALLOWED_SKILLS

    # Fetch candidate's selected skills
    profile = get_supabase().table("candidate_profiles") \
        .select("skills") \
        .eq("candidate_id", payload.candidate_id) \
        .single().execute()

    if not profile.data:
        raise HTTPException(status_code=404, detail="Candidate profile not found. Save profile first.")

    skills = [s for s in profile.data["skills"] if s in ALLOWED_SKILLS]
    if not skills:
        raise HTTPException(status_code=400, detail="No valid skills found. Use allowed skill names.")

    # Cap at 2 skills max to avoid LLM timeout
    skills = skills[:2]

    assessments = []
    import asyncio

    async def generate_and_store(skill: str):
        # Check if we already have questions for this skill in cache
        cached = get_supabase().table("assessments") \
            .select("id, skill, questions") \
            .eq("candidate_id", payload.candidate_id) \
            .eq("skill", skill) \
            .eq("status", "pending") \
            .execute()

        if cached.data:
            return {"id": cached.data[0]["id"], "skill": skill, "questions": cached.data[0]["questions"]}

        mcq_set = await generate_mcq(skill)
        questions = mcq_set["questions"] if isinstance(mcq_set, dict) else [q.dict() for q in mcq_set.questions]
        res = get_supabase().table("assessments").insert({
            "candidate_id": payload.candidate_id,
            "skill": skill,
            "questions": questions,
            "status": "pending"
        }).execute()
        return {"id": res.data[0]["id"], "skill": skill, "questions": res.data[0]["questions"]}

    # Sequential — respects 4 RPM rate limit (rate limiter in generate_with_gemini_native)
    for skill in skills:
        result = await generate_and_store(skill)
        assessments.append(result)

    return {"assessments": assessments}


@router.post("/submit")
async def submit_assessment(payload: SubmitPayload, user_id: str = Depends(get_user_id)):
    # Fetch the assessment
    res = get_supabase().table("assessments") \
        .select("*") \
        .eq("id", payload.assessment_id) \
        .single().execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="Assessment not found")

    questions = res.data["questions"]
    answers = payload.answers

    # Score: count correct answers
    correct = 0
    for i, q in enumerate(questions):
        if i < len(answers):
            if answers[i].get("selected_index") == q["correct_index"]:
                correct += 1

    score = round((correct / len(questions)) * 100) if questions else 0

    # Save answers + score
    get_supabase().table("assessments").update({
        "answers": answers,
        "score": score,
        "status": "completed"
    }).eq("id", payload.assessment_id).execute()

    return {"score": score, "correct_count": correct, "total": len(questions)}


@router.post("/evaluate")
async def evaluate(payload: EvaluatePayload, user_id: str = Depends(get_user_id)):
    # Fetch all completed assessments for this candidate
    res = get_supabase().table("assessments") \
        .select("skill, score") \
        .eq("candidate_id", payload.candidate_id) \
        .eq("status", "completed") \
        .execute()

    if not res.data:
        raise HTTPException(status_code=400, detail="No completed assessments found")

    skill_scores = {row["skill"]: row["score"] for row in res.data}
    scores = list(skill_scores.values())
    overall_score = round(sum(scores) / len(scores))

    # Tier decision
    if overall_score >= 70:
        tier = "ready"
    elif overall_score >= 40:
        tier = "partial"
    else:
        tier = "not_ready"

    # Upsert readiness result
    get_supabase().table("readiness_results").upsert({
        "candidate_id": payload.candidate_id,
        "overall_score": overall_score,
        "tier": tier,
        "skill_scores": skill_scores
    }, on_conflict="candidate_id").execute()

    # Trigger agentic job search in background based on readiness
    import asyncio
    asyncio.create_task(_scrape_jobs_background(payload.candidate_id))

    return {
        "tier": tier,
        "overall_score": overall_score,
        "skill_scores": skill_scores
    }


async def _scrape_jobs_background(candidate_id: str):
    """Fire-and-forget job scraping after evaluation."""
    try:
        from agents.job_search_agent import scrape_jobs_for_candidate
        await scrape_jobs_for_candidate(candidate_id)
    except Exception as e:
        print(f"[JobAgent] Background scrape failed: {e}")


@router.get("/result/{candidate_id}")
async def get_result(candidate_id: str, user_id: str = Depends(get_user_id)):
    res = get_supabase().table("readiness_results") \
        .select("*") \
        .eq("candidate_id", candidate_id) \
        .single().execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="No readiness result found")

    return res.data


@router.post("/scrape-jobs/{candidate_id}")
async def trigger_job_scrape(candidate_id: str, user_id: str = Depends(get_user_id)):
    """Manually trigger job scraping for a candidate based on their readiness."""
    from agents.job_search_agent import scrape_jobs_for_candidate
    inserted = await scrape_jobs_for_candidate(candidate_id)
    return {"inserted": inserted}
