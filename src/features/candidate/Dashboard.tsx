import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Link } from 'react-router-dom'
import { User, Briefcase, TrendingUp, Sparkles, ClipboardList, Brain, MessageSquare, Video, Map as MapIcon } from 'lucide-react'
import { ApplicationTimeline } from './ApplicationTimeline'
import { useAuth } from '@/features/auth'
import { aiService } from '@/lib/aiService'
import { supabase } from '@/lib/supabase'

export function CandidateDashboard() {
    const { user } = useAuth()
    const [readinessTier, setReadinessTier] = useState<string | null>(null)
    const [readinessScore, setReadinessScore] = useState<number | null>(null)

    useEffect(() => {
        if (!user) return
        async function fetchReadiness() {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                const token = session?.access_token || ''
                const result = await aiService.getResult(user!.id, token)
                setReadinessTier(result.tier)
                setReadinessScore(result.overall_score)
            } catch { /* no result yet */ }
        }
        fetchReadiness()
    }, [user])

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8 relative">
                <div className="absolute -top-10 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/10 via-transparent to-transparent blur-3xl pointer-events-none" />
                <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <span className="text-sm uppercase tracking-widest text-purple-400 font-medium">Dashboard</span>
                    </div>
                    <h1 className="text-3xl font-serif bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-muted">Track your applications and find new opportunities.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
                {/* Profile Card */}
                <div className="group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                    <div className="relative p-6 bg-surface rounded-lg border border-border group-hover:border-purple-500/50 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-purple-500/10">
                        <User className="w-10 h-10 text-purple-400 mb-4" />
                        <h3 className="font-semibold text-lg mb-2">My Profile</h3>
                        <p className="text-sm text-muted mb-4">Update your skills and resume.</p>
                        <Link to="/profile">
                            <Button variant="outline" className="w-full border-border hover:border-purple-500/50">Edit Profile</Button>
                        </Link>
                    </div>
                </div>

                {/* Jobs Card */}
                <div className="group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                    <div className="relative p-6 bg-surface rounded-lg border border-border group-hover:border-blue-500/50 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-blue-500/10">
                        <Briefcase className="w-10 h-10 text-blue-400 mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Browse Jobs</h3>
                        <p className="text-sm text-muted mb-4">Discover new opportunities that match your skills.</p>
                        <Link to="/jobs">
                            <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 border-0">Explore Jobs</Button>
                        </Link>
                    </div>
                </div>

                {/* ATS Checker Card */}
                <div className="group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                    <div className="relative p-6 bg-surface rounded-lg border border-border group-hover:border-green-500/50 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-green-500/10">
                        <TrendingUp className="w-10 h-10 text-green-400 mb-4" />
                        <h3 className="font-semibold text-lg mb-2">ATS Resume Checker</h3>
                        <p className="text-sm text-muted mb-4">Optimize your resume for applicant tracking systems.</p>
                        <Link to="/ats-checker">
                            <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 border-0">Check Resume</Button>
                        </Link>
                    </div>
                </div>

                {/* Career Readiness Card */}
                <div className="group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                    <div className="relative p-6 bg-surface rounded-lg border border-border group-hover:border-purple-500/50 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-purple-500/10">
                        <Brain className="w-10 h-10 text-purple-400 mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Career Readiness</h3>
                        {readinessTier ? (
                            <div className="mb-4">
                                <span className={`text-sm font-medium px-2 py-1 rounded-full border ${
                                    readinessTier === 'ready'
                                        ? 'text-green-400 border-green-500/30 bg-green-500/10'
                                        : readinessTier === 'partial'
                                        ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
                                        : 'text-red-400 border-red-500/30 bg-red-500/10'
                                }`}>
                                    {readinessTier === 'ready' ? '🟢 Ready' : readinessTier === 'partial' ? '🟡 Partial' : '🔴 Not Ready'} — {readinessScore}%
                                </span>
                            </div>
                        ) : (
                            <p className="text-sm text-muted mb-4">Take the AI assessment to unlock job compatibility scores.</p>
                        )}
                        <Link to="/readiness">
                            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0">
                                {readinessTier ? 'Retake Assessment' : 'Start Assessment'}
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Roadmap Chatbot Card */}
                <div className="group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                    <div className="relative p-6 bg-surface rounded-lg border border-border group-hover:border-pink-500/50 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-pink-500/10">
                        <MessageSquare className="w-10 h-10 text-pink-400 mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Career Roadmap AI</h3>
                        <p className="text-sm text-muted mb-4">Chat with Aria to get a personalized week-by-week career plan.</p>
                        <Link to="/roadmap">
                            <Button className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 border-0">Chat with Aria</Button>
                        </Link>
                    </div>
                </div>

                {/* Video Interview Card */}
                <div className="group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-sky-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                    <div className="relative p-6 bg-surface rounded-lg border border-border group-hover:border-cyan-500/50 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-cyan-500/10">
                        <Video className="w-10 h-10 text-cyan-400 mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Video Interview AI</h3>
                        <p className="text-sm text-muted mb-4">Proctored video interview with real-time face detection and AI scoring.</p>
                        <Link to="/video-interview">
                            <Button className="w-full bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 border-0">Launch Video Bot</Button>
                        </Link>
                    </div>
                </div>

                {/* AI Interview Bot (Text) Card */}
                <div className="group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                    <div className="relative p-6 bg-surface rounded-lg border border-border group-hover:border-indigo-500/50 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-indigo-500/10">
                        <Brain className="w-10 h-10 text-indigo-400 mb-4" />
                        <h3 className="font-semibold text-lg mb-2">AI Interview Bot (Text)</h3>
                        <p className="text-sm text-muted mb-4">Practice interviews with a text-based AI and get instant feedback.</p>
                        <Link to="/interview">
                            <Button className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 border-0">Start Practice</Button>
                        </Link>
                    </div>
                </div>

                {/* Saved Roadmaps Card */}
                <div className="group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                    <div className="relative p-6 bg-surface rounded-lg border border-border group-hover:border-emerald-500/50 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-emerald-500/10">
                        <MapIcon className="w-10 h-10 text-emerald-400 mb-4" />
                        <h3 className="font-semibold text-lg mb-2">My Learning Paths</h3>
                        <p className="text-sm text-muted mb-4">Access your saved AI roadmap journeys and track your progress.</p>
                        <Link to="/my-roadmaps">
                            <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-0">View My Paths</Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Application Timeline Section */}
            <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                    <ClipboardList className="w-6 h-6 text-purple-400" />
                    <h2 className="text-2xl font-serif bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                        My Applications
                    </h2>
                </div>
                <ApplicationTimeline />
            </div>
        </div>
    )
}
