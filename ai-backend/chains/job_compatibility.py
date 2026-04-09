from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from services.llm import get_llm_with_fallback

_prompt = ChatPromptTemplate.from_template("""
You are a senior technical recruiter. Score how well this candidate fits this job.

CANDIDATE:
Skills: {skills}
Readiness scores: {skill_scores}
Resume summary: {resume_text}

JOB:
Title: {job_title}
Description: {job_description}
Requirements: {requirements}

Return ONLY valid JSON, no markdown:
{{"score": <integer 0-100>, "reasoning": "<max 2 sentences>"}}
""")

async def score_compatibility(
    skills: list,
    skill_scores: dict,
    resume_text: str,
    job_title: str,
    job_description: str,
    requirements: str = ""
) -> dict:
    llm = get_llm_with_fallback(temperature=0)
    chain = _prompt | llm | JsonOutputParser()

    try:
        return await chain.ainvoke({
            "skills": ", ".join(skills),
            "skill_scores": str(skill_scores),
            "resume_text": resume_text[:1000],  # truncate to avoid token overflow
            "job_title": job_title,
            "job_description": job_description[:1500],
            "requirements": requirements[:500]
        })
    except Exception:
        return {"score": 50, "reasoning": "Compatibility scoring unavailable (rate limit). Score estimated."}
