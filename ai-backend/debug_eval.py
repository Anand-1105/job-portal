import os
import logging
from dotenv import load_dotenv
from openai import OpenAI
from services.llm import get_llm
from services.supabase_client import get_supabase
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

load_dotenv()

def test_evaluation():
    candidate_id = "97e50f46-55fa-4134-ae6c-865d81a5e176"
    video_path = "uploads/interviews/97e50f46-55fa-4134-ae6c-865d81a5e176_89f45dd0-bf64-4430-98fb-70f27a162e8c.webm"
    job_title = "Full Stack Developer"
    
    clean_path = os.path.normpath(video_path)
    
    # 1. Transcribe with Groq Whisper
    try:
        from groq import Groq as GroqClient
        groq_api_key = os.environ.get("GROQ_API_KEY")
        g_client = GroqClient(api_key=groq_api_key)
        
        print("1. Transcription with Groq...")
        with open(clean_path, "rb") as audio_file:
            transcript = g_client.audio.transcriptions.create(
                model="whisper-large-v3", 
                file=audio_file
            )
        text = transcript.text
        print(f"Transcript length: {len(text)}")
        print(f"Transcript snippet: {text[:100]}...")

        print("2. LLM Evaluation...")
        llm = get_llm(temperature=0.3)
        prompt = ChatPromptTemplate.from_messages([
            ("system", "Evaluate the transcript for {job_title}. Return JSON."),
            ("human", "{transcript}")
        ])
        chain = prompt | llm | JsonOutputParser()
        evaluation = chain.invoke({"job_title": job_title, "transcript": text})
        print("Evaluation complete")

        print("3. Database Save...")
        db = get_supabase()
        try:
            db.table("video_interviews").insert({
                "candidate_id": candidate_id,
                "video_url": clean_path,
                "transcript": text,
                "scores_json": evaluation,
                "proctoring_metadata": {"test": True}
            }).execute()
            print("Save with metadata successful")
        except Exception as e:
            print(f"Save with metadata FAILED: {e}")
            print("Retrying without metadata...")
            db.table("video_interviews").insert({
                "candidate_id": candidate_id,
                "video_url": clean_path,
                "transcript": text,
                "scores_json": evaluation
            }).execute()
            print("Save without metadata successful")

    except Exception as e:
        print(f"GENERAL ERROR: {e}")

if __name__ == "__main__":
    test_evaluation()
