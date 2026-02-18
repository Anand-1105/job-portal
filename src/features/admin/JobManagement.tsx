import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllJobs, deleteJobAsAdmin } from '@/lib/adminService'
import { supabase } from '@/lib/supabase'
import { Briefcase, MapPin, DollarSign, Trash2, User, Users, Ban } from 'lucide-react'

export function JobManagement() {
    const [jobs, setJobs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [filteredJobs, setFilteredJobs] = useState<any[]>([])

    useEffect(() => {
        fetchJobs()
    }, [])

    useEffect(() => {
        if (statusFilter === 'all') {
            setFilteredJobs(jobs)
        } else {
            setFilteredJobs(jobs.filter(j => j.status === statusFilter))
        }
    }, [jobs, statusFilter])

    async function fetchJobs() {
        try {
            const data = await getAllJobs()
            console.log('Admin Job Management Data:', data)
            setJobs(data || [])
            setFilteredJobs(data || [])
        } catch (error) {
            console.error('Error fetching jobs:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(jobId: string, jobTitle: string) {
        if (!confirm(`Are you sure you want to delete "${jobTitle}"? This action cannot be undone.`)) {
            return
        }

        try {
            await deleteJobAsAdmin(jobId)
            setJobs(prev => prev.filter(j => j.id !== jobId))
            alert('Job deleted successfully')
        } catch (error) {
            console.error('Error deleting job:', error)
            alert('Failed to delete job')
        }
    }

    async function handleDelistJob(jobId: string, currentStatus: string) {
        const newStatus = currentStatus === 'open' ? 'closed' : 'open'
        const action = newStatus === 'closed' ? 'delist' : 'reopen'

        if (!confirm(`Are you sure you want to ${action} this job?`)) {
            return
        }

        try {
            const { error } = await supabase
                .from('jobs')
                .update({ status: newStatus } as any)
                .eq('id', jobId)

            if (error) throw error

            setJobs(prev => prev.map(j =>
                j.id === jobId ? { ...j, status: newStatus } : j
            ))
            alert(`Job ${action === 'delist' ? 'delisted' : 'reopened'} successfully`)
        } catch (error) {
            console.error('Error updating job status:', error)
            alert('Failed to update job status')
        }
    }

    const statusCounts = {
        all: jobs.length,
        open: jobs.filter(j => j.status === 'open').length,
        closed: jobs.filter(j => j.status === 'closed').length,
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 md:px-12 lg:px-24 py-12">
                <div className="mb-8">
                    <h1 className="text-4xl font-serif mb-2">Manage Jobs</h1>
                    <p className="text-muted">Monitor, moderate, and manage all job postings on the platform</p>
                </div>

                {/* Filters */}
                <div className="bg-surface border border-border rounded-lg p-6 mb-8">
                    <div>
                        <label className="text-sm text-muted mb-2 block">Filter by Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full md:w-64 bg-background border border-border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="all">All Jobs ({statusCounts.all})</option>
                            <option value="open">Open ({statusCounts.open})</option>
                            <option value="closed">Closed ({statusCounts.closed})</option>
                        </select>
                    </div>
                </div>

                {/* Jobs List */}
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-muted">Loading jobs...</p>
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div className="bg-surface border border-border rounded-lg p-12 text-center">
                        <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted/30" />
                        <h3 className="text-xl font-medium mb-2">No jobs found</h3>
                        <p className="text-muted">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredJobs.map((job) => (
                            <div
                                key={job.id}
                                className="bg-surface border border-border rounded-lg p-6 hover:border-purple-500/50 transition-all duration-300"
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

                                        <p className="text-sm text-muted line-clamp-2 mb-4">{job.description}</p>

                                        <div className="flex flex-wrap gap-4 text-sm text-muted mb-3">
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
                                        </div>

                                        <p className="text-xs text-muted/70 flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            Posted by{' '}
                                            <Link
                                                to={`/admin/recruiter/${job.recruiter_id}`}
                                                className="text-blue-400 hover:text-blue-300 underline"
                                            >
                                                {job.profiles?.full_name || 'Unknown'}
                                            </Link>
                                            {' '}on {new Date(job.created_at).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Link
                                            to={`/admin/job/${job.id}/applicants`}
                                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 transition-colors text-sm font-medium"
                                        >
                                            <Users className="w-4 h-4" />
                                            <span>View Applicants</span>
                                        </Link>
                                        <button
                                            onClick={() => handleDelistJob(job.id, job.status)}
                                            className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 transition-colors text-sm font-medium"
                                        >
                                            <Ban className="w-4 h-4" />
                                            <span>{job.status === 'open' ? 'Delist' : 'Reopen'}</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(job.id, job.title)}
                                            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 transition-colors text-sm font-medium"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span>Delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
