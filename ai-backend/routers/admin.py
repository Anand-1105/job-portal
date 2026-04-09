from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from services.auth import get_user_id
from services.supabase_client import get_supabase

router = APIRouter(prefix="/admin", tags=["admin"])

class IntervenePayload(BaseModel):
    candidate_id: str
    message: str


@router.get("/tpc-intelligence")
async def tpc_intelligence(user_id: str = Depends(get_user_id)):
    from chains.placement_score import score_placement

    db = get_supabase()

    # Fetch all readiness results
    results = db.table("readiness_results").select("*").execute()
    if not results.data:
        return {"candidates": []}

    candidates = []
    for r in results.data:
        candidate_id = r["candidate_id"]

        # Fetch profile name
        profile = db.table("profiles").select("full_name").eq("id", candidate_id).single().execute()
        name = profile.data["full_name"] if profile.data else "Unknown"

        # Count applications
        apps = db.table("applications").select("id").eq("candidate_id", candidate_id).execute()
        app_count = len(apps.data) if apps.data else 0

        # Avg compatibility score
        compat = db.table("job_compatibility").select("score").eq("candidate_id", candidate_id).execute()
        scores = [c["score"] for c in compat.data if c["score"] is not None] if compat.data else []
        avg_compat = sum(scores) / len(scores) if scores else 0

        # Fetch Interview Scores
        int_res = db.table("interview_results").select("overall_score").eq("candidate_id", candidate_id).order("created_at", desc=True).limit(1).execute()
        latest_int_score = int_res.data[0]["overall_score"] if int_res.data else 0

        # Fetch Video Interview Scores
        vid_res = db.table("video_interviews").select("scores_json, proctoring_metadata").eq("candidate_id", candidate_id).order("created_at", desc=True).limit(1).execute()
        vid_data = vid_res.data[0] if vid_res.data else {}
        vid_scores = vid_data.get("scores_json", {})
        proctoring = vid_data.get("proctoring_metadata", {})
        
        video_tech = vid_scores.get("technical_depth", 0)
        video_comm = vid_scores.get("communication_score", 0)

        # Run placement chain
        placement = await score_placement(
            tier=r["tier"],
            skill_scores=r.get("skill_scores", {}),
            application_count=app_count,
            avg_compatibility=avg_compat,
            interview_score=latest_int_score,
            video_tech=video_tech,
            video_comm=video_comm
        )

        candidates.append({
            "id": candidate_id,
            "name": name,
            "tier": r["tier"],
            "overall_score": r["overall_score"],
            "interview_score": latest_int_score,
            "video_tech": video_tech,
            "video_comm": video_comm,
            "proctoring": proctoring, # Include proctoring data
            "placement_probability": placement["placement_probability"],
            "segment": placement["segment"],
            "intervention": placement["intervention"],
            "application_count": app_count,
            "avg_compatibility": round(avg_compat, 1)
        })

    # Sort by placement probability ascending (most at-risk first)
    candidates.sort(key=lambda x: x["placement_probability"])

    return {"candidates": candidates}


@router.post("/intervene")
async def intervene(payload: IntervenePayload, user_id: str = Depends(get_user_id)):
    import resend
    import os

    db = get_supabase()

    try:
        auth_user = db.auth.admin.get_user_by_id(payload.candidate_id)
        email_addr = auth_user.user.email if auth_user.user else None

        if not email_addr:
            raise HTTPException(status_code=404, detail="Candidate email not found")

        resend.api_key = os.environ.get("RESEND_API_KEY", "")
        resend.Emails.send({
            "from": "Chosen Placement Team <noreply@chosen.app>",
            "to": email_addr,
            "subject": "Your placement coordinator has a message for you",
            "html": f"""
            <h2>Message from your Placement Coordinator</h2>
            <p>{payload.message}</p>
            <br><p>— The Chosen Placement Team</p>
            """
        })

        # Log the nudge
        db.table("nudge_log").insert({
            "candidate_id": payload.candidate_id,
            "trigger_reason": f"Admin intervention: {payload.message[:100]}"
        }).execute()

        return {"email_sent": True}

    except Exception as e:
        print(f"Intervention email failed: {e}")
        return {"email_sent": False, "error": str(e)}
