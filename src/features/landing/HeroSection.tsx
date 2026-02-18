import { Link } from 'react-router-dom'


export function HeroSection() {
    return (
        <section className="min-h-screen flex items-center px-4 md:px-12 lg:px-24 py-24">
            <div className="max-w-7xl w-full">
                {/* Two-column layout: Text left, Animation right */}
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left Column - Text Content */}
                    <div className="space-y-8">
                        <h1 className="font-serif text-display leading-none text-balance opacity-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                            Find work that matters
                        </h1>

                        <p className="text-xl md:text-2xl text-muted max-w-2xl leading-relaxed opacity-0 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                            Join a platform where talent meets opportunity. No algorithms, no noise—just meaningful connections.
                        </p>

                        {/* Search Bar Removed */}

                        <div className="flex flex-col sm:flex-row gap-4 opacity-0 animate-slide-up" style={{ animationDelay: '0.7s' }}>
                            <a
                                href="/signup"
                                className="inline-flex items-center justify-center text-lg px-8 py-3 border border-foreground hover:bg-foreground hover:text-background transition-all duration-300"
                            >
                                Get started
                                <span className="ml-2">→</span>
                            </a>

                            <Link
                                to="/how-it-works"
                                className="inline-flex items-center justify-center text-lg px-8 py-3 text-muted hover:text-foreground transition-all duration-300"
                            >
                                How it works
                            </Link>
                        </div>
                    </div>

                    {/* Right Column - Premium Animation */}
                    <div className="opacity-0 animate-slide-up" style={{ animationDelay: '0.9s' }}>
                        <div className="relative w-full max-w-[800px] mx-auto">
                            <video
                                src="/watermark_removed_2ad848b2-3302-4ad1-8fff-69099f7f1874.mp4"
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-auto object-contain"
                            />
                        </div>
                    </div>
                </div>

                {/* Metadata strip */}
                <div className="mt-24 pt-12 border-t border-border flex flex-wrap gap-12 font-mono text-sm text-muted opacity-0 animate-fade-in" style={{ animationDelay: '1s' }}>
                    <div>
                        <div className="text-xs uppercase tracking-wider mb-1">Active roles</div>
                        <div className="text-2xl font-semibold text-foreground">1,247</div>
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-wider mb-1">Companies</div>
                        <div className="text-2xl font-semibold text-foreground">89</div>
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-wider mb-1">Placements</div>
                        <div className="text-2xl font-semibold text-foreground">3,456</div>
                    </div>
                </div>
            </div>
        </section>
    )
}
