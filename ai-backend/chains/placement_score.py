from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from services.llm import get_llm_with_fallback

_prompt = ChatPromptTemplate.from_template("""
You are a placement coordinator. Estimate this candidate's job placement probability based on their technical readiness and human performance metrics.

Readiness tier: {tier}
Skill scores (Readiness Test): {skill_scores}
Applications submitted: {application_count}
Average job compatibility score: {avg_compatibility}

Performance Metrics:
- Text Interview Score: {interview_score}/100
- Video Interview Technical Depth: {video_tech}/10
- Video Interview Communication: {video_comm}/10

Segments:
- Ready: high probability, minimal intervention needed
- Risky: medium probability, needs a nudge or guidance
- Unprepared: low probability, needs coaching before applying

Return ONLY valid JSON, no markdown:
{{
  "placement_probability": <integer 0-100>,
  "segment": "Ready|Risky|Unprepared",
  "intervention": "<one sentence recommendation for admin>"
}}
""")

async def score_placement(
    tier: str,
    skill_scores: dict,
    application_count: int,
    avg_compatibility: float,
    interview_score: int = 0,
    video_tech: int = 0,
    video_comm: int = 0
) -> dict:
    llm = get_llm_with_fallback(temperature=0)
    chain = _prompt | llm | JsonOutputParser()

    try:
        return await chain.ainvoke({
            "tier": tier,
            "skill_scores": str(skill_scores),
            "application_count": application_count,
            "avg_compatibility": round(avg_compatibility, 1),
            "interview_score": interview_score,
            "video_tech": video_tech,
            "video_comm": video_comm
        })
    except Exception:
        return {
            "placement_probability": 0,
            "segment": "Unprepared",
            "intervention": "Unable to compute — check LLM connectivity."
        }
