export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    role: 'candidate' | 'recruiter' | 'admin'
                    full_name: string | null
                    avatar_url: string | null
                    headline: string | null
                    created_at: string
                }
                Insert: {
                    id: string
                    role?: 'candidate' | 'recruiter' | 'admin'
                    full_name?: string | null
                    avatar_url?: string | null
                    headline?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    role?: 'candidate' | 'recruiter' | 'admin'
                    full_name?: string | null
                    avatar_url?: string | null
                    headline?: string | null
                    created_at?: string
                }
            }
            jobs: {
                Row: {
                    id: string
                    recruiter_id: string
                    title: string
                    description: string
                    location: string
                    type: 'full-time' | 'internship' | 'contract'
                    salary_range: string | null
                    status: 'open' | 'closed'
                    requirements: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    recruiter_id: string
                    title: string
                    description: string
                    location: string
                    type: 'full-time' | 'internship' | 'contract'
                    salary_range?: string | null
                    status?: 'open' | 'closed'
                    requirements?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    recruiter_id?: string
                    title?: string
                    description?: string
                    location?: string
                    type?: 'full-time' | 'internship' | 'contract'
                    salary_range?: string | null
                    status?: 'open' | 'closed'
                    requirements?: string | null
                    created_at?: string
                }
            }
            applications: {
                Row: {
                    id: string
                    job_id: string
                    candidate_id: string
                    full_name: string
                    email: string
                    phone: string | null
                    years_experience: string | null
                    relevant_experience: string | null
                    resume_text: string | null
                    cover_letter: string | null
                    status: 'pending' | 'shortlisted' | 'rejected'
                    applied_at: string
                }
                Insert: {
                    id?: string
                    job_id: string
                    candidate_id: string
                    full_name: string
                    email: string
                    phone?: string | null
                    years_experience?: string | null
                    relevant_experience?: string | null
                    resume_text?: string | null
                    cover_letter?: string | null
                    status?: 'pending' | 'shortlisted' | 'rejected'
                    applied_at?: string
                }
                Update: {
                    id?: string
                    job_id?: string
                    candidate_id?: string
                    full_name?: string
                    email?: string
                    phone?: string | null
                    years_experience?: string | null
                    relevant_experience?: string | null
                    resume_text?: string | null
                    cover_letter?: string | null
                    status?: 'pending' | 'shortlisted' | 'rejected'
                    applied_at?: string
                }
            }
        }
    }
}
