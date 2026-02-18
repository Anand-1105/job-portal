import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Briefcase, Users, MapPin, Calendar, Trash2, ArrowLeft } from 'lucide-react'

interface RecruiterProfile {
    id: string
    full_name: string
    email: string
    created_at: string
    role: string
}

interface Job {
    id: string
    title: string
    location: string
    type: string
    status: string
    created_at: string
    applicant_count?: number
}

export function RecruiterProfile() {
    const { recruiterId } = useParams<{ recruiterId: string }>()
    const [recruiter, setRecruiter] = useState<RecruiterProfile | null>(null)
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (recruiterId) {
            fetchRecruiterData()
        }
    }, [recruiterId])

    async function fetchRecruiterData() {
        try {
            // Fetch recruiter profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*, auth.users(email)')
                .eq('id', recruiterId)
                .single()

            // Get email from auth.users
            const { data: userData } = await supabase.auth.admin.getUserById(recruiterId!)

            setRecruiter({
                id: profileData.id,
                full_name: profileData.full_name,
                email: userData.user?.email || 'N/A',
                created_at: profileData.created_at,
                role: profileData.role
            })

            // Fetch recruiter's jobs with applicant counts
            const { data: jobsData } = await supabase
                .from('jobs')
                .select(`
                    *,
                    applications(count)
                `)
                .eq('recruiter_id', recruiterId)
                .order('created_at', { ascending: false })

            const jobsWithCounts = jobsData?.map(job => ({
                ...job,
                applicant_count: job.applications?.[0]?.count || 0
            })) || []

            setJobs(jobsWithCounts)
        } catch (error) {
            console.error('Error fetching recruiter data:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleRemoveRecruiter() {
        if (!confirm(`Are you sure you want to remove ${recruiter?.full_name}? This will delete their account and all associated jobs.`)) {
            return
        }

        try {
            // Delete recruiter profile (cascading will handle jobs and applications)
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', recruiterId)

            if (error) throw error

            alert('Recruiter removed successfully')
            window.location.href = '/admin/users'
        } catch (error) {
            console.error('Error removing recruiter:', error)
            alert('Failed to remove recruiter')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-muted">Loading recruiter profile...</p>
            </div>
        )
    }

    if (!recruiter) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-muted">Recruiter not found</p>
            </div>
        )
    }

    const totalJobs = jobs.length
    const openJobs = jobs.filter(j => j.status === 'open').length
    const totalApplicants = jobs.reduce((sum, job) => sum + (job.applicant_count || 0), 0)

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 md:px-12 lg:px-24 py-12">
                {/* Header */}
                <Link
                    to="/admin/jobs"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Manage Jobs</span>
                </Link>

                <div className="mb-12">
                    <h1 className="text-4xl font-serif mb-2">{recruiter.full_name}</h1>
                    <p className="text-muted">Recruiter Profile & Activity</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-surface border border-border p-6 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                            <Briefcase className="w-8 h-8 text-purple-400" />
                            <span className="text-3xl font-bold">{totalJobs}</span>
                        </div>
                        <h3 className="text-sm text-muted">Total Jobs Posted</h3>
                        <p className="text-xs text-muted/70 mt-1">{openJobs} currently open</p>
                    </div>

                    <div className="bg-surface border border-border p-6 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                            <Users className="w-8 h-8 text-blue-400" />
                            <span className="text-3xl font-bold">{totalApplicants}</span>
                        </div>
                        <h3 className="text-sm text-muted">Total Applicants</h3>
                        <p className="text-xs text-muted/70 mt-1">Across all jobs</p>
                    </div>

                    <div className="bg-surface border border-border p-6 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                            <Calendar className="w-8 h-8 text-green-400" />
                            <span className="text-sm font-medium">{new Date(recruiter.created_at).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-sm text-muted">Member Since</h3>
                        <p className="text-xs text-muted/70 mt-1">{recruiter.email}</p>
                    </div>
                </div>

                {/* Jobs List */}
                <div className="mb-8">
                    <h2 className="text-2xl font-serif mb-6">Posted Jobs</h2>
                    {jobs.length === 0 ? (
                        <div className="bg-surface border border-border rounded-lg p-12 text-center">
                            <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted/30" />
                            <h3 className="text-xl font-medium mb-2">No jobs posted</h3>
                            <p className="text-muted">This recruiter hasn't posted any jobs yet</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {jobs.map((job) => (
                                <div
                                    key={job.id}
                                    className="bg-surface border border-border rounded-lg p-6 hover:border-purple-500/50 transition-all"
                                >
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-start gap-3 mb-3">
                                                <h3 className="text-xl font-semibold">{job.title}</h3>
                                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${job.status === 'open'
                                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                    }`}>
                                                    {job.status}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-4 text-sm text-muted mb-2">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />
                                                    {job.location}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Briefcase className="w-4 h-4" />
                                                    {job.type}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-4 h-4" />
                                                    {job.applicant_count || 0} applicants
                                                </span>
                                            </div>

                                            <p className="text-xs text-muted/70">
                                                Posted on {new Date(job.created_at).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <Link
                                            to={`/admin/job/${job.id}/applicants`}
                                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 transition-colors text-sm font-medium"
                                        >
                                            <Users className="w-4 h-4" />
                                            <span>View Applicants</span>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Danger Zone */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                    <h2 className="text-xl font-serif mb-2 text-red-400">Danger Zone</h2>
                    <p className="text-sm text-muted mb-4">
                        Removing this recruiter will permanently delete their account and all associated jobs and applications.
                    </p>
                    <button
                        onClick={handleRemoveRecruiter}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 transition-colors font-medium"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Remove Recruiter</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
