-- ============================================================
-- AI Career Coach — Demo Seed Data
-- Run this AFTER ai-migrations.sql
-- 
-- BEFORE RUNNING:
-- 1. Create 3 candidate accounts in Supabase Auth (Authentication > Users > Add User)
--    - ready@demo.com      / password: Demo1234!
--    - partial@demo.com    / password: Demo1234!
--    - notready@demo.com   / password: Demo1234!
-- 2. Copy their UUIDs from the Auth users list
-- 3. Replace the 3 placeholder UUIDs below
-- 4. Run this file
-- ============================================================

-- Replace these with real UUIDs from your Supabase Auth users
DO $$
DECLARE
  ready_uuid    uuid := '97e50f46-55fa-4134-ae6c-865d81a5e176';
  partial_uuid  uuid := '4fa27df9-54fd-495d-88dd-6b69630a145b';
  notready_uuid uuid := '7fa35f70-e63a-42c9-b993-4383640ff84f';
BEGIN

  -- --------------------------------------------------------
  -- Ensure profiles exist for all 3 demo users
  -- (the trigger should create them on signup, but just in case)
  -- --------------------------------------------------------
  INSERT INTO profiles (id, role, full_name, headline)
  VALUES
    (ready_uuid,    'candidate', 'Alex Chen',    'Full-Stack Developer'),
    (partial_uuid,  'candidate', 'Priya Sharma', 'Aspiring Data Scientist'),
    (notready_uuid, 'candidate', 'Jordan Lee',   'CS Student')
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    headline  = EXCLUDED.headline;

  -- --------------------------------------------------------
  -- Candidate skill profiles
  -- --------------------------------------------------------
  INSERT INTO candidate_profiles (candidate_id, skills, domain_interests, resume_text)
  VALUES
    (
      ready_uuid,
      ARRAY['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
      ARRAY['Frontend', 'Full-Stack'],
      'Experienced full-stack developer with 2 years building React applications. Proficient in Node.js, TypeScript, and PostgreSQL. Built 3 production apps.'
    ),
    (
      partial_uuid,
      ARRAY['Python', 'DSA', 'Machine Learning'],
      ARRAY['Data', 'Backend'],
      'Data science enthusiast with strong Python skills. Familiar with pandas and scikit-learn. Weaker on algorithms and system design.'
    ),
    (
      notready_uuid,
      ARRAY['SQL', 'System Design'],
      ARRAY['Backend', 'DevOps'],
      'First-year CS student. Basic SQL knowledge from coursework. Limited practical experience.'
    )
  ON CONFLICT (candidate_id) DO UPDATE SET
    skills           = EXCLUDED.skills,
    domain_interests = EXCLUDED.domain_interests,
    resume_text      = EXCLUDED.resume_text;

  -- --------------------------------------------------------
  -- Readiness results
  -- --------------------------------------------------------
  INSERT INTO readiness_results (candidate_id, overall_score, tier, skill_scores)
  VALUES
    (ready_uuid,    85, 'ready',     '{"React": 90, "Node.js": 80, "TypeScript": 85, "PostgreSQL": 82}'),
    (partial_uuid,  55, 'partial',   '{"Python": 65, "DSA": 40, "Machine Learning": 58}'),
    (notready_uuid, 28, 'not_ready', '{"SQL": 35, "System Design": 20}')
  ON CONFLICT (candidate_id) DO UPDATE SET
    overall_score = EXCLUDED.overall_score,
    tier          = EXCLUDED.tier,
    skill_scores  = EXCLUDED.skill_scores,
    assessed_at   = now();

END $$;

-- --------------------------------------------------------
-- Seed 4 demo jobs with hiring manager emails pre-populated
-- (avoids Hunter.io dependency during live demo)
-- --------------------------------------------------------
INSERT INTO jobs (recruiter_id, title, description, location, type, salary_range, status, requirements, hiring_manager_email)
SELECT
  -- Uses the first recruiter account found — make sure at least one recruiter exists
  (SELECT id FROM profiles WHERE role = 'recruiter' LIMIT 1),
  title, description, location, type, salary_range, 'open', requirements, hiring_manager_email
FROM (VALUES
  (
    'Frontend Engineer',
    'Build and maintain React-based web applications. Work closely with design and backend teams to deliver high-quality user experiences.',
    'Remote',
    'full-time',
    '$80,000 - $110,000',
    'React, TypeScript, CSS, REST APIs, Git',
    'hiring@techcorp-demo.com'
  ),
  (
    'Full-Stack Developer',
    'Develop features across the stack using Node.js and React. Own features end-to-end from database to UI.',
    'San Francisco, CA',
    'full-time',
    '$100,000 - $130,000',
    'Node.js, React, PostgreSQL, Docker, AWS',
    'careers@startupxyz-demo.com'
  ),
  (
    'Data Science Intern',
    'Analyse large datasets, build ML models, and present findings to the product team.',
    'New York, NY',
    'internship',
    '$25/hr',
    'Python, pandas, scikit-learn, SQL, Jupyter',
    'intern-hiring@datalab-demo.com'
  ),
  (
    'Backend Engineer',
    'Design and build scalable APIs and microservices. Improve system reliability and performance.',
    'Austin, TX',
    'contract',
    '$70/hr',
    'Python, FastAPI, PostgreSQL, Redis, Docker',
    'tech-hiring@backendco-demo.com'
  )
) AS t(title, description, location, type, salary_range, requirements, hiring_manager_email)
WHERE EXISTS (SELECT 1 FROM profiles WHERE role = 'recruiter');
