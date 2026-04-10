import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { MapPin, Briefcase, DollarSign, Clock, Building2, ArrowLeft, CheckCircle, Wand2, Mail, Copy, Check } from 'lucide-react'
import { Database } from '@/types/database.types'
import { useAuth } from '@/features/auth'
import { aiService } from '@/lib/aiService'

type Job = Database['public']['Tables']['jobs']['Row']

export function JobDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user, profile } = useAuth()
    const [job, setJob] = useState<Job | null>(null)
    const [loading, setLoading] = useState(true)
    const [isApplied, setIsApplied] = useState(false)
    const [applying, setApplying] = useState(false)

    // AI actions state
    const [tailoring, setTailoring] = useState(false)
    const [tailoredResume, setTailoredResume] = useState<string | null>(null)
    const [generatingEmail, setGeneratingEmail] = useState(false)
    const [applyingLinkedin, setApplyingLinkedin] = useState(false)
    const [coldEmail, setColdEmail] = useState<{ subject: string; body: string; hiring_manager_email?: string } | null>(null)
    const [copied, setCopied] = useState(false)

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
            .maybeSingle()

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

    async function handleAutoApplyLinkedIn() {
        if (!user || !id) return
        
        // Improve URL detection logic
        let jobUrl = (job as any)?.source_url || null
        
        if (!jobUrl || !jobUrl.includes('linkedin.com')) {
            const urlMatch = job?.description.match(/https?:\/\/(www\.)?linkedin\.com\/jobs\/view\/(\d+)/i) || 
                             job?.description.match(/https?:\/\/[^\s]+linkedin[^\s]+/i)
            jobUrl = urlMatch ? urlMatch[0] : null
        }
        
        // Manual Fallback if still no URL
        if (!jobUrl) {
            const manualUrl = window.prompt("We couldn't find a LinkedIn URL for this job. Please paste the LinkedIn Job URL below to start the bot:")
            if (!manualUrl) return
            if (!manualUrl.includes('linkedin.com')) {
                return alert("Please provide a valid LinkedIn link (e.g., linkedin.com/jobs/view/...)")
            }
            jobUrl = manualUrl
        }
        
        setApplyingLinkedin(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token || ''
            
            console.log(`[LinkedIn-Apply] Starting agent for: ${jobUrl}`)
            const result = await aiService.applyToLinkedIn(user.id, jobUrl, token)
            
            if (result.success) {
                alert('Success: ' + result.message)
            } else {
                alert('Bot Progress: ' + result.message)
            }
        } catch (e: any) {
            alert(e.message || 'Failed to start AI agent.')
        } finally {
            setApplyingLinkedin(false)
        }
    }

    async function handleTailorResume() {
        if (!user || !id) return
        setTailoring(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token || ''
            const result = await aiService.tailorResume(user.id, id, token)
            setTailoredResume(result.tailored_resume)
        } catch (e: any) {
            alert(e.message || 'Failed to tailor resume. Make sure you have saved your profile with resume text.')
        } finally {
            setTailoring(false)
        }
    }

    async function handleGenerateColdEmail() {
        if (!user || !id) return
        setGeneratingEmail(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token || ''
            const result = await aiService.generateColdEmail(user.id, id, token)
            setColdEmail(result)
        } catch (e: any) {
            alert(e.message || 'Failed to generate email.')
        } finally {
            setGeneratingEmail(false)
        }
    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
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
                            <div className="mt-8 pt-8 border-t border-border space-y-4">
                                <Button
                                    onClick={handleApply}
                                    disabled={isApplied || applying}
                                    className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0 shadow-lg shadow-purple-500/20"
                                >
                                    {applying ? 'Applying...' : isApplied ? 'Application Sent' : 'Apply for this Position'}
                                </Button>

                                {/* AI Action Buttons */}
                                <div className="flex flex-wrap gap-3 pt-2">
                                    <button onClick={handleAutoApplyLinkedIn} disabled={applyingLinkedin}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/40 hover:from-cyan-600/30 hover:to-blue-600/30 text-cyan-300 text-sm rounded-lg transition-all disabled:opacity-40 animate-pulse-subtle">
                                        <Wand2 className="w-4 h-4" />
                                        {applyingLinkedin ? 'Bot Running...' : 'Autonomous Apply (LinkedIn)'}
                                    </button>
                                    <button onClick={handleTailorResume} disabled={tailoring}
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/40 hover:bg-purple-600/30 text-purple-300 text-sm rounded-lg transition-all disabled:opacity-40">
                                        <Wand2 className="w-4 h-4" />
                                        {tailoring ? 'Tailoring...' : 'Tailor Resume'}
                                    </button>
                                    <button onClick={handleGenerateColdEmail} disabled={generatingEmail}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600/30 text-blue-300 text-sm rounded-lg transition-all disabled:opacity-40">
                                        <Mail className="w-4 h-4" />
                                        {generatingEmail ? 'Generating...' : 'Generate Cold Email'}
                                    </button>
                                </div>

                                {/* Tailored Resume Result */}
                                {tailoredResume && (
                                    <div className="bg-black/40 border border-purple-500/30 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-sm font-medium text-purple-300">Tailored Resume</h3>
                                            <button onClick={() => copyToClipboard(tailoredResume)}
                                                className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors">
                                                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                                {copied ? 'Copied!' : 'Copy'}
                                            </button>
                                        </div>
                                        <pre className="whitespace-pre-wrap text-xs text-muted leading-relaxed max-h-64 overflow-y-auto">
                                            {tailoredResume}
                                        </pre>
                                    </div>
                                )}

                                {/* Cold Email Result */}
                                {coldEmail && (
                                    <div className="bg-black/40 border border-blue-500/30 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-sm font-medium text-blue-300">Cold Email Draft</h3>
                                            <button onClick={() => copyToClipboard(`Subject: ${coldEmail.subject}\n\n${coldEmail.body}`)}
                                                className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors">
                                                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                                {copied ? 'Copied!' : 'Copy'}
                                            </button>
                                        </div>
                                        {coldEmail.hiring_manager_email && (
                                            <p className="text-xs text-green-400 mb-2">To: {coldEmail.hiring_manager_email}</p>
                                        )}
                                        <p className="text-xs font-medium text-foreground mb-2">Subject: {coldEmail.subject}</p>
                                        <pre className="whitespace-pre-wrap text-xs text-muted leading-relaxed">
                                            {coldEmail.body}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
