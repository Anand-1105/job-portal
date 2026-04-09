import os
from dotenv import load_dotenv

load_dotenv()

GROQ_MODEL = "llama-3.3-70b-versatile"
GEMINI_MODEL = "gemini-3-flash-preview"
OPENAI_MODEL = "gpt-4o-mini"


def get_llm(temperature: float = 0.3):
    """Primary LLM getter with automatic fallback chain for reliability."""
    return get_llm_with_fallback(temperature)


def get_llm_with_fallback(temperature: float = 0.3):
    groq_key = os.environ.get("GROQ_API_KEY", "").strip()
    gemini_key = os.environ.get("GOOGLE_API_KEY", "").strip()
    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()

    llms = []

    if groq_key:
        from langchain_openai import ChatOpenAI
        llms.append(ChatOpenAI(
            model=GROQ_MODEL,
            temperature=temperature,
            api_key=groq_key,
            base_url="https://api.groq.com/openai/v1"
        ))

    if gemini_key:
        from langchain_google_genai import ChatGoogleGenerativeAI
        llms.append(ChatGoogleGenerativeAI(model=GEMINI_MODEL, temperature=temperature, google_api_key=gemini_key))

    if openai_key:
        from langchain_openai import ChatOpenAI
        llms.append(ChatOpenAI(model=OPENAI_MODEL, temperature=temperature, api_key=openai_key))

    if not llms:
        raise RuntimeError("No LLM API key found.")
    if len(llms) == 1:
        return llms[0]
    return llms[0].with_fallbacks(llms[1:])


async def generate_with_gemini_native(prompt: str) -> str:
    """Native Gemini call — used by MCQ generator. Falls back gracefully."""
    import asyncio
    from google import genai
    from services.rate_limiter import gemini_limiter

    gemini_key = os.environ.get("GOOGLE_API_KEY", "").strip()
    groq_key = os.environ.get("GROQ_API_KEY", "").strip()

    # Prefer Groq via LangChain for MCQ since it's more reliable
    if groq_key:
        from langchain_openai import ChatOpenAI
        llm = ChatOpenAI(model=GROQ_MODEL, temperature=0.3, api_key=groq_key, base_url="https://api.groq.com/openai/v1")
        result = await llm.ainvoke(prompt)
        return result.content

    if not gemini_key:
        raise RuntimeError("No API key available")

    await gemini_limiter.acquire()
    client = genai.Client(api_key=gemini_key)
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
    )
    return response.text
