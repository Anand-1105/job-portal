import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, BookOpen } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { aiService } from '@/lib/aiService'
import { useAuth } from '@/features/auth'

function SimpleMarkdown({ text }: { text: string }) {
  return (
    <div className="space-y-1">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('## ')) return <h2 key={i} className="text-base font-bold mt-3 mb-1">{line.slice(3)}</h2>
        if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-semibold mt-2 mb-0.5 text-purple-300">{line.slice(4)}</h3>
        if (line.startsWith('- ') || line.startsWith('* ')) return <p key={i} className="flex gap-2 text-sm"><span className="text-purple-400 flex-shrink-0">•</span><span>{line.slice(2)}</span></p>
        if (line.trim() === '') return <div key={i} className="h-1" />
        return <p key={i} className="text-sm leading-relaxed">{line.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
      })}
    </div>
  )
}

interface Message {
  role: 'user' | 'ai'
  content: string
  ts: number
}

export function RoadmapChat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: "👋 Hi! I'm **Aria**, your AI career coach. I'm here to build you a personalized career roadmap based on your goals and current skills.\n\nWhat role or field are you looking to break into — or grow within?",
      ts: Date.now()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [roadmapReady, setRoadmapReady] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const [saving, setSaving] = useState(false)
  const [pendingRoadmapContent, setPendingRoadmapContent] = useState<string | null>(null)

  async function handleSave() {
    if (!user || saving || !pendingRoadmapContent) return

    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ''
      await aiService.saveRoadmap({
        candidate_id: user.id,
        title: "Personalized Career Roadmap",
        content: pendingRoadmapContent
      }, token)
      setRoadmapReady(false) // Hide button after success
      setPendingRoadmapContent(null)
      setMessages(prev => [...prev, { role: 'ai', content: '✅ Roadmap saved to your profile!', ts: Date.now() }])
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  async function send() {
    if (!input.trim() || loading || !user) return
    const userMsg = input.trim()
    setInput('')
    setLoading(true)
    setMessages(prev => [...prev, { role: 'user', content: userMsg, ts: Date.now() }])

    try {
      // Always refresh session to get a valid token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setMessages(prev => [...prev, { role: 'ai', content: '❌ Please log in again to continue.', ts: Date.now() }])
        return
      }
      const token = session.access_token
      const result = await aiService.roadmapChat(user.id, userMsg, sessionId, token)
      setSessionId(result.session_id)
      setMessages(prev => [...prev, { role: 'ai', content: result.message, ts: Date.now() }])
      if (result.roadmap_ready) {
        setRoadmapReady(true)
        setPendingRoadmapContent(result.message)
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'ai', content: '❌ Sorry, something went wrong. Please try again.', ts: Date.now() }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Career Roadmap AI</h1>
            <p className="text-xs text-muted">Powered by Aria — your personal AI coach</p>
          </div>
          {roadmapReady ? (
            <button
              onClick={handleSave}
              disabled={saving}
              className="ml-auto text-xs px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-full flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {saving ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <BookOpen className="w-3.5 h-3.5" />}
              Save to Profile
            </button>
          ) : (
            <span className="ml-auto text-[10px] uppercase tracking-wider text-muted font-medium bg-surface px-2 py-1 rounded-md border border-border">
              Aria AI
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 space-y-4 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'ai' ? 'bg-gradient-to-br from-purple-600 to-pink-600' : 'bg-surface border border-border'
            }`}>
              {msg.role === 'ai' ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-muted" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'ai'
                ? 'bg-surface border border-border text-foreground'
                : 'bg-purple-600 text-white'
            }`}>
              {msg.role === 'ai' ? (
                <SimpleMarkdown text={msg.content} />
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-surface border border-border rounded-2xl px-4 py-3 flex items-center gap-1">
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-surface/80 backdrop-blur-sm sticky bottom-0">
        <div className="max-w-3xl mx-auto px-4 py-4 flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Tell Aria your career goals..."
            disabled={loading}
            className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-colors placeholder:text-muted disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
