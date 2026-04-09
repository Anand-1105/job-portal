import { useState, useEffect } from 'react'
import { BookOpen, Calendar, Trash2, Eye, Sparkles, ChevronLeft, Map as MapIcon, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { aiService } from '@/lib/aiService'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth'
import ReactMarkdown from 'react-markdown'
import { Link } from 'react-router-dom'

interface Roadmap {
  id: string
  title: string
  content: string
  created_at: string
}

export function MyRoadmaps() {
  const { user } = useAuth()
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRoadmap, setSelectedRoadmap] = useState<Roadmap | null>(null)

  useEffect(() => {
    fetchRoadmaps()
  }, [])

  const fetchRoadmaps = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ''
      const res = await aiService.getSavedRoadmaps(token)
      setRoadmaps(res.roadmaps || [])
    } catch (err) {
      console.error("Failed to fetch roadmaps", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this career path?")) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ''
      await aiService.deleteRoadmap(id, token)
      setRoadmaps(prev => prev.filter(r => r.id !== id))
      if (selectedRoadmap?.id === id) setSelectedRoadmap(null)
    } catch (err) {
      alert("Failed to delete.")
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-2 hover:bg-surface rounded-full transition-colors text-muted hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapIcon className="w-5 h-5 text-pink-400" />
              <span className="text-xs uppercase tracking-widest text-pink-400 font-medium font-serif">Aria AI</span>
            </div>
            <h1 className="text-2xl font-serif">My Learning Roadmaps</h1>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: List */}
        <div className="lg:col-span-1 space-y-4">
          {loading ? (
            <div className="p-12 text-center text-muted animate-pulse">
              Loading your paths...
            </div>
          ) : roadmaps.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-surface/50">
              <BookOpen className="w-12 h-12 text-muted mx-auto mb-4 opacity-20" />
              <p className="text-sm text-muted mb-6">You haven't saved any roadmaps yet.</p>
              <Link to="/roadmap">
                <Button variant="outline" size="sm">Chat with Aria</Button>
              </Link>
            </div>
          ) : (
            roadmaps.map(r => (
              <div 
                key={r.id}
                onClick={() => setSelectedRoadmap(r)}
                className={`group cursor-pointer p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                  selectedRoadmap?.id === r.id 
                    ? 'bg-pink-600/10 border-pink-500/50 shadow-lg shadow-pink-500/5' 
                    : 'bg-surface border-border hover:border-pink-500/30'
                }`}
              >
                <div className="relative">
                  <h3 className="font-semibold mb-2 group-hover:text-pink-400 transition-colors line-clamp-1">
                    {r.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                  className="absolute top-4 right-4 p-2 text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-red-400/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Right: Viewer */}
        <div className="lg:col-span-2 min-h-[600px]">
          {selectedRoadmap ? (
            <div className="bg-surface border border-border rounded-2xl p-8 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 blur-3xl rounded-full -mr-20 -mt-20" />
              
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-600/20 rounded-lg text-pink-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-serif">{selectedRoadmap.title}</h2>
                    <p className="text-xs text-muted">Generated by Aria AI</p>
                  </div>
                </div>
              </div>

              <div className="prose prose-invert max-w-none roadmap-content">
                <ReactMarkdown>{selectedRoadmap.content}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 border border-border border-dashed rounded-2xl bg-surface/30">
              <MapIcon className="w-16 h-16 text-muted mb-6 opacity-10" />
              <h3 className="text-lg font-serif mb-2">Select a roadmap</h3>
              <p className="text-sm text-muted max-w-xs mx-auto">
                Pick a saved career path from the list on the left to view your personalized learning journey.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .roadmap-content h1 { font-size: 1.5rem; margin-top: 2rem; margin-bottom: 1rem; color: #f472b6; border-bottom: 1px solid #333; padding-bottom: 0.5rem; font-family: 'Playfair Display', serif; }
        .roadmap-content h2 { font-size: 1.25rem; margin-top: 1.5rem; margin-bottom: 1rem; color: #f472b6; font-family: 'Playfair Display', serif; }
        .roadmap-content h3 { font-size: 1.1rem; margin-top: 1.25rem; margin-bottom: 0.75rem; color: #cbd5e1; }
        .roadmap-content p { margin-bottom: 1rem; line-height: 1.6; color: #94a3b8; }
        .roadmap-content strong { color: #f8fafc; }
        .roadmap-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; color: #94a3b8; }
        .roadmap-content li { margin-bottom: 0.5rem; }
      `}</style>
    </div>
  )
}
