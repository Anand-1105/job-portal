import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { aiService } from '@/lib/aiService'
import { supabase } from '@/lib/supabase'

interface Question { question: string; options: string[]; correct_index: number }
interface Assessment { id: string; skill: string; questions: Question[] }

export function ReadinessTest() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [currentSkill, setCurrentSkill] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number[]>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('assessments')
    if (!stored) { navigate('/readiness'); return }
    const data = JSON.parse(stored)
    setAssessments(data)
    // Init answers map
    const init: Record<string, number[]> = {}
    data.forEach((a: Assessment) => { init[a.id] = new Array(a.questions.length).fill(-1) })
    setAnswers(init)
  }, [])

  function setAnswer(assessmentId: string, qIndex: number, optIndex: number) {
    setAnswers(prev => {
      const updated = [...(prev[assessmentId] || [])]
      updated[qIndex] = optIndex
      return { ...prev, [assessmentId]: updated }
    })
  }

  function allAnswered(): boolean {
    return assessments.every(a => answers[a.id]?.every(v => v !== -1))
  }

  async function handleSubmit() {
    if (!user || !allAnswered()) return
    setSubmitting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ''

      // Submit each assessment
      for (const a of assessments) {
        await aiService.submitAssessment({
          assessment_id: a.id,
          answers: (answers[a.id] || []).map(i => ({ selected_index: i }))
        }, token)
      }

      // Evaluate overall
      const result = await aiService.evaluate(user.id, token)
      sessionStorage.setItem('readiness_result', JSON.stringify({ ...result, candidate_id: user.id }))
      sessionStorage.removeItem('assessments')
      navigate('/readiness/result')
    } catch (e) {
      console.error(e)
      alert('Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!assessments.length) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted">Loading test...</p></div>

  const current = assessments[currentSkill]
  const currentAnswers = answers[current?.id] || []
  const answeredCount = currentAnswers.filter(v => v !== -1).length

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Skill tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {assessments.map((a, i) => {
            const done = (answers[a.id] || []).every(v => v !== -1)
            return (
              <button key={a.id} onClick={() => setCurrentSkill(i)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap border transition-all ${i === currentSkill ? 'bg-purple-600 border-purple-600 text-white' : done ? 'border-green-500/50 text-green-400' : 'border-border'}`}>
                {done ? '✓ ' : ''}{a.skill}
              </button>
            )
          })}
        </div>

        <h2 className="text-2xl font-serif mb-1">{current.skill}</h2>
        <p className="text-muted text-sm mb-8">{answeredCount}/{current.questions.length} answered</p>

        <div className="space-y-8">
          {current.questions.map((q, qi) => (
            <div key={qi} className="bg-surface border border-border rounded-lg p-6">
              <p className="font-medium mb-4">{qi + 1}. {q.question}</p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <button key={oi} onClick={() => setAnswer(current.id, qi, oi)}
                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${currentAnswers[qi] === oi ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'border-border hover:border-purple-500/40'}`}>
                    <span className="font-mono text-muted mr-3">{['A', 'B', 'C', 'D'][oi]}.</span>{opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button disabled={currentSkill === 0} onClick={() => setCurrentSkill(s => s - 1)}
            className="px-6 py-3 border border-border hover:bg-surface disabled:opacity-30 transition-colors">
            ← Previous
          </button>

          {currentSkill < assessments.length - 1 ? (
            <button onClick={() => setCurrentSkill(s => s + 1)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 transition-colors">
              Next Skill →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={!allAnswered() || submitting}
              className="px-8 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-40 transition-colors">
              {submitting ? 'Evaluating...' : 'Submit & Get Results →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
