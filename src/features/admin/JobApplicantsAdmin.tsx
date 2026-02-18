import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, User, Mail, FileText, Ban, CheckCircle } from 'lucide-react'

interface Application {
    id: string
    status: string
    cover_letter: string
    resume_text: string
    email: string
    applied_at: string
    profiles: {
        id: string
        full_name: string
    }
}

export function JobApplicants() {
    const { jobId } = useParams<{ jobId: string }>()
    const [job, setJob] = useState<any>(null)
    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (jobId) {
            fetchData()
        }
    }, [jobId])

    async function fetchData() {
        try {
            // Fetch job details
            const { data: jobData } = await supabase
                .from('jobs')
                .select('*, profiles(full_name)')
                .eq('id', jobId as string)
                .single()

            setJob(jobData)

            // Fetch applications
            const { data: appsData, error } = await supabase
                .from('applications')
                .select('*, profiles(id, full_name, role)')
                .eq('job_id', jobId as string)
                .order('applied_at', { ascending: false })

            if (error) {
                console.error('Supabase fetch error:', error)
                throw error
            }

            console.log('Fetched admin apps:', appsData)
            setApplications(appsData || [])
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    async function disqualifyApplicant(applicationId: string) {
        if (!confirm('Are you sure you want to disqualify this applicant?')) {
            return
        }

        try {
            const { error } = await supabase
                .from('applications')
                // @ts-ignore
                .update({ status: 'rejected' } as any)
                .eq('id', applicationId)

            if (error) throw error

            setApplications(prev =>
                prev.map(app =>
                    app.id === applicationId ? { ...app, status: 'rejected' } : app
                )
            )
            alert('Applicant disqualified')
        } catch (error) {
            console.error('Error disqualifying applicant:', error)
            alert('Failed to disqualify applicant')
        }
    }

    async function approveApplicant(applicationId: string) {
        try {
            const { error } = await supabase
                .from('applications')
                // @ts-ignore
                .update({ status: 'shortlisted' } as any)
                .eq('id', applicationId)

            if (error) throw error

            setApplications(prev =>
                prev.map(app =>
                    app.id === applicationId ? { ...app, status: 'shortlisted' } : app
                )
            )
            alert('Applicant shortlisted')
        } catch (error) {
            console.error('Error approving applicant:', error)
            alert('Failed to approve applicant')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-muted">Loading applicants...</p>
            </div>
        )
    }

    if (!job) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-muted">Job not found</p>
            </div>
        )
    }

    const pendingCount = applications.filter(a => a.status === 'pending').length
    const shortlistedCount = applications.filter(a => a.status === 'shortlisted').length

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 md:px-12 lg:px-24 py-12">
                <Link
                    to="/admin/jobs"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Manage Jobs</span>
                </Link>

                <div className="mb-12">
                    <h1 className="text-4xl font-serif mb-2">{job.title}</h1>
                    <p className="text-muted">
                        Manage applicants for this job • Posted by {job.profiles?.full_name}
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-surface border border-border p-6 rounded-lg">
                        <div className="text-3xl font-bold mb-2">{applications.length}</div>
                        <h3 className="text-sm text-muted">Total Applicants</h3>
                    </div>
                    <div className="bg-surface border border-border p-6 rounded-lg">
                        <div className="text-3xl font-bold mb-2 text-green-400">{shortlistedCount}</div>
                        <h3 className="text-sm text-muted">Shortlisted</h3>
                    </div>
                    <div className="bg-surface border border-border p-6 rounded-lg">
                        <div className="text-3xl font-bold mb-2 text-orange-400">{pendingCount}</div>
                        <h3 className="text-sm text-muted">Pending Review</h3>
                    </div>
                </div>

                {/* Applications List */}
                {applications.length === 0 ? (
                    <div className="bg-surface border border-border rounded-lg p-12 text-center">
                        <User className="w-16 h-16 mx-auto mb-4 text-muted/30" />
                        <h3 className="text-xl font-medium mb-2">No Applications</h3>
                        <p className="text-muted">This job hasn't received any applications yet</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {applications.map((app) => (
                            <div
                                key={app.id}
                                className="bg-surface border border-border rounded-lg p-6"
                            >
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-3 mb-3">
                                            <h3 className="text-xl font-semibold">{app.profiles.full_name}</h3>
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${app.status === 'shortlisted'
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                : app.status === 'rejected'
                                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                }`}>
                                                {app.status}
                                            </span>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <p className="text-sm flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-muted" />
                                                <span className="text-muted">{app.email}</span>
                                            </p>

                                            <div className="text-sm">
                                                <p className="flex items-start gap-2 mb-1">
                                                    <FileText className="w-4 h-4 text-muted mt-0.5" />
                                                    <span className="text-muted font-medium">Cover Letter:</span>
                                                </p>
                                                <p className="text-muted/80 line-clamp-3 ml-6">{app.cover_letter}</p>
                                            </div>
                                        </div>

                                        <p className="text-xs text-muted/70">
                                            Applied on {new Date(app.applied_at).toLocaleDateString()}
                                        </p>
                                    </div>

                                    {app.status === 'pending' && (
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => approveApplicant(app.id)}
                                                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 transition-colors text-sm font-medium"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                <span>Shortlist</span>
                                            </button>
                                            <button
                                                onClick={() => disqualifyApplicant(app.id)}
                                                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 transition-colors text-sm font-medium"
                                            >
                                                <Ban className="w-4 h-4" />
                                                <span>Disqualify</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
