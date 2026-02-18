import { Button } from '@/components/ui/Button'
import { Link } from 'react-router-dom'
import { User, Briefcase, TrendingUp, Sparkles, ClipboardList } from 'lucide-react'
import { ApplicationTimeline } from './ApplicationTimeline'

export function CandidateDashboard() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8 relative">
                {/* Background gradient */}
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
