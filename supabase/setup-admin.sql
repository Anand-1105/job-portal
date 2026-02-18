-- Admin Account Setup Script
-- This script sets up an admin account that can access all three portals
-- Run this in your Supabase SQL Editor after signing up with anand01ts@gmail.com

-- IMPORTANT: The profiles table doesn't have an email column.
-- Email is stored in auth.users, and profiles uses the user id.

-- Step 1: Find your user ID by joining with auth.users
-- Run this query first to get your user ID:
SELECT p.id, p.role, p.full_name, au.email
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE au.email = 'anand01ts@gmail.com';

-- Step 2: Copy the 'id' from the result above and use it in the UPDATE below
-- Replace 'YOUR_USER_ID_HERE' with the actual UUID from Step 1

-- UPDATE profiles 
-- SET role = 'admin' 
-- WHERE id = 'YOUR_USER_ID_HERE';

-- OR, if you want to do it in one query (works if you have permissions):
UPDATE profiles 
SET role = 'admin' 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'anand01ts@gmail.com'
);

-- Verify the update
SELECT p.id, p.role, p.full_name, au.email
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE au.email = 'anand01ts@gmail.com';

-- Note: With role='admin', you will have access to:
-- 1. Admin Dashboard (/dashboard shows admin dashboard)
-- 2. Admin User Management (/admin/users)
-- 3. Admin Job Management (/admin/jobs)
-- 4. Admin Application Analytics (/admin/applications)

-- If you need to test other roles, you can switch by running:
-- UPDATE profiles SET role = 'candidate' WHERE id IN (SELECT id FROM auth.users WHERE email = 'anand01ts@gmail.com');  -- For candidate portal
-- UPDATE profiles SET role = 'recruiter' WHERE id IN (SELECT id FROM auth.users WHERE email = 'anand01ts@gmail.com'); -- For recruiter portal
-- UPDATE profiles SET role = 'admin' WHERE id IN (SELECT id FROM auth.users WHERE email = 'anand01ts@gmail.com');     -- For admin portal

-- After changing role, REFRESH THE PAGE and navigate to /dashboard
