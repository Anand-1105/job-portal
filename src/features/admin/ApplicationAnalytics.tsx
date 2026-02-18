import { useEffect, useState } from 'react'
import { getAllApplications } from '@/lib/adminService'
import { FileText, User, Briefcase, Calendar } from 'lucide-react'

export function ApplicationAnalytics() {
    const [applications, setApplications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [filteredApps, setFilteredApps] = useState<any[]>([])

    useEffect(() => {
        fetchApplications()
    }, [])

    useEffect(() => {
        if (statusFilter === 'all') {
            setFilteredApps(applications)
        } else {
            setFilteredApps(applications.filter(a => a.status === statusFilter))
        }
    }, [applications, statusFilter])

    async function fetchApplications() {
        try {
            const data = await getAllApplications()
            setApplications(data || [])
            setFilteredApps(data || [])
        } catch (error) {
            console.error('Error fetching applications:', error)
        } finally {
            setLoading(false)
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
                <div className="mb-8">
                    <h1 className="text-4xl font-serif mb-2">Application Analytics</h1>
                    <p className="text-muted">Platform-wide application oversight</p>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-surface border border-border p-6 rounded-lg">
                        <div className="text-2xl font-bold mb-1">{statusCounts.all}</div>
                        <div className="text-sm text-muted">Total Applications</div>
                    </div>
                    <div className="bg-surface border border-border p-6 rounded-lg">
                        <div className="text-2xl font-bold mb-1 text-yellow-400">{statusCounts.pending}</div>
                        <div className="text-sm text-muted">Pending Review</div>
                    </div>
                    <div className="bg-surface border border-border p-6 rounded-lg">
                        <div className="text-2xl font-bold mb-1 text-green-400">{statusCounts.shortlisted}</div>
                        <div className="text-sm text-muted">Shortlisted</div>
                    </div>
                    <div className="bg-surface border border-border p-6 rounded-lg">
                        <div className="text-2xl font-bold mb-1 text-red-400">{statusCounts.rejected}</div>
                        <div className="text-sm text-muted">Rejected</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-surface border border-border rounded-lg p-6 mb-8">
                    <div>
                        <label className="text-sm text-muted mb-2 block">Filter by Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full md:w-64 bg-background border border-border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="all">All Applications ({statusCounts.all})</option>
                            <option value="pending">Pending ({statusCounts.pending})</option>
                            <option value="shortlisted">Shortlisted ({statusCounts.shortlisted})</option>
                            <option value="rejected">Rejected ({statusCounts.rejected})</option>
                        </select>
                    </div>
                </div>

                {/* Applications List */}
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-muted">Loading applications...</p>
                    </div>
                ) : filteredApps.length === 0 ? (
                    <div className="bg-surface border border-border rounded-lg p-12 text-center">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-muted/30" />
                        <h3 className="text-xl font-medium mb-2">No applications found</h3>
                        <p className="text-muted">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredApps.map((app) => (
                            <div
                                key={app.id}
                                className="bg-surface border border-border rounded-lg p-6"
                            >
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold mb-1">{app.profiles?.full_name || 'Unknown Candidate'}</h3>
                                                <p className="text-sm text-muted">Applied for: <span className="text-foreground">{app.jobs?.title || 'Unknown Job'}</span></p>
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

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-muted">
                                            <span className="flex items-center gap-1">
                                                <User className="w-4 h-4" />
                                                {app.email}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Briefcase className="w-4 h-4" />
                                                {app.years_experience} years experience
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(app.applied_at).toLocaleDateString()}
                                            </span>
                                        </div>
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
