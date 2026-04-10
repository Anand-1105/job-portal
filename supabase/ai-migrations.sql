-- ============================================================
-- AI Career Coach — Schema Migrations
-- Run this FIRST in Supabase SQL Editor
-- ============================================================

-- 1. Add missing columns to existing jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS hiring_manager_email text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS requirements text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS source_url text;

-- 2. Candidate skill profile
CREATE TABLE IF NOT EXISTS candidate_profiles (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id     uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  skills           text[] NOT NULL DEFAULT '{}',
  domain_interests text[] NOT NULL DEFAULT '{}',
  resume_text      text,
  updated_at       timestamptz DEFAULT now()
);

-- 3. Per-skill MCQ assessments
CREATE TABLE IF NOT EXISTS assessments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  skill        text NOT NULL,
  questions    jsonb NOT NULL,   -- [{question, options:[4], correct_index}]
  answers      jsonb,            -- [{selected_index}] filled on submit
  score        integer,          -- 0-100
  status       text CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
  created_at   timestamptz DEFAULT now()
);

-- 4. Overall readiness result per candidate
CREATE TABLE IF NOT EXISTS readiness_results (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id  uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  overall_score integer,
  tier          text CHECK (tier IN ('ready', 'partial', 'not_ready')),
  skill_scores  jsonb,           -- {"React": 82, "Python": 45}
  proctoring    jsonb,           -- {"faceMissingCount": 0, ...}
  assessed_at   timestamptz DEFAULT now()
);

-- 5. Job compatibility scores (cached per candidate+job pair)
CREATE TABLE IF NOT EXISTS job_compatibility (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id          uuid REFERENCES profiles(id) ON DELETE CASCADE,
  job_id                uuid REFERENCES jobs(id) ON DELETE CASCADE,
  score                 integer,   -- 0-100
  reasoning             text,
  hiring_manager_email  text,
  computed_at           timestamptz DEFAULT now(),
  UNIQUE(candidate_id, job_id)
);

-- 6. AI-generated artifacts (tailored resumes, cold emails)
CREATE TABLE IF NOT EXISTS ai_artifacts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  job_id       uuid REFERENCES jobs(id) ON DELETE CASCADE,
  type         text CHECK (type IN ('tailored_resume', 'cold_email')),
  content      text NOT NULL,
  created_at   timestamptz DEFAULT now()
);

-- 7. Nudge email log
CREATE TABLE IF NOT EXISTS nudge_log (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id   uuid REFERENCES profiles(id) ON DELETE CASCADE,
  trigger_reason text,
  sent_at        timestamptz DEFAULT now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_results   ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_compatibility   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_artifacts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudge_log           ENABLE ROW LEVEL SECURITY;

-- candidate_profiles
CREATE POLICY "candidate_profiles_own" ON candidate_profiles
  FOR ALL USING (auth.uid() = candidate_id);

-- assessments
CREATE POLICY "assessments_own" ON assessments
  FOR ALL USING (auth.uid() = candidate_id);

-- readiness_results: candidates see own, admins see all
CREATE POLICY "readiness_results_own" ON readiness_results
  FOR ALL USING (auth.uid() = candidate_id);

CREATE POLICY "readiness_results_admin" ON readiness_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- job_compatibility
CREATE POLICY "job_compatibility_own" ON job_compatibility
  FOR ALL USING (auth.uid() = candidate_id);

-- ai_artifacts
CREATE POLICY "ai_artifacts_own" ON ai_artifacts
  FOR ALL USING (auth.uid() = candidate_id);

-- nudge_log: admin only
CREATE POLICY "nudge_log_admin" ON nudge_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
