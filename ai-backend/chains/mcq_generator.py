import asyncio
import json
import re
from services.llm import generate_with_gemini_native
from chains.question_bank import get_fallback_questions

ALLOWED_SKILLS = [
    "React", "Vue.js", "Angular", "TypeScript", "JavaScript",
    "Node.js", "Python", "FastAPI", "Django", "Flask",
    "SQL", "PostgreSQL", "MongoDB", "Redis",
    "DSA", "System Design", "Machine Learning", "Docker", "AWS"
]

MCQ_PROMPT = """Generate exactly 5 multiple choice questions to assess a candidate's practical knowledge of {skill}.

Rules:
- Each question must have exactly 4 options
- Mix difficulty: 2 easy, 2 medium, 1 hard
- correct_index is 0-based (0=first option, 1=second, etc.)

Return ONLY this JSON, no markdown, no explanation:
{{
  "skill": "{skill}",
  "questions": [
    {{
      "question": "question text",
      "options": ["option A", "option B", "option C", "option D"],
      "correct_index": 0
    }}
  ]
}}"""


async def generate_mcq(skill: str) -> dict:
    """
    Generate MCQ questions using native Gemini SDK.
    Retries up to 3x on transient rate limits (per-minute).
    Falls back to question bank on daily quota exhaustion or persistent failure.
    """
    if skill not in ALLOWED_SKILLS:
        raise ValueError(f"Skill '{skill}' not in allowed list.")

    prompt = MCQ_PROMPT.format(skill=skill)

    for attempt in range(3):
        try:
            raw = await asyncio.wait_for(
                generate_with_gemini_native(prompt),
                timeout=15.0
            )
            raw = raw.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            result = json.loads(raw.strip())
            print(f"[MCQ] Generated via Gemini 3 for {skill} (attempt {attempt + 1})")
            return result

        except Exception as e:
            error_str = str(e)

            # Daily quota exhausted — no point retrying, go straight to fallback
            if "per_day" in error_str.lower() or "GenerateRequestsPerDay" in error_str:
                print(f"[MCQ] Daily quota exhausted for {skill}, using question bank")
                break

            # Per-minute rate limit — extract retry delay and wait
            match = re.search(r'retry in (\d+\.?\d*)s', error_str.lower())
            if match and attempt < 2:
                wait = float(match.group(1)) + 2  # add 2s buffer
                print(f"[MCQ] Per-minute limit hit for {skill}, retrying in {wait}s...")
                await asyncio.sleep(wait)
                continue

            # Other error on last attempt
            print(f"[MCQ] Gemini failed for {skill} ({type(e).__name__}), using question bank")
            break

    return {"skill": skill, "questions": get_fallback_questions(skill)}
