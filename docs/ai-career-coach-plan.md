# Agentic AI Career Coach — Implementation Plan
# Chosen Job Portal | Hackathon Build (12–15hr sprint)

---

## LangChain: Python vs JS — Use Python

**Why:** LangChain's Python SDK is significantly more mature. LCEL (LangChain Expression Language), async chains, tool-calling agents, and structured output parsers are all more stable in Python. The JS SDK lags behind on agent tooling. Run a FastAPI backend alongside the existing Vite frontend — clean separation, easier to deploy on Railway/Render.

---

## Repo Structure

```
chosen/                          ← existing frontend repo
├── src/
│   ├── features/
│   │   ├── candidate/
│   │   │   ├── ReadinessForm.tsx        ← NEW
│   │   │   ├── ReadinessTest.tsx        ← NEW
│   │   │   ├── ReadinessResult.tsx      ← NEW
│   │   │   ├── AgentThinkingPanel.tsx   ← NEW (critical for judges)
│   │   │   ├── JobBoard.tsx             ← MODIFY (add compat score, tailor btn, skeletons)
│   │   │   └── Dashboard.tsx            ← MODIFY (add readiness card)
│   │   ├── admin/
│   │   │   ├── Dashboard.tsx            ← MODIFY (add AI panel link)
│   │   │   └── TPCIntelligence.tsx      ← NEW
│   └── lib/
│       └── aiService.ts                 ← NEW (all fetch calls to Python backend)
│
ai-backend/                      ← NEW Python service (separate folder or repo)
├── main.py                      ← FastAPI app entry
├── requirements.txt
├── chains/
│   ├── mcq_generator.py         ← Chain 1
│   ├── job_compatibility.py     ← Chain 2
│   ├── resume_tailor.py         ← Chain 3
│   ├── cold_email.py            ← Chain 4
│   └── placement_score.py       ← Chain 5
├── agents/
│   └── nudge_agent.py           ← Autonomous deadline nudge
├── routers/
│   ├── readiness.py
│   ├── jobs.py
│   ├── actions.py
│   └── admin.py
├── services/
│   ├── supabase_client.py
│   ├── resend_client.py
│   └── hunter_client.py
└── scheduler.py                 ← APScheduler for nudge cron
```

---

## Supabase Schema Changes

Run these migrations before writing any chain code.

