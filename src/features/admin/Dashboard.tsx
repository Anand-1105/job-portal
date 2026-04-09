import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Briefcase, FileText, UserCheck, Building, TrendingUp, Activity, Brain, RefreshCw } from 'lucide-react'
import { getPlatformStats, type PlatformStats } from '@/lib/adminService'

export function AdminDashboard() {
    const [stats, setStats] = useState<PlatformStats>({
        totalUsers: 0,
        totalCandidates: 0,
        totalRecruiters: 0,
        totalJobs: 0,
        totalApplications: 0,
        pendingApplications: 0,
        openJobs: 0,
    })
    const [loading, setLoading] = useState(true)
    const [scraping, setScraping] = useState(false)
    const [scrapeMsg, setScrapeMsg] = useState('')

    useEffect(() => {
        fetchStats()
    }, [])

    async function fetchStats() {
        try {
            const data = await getPlatformStats()
            setStats(data)
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleScrapeJobs() {
        setScraping(true)
        setScrapeMsg('')
        try {
            const { supabase } = await import('@/lib/supabase')
            const { aiService } = await import('@/lib/aiService')
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token || ''
            const result = await aiService.scrapeJobs('software engineer', 'India', token)
            setScrapeMsg(`✓ Imported ${result.inserted} jobs from LinkedIn`)
            fetchStats()
        } catch (e: any) {
            setScrapeMsg(`✗ ${e.message || 'Scrape failed'}`)
        } finally {
            setScraping(false)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 md:px-12 lg:px-24 py-12">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-serif mb-2">Admin Dashboard</h1>
                            <p className="text-muted">Platform overview and management</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <button onClick={handleScrapeJobs} disabled={scraping}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 transition-colors text-sm">
                                <RefreshCw className={`w-4 h-4 ${scraping ? 'animate-spin' : ''}`} />
                                {scraping ? 'Scraping LinkedIn...' : 'Sync LinkedIn Jobs'}
                            </button>
                            {scrapeMsg && <p className="text-xs text-muted">{scrapeMsg}</p>}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-muted">Loading dashboard...</p>
                    </div>
                ) : (
                    <>
                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                            {/* Total Users */}
                            <div className="group relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative bg-surface border border-border p-6 rounded-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg">
                                            <Users className="w-6 h-6 text-white" />
                                        </div>
                                        <span className="text-3xl font-bold">{stats.totalUsers}</span>
                                    </div>
                                    <h3 className="text-sm font-medium text-muted">Total Users</h3>
                                    <p className="text-xs text-muted/70 mt-1">
                                        {stats.totalCandidates} candidates, {stats.totalRecruiters} recruiters
                                    </p>
                                </div>
                            </div>

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
                                    <p className="text-xs text-muted/70 mt-1">{stats.openJobs} currently open</p>
                                </div>
                            </div>

                            {/* Total Applications */}
                            <div className="group relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative bg-surface border border-border p-6 rounded-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg">
                                            <FileText className="w-6 h-6 text-white" />
                                        </div>
                                        <span className="text-3xl font-bold">{stats.totalApplications}</span>
                                    </div>
                                    <h3 className="text-sm font-medium text-muted">Total Applications</h3>
                                    <p className="text-xs text-muted/70 mt-1">{stats.pendingApplications} pending</p>
                                </div>
                            </div>

                            {/* Platform Activity */}
                            <div className="group relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative bg-surface border border-border p-6 rounded-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg">
                                            <Activity className="w-6 h-6 text-white" />
                                        </div>
                                        <span className="text-3xl font-bold">
                                            {stats.totalApplications > 0
                                                ? Math.round((stats.totalApplications / stats.totalJobs) * 10) / 10
                                                : 0}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-medium text-muted">Avg Apps/Job</h3>
                                    <p className="text-xs text-muted/70 mt-1">Platform engagement</p>
                                </div>
                            </div>
                        </div>

                        {/* Management Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* User Management */}
                            <Link
                                to="/admin/users"
                                className="group bg-surface border border-border rounded-lg p-8 hover:border-blue-500/50 transition-all duration-300"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-4 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg">
                                        <UserCheck className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold group-hover:text-blue-400 transition-colors">
                                            User Management
                                        </h3>
                                        <p className="text-sm text-muted">{stats.totalUsers} total users</p>
                                    </div>
                                </div>
                                <p className="text-sm text-muted/80">
                                    View and manage all users, update roles, and monitor activity
                                </p>
                                <div className="mt-4 text-sm text-blue-400 group-hover:text-blue-300 transition-colors flex items-center gap-1">
                                    <span>Manage Users</span>
                                    <span>→</span>
                                </div>
                            </Link>

                            {/* Job Management */}
                            <Link
                                to="/admin/jobs"
                                className="group bg-surface border border-border rounded-lg p-8 hover:border-purple-500/50 transition-all duration-300"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
                                        <Building className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold group-hover:text-purple-400 transition-colors">
                                            Manage Jobs
                                        </h3>
                                        <p className="text-sm text-muted">{stats.totalJobs} total jobs</p>
                                    </div>
                                </div>
                                <p className="text-sm text-muted/80">
                                    Monitor all job postings, moderate content, and manage listings
                                </p>
                                <div className="mt-4 text-sm text-purple-400 group-hover:text-purple-300 transition-colors flex items-center gap-1">
                                    <span>View Jobs</span>
                                    <span>→</span>
                                </div>
                            </Link>

                            {/* TPC Intelligence */}
                            <Link
                                to="/admin/tpc"
                                className="group bg-surface border border-border rounded-lg p-8 hover:border-purple-500/50 transition-all duration-300"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
                                        <Brain className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold group-hover:text-purple-400 transition-colors">
                                            TPC Intelligence
                                        </h3>
                                        <p className="text-sm text-muted">AI placement panel</p>
                                    </div>
                                </div>
                                <p className="text-sm text-muted/80">
                                    Student segmentation, placement probability scores, and one-click interventions
                                </p>
                                <div className="mt-4 text-sm text-purple-400 group-hover:text-purple-300 transition-colors flex items-center gap-1">
                                    <span>Open Panel</span>
                                    <span>→</span>
                                </div>
                            </Link>

                            {/* Application Oversight */}
                            <Link
                                to="/admin/applications"
                                className="group bg-surface border border-border rounded-lg p-8 hover:border-green-500/50 transition-all duration-300"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-4 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg">
                                        <TrendingUp className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold group-hover:text-green-400 transition-colors">
                                            Application Analytics
                                        </h3>
                                        <p className="text-sm text-muted">{stats.totalApplications} total applications</p>
                                    </div>
                                </div>
                                <p className="text-sm text-muted/80">
                                    View application trends, track conversions, and analyze platform activity
                                </p>
                                <div className="mt-4 text-sm text-green-400 group-hover:text-green-300 transition-colors flex items-center gap-1">
                                    <span>View Analytics</span>
                                    <span>→</span>
                                </div>
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
