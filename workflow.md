# Job Portal MVP - Comprehensive Workflow & Feature Guide

This document provides a detailed overview of the Job Portal's workflow, user journeys, and every single feature implemented in the platform.

---

## 🚀 Core Technology Stack & UX
- **Frontend**: React (TypeScript) + Vite
- **Styling**: Tailwind CSS (Premium Dark Theme)
- **Backend/Auth**: Supabase (PostgreSQL, Auth, Storage)
- **3D Graphics**: React Three Fiber (Three.js) for interactive hero elements.
- **Animations**: Framer Motion & React Spring for smooth transitions.
- **UX Features**:
  - **Custom Cursor**: Spotlight effect that follows the mouse.
  - **Bento Grid Layouts**: Modern, organized feature displays.
  - **Page Transitions**: Fluid motion between routes.
  - **Noise Overlay**: Aesthetic texture across the platform.

---

## 👤 User Roles & Authentication
The platform supports three distinct roles with specialized dashboards and capabilities:
1.  **Candidate**: Job seekers looking for roles and optimizing their resumes.
2.  **Recruiter**: Hiring managers posting jobs and managing applicants.
3.  **Admin**: Platform moderators overseeing users, jobs, and analytics.

**Auth Flow**:
- Sign up with role selection (Candidate/Recruiter).
- Email/Password login.
- Persistent sessions and protected routes based on roles.

---

## 🏠 Landing Page (Public)
The entry point for all users, designed to "WOW" with premium aesthetics:
- **Interactive 3D Hero**: Engaging visuals using React Three Fiber.
- **How It Works**: Step-by-step guides for both candidates and recruiters.
- **Feature Showcase**: Highlights the AI ATS Checker and Job Board.
- **Jobs Preview**: A curated look at current open positions.
- **Opportunity Carousel**: Dynamic scrolling of featured roles.
- **Recruiter Marquee**: Sliding display of top companies hiring on the platform.

---

## 🔍 Candidate Workflow

### 1. Job Discovery
- **Job Board**: A central hub for all job postings.
- **Advanced Filters**: Filter by Job Type (Full-time, Part-time, Contract, Internship) and Work Mode (Remote, Hybrid, On-site).
- **Job Details**: Deep dive into job descriptions, requirements, and salary ranges.

### 2. Guided Application Process
A 6-step conversational application journey:
- **Intro**: Welcome and job summary.
- **Basics**: Contact information gathering.
- **Experience**: Relevant years and "fit" description.
- **Resume**: Paste text or upload (integrated with parsing).
- **Cover Letter**: Optional personal note.
- **Review**: Complete summary before submission with success animations.

### 3. AI ATS Checker (Resume Optimizer)
- **Analysis**: Compare resume text/PDF against a specific job description.
- **Scoring**: 0-100 match score based on AI analysis.
- **Keyword Tracking**: Identifies Matched vs. Missing skills.
- **Metric Breakdown**: Technical keywords, Power words (action verbs), and Weakness detection.
- **AI Recommendations**: Specific, actionable advice to improve the resume.

### 4. Candidate Dashboard
- **Application Tracking**: Monitor the status of all submitted applications.
- **Application Timeline**: Visual history of application progress.
- **Profile Management**: Update professional details and preferences.

---

## 💼 Recruiter Workflow

### 1. Dashboard & Stats
- **High-Level Metrics**:
  - Total Jobs Posted
  - Total Applicants Received
  - Pending Reviews
  - Shortlisted Candidates
- **Active Listings**: Quick view of all posted jobs with applicant counts.

### 2. Job Management
- **Create Job**: Specialized form for posting new opportunities.
- **Job Controls**: Ability to toggle job status (Open/Closed).

### 3. Applicant Management
- **Review System**: Detailed view of all applicants for a specific role.
- **Resume Access**: Direct access to candidate-submitted resumes and cover letters.
- **Status Management**: Track candidates through the hiring pipeline.

---

## 🛡️ Admin Workflow

### 1. Platform Dashboard
- **Global Metrics**:
  - Total User Count (Candidates vs. Recruiters)
  - Total Jobs & Open Positions
  - Total Applications & Pending Actions
  - Engagement Stats (Avg Apps per Job)

### 2. Management & Oversight
- **User Management**: Search, view, and manage all platform users.
- **Job Management**: Complete oversight of all postings for moderation.
- **Application Analytics**: Visual data on application trends and volume over time.
- **Recruiter Profiles**: Detailed oversight of hiring companies.
- **Global Applicant View**: Ability to see all activity across the platform for quality control.

---

## 📜 Legal & Compliance
- **Terms of Service**: Comprehensive platform usage terms.
- **Privacy Policy**: Detailed data handling and privacy information.
