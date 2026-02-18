import { HeroSection } from './HeroSection'
import { RecruiterMarquee } from './RecruiterMarquee'
import { FeaturesSection } from './FeaturesSection'
import { JobsPreview } from './JobsPreview'

export function LandingPage() {
    return (
        <div className="min-h-screen">
            <HeroSection />
            <RecruiterMarquee />
            <FeaturesSection />
            <JobsPreview />
        </div>
    )
}
