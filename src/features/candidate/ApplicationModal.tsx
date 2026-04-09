import { useState, useEffect } from 'react'
import { X, Check, Wand2, Mail, Phone, Copy } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import { supabase } from '@/lib/supabase'
import { aiService } from '@/lib/aiService'

interface ApplicationData {
  fullName: string
  email: string
  phone: string
  yearsExperience: string
  relevantExperience: string
  resumeText: string
  coverLetter: string
}

interface HiringManagerInfo {
  email?: string
  phone?: string
}

interface ApplicationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ApplicationData) => Promise<void>
  jobTitle: string
  jobId: string
  jobDescription?: string
  candidateId: string
  sourceUrl?: string
  hiringManager?: HiringManagerInfo
  initialData: { fullName: string; email: string }
}

export function ApplicationModal({
  isOpen, onClose, onSubmit, jobTitle, jobId, jobDescription,
  candidateId, sourceUrl, hiringManager, initialData
}: ApplicationModalProps) {
  const [loading, setLoading] = useState(false)
  const [tailoring, setTailoring] = useState(false)
  const [tailored, setTailored] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [autoApplyStatus, setAutoApplyStatus] = useState<{ status: string; message: string } | null>(null)
  const [formData, setFormData] = useState<ApplicationData>({
    fullName: initialData.fullName,
    email: initialData.email,
    phone: '',
    yearsExperience: '',
    relevantExperience: '',
    resumeText: '',
    coverLetter: ''
  })

  // Auto-fill from saved candidate profile on open
  useEffect(() => {
    if (!isOpen || !candidateId) return
    async function prefill() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token || ''
        // Fetch candidate profile for resume text + skills
        const { data: cp } = await supabase
          .from('candidate_profiles')
          .select('resume_text, skills')
          .eq('candidate_id', candidateId)
          .single() as any
        if (cp?.resume_text) {
          setFormData(prev => ({
            ...prev,
            resumeText: cp.resume_text || '',
            relevantExperience: cp.skills?.join(', ') || prev.relevantExperience
          }))
        }
      } catch { /* no profile yet */ }
    }
    prefill()
  }, [isOpen, candidateId])

  async function handleTailor() {
    setTailoring(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ''
      const result = await aiService.tailorResume(candidateId, jobId, token)
      setTailored(result.tailored_resume)
      // Auto-fill the resume field with tailored version
      setFormData(prev => ({ ...prev, resumeText: result.tailored_resume }))
    } catch (e: any) {
      alert(e.message || 'Tailoring failed. Make sure your profile has resume text.')
    } finally {
      setTailoring(false)
    }
  }

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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/50">
            <div>
              <h2 className="text-xl font-semibold">Apply for {jobTitle}</h2>
              <p className="text-sm text-muted">Form pre-filled from your profile</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Hiring Manager Info */}
          {(hiringManager?.email || hiringManager?.phone) && (
            <div className="px-6 py-3 bg-blue-500/10 border-b border-blue-500/20 flex flex-wrap gap-4 text-sm">
              <span className="text-blue-300 font-medium">Hiring Manager:</span>
              {hiringManager.email && (
                <span className="flex items-center gap-1 text-muted">
                  <Mail className="w-3 h-3" />{hiringManager.email}
                  <button onClick={() => { navigator.clipboard.writeText(hiringManager.email!); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                    className="ml-1 text-blue-400 hover:text-blue-300">
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                </span>
              )}
              {hiringManager.phone && (
                <span className="flex items-center gap-1 text-muted">
                  <Phone className="w-3 h-3" />{hiringManager.phone}
                </span>
              )}
            </div>
          )}

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-6">
            <form id="application-form" onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required className="bg-background/50 border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" value={formData.email} readOnly className="bg-white/5 border-transparent text-muted cursor-not-allowed" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" className="bg-background/50 border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearsExperience">Years of Experience</Label>
                  <Input id="yearsExperience" name="yearsExperience" value={formData.yearsExperience} onChange={handleChange} placeholder="e.g. 2 years" className="bg-background/50 border-white/10" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="relevantExperience">Relevant Skills</Label>
                <Input id="relevantExperience" name="relevantExperience" value={formData.relevantExperience} onChange={handleChange} placeholder="React, TypeScript, Node.js..." className="bg-background/50 border-white/10" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="resumeText">Resume {tailored && <span className="text-xs text-green-400 ml-2">✓ Tailored for this JD</span>}</Label>
                  <button type="button" onClick={handleTailor} disabled={tailoring}
                    className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 disabled:opacity-40 transition-colors">
                    <Wand2 className="w-3 h-3" />
                    {tailoring ? 'Tailoring...' : 'Tailor for this JD'}
                  </button>
                </div>
                <Textarea id="resumeText" name="resumeText" value={formData.resumeText} onChange={handleChange}
                  placeholder="Paste your resume text here (auto-filled from your profile)..."
                  className="h-36 bg-background/50 border-white/10 font-mono text-sm" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverLetter">Cover Letter</Label>
                <Textarea id="coverLetter" name="coverLetter" value={formData.coverLetter} onChange={handleChange}
                  placeholder="Why are you a good fit for this role?"
                  className="h-28 bg-background/50 border-white/10" />
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border bg-surface/50 flex flex-col gap-3">
            {/* ATS Auto-Apply — fires in background, polls for status */}
            {sourceUrl && (
              <div className="flex flex-col gap-2">
                <button type="button" onClick={async () => {
                  const { supabase } = await import('@/lib/supabase')
                  const { data: { session } } = await supabase.auth.getSession()
                  const token = session?.access_token || ''
                  setAutoApplyStatus({ status: 'queued', message: '🚀 Starting auto-apply...' })
                  try {
                    // Fire and immediately get task_id
                    const { task_id } = await aiService.autoApply(candidateId, jobId, formData.coverLetter, token)
                    // Open the job URL in new tab so user sees it
                    if (sourceUrl) window.open(sourceUrl, '_blank')
                    // Poll for status every 4 seconds
                    const poll = setInterval(async () => {
                      try {
                        const status = await aiService.getApplyStatus(task_id, token)
                        setAutoApplyStatus({ status: status.status, message: status.message })
                        if (['success', 'failed'].includes(status.status)) {
                          clearInterval(poll)
                        }
                      } catch { clearInterval(poll) }
                    }, 4000)
                  } catch (e: any) {
                    setAutoApplyStatus({ status: 'failed', message: '❌ ' + (e.message || 'Failed to start') })
                  }
                }}
                  id="auto-apply-btn"
                  disabled={autoApplyStatus !== null && !['success', 'failed'].includes(autoApplyStatus.status)}
                  className="w-full px-4 py-2 bg-sky-600/20 border border-sky-500/40 hover:bg-sky-600/30 text-sky-300 text-sm rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  🤖 Auto Apply on Company Website
                </button>
                {autoApplyStatus && (
                  <p className={`text-xs text-center px-2 ${
                    autoApplyStatus.status === 'success' ? 'text-green-400' :
                    autoApplyStatus.status === 'failed' ? 'text-red-400' : 'text-sky-300'
                  }`}>
                    {autoApplyStatus.message}
                  </p>
                )}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} type="button" disabled={loading}>Cancel</Button>
              <Button type="submit" form="application-form" disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white min-w-[160px]">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Save to Chosen
                  </span>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
