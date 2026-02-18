import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth'
import { User, Briefcase, Shield, ChevronDown } from 'lucide-react'

export function RoleSwitcher() {
    const { profile } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [switching, setSwitching] = useState(false)

    // Debug: log profile to see what we have
    console.log('RoleSwitcher - profile:', profile)

    if (!profile) {
        console.log('RoleSwitcher - No profile, returning null')
        return null
    }

    const roles = [
        { value: 'candidate', label: 'Candidate', icon: User, color: 'blue' },
        { value: 'recruiter', label: 'Recruiter', icon: Briefcase, color: 'purple' },
        { value: 'admin', label: 'Admin', icon: Shield, color: 'red' },
    ] as const

    const currentRole = roles.find(r => r.value === profile.role)
    const CurrentIcon = currentRole?.icon || User

    async function switchRole(newRole: 'candidate' | 'recruiter' | 'admin') {
        if (!profile || newRole === profile.role) {
            setIsOpen(false)
            return
        }

        setSwitching(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole } as any)
                .eq('id', profile.id)

            if (error) throw error

            // Refresh the page to update the UI
            window.location.href = '/dashboard'
        } catch (error) {
            console.error('Error switching role:', error)
            alert('Failed to switch role. Please try again.')
            setSwitching(false)
        }
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg hover:bg-background transition-colors"
                disabled={switching}
            >
                <CurrentIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{currentRole?.label || profile.role}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                        <div className="p-2">
                            <p className="text-xs text-muted px-3 py-2">Switch Portal</p>
                            {roles.map((role) => {
                                const Icon = role.icon
                                const isActive = role.value === profile.role

                                return (
                                    <button
                                        key={role.value}
                                        onClick={() => switchRole(role.value)}
                                        disabled={isActive || switching}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                                                ? 'bg-background cursor-default'
                                                : 'hover:bg-background cursor-pointer'
                                            } ${switching ? 'opacity-50' : ''}`}
                                    >
                                        <div className={`p-2 rounded-lg ${role.color === 'blue' ? 'bg-blue-500/20' :
                                                role.color === 'purple' ? 'bg-purple-500/20' :
                                                    'bg-red-500/20'
                                            }`}>
                                            <Icon className={`w-4 h-4 ${role.color === 'blue' ? 'text-blue-400' :
                                                    role.color === 'purple' ? 'text-purple-400' :
                                                        'text-red-400'
                                                }`} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="text-sm font-medium">{role.label}</div>
                                            <div className="text-xs text-muted">
                                                {role.value === 'candidate' && 'Find and apply to jobs'}
                                                {role.value === 'recruiter' && 'Post jobs and hire'}
                                                {role.value === 'admin' && 'Platform management'}
                                            </div>
                                        </div>
                                        {isActive && (
                                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