```sql
-- 1. Candidate skill profile
CREATE TABLE candidate_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  skills text[] NOT NULL DEFAULT '{}',
  domain_interests text[] NOT NULL DEFAULT '{}',
  resume_text text,
  updated_at timestamptz DEFAULT now()
);

-- 2. Readiness assessments
CREATE TABLE assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  skill text NOT NULL,
  questions jsonb NOT NULL,         -- [{question, options:[4], correct_index}]
  answers jsonb,                    -- [{selected_index}] filled on submit
  score integer,                    -- 0-100
  status text CHECK (status IN ('pending', 'completed')),
  created_at timestamptz DEFAULT now()
);

-- 3. Overall readiness result
CREATE TABLE readiness_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  overall_score integer,
  tier text CHECK (tier IN ('ready', 'partial', 'not_ready')),
  skill_scores jsonb,               -- {skill: score}
  assessed_at timestamptz DEFAULT now()
);

-- 4. Job compatibility scores (cached per candidate+job)
CREATE TABLE job_compatibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  score integer,                    -- 0-100
  reasoning text,
  hiring_manager_email text,
  computed_at timestamptz DEFAULT now(),
  UNIQUE(candidate_id, job_id)
);

-- 5. AI-generated artifacts
CREATE TABLE ai_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  type text CHECK (type IN ('tailored_resume', 'cold_email')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 6. Nudge tracking
CREATE TABLE nudge_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  trigger_reason text,
  sent_at timestamptz DEFAULT now()
);

-- Add hiring_manager_email to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS hiring_manager_email text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS requirements text;

-- ============================================================
-- DEMO SEED DATA — run after migrations, after creating 3 test
-- accounts in Supabase Auth. Replace UUIDs during Hour 0-1.
-- Save these UUIDs somewhere NOW, not at Hour 14.
-- ============================================================
-- INSERT placeholder rows first so UPDATEs have a target
INSERT INTO readiness_results (candidate_id, overall_score, tier, skill_scores)
VALUES
  ('<your-ready-test-user-uuid>',    85, 'ready',     '{"React": 90, "Node.js": 80}'),
  ('<your-partial-test-user-uuid>',  55, 'partial',   '{"Python": 65, "DSA": 40}'),
  ('<your-notready-test-user-uuid>', 28, 'not_ready', '{"SQL": 35, "System Design": 20}')
ON CONFLICT (candidate_id) DO UPDATE SET
  overall_score = EXCLUDED.overall_score,
  tier          = EXCLUDED.tier,
  skill_scores  = EXCLUDED.skill_scores,
  assessed_at   = now();

-- RLS
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_compatibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own data only" ON candidate_profiles FOR ALL USING (auth.uid() = candidate_id);
CREATE POLICY "Own data only" ON assessments FOR ALL USING (auth.uid() = candidate_id);
CREATE POLICY "Own data only" ON readiness_results FOR ALL USING (auth.uid() = candidate_id);
CREATE POLICY "Own data only" ON job_compatibility FOR ALL USING (auth.uid() = candidate_id);
CREATE POLICY "Own data only" ON ai_artifacts FOR ALL USING (auth.uid() = candidate_id);
CREATE POLICY "Admin full access" ON readiness_results FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

---

## LangChain Chains — Build Order

### Chain 1: MCQ Generator (`chains/mcq_generator.py`)
**Input:** skill name, difficulty level  
**Output:** 5 MCQ questions with 4 options each + correct index

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel

class MCQQuestion(BaseModel):
    question: str
    options: list[str]      # exactly 4
    correct_index: int      # 0-3

class MCQSet(BaseModel):
    skill: str
    questions: list[MCQQuestion]  # exactly 5

prompt = ChatPromptTemplate.from_template("""
Generate exactly 5 multiple choice questions to assess a candidate's knowledge of {skill}.
Difficulty: {difficulty}. Each question must have exactly 4 options.
Return valid JSON matching the schema provided.
{format_instructions}
""")

parser = JsonOutputParser(pydantic_object=MCQSet)
chain = prompt | ChatOpenAI(model="gpt-4o-mini", temperature=0.3) | parser
```

---

### Chain 2: Job Compatibility Scorer (`chains/job_compatibility.py`)
**Input:** candidate profile (skills, scores, resume_text), job (title, description, requirements)  
**Output:** score 0-100, reasoning string

```python
prompt = ChatPromptTemplate.from_template("""
You are a technical recruiter. Score how well this candidate fits this job.

CANDIDATE:
Skills: {skills}
Readiness scores: {skill_scores}
Resume summary: {resume_text}

JOB:
Title: {job_title}
Description: {job_description}
Requirements: {requirements}

Return JSON: {{"score": <0-100>, "reasoning": "<2 sentences max>"}}
Only return JSON.
""")

chain = prompt | ChatOpenAI(model="gpt-4o-mini", temperature=0) | JsonOutputParser()
```

---

### Chain 3: Resume Tailor (`chains/resume_tailor.py`)
**Input:** original resume_text, job description  
**Output:** rewritten resume text optimized for that JD

```python
prompt = ChatPromptTemplate.from_template("""
Rewrite the following resume to maximize ATS match for the job description below.
Keep all facts true. Reorder sections, reword bullets, add relevant keywords naturally.

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}

Return only the rewritten resume text. No commentary.
""")

chain = prompt | ChatOpenAI(model="gpt-4o", temperature=0.2) | StrOutputParser()
```

---

### Chain 4: Cold Email Generator (`chains/cold_email.py`)
**Input:** candidate name, skills, job title, company, hiring manager name (optional)  
**Output:** subject line + email body

```python
prompt = ChatPromptTemplate.from_template("""
Write a concise cold outreach email from a job candidate to a hiring manager.

Candidate: {candidate_name}
Top skills: {skills}
Job: {job_title} at {company}
Hiring manager: {hiring_manager_name}

Rules: Under 150 words. No fluff. End with a clear CTA.
Return JSON: {{"subject": "...", "body": "..."}}
""")

chain = prompt | ChatOpenAI(model="gpt-4o-mini", temperature=0.4) | JsonOutputParser()
```

---

### Chain 5: Placement Probability (`chains/placement_score.py`)
**Input:** candidate readiness tier, skill_scores, number of applications, avg compatibility score  
**Output:** placement probability 0-100, segment label, recommended intervention

