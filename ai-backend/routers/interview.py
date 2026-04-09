from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from services.auth import get_user_id
from services.supabase_client import get_supabase
import uuid

router = APIRouter(prefix="/interview", tags=["interview"])


class StartPayload(BaseModel):
    candidate_id: str
    job_id: str | None = None
    job_title: str = "Software Engineer"


class RespondPayload(BaseModel):
    session_id: str
    answer: str
    candidate_id: str


class EndPayload(BaseModel):
    session_id: str
    candidate_id: str


@router.post("/start")
async def start_interview(payload: StartPayload, user_id: str = Depends(get_user_id)):
    from agents.interview_agent import generate_questions, create_session

    db = get_supabase()

    cp = db.table("candidate_profiles").select("resume_text").eq("candidate_id", payload.candidate_id).single().execute()
    resume_text = cp.data.get("resume_text", "") if cp.data else ""

    job_description = ""
    if payload.job_id:
        job = db.table("jobs").select("title, description").eq("id", payload.job_id).single().execute()
        if job.data:
            payload.job_title = job.data.get("title", payload.job_title)
            job_description = job.data.get("description", "")

    questions = await generate_questions(
        job_title=payload.job_title,
        job_description=job_description,
        resume_text=resume_text,
        count=7
    )

    if not questions:
        raise HTTPException(
            status_code=500, 
            detail="AI failed to generate interview questions. Please try again in a few moments."
        )

    session_id = str(uuid.uuid4())
    create_session(session_id, questions, payload.job_title)

    return {
        "session_id": session_id,
        "job_title": payload.job_title,
        "total_questions": len(questions),
        "first_question": questions[0]["question"],
        "question_number": 1
    }


@router.post("/respond")
async def respond(payload: RespondPayload, user_id: str = Depends(get_user_id)):
    from agents.interview_agent import get_session, update_session, score_answer

    session = get_session(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found.")

    current_q_idx = session["current_q"]
    if current_q_idx >= len(session["questions"]):
        return {"done": True, "message": "All questions answered. Call /interview/end to get your report."}

    question_obj = session["questions"][current_q_idx]
    score = await score_answer(
        question=question_obj["question"],
        answer=payload.answer,
        job_title=session["job_title"],
        expected_keywords=question_obj.get("expected_keywords", [])
    )

    update_session(payload.session_id, payload.answer, score)

    session = get_session(payload.session_id)
    next_q = None
    next_q_num = None
    if session["current_q"] < len(session["questions"]):
        next_q = session["questions"][session["current_q"]]["question"]
        next_q_num = session["current_q"] + 1

    return {
        "score": score,
        "next_question": next_q,
        "question_number": next_q_num,
        "done": session["status"] == "completed",
        "answered": session["current_q"],
        "total": len(session["questions"])
    }


@router.post("/end")
async def end_interview(payload: EndPayload, user_id: str = Depends(get_user_id)):
    from agents.interview_agent import get_session, generate_report

    session = get_session(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    qa_pairs = [
        {"question": session["questions"][i]["question"], "answer": session["answers"][i]}
        for i in range(len(session["answers"]))
    ]

    report = await generate_report(
        job_title=session["job_title"],
        qa_pairs=qa_pairs,
        scores=session["scores"]
    )

    avg = round(sum(s.get("overall", 0) for s in session["scores"]) / len(session["scores"]), 1) if session["scores"] else 0

    # Persist results
    db = get_supabase()
    try:
        db.table("interview_results").insert({
            "candidate_id": payload.candidate_id,
            "job_title": session["job_title"],
            "overall_score": int(avg * 10), # Scale to 0-100 or keep as is? Let's keep 0-10 scale as decimal * 10
            "report_markdown": report,
            "questions_json": session["questions"]
        }).execute()
    except Exception as e:
        print(f"Error saving interview results: {e}")

    return {
        "report": report,
        "average_score": avg,
        "total_questions": len(session["questions"]),
        "answered": len(session["answers"])
    }
