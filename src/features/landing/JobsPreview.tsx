import { Card } from '@/components/ui/Card'
import { MapPin, DollarSign, Sparkles, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'

const jobs = [
    {
        id: '550e8400-e29b-41d4-a716-446655440001',
        role: 'Senior Product Designer',
        company: 'Linear',
        location: 'Remote',
        type: 'Full-time',
        category: 'Design',
        salary: '$120k - $180k',
        posted: '2d ago',
        description: 'Help us build the future of issue tracking. Looking for someone who loves craft and sweats the details.',
        accent: 'from-purple-500/20 to-pink-500/20'
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440002',
        role: 'Frontend Engineer',
        company: 'Vercel',
        location: 'San Francisco',
        type: 'Full-time',
        category: 'Engineering',
        salary: '$150k - $220k',
        posted: '1w ago',
        description: 'Build delightful experiences for millions of developers. React, Next.js, TypeScript expertise required.',
        accent: 'from-blue-500/20 to-cyan-500/20'
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440003',
        role: 'Product Manager',
        company: 'Stripe',
        location: 'New York',
        type: 'Full-time',
        category: 'Product',
        salary: '$140k - $200k',
        posted: '3d ago',
        description: 'Own the roadmap for our payments platform. Work with world-class engineers and designers.',
        accent: 'from-green-500/20 to-emerald-500/20'
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440004',
        role: 'Marketing Lead',
        company: 'Notion',
        location: 'Remote',
        type: 'Full-time',
        category: 'Marketing',
        salary: '$110k - $160k',
        posted: '5d ago',
        description: 'Drive growth through creative campaigns. Experience in B2B SaaS marketing is a must.',
        accent: 'from-orange-500/20 to-red-500/20'
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440005',
        role: 'DevOps Engineer',
        company: 'Railway',
        location: 'San Francisco',
        type: 'Full-time',
        category: 'Engineering',
        salary: '$130k - $190k',
        posted: '4d ago',
        description: 'Scale our infrastructure to handle millions of deploys. Kubernetes, Docker, cloud expertise needed.',
        accent: 'from-violet-500/20 to-purple-500/20'
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440006',
        role: 'UX Researcher',
        company: 'Figma',
        location: 'Remote',
        type: 'Full-time',
        category: 'Design',
        salary: '$115k - $165k',
        posted: '1w ago',
        description: 'Help us understand our users deeply. Conduct studies, analyze data, inform product decisions.',
        accent: 'from-pink-500/20 to-rose-500/20'
    },
]

export function JobsPreview() {
    const navigate = useNavigate()
    const { profile } = useAuth()

    const showActions = !profile || profile.role === 'candidate'

    return (
        <section className="px-4 md:px-12 lg:px-24 py-24 relative overflow-hidden">
            {/* Background gradient accents */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/10 via-transparent to-transparent blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 via-transparent to-transparent blur-3xl pointer-events-none" />

            <div className="max-w-7xl w-full mx-auto relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <Sparkles className="w-6 h-6 text-purple-400" />
                            <span className="text-sm uppercase tracking-widest text-purple-400 font-medium">Handpicked</span>
                        </div>
                        <h2 className="font-serif text-h1 mb-2 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                            Latest Opportunities
                        </h2>
                        <p className="text-muted">Discover your next career move</p>
                    </div>
                    <a
                        href="/jobs"
                        className="flex items-center gap-2 bg-surface border border-border px-6 py-3 hover:border-purple-500/50 transition-all duration-300 group"
                    >
                        <span className="font-medium">Browse All Jobs</span>
                        <span className="text-purple-400">→</span>
                    </a>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.map((job) => (
                        <div
                            key={job.id}
                            className="group relative overflow-hidden"
                        >
                            {/* Gradient background on hover */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${job.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`} />

                            <Card className="relative bg-surface border-border hover:border-purple-500/50 transition-all duration-300 flex flex-col gap-4 h-full group-hover:shadow-2xl group-hover:shadow-purple-500/10">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 text-xs font-medium rounded-full">
                                                {job.category}
                                            </span>
                                            <span className="text-xs text-muted">{job.posted}</span>
                                        </div>
                                        <h3 className="text-xl font-semibold mb-1">
                                            {job.role}
                                        </h3>
                                        <p className="text-muted text-sm mb-3">{job.company}</p>
                                    </div>
                                </div>

                                <p className="text-sm text-muted/80 line-clamp-2">{job.description}</p>

                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {job.location}
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <DollarSign className="w-3 h-3" />
                                            {job.salary}
                                        </span>
                                    </div>

                                    {showActions && (
                                        <button
                                            onClick={() => navigate(`/jobs/${job.id}/apply`)}
                                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-4 py-2.5 transition-all duration-300 group/btn shadow-lg shadow-purple-500/20 mt-auto"
                                        >
                                            <span className="font-medium text-sm">Apply Now</span>
                                            <Send className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                                        </button>
                                    )}
                                </div>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