```python
prompt = ChatPromptTemplate.from_template("""
Given this candidate's data, estimate placement probability and segment them.

Readiness tier: {tier}
Skill scores: {skill_scores}
Applications submitted: {application_count}
Average job compatibility: {avg_compatibility}

Segments: Ready (high probability, low intervention), 
          Risky (medium probability, needs nudge),
          Unprepared (low probability, needs coaching)

Return JSON: {{
  "placement_probability": <0-100>,
  "segment": "Ready|Risky|Unprepared",
  "intervention": "<one sentence recommendation for admin>"
}}
""")

chain = prompt | ChatOpenAI(model="gpt-4o-mini", temperature=0) | JsonOutputParser()
```

---

## API Endpoint Design

### Base URL: `https://your-backend.railway.app`

All endpoints require `Authorization: Bearer <supabase_jwt>` header.  
Backend verifies JWT using Supabase service role key.

---

### Readiness Router (`/readiness`)

| Method | Endpoint | Body | Returns |
|--------|----------|------|---------|
| POST | `/readiness/profile` | `{skills[], domain_interests[], resume_text}` | `{candidate_profile_id}` |
| POST | `/readiness/generate-test` | `{candidate_id}` | `{assessments: [{id, skill, questions[]}]}` |
| POST | `/readiness/submit` | `{assessment_id, answers[{selected_index}]}` | `{score, correct_count}` |
| POST | `/readiness/evaluate` | `{candidate_id}` | `{tier, overall_score, skill_scores{}}` |
| GET | `/readiness/result/{candidate_id}` | — | `{tier, overall_score, skill_scores}` |

---

### Jobs Router (`/jobs`)

| Method | Endpoint | Body | Returns |
|--------|----------|------|---------|
| POST | `/jobs/compatibility` | `{candidate_id, job_ids[]}` | `{scores: [{job_id, score, reasoning, hiring_manager_email}]}` |
| POST | `/jobs/lookup-email` | `{company_domain, job_title}` | `{email, confidence}` |
| POST | `/jobs/quick-apply` | `{candidate_id, job_id, resume_text}` | `{application_id, confirmation_sent: bool}` |

---

### Actions Router (`/actions`)

| Method | Endpoint | Body | Returns |
|--------|----------|------|---------|
| POST | `/actions/tailor-resume` | `{candidate_id, job_id}` | `{artifact_id, tailored_resume}` |
| POST | `/actions/cold-email` | `{candidate_id, job_id}` | `{artifact_id, subject, body}` |
| GET | `/actions/artifacts/{candidate_id}` | — | `{artifacts[]}` |

---

### Admin Router (`/admin`)

| Method | Endpoint | Body | Returns |
|--------|----------|------|---------|
| GET | `/admin/tpc-intelligence` | — | `{candidates: [{id, name, tier, placement_probability, segment, intervention, application_count}]}` |
| POST | `/admin/intervene` | `{candidate_id, message}` | `{email_sent: bool}` |

---

## Frontend Integration Points

### Pages to MODIFY

**`src/features/candidate/Dashboard.tsx`**
- Add "Career Readiness" card with tier badge (Ready/Partial/Not Ready)
- If no assessment exists → link to `/readiness`
- If assessed → show score + link to job board with compat scores

**`src/features/candidate/JobBoard.tsx`**
- Fetch compatibility scores from `/jobs/compatibility` on mount (if candidate has readiness result)
- Add `CompatibilityBadge` component on each `JobCard` (green/yellow/red %)
- Add "Tailor Resume" button on each card → calls `/actions/tailor-resume` → opens modal with result
- Add "Has Hiring Manager Email" filter toggle
- Quick Apply button → calls `/jobs/quick-apply` instead of existing modal for assessed candidates
- **Skeleton loading state is mandatory** — the board will look broken during the 3–5s compatibility fetch. Add shimmer skeletons on job cards while scores load. Use a `scoresLoading` boolean separate from the main `loading` state so jobs render immediately and scores fill in after:

```tsx
// In JobBoard.tsx
const [scoresLoading, setScoresLoading] = useState(true)
const [compatScores, setCompatScores] = useState<Record<string, number>>({})

// JobCard renders immediately; badge shows skeleton until scoresLoading = false
// CompatibilityBadge:
{scoresLoading
  ? <div className="w-12 h-5 bg-surface animate-pulse rounded-full" />
  : <span className={`px-2 py-0.5 text-xs rounded-full ${scoreColor(compatScores[job.id])}`}>
      {compatScores[job.id] ?? '—'}%
    </span>
}
```

