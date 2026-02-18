import { Link } from 'react-router-dom'
import { UserPlus, Search, FileText, CheckCircle2, Briefcase, Users } from 'lucide-react'

export function HowItWorks() {
    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <section className="border-b border-border px-4 md:px-12 lg:px-24 py-24">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="font-serif text-5xl md:text-6xl mb-6">
                        How It Works
                    </h1>
                    <p className="text-xl text-muted leading-relaxed max-w-2xl mx-auto">
                        A streamlined platform connecting talented candidates with opportunities.
                        Simple, transparent, and designed for success.
                    </p>
                </div>
            </section>

            {/* For Candidates Section */}
            <section className="border-b border-border px-4 md:px-12 lg:px-24 py-24 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-16">
                        <h2 className="font-serif text-4xl mb-4">For Job Seekers</h2>
                        <p className="text-muted text-lg">Your path to the perfect opportunity</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Step 1 */}
                        <div className="group">
                            <div className="relative mb-6">
                                <div className="absolute -top-4 -left-4 text-8xl font-serif text-purple-500/10 select-none">
                                    01
                                </div>
                                <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 w-16 h-16 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow duration-300">
                                    <UserPlus className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-serif mb-3">Create Your Profile</h3>
                            <p className="text-muted leading-relaxed">
                                Sign up in seconds. Add your details, skills, and what you're looking for.
                                Your profile is your professional identity.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="group">
                            <div className="relative mb-6">
                                <div className="absolute -top-4 -left-4 text-8xl font-serif text-purple-500/10 select-none">
                                    02
                                </div>
                                <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 w-16 h-16 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow duration-300">
                                    <Search className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-serif mb-3">Find Your Match</h3>
                            <p className="text-muted leading-relaxed">
                                Browse curated opportunities from top companies. Filter by role, location,
                                and salary to find your perfect fit.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="group">
                            <div className="relative mb-6">
                                <div className="absolute -top-4 -left-4 text-8xl font-serif text-purple-500/10 select-none">
                                    03
                                </div>
                                <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 w-16 h-16 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow duration-300">
                                    <FileText className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-serif mb-3">Apply with Ease</h3>
                            <p className="text-muted leading-relaxed">
                                Our conversational application flow makes applying natural and quick.
                                No lengthy forms—just tell your story.
                            </p>
                        </div>
                    </div>

                    {/* Bonus Features */}
                    <div className="mt-16 bg-surface border border-border p-8 rounded-lg">
                        <h3 className="text-2xl font-serif mb-6">Bonus Tools for Candidates</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="flex gap-4">
                                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-medium mb-1">ATS Resume Checker</h4>
                                    <p className="text-sm text-muted">
                                        Upload your resume and get instant feedback on how well it passes
                                        Applicant Tracking Systems.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-medium mb-1">Application Dashboard</h4>
                                    <p className="text-sm text-muted">
                                        Track all your applications in one place. See status updates and
                                        manage your job search efficiently.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* For Recruiters Section */}
            <section className="border-b border-border px-4 md:px-12 lg:px-24 py-24 bg-gradient-to-br from-pink-500/5 via-transparent to-transparent">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-16">
                        <h2 className="font-serif text-4xl mb-4">For Recruiters</h2>
                        <p className="text-muted text-lg">Find the perfect talent, effortlessly</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Step 1 */}
                        <div className="group">
                            <div className="relative mb-6">
                                <div className="absolute -top-4 -left-4 text-8xl font-serif text-pink-500/10 select-none">
                                    01
                                </div>
                                <div className="relative bg-gradient-to-br from-pink-600 to-purple-600 w-16 h-16 flex items-center justify-center shadow-lg shadow-pink-500/20 group-hover:shadow-pink-500/40 transition-shadow duration-300">
                                    <Briefcase className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-serif mb-3">Post Your Position</h3>
                            <p className="text-muted leading-relaxed">
                                Create compelling job listings in minutes. Specify requirements, salary,
                                and what makes your opportunity unique.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="group">
                            <div className="relative mb-6">
                                <div className="absolute -top-4 -left-4 text-8xl font-serif text-pink-500/10 select-none">
                                    02
                                </div>
                                <div className="relative bg-gradient-to-br from-pink-600 to-purple-600 w-16 h-16 flex items-center justify-center shadow-lg shadow-pink-500/20 group-hover:shadow-pink-500/40 transition-shadow duration-300">
                                    <Users className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-serif mb-3">Review Applicants</h3>
                            <p className="text-muted leading-relaxed">
                                Access a dashboard of qualified candidates. View applications, resumes,
                                and relevant experience all in one place.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="group">
                            <div className="relative mb-6">
                                <div className="absolute -top-4 -left-4 text-8xl font-serif text-pink-500/10 select-none">
                                    03
                                </div>
                                <div className="relative bg-gradient-to-br from-pink-600 to-purple-600 w-16 h-16 flex items-center justify-center shadow-lg shadow-pink-500/20 group-hover:shadow-pink-500/40 transition-shadow duration-300">
                                    <CheckCircle2 className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-serif mb-3">Hire the Best</h3>
                            <p className="text-muted leading-relaxed">
                                Shortlist candidates, manage the hiring pipeline, and connect with
                                top talent that matches your needs.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Choose Us Section */}
            <section className="px-4 md:px-12 lg:px-24 py-24">
                <div className="max-w-4xl mx-auto">
                    <h2 className="font-serif text-4xl mb-12 text-center">Why Choose Our Platform?</h2>
                    <div className="space-y-8">
                        <div className="flex gap-6 items-start">
                            <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                            <div>
                                <h3 className="text-xl font-medium mb-2">Fast & Simple</h3>
                                <p className="text-muted leading-relaxed">
                                    No bloated forms or unnecessary steps. We've streamlined the entire
                                    process so you can focus on what matters—finding the right match.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-6 items-start">
                            <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                            <div>
                                <h3 className="text-xl font-medium mb-2">Transparent</h3>
                                <p className="text-muted leading-relaxed">
                                    Clear salary ranges, honest job descriptions, and straightforward
                                    communication. No surprises, just clarity.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-6 items-start">
                            <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                            <div>
                                <h3 className="text-xl font-medium mb-2">Modern Experience</h3>
                                <p className="text-muted leading-relaxed">
                                    Built with modern technology and design principles. A delightful
                                    experience on any device.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="border-t border-border px-4 md:px-12 lg:px-24 py-24 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="font-serif text-4xl mb-6">Ready to Get Started?</h2>
                    <p className="text-xl text-muted mb-12">
                        Join thousands of candidates and recruiters finding their perfect match.
                    </p>
                    <div className="flex gap-4 justify-center flex-wrap">
                        <Link
                            to="/signup"
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-8 py-4 text-lg font-medium transition-all duration-300 shadow-lg shadow-purple-500/20"
                        >
                            Create Account
                        </Link>
                        <Link
                            to="/jobs"
                            className="border border-foreground px-8 py-4 text-lg font-medium hover:bg-foreground hover:text-background transition-all duration-300"
                        >
                            Browse Jobs
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}
