import { useState, useRef } from 'react'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { CheckCircle, AlertCircle, TrendingUp, Sparkles, Upload, Info, FileType, Check } from 'lucide-react'
import { analyzeResume, ATSAnalysisResult } from '@/lib/atsAnalyzer'
import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

export function ATSChecker() {
    const [resumeText, setResumeText] = useState('')
    const [jobDescription, setJobDescription] = useState('')
    const [analysis, setAnalysis] = useState<ATSAnalysisResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [fileName, setFileName] = useState<string | null>(null)
    const [inputType, setInputType] = useState<'upload' | 'text'>('upload')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        setFileName(file.name)
        setAnalysis(null) // Reset previous analysis

        try {
            if (file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer()
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
                let fullText = ''

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i)
                    const textContent = await page.getTextContent()
                    const pageText = textContent.items
                        .map((item: any) => item.str)
                        .join(' ')
                    fullText += pageText + '\n'
                }

                setResumeText(fullText)
            } else {
                const text = await file.text()
                setResumeText(text)
            }
        } catch (error) {
            console.error('Error reading file:', error)
            alert('Error reading file. Please try again.')
            setFileName(null)
            setResumeText('')
        } finally {
            setUploading(false)
        }
    }

    const clearFile = () => {
        setFileName(null)
        setResumeText('')
        setAnalysis(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleAnalyze = () => {
        if (!resumeText || !jobDescription) {
            alert('Please provide both resume text and job description')
            return
        }

        setLoading(true)
        // Simulate processing delay for realism
        setTimeout(() => {
            const result = analyzeResume(resumeText, jobDescription)
            setAnalysis(result)
            setLoading(false)
            // Scroll to results
            document.getElementById('analysis-results')?.scrollIntoView({ behavior: 'smooth' })
        }, 1200)
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-500'
        if (score >= 60) return 'text-amber-500'
        return 'text-rose-500'
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-5xl">
            {/* Header - Minimalist & Editorial */}
            <div className="text-center mb-16 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium tracking-wider uppercase">
                    <Sparkles className="w-3 h-3" />
                    AI Resume Optimizer
                </div>
                <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight text-white mb-4">
                    Is your resume ready for the role?
                </h1>
                <p className="text-xl text-muted max-w-2xl mx-auto font-light leading-relaxed">
                    Paste the job description and upload your resume. Our AI checks for keyword matches, formatting issues, and critical skills.
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 mb-12">
                {/* Left Column: Job Description */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-300 uppercase tracking-wide">1. The Job Description</label>
                        <Info className="w-4 h-4 text-muted hover:text-white cursor-help transition-colors" />
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-0 bg-purple-500/5 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <Textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the full job description here..."
                            className="min-h-[320px] bg-white/5 border-white/10 hover:border-white/20 focus:border-purple-500/50 rounded-xl resize-none font-mono text-sm leading-relaxed p-6 transition-all"
                        />
                    </div>
                </div>

                {/* Right Column: Resume Input */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-300 uppercase tracking-wide">2. Your Resume</label>
                        <div className="flex gap-4 text-xs font-medium">
                            <button
                                onClick={() => setInputType('upload')}
                                className={`transition-colors ${inputType === 'upload' ? 'text-blue-400' : 'text-muted hover:text-white'}`}
                            >
                                Upload File
                            </button>
                            <span className="text-white/10">|</span>
                            <button
                                onClick={() => setInputType('text')}
                                className={`transition-colors ${inputType === 'text' ? 'text-blue-400' : 'text-muted hover:text-white'}`}
                            >
                                Paste Text
                            </button>
                        </div>
                    </div>

                    <div className="relative group h-[320px]">
                        {/* FIX: pointer-events-none on overlay to allow clicks */}
                        <div className="absolute inset-0 bg-blue-500/5 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                        {inputType === 'upload' ? (
                            <div className="h-full bg-white/5 border-2 border-dashed border-white/10 hover:border-blue-500/30 rounded-xl transition-all flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                                {fileName ? (
                                    <div className="relative z-10 animate-in fade-in zoom-in duration-300">
                                        <div className="w-20 h-20 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-400">
                                            <FileType className="w-10 h-10" />
                                        </div>
                                        <h3 className="font-medium text-lg text-white mb-1 truncate max-w-[250px]">{fileName}</h3>
                                        <p className="text-sm text-green-400 flex items-center justify-center gap-1.5 mb-6">
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            Ready for analysis
                                        </p>
                                        <div className="flex gap-3 justify-center">
                                            <button
                                                onClick={clearFile}
                                                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-muted hover:text-white transition-colors"
                                            >
                                                Change
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,.txt"
                                            onChange={handleFileUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                        />
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-muted group-hover:scale-110 transition-transform duration-300">
                                            <Upload className="w-7 h-7" />
                                        </div>
                                        <h3 className="text-lg font-medium text-white mb-2">Drop your resume here</h3>
                                        <p className="text-sm text-muted mb-6 max-w-xs">
                                            Support for PDF and TXT files.
                                            <br />
                                            <span className="text-xs opacity-70 mt-2 block">Secure local processing only.</span>
                                        </p>
                                        <div className="px-5 py-2.5 bg-blue-600/20 text-blue-300 rounded-lg text-sm font-medium border border-blue-500/20">
                                            Select File
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <Textarea
                                value={resumeText}
                                onChange={(e) => setResumeText(e.target.value)}
                                placeholder="Paste your resume text here..."
                                className="h-full bg-white/5 border-white/10 hover:border-white/20 focus:border-blue-500/50 rounded-xl resize-none font-mono text-sm leading-relaxed p-6 transition-all"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="flex justify-center mb-24">
                <Button
                    onClick={handleAnalyze}
                    disabled={loading || !resumeText || !jobDescription}
                    size="lg"
                    className="relative px-12 py-7 text-lg rounded-full font-medium tracking-wide transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 animate-gradient-x" />
                    <span className="relative flex items-center gap-2">
                        {loading ? 'Analyzing...' : 'Generate Analysis'}
                        {!loading && <TrendingUp className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                    </span>
                </Button>
            </div>

            {/* Analysis Results */}
            {analysis && (
                <div id="analysis-results" className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-20 border-t border-white/10 pt-20">

                    {/* 1. The Score - Big & Bold (Fixed Overlap) */}
                    <div className="text-center">
                        <div className="flex items-baseline justify-center gap-1 font-serif font-bold tracking-tighter opacity-90">
                            <span className={`text-[120px] leading-none ${getScoreColor(analysis.score)}`}>
                                {analysis.score}
                            </span>
                            <span className="text-4xl text-muted font-thin">/100</span>
                        </div>
                        <p className="text-xl text-muted font-light mt-4">
                            {analysis.score >= 80 ? 'Excellent Match. You are ready.' :
                                analysis.score >= 60 ? 'Strong Candidate. Refine a few details.' :
                                    'Optimization Needed. Focus on missing skills.'}
                        </p>
                    </div>

                    {/* 2. Key Metrics Grid */}
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Skills Matched */}
                        <div className="bg-surface border border-border rounded-xl p-6 relative overflow-hidden group hover:border-blue-500/30 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <CheckCircle className="w-16 h-16" />
                            </div>
                            <div className="mb-2 text-muted text-sm uppercase tracking-wider">Matched Skills</div>
                            <div className="text-4xl font-serif text-blue-400">{analysis.totalSkillsFound}</div>
                            <div className="mt-2 text-sm text-muted">Technical keywords found</div>
                        </div>

                        {/* Impact Words (New) */}
                        <div className="bg-surface border border-border rounded-xl p-6 relative overflow-hidden group hover:border-purple-500/30 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Sparkles className="w-16 h-16" />
                            </div>
                            <div className="mb-2 text-muted text-sm uppercase tracking-wider">Power Words</div>
                            <div className="text-4xl font-serif text-purple-400">{analysis.strongWords?.length || 0}</div>
                            <div className="mt-2 text-sm text-muted">Action verbs detected</div>
                        </div>

                        {/* Weakness Detector (New) */}
                        <div className="bg-surface border border-border rounded-xl p-6 relative overflow-hidden group hover:border-rose-500/30 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <AlertCircle className="w-16 h-16" />
                            </div>
                            <div className="mb-2 text-muted text-sm uppercase tracking-wider">Weak Phrases</div>
                            <div className="text-4xl font-serif text-rose-400">{analysis.weakWords?.length || 0}</div>
                            <div className="mt-2 text-sm text-muted">Passive or vague terms</div>
                        </div>
                    </div>

                    {/* 3. Skills Analysis */}
                    <div className="grid md:grid-cols-2 gap-16">
                        {/* Missing Skills */}
                        <div>
                            <h3 className="text-2xl font-serif mb-8 flex items-center gap-3 text-white">
                                <span className="w-8 h-px bg-rose-500"></span>
                                Missing Keywords
                            </h3>
                            <div className="space-y-8">
                                {Object.entries(analysis.missingSkills).map(([category, skills]) => (
                                    skills.length > 0 && (
                                        <div key={category}>
                                            <h4 className="text-xs uppercase tracking-widest text-muted mb-4">{category}</h4>
                                            <div className="flex flex-wrap gap-x-3 gap-y-3">
                                                {skills.map((skill, idx) => (
                                                    <span key={idx} className="group relative inline-flex items-center gap-2 px-4 py-2 bg-rose-500/5 text-rose-300 text-sm border border-rose-500/10 rounded-lg hover:bg-rose-500/10 transition-colors cursor-default">
                                                        {skill.name}
                                                        {skill.weight > 2 && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                ))}
                                {Object.keys(analysis.missingSkills).length === 0 && (
                                    <div className="text-muted italic">No key skills missing. Great job!</div>
                                )}
                            </div>
                        </div>

                        {/* Matched Skills */}
                        <div>
                            <h3 className="text-2xl font-serif mb-8 flex items-center gap-3 text-white">
                                <span className="w-8 h-px bg-emerald-500"></span>
                                Matched Keywords
                            </h3>
                            <div className="space-y-8">
                                {Object.entries(analysis.matchedSkills).map(([category, skills]) => (
                                    skills.length > 0 && (
                                        <div key={category}>
                                            <h4 className="text-xs uppercase tracking-widest text-muted mb-4">{category}</h4>
                                            <div className="flex flex-wrap gap-x-3 gap-y-3">
                                                {skills.map((skill, idx) => (
                                                    <span key={idx} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/5 text-emerald-300 text-sm border border-emerald-500/10 rounded-lg">
                                                        <Check className="w-3 h-3 opacity-50" />
                                                        {skill.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 4. Smart Recommendations */}
                    <div className="max-w-3xl mx-auto bg-gradient-to-b from-white/5 to-transparent p-8 md:p-12 rounded-2xl border border-white/5">
                        <h3 className="text-2xl font-serif mb-8 text-center text-white">AI Recommendations</h3>
                        <div className="space-y-6">
                            {analysis.recommendations.map((rec, idx) => (
                                <div key={idx} className="flex gap-4 items-start">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-mono text-muted mt-0.5">
                                        {idx + 1}
                                    </span>
                                    <p className="text-lg text-gray-300 font-light leading-relaxed">
                                        {rec}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
