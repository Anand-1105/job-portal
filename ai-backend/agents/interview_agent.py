"""
Interview Agent — AI interviewer that conducts role-specific interviews,
scores answers, and generates a detailed feedback report.
"""
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from services.llm import get_llm
import os
import json


_sessions: dict = {}


async def generate_questions(job_title: str, job_description: str, resume_text: str, count: int = 7) -> list:
    """Generate a tailored set of interview questions for a role."""
    llm = get_llm(temperature=0.5)
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert technical recruiter conducting an interview.
Generate exactly {count} interview questions for the role specified below.

Candidate resume context will be provided.
Job description context will be provided.

Return ONLY a JSON array of objects: [{{"question": "...", "type": "behavioral|technical|situational|motivation", "expected_keywords": ["keyword1", "keyword2"]}}]
Return ONLY the JSON array, no other text."""),
        ("human", "Role: {job_title}\n\nResume Context: {resume}\n\nJob Description Context: {jd}"),
        ("human", "Generate the {count} questions now.")
    ])
    chain = prompt | llm | JsonOutputParser()
    try:
        questions = await chain.ainvoke({
            "count": count,
            "job_title": job_title,
            "resume": resume_text[:2000] or "Not provided",
            "jd": job_description[:2000] or "Not provided"
        })
        return questions if isinstance(questions, list) else []
    except Exception as e:
        print(f"Error generating questions: {e}")
        return []


async def score_answer(question: str, answer: str, job_title: str, expected_keywords: list) -> dict:
    """Score a single interview answer."""
    llm = get_llm(temperature=0)
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are scoring an interview answer for a {job_title} position."),
        ("human", "Question: {question}\nCandidate Answer: {answer}\nExpected Keywords/Concepts: {keywords}"),
        ("human", """Score this answer on:
- clarity (0-10)
- relevance (0-10)
- depth (0-10)

Return JSON ONLY: {{"clarity": N, "relevance": N, "depth": N, "feedback": "feedback string"}}""")
    ])
    chain = prompt | llm | JsonOutputParser()
    result = await chain.ainvoke({
        "job_title": job_title,
        "question": question,
        "answer": answer,
        "keywords": ", ".join(expected_keywords)
    })
    result["overall"] = round((result.get("clarity", 0) + result.get("relevance", 0) + result.get("depth", 0)) / 3, 1)
    return result


async def generate_report(job_title: str, qa_pairs: list, scores: list) -> str:
    """Generate the final interview feedback report."""
    llm = get_llm(temperature=0.3)

    summary_data = "\n".join([
        f"Q: {qa['question']}\nA: {qa['answer']}\nScore: {s.get('overall', 0)}/10 — {s.get('feedback', '')}"
        for qa, s in zip(qa_pairs, scores)
    ])

    avg_score = round(sum(s.get("overall", 0) for s in scores) / len(scores), 1) if scores else 0

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are writing a detailed interview feedback report for a {job_title} candidate.
Average score: {avg}/10

Q&A with scores:
{data}

Write a structured markdown report with:
## Overall Performance: X/10
## Strengths (bullet points)
## Areas to Improve (bullet points)
## Hiring Recommendation: [Strong Hire / Hire / Maybe / No Hire]
## Personalized Study Recommendations (3-5 specific resources/topics)

Be specific and constructive. Reference actual answers given."""),
        ("human", "Generate the report.")
    ])
    chain = prompt | llm | StrOutputParser()
    return await chain.ainvoke({"job_title": job_title, "avg": avg_score, "data": summary_data})


def create_session(session_id: str, questions: list, job_title: str):
    _sessions[session_id] = {
        "questions": questions,
        "answers": [],
        "scores": [],
        "current_q": 0,
        "job_title": job_title,
        "status": "active"
    }


def get_session(session_id: str):
    return _sessions.get(session_id)


def update_session(session_id: str, answer: str, score: dict):
    s = _sessions[session_id]
    s["answers"].append(answer)
    s["scores"].append(score)
    s["current_q"] += 1
    if s["current_q"] >= len(s["questions"]):
        s["status"] = "completed"
