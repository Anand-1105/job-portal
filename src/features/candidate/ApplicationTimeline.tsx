import { useEffect, useState } from 'react'
import { CheckCircle, Circle, Clock, XCircle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth'
import { Database } from '@/types/database.types'

type Application = Database['public']['Tables']['applications']['Row'] & {
    jobs: Database['public']['Tables']['jobs']['Row']
}

export function ApplicationTimeline() {
    const { user } = useAuth()
    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) return

        fetchApplications()

        // Subscribe to real-time changes
        const channel = supabase
            .channel('application_status_updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'applications',
                    filter: `candidate_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('Real-time update received:', payload)
                    setApplications(prev => prev.map(app =>
                        app.id === payload.new.id ? { ...app, status: payload.new.status } : app
                    ))
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user])

    async function fetchApplications() {
        try {
            const { data, error } = await supabase
                .from('applications')
                .select('*, jobs(*)')
                .eq('candidate_id', user!.id)
                .order('applied_at', { ascending: false })

            if (error) throw error
            setApplications(data as any || [])
        } catch (error) {
            console.error('Error fetching applications:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'shortlisted':
                return <CheckCircle className="w-5 h-5 text-green-400" />
            case 'rejected':
                return <XCircle className="w-5 h-5 text-red-400" />
            case 'pending':
                return <Clock className="w-5 h-5 text-yellow-400" />
            default:
                return <Circle className="w-5 h-5 text-muted" />
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'shortlisted':
                return 'Shortlisted'
            case 'rejected':
                return 'Not Selected'
            case 'pending':
                return 'Review in Progress'
            default:
                return 'Applied'
        }
    }

    if (loading) {
        return (
            <div className="text-center py-12">
                <p className="text-muted">Loading your applications...</p>
            </div>
        )
    }

    if (applications.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted mb-4">You haven't applied to any jobs yet.</p>
                <Link
                    to="/jobs"
                    className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                >
                    Browse Jobs <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {applications.map((application) => (
                <div key={application.id} className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-50 blur-2xl" />

                    <div className="relative bg-surface p-6 rounded-xl border border-border hover:border-purple-500/50 transition-all duration-300">
                        <div className="mb-8">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-xl font-semibold mb-1">{application.jobs.title}</h3>
                                    <p className="text-sm text-muted">
                                        {application.jobs.location} • {application.jobs.type}
                                    </p>
                                </div>
                                <span className="px-3 py-1 bg-surface border border-border text-muted rounded-full text-xs font-medium">
                                    Applied {new Date(application.applied_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        {/* Status Tracks */}
                        <div className="relative">
                            <div className="absolute top-5 left-5 right-5 h-0.5 bg-border -z-10" />

                            <div className="flex justify-between items-start">
                                {/* Step 1: Applied */}
                                <div className="flex flex-col items-center">
                                    <div className="w-10 h-10 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mb-2">
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                    </div>
                                    <span className="text-xs font-medium text-green-400">Applied</span>
                                </div>

                                {/* Step 2: Under Review */}
                                <div className="flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mb-2 
                                        ${application.status !== 'pending'
                                            ? 'bg-green-500/20 border-green-500'
                                            : 'bg-yellow-500/20 border-yellow-500'}`}>
                                        {application.status !== 'pending'
                                            ? <CheckCircle className="w-5 h-5 text-green-400" />
                                            : <Clock className="w-5 h-5 text-yellow-400" />
                                        }
                                    </div>
                                    <span className={`text-xs font-medium ${application.status !== 'pending' ? 'text-green-400' : 'text-yellow-400'}`}>
                                        {application.status !== 'pending' ? 'Reviewed' : 'In Review'}
                                    </span>
                                </div>

                                {/* Step 3: Decision */}
                                <div className="flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mb-2
                                        ${application.status === 'shortlisted' ? 'bg-green-500/20 border-green-500' :
                                            application.status === 'rejected' ? 'bg-red-500/20 border-red-500' :
                                                'bg-surface border-border'}`}>
                                        {getStatusIcon(application.status)}
                                    </div>
                                    <span className={`text-xs font-medium 
                                        ${application.status === 'shortlisted' ? 'text-green-400' :
                                            application.status === 'rejected' ? 'text-red-400' :
                                                'text-muted'}`}>
                                        {getStatusText(application.status)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Additional info for shortlisted */}
                        {application.status === 'shortlisted' && (
                            <div className="mt-8 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                                <p className="text-sm text-green-300">
                                    <span className="font-semibold">Congratulations!</span> You've been shortlisted for this role. The recruiter will contact you soon for the next steps.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
