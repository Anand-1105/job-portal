from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from services.auth import get_user_id
from services.supabase_client import get_supabase
import uuid

router = APIRouter(prefix="/roadmap", tags=["roadmap"])


class ChatPayload(BaseModel):
    message: str
    session_id: str | None = None
    candidate_id: str

class SavePayload(BaseModel):
    candidate_id: str
    title: str
    content: str


@router.post("/chat")
async def roadmap_chat(payload: ChatPayload, user_id: str = Depends(get_user_id)):
    from agents.roadmap_agent import chat

    db = get_supabase()

    # Fetch combined candidate profile
    profile = db.table("profiles").select("full_name").eq("id", payload.candidate_id).single().execute()
    cp = db.table("candidate_profiles").select("skills, resume_text").eq("candidate_id", payload.candidate_id).single().execute()
    readiness = db.table("readiness_results").select("skill_scores, tier").eq("candidate_id", payload.candidate_id).single().execute()

    candidate_profile = {
        "full_name": profile.data.get("full_name", "Candidate") if profile.data else "Candidate",
        "skills": cp.data.get("skills", []) if cp.data else [],
        "resume_text": cp.data.get("resume_text", "") if cp.data else "",
        "skill_scores": readiness.data.get("skill_scores", {}) if readiness.data else {},
        "tier": readiness.data.get("tier") if readiness.data else None,
    }

    session_id = payload.session_id or str(uuid.uuid4())

    result = await chat(
        session_id=session_id,
        user_message=payload.message,
        candidate_id=payload.candidate_id,
        candidate_profile=candidate_profile
    )

    return result


@router.get("/history/{session_id}")
async def get_history(session_id: str, user_id: str = Depends(get_user_id)):
    from agents.roadmap_agent import get_history
    return {"history": get_history(session_id)}


@router.post("/save")
async def save_roadmap(payload: SavePayload, user_id: str = Depends(get_user_id)):
    db = get_supabase()
    if user_id != payload.candidate_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    try:
        data = db.table("roadmaps").insert({
            "candidate_id": payload.candidate_id,
            "title": payload.title,
            "content": payload.content
        }).execute()
        return {"status": "success", "data": data.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
async def list_roadmaps(user_id: str = Depends(get_user_id)):
    db = get_supabase()
    try:
        res = db.table("roadmaps").select("*").eq("candidate_id", user_id).order("created_at", desc=True).execute()
        return {"roadmaps": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{roadmap_id}")
async def delete_roadmap(roadmap_id: str, user_id: str = Depends(get_user_id)):
    db = get_supabase()
    try:
        # First check ownership
        check = db.table("roadmaps").select("candidate_id").eq("id", roadmap_id).single().execute()
        if not check.data or check.data["candidate_id"] != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized or not found")
        
        db.table("roadmaps").delete().eq("id", roadmap_id).execute()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
