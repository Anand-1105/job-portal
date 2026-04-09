from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from services.llm import get_llm_with_fallback

_prompt = ChatPromptTemplate.from_template("""
Write a concise cold outreach email from a job candidate to a hiring manager.

Candidate name: {candidate_name}
Top skills: {skills}
Job title: {job_title}
Company: {company}
Hiring manager: {hiring_manager_name}

Rules:
- Under 150 words
- No fluff, no "I hope this email finds you well"
- Lead with one specific value statement
- End with a clear single CTA (15-minute call or reply)

Return ONLY valid JSON, no markdown:
{{"subject": "...", "body": "..."}}
""")

async def generate_cold_email(
    candidate_name: str,
    skills: list,
    job_title: str,
    company: str,
    hiring_manager_name: str = "Hiring Manager"
) -> dict:
    llm = get_llm_with_fallback(temperature=0.4)
    chain = _prompt | llm | JsonOutputParser()

    try:
        return await chain.ainvoke({
            "candidate_name": candidate_name,
            "skills": ", ".join(skills[:5]),
            "job_title": job_title,
            "company": company,
            "hiring_manager_name": hiring_manager_name
        })
    except Exception:
        return {"subject": "Application for " + job_title, "body": "Email generation unavailable."}
