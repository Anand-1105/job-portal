import { X } from 'lucide-react'

export interface FilterState {
    jobTypes: string[]
    locations: string[]
    salaryRange: [number, number]
}

interface JobFiltersProps {
    filters: FilterState
    onFilterChange: (filters: FilterState) => void
    onClearFilters: () => void
}

const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship']
const LOCATION_TYPES = ['Remote', 'Hybrid', 'On-site']

export function JobFilters({ filters, onFilterChange, onClearFilters }: JobFiltersProps) {
    const handleJobTypeToggle = (type: string) => {
        const newTypes = filters.jobTypes.includes(type)
            ? filters.jobTypes.filter(t => t !== type)
            : [...filters.jobTypes, type]
        onFilterChange({ ...filters, jobTypes: newTypes })
    }

    const handleLocationToggle = (location: string) => {
        const newLocations = filters.locations.includes(location)
            ? filters.locations.filter(l => l !== location)
            : [...filters.locations, location]
        onFilterChange({ ...filters, locations: newLocations })
    }

    const hasActiveFilters = filters.jobTypes.length > 0 || filters.locations.length > 0

    return (
        <div className="bg-surface border border-border p-6 rounded-lg space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl">Filters</h3>
                {hasActiveFilters && (
                    <button
                        onClick={onClearFilters}
                        className="text-sm text-muted hover:text-purple-400 transition-colors flex items-center gap-1"
                    >
                        <X className="w-4 h-4" />
                        Clear all
                    </button>
                )}
            </div>

            {/* Job Type Filter */}
            <div className="space-y-3">
                <h4 className="font-medium text-sm uppercase tracking-wider text-purple-400">Job Type</h4>
                <div className="space-y-2">
                    {JOB_TYPES.map(type => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={filters.jobTypes.includes(type)}
                                onChange={() => handleJobTypeToggle(type)}
                                className="w-4 h-4 border-border rounded cursor-pointer accent-purple-600"
                            />
                            <span className="text-sm group-hover:text-purple-400 transition-colors capitalize">{type}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Location Filter */}
            <div className="space-y-3 border-t border-border pt-6">
                <h4 className="font-medium text-sm uppercase tracking-wider text-purple-400">Work Mode</h4>
                <div className="space-y-2">
                    {LOCATION_TYPES.map(location => (
                        <label key={location} className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={filters.locations.includes(location)}
                                onChange={() => handleLocationToggle(location)}
                                className="w-4 h-4 border-border rounded cursor-pointer accent-purple-600"
                            />
                            <span className="text-sm group-hover:text-purple-400 transition-colors">{location}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="border-t border-border pt-6 space-y-2">
                    <h4 className="font-medium text-sm uppercase tracking-wider text-purple-400">Active Filters</h4>
                    <div className="flex flex-wrap gap-2">
                        {filters.jobTypes.map(type => (
                            <span
                                key={type}
                                className="inline-flex items-center gap-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 px-3 py-1 rounded-full text-xs"
                            >
                                {type}
                                <button
                                    onClick={() => handleJobTypeToggle(type)}
                                    className="hover:text-purple-100"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                        {filters.locations.map(location => (
                            <span
                                key={location}
                                className="inline-flex items-center gap-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 px-3 py-1 rounded-full text-xs"
                            >
                                {location}
                                <button
                                    onClick={() => handleLocationToggle(location)}
                                    className="hover:text-purple-100"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
