import { useState } from 'react'
import { X, Upload, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'

interface ApplicationData {
    fullName: string
    email: string
    phone: string
    yearsExperience: string
    relevantExperience: string
    resumeText: string
    coverLetter: string
}

interface ApplicationModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: ApplicationData) => Promise<void>
    jobTitle: string
    initialData: {
        fullName: string
        email: string
    }
}

export function ApplicationModal({ isOpen, onClose, onSubmit, jobTitle, initialData }: ApplicationModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<ApplicationData>({
        fullName: initialData.fullName,
        email: initialData.email,
        phone: '',
        yearsExperience: '',
        relevantExperience: '',
        resumeText: '',
        coverLetter: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await onSubmit(formData)
            onClose()
        } catch (error) {
            console.error('Error submitting application:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/50">
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">Apply for {jobTitle}</h2>
                            <p className="text-sm text-muted">Please review and complete your application</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted hover:text-foreground"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form Scrollable Area */}
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                        <form id="application-form" onSubmit={handleSubmit} className="space-y-6">
                            {/* Personal Info */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input
                                        id="fullName"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        required
                                        className="bg-background/50 border-white/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        readOnly
                                        className="bg-white/5 border-transparent text-muted cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+1 (555) 000-0000"
                                    className="bg-background/50 border-white/10"
                                />
                            </div>

                            {/* Experience */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="yearsExperience">Years of Experience</Label>
                                    <Input
                                        id="yearsExperience"
                                        name="yearsExperience"
                                        value={formData.yearsExperience}
                                        onChange={handleChange}
                                        placeholder="e.g. 3 years"
                                        className="bg-background/50 border-white/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="relevantExperience">Relevant Skills</Label>
                                    <Input
                                        id="relevantExperience"
                                        name="relevantExperience"
                                        value={formData.relevantExperience}
                                        onChange={handleChange}
                                        placeholder="React, TypeScript, Node.js..."
                                        className="bg-background/50 border-white/10"
                                    />
                                </div>
                            </div>

                            {/* Resume & Cover Letter */}
                            <div className="space-y-2">
                                <Label htmlFor="resumeText">Resume / CV (Text)</Label>
                                <Textarea
                                    id="resumeText"
                                    name="resumeText"
                                    value={formData.resumeText}
                                    onChange={handleChange}
                                    placeholder="Paste your resume text here..."
                                    className="h-32 bg-background/50 border-white/10 font-mono text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="coverLetter">Cover Letter</Label>
                                <Textarea
                                    id="coverLetter"
                                    name="coverLetter"
                                    value={formData.coverLetter}
                                    onChange={handleChange}
                                    placeholder="Why are you a good fit for this role?"
                                    className="h-32 bg-background/50 border-white/10"
                                />
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-border bg-surface/50 flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            type="button"
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="application-form"
                            disabled={loading}
                            className="bg-purple-600 hover:bg-purple-700 text-white min-w-[140px]"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Sending...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Submit Application
                                    <Check className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
