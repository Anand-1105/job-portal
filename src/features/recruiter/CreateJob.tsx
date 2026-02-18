import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth'
import { Database } from '@/types/database.types'
import { Briefcase, MapPin, DollarSign, FileText, CheckCircle } from 'lucide-react'

type JobType = Database['public']['Tables']['jobs']['Row']['type']

export function CreateJob() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        type: 'full-time' as JobType,
        salary_range: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)
        try {
            const { error } = await supabase.from('jobs').insert([
                {
                    recruiter_id: user.id,
                    title: formData.title,
                    description: formData.description,
                    location: formData.location,
                    type: formData.type,
                    salary_range: formData.salary_range || null,
                    status: 'open',
                },
            ])

            if (error) throw error

            // Show success message
            setSuccess(true)

            // Redirect after brief delay
            setTimeout(() => {
                navigate('/dashboard')
            }, 1500)
        } catch (error) {
            console.error('Error posting job:', error)
            alert('Failed to post job. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-4">
                        <CheckCircle className="w-10 h-10 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-semibold mb-2">Job Posted Successfully!</h2>
                    <p className="text-muted">Redirecting to dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 md:px-12 lg:px-24 py-12">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-serif mb-2">Post a New Job</h1>
                        <p className="text-muted">Fill in the details to create a job posting</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg p-8 space-y-6">
                        {/* Job Title */}
                        <div>
                            <label htmlFor="title" className="flex items-center gap-2 text-sm font-medium mb-2">
                                <Briefcase className="w-4 h-4" />
                                <span>Job Title</span>
                            </label>
                            <input
                                id="title"
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                required
                                placeholder="e.g. Senior Frontend Engineer"
                                className="w-full bg-background border border-border px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="flex items-center gap-2 text-sm font-medium mb-2">
                                <FileText className="w-4 h-4" />
                                <span>Job Description</span>
                            </label>
                            <textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                required
                                placeholder="Describe the role, responsibilities, requirements, and what makes it exciting..."
                                rows={8}
                                className="w-full bg-background border border-border px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                            />
                            <p className="text-xs text-muted mt-2">Tip: Be specific about the role and what candidates will work on</p>
                        </div>

                        {/* Location and Type */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="location" className="flex items-center gap-2 text-sm font-medium mb-2">
                                    <MapPin className="w-4 h-4" />
                                    <span>Location</span>
                                </label>
                                <input
                                    id="location"
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                    required
                                    placeholder="e.g. Remote, San Francisco, CA"
                                    className="w-full bg-background border border-border px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label htmlFor="type" className="flex items-center gap-2 text-sm font-medium mb-2">
                                    <Briefcase className="w-4 h-4" />
                                    <span>Employment Type</span>
                                </label>
                                <select
                                    id="type"
                                    value={formData.type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as JobType }))}
                                    className="w-full bg-background border border-border px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="full-time">Full-time</option>
                                    <option value="contract">Contract</option>
                                    <option value="internship">Internship</option>
                                </select>
                            </div>
                        </div>

                        {/* Salary Range */}
                        <div>
                            <label htmlFor="salary" className="flex items-center gap-2 text-sm font-medium mb-2">
                                <DollarSign className="w-4 h-4" />
                                <span>Salary Range (Optional)</span>
                            </label>
                            <input
                                id="salary"
                                type="text"
                                value={formData.salary_range}
                                onChange={(e) => setFormData(prev => ({ ...prev, salary_range: e.target.value }))}
                                placeholder="e.g. $120k - $180k"
                                className="w-full bg-background border border-border px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <p className="text-xs text-muted mt-2">Including salary range typically increases application quality</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-6 border-t border-border">
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="flex-1 px-6 py-3 border border-border hover:bg-surface transition-colors font-medium"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Posting Job...' : 'Post Job'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
