import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { MapPin, Briefcase, DollarSign, Clock, Building2, ArrowLeft, CheckCircle } from 'lucide-react'
import { Database } from '@/types/database.types'
import { useAuth } from '@/features/auth'

type Job = Database['public']['Tables']['jobs']['Row']

export function JobDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user, profile } = useAuth()
    const [job, setJob] = useState<Job | null>(null)
    const [loading, setLoading] = useState(true)
    const [isApplied, setIsApplied] = useState(false)
    const [applying, setApplying] = useState(false)

    useEffect(() => {
        fetchJob()
        if (user && profile?.role === 'candidate') {
            checkApplicationStatus()
        }
    }, [id, user])

    const fetchJob = async () => {
        if (!id) return

        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            console.error('Error fetching job:', error)
        } else {
            setJob(data)
        }
        setLoading(false)
    }

    const checkApplicationStatus = async () => {
        if (!id || !user) return

        const { data } = await supabase
            .from('applications')
            .select('id')
            .eq('job_id', id)
            .eq('candidate_id', user.id)
            .single()

        setIsApplied(!!data)
    }

    const handleApply = async () => {
        if (!user || !id) {
            navigate('/login')
            return
        }

        if (profile?.role !== 'candidate') {
            return alert('Only candidates can apply for jobs')
        }

        setApplying(true)
        const { error } = await supabase
            .from('applications')
            .insert({
                job_id: id as string,
                candidate_id: user.id as string,
                full_name: (profile?.full_name || user.user_metadata?.full_name || '') as string,
                email: (user.email || '') as string,
                status: 'pending'
            } as any)

        if (error) {
            console.error('Error applying:', error)
        } else {
            setIsApplied(true)
        }
        setApplying(false)
    }

    if (loading) {
        return <div className="container mx-auto px-4 py-8">Loading...</div>
    }

    if (!job) {
        return <div className="container mx-auto px-4 py-8">Job not found</div>
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-muted hover:text-purple-400 transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to jobs
                </button>

                <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 opacity-50 blur-3xl" />

                    <div className="relative bg-surface p-8 rounded-xl border border-border">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 rounded-full text-xs font-semibold capitalize">
                                        {job.type}
                                    </span>
                                    {isApplied && (
                                        <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-300 rounded-full text-xs font-semibold flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            Applied
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-2">
                                    {job.title}
                                </h1>
                                <div className="flex items-center gap-2 text-muted mb-4">
                                    <Building2 className="w-4 h-4 text-purple-400" />
                                    <span className="font-medium">Company Name</span>
                                </div>
                            </div>

                            {(!profile || profile?.role === 'candidate') && (
                                <Button
                                    onClick={handleApply}
                                    disabled={isApplied || applying}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0 shadow-lg shadow-purple-500/20"
                                >
                                    {applying ? 'Applying...' : isApplied ? 'Application Sent' : 'Apply Now'}
                                </Button>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-muted mb-8 pb-8 border-b border-border">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-purple-400" />
                                {job.location}
                            </div>
                            <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-blue-400" />
                                {job.type}
                            </div>
                            {job.salary_range && (
                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-green-400" />
                                    {job.salary_range}
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-orange-400" />
                                Posted {new Date(job.created_at).toLocaleDateString()}
                            </div>
                        </div>

                        <div className="prose prose-invert max-w-none">
                            <h2 className="text-xl font-semibold mb-4 text-foreground">Job Description</h2>
                            <p className="text-muted leading-relaxed whitespace-pre-wrap">
                                {job.description}
                            </p>

                            {job && (job as any).requirements && (
                                <>
                                    <h2 className="text-xl font-semibold mb-4 mt-8 text-foreground">Requirements</h2>
                                    <p className="text-muted leading-relaxed whitespace-pre-wrap">
                                        {(job as any).requirements}
                                    </p>
                                </>
                            )}
                        </div>

                        {(!profile || profile?.role === 'candidate') && (
                            <div className="mt-8 pt-8 border-t border-border">
                                <Button
                                    onClick={handleApply}
                                    disabled={isApplied || applying}
                                    className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0 shadow-lg shadow-purple-500/20"
                                >
                                    {applying ? 'Applying...' : isApplied ? 'Application Sent' : 'Apply for this Position'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