**`src/features/admin/Dashboard.tsx`**
- Add new card: "TPC Intelligence Panel" → links to `/admin/tpc`

### Pages to CREATE

**`src/features/candidate/ReadinessForm.tsx`** — `/readiness`
- Step 1: Multi-select skill chips (React, Node, Python, SQL, etc.)
- Step 2: Domain interest checkboxes (Frontend, Backend, Data, DevOps, etc.)
- Step 3: Resume paste/upload (reuse existing ATS text extractor)
- On submit → POST `/readiness/profile` then POST `/readiness/generate-test` → redirect to `/readiness/test`

**`src/features/candidate/ReadinessTest.tsx`** — `/readiness/test`
- Render MCQ questions per skill (tabbed or paginated)
- Timer optional (nice to have)
- On submit → POST `/readiness/submit` for each assessment → POST `/readiness/evaluate` → redirect to `/readiness/result`

**`src/features/candidate/ReadinessResult.tsx`** — `/readiness/result`
- Show tier with color (green/yellow/red)
- Skill-by-skill score breakdown
- CTA based on tier:
  - Ready → "Browse Jobs" (with compat scores)
  - Partial → "See recommended resources" + "Browse Jobs"
  - Not Ready → "Practice these skills" + list of weak areas

**`src/features/admin/TPCIntelligence.tsx`** — `/admin/tpc`
- Table: Name | Tier | Placement % | Segment | Applications | Intervention
- Color-coded rows by segment
- "Intervene" button → opens modal with pre-filled message → POST `/admin/intervene`
- Filter by segment (Ready/Risky/Unprepared)

**`src/features/candidate/AgentThinkingPanel.tsx`** — NEW, rendered inside `ReadinessResult.tsx`

This is the single highest-value component for judges. It makes the agent's reasoning visible. Fake-stream it with `setTimeout` — judges don't know the difference and it reads as live AI reasoning.

```tsx
// AgentThinkingPanel.tsx
import { useEffect, useState } from 'react'

interface Step {
  text: string
  status: 'thinking' | 'pass' | 'fail' | 'info'
}

interface Props {
  skillScores: Record<string, number>
  tier: 'ready' | 'partial' | 'not_ready'
}

const TIER_LABELS = {
  ready: 'READY',
  partial: 'PARTIAL',
  not_ready: 'NOT READY'
}

export function AgentThinkingPanel({ skillScores, tier }: Props) {
  const [visibleSteps, setVisibleSteps] = useState<Step[]>([])
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Guard: if evaluate API failed or returned empty, show error state
    if (!skillScores || Object.keys(skillScores).length === 0) {
      setVisibleSteps([{ text: 'Evaluation data unavailable.', status: 'fail' }])
      setDone(true)
      return
    }

    const steps: Step[] = [
      { text: 'Initialising readiness evaluation agent...', status: 'info' },
      ...Object.entries(skillScores).map(([skill, score]) => ({
        text: `Analysing ${skill} score: ${score}/100 ${score >= 70 ? '✓' : '✗'}`,
        status: score >= 70 ? 'pass' : 'fail' as Step['status']
      })),
      {
        text: `Detected skill gaps: ${Object.entries(skillScores).filter(([,s]) => s < 70).map(([k]) => k).join(', ') || 'none'}`,
        status: 'info'
      },
      { text: `Overall tier decision: ${TIER_LABELS[tier]}`, status: tier === 'ready' ? 'pass' : tier === 'partial' ? 'info' : 'fail' },
      { text: 'Unlocking matched jobs based on profile...', status: 'info' },
      ...(tier !== 'ready' ? [{
        text: `Flagging upskill resources for: ${Object.entries(skillScores).filter(([,s]) => s < 70).map(([k]) => k).join(', ')}`,
        status: 'info' as Step['status']
      }] : []),
      { text: 'Agent evaluation complete.', status: 'pass' },
    ]

    steps.forEach((step, i) => {
      setTimeout(() => {
        setVisibleSteps(prev => [...prev, step])
        if (i === steps.length - 1) setDone(true)
      }, i * 600)
    })
  }, [])

  const colors: Record<Step['status'], string> = {
    thinking: 'text-yellow-400',
    pass: 'text-green-400',
    fail: 'text-red-400',
    info: 'text-blue-400'
  }

  return (
    <div className="bg-black border border-border rounded-lg p-4 font-mono text-sm mb-8">
      <div className="text-xs text-muted mb-3 uppercase tracking-widest">Agent Reasoning</div>
      <div className="space-y-1">
        {visibleSteps.map((step, i) => (
          <div key={i} className={`flex items-start gap-2 ${colors[step.status]}`}>
            <span className="mt-0.5 shrink-0">→</span>
            <span>{step.text}</span>
          </div>
        ))}
        {!done && (
          <div className="text-muted animate-pulse">→ _</div>
        )}
      </div>
    </div>
  )
}
```

