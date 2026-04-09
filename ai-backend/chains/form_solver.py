from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from services.llm import get_llm
import os

class FormAnswer(BaseModel):
    answer: str = Field(description="The final answer to the question (Yes/No, a number, or a short string)")
    reasoning: str = Field(description="Brief explanation of why this answer was chosen from the resume")
    confidence: float = Field(description="Confidence score from 0 to 1")

async def solve_form_question(question: str, resume_text: str, candidate_name: str) -> dict:
    llm = get_llm(temperature=0)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an agentic job application solver. 
Your goal is to answer questions on a LinkedIn application form accurately based on the candidate's resume.

Candidate Name: {name}
Resume Content: {resume}

Rules:
1. If the question asks for years of experience and it's not explicitly stated, estimate based on dates.
2. If it's a Yes/No question and the resume supports it, answer Yes.
3. If the resume clearly doesn't support a requirement (e.g. asking for a specific degree not listed), be honest.
4. If you are truly unsure (confidence < 0.3), state that in your reasoning.

Return JSON only."""),
        ("user", "Question: {question}")
    ])
    
    chain = prompt | llm | JsonOutputParser()
    
    try:
        result = await chain.ainvoke({
            "question": question,
            "resume": resume_text[:5000], # Trucate for safety
            "name": candidate_name
        })
        return result
    except Exception as e:
        return {
            "answer": "Error",
            "reasoning": str(e),
            "confidence": 0
        }
