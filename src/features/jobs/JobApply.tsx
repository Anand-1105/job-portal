import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight, Send, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { submitApplication } from '@/lib/applicationService'

// Mock job data (matching JobsPreview)
const JOBS_DATA: Record<string, {
    role: string;
    company: string;
    location: string;
    salary: string;
    description: string;
}> = {
    '550e8400-e29b-41d4-a716-446655440001': { role: 'Senior Product Designer', company: 'Linear', location: 'Remote', salary: '$120k - $180k', description: 'Help us build the future of issue tracking. Looking for someone who loves craft and sweats the details.' },
    '550e8400-e29b-41d4-a716-446655440002': { role: 'Frontend Engineer', company: 'Vercel', location: 'San Francisco', salary: '$150k - $220k', description: 'Build delightful experiences for millions of developers. React, Next.js, TypeScript expertise required.' },
    '550e8400-e29b-41d4-a716-446655440003': { role: 'Product Manager', company: 'Stripe', location: 'New York', salary: '$140k - $200k', description: 'Own the roadmap for our payments platform. Work with world-class engineers and designers.' },
    '550e8400-e29b-41d4-a716-446655440004': { role: 'Marketing Lead', company: 'Notion', location: 'Remote', salary: '$110k - $160k', description: 'Drive growth through creative campaigns. Experience in B2B SaaS marketing is a must.' },
    '550e8400-e29b-41d4-a716-446655440005': { role: 'DevOps Engineer', company: 'Railway', location: 'San Francisco', salary: '$130k - $190k', description: 'Scale our infrastructure to handle millions of deploys. Kubernetes, Docker, cloud expertise needed.' },
    '550e8400-e29b-41d4-a716-446655440006': { role: 'UX Researcher', company: 'Figma', location: 'Remote', salary: '$115k - $165k', description: 'Help us understand our users deeply. Conduct studies, analyze data, inform product decisions.' },
}

type Step = 'intro' | 'basics' | 'experience' | 'resume' | 'cover' | 'review'

