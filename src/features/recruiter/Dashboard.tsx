import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users, Briefcase, Clock, CheckCircle2, MapPin, DollarSign, Eye } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { getRecruiterStats, getRecruiterJobs, type RecruiterStats, type JobWithApplicantCount } from '@/lib/recruiterService'

export function RecruiterDashboard() {
    const { user } = useAuth()
    const [stats, setStats] = useState<RecruiterStats>({ totalJobs: 0, totalApplicants: 0, pendingReviews: 0, shortlisted: 0 })
    const [jobs, setJobs] = useState<JobWithApplicantCount[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) {
            fetchDashboardData()
        }
    }, [user])

    async function fetchDashboardData() {
        if (!user) return

        try {
            const [statsData, jobsData] = await Promise.all([
                getRecruiterStats(user.id),
                getRecruiterJobs(user.id)
            ])
            console.log('Recruiter Dashboard Data:', { userId: user.id, stats: statsData, jobs: jobsData })
            setStats(statsData)
            setJobs(jobsData)
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 md:px-12 lg:px-24 py-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
                    <div>
                        <h1 className="text-4xl font-serif mb-2">Recruiter Dashboard</h1>
                        <p className="text-muted">Manage your jobs and review applicants</p>
                    </div>
                    <Link
                        to="/recruiter/jobs/new"
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-6 py-3 transition-all duration-300 shadow-lg shadow-purple-500/20"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="font-medium">Post New Job</span>
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-muted">Loading dashboard...</p>
                    </div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                            {/* Total Jobs */}
                            <div className="group relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative bg-surface border border-border p-6 rounded-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
                                            <Briefcase className="w-6 h-6 text-white" />
                                        </div>
                                        <span className="text-3xl font-bold">{stats.totalJobs}</span>
                                    </div>
                                    <h3 className="text-sm font-medium text-muted">Total Jobs</h3>
                                    <p className="text-xs text-muted/70 mt-1">Active postings</p>
                                </div>
                            </div>

                            {/* Total Applicants */}
                            <div className="group relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative bg-surface border border-border p-6 rounded-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg">
                                            <Users className="w-6 h-6 text-white" />
                                        </div>
                                        <span className="text-3xl font-bold">{stats.totalApplicants}</span>
                                    </div>
                                    <h3 className="text-sm font-medium text-muted">Total Applicants</h3>
                                    <p className="text-xs text-muted/70 mt-1">All applications</p>
                                </div>
                            </div>

                            {/* Pending Reviews */}
                            <div className="group relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative bg-surface border border-border p-6 rounded-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg">
                                            <Clock className="w-6 h-6 text-white" />
                                        </div>
                                        <span className="text-3xl font-bold">{stats.pendingReviews}</span>
                                    </div>
                                    <h3 className="text-sm font-medium text-muted">Pending Reviews</h3>
                                    <p className="text-xs text-muted/70 mt-1">Awaiting action</p>
                                </div>
                            </div>

                            {/* Shortlisted */}
                            <div className="group relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative bg-surface border border-border p-6 rounded-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg">
                                            <CheckCircle2 className="w-6 h-6 text-white" />
                                        </div>
                                        <span className="text-3xl font-bold">{stats.shortlisted}</span>
                                    </div>
                                    <h3 className="text-sm font-medium text-muted">Shortlisted</h3>
                                    <p className="text-xs text-muted/70 mt-1">Top candidates</p>
                                </div>
                            </div>
                        </div>

                        {/* Jobs Section */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-serif">Your Job Postings</h2>
                                <Link
                                    to="/recruiter/applicants"
                                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                                >
                                    <span>View All Applicants</span>
                                    <span>→</span>
                                </Link>
                            </div>

                            {jobs.length === 0 ? (
                                <div className="bg-surface border border-border rounded-lg p-12 text-center">
                                    <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted/30" />
                                    <h3 className="text-xl font-medium mb-2">No jobs posted yet</h3>
                                    <p className="text-muted mb-6">Start by posting your first job opportunity</p>
                                    <Link
                                        to="/recruiter/jobs/new"
                                        className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-6 py-3 transition-all duration-300"
                                    >
                                        <Plus className="w-5 h-5" />
                                        <span>Post Your First Job</span>
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {jobs.map((job) => (
                                        <div
                                            key={job.id}
                                            className="group bg-surface border border-border rounded-lg p-6 hover:border-purple-500/50 transition-all duration-300"
                                        >
                                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-start gap-3 mb-3">
                                                        <h3 className="text-xl font-semibold group-hover:text-purple-400 transition-colors">
                                                            {job.title}
                                                        </h3>
                                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${job.status === 'open'
                                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                            }`}>
                                                            {job.status}
                                                        </span>
                                                    </div>

                                                    <p className="text-sm text-muted line-clamp-2 mb-4">{job.description}</p>

                                                    <div className="flex flex-wrap gap-4 text-sm text-muted">
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-4 h-4" />
                                                            {job.location}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Briefcase className="w-4 h-4" />
                                                            {job.type}
                                                        </span>
                                                        {job.salary_range && (
                                                            <span className="flex items-center gap-1">
                                                                <DollarSign className="w-4 h-4" />
                                                                {job.salary_range}
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-4 h-4" />
                                                            {job.applicant_count} applicant{job.applicant_count !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex md:flex-col gap-2">
                                                    <Link
                                                        to={`/recruiter/applicants?job=${job.id}`}
                                                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 transition-colors text-sm font-medium whitespace-nowrap"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        <span>View Applicants</span>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
