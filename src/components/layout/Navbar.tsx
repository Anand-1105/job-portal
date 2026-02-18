import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { useState } from 'react'
import { Menu, X, User, LogOut, Sun, Moon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/ThemeContext'
import { RoleSwitcher } from '@/components/ui/RoleSwitcher'

export function Navbar() {
    const { user, profile } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        window.location.href = '/'
    }

    return (
        <nav className="border-b border-border px-4 md:px-12 lg:px-24 py-6">
            <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
                <Link to="/" className="flex flex-col">
                    <span className="font-serif text-2xl font-bold tracking-tight text-white leading-none">
                        Chosen
                    </span>
                    <span className="text-[10px] text-muted font-medium tracking-widest uppercase opacity-70">
                        Curated talent. Serious companies.
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8">
                    <Link
                        to="/jobs"
                        className="text-muted hover:text-foreground transition-colors"
                    >
                        Browse Jobs
                    </Link>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-muted hover:text-foreground transition-colors rounded-lg hover:bg-surface"
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    {/* Role Switcher */}
                    {user && <RoleSwitcher />}

                    {user ? (
                        <>
                            <Link
                                to="/dashboard"
                                className="text-muted hover:text-foreground transition-colors"
                            >
                                Dashboard
                            </Link>

                            {profile?.role === 'candidate' && (
                                <Link
                                    to="/ats-checker"
                                    className="text-muted hover:text-foreground transition-colors"
                                >
                                    ATS Checker
                                </Link>
                            )}

                            {profile?.role === 'recruiter' && (
                                <Link
                                    to="/recruiter/jobs/new"
                                    className="bg-foreground text-background px-6 py-2 hover:opacity-90 transition-opacity font-medium"
                                >
                                    Post a Job
                                </Link>
                            )}

                            {/* User Profile Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                                    className="flex items-center gap-2 text-muted hover:text-foreground transition-colors"
                                >
                                    <User className="w-4 h-4" />
                                    <span className="max-w-[150px] truncate">{profile?.full_name || user.email}</span>
                                </button>

                                {profileDropdownOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setProfileDropdownOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-48 bg-background border border-border shadow-lg z-20">
                                            <Link
                                                to="/profile"
                                                className="block px-4 py-3 text-sm hover:bg-slate-50 transition-colors"
                                                onClick={() => setProfileDropdownOpen(false)}
                                            >
                                                <div className="font-medium">{profile?.full_name}</div>
                                                <div className="text-xs text-muted truncate">{user.email}</div>
                                            </Link>
                                            <Link
                                                to="/dashboard"
                                                className="block px-4 py-3 text-sm hover:bg-slate-50 transition-colors border-t border-border"
                                                onClick={() => setProfileDropdownOpen(false)}
                                            >
                                                Dashboard
                                            </Link>
                                            <button
                                                onClick={handleSignOut}
                                                className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors border-t border-border flex items-center gap-2"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Sign out
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="text-muted hover:text-foreground transition-colors"
                            >
                                Sign in
                            </Link>
                            <Link
                                to="/signup"
                                className="border border-foreground px-6 py-2 hover:bg-foreground hover:text-background transition-all duration-300"
                            >
                                Sign up
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile menu button */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden text-foreground"
                    aria-label="Toggle menu"
                >
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
                <div className="md:hidden mt-6 pt-6 border-t border-border space-y-4">
                    <Link
                        to="/jobs"
                        className="block text-muted hover:text-foreground transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        Browse Jobs
                    </Link>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="flex items-center gap-2 text-muted hover:text-foreground transition-colors py-2"
                    >
                        {theme === 'dark' ? (
                            <>
                                <Sun className="w-5 h-5" />
                                <span>Light Mode</span>
                            </>
                        ) : (
                            <>
                                <Moon className="w-5 h-5" />
                                <span>Dark Mode</span>
                            </>
                        )}
                    </button>

                    {user ? (
                        <>
                            <Link
                                to="/dashboard"
                                className="block text-muted hover:text-foreground transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Dashboard
                            </Link>

                            {profile?.role === 'candidate' && (
                                <Link
                                    to="/ats-checker"
                                    className="block text-muted hover:text-foreground transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    ATS Checker
                                </Link>
                            )}

                            {profile?.role === 'recruiter' && (
                                <Link
                                    to="/recruiter/jobs/new"
                                    className="block bg-foreground text-background px-6 py-2 text-center hover:opacity-90 transition-opacity font-medium"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Post a Job
                                </Link>
                            )}

                            <Link
                                to="/profile"
                                className="block text-muted hover:text-foreground transition-colors pt-4 border-t border-border"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <div className="font-medium">{profile?.full_name}</div>
                                <div className="text-xs text-muted">{user.email}</div>
                            </Link>

                            <button
                                onClick={handleSignOut}
                                className="w-full text-left text-muted hover:text-foreground transition-colors flex items-center gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="block text-muted hover:text-foreground transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Sign in
                            </Link>
                            <Link
                                to="/signup"
                                className="block border border-foreground px-6 py-2 text-center hover:bg-foreground hover:text-background transition-all duration-300"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Sign up
                            </Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    )
}
