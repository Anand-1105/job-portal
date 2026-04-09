from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from services.auth import get_user_id
from services.supabase_client import get_supabase
from services.llm import get_llm
import os
import shutil
import uuid
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

router = APIRouter(prefix="/video-interview", tags=["video-interview"])

UPLOAD_DIR = "uploads/interviews"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_video(
    candidate_id: str = Form(...),
    video: UploadFile = File(...),
    user_id: str = Depends(get_user_id)
):
    if user_id != candidate_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    file_id = str(uuid.uuid4())
    ext = video.filename.split(".")[-1]
    filename = f"{candidate_id}_{file_id}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(video.file, buffer)

    return {
        "status": "success",
        "video_url": filepath,
        "video_id": file_id
    }

@router.post("/evaluate")
async def evaluate_video(
    candidate_id: str,
    video_path: str,
    job_title: str,
    proctoring_stats: str | None = None, # Expecting JSON string
    user_id: str = Depends(get_user_id)
):
    if user_id != candidate_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    import logging
    logger = logging.getLogger("video-interview")
    
    # Normalize path for the OS
    clean_path = os.path.normpath(video_path)
    logger.info(f"Starting evaluation for {candidate_id}. Video path: {clean_path}")

    # 1. Transcribe with Groq Whisper (to avoid OpenAI quota issues)
    try:
        from groq import Groq as GroqClient
        groq_api_key = os.environ.get("GROQ_API_KEY")
        if not groq_api_key:
            raise Exception("GROQ_API_KEY not found in environment")
            
        g_client = GroqClient(api_key=groq_api_key)
        
        if not os.path.exists(clean_path):
            logger.error(f"File not found: {clean_path}")
            raise HTTPException(status_code=404, detail="Video file not found on server.")

        logger.info("Starting Groq Whisper transcription...")
        with open(clean_path, "rb") as audio_file:
            transcript = g_client.audio.transcriptions.create(
                model="whisper-large-v3", 
                file=audio_file
            )
        text = transcript.text
        logger.info("Transcription successful.")

        # 2. Evaluate with LLM
        logger.info("Starting LLM evaluation...")
        llm = get_llm(temperature=0.3)
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert technical interviewer. 
            Evaluate the following interview transcript for the specified job role.
            
            Provide a feedback report including:
            1. Communication Score (1-10)
            2. Technical Depth (1-10)
            3. Sentiment/Confidence analysis
            4. feedback_summary: A 2-3 sentence summary of actual strengths/weaknesses.
            
            Return JSON only."""),
            ("human", "Job Role: {job_title}\n\nTranscript Content:\n{transcript}"),
            ("human", "Provide the evaluation JSON now.")
        ])

        chain = prompt | llm | JsonOutputParser()
        evaluation = await chain.ainvoke({"job_title": job_title, "transcript": text})
        logger.info("LLM evaluation successful.")

        # Parse proctoring stats
        p_metadata = {}
        if proctoring_stats:
            try:
                import json
                p_metadata = json.loads(proctoring_stats)
            except: pass

        # 3. Save to Supabase (with resilience)
        logger.info("Saving to database...")
        db = get_supabase()
        save_data = {
            "candidate_id": candidate_id,
            "video_url": clean_path,
            "transcript": text,
            "scores_json": evaluation
        }
        
        try:
            # Try with proctoring metadata first
            db.table("video_interviews").insert({
                **save_data,
                "proctoring_metadata": p_metadata
            }).execute()
        except:
            # Fallback if column missing
            logger.warning("Failed to save proctoring_metadata, retrying basic save.")
            db.table("video_interviews").insert(save_data).execute()
            
        logger.info("Database save successful.")

        return {
            "status": "success",
            "transcript": text,
            "evaluation": evaluation
        }
    except Exception as e:
        logger.exception(f"Detailed Evaluation Error for {candidate_id}:")
        raise HTTPException(status_code=500, detail=f"AI Evaluation Failed: {str(e)}")
