import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth'
import { Database } from '@/types/database.types'
import { Filter, User, Mail, Phone, Calendar, FileText, X } from 'lucide-react'

type ApplicationWithProfile = Database['public']['Tables']['applications']['Row'] & {
    profiles: Database['public']['Tables']['profiles']['Row']
    jobs: Database['public']['Tables']['jobs']['Row']
}

export function JobApplicants() {
    const { user } = useAuth()
    const [searchParams] = useSearchParams()
    const jobFilter = searchParams.get('job')

    const [applications, setApplications] = useState<ApplicationWithProfile[]>([])
    const [filteredApplications, setFilteredApplications] = useState<ApplicationWithProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedStatus, setSelectedStatus] = useState<string>('all')
    const [selectedJob, setSelectedJob] = useState<string>(jobFilter || 'all')
    const [selectedApp, setSelectedApp] = useState<ApplicationWithProfile | null>(null)
    const [jobs, setJobs] = useState<{ id: string; title: string }[]>([])

    useEffect(() => {
        if (user) {
            fetchApplicants()
        }
    }, [user])

    useEffect(() => {
        // Apply filters
        let filtered = applications

        if (selectedStatus !== 'all') {
            filtered = filtered.filter(app => app.status === selectedStatus)
        }

        if (selectedJob !== 'all') {
            filtered = filtered.filter(app => app.job_id === selectedJob)
        }

        setFilteredApplications(filtered)
    }, [applications, selectedStatus, selectedJob])

    async function fetchApplicants() {
        try {
            // First get jobs posted by this recruiter
            const { data: recruiterJobs, error: jobsError } = await supabase
                .from('jobs')
                .select('id, title')
                .eq('recruiter_id', user!.id)

            if (jobsError) throw jobsError

            setJobs((recruiterJobs as any) || [])
            const jobIds = (recruiterJobs as any)?.map((j: any) => j.id) || []

            if (jobIds.length === 0) {
                setLoading(false)
                return
            }

            // Then get applications for those jobs
            const { data, error } = await supabase
                .from('applications')
                .select('*, profiles(id, full_name, headline), jobs(title)')
                .in('job_id', jobIds)
                .order('applied_at', { ascending: false })

            if (error) throw error
            setApplications((data as any) || [])
            setFilteredApplications((data as any) || [])
        } catch (error) {
            console.error('Error fetching applicants:', error)
        } finally {
            setLoading(false)
        }
    }

    async function updateStatus(applicationId: string, status: 'shortlisted' | 'rejected') {
        try {
            // @ts-ignore
            const { error } = await supabase
                .from('applications')
                .update({ status } as any)
                .eq('id', applicationId)

            if (error) throw error

            setApplications(prev => prev.map(app =>
                app.id === applicationId ? { ...app, status } : app
            ))
        } catch (error) {
            console.error('Error updating status:', error)
            alert('Failed to update status')
        }
    }

    const statusCounts = {
        all: applications.length,
        pending: applications.filter(a => a.status === 'pending').length,
        shortlisted: applications.filter(a => a.status === 'shortlisted').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 md:px-12 lg:px-24 py-12">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-serif mb-2">Applicant Management</h1>
                    <p className="text-muted">Review and manage job applications</p>
                </div>

                {/* Filters */}
                <div className="bg-surface border border-border rounded-lg p-6 mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-muted" />
                        <h3 className="font-medium">Filters</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Status Filter */}
                        <div>
                            <label className="text-sm text-muted mb-2 block">Status</label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full bg-background border border-border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="all">All ({statusCounts.all})</option>
                                <option value="pending">Pending ({statusCounts.pending})</option>
                                <option value="shortlisted">Shortlisted ({statusCounts.shortlisted})</option>
                                <option value="rejected">Rejected ({statusCounts.rejected})</option>
                            </select>
                        </div>

                        {/* Job Filter */}
                        <div>
                            <label className="text-sm text-muted mb-2 block">Job Posting</label>
                            <select
                                value={selectedJob}
                                onChange={(e) => setSelectedJob(e.target.value)}
                                className="w-full bg-background border border-border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="all">All Jobs</option>
                                {jobs.map(job => (
                                    <option key={job.id} value={job.id}>{job.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Applications Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-muted">Loading applications...</p>
                    </div>
                ) : filteredApplications.length === 0 ? (
                    <div className="bg-surface border border-border rounded-lg p-12 text-center">
                        <User className="w-16 h-16 mx-auto mb-4 text-muted/30" />
                        <h3 className="text-xl font-medium mb-2">No applications found</h3>
                        <p className="text-muted">Try adjusting your filters or wait for candidates to apply</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredApplications.map((app) => (
                            <div
                                key={app.id}
                                className="group bg-surface border border-border rounded-lg p-6 hover:border-purple-500/50 transition-all duration-300"
                            >
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                    <div className="flex-1">
                                        {/* Candidate Info */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-xl font-semibold mb-1">{app.profiles.full_name}</h3>
                                                <p className="text-sm text-muted">{app.profiles.headline || 'No headline'}</p>
                                            </div>
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${app.status === 'shortlisted'
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                : app.status === 'rejected'
                                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                }`}>
                                                {app.status}
                                            </span>
                                        </div>

                                        {/* Job Applied For */}
                                        <div className="mb-4">
                                            <p className="text-sm">
                                                <span className="text-muted">Applied for:</span> <span className="font-medium">{app.jobs.title}</span>
                                            </p>
                                        </div>

                                        {/* Application Details */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted mb-4">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4" />
                                                <span>{app.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4" />
                                                <span>{app.phone || 'Not provided'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>{new Date(app.applied_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4" />
                                                <span>{app.years_experience} years experience</span>
                                            </div>
                                        </div>

                                        {/* View Details Button */}
                                        <button
                                            onClick={() => setSelectedApp(app)}
                                            className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                                        >
                                            <FileText className="w-4 h-4" />
                                            <span>View Full Application</span>
                                        </button>
                                    </div>

                                    {/* Actions */}
                                    {app.status === 'pending' && (
                                        <div className="flex md:flex-col gap-2">
                                            <button
                                                onClick={() => updateStatus(app.id, 'shortlisted')}
                                                className="flex-1 md:flex-none px-4 py-2 bg-green-600 hover:bg-green-500 transition-colors text-sm font-medium"
                                            >
                                                Shortlist
                                            </button>
                                            <button
                                                onClick={() => updateStatus(app.id, 'rejected')}
                                                className="flex-1 md:flex-none px-4 py-2 bg-red-600 hover:bg-red-500 transition-colors text-sm font-medium"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Application Detail Modal */}
                {selectedApp && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setSelectedApp(null)}>
                        <div className="bg-surface border border-border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="sticky top-0 bg-surface border-b border-border p-6 flex items-center justify-between">
                                <h2 className="text-2xl font-semibold">Application Details</h2>
                                <button
                                    onClick={() => setSelectedApp(null)}
                                    className="p-2 hover:bg-background rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <h3 className="font-medium mb-2">Candidate Information</h3>
                                    <div className="space-y-2 text-sm">
                                        <p><span className="text-muted">Name:</span> <span className="font-medium">{selectedApp.profiles.full_name}</span></p>
                                        <p><span className="text-muted">Email:</span> {selectedApp.email}</p>
                                        <p><span className="text-muted">Phone:</span> {selectedApp.phone || 'Not provided'}</p>
                                        <p><span className="text-muted">Experience:</span> {selectedApp.years_experience} years</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-medium mb-2">Cover Letter</h3>
                                    <p className="text-sm text-muted whitespace-pre-wrap">{selectedApp.cover_letter || 'No cover letter provided'}</p>
                                </div>

                                <div>
                                    <h3 className="font-medium mb-2">Resume</h3>
                                    <p className="text-sm text-muted whitespace-pre-wrap">{selectedApp.resume_text || 'No resume text available'}</p>
                                </div>

                                <div className="flex gap-2 pt-4 border-t border-border">
                                    {selectedApp.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    updateStatus(selectedApp.id, 'shortlisted')
                                                    setSelectedApp(null)
                                                }}
                                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 transition-colors font-medium"
                                            >
                                                Shortlist Candidate
                                            </button>
                                            <button
                                                onClick={() => {
                                                    updateStatus(selectedApp.id, 'rejected')
                                                    setSelectedApp(null)
                                                }}
                                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 transition-colors font-medium"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
