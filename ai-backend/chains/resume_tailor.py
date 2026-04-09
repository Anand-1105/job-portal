from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from services.llm import get_llm_with_fallback

_prompt = ChatPromptTemplate.from_template("""
Rewrite the following resume to maximize ATS match for the job description below.
Keep all facts true — do not invent experience. Reorder sections, reword bullets, add relevant keywords naturally.

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}

Return only the rewritten resume text. No commentary, no markdown headers.
""")

async def tailor_resume(resume_text: str, job_description: str) -> str:
    llm = get_llm_with_fallback(temperature=0.2)
    chain = _prompt | llm | StrOutputParser()

    return await chain.ainvoke({
        "resume_text": resume_text[:3000],
        "job_description": job_description[:2000]
    })
