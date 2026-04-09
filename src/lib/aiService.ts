const AI_BASE = import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:8000'

async function aiPost(endpoint: string, body: object, token: string) {
  const controller = new AbortController()
  const isAutoApply = endpoint.includes('auto-apply')
  const isLinkedinApply = endpoint.includes('linkedin-apply')
  const isCompatibility = endpoint.includes('compatibility')
  const timeout = setTimeout(() => controller.abort(), 
    isLinkedinApply ? 300000 : // 5 minutes for bot
    (isAutoApply || isCompatibility) ? 120000 : 35000
  )
  
  console.log(`[AI-Service] POST ${endpoint}`, body)
  
  try {
    const res = await fetch(`${AI_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(body),
      signal: controller.signal
    })
    if (!res.ok) {
      const errText = await res.text()
      console.error(`[AI-Service] POST ${endpoint} failed:`, errText)
      throw new Error(errText)
    }
    const data = await res.json()
    console.log(`[AI-Service] POST ${endpoint} success:`, data)
    return data
  } catch (e: any) {
    console.error(`[AI-Service] POST ${endpoint} error:`, e)
    if (e.name === 'AbortError') throw new Error('Request timed out. Please try again.')
    throw e
  } finally {
    clearTimeout(timeout)
  }
}

async function aiGet(endpoint: string, token: string) {
  console.log(`[AI-Service] GET ${endpoint}`)
  const res = await fetch(`${AI_BASE}${endpoint}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) {
    const errText = await res.text()
    console.error(`[AI-Service] GET ${endpoint} failed:`, errText)
    throw new Error(errText)
  }
  const data = await res.json()
  console.log(`[AI-Service] GET ${endpoint} success:`, data)
  return data
}


export const aiService = {
  saveProfile: (data: object, token: string) =>
    aiPost('/readiness/profile', data, token),

  generateTest: (candidateId: string, token: string) =>
    aiPost('/readiness/generate-test', { candidate_id: candidateId }, token),

  submitAssessment: (data: object, token: string) =>
    aiPost('/readiness/submit', data, token),

  evaluate: (candidateId: string, token: string) =>
    aiPost('/readiness/evaluate', { candidate_id: candidateId }, token),

  getResult: (candidateId: string, token: string) =>
    aiGet(`/readiness/result/${candidateId}`, token),

  getCompatibility: (candidateId: string, jobIds: string[], token: string) =>
    aiPost('/jobs/compatibility', { candidate_id: candidateId, job_ids: jobIds }, token),

  lookupEmail: (data: object, token: string) =>
    aiPost('/jobs/lookup-email', data, token),

  quickApply: (data: object, token: string) =>
    aiPost('/jobs/quick-apply', data, token),
  tailorResume: (candidateId: string, jobId: string, token: string) =>
    aiPost('/actions/tailor-resume', { candidate_id: candidateId, job_id: jobId }, token),

  generateColdEmail: (candidateId: string, jobId: string, token: string) =>
    aiPost('/actions/cold-email', { candidate_id: candidateId, job_id: jobId }, token),

  getArtifacts: (candidateId: string, token: string) =>
    aiGet(`/actions/artifacts/${candidateId}`, token),

  getTPCIntelligence: (token: string) =>
    aiGet('/admin/tpc-intelligence', token),

  getSavedRoadmaps: (token: string) => 
    aiGet('/roadmap/list', token),

  deleteRoadmap: (id: string, token: string) => 
    aiGet(`/roadmap/delete/${id}`, token),

  intervene: (candidateId: string, message: string, token: string) =>
    aiPost('/admin/intervene', { candidate_id: candidateId, message }, token),

  triggerNudge: (token: string) =>
    aiPost('/nudge/trigger', {}, token),

  scrapeJobs: (keywords: string, location: string, token: string) =>
    aiPost('/jobs/scrape', { keywords, location, limit: 10 }, token),

  scrapeJobsForCandidate: (candidateId: string, token: string) =>
    aiPost(`/readiness/scrape-jobs/${candidateId}`, {}, token),

  autoApply: (candidateId: string, jobId: string, coverLetter: string, token: string) =>
    aiPost('/jobs/auto-apply', { candidate_id: candidateId, job_id: jobId, cover_letter: coverLetter }, token),

  applyToLinkedIn: (candidateId: string, jobUrl: string, token: string) =>
    aiPost('/actions/linkedin-apply', { candidate_id: candidateId, job_url: jobUrl }, token),

  getApplyStatus: (taskId: string, token: string) =>
    aiGet(`/jobs/apply-status/${taskId}`, token),

  // Roadmap Chatbot
  roadmapChat: (candidateId: string, message: string, sessionId: string | null, token: string) =>
    aiPost('/roadmap/chat', { candidate_id: candidateId, message, session_id: sessionId }, token),
  
  saveRoadmap: (data: { candidate_id: string, title: string, content: string }, token: string) =>
    aiPost('/roadmap/save', data, token),

  // AI Interview
  interviewStart: (candidateId: string, jobTitle: string, jobId: string | null, token: string) =>
    aiPost('/interview/start', { candidate_id: candidateId, job_title: jobTitle, job_id: jobId }, token),

  interviewRespond: (sessionId: string, candidateId: string, answer: string, token: string) =>
    aiPost('/interview/respond', { session_id: sessionId, candidate_id: candidateId, answer }, token),

  interviewEnd: (sessionId: string, candidateId: string, token: string) =>
    aiPost('/interview/end', { session_id: sessionId, candidate_id: candidateId }, token),
}
