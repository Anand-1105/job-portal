"""
Roadmap Agent — agentic career coach with LangChain memory.
Maintains per-session conversation and has tools to read candidate profile.
"""
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
from services.llm import get_llm
import json

# In-memory session store: session_id -> list of messages
_sessions: dict = {}


SYSTEM_PROMPT = """You are an expert AI Career Coach named "Aria" for Chosen, a career platform.

Your goal is to have a warm, engaging conversation to understand the candidate's career ambitions 
and then build them a PERSONALIZED ROADMAP.

You have access to the candidate's profile:
{profile_context}

Conversation guidelines:
1. First, warmly greet and ask what role/field they want to break into or grow in.
2. Ask follow-up questions: their current skills, timeline, how many hours/week they can dedicate.
3. After 2-3 exchanges, generate a structured roadmap with:
   - Weekly milestones (e.g., "Week 1-2: Master React Hooks")
   - Free/paid resource recommendations (with links where possible)
   - Realistic salary expectations
4. Be encouraging but honest about timelines.
5. When you produce the final roadmap, format it with clear sections using markdown.
6. End with: "Type 'finalize' to save this roadmap to your profile."

Keep responses concise and conversational (2-4 sentences max) until producing the full roadmap.
"""


async def chat(
    session_id: str,
    user_message: str,
    candidate_id: str,
    candidate_profile: dict
) -> dict:
    """
    Process one turn of conversation. Returns AI response + whether roadmap is ready.
    """
    llm = get_llm(temperature=0.7)

    if session_id not in _sessions:
        _sessions[session_id] = []

    history = _sessions[session_id]

    # Build profile context string
    skills = candidate_profile.get("skills", [])
    resume_snippet = (candidate_profile.get("resume_text") or "")[:800]
    scores = candidate_profile.get("skill_scores", {})
    profile_ctx = f"""
Name: {candidate_profile.get('full_name', 'Candidate')}
Current Skills: {', '.join(skills) if skills else 'Not specified'}
Skill Assessment Scores: {json.dumps(scores) if scores else 'Not taken yet'}
Resume Summary: {resume_snippet or 'No resume uploaded yet'}
"""

    # Build history for LangChain
    lang_history = []
    for msg in history:
        if msg["role"] == "user":
            lang_history.append(HumanMessage(content=msg["content"]))
        else:
            lang_history.append(AIMessage(content=msg["content"]))

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{user_message}")
    ])
    
    chain = prompt | llm | StrOutputParser()
    response = await chain.ainvoke({
        "profile_context": profile_ctx,
        "history": lang_history,
        "user_message": user_message
    })

    # Store in history
    history.append({"role": "user", "content": user_message})
    history.append({"role": "ai", "content": response})
    _sessions[session_id] = history

    # Detect if roadmap is complete (contains week-by-week structure)
    is_roadmap = (
        "week" in response.lower() and
        ("milestone" in response.lower() or "##" in response or "**week" in response.lower())
    )

    return {
        "message": response,
        "session_id": session_id,
        "history_length": len(history),
        "roadmap_ready": is_roadmap
    }


def get_history(session_id: str) -> list:
    return _sessions.get(session_id, [])
