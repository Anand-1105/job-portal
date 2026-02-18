import { supabase } from './supabase'

export interface RecruiterStats {
    totalJobs: number
    totalApplicants: number
    pendingReviews: number
    shortlisted: number
}

export interface JobWithApplicantCount {
    id: string
    title: string
    description: string
    location: string
    type: string
    salary_range: string | null
    status: string
    created_at: string
    applicant_count: number
}

export async function getRecruiterStats(recruiterId: string): Promise<RecruiterStats> {
    try {
        // Get total jobs
        const { count: totalJobs } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .eq('recruiter_id', recruiterId)

        // Get job IDs for this recruiter
        const { data: jobs } = await supabase
            .from('jobs')
            .select('id')
            .eq('recruiter_id', recruiterId)

        const jobIds = (jobs as any)?.map((j: any) => j.id) || []

        if (jobIds.length === 0) {
            return { totalJobs: 0, totalApplicants: 0, pendingReviews: 0, shortlisted: 0 }
        }

        // Get total applicants
        const { count: totalApplicants } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .in('job_id', jobIds)

        // Get pending reviews
        const { count: pendingReviews } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .in('job_id', jobIds)
            .eq('status', 'pending')

        // Get shortlisted count
        const { count: shortlisted } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .in('job_id', jobIds)
            .eq('status', 'shortlisted')

        return {
            totalJobs: totalJobs || 0,
            totalApplicants: totalApplicants || 0,
            pendingReviews: pendingReviews || 0,
            shortlisted: shortlisted || 0,
        }
    } catch (error) {
        console.error('Error fetching recruiter stats:', error)
        throw error
    }
}

export async function getRecruiterJobs(recruiterId: string): Promise<JobWithApplicantCount[]> {
    try {
        const { data: jobs, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('recruiter_id', recruiterId)
            .order('created_at', { ascending: false })

        if (error) throw error

        // Get applicant counts for each job
        const jobsWithCounts = await Promise.all(
            ((jobs as any) || []).map(async (job: any) => {
                const { count } = await supabase
                    .from('applications')
                    .select('*', { count: 'exact', head: true })
                    .eq('job_id', job.id)

                return {
                    ...job,
                    applicant_count: count || 0,
                }
            })
        )

        return jobsWithCounts as any[]
    } catch (error) {
        console.error('Error fetching recruiter jobs:', error)
        throw error
    }
}

export async function updateJobStatus(jobId: string, status: 'open' | 'closed') {
    try {
        const { error } = await supabase
            .from('jobs')
            // @ts-ignore
            .update({ status } as any)
            .eq('id', jobId)

        if (error) throw error
    } catch (error) {
        console.error('Error updating job status:', error)
        throw error
    }
}

export async function deleteJob(jobId: string) {
    try {
        const { error } = await supabase
            .from('jobs')
            .delete()
            .eq('id', jobId)

        if (error) throw error
    } catch (error) {
        console.error('Error deleting job:', error)
        throw error
    }
}

export async function getApplicationsByJob(jobId: string) {
    try {
        const { data, error } = await supabase
            .from('applications')
            .select('*, profiles(*)')
            .eq('job_id', jobId)
            .order('applied_at', { ascending: false })

        if (error) throw error
        return data as any[]
    } catch (error) {
        console.error('Error fetching applications:', error)
        throw error
    }
}
