import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function Signup() {
    const { signUp } = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState<'candidate' | 'recruiter'>('candidate')
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        // Validation
        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            setLoading(false)
            return
        }

        try {
            const { data, error: authError } = await signUp(email, password, {
                full_name: fullName,
                role: role,
            })

            if (authError) throw authError

            if (data.user) {
                // Profile is created automatically by database trigger
            }

            alert('Account created! Please sign in.')
            navigate('/login')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Left sidebar */}
            <div className="hidden md:flex md:w-2/5 bg-surface flex-col justify-between p-12">
                <div>
                    <h2 className="font-serif text-h2 mb-4">Join us</h2>
                    <p className="text-muted leading-relaxed">
                        Create an account to start building meaningful connections.
                    </p>
                </div>
                <div className="space-y-2 font-mono text-xs text-muted">
                    <div>© 2024 Chosen</div>
                    <div>Connecting talent with purpose</div>
                </div>
            </div>

            {/* Right side - form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="mb-12">
                        <h1 className="text-h3 mb-2">Create account</h1>
                        <p className="text-muted">
                            Already have an account?{' '}
                            <Link to="/login" className="text-foreground hover:opacity-70 transition-opacity">
                                Sign in
                            </Link>
                        </p>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-8">
                        {error && (
                            <div className="border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        {/* Role selection */}
                        <div>
                            <label className="block text-xs uppercase tracking-wider mb-3 text-muted">
                                I am a
                            </label>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    disabled={loading}
                                    className={`flex-1 py-3 border transition-all duration-300 ${role === 'candidate'
                                        ? 'border-foreground bg-foreground text-background'
                                        : 'border-border hover:border-foreground'
                                        }`}
                                    onClick={() => setRole('candidate')}
                                >
                                    Candidate
                                </button>
                                <button
                                    type="button"
                                    disabled={loading}
                                    className={`flex-1 py-3 border transition-all duration-300 ${role === 'recruiter'
                                        ? 'border-foreground bg-foreground text-background'
                                        : 'border-border hover:border-foreground'
                                        }`}
                                    onClick={() => setRole('recruiter')}
                                >
                                    Recruiter
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="fullName" className="block text-xs uppercase tracking-wider mb-3 text-muted">
                                Full name
                            </label>
                            <Input
                                id="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                disabled={loading}
                                placeholder="John Doe"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-xs uppercase tracking-wider mb-3 text-muted">
                                Email address
                            </label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs uppercase tracking-wider mb-3 text-muted">
                                Password <span className="text-xs normal-case text-muted/60">(min. 6 characters)</span>
                            </label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                disabled={loading}
                                placeholder="Create a strong password"
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin">⏳</span>
                                    Creating account...
                                </span>
                            ) : (
                                'Create account'
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
