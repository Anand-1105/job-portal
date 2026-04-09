import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { aiService } from '@/lib/aiService'
import { supabase } from '@/lib/supabase'

const SKILLS = [
  'React', 'Vue.js', 'Angular', 'TypeScript', 'JavaScript',
  'Node.js', 'Python', 'FastAPI', 'Django', 'Flask',
  'SQL', 'PostgreSQL', 'MongoDB', 'Redis',
  'DSA', 'System Design', 'Machine Learning', 'Docker', 'AWS'
]

const DOMAINS = ['Frontend', 'Backend', 'Full-Stack', 'Data', 'DevOps', 'Mobile']

export function ReadinessForm() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [skills, setSkills] = useState<string[]>([])
  const [domains, setDomains] = useState<string[]>([])
  const [resumeText, setResumeText] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')

  function toggle<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
  }

  async function handleSubmit() {
    if (!user) return
    if (!resumeText.trim()) { setError('Resume text is required'); return }
    setLoading(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ''

      setLoadingMsg('Saving your profile...')
      await aiService.saveProfile({ skills, domain_interests: domains, resume_text: resumeText }, token)

      setLoadingMsg(`Generating ${skills.length} skill test${skills.length > 1 ? 's' : ''} with AI... (this takes ~10s)`)
      const testData = await aiService.generateTest(user.id, token)

      // Store assessments in sessionStorage for the test page
      sessionStorage.setItem('assessments', JSON.stringify(testData.assessments))
      navigate('/readiness/test')
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= step ? 'bg-purple-500' : 'bg-border'}`} />
          ))}
        </div>

        {step === 1 && (
          <div>
            <h1 className="text-3xl font-serif mb-2">What are your skills?</h1>
            <p className="text-muted mb-6">Select all that apply. We'll test you on these.</p>
            <div className="flex flex-wrap gap-3 mb-8">
              {SKILLS.map(s => (
                <button key={s} onClick={() => setSkills(toggle(skills, s))}
                  className={`px-4 py-2 rounded-full border text-sm transition-all ${skills.includes(s) ? 'bg-purple-600 border-purple-600 text-white' : 'border-border hover:border-purple-500/50'}`}>
                  {s}
                </button>
              ))}
            </div>
            <button disabled={skills.length === 0} onClick={() => setStep(2)}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 transition-colors">
              Next →
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-3xl font-serif mb-2">What domains interest you?</h1>
            <p className="text-muted mb-6">This helps us match you to the right jobs.</p>
            <div className="flex flex-wrap gap-3 mb-8">
              {DOMAINS.map(d => (
                <button key={d} onClick={() => setDomains(toggle(domains, d))}
                  className={`px-4 py-2 rounded-full border text-sm transition-all ${domains.includes(d) ? 'bg-blue-600 border-blue-600 text-white' : 'border-border hover:border-blue-500/50'}`}>
                  {d}
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="px-6 py-3 border border-border hover:bg-surface transition-colors">← Back</button>
              <button disabled={domains.length === 0} onClick={() => setStep(3)}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 transition-colors">
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="text-3xl font-serif mb-2">Paste your resume</h1>
            <p className="text-muted mb-6">Plain text only. This powers resume tailoring and cold emails.</p>
            <textarea
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              placeholder="Paste your resume text here..."
              rows={12}
              className="w-full bg-surface border border-border p-4 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none mb-4"
            />
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="px-6 py-3 border border-border hover:bg-surface transition-colors">← Back</button>
              <button onClick={handleSubmit} disabled={loading}
                className="px-8 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-40 transition-colors flex items-center gap-2">
                {loading ? loadingMsg || 'Working...' : 'Start Assessment →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
