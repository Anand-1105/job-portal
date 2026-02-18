import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { JobCard } from '@/components/shared/JobCard'
import { Database } from '@/types/database.types'
import { Input } from '@/components/ui/Input'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { JobFilters, FilterState } from './JobFilters'
import { ApplicationModal } from './ApplicationModal'

type Job = Database['public']['Tables']['jobs']['Row']

const INITIAL_FILTERS: FilterState = {
    jobTypes: [],
    locations: [],
    salaryRange: [0, 200000]
}

export function JobBoard() {
    const { user, profile } = useAuth()
    const [searchParams] = useSearchParams()
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState(searchParams.get('keyword') || '')
    const [locationSearch, setLocationSearch] = useState(searchParams.get('location') || '')
    const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set())
    const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS)
    const [showFilters, setShowFilters] = useState(false)
    const [sortBy, setSortBy] = useState<'latest' | 'salary'>('latest')

    // Modal state
    const [selectedJob, setSelectedJob] = useState<Job | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        fetchJobs()
        if (user) {
            fetchApplications()
        }
    }, [user])

    async function fetchJobs() {
        try {
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('status', 'open')
                .order('created_at', { ascending: false })

            if (error) throw error
            setJobs(data || [])
        } catch (error) {
            console.error('Error fetching jobs:', error)
        } finally {
            setLoading(false)
        }
    }

    async function fetchApplications() {
        if (!user) return
        const { data } = await supabase
            .from('applications')
            .select('job_id')
            .eq('candidate_id', user.id)

        if (data) {
            // @ts-ignore - Supabase type inference occasionally fails with joined tables
            setAppliedJobIds(new Set(data.map(app => app.job_id)))
        }
    }

    async function handleApplyClick(job: Job) {
        if (!user) return alert('Please login to apply')

        if (profile?.role !== 'candidate') {
            return alert('Only candidates can apply for jobs')
        }

        // Check if already applied
        if (appliedJobIds.has(job.id)) {
            return alert('You have already applied for this job')
        }

        setSelectedJob(job)
        setIsModalOpen(true)
    }

    async function handleSubmitApplication(formData: any) {
        if (!user || !selectedJob) return

        try {
            const { error } = await supabase
                .from('applications')
                .insert({
                    job_id: selectedJob.id as string,
                    candidate_id: user.id as string,
                    full_name: formData.fullName as string,
                    email: formData.email as string,
                    phone: formData.phone,
                    years_experience: formData.yearsExperience,
                    relevant_experience: formData.relevantExperience,
                    resume_text: formData.resumeText,
                    cover_letter: formData.coverLetter,
                    status: 'pending'
                } as any)

            if (error) {
                if (error.code === '23505') { // Unique violation
                    throw new Error('You have already applied for this job')
                }
                throw error
            }

            setAppliedJobIds(prev => new Set(prev).add(selectedJob.id))
            alert('Application submitted successfully!')
            setIsModalOpen(false)
            setSelectedJob(null)
        } catch (error: any) {
            console.error('Error applying:', error)
            alert(error.message || 'Failed to apply. Please try again.')
        }
    }

    const handleClearFilters = () => {
        setFilters(INITIAL_FILTERS)
    }

    // Filter and sort jobs
    const filteredJobs = jobs.filter(job => {
        // Search term filter
        const matchesSearch = searchTerm === '' ||
            job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.description.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesLocation = locationSearch === '' ||
            job.location.toLowerCase().includes(locationSearch.toLowerCase())

        // Job type filter
        const matchesJobType = filters.jobTypes.length === 0 ||
            filters.jobTypes.includes(job.type)

        // Location mode filter
        const matchesLocationMode = filters.locations.length === 0 ||
            filters.locations.some(loc =>
                job.location.toLowerCase().includes(loc.toLowerCase())
            )

        return matchesSearch && matchesLocation && matchesJobType && matchesLocationMode
    }).sort((a, b) => {
        if (sortBy === 'latest') {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
        // Sort by salary (if available)
        return 0
    })

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-serif mb-2 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                        Latest Opportunities
                    </h1>
                    <p className="text-muted mb-6">
                        Showing {filteredJobs.length} {filteredJobs.length === 1 ? 'opportunity' : 'opportunities'}
                    </p>

                    {/* Search Bar */}
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by role, skills, or keywords..."
                                className="pl-10 h-10 w-full bg-surface border-border focus:border-purple-500/50"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Location..."
                                className="pl-10 h-10 w-full bg-surface border-border focus:border-purple-500/50"
                                value={locationSearch}
                                onChange={e => setLocationSearch(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-6 py-2 border transition-all duration-300 whitespace-nowrap ${showFilters
                                ? 'bg-purple-600 border-purple-600 text-white'
                                : 'border-border hover:border-purple-500/50 hover:bg-surface'
                                }`}
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            Filters {filters.jobTypes.length + filters.locations.length > 0 &&
                                `(${filters.jobTypes.length + filters.locations.length})`
                            }
                        </button>
                    </div>

                    {/* Sort Options */}
                    <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted">Sort by:</span>
                        <button
                            onClick={() => setSortBy('latest')}
                            className={`${sortBy === 'latest' ? 'text-purple-400 font-medium' : 'text-muted hover:text-foreground'} transition-colors`}
                        >
                            Latest
                        </button>
                        <button
                            onClick={() => setSortBy('salary')}
                            className={`${sortBy === 'salary' ? 'text-purple-400 font-medium' : 'text-muted hover:text-foreground'} transition-colors`}
                        >
                            Salary
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Filters Sidebar */}
                    {showFilters && (
                        <div className="md:w-64 flex-shrink-0">
                            <JobFilters
                                filters={filters}
                                onFilterChange={setFilters}
                                onClearFilters={handleClearFilters}
                            />
                        </div>
                    )}

                    {/* Job Listings */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="text-center py-20">Loading jobs...</div>
                        ) : (
                            <div className="grid gap-6">
                                {filteredJobs.length === 0 ? (
                                    <div className="text-center py-20 bg-surface rounded-lg border border-border">
                                        <p className="text-muted">No jobs found matching your criteria.</p>
                                        <button
                                            onClick={() => {
                                                setSearchTerm('')
                                                setLocationSearch('')
                                                setFilters(INITIAL_FILTERS)
                                            }}
                                            className="mt-4 text-sm text-purple-400 underline hover:no-underline"
                                        >
                                            Clear all filters
                                        </button>
                                    </div>
                                ) : (
                                    filteredJobs.map(job => (
                                        <JobCard
                                            key={job.id}
                                            job={job}
                                            onApply={() => handleApplyClick(job)}
                                            isApplied={appliedJobIds.has(job.id)}
                                            showApplyButton={!profile || profile.role === 'candidate'}
                                            showViewDetailsButton={!profile || profile.role === 'candidate'}
                                        />
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Application Modal */}
            {selectedJob && user && (
                <ApplicationModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false)
                        setSelectedJob(null)
                    }}
                    onSubmit={handleSubmitApplication}
                    jobTitle={selectedJob.title}
                    initialData={{
                        fullName: profile?.full_name || user.user_metadata?.full_name || '',
                        email: user.email || ''
                    }}
                />
            )}
        </div>
    )
}
