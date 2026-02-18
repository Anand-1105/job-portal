-- Seed Jobs Script - Option 1: Use Your Existing Account
-- This script will assign jobs to YOUR account temporarily for testing
-- You can change the recruiter later through the app

-- Replace jobs with your user ID as the recruiter
INSERT INTO jobs (id, recruiter_id, title, description, location, type, salary_range, status) 
VALUES
(
    '550e8400-e29b-41d4-a716-446655440001',
    (SELECT id FROM profiles LIMIT 1), -- Uses your first profile
    'Senior Product Designer',
    'Help us build the future of issue tracking. Looking for someone who loves craft and sweats the details.',
    'Remote',
    'full-time',
    '$120k - $180k',
    'open'
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    (SELECT id FROM profiles LIMIT 1),
    'Frontend Engineer',
    'Build delightful experiences for millions of developers. React, Next.js, TypeScript expertise required.',
    'San Francisco',
    'full-time',
    '$150k - $220k',
    'open'
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    (SELECT id FROM profiles LIMIT 1),
    'Product Manager',
    'Own the roadmap for our payments platform. Work with world-class engineers and designers.',
    'New York',
    'full-time',
    '$140k - $200k',
    'open'
),
(
    '550e8400-e29b-41d4-a716-446655440004',
    (SELECT id FROM profiles LIMIT 1),
    'Marketing Lead',
    'Drive growth through creative campaigns. Experience in B2B SaaS marketing is a must.',
    'Remote',
    'full-time',
    '$110k - $160k',
    'open'
),
(
    '550e8400-e29b-41d4-a716-446655440005',
    (SELECT id FROM profiles LIMIT 1),
    'DevOps Engineer',
    'Scale our infrastructure to handle millions of deploys. Kubernetes, Docker, cloud expertise needed.',
    'San Francisco',
    'full-time',
    '$130k - $190k',
    'open'
),
(
    '550e8400-e29b-41d4-a716-446655440006',
    (SELECT id FROM profiles LIMIT 1),
    'UX Researcher',
    'Help us understand our users deeply. Conduct studies, analyze data, inform product decisions.',
    'Remote',
    'full-time',
    '$115k - $165k',
    'open'
)
ON CONFLICT (id) DO NOTHING;

-- Verify the jobs were created
SELECT id, title, location, salary_range, 
       (SELECT full_name FROM profiles WHERE id = jobs.recruiter_id) as recruiter_name
FROM jobs;
