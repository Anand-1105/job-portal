import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/features/auth'
import { ThemeProvider } from '@/lib/ThemeContext'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PageTransition } from '@/components/layout/PageTransition'

import { CursorSpotlight } from '@/components/ui/CursorSpotlight'

// Features
import { LandingPage } from '@/features/landing/LandingPage'
import { HowItWorks } from '@/features/landing/HowItWorks'
import { Login } from '@/features/auth/Login'
import { Signup } from '@/features/auth/Signup'
import { Terms } from '@/features/legal/Terms'
import { Privacy } from '@/features/legal/Privacy'
import { CandidateDashboard } from '@/features/candidate/Dashboard'
import { RecruiterDashboard } from '@/features/recruiter/Dashboard'
import { AdminDashboard } from '@/features/admin/Dashboard'
import { UserManagement } from '@/features/admin/UserManagement'
import { JobManagement } from '@/features/admin/JobManagement'
import { ApplicationAnalytics } from '@/features/admin/ApplicationAnalytics'
import { RecruiterProfile } from '@/features/admin/RecruiterProfile'
import { JobApplicants as AdminJobApplicants } from '@/features/admin/JobApplicantsAdmin'
import { JobBoard } from '@/features/candidate/JobBoard'
import { JobDetail } from '@/features/candidate/JobDetail'
import { JobApply } from '@/features/jobs/JobApply'
import { CandidateProfile } from '@/features/candidate/Profile'
import { CreateJob } from '@/features/recruiter/CreateJob'
import { JobApplicants } from '@/features/recruiter/JobApplicants'
import { ATSChecker } from '@/features/candidate/ATSChecker'

function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground font-sans antialiased selection:bg-foreground selection:text-background relative">
            <CursorSpotlight />
            <Navbar />
            <main className="flex-1">
                {children}
            </main>
            <Footer />
        </div>
    )
}

function DashboardRouter() {
    const { profile, loading } = useAuth()

    if (loading) {
        return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
    }

    if (!profile) return null

    switch (profile.role) {
        case 'candidate':
            return <CandidateDashboard />
        case 'recruiter':
            return <RecruiterDashboard />
        case 'admin':
            return <AdminDashboard />
        default:
            return <Navigate to="/" replace />
    }
}

function AnimatedRoutes() {
    const location = useLocation()

    return (
        <PageTransition>
            <Routes location={location}>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/jobs" element={<JobBoard />} />
                <Route path="/jobs/:id" element={<JobDetail />} />
                <Route path="/jobs/:jobId/apply" element={<JobApply />} />

                {/* Protected Routes */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardRouter />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/ats-checker"
                    element={
                        <ProtectedRoute allowedRoles={['candidate']}>
                            <ATSChecker />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute allowedRoles={['candidate']}>
                            <CandidateProfile />
                        </ProtectedRoute>
                    }
                />
                {/* Recruiter Routes */}
                <Route
                    path="/recruiter/jobs/new"
                    element={
                        <ProtectedRoute allowedRoles={['recruiter']}>
                            <CreateJob />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/recruiter/applicants"
                    element={
                        <ProtectedRoute allowedRoles={['recruiter']}>
                            <JobApplicants />
                        </ProtectedRoute>
                    }
                />

                {/* Admin Routes */}
                <Route
                    path="/admin/users"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <UserManagement />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/jobs"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <JobManagement />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/applications"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <ApplicationAnalytics />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/recruiter/:recruiterId"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <RecruiterProfile />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/job/:jobId/applicants"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AdminJobApplicants />
                        </ProtectedRoute>
                    }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </PageTransition>
    )
}

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Router>
                    <Layout>
                        <AnimatedRoutes />
                    </Layout>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    )
}

export default App
