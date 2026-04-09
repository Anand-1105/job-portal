import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AgentThinkingPanel } from './AgentThinkingPanel'

interface Result { tier: 'ready' | 'partial' | 'not_ready'; overall_score: number; skill_scores: Record<string, number> }

const TIER_CONFIG = {
  ready:     { label: 'Ready',     color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30',  emoji: '🟢' },
  partial:   { label: 'Partial',   color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', emoji: '🟡' },
  not_ready: { label: 'Not Ready', color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30',      emoji: '🔴' },
}

export function ReadinessResult() {
  const navigate = useNavigate()
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('readiness_result')
    if (!stored) { navigate('/readiness'); return }
    const data = JSON.parse(stored)
    setResult(data)

    // Trigger job scraping in background based on readiness
    async function triggerJobScrape() {
      try {
        const { supabase } = await import('@/lib/supabase')
        const { aiService } = await import('@/lib/aiService')
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token || ''
        if (token && data.candidate_id) {
          await aiService.scrapeJobsForCandidate(data.candidate_id, token)
        }
      } catch { /* silent — jobs will still show from existing data */ }
    }
    triggerJobScrape()
  }, [])

  if (!result) return null

  const config = TIER_CONFIG[result.tier]

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-serif mb-2">Your Assessment Results</h1>
        <p className="text-muted mb-8">Here's what our agent found.</p>

        {/* Agent Thinking Panel */}
        <AgentThinkingPanel skillScores={result.skill_scores} tier={result.tier} />

        {/* Overall Score */}
        <div className={`border rounded-lg p-6 mb-6 ${config.bg}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted mb-1">Overall Score</p>
              <div className={`text-5xl font-bold ${config.color}`}>{result.overall_score}</div>
              <div className={`text-lg font-medium mt-1 ${config.color}`}>{config.emoji} {config.label}</div>
            </div>
            <div className="text-right">
              <div className="w-24 h-24 rounded-full border-4 flex items-center justify-center"
                style={{ borderColor: result.tier === 'ready' ? '#4ade80' : result.tier === 'partial' ? '#facc15' : '#f87171' }}>
                <span className={`text-2xl font-bold ${config.color}`}>{result.overall_score}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Skill Breakdown */}
        <div className="bg-surface border border-border rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Skill Breakdown</h2>
          <div className="space-y-3">
            {Object.entries(result.skill_scores).map(([skill, score]) => (
              <div key={skill}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{skill}</span>
                  <span className={score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400'}>
                    {score}/100
                  </span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA based on tier */}
        <div className="space-y-3">
          {result.tier === 'ready' && (
            <Link to="/jobs" className="block w-full text-center px-8 py-4 bg-green-600 hover:bg-green-500 transition-colors font-medium">
              Browse Matched Jobs →
            </Link>
          )}
          {result.tier === 'partial' && (
            <>
              <Link to="/jobs" className="block w-full text-center px-8 py-4 bg-yellow-600 hover:bg-yellow-500 transition-colors font-medium">
                Browse Jobs (with compatibility scores) →
              </Link>
              <div className="bg-surface border border-border rounded-lg p-4 text-sm text-muted">
                <p className="font-medium text-foreground mb-2">Recommended: Upskill these areas</p>
                <ul className="list-disc list-inside space-y-1">
                  {Object.entries(result.skill_scores).filter(([, s]) => s < 70).map(([skill]) => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
          {result.tier === 'not_ready' && (
            <>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm mb-4">
                <p className="font-medium text-red-400 mb-2">Focus on these skills before applying</p>
                <ul className="list-disc list-inside space-y-1 text-muted">
                  {Object.entries(result.skill_scores).filter(([, s]) => s < 40).map(([skill]) => (
                    <li key={skill}>{skill} — score: {result.skill_scores[skill]}/100</li>
                  ))}
                </ul>
              </div>
              <Link to="/jobs" className="block w-full text-center px-8 py-4 border border-border hover:bg-surface transition-colors">
                Browse Jobs Anyway
              </Link>
            </>
          )}
          <button onClick={() => { sessionStorage.removeItem('readiness_result'); navigate('/readiness') }}
            className="block w-full text-center px-8 py-3 text-muted hover:text-foreground text-sm transition-colors">
            Retake Assessment
          </button>
        </div>
      </div>
    </div>
  )
}
