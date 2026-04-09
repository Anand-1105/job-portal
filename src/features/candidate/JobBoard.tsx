import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { JobCard } from '@/components/shared/JobCard'
import { Database } from '@/types/database.types'
import { Input } from '@/components/ui/Input'
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { JobFilters, FilterState } from './JobFilters'
import { ApplicationModal } from './ApplicationModal'
import { aiService } from '@/lib/aiService'

type Job = Database['public']['Tables']['jobs']['Row'] & {
  hiring_manager_email?: string
  source_url?: string
}

const INITIAL_FILTERS: FilterState = { jobTypes: [], locations: [], salaryRange: [0, 200000] }

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
  const [sortBy, setSortBy] = useState<'compatibility' | 'latest'>('compatibility')
  const [compatScores, setCompatScores] = useState<Record<string, number>>({})
  const [compatDetails, setCompatDetails] = useState<Record<string, { hiring_manager_email?: string }>>({})
  const [scoresLoading, setScoresLoading] = useState(false)
  const [hasReadiness, setHasReadiness] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchJobs()
    if (user) fetchApplications()
  }, [user])

  async function fetchJobs() {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, source_url')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
      if (error) throw error
      setJobs((data || []) as Job[])
      if (user && profile?.role === 'candidate' && data?.length) {
        fetchCompatibilityScores(data.map(j => j.id))
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchCompatibilityScores(jobIds: string[]) {
    if (!user) return
    setScoresLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ''
      const result = await aiService.getCompatibility(user.id, jobIds, token)
      const scoreMap: Record<string, number> = {}
      const detailMap: Record<string, { hiring_manager_email?: string }> = {}
      result.scores?.forEach((s: any) => {
        scoreMap[s.job_id] = s.score
        detailMap[s.job_id] = { hiring_manager_email: s.hiring_manager_email }
      })
      setCompatScores(scoreMap)
      setCompatDetails(detailMap)
      setHasReadiness(true)
    } catch {
      setHasReadiness(false)
    } finally {
      setScoresLoading(false)
    }
  }

  async function fetchApplications() {
    if (!user) return
    const { data } = await supabase.from('applications').select('job_id').eq('candidate_id', user.id)
    if (data) setAppliedJobIds(new Set(data.map((app: any) => app.job_id)))
  }

  async function handleApplyClick(job: Job) {
    if (!user) return alert('Please login to apply')
    if (profile?.role !== 'candidate') return alert('Only candidates can apply for jobs')
    if (appliedJobIds.has(job.id)) return alert('You have already applied for this job')
    setSelectedJob(job)
    setIsModalOpen(true)
  }

  async function handleSubmitApplication(formData: any) {
    if (!user || !selectedJob) return
    const { error } = await supabase.from('applications').insert({
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
      if (error.code === '23505') throw new Error('You have already applied for this job')
      throw error
    }

    setAppliedJobIds(prev => new Set(prev).add(selectedJob.id))

    // Fire & forget confirmation email — don't block the UI on this
    supabase.auth.getSession().then(({ data: { session } }) => {
      const token = session?.access_token || ''
      aiService.quickApply({ candidate_id: user.id, job_id: selectedJob.id, resume_text: formData.resumeText }, token)
        .catch(() => { /* email failure is non-critical */ })
    })

    setIsModalOpen(false)
    setSelectedJob(null)
  }

  // Filter
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLocation = !locationSearch ||
      job.location.toLowerCase().includes(locationSearch.toLowerCase())
    const matchesJobType = !filters.jobTypes.length || filters.jobTypes.includes(job.type)
    const matchesLocationMode = !filters.locations.length ||
      filters.locations.some(loc => job.location.toLowerCase().includes(loc.toLowerCase()))
    return matchesSearch && matchesLocation && matchesJobType && matchesLocationMode
  }).sort((a, b) => {
    if (sortBy === 'compatibility' && hasReadiness) {
      return (compatScores[b.id] ?? 0) - (compatScores[a.id] ?? 0)
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-serif bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              {hasReadiness ? 'Jobs Matched for You' : 'Latest Opportunities'}
            </h1>
            {hasReadiness && <Sparkles className="w-5 h-5 text-purple-400" />}
          </div>
          {hasReadiness && (
            <p className="text-sm text-purple-400 mb-4">Sorted by AI compatibility score based on your assessment</p>
          )}
          <p className="text-muted mb-6">Showing {filteredJobs.length} {filteredJobs.length === 1 ? 'opportunity' : 'opportunities'}</p>

          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input placeholder="Search by role, skills, or keywords..." className="pl-10 h-10 w-full bg-surface border-border focus:border-purple-500/50"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input placeholder="Location..." className="pl-10 h-10 w-full bg-surface border-border focus:border-purple-500/50"
                value={locationSearch} onChange={e => setLocationSearch(e.target.value)} />
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-6 py-2 border transition-all duration-300 whitespace-nowrap ${showFilters ? 'bg-purple-600 border-purple-600 text-white' : 'border-border hover:border-purple-500/50 hover:bg-surface'}`}>
              <SlidersHorizontal className="w-4 h-4" />
              Filters {filters.jobTypes.length + filters.locations.length > 0 && `(${filters.jobTypes.length + filters.locations.length})`}
            </button>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted">Sort by:</span>
            {hasReadiness && (
              <button onClick={() => setSortBy('compatibility')}
                className={`${sortBy === 'compatibility' ? 'text-purple-400 font-medium' : 'text-muted hover:text-foreground'} transition-colors`}>
                Best Match
              </button>
            )}
            <button onClick={() => setSortBy('latest')}
              className={`${sortBy === 'latest' ? 'text-purple-400 font-medium' : 'text-muted hover:text-foreground'} transition-colors`}>
              Latest
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {showFilters && (
            <div className="md:w-64 flex-shrink-0">
              <JobFilters filters={filters} onFilterChange={setFilters} onClearFilters={() => setFilters(INITIAL_FILTERS)} />
            </div>
          )}
          <div className="flex-1">
            {loading ? (
              <div className="text-center py-20">Loading jobs...</div>
            ) : (
              <div className="grid gap-6">
                {filteredJobs.length === 0 ? (
                  <div className="text-center py-20 bg-surface rounded-lg border border-border">
                    <p className="text-muted">No jobs found matching your criteria.</p>
                    <button onClick={() => { setSearchTerm(''); setLocationSearch(''); setFilters(INITIAL_FILTERS) }}
                      className="mt-4 text-sm text-purple-400 underline hover:no-underline">Clear all filters</button>
                  </div>
                ) : (
                  filteredJobs.map(job => (
                    <JobCard key={job.id} job={job}
                      onApply={() => handleApplyClick(job)}
                      isApplied={appliedJobIds.has(job.id)}
                      showApplyButton={!profile || profile.role === 'candidate'}
                      showViewDetailsButton={!profile || profile.role === 'candidate'}
                      compatibilityScore={compatScores[job.id]}
                      scoresLoading={scoresLoading}
                      hiringManagerEmail={compatDetails[job.id]?.hiring_manager_email || (job as any).hiring_manager_email}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedJob && user && (
        <ApplicationModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedJob(null) }}
          onSubmit={handleSubmitApplication}
          jobTitle={selectedJob.title}
          jobId={selectedJob.id}
          jobDescription={selectedJob.description}
          candidateId={user.id}
          sourceUrl={selectedJob.source_url}
          hiringManager={{ email: compatDetails[selectedJob.id]?.hiring_manager_email || (selectedJob as any).hiring_manager_email }}
          initialData={{ fullName: profile?.full_name || user.user_metadata?.full_name || '', email: user.email || '' }}
        />
      )}
    </div>
  )
}
