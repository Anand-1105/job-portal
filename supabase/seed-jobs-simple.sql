-- Seed Jobs for Testing
-- Run this entire script in Supabase SQL Editor

-- Insert 6 sample jobs with your user ID as recruiter
INSERT INTO jobs (recruiter_id, title, description, location, type, salary_range, status) 
VALUES
(
    '97e50f46-55fa-4134-ae6c-865d81a5e176',
    'Senior Product Designer',
    'Help us build the future of issue tracking. Looking for someone who loves craft and sweats the details.',
    'Remote',
    'full-time',
    '$120k - $180k',
    'open'
),
(
    '97e50f46-55fa-4134-ae6c-865d81a5e176',
    'Frontend Engineer',
    'Build delightful experiences for millions of developers. React, Next.js, TypeScript expertise required.',
    'San Francisco',
    'full-time',
    '$150k - $220k',
    'open'
),
(
    '97e50f46-55fa-4134-ae6c-865d81a5e176',
    'Product Manager',
    'Own the roadmap for our payments platform. Work with world-class engineers and designers.',
    'New York',
    'full-time',
    '$140k - $200k',
    'open'
),
(
    '97e50f46-55fa-4134-ae6c-865d81a5e176',
    'Marketing Lead',
    'Drive growth through creative campaigns. Experience in B2B SaaS marketing is a must.',
    'Remote',
    'full-time',
    '$110k - $160k',
    'open'
),
(
    '97e50f46-55fa-4134-ae6c-865d81a5e176',
    'DevOps Engineer',
    'Scale our infrastructure to handle millions of deploys. Kubernetes, Docker, cloud expertise needed.',
    'San Francisco',
    'full-time',
    '$130k - $190k',
    'open'
),
(
    '97e50f46-55fa-4134-ae6c-865d81a5e176',
    'UX Researcher',
    'Help us understand our users deeply. Conduct studies, analyze data, inform product decisions.',
    'Remote',
    'full-time',
    '$115k - $165k',
    'open'
);

-- Verify jobs were created
SELECT id, title, location, salary_range FROM jobs;
