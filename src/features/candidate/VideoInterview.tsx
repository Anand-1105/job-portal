import { useState, useRef, useEffect } from 'react'
import { Camera, Mic, StopCircle, Play, Shield, AlertCircle, CheckCircle2, Video as VideoIcon, Brain } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { aiService } from '@/lib/aiService'
import { useAuth } from '@/features/auth'
import { Link } from 'react-router-dom'

declare global {
  interface Window {
    faceapi: any;
  }
}

export function VideoInterview() {
  const { user } = useAuth()
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [recording, setRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const [proctoringActive, setProctoringActive] = useState(false)
  const [faceDetected, setFaceDetected] = useState(true)
  const [warnings, setWarnings] = useState<string[]>([])
  const [transcript, setTranscript] = useState<string | null>(null)
  const [evaluation, setEvaluation] = useState<any>(null)
  const [question, setQuestion] = useState("Explain your experience with React and state management.")
  const [proctoringStats, setProctoringStats] = useState({ faceMissingCount: 0, multipleFacesCount: 0, totalChecks: 0 })
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  // Load face-api models & start proctoring
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/'
        await window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
        setProctoringActive(true)
      } catch (err) {
        console.error("Face-api models failed to load", err)
      }
    }
    if (window.faceapi) loadModels()
  }, [])

  // Real-time proctoring loop
  useEffect(() => {
    let interval: any
    if (proctoringActive && stream && videoRef.current) {
      interval = setInterval(async () => {
        if (!videoRef.current) return
        const detections = await window.faceapi.detectAllFaces(
          videoRef.current, 
          new window.faceapi.TinyFaceDetectorOptions()
        )
        
        const isMissing = detections.length === 0
        const isMultiple = detections.length > 1

        if (recording) {
          setProctoringStats(prev => ({
            ...prev,
            totalChecks: prev.totalChecks + 1,
            faceMissingCount: prev.faceMissingCount + (isMissing ? 1 : 0),
            multipleFacesCount: prev.multipleFacesCount + (isMultiple ? 1 : 0)
          }))
        }

        if (isMissing) {
          setFaceDetected(false)
          setWarnings(prev => [...new Set([...prev, "Face not detected! Please stay in frame."])])
        } else if (isMultiple) {
          setWarnings(prev => [...new Set([...prev, "Multiple faces detected!"])])
        } else {
          setFaceDetected(true)
        }
      }, 2000)
    }
    return () => clearInterval(interval)
  }, [proctoringActive, stream, recording])

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setStream(s)
      if (videoRef.current) videoRef.current.srcObject = s
    } catch (err) {
      console.error("Camera access denied", err)
    }
  }

  const startRecording = () => {
    if (!stream) return
    chunksRef.current = []
    setProctoringStats({ faceMissingCount: 0, multipleFacesCount: 0, totalChecks: 0 }) // Reset
    const recorder = new MediaRecorder(stream)
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
    recorder.onstop = handleRecordingStop
    recorder.start()
    mediaRecorderRef.current = recorder
    setRecording(true)
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  const handleRecordingStop = async () => {
    const blob = new Blob(chunksRef.current, { type: 'video/webm' })
    await uploadVideo(blob)
  }

  const uploadVideo = async (blob: Blob) => {
    if (!user) return
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ''
      
      const formData = new FormData()
      formData.append('video', blob, 'interview.webm')
      formData.append('candidate_id', user.id)

      const AI_BASE = import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:8000'
      const response = await fetch(`${AI_BASE}/video-interview/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
      const data = await response.json()
      
      // Now evaluate with proctoring stats
      const statsStr = encodeURIComponent(JSON.stringify(proctoringStats))
      const evalRes = await fetch(`${AI_BASE}/video-interview/evaluate?candidate_id=${user.id}&video_path=${data.video_url}&job_title=Full+Stack+Developer&proctoring_stats=${statsStr}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const evalData = await evalRes.json()
      setEvaluation(evalData.evaluation)
      setTranscript(evalData.transcript)
    } catch (err) {
      console.error("Upload failed", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-cyan-600 rounded-xl shadow-lg shadow-cyan-500/20">
          <VideoIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-serif">AI Video Interview</h1>
          <p className="text-sm text-muted">Real-time proctoring and AI evaluation</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Video Feed */}
        <div className="space-y-4">
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-border shadow-2xl">
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full object-cover mirror"
            />
            
            {/* Proctoring HUD - ONLY SHOW IF NOT RECORDING */}
            {!recording && (
              <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-medium backdrop-blur-md ${
                faceDetected ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                <Shield className="w-3.5 h-3.5" />
                {faceDetected ? "PROCTOR ACTIVE" : "FACE MISSING"}
              </div>
            )}

            {/* Subtle Active indicator during recording */}
            {recording && (
              <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 backdrop-blur-md">
                <Shield className="w-3.5 h-3.5" />
                MONITORING ACTIVE
              </div>
            )}

            {!stream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/50 backdrop-blur-sm">
                <Camera className="w-12 h-12 text-muted mb-4 animate-pulse" />
                <Button onClick={startCamera}>Enable Camera & Mic</Button>
              </div>
            )}

            {recording && (
              <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-full text-xs animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full" />
                RECORDING
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {!recording ? (
              <Button 
                onClick={startRecording} 
                disabled={!stream || loading}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500"
              >
                <Play className="w-4 h-4 mr-2" /> Start Interview
              </Button>
            ) : (
              <Button 
                onClick={stopRecording} 
                variant="destructive"
                className="flex-1"
              >
                <StopCircle className="w-4 h-4 mr-2" /> Finish Recording
              </Button>
            )}
          </div>

          {/* Warnings - ONLY SHOW IF NOT RECORDING */}
          {!recording && warnings.length > 0 && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-yellow-500 font-medium text-sm">
                <AlertCircle className="w-4 h-4" /> Proctoring Alerts
              </div>
              <div className="text-xs text-yellow-500/80">
                {warnings.slice(-3).map((w, i) => <p key={i}>• {w}</p>)}
              </div>
            </div>
          )}
        </div>

        {/* Right: Questions & Results */}
        <div className="space-y-6">
          <div className="p-6 bg-surface border border-border rounded-2xl shadow-sm">
            <h3 className="text-sm font-medium text-cyan-400 mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4" /> Current Question
            </h3>
            <p className="text-lg leading-relaxed mb-6 font-medium">
              "{question}"
            </p>
            <div className="flex items-center gap-4 text-xs text-muted">
              <div className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" /> Speak clearly
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Stay in frame
              </div>
            </div>
          </div>

          {loading && (
            <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
              <p className="text-sm text-muted">Aria is evaluating your video & transcript...</p>
            </div>
          )}

          {evaluation && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-6 bg-cyan-600/10 border border-cyan-500/20 rounded-2xl">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-cyan-400">
                  <CheckCircle2 className="w-5 h-5 text-green-400" /> Evaluation Results
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-surface rounded-xl border border-border">
                    <div className="text-2xl font-bold text-cyan-400">{evaluation.communication_score || 0}/10</div>
                    <div className="text-[10px] text-muted uppercase tracking-wider mt-1">Communication</div>
                  </div>
                  <div className="p-4 bg-surface rounded-xl border border-border">
                    <div className="text-2xl font-bold text-cyan-400">{evaluation.technical_depth || 0}/10</div>
                    <div className="text-[10px] text-muted uppercase tracking-wider mt-1">Tech Depth</div>
                  </div>
                </div>
                <div className="space-y-4 text-sm leading-relaxed">
                  <div>
                    <h4 className="font-medium text-foreground mb-1">AI Feedback</h4>
                    <p className="text-muted">{evaluation.feedback_summary || "Great job on articulating your points."}</p>
                  </div>
                </div>
              </div>
              
              <Link to="/dashboard">
                <Button variant="outline" className="w-full">Return to Dashboard</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
