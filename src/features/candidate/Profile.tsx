import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { User, Sparkles } from 'lucide-react'

export function CandidateProfile() {
    const { user, profile } = useAuth()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        full_name: '',
        headline: '',
        resume_url: '',
        skills: ''
    })

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                headline: profile.headline || '',
                resume_url: '', // fetching from candidate_details would be next step
                skills: ''
            })
        }
    }, [profile])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    headline: formData.headline,
                })
                .eq('id', user.id)

            if (error) throw error
            alert('Profile updated!')
        } catch (error) {
            console.error('Error updating profile:', error)
            alert('Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="mb-8 relative">
                {/* Background gradient */}
                <div className="absolute -top-10 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/10 via-transparent to-transparent blur-3xl pointer-events-none" />

                <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <span className="text-sm uppercase tracking-widest text-purple-400 font-medium">Profile</span>
                    </div>
                    <h1 className="text-3xl font-serif bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-2">
                        Your Profile
                    </h1>
                    <p className="text-muted">Manage your personal information</p>
                </div>
            </div>

            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-50 blur-3xl" />

                <form onSubmit={handleSubmit} className="relative space-y-6 bg-surface p-8 rounded-xl border border-border shadow-xl">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <User className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">{formData.full_name || 'Your Name'}</h2>
                            <p className="text-sm text-muted">{formData.headline || 'Add a headline'}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                            id="fullName"
                            value={formData.full_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                            className="bg-background border-border focus:border-purple-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="headline">Headline</Label>
                        <Input
                            id="headline"
                            placeholder="e.g. Senior React Developer"
                            value={formData.headline}
                            onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
                            className="bg-background border-border focus:border-purple-500"
                        />
                    </div>

                    {/* For MVP, we're just updating basic profile info. 
            Resume upload would go to storage here. */}

                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0 shadow-lg shadow-purple-500/20"
                        >
                            {loading ? 'Saving...' : 'Save Profile'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
