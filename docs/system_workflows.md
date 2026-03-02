# System Overview & Workflow Documentation

This document outlines the implementation and integration of the core recruitment features in the Job Portal MVP: **Job Application Flow**, **Resume Upload System**, and **Application Timeline**.

## 1. Job Application Flow

The application process is designed as a user-friendly, multi-step wizard to reduce friction and improve completion rates.

### Workflow Steps
1.  **Discovery**: Candidate views the `JobDetail` page for a specific role.
2.  **Initiation**: Clicking "Apply Now" navigates the user to the dedicated application route: `/jobs/:id/apply`.
3.  **Application Wizard** (implemented in `src/features/jobs/JobApply.tsx`):
    *   **Intro**: Displays job summary and a welcome message to set the tone.
    *   **Basics**: Collects personal information (Name, Email, Phone).
    *   **Experience**: Captures "Years of Experience" and a "Why you're a fit" summary.
    *   **Resume**: Currently accepts **Text Input**. Users paste their resume content directly.
        *   *Design Decision*: Focuses on content and keyword matching for the MVP.
    *   **Cover Letter**: Optional text area for personalization.
    *   **Review**: precise summary of all entered data before final submission.
4.  **Submission**:
    *   Data is validated and sent to the Supabase `applications` table via the `submitApplication` service.
    *   **Success Feedback**: A custom animated overlay confirms receipt.
    *   **Routing**: User is automatically redirected to their `/dashboard` after a brief delay.

### Key Integration Points
*   **Authentication**: The flow requires a logged-in user (`useAuth` hook) to link the application to the `candidate_id`.
*   **Database**: Creates a new record in the public `applications` table with an initial status of `applied`.

---

## 2. Resume Upload System

The current system prioritizes **Resume Analysis and Optimization** (ATS Checking) over simple file storage.

### Implementation Details (`src/features/candidate/ATSChecker.tsx`)
*   **Dual Input Methods**:
    1.  **File Upload**: Supports **PDF** and **TXT** files.
    2.  **Text Paste**: Direct text input.
*   **Client-Side Processing**:
    *   **PDF Parsing**: Utilizes `pdfjs-dist` to extract text content directly in the browser (client-side).
    *   **Privacy & Speed**: Files are processed in-memory for immediate analysis. Currently, files are **not** stored in Supabase Storage for the MVP; the system relies on the *extracted text*.
*   **ATS Logic**:
    *   The extracted text is analyzed against a provided Job Description.
    *   Generates a compatibility score (0-100), identifies missing keywords, and suggests improvements.

### Integration with Application
*   **Current Workflow**: The system encourages an "Optimize -> Apply" flow.
    1.  User uploads resume to **ATS Checker**.
    2.  System analyzes and helps user improve the content.
    3.  User copies the **optimized text** and pastes it into the **Job Application** form.
*   **Data Storage**: The final resume is stored as a `text` field in the `applications` table, making it immediately searchable and analyzable by recruiters without needing to download files.

---

## 3. Application Timeline Feature

A real-time status tracking system allows candidates to monitor their application progress without manual refreshing.

### Implementation (`src/features/candidate/ApplicationTimeline.tsx`)
*   **Data Source**: Fetches records from the `applications` table, joining with the `jobs` table to display role details (Title, Company, etc.).
*   **Real-time Architecture**:
    *   Implements a **Supabase Realtime Subscription** on the `applications` table.
    *   Listens for `UPDATE` events specifically for the current user's applications (`candidate_id=eq.user.id`).
    *   **Effect**: When a recruiter changes a status in the Admin Portal, the Candidate's timeline updates instantly.

### Status Logic & Visualization
The timeline visualizes the lifecycle of an application using a horizontal stepper:
1.  **Applied** (Default): The application has been successfully submitted.
2.  **Review in Progress** (`pending`): Visualized by a yellow clock icon. Indicates the recruiter is actively reviewing.
3.  **Final Decision**:
    *   **Shortlisted** (Green Check): User receives a "Congratulations!" message and visuals.
    *   **Not Selected** (Red X): Indicates the application process has ended for this role.

### Component Integration
*   **Dashboard Hub**: The timeline is the central component of the Candidate Dashboard (`/dashboard`).
*   **Recruiter Actions**: It is directly coupled with the Recruiter/Admin portal actions. Any status update performed by a recruiter triggers the UI update here.