export function JobApply() {
    const { jobId } = useParams<{ jobId: string }>()
    const navigate = useNavigate()
    const { profile } = useAuth()
    const job = JOBS_DATA[jobId || '']

    const [currentStep, setCurrentStep] = useState<Step>('intro')
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        yearsExperience: '',
        relevantExperience: '',
        resumeText: '',
        coverLetter: '',
    })
    const [showSuccess, setShowSuccess] = useState(false)

    if (!job) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <p className="text-muted">Job not found</p>
                <button onClick={() => navigate('/')} className="mt-4 text-purple-400 hover:underline">
                    Go back home
                </button>
            </div>
        )
    }

    const handleNext = (nextStep: Step) => {
        setCurrentStep(nextStep)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleSubmit = async () => {
        if (!profile || !jobId) return

        try {
            await submitApplication({
                jobId,
                candidateId: profile.id,
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                yearsExperience: formData.yearsExperience,
                relevantExperience: formData.relevantExperience,
                resumeText: formData.resumeText,
                coverLetter: formData.coverLetter,
            })

            // Show success animation
            setShowSuccess(true)

            // Redirect to dashboard after 2.5 seconds
            setTimeout(() => {
                navigate('/dashboard')
            }, 2500)
        } catch (error) {
            console.error('Failed to submit application:', error)
            alert('Failed to submit application. Please try again.')
        }
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/10 via-transparent to-transparent blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-500/10 via-transparent to-transparent blur-3xl pointer-events-none" />

            <div className="container mx-auto px-4 py-12 relative z-10">
                <div className="max-w-4xl mx-auto">
                    {/* Job Summary Sidebar - Sticky */}
                    <div className="mb-8 bg-surface border border-border p-6 rounded-lg sticky top-4 z-20">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-serif mb-1">{job.role}</h1>
                                <p className="text-muted">{job.company} • {job.location} • {job.salary}</p>
                            </div>
                            <button
                                onClick={() => navigate('/')}
                                className="text-muted hover:text-foreground text-sm"
                            >
                                ← Back
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="bg-surface border border-border rounded-lg p-8 md:p-12">
                        {/* Intro Step */}
                        {currentStep === 'intro' && (
                            <div className="space-y-8 animate-fadeIn">
                                <div className="flex items-center gap-3 mb-6">
                                    <Sparkles className="w-6 h-6 text-purple-400" />
                                    <span className="text-sm uppercase tracking-widest text-purple-400 font-medium">Let's Begin</span>
                                </div>

                                <div className="space-y-4">
                                    <h2 className="text-3xl font-serif">Hey there! 👋</h2>
                                    <p className="text-lg text-muted leading-relaxed">
                                        We're excited that you're interested in joining {job.company} as a {job.role}.
                                    </p>
                                    <p className="text-muted leading-relaxed">
                                        {job.description}
                                    </p>
                                    <p className="text-muted leading-relaxed">
                                        This should only take <strong className="text-foreground">5 minutes</strong>. We'll ask you a few questions
                                        to understand your background better. Ready?
                                    </p>
                                </div>

                                <button
                                    onClick={() => handleNext('basics')}
                                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-8 py-4 text-lg transition-all duration-300 group shadow-lg shadow-purple-500/20"
                                >
                                    <span className="font-medium">Let's go</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        )}

                        {/* Basics Step */}
                        {currentStep === 'basics' && (
                            <div className="space-y-8 animate-fadeIn">
                                <div>
                                    <h2 className="text-3xl font-serif mb-2">First, the basics</h2>
                                    <p className="text-muted">How should we reach you?</p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Your full name</label>
                                        <input
                                            type="text"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            placeholder="Jane Doe"
                                            className="w-full bg-background border border-border px-4 py-3 rounded-lg focus:border-purple-500/50 focus:outline-none transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Email address</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="jane@example.com"
                                            className="w-full bg-background border border-border px-4 py-3 rounded-lg focus:border-purple-500/50 focus:outline-none transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Phone number <span className="text-muted text-xs">(optional)</span></label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+1 (555) 123-4567"
                                            className="w-full bg-background border border-border px-4 py-3 rounded-lg focus:border-purple-500/50 focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleNext('experience')}
                                    disabled={!formData.fullName || !formData.email}
                                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-8 py-4 transition-all duration-300 group shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="font-medium">Continue</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        )}

                        {/* Experience Step */}
                        {currentStep === 'experience' && (
                            <div className="space-y-8 animate-fadeIn">
                                <div>
                                    <h2 className="text-3xl font-serif mb-2">Tell us about your experience</h2>
                                    <p className="text-muted">We'd love to know what you've worked on</p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Years of relevant experience</label>
                                        <input
                                            type="number"
                                            value={formData.yearsExperience}
                                            onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                                            placeholder="5"
                                            min="0"
                                            className="w-full bg-background border border-border px-4 py-3 rounded-lg focus:border-purple-500/50 focus:outline-none transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            What makes you a great fit for this role?
                                        </label>
                                        <p className="text-xs text-muted mb-2">Share your most relevant experience, projects, or achievements</p>
                                        <textarea
                                            value={formData.relevantExperience}
                                            onChange={(e) => setFormData({ ...formData, relevantExperience: e.target.value })}
                                            placeholder="I've led design teams at  several startups, shipping products used by millions..."
                                            rows={6}
                                            className="w-full bg-background border border-border px-4 py-3 rounded-lg focus:border-purple-500/50 focus:outline-none transition-colors resize-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleNext('resume')}
                                    disabled={!formData.yearsExperience || !formData.relevantExperience}
                                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-8 py-4 transition-all duration-300 group shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="font-medium">Continue</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        )}

                        {/* Resume Step */}
                        {currentStep === 'resume' && (
                            <div className="space-y-8 animate-fadeIn">
                                <div>
                                    <h2 className="text-3xl font-serif mb-2">Share your resume</h2>
                                    <p className="text-muted">Paste your resume text or upload a file</p>
                                </div>

                                <div className="space-y-4">
                                    <textarea
                                        value={formData.resumeText}
                                        onChange={(e) => setFormData({ ...formData, resumeText: e.target.value })}
                                        placeholder="Paste your resume here...

You can copy from a PDF, Word doc, or any text format."
                                        rows={12}
                                        className="w-full bg-background border border-border px-4 py-3 rounded-lg focus:border-purple-500/50 focus:outline-none transition-colors resize-none font-mono text-sm"
                                    />
                                    <p className="text-xs text-muted">💡 You can also upload a file from the ATS Checker page later</p>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleNext('cover')}
                                        className="flex items-center gap-2 text-muted hover:text-foreground transition-colors"
                                    >
                                        Skip for now →
                                    </button>
                                    <button
                                        onClick={() => handleNext('cover')}
                                        disabled={!formData.resumeText}
                                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-8 py-4 transition-all duration-300 group shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                                    >
                                        <span className="font-medium">Continue</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Cover Letter Step */}
                        {currentStep === 'cover' && (
                            <div className="space-y-8 animate-fadeIn">
                                <div>
                                    <h2 className="text-3xl font-serif mb-2">One last thing...</h2>
                                    <p className="text-muted">Want to add a personal note? <span className="text-xs">(Optional)</span></p>
                                </div>

                                <div className="space-y-4">
                                    <textarea
                                        value={formData.coverLetter}
                                        onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                                        placeholder="Dear Hiring Team,

I'm excited to apply for this role because..."
                                        rows={10}
                                        className="w-full bg-background border border-border px-4 py-3 rounded-lg focus:border-purple-500/50 focus:outline-none transition-colors resize-none"
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleNext('review')}
                                        className="flex items-center gap-2 text-muted hover:text-foreground transition-colors"
                                    >
                                        Skip →
                                    </button>
                                    <button
                                        onClick={() => handleNext('review')}
                                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-8 py-4 transition-all duration-300 group shadow-lg shadow-purple-500/20 ml-auto"
                                    >
                                        <span className="font-medium">Review Application</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Review Step */}
                        {currentStep === 'review' && (
                            <div className="space-y-8 animate-fadeIn">
                                <div>
                                    <h2 className="text-3xl font-serif mb-2">Review your application</h2>
                                    <p className="text-muted">Everything look good?</p>
                                </div>

                                <div className="space-y-6 bg-background border border-border/50 p-6 rounded-lg">
                                    <div>
                                        <h3 className="text-sm font-medium text-muted mb-1">Contact Info</h3>
                                        <p>{formData.fullName} • {formData.email}</p>
                                        {formData.phone && <p className="text-sm text-muted">{formData.phone}</p>}
                                    </div>

                                    <div className="border-t border-border/50 pt-4">
                                        <h3 className="text-sm font-medium text-muted mb-1">Experience</h3>
                                        <p>{formData.yearsExperience} years</p>
                                        <p className="text-sm text-muted mt-2 line-clamp-3">{formData.relevantExperience}</p>
                                    </div>

                                    {formData.resumeText && (
                                        <div className="border-t border-border/50 pt-4">
                                            <h3 className="text-sm font-medium text-muted mb-1">Resume</h3>
                                            <p className="text-sm text-muted">✓ Resume attached ({formData.resumeText.length} characters)</p>
                                        </div>
                                    )}

                                    {formData.coverLetter && (
                                        <div className="border-t border-border/50 pt-4">
                                            <h3 className="text-sm font-medium text-muted mb-1">Cover Letter</h3>
                                            <p className="text-sm text-muted">✓ Cover letter included</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setCurrentStep('basics')}
                                        className="text-muted hover:text-foreground transition-colors"
                                    >
                                        ← Edit
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 px-8 py-4 transition-all duration-300 group shadow-lg shadow-green-500/20 ml-auto"
                                    >
                                        <span className="font-medium">Submit Application</span>
                                        <Send className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Success Animation Overlay */}
            {showSuccess && (
                <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
                    <div className="text-center space-y-6">
                        {/* Animated Checkmark Circle */}
                        <div className="relative mx-auto w-32 h-32">
                            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-scale-in shadow-2xl shadow-green-500/50" />
                            <div className="absolute inset-2 bg-background rounded-full" />
                            <CheckCircle2 className="absolute inset-0 m-auto w-20 h-20 text-green-500 animate-check-in" />
                        </div>

                        <div className="space-y-2 animate-fadeIn">
                            <h2 className="text-3xl font-serif bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                Application Sent!
                            </h2>
                            <p className="text-muted">We'll review your application and get back to you soon.</p>
                            <p className="text-sm text-muted/70">Redirecting to dashboard...</p>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0); }
                    to { transform: scale(1); }
                }
                @keyframes checkIn {
                    0% { transform: scale(0) rotate(-45deg); opacity: 0; }
                    50% { transform: scale(1.2) rotate(0deg); }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out;
                }
                .animate-scale-in {
                    animation: scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .animate-check-in {
                    animation: checkIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s forwards;
                    opacity: 0;
                }
            `}</style>
        </div>
    )
}
