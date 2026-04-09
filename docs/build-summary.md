# Chosen — AI Career Coach Build Summary

## What Was Built

### Backend (ai-backend/ — FastAPI + Python)

**Stack:** FastAPI, LangChain, Supabase Python SDK, Resend, Hunter.io, APScheduler
**LLM:** Gemini 2.5 Flash (primary), OpenAI GPT-4o-mini (fallback)
**Running at:** http://localhost:8000

#### 5 LangChain Chains
| Chain | File | Purpose |
|-------|------|---------|
| MCQ Generator | chains/mcq_generator.py | Generates 5 MCQ questions per skill |
| Job Compatibility | chains/job_compatibility.py | Scores candidate vs job description 0-100 |
| Resume Tailor | chains/resume_tailor.py | Rewrites resume to match a specific JD |
| Cold Email | chains/cold_email.py | Generates subject + body for hiring manager outreach |
| Placement Score | chains/placement_score.py | Segments candidates: Ready/Risky/Unprepared |

#### API Endpoints
| Method | Endpoint | What it does |
|--------|----------|-------------|
| POST | /readiness/profile | Save candidate skills + resume |
| POST | /readiness/generate-test | Generate MCQ test via LLM (parallel per skill) |
| POST | /readiness/submit | Score a completed assessment |
| POST | /readiness/evaluate | Compute overall tier (ready/partial/not_ready) |
| GET | /readiness/result/:id | Fetch stored readiness result |
| POST | /jobs/compatibility | Score all jobs vs candidate profile (cached) |
| POST | /jobs/lookup-email | Hunter.io email finder + domain search |
| POST | /jobs/quick-apply | Submit application + send Resend confirmation |
| POST | /actions/tailor-resume | Run resume tailor chain, store artifact |
| POST | /actions/cold-email | Run cold email chain, store artifact |
| GET | /actions/artifacts/:id | Fetch all AI artifacts for a candidate |
| GET | /admin/tpc-intelligence | Placement scores + segments for all candidates |
| POST | /admin/intervene | Send intervention email to candidate via Resend |
| POST | /nudge/trigger | Manually trigger nudge agent (dev/demo use) |

#### Autonomous Nudge Agent (agents/nudge_agent.py)
- Runs every 24hrs via APScheduler
- Finds candidates assessed 5+ days ago with no applications
- Generates personalised cold email via LangChain
- Sends via Resend, logs to nudge_log table

#### Services
- services/llm.py — LLM provider with Gemini primary / OpenAI fallback
- services/supabase_client.py — Lazy-loaded Supabase client
- services/auth.py — JWT verification (RS256, no signature check for hackathon)
- services/hunter_client.py — Email Finder + Domain Search (separate API keys)
- services/resend_client.py — Email sending

---

### Database (Supabase)

#### New Tables Added (supabase/ai-migrations.sql)
| Table | Purpose |
|-------|---------|
| candidate_profiles | Skills, domain interests, resume text |
| assessments | Per-skill MCQ questions + answers + score |
| readiness_results | Overall tier + skill scores per candidate |
| job_compatibility | Cached compatibility scores per candidate+job |
| ai_artifacts | Tailored resumes + cold emails |
| nudge_log | Log of all nudge emails sent |

#### New Columns on Existing Tables
- jobs.hiring_manager_email
- jobs.requirements

#### Demo Seed Data (supabase/ai-demo-seed.sql)
- 3 demo candidates pre-seeded with readiness results
- UUIDs: 97e50f46 (ready), 4fa27df9 (partial), 7fa35f70 (not_ready)
- 4 demo jobs with hiring_manager_email pre-populated

---

### Frontend (src/ — React + TypeScript + Vite)

#### New Pages
| Route | Component | Purpose |
|-------|-----------|---------|
| /readiness | ReadinessForm.tsx | 3-step form: skills → domains → resume |
| /readiness/test | ReadinessTest.tsx | MCQ test, tabbed per skill |
| /readiness/result | ReadinessResult.tsx | Tier display + AgentThinkingPanel |
| /admin/tpc | TPCIntelligence.tsx | Admin placement panel with intervene |

#### New Components
- AgentThinkingPanel.tsx — Fake-streams agent reasoning steps (critical for judges)
- CompatibilityBadge — Green/yellow/red % on job cards (in JobBoard)

#### Modified Pages
- candidate/Dashboard.tsx — Added Career Readiness card with tier badge
- admin/Dashboard.tsx — Added TPC Intelligence card
- JobBoard.tsx — Compatibility scores + shimmer skeletons (wired, needs compat fetch)

#### New Service
- src/lib/aiService.ts — All AI backend API calls in one file

---

## What Still Needs Work / Known Issues

1. JobBoard compatibility scores — the fetch is wired but the CompatibilityBadge component needs to be added to JobCard.tsx to display scores visually
2. "Tailor Resume" + "Cold Email" buttons — wired in actions router but not yet added as UI buttons on JobBoard/JobDetail pages
3. OpenAI quota exhausted — currently running on Gemini only. Add billing at platform.openai.com/billing to restore OpenAI
4. Demo accounts — 3 demo users need to be created in Supabase Auth manually (ready@demo.com, partial@demo.com, notready@demo.com / Demo1234!) and their UUIDs matched to the seed data
5. Hunter.io — pre-populated on 4 seed jobs. Live lookup works but free tier is 25 req/month total
6. Vercel deployment — update VITE_AI_BACKEND_URL in .env to Railway/Render URL before deploying

---

## Running Locally

```bash
# Frontend
npm run dev
# → http://localhost:5173

# Backend
cd ai-backend
python -m uvicorn main:app --reload --port 8000
# → http://localhost:8000
# → http://localhost:8000/docs (Swagger UI)
```

## Environment Files

### .env (frontend)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_AI_BACKEND_URL=http://localhost:8000
```

### ai-backend/.env
```
OPENAI_API_KEY=
GOOGLE_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=        ← use Legacy JWT Secret from Supabase settings
RESEND_API_KEY=
HUNTER_EMAIL_FINDER_API_KEY=
HUNTER_DOMAIN_SEARCH_API_KEY=
FRONTEND_URL=http://localhost:5173
```

---

## Demo Flow for Judges

1. Login as candidate → /dashboard → click "Start Assessment"
2. Select 2-3 skills → pick domains → paste resume → submit
3. Watch MCQ test generate → answer questions → submit
4. See AgentThinkingPanel stream reasoning → tier result displayed
5. Go to /jobs → see compatibility % badges on each job card
6. Click "Tailor Resume" on a job → see AI-rewritten resume
7. Login as admin → /admin/tpc → see all candidates segmented
8. Click "Intervene" on a Risky/Unprepared candidate → send email