Render it at the top of `ReadinessResult.tsx` before the score breakdown. Pass `skillScores` and `tier` from the evaluate API response. The panel auto-runs on mount — no user interaction needed.

**`src/lib/aiService.ts`** — all AI API calls

```typescript
const AI_BASE = import.meta.env.VITE_AI_BACKEND_URL

async function aiPost(endpoint: string, body: object, token: string) {
  const res = await fetch(`${AI_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const aiService = {
  saveProfile: (data, token) => aiPost('/readiness/profile', data, token),
  generateTest: (candidateId, token) => aiPost('/readiness/generate-test', { candidate_id: candidateId }, token),
  submitAssessment: (data, token) => aiPost('/readiness/submit', data, token),
  evaluate: (candidateId, token) => aiPost('/readiness/evaluate', { candidate_id: candidateId }, token),
  getCompatibility: (candidateId, jobIds, token) => aiPost('/jobs/compatibility', { candidate_id: candidateId, job_ids: jobIds }, token),
  tailorResume: (candidateId, jobId, token) => aiPost('/actions/tailor-resume', { candidate_id: candidateId, job_id: jobId }, token),
  generateColdEmail: (candidateId, jobId, token) => aiPost('/actions/cold-email', { candidate_id: candidateId, job_id: jobId }, token),
  getTPCIntelligence: (token) => fetch(`${AI_BASE}/admin/tpc-intelligence`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
  intervene: (candidateId, message, token) => aiPost('/admin/intervene', { candidate_id: candidateId, message }, token),
}
```

---

## Autonomous Nudge Agent (`agents/nudge_agent.py`)

Runs on a cron every 24hrs via APScheduler.

```python
# Logic:
# 1. Query Supabase: candidates with readiness_results.assessed_at < now() - 5 days
# 2. Cross-check: no application submitted after assessed_at
# 3. For each → run cold_email chain with top-matched job
# 4. Send via Resend
# 5. Log to nudge_log table

from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('interval', hours=24)
async def nudge_inactive_candidates():
    # fetch from supabase, run chain, send email
    pass
```

---

## Build Order (12–15hr sprint)

> Revised from v1: Nudge agent moved to Hour 10 (more impressive agentic behavior, needs demo time).
> TPC panel moved to Hour 11. AgentThinkingPanel added at Hour 12 — critical for judge scoring.
> Hunter.io pre-populated manually for demo safety (see Gotcha #4).

```
Hour 0–1   → Run SQL migrations. Set up FastAPI skeleton + Supabase client in Python.
             Verify JWT auth middleware works end-to-end.
             Create 3 demo accounts in Supabase Auth (ready/partial/not_ready).
             Copy their UUIDs into the seed SQL and run it. Do this NOW.

Hour 1–2   → Chain 1 (MCQ Generator). Test with 3 skills via curl.
             Wire /readiness/generate-test endpoint.

Hour 2–3   → /readiness/profile + /readiness/submit + /readiness/evaluate endpoints.
             Store results in Supabase.

Hour 3–4   → ReadinessForm.tsx + ReadinessTest.tsx frontend.
             Connect to backend. Full flow: form → test → score stored.

Hour 4–5   → ReadinessResult.tsx. Tier display + CTA routing.
             Add readiness card to CandidateDashboard.tsx.

Hour 5–6   → Chain 2 (Job Compatibility). Wire /jobs/compatibility.
             Modify JobBoard.tsx to fetch + display CompatibilityBadge + shimmer skeletons.

Hour 6–7   → Hunter.io integration in services/hunter_client.py.
             Wire /jobs/lookup-email. Add "Has Email" filter to JobBoard.
             Pre-populate 3–4 seed jobs with real hiring_manager_email values in Supabase now.

Hour 7–8   → Chain 3 (Resume Tailor). Wire /actions/tailor-resume.
             Add "Tailor Resume" button + result modal in JobBoard.

Hour 8–9   → Chain 4 (Cold Email). Wire /actions/cold-email.
             Add "Generate Cold Email" button in job detail / tailor modal.

Hour 9–10  → Resend integration. Wire confirmation email on /jobs/quick-apply.
             Test full apply flow with email confirmation.

Hour 10–11 → Nudge agent + APScheduler. ← MOVED EARLIER (most impressive agentic behavior)
             Test with 5-minute interval manually. Verify email lands in inbox.
             Consider pg_cron on Supabase Edge Function as fallback if Railway spins down.

Hour 11–12 → Chain 5 (Placement Score). Wire /admin/tpc-intelligence.
             Build TPCIntelligence.tsx table + segment filters + Intervene button.

Hour 12–13 → AgentThinkingPanel.tsx. ← NEW, CRITICAL FOR JUDGES
             Wire into ReadinessResult.tsx. Test the fake-stream with real skill score data.
             This is worth 5–8 marks on Agentic AI criteria — do not skip.

Hour 13–14 → Deploy backend to Railway. Set env vars. Update VITE_AI_BACKEND_URL.
             Smoke test all endpoints from deployed frontend.

Hour 14–15 → Bug fixes, error boundaries, loading states on all new pages.
             Polish CompatibilityBadge colors, tier badges, TPC table styling.
             Seed demo data: 1 Ready candidate, 1 Partial, 1 Not Ready for judge walkthrough.
```

---

## Environment Variables

### Frontend (`.env`)
```
VITE_AI_BACKEND_URL=https://your-backend.railway.app
```

### Backend (`ai-backend/.env`)
```
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=      # NOT the anon key — needed for admin queries
RESEND_API_KEY=
HUNTER_API_KEY=
```

---

## Gotchas & Technical Risks

**1. Supabase JWT verification in Python**  
Use `supabase-py` with the service role key server-side. To verify incoming JWTs from the frontend, decode with `python-jose` using the Supabase JWT secret (found in project settings). Don't skip this — any endpoint without auth is a data leak.

**2. LangChain JSON output reliability**  
`gpt-4o-mini` occasionally returns malformed JSON despite instructions. Wrap all chain calls in try/except and add a retry with `temperature=0` fallback. Use `JsonOutputParser` with Pydantic models — it auto-retries on parse failure.

**3. Compatibility score latency**  
Running Chain 2 for 20+ jobs on page load will be slow (5–10s). Cache results in `job_compatibility` table with a `computed_at` timestamp. Only recompute if job or candidate profile changed. On the frontend, show cached scores instantly and recompute in background.

**4. Hunter.io rate limits — demo risk is higher than it looks**  
Free tier is 25 requests/month total — not per day. One bad loop in your code and you're out before the demo. Do not rely on Hunter working live during the presentation. At Hour 6–7, manually insert `hiring_manager_email` values directly into Supabase for 3–4 seed jobs. Use Hunter as the "real-world scale" talking point in your pitch ("at scale, we'd auto-discover hiring manager emails via Hunter.io") — not as a live dependency. Cache every lookup in `job_compatibility.hiring_manager_email` regardless.

**5. APScheduler in Railway**  
Railway spins down free-tier services. Either use Railway's paid plan, or move the nudge cron to a Supabase Edge Function with `pg_cron` — more reliable for scheduled jobs.

**6. Resume text availability**  
The existing `applications.resume_text` is populated at apply time. For the readiness flow, candidates need to paste/upload resume before assessment. Make this field required in `ReadinessForm` — the tailor and cold email chains both depend on it.

**7. CORS**  
FastAPI needs explicit CORS config for your Vercel domain:
```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(CORSMiddleware, allow_origins=["https://your-app.vercel.app"], allow_methods=["*"], allow_headers=["*"])
```

**8. MCQ question quality**  
`gpt-4o-mini` generates shallow questions for niche skills. For the hackathon, constrain skill options to ~15 well-known ones (React, Python, SQL, Node.js, etc.) where the model performs reliably. Don't let users free-type skills.
