import os
import sys
import asyncio

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from contextlib import asynccontextmanager
# AI Job Portal Backend - v4.0.6 Force Reload
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from routers import readiness, jobs, actions, admin, roadmap, interview, video_interview

load_dotenv()

scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start nudge agent scheduler on startup
    from agents.nudge_agent import run_nudge_agent
    scheduler.add_job(
        run_nudge_agent,
        trigger=IntervalTrigger(hours=24),
        id="nudge_agent",
        replace_existing=True
    )
    scheduler.start()
    print("[Scheduler] Nudge agent scheduled every 24 hours.")
    yield
    scheduler.shutdown()

app = FastAPI(title="Chosen AI Backend", version="1.0.0", lifespan=lifespan)

frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")
origins = [
    frontend_url,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for development to prevent CORS headaches
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(readiness.router)
app.include_router(jobs.router)
app.include_router(actions.router)
app.include_router(admin.router)
app.include_router(roadmap.router)
app.include_router(interview.router)
app.include_router(video_interview.router)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/nudge/trigger")
async def trigger_nudge_manually():
    """Dev endpoint — manually trigger nudge agent for testing."""
    from agents.nudge_agent import run_nudge_agent
    await run_nudge_agent()
    return {"status": "nudge agent ran"}
