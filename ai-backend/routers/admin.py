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

    # DIAGNOSTIC COUNTS
    raw_results = db.table("readiness_results").select("id").execute()
    raw_profiles = db.table("profiles").select("id").execute()
    
    # Fetch all readiness results
    results = db.table("readiness_results").select("*").execute()
    
    if not results.data:
        return {
            "version": "v4.0.6-sync-debug",
            "candidates": [],
            "debug_counts": {
                "readiness": len(raw_results.data),
                "profiles": len(raw_profiles.data)
            }
        }

    candidates = []
    debug_errors = []
    for r in results.data:
        try:
            candidate_id = r["candidate_id"]

            # Fetch profile name
            profile_res = db.table("profiles").select("*").eq("id", candidate_id).execute()
            name = profile_res.data[0]["full_name"] if (profile_res.data and len(profile_res.data) > 0) else "Unknown"

            # Count applications
            apps_res = db.table("applications").select("*").eq("candidate_id", candidate_id).execute()
            app_count = len(apps_res.data) if apps_res.data else 0

            # Avg compatibility score
            compat_res = db.table("job_compatibility").select("*").eq("candidate_id", candidate_id).execute()
            compat_scores = [c.get("score", 0) for c in compat_res.data if c.get("score") is not None] if (compat_res.data) else []
            avg_compat = sum(compat_scores) / len(compat_scores) if compat_scores else 0

            # Historical technical scores from assessments
            assessments_res = db.table("assessments").select("*").eq("candidate_id", candidate_id).eq("status", "completed").execute()
            tech_scores = [a.get("score", 0) for a in assessments_res.data if a.get("score") is not None] if (assessments_res.data) else []
            latest_int_score = round(sum(tech_scores) / len(tech_scores)) if tech_scores else r.get("overall_score", 0)

            # Fetch Video Interview Scores
            vid_res = db.table("video_interviews").select("*").eq("candidate_id", candidate_id).order("created_at", desc=True).limit(1).execute()
            vid_data = vid_res.data[0] if (vid_res.data and len(vid_res.data) > 0) else {}
            vid_scores = vid_data.get("scores_json", {}) or {}
            proctoring = vid_data.get("proctoring_metadata", {}) or vid_data.get("proctoring", {}) or {}
            
            video_tech = vid_scores.get("technical_depth", 0)
            video_comm = vid_scores.get("communication_score", 0)

            # Run placement chain
            try:
                placement = await score_placement(
                    tier=r["tier"],
                    skill_scores=r.get("skill_scores", {}),
                    application_count=app_count,
                    avg_compatibility=avg_compat,
                    interview_score=latest_int_score,
                    video_tech=video_tech,
                    video_comm=video_comm
                )
            except Exception as ae:
                debug_errors.append(f"AI Error for {candidate_id}: {ae}")
                placement = {"placement_probability": 0, "segment": "Unprepared", "intervention": "AI calculation failed."}

            candidates.append({
                "id": candidate_id,
                "name": name,
                "tier": r["tier"],
                "overall_score": r.get("overall_score", 0),
                "interview_score": latest_int_score,
                "video_tech": video_tech,
                "video_comm": video_comm,
                "proctoring": proctoring,
                "placement_probability": placement["placement_probability"],
                "segment": placement["segment"],
                "intervention": placement["intervention"],
                "application_count": app_count,
                "avg_compatibility": round(avg_compat, 1)
            })
        except Exception as e:
            debug_errors.append(f"Critical loop error for {r.get('candidate_id')}: {str(e)}")
            continue

    # Sort by placement probability ascending (most at-risk first)
    candidates.sort(key=lambda x: x["placement_probability"])

    return {
        "version": "v4.0.8-total-visibility", 
        "candidates": candidates,
        "debug_errors": debug_errors,
        "results_count": len(results.data),
        "raw_ids": [r.get("candidate_id") for r in results.data]
    }


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
            "to": "anand01ts@gmail.com",
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
