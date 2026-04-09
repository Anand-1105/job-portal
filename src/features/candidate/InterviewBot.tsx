import { useState, useEffect, useRef } from 'react'
import { Brain, ChevronRight, Trophy } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { aiService } from '@/lib/aiService'
import { useAuth } from '@/features/auth'
import { Button } from '@/components/ui/Button'

function SimpleMarkdown({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold mt-4 mb-1">{line.slice(3)}</h2>
        if (line.startsWith('### ')) return <h3 key={i} className="text-base font-semibold mt-3 mb-1 text-blue-300">{line.slice(4)}</h3>
        if (line.startsWith('- ') || line.startsWith('* ')) return <p key={i} className="flex gap-2"><span className="text-blue-400 flex-shrink-0">•</span><span>{line.slice(2)}</span></p>
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold">{line.slice(2, -2)}</p>
        if (line.trim() === '') return <div key={i} className="h-1" />
        return <p key={i} className="text-sm leading-relaxed">{line}</p>
      })}
    </div>
  )
}

type Stage = 'setup' | 'interview' | 'report'

interface Score {
  clarity: number
  relevance: number
  depth: number
  overall: number
  feedback: string
}

export function InterviewBot() {
  const { user } = useAuth()
  const [stage, setStage] = useState<Stage>('setup')
  const [jobTitle, setJobTitle] = useState('Software Engineer')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [questionNum, setQuestionNum] = useState(1)
  const [totalQuestions, setTotalQuestions] = useState(7)
  const [answer, setAnswer] = useState('')
  const [lastScore, setLastScore] = useState<Score | null>(null)
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState('')
  const [avgScore, setAvgScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(120)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (stage === 'interview') {
      setTimeLeft(120)
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!)
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [question, stage])

  async function startInterview() {
    if (!user) return
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ''
      const result = await aiService.interviewStart(user.id, jobTitle, null, token)
      setSessionId(result.session_id)
      setQuestion(result.first_question)
      setTotalQuestions(result.total_questions)
      setQuestionNum(1)
      setStage('interview')
    } catch (e: any) {
      alert(e.message || 'Failed to start interview')
    } finally {
      setLoading(false)
    }
  }

  async function submitAnswer() {
    if (!answer.trim() || !sessionId || !user) return
    setLoading(true)
    if (timerRef.current) clearInterval(timerRef.current)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ''
      const result = await aiService.interviewRespond(sessionId, user.id, answer, token)
      setLastScore(result.score)
      setAnswer('')

      if (result.done) {
        // Get final report
        const report = await aiService.interviewEnd(sessionId, user.id, token)
        setReport(report.report)
        setAvgScore(report.average_score)
        setStage('report')
      } else {
        setQuestion(result.next_question)
        setQuestionNum(result.question_number)
        setLastScore(result.score)
      }
    } catch (e: any) {
      alert(e.message || 'Failed to submit answer')
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = (s: number) =>
    s >= 7 ? 'text-green-400' : s >= 5 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Interview Simulator</h1>
            <p className="text-muted text-sm">Practice with an AI interviewer and get instant feedback</p>
          </div>
        </div>

        {/* Stage: Setup */}
        {stage === 'setup' && (
          <div className="bg-surface border border-border rounded-2xl p-8 space-y-6">
            <h2 className="text-xl font-semibold">Configure Your Interview</h2>
            <div className="space-y-2">
              <label className="text-sm text-muted font-medium">Target Role</label>
              <input
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="e.g. Frontend Developer, Data Scientist..."
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-300 space-y-1">
              <p>✅ 7 tailored questions based on the role</p>
              <p>✅ Real-time scoring (Clarity, Relevance, Depth)</p>
              <p>✅ Detailed feedback report at the end</p>
              <p>⏱️ 2 minutes per question</p>
            </div>
            <Button
              onClick={startInterview}
              disabled={loading || !jobTitle.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90 text-white py-3 rounded-xl font-medium"
            >
              {loading ? 'Setting up your interview...' : 'Start Interview'}
              {!loading && <ChevronRight className="w-4 h-4 ml-2 inline" />}
            </Button>
          </div>
        )}

        {/* Stage: Interview */}
        {stage === 'interview' && (
          <div className="space-y-4">
            {/* Progress */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${((questionNum - 1) / totalQuestions) * 100}%` }}
                />
              </div>
              <span className="text-sm text-muted">{questionNum}/{totalQuestions}</span>
              <span className={`text-sm font-mono ${timeLeft < 30 ? 'text-red-400' : 'text-muted'}`}>
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </span>
            </div>

            {/* Question Card */}
            <div className="bg-surface border border-border rounded-2xl p-6">
              <p className="text-xs text-blue-400 font-medium uppercase tracking-widest mb-3">
                Question {questionNum}
              </p>
              <p className="text-lg font-medium leading-relaxed">{question}</p>
            </div>

            {/* Previous score */}
            {lastScore && questionNum > 1 && (
              <div className="bg-surface/50 border border-border rounded-xl p-4 space-y-2">
                <p className="text-xs text-muted font-medium">Last answer scored:</p>
                <div className="flex gap-4 text-sm">
                  {(['clarity', 'relevance', 'depth'] as const).map(k => (
                    <div key={k}>
                      <span className="text-muted capitalize">{k}: </span>
                      <span className={scoreColor(lastScore[k])}>{lastScore[k]}/10</span>
                    </div>
                  ))}
                  <div className="ml-auto">
                    <span className="text-muted">Overall: </span>
                    <span className={`font-bold ${scoreColor(lastScore.overall)}`}>{lastScore.overall}/10</span>
                  </div>
                </div>
                <p className="text-xs text-muted italic">{lastScore.feedback}</p>
              </div>
            )}

            {/* Answer Box */}
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Type your answer here... (be specific, use examples)"
              className="w-full bg-surface border border-border rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-blue-500 transition-colors min-h-[160px] resize-none"
            />

            <Button
              onClick={submitAnswer}
              disabled={loading || !answer.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-90 text-white py-3 rounded-xl font-medium"
            >
              {loading ? 'Scoring your answer...' : questionNum === totalQuestions ? 'Submit Final Answer' : 'Submit Answer'}
            </Button>
          </div>
        )}

        {/* Stage: Report */}
        {stage === 'report' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-2xl p-6 text-center">
              <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
              <h2 className="text-2xl font-bold mb-1">Interview Complete!</h2>
              <p className="text-muted text-sm">Average Score</p>
              <p className={`text-5xl font-bold mt-2 ${scoreColor(avgScore)}`}>{avgScore}<span className="text-2xl text-muted">/10</span></p>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-6">
              <SimpleMarkdown text={report} />
            </div>

            <Button
              onClick={() => { setStage('setup'); setSessionId(null); setLastScore(null); setReport('') }}
              className="w-full border border-blue-500/40 text-blue-300 hover:bg-blue-600/10 py-3 rounded-xl"
            >
              Start Another Interview
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
