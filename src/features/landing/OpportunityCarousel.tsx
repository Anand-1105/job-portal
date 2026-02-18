import { useRef } from 'react'
import { ArrowRight, MapPin, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const opportunities = [
    {
        id: 1,
        role: "Senior Frontend Engineer",
        company: "Vercel",
        location: "Remote",
        salary: "$140k - $180k",
        type: "Full-time",
        color: "from-black to-slate-900",
        logo: "▲"
    },
    {
        id: 2,
        role: "Product Designer",
        company: "Linear",
        location: "San Francisco",
        salary: "$130k - $160k",
        type: "Full-time",
        color: "from-indigo-500 to-purple-600",
        logo: "L"
    },
    {
        id: 3,
        role: "AI Research Scientist",
        company: "OpenAI",
        location: "San Francisco",
        salary: "$200k - $300k",
        type: "Full-time",
        color: "from-emerald-500 to-teal-600",
        logo: "O"
    },
    {
        id: 4,
        role: "Growth Marketing Manager",
        company: "Airbnb",
        location: "New York",
        salary: "$120k - $150k",
        type: "Full-time",
        color: "from-rose-500 to-orange-500",
        logo: "A"
    },
]

const CarouselCard = ({ item }: { item: any }) => {
    return (
        <div className="relative group shrink-0 w-[350px] h-[450px] rounded-3xl overflow-hidden shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl">
            <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-90 transition-opacity`} />

            <div className="relative z-10 p-8 h-full flex flex-col text-white">
                <div className="flex justify-between items-start mb-8">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold">
                        {item.logo}
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-medium backdrop-blur">
                        {item.type}
                    </span>
                </div>

                <div className="mt-auto">
                    <h3 className="text-2xl font-bold mb-2">{item.role}</h3>
                    <p className="text-white/80 font-medium mb-6">{item.company}</p>

                    <div className="space-y-3 mb-8">
                        <div className="flex items-center gap-2 text-sm text-white/70">
                            <MapPin className="w-4 h-4" /> {item.location}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-white/70">
                            <DollarSign className="w-4 h-4" /> {item.salary}
                        </div>
                    </div>

                    <Button variant="secondary" className="w-full rounded-xl bg-white text-slate-900 hover:bg-slate-100">
                        Apply Now
                    </Button>
                </div>
            </div>
        </div>
    )
}

export function OpportunityCarousel() {
    const containerRef = useRef<HTMLDivElement>(null)

    return (
        <section ref={containerRef} className="py-24 bg-slate-50 overflow-hidden">
            <div className="container mx-auto px-4 mb-16 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl lg:text-4xl font-bold mb-4">Featured Opportunities</h2>
                    <p className="text-slate-500 max-w-lg">Hand-picked roles from the world's most innovative teams.</p>
                </div>
                <Button variant="outline" className="hidden md:flex rounded-full">
                    View All Jobs <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
            </div>

            {/* Horizontal Scroll Area */}
            {/* Note: In a real complex implementation we'd use useScroll with a horizontal container or sticky scroll.
                For MVP, we'll use a simple overflow-x-auto with snap classes for mobile friendliness.
                Adding 'motion' here for entrance animation.
            */}
            <div className="container mx-auto px-4">
                <div className="flex gap-8 overflow-x-auto pb-12 snap-x snap-mandatory scrollbar-hide">
                    {opportunities.map((item) => (
                        <CarouselCard key={item.id} item={item} />
                    ))}
                    {/* CTA Card */}
                    <div className="shrink-0 w-[350px] h-[450px] rounded-3xl bg-white border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-8 text-slate-400 hover:border-primary hover:text-primary transition-colors cursor-pointer group">
                        <div className="w-16 h-16 rounded-full bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center mb-4 transition-colors">
                            <ArrowRight className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-slate-900">See 500+ More</h3>
                        <p>Explore all open positions</p>
                    </div>
                </div>
            </div>
        </section>
    )
}
