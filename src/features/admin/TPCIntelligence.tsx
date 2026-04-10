import { useEffect, useState } from 'react'
import { aiService } from '@/lib/aiService'
import { supabase } from '@/lib/supabase'
import { Brain, Send, TrendingUp, AlertTriangle, XCircle, RefreshCw } from 'lucide-react'

interface Candidate {
  id: string; name: string; tier: string; overall_score: number
  interview_score: number; video_tech: number; video_comm: number
  placement_probability: number; segment: string; intervention: string
  application_count: number; avg_compatibility: number; proctoring?: any
}

const SEGMENT_CONFIG: Record<string, { color: string; icon: any; bg: string }> = {
  Ready:       { color: 'text-green-400',  icon: TrendingUp,    bg: 'bg-green-500/10 border-green-500/30' },
  Risky:       { color: 'text-yellow-400', icon: AlertTriangle, bg: 'bg-yellow-500/10 border-yellow-500/30' },
  Unprepared:  { color: 'text-red-400',    icon: XCircle,       bg: 'bg-red-500/10 border-red-500/30' },
}

export function TPCIntelligence() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [intervening, setIntervening] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => { fetchData() }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchData(true), 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchData(silent = false) {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ''
      const data = await aiService.getTPCIntelligence(token)
      setCandidates(data.candidates || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function handleIntervene(candidateId: string) {
    if (!message.trim()) return
    setSending(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ''
      await aiService.intervene(candidateId, message, token)
      alert('Intervention email sent.')
      setIntervening(null)
      setMessage('')
    } catch (e) {
      alert('Failed to send.')
    } finally {
      setSending(false)
    }
  }

  const filtered = filter === 'all' ? candidates : candidates.filter(c => c.segment === filter)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-12 lg:px-24 py-12">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-serif">TPC Intelligence Panel</h1>
          </div>
          <button onClick={() => fetchData(true)} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border border-border hover:border-purple-500/50 transition-colors text-sm disabled:opacity-40">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <p className="text-muted mb-8">AI-powered placement probability and student segmentation</p>

        {/* Segment filter */}
        <div className="flex gap-3 mb-8">
          {['all', 'Ready', 'Risky', 'Unprepared'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm border transition-all ${filter === f ? 'bg-purple-600 border-purple-600 text-white' : 'border-border hover:border-purple-500/50'}`}>
              {f === 'all' ? `All (${candidates.length})` : `${f} (${candidates.filter(c => c.segment === f).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted">Computing placement scores...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-surface/30 rounded-2xl border border-dashed border-border">
            <div className="text-muted mb-4 font-serif">Aria found zero candidates in this segment.</div>
            {(candidates as any).debug_errors && (candidates as any).debug_errors.length > 0 && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-left max-w-xl mx-auto rounded-lg overflow-auto max-h-40">
                <p className="font-bold mb-2 uppercase tracking-widest text-[10px]">System Debug Log:</p>
                {(candidates as any).debug_errors.map((e: string, i: number) => <p key={i}>• {e}</p>)}
              </div>
            )}
            <p className="text-[10px] text-muted mt-4">API Version: {(candidates as any).version || 'Legacy'}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map(c => {
              const seg = SEGMENT_CONFIG[c.segment] || SEGMENT_CONFIG['Unprepared']
              const Icon = seg.icon
              return (
                <div key={c.id} className={`border rounded-lg p-6 ${seg.bg}`}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className={`w-5 h-5 ${seg.color}`} />
                        <h3 className="text-lg font-semibold">{c.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${seg.bg} ${seg.color}`}>{c.segment}</span>
                        
                        {/* Proctoring Alert */}
                        {c.proctoring && (c.proctoring as any).faceMissingCount > ((c.proctoring as any).totalChecks * 0.2) && (
                          <span className="flex items-center gap-1 text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            Visibility Issues Detected
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div><p className="text-muted text-xs uppercase tracking-tighter">Readiness</p><p className="font-medium capitalize">{c.tier.replace('_', ' ')} ({c.overall_score}%)</p></div>
                        <div><p className="text-muted text-xs uppercase tracking-tighter">Text Interview</p><p className="font-medium">{c.interview_score}/100</p></div>
                        <div><p className="text-muted text-xs uppercase tracking-tighter">Video (Tech)</p><p className="font-medium">{c.video_tech}/10</p></div>
                        <div><p className="text-muted text-xs uppercase tracking-tighter">Video (Comm)</p><p className="font-medium">{c.video_comm}/10</p></div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3 border-t border-white/5 pt-3">
                        <div><p className="text-muted text-xs uppercase tracking-tighter">Placement Prob.</p><p className={`font-bold text-lg ${seg.color}`}>{c.placement_probability}%</p></div>
                        <div><p className="text-muted text-xs uppercase tracking-tighter">Applications</p><p className="font-medium">{c.application_count}</p></div>
                        <div><p className="text-muted text-xs uppercase tracking-tighter">Avg Compatibility</p><p className="font-medium">{c.avg_compatibility}%</p></div>
                      </div>
                      <p className="text-xs text-muted italic">💡 {c.intervention}</p>
                    </div>
                    <button onClick={() => { setIntervening(c.id); setMessage(c.intervention) }}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 transition-colors text-sm whitespace-nowrap">
                      <Send className="w-4 h-4" />
                      Intervene
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Intervene Modal */}
        {intervening && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setIntervening(null)}>
            <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-semibold mb-4">Send Intervention Email</h2>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5}
                className="w-full bg-background border border-border p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none mb-4" />
              <div className="flex gap-3">
                <button onClick={() => setIntervening(null)} className="flex-1 px-4 py-2 border border-border hover:bg-background transition-colors text-sm">Cancel</button>
                <button onClick={() => handleIntervene(intervening)} disabled={sending}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 transition-colors text-sm flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  {sending ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
