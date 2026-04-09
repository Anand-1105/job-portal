import { useEffect, useState } from 'react'

interface Step { text: string; status: 'pass' | 'fail' | 'info' }
interface Props { skillScores: Record<string, number>; tier: 'ready' | 'partial' | 'not_ready' }

const TIER_LABELS = { ready: 'READY', partial: 'PARTIAL', not_ready: 'NOT READY' }

export function AgentThinkingPanel({ skillScores, tier }: Props) {
  const [visibleSteps, setVisibleSteps] = useState<Step[]>([])
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!skillScores || Object.keys(skillScores).length === 0) {
      setVisibleSteps([{ text: 'Evaluation data unavailable.', status: 'fail' }])
      setDone(true)
      return
    }

    const steps: Step[] = [
      { text: 'Initialising readiness evaluation agent...', status: 'info' },
      ...Object.entries(skillScores).map(([skill, score]) => ({
        text: `Analysing ${skill} score: ${score}/100 ${score >= 70 ? '✓' : '✗'}`,
        status: (score >= 70 ? 'pass' : 'fail') as Step['status']
      })),
      {
        text: `Detected skill gaps: ${Object.entries(skillScores).filter(([, s]) => s < 70).map(([k]) => k).join(', ') || 'none'}`,
        status: 'info'
      },
      { text: `Overall tier decision: ${TIER_LABELS[tier]}`, status: tier === 'ready' ? 'pass' : tier === 'partial' ? 'info' : 'fail' },
      { text: 'Unlocking matched jobs based on profile...', status: 'info' },
      ...(tier !== 'ready' ? [{
        text: `Flagging upskill resources for: ${Object.entries(skillScores).filter(([, s]) => s < 70).map(([k]) => k).join(', ')}`,
        status: 'info' as Step['status']
      }] : []),
      { text: 'Agent evaluation complete.', status: 'pass' },
    ]

    steps.forEach((step, i) => {
      setTimeout(() => {
        setVisibleSteps(prev => [...prev, step])
        if (i === steps.length - 1) setDone(true)
      }, i * 600)
    })
  }, [])

  const colors: Record<Step['status'], string> = {
    pass: 'text-green-400',
    fail: 'text-red-400',
    info: 'text-blue-400'
  }

  return (
    <div className="bg-black border border-border rounded-lg p-4 font-mono text-sm mb-8">
      <div className="text-xs text-muted mb-3 uppercase tracking-widest">Agent Reasoning</div>
      <div className="space-y-1">
        {visibleSteps.map((step, i) => (
          <div key={i} className={`flex items-start gap-2 ${colors[step.status]}`}>
            <span className="mt-0.5 shrink-0">→</span>
            <span>{step.text}</span>
          </div>
        ))}
        {!done && <div className="text-muted animate-pulse">→ _</div>}
      </div>
    </div>
  )
}
