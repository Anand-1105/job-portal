import { useState } from 'react'
import { useAuth } from './AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function Login() {
    const { signIn } = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const { error } = await signIn(email, password)
        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            navigate('/dashboard')
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Left sidebar - branding */}
            <div className="hidden md:flex md:w-2/5 bg-surface flex-col justify-between p-12">
                <div>
                    <h2 className="font-serif text-h2 mb-4">Welcome back</h2>
                    <p className="text-muted leading-relaxed">
                        Sign in to continue finding opportunities that matter.
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
                        <h1 className="text-h3 mb-2">Sign in</h1>
                        <p className="text-muted">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-foreground hover:opacity-70 transition-opacity">
                                Sign up
                            </Link>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {error && (
                            <div className="border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-400">
                                {error}
                            </div>
                        )}

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
                                autoFocus
                                disabled={loading}
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs uppercase tracking-wider mb-3 text-muted">
                                Password
                            </label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                placeholder="Enter your password"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin">⏳</span>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign in'
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
