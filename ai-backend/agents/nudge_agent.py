import os
import resend
from datetime import datetime, timezone, timedelta
from services.supabase_client import get_supabase
from chains.cold_email import generate_cold_email

async def run_nudge_agent():
    """
    Checks for candidates who:
    1. Completed assessment 5+ days ago
    2. Have NOT submitted any application since assessment
    3. Have NOT been nudged in the last 5 days
    Sends a personalized cold email nudge via Resend.
    """
    db = get_supabase()
    resend.api_key = os.environ.get("RESEND_API_KEY", "")

    cutoff = datetime.now(timezone.utc) - timedelta(days=5)

    # Fetch candidates assessed 5+ days ago
    results = db.table("readiness_results") \
        .select("candidate_id, tier, skill_scores, assessed_at") \
        .lt("assessed_at", cutoff.isoformat()) \
        .execute()

    if not results.data:
        print("[NudgeAgent] No candidates past 5-day threshold.")
        return

    nudged = 0
    for r in results.data:
        candidate_id = r["candidate_id"]

        # Skip if already nudged in last 5 days
        recent_nudge = db.table("nudge_log") \
            .select("id") \
            .eq("candidate_id", candidate_id) \
            .gt("sent_at", cutoff.isoformat()) \
            .execute()

        if recent_nudge.data:
            continue

        # Skip if they already applied after assessment
        apps = db.table("applications") \
            .select("id") \
            .eq("candidate_id", candidate_id) \
            .gt("applied_at", r["assessed_at"]) \
            .execute()

        if apps.data:
            continue

        # Get candidate profile + best matched job
        profile = db.table("profiles").select("full_name").eq("id", candidate_id).single().execute()
        cp = db.table("candidate_profiles").select("skills").eq("candidate_id", candidate_id).single().execute()

        # Find top compatible job
        top_compat = db.table("job_compatibility") \
            .select("job_id, score") \
            .eq("candidate_id", candidate_id) \
            .order("score", desc=True) \
            .limit(1) \
            .execute()

        job_title = "a role matching your skills"
        company = "a top company"

        if top_compat.data:
            job = db.table("jobs").select("title").eq("id", top_compat.data[0]["job_id"]).single().execute()
            if job.data:
                job_title = job.data["title"]

        # Generate nudge email
        email_content = await generate_cold_email(
            candidate_name=profile.data["full_name"] if profile.data else "there",
            skills=cp.data.get("skills", []) if cp.data else [],
            job_title=job_title,
            company=company
        )

        # Get candidate email from auth
        try:
            auth_user = db.auth.admin.get_user_by_id(candidate_id)
            email_addr = auth_user.user.email if auth_user.user else None
        except Exception:
            email_addr = None

        if not email_addr or not resend.api_key:
            continue

        # Send nudge
        try:
            resend.Emails.send({
                "from": "Chosen Career Coach <noreply@chosen.app>",
                "to": email_addr,
                "subject": email_content.get("subject", "Your next opportunity is waiting"),
                "html": f"""
                <h2>Don't let your momentum stop here</h2>
                <p>{email_content.get('body', '').replace(chr(10), '<br>')}</p>
                <br>
                <p><a href="https://chosen.app/jobs">Browse matched jobs →</a></p>
                <br><p>— Your Chosen Career Coach</p>
                """
            })

            # Log nudge
            db.table("nudge_log").insert({
                "candidate_id": candidate_id,
                "trigger_reason": f"No application 5 days post-assessment. Tier: {r['tier']}"
            }).execute()

            nudged += 1
            print(f"[NudgeAgent] Nudged {candidate_id} ({r['tier']})")

        except Exception as e:
            print(f"[NudgeAgent] Failed to nudge {candidate_id}: {e}")

    print(f"[NudgeAgent] Done. {nudged} candidates nudged.")
