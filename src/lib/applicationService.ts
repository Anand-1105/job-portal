import { supabase } from './supabase'

export interface ApplicationData {
    jobId: string
    candidateId: string
    fullName: string
    email: string
    phone: string
    yearsExperience: string
    relevantExperience: string
    resumeText: string
    coverLetter: string
}

export async function submitApplication(data: ApplicationData) {
    const { data: application, error } = await supabase
        .from('applications')
        .insert({
            job_id: data.jobId,
            candidate_id: data.candidateId,
            full_name: data.fullName,
            email: data.email,
            phone: data.phone,
            years_experience: data.yearsExperience,
            relevant_experience: data.relevantExperience,
            resume_text: data.resumeText,
            cover_letter: data.coverLetter,
            status: 'pending'
        })
        .select()
        .single()

    if (error) {
        console.error('Error submitting application:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        throw error
    }

    return application
}

export async function getApplications(candidateId: string) {
    const { data: applications, error } = await supabase
        .from('applications')
        .select(`
            *,
            jobs (
                id,
                title,
                description,
                location,
                type,
                salary_range,
                profiles:recruiter_id (
                    full_name
                )
            )
        `)
        .eq('candidate_id', candidateId)
        .order('applied_at', { ascending: false })

    if (error) {
        console.error('Error fetching applications:', error)
        throw error
    }

    return applications
}
