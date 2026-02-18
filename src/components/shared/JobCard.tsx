import { Button } from '@/components/ui/Button'
import { MapPin, Briefcase, DollarSign, Clock, Sparkles } from 'lucide-react'
import { Database } from '@/types/database.types'
import { Link } from 'react-router-dom'

type Job = Database['public']['Tables']['jobs']['Row']

interface JobCardProps {
    job: Job
    onApply?: (jobId: string) => void
    isApplied?: boolean
    showApplyButton?: boolean
    showViewDetailsButton?: boolean
}

export function JobCard({
    job,
    onApply,
    isApplied = false,
    showApplyButton = true,
    showViewDetailsButton = true
}: JobCardProps) {
    return (
        <div className="group relative overflow-hidden">
            {/* Gradient hover effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl" />

            <div className="relative bg-surface p-6 rounded-xl border border-border group-hover:border-purple-500/50 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-purple-500/10 group-hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            {isApplied ? (
                                <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-300 rounded-full text-xs font-semibold flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    Applied
                                </span>
                            ) : (
                                <span className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 rounded-full text-xs font-semibold capitalize">
                                    {job.type}
                                </span>
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-foreground group-hover:text-purple-300 transition-colors mb-1">
                            {job.title}
                        </h3>
                        <p className="text-muted font-medium">Company Name</p>
                    </div>
                </div>

                <p className="text-muted mb-6 line-clamp-2">
                    {job.description}
                </p>

                <div className="flex flex-wrap gap-4 text-sm text-muted mb-6">
                    <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-purple-400" />
                        {job.location}
                    </div>
                    <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4 text-purple-400" />
                        {job.type}
                    </div>
                    {job.salary_range && (
                        <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-green-400" />
                            {job.salary_range}
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-blue-400" />
                        Posted {new Date(job.created_at).toLocaleDateString()}
                    </div>
                </div>

                <div className="flex gap-2">
                    {showApplyButton && (
                        <Button
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0 shadow-lg shadow-purple-500/20"
                            onClick={() => onApply?.(job.id)}
                            disabled={isApplied}
                        >
                            {isApplied ? 'Application Sent' : 'Apply Now'}
                        </Button>
                    )}
                    {showViewDetailsButton && (
                        <Link to={`/jobs/${job.id}`}>
                            <Button
                                variant="outline"
                                className="border-border hover:border-purple-500/50 hover:bg-surface"
                            >
                                View Details
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}
