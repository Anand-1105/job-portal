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
                Relationships: any[]
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
                    hiring_manager_email: string | null
                    source_url: string | null
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
                    hiring_manager_email?: string | null
                    source_url?: string | null
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
                    hiring_manager_email?: string | null
                    source_url?: string | null
                    created_at?: string
                }
                Relationships: any[]
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
                Relationships: any[]
            }
            candidate_profiles: {
                Row: {
                    id: string
                    candidate_id: string
                    skills: string[]
                    domain_interests: string[]
                    resume_text: string | null
                    updated_at: string
                }
                Insert: {
                    id?: string
                    candidate_id: string
                    skills?: string[]
                    domain_interests?: string[]
                    resume_text?: string | null
                    updated_at?: string
                }
                Update: {
                    id?: string
                    candidate_id?: string
                    skills?: string[]
                    domain_interests?: string[]
                    resume_text?: string | null
                    updated_at?: string
                }
                Relationships: any[]
            }
            assessments: {
                Row: {
                    id: string
                    candidate_id: string
                    skill: string
                    questions: Json
                    answers: Json | null
                    score: number | null
                    status: 'pending' | 'completed'
                    created_at: string
                }
                Insert: {
                    id?: string
                    candidate_id: string
                    skill: string
                    questions: Json
                    answers?: Json | null
                    score?: number | null
                    status?: 'pending' | 'completed'
                    created_at?: string
                }
                Update: {
                    id?: string
                    candidate_id?: string
                    skill?: string
                    questions?: Json
                    answers?: Json | null
                    score?: number | null
                    status?: 'pending' | 'completed'
                    created_at?: string
                }
                Relationships: any[]
            }
            readiness_results: {
                Row: {
                    id: string
                    candidate_id: string
                    overall_score: number | null
                    tier: 'ready' | 'partial' | 'not_ready' | null
                    skill_scores: Json | null
                    proctoring: Json | null
                    assessed_at: string
                }
                Insert: {
                    id?: string
                    candidate_id: string
                    overall_score?: number | null
                    tier?: 'ready' | 'partial' | 'not_ready' | null
                    skill_scores?: Json | null
                    proctoring?: Json | null
                    assessed_at?: string
                }
                Update: {
                    id?: string
                    candidate_id?: string
                    overall_score?: number | null
                    tier?: 'ready' | 'partial' | 'not_ready' | null
                    skill_scores?: Json | null
                    proctoring?: Json | null
                    assessed_at?: string
                }
                Relationships: any[]
            }
            job_compatibility: {
                Row: {
                    id: string
                    candidate_id: string
                    job_id: string
                    score: number | null
                    reasoning: string | null
                    hiring_manager_email: string | null
                    computed_at: string
                }
                Insert: {
                    id?: string
                    candidate_id: string
                    job_id: string
                    score?: number | null
                    reasoning?: string | null
                    hiring_manager_email?: string | null
                    computed_at?: string
                }
                Update: {
                    id?: string
                    candidate_id?: string
                    job_id?: string
                    score?: number | null
                    reasoning?: string | null
                    hiring_manager_email?: string | null
                    computed_at?: string
                }
                Relationships: any[]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
