import { useEffect, useState } from 'react'
import { getAllUsers, updateUserRole } from '@/lib/adminService'
import { Database } from '@/types/database.types'
import { Search, Shield, User, X } from 'lucide-react'

type Profile = Database['public']['Tables']['profiles']['Row']

export function UserManagement() {
    const [users, setUsers] = useState<Profile[]>([])
    const [filteredUsers, setFilteredUsers] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('all')
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null)

    useEffect(() => {
        fetchUsers()
    }, [])

    useEffect(() => {
        let filtered = users

        if (searchTerm) {
            filtered = filtered.filter(u =>
                u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        if (roleFilter !== 'all') {
            filtered = filtered.filter(u => u.role === roleFilter)
        }

        setFilteredUsers(filtered)
    }, [users, searchTerm, roleFilter])

    async function fetchUsers() {
        try {
            const data = await getAllUsers()
            setUsers(data || [])
            setFilteredUsers(data || [])
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleRoleChange(userId: string, newRole: 'candidate' | 'recruiter' | 'admin') {
        try {
            await updateUserRole(userId, newRole)
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
            setSelectedUser(null)
            alert('User role updated successfully')
        } catch (error) {
            console.error('Error updating role:', error)
            alert('Failed to update role')
        }
    }

    const roleCounts = {
        all: users.length,
        candidate: users.filter(u => u.role === 'candidate').length,
        recruiter: users.filter(u => u.role === 'recruiter').length,
        admin: users.filter(u => u.role === 'admin').length,
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 md:px-12 lg:px-24 py-12">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-serif mb-2">User Management</h1>
                    <p className="text-muted">Manage user accounts and permissions</p>
                </div>

                {/* Filters */}
                <div className="bg-surface border border-border rounded-lg p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Search */}
                        <div>
                            <label className="text-sm text-muted mb-2 block">Search Users</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by name or email..."
                                    className="w-full bg-background border border-border pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Role Filter */}
                        <div>
                            <label className="text-sm text-muted mb-2 block">Filter by Role</label>
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="w-full bg-background border border-border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Users ({roleCounts.all})</option>
                                <option value="candidate">Candidates ({roleCounts.candidate})</option>
                                <option value="recruiter">Recruiters ({roleCounts.recruiter})</option>
                                <option value="admin">Admins ({roleCounts.admin})</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Users List */}
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-muted">Loading users...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="bg-surface border border-border rounded-lg p-12 text-center">
                        <User className="w-16 h-16 mx-auto mb-4 text-muted/30" />
                        <h3 className="text-xl font-medium mb-2">No users found</h3>
                        <p className="text-muted">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredUsers.map((user) => (
                            <div
                                key={user.id}
                                className="bg-surface border border-border rounded-lg p-6 hover:border-blue-500/50 transition-all duration-300"
                            >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-semibold">{user.full_name || 'Unnamed User'}</h3>
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${user.role === 'admin'
                                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                    : user.role === 'recruiter'
                                                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted mb-2">{user.email}</p>
                                        {user.headline && <p className="text-sm text-muted/70">{user.headline}</p>}
                                        <p className="text-xs text-muted/50 mt-2">
                                            Joined {new Date(user.created_at).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => setSelectedUser(user)}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 transition-colors text-sm font-medium"
                                    >
                                        <Shield className="w-4 h-4" />
                                        <span>Change Role</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Role Change Modal */}
                {selectedUser && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setSelectedUser(null)}>
                        <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-semibold">Change User Role</h2>
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="p-2 hover:bg-background rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mb-6">
                                <p className="text-sm text-muted mb-1">User: <span className="text-foreground font-medium">{selectedUser.full_name}</span></p>
                                <p className="text-sm text-muted">Current Role: <span className="text-foreground font-medium capitalize">{selectedUser.role}</span></p>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => handleRoleChange(selectedUser.id, 'candidate')}
                                    disabled={selectedUser.role === 'candidate'}
                                    className="w-full px-4 py-3 border border-border hover:bg-background transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                                >
                                    <div className="font-medium">Candidate</div>
                                    <div className="text-xs text-muted">Can apply to jobs and manage applications</div>
                                </button>

                                <button
                                    onClick={() => handleRoleChange(selectedUser.id, 'recruiter')}
                                    disabled={selectedUser.role === 'recruiter'}
                                    className="w-full px-4 py-3 border border-border hover:bg-background transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                                >
                                    <div className="font-medium">Recruiter</div>
                                    <div className="text-xs text-muted">Can post jobs and review applications</div>
                                </button>

                                <button
                                    onClick={() => handleRoleChange(selectedUser.id, 'admin')}
                                    disabled={selectedUser.role === 'admin'}
                                    className="w-full px-4 py-3 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                                >
                                    <div className="font-medium text-red-400">Admin</div>
                                    <div className="text-xs text-muted">Full platform access and management</div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
