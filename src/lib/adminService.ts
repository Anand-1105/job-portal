import { supabase } from './supabase'

export interface PlatformStats {
    totalUsers: number
    totalCandidates: number
    totalRecruiters: number
    totalJobs: number
    totalApplications: number
    pendingApplications: number
    openJobs: number
}

export interface UserWithProfile {
    id: string
    email: string
    role: string
    full_name: string | null
    created_at: string
}

export async function getPlatformStats(): Promise<PlatformStats> {
    try {
        // Get total users/profiles
        const { count: totalUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })

        // Get candidates count
        const { count: totalCandidates } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'candidate')

        // Get recruiters count
        const { count: totalRecruiters } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'recruiter')

        // Get total jobs
        const { count: totalJobs } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true })

        // Get open jobs
        const { count: openJobs } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'open')

        // Get total applications
        const { count: totalApplications } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })

        // Get pending applications
        const { count: pendingApplications } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending')

        return {
            totalUsers: totalUsers || 0,
            totalCandidates: totalCandidates || 0,
            totalRecruiters: totalRecruiters || 0,
            totalJobs: totalJobs || 0,
            totalApplications: totalApplications || 0,
            pendingApplications: pendingApplications || 0,
            openJobs: openJobs || 0,
        }
    } catch (error) {
        console.error('Error fetching platform stats:', error)
        throw error
    }
}

export async function getAllUsers() {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error fetching users:', error)
        throw error
    }
}

export async function getAllJobs() {
    try {
        const { data, error } = await supabase
            .from('jobs')
            .select('*, profiles(full_name)')
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error fetching jobs:', error)
        throw error
    }
}

export async function getAllApplications() {
    try {
        const { data, error } = await supabase
            .from('applications')
            .select('*, profiles(full_name), jobs(title)')
            .order('applied_at', { ascending: false })

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error fetching applications:', error)
        throw error
    }
}

export async function deleteUserAsAdmin(userId: string) {
    try {
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId)

        if (error) throw error
    } catch (error) {
        console.error('Error deleting user:', error)
        throw error
    }
}

export async function deleteJobAsAdmin(jobId: string) {
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

export async function updateUserRole(userId: string, role: 'candidate' | 'recruiter' | 'admin') {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', userId)

        if (error) throw error
    } catch (error) {
        console.error('Error updating user role:', error)
        throw error
    }
}
