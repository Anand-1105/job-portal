import { Card } from '@/components/ui/Card'

const features = [
    {
        number: '01',
        title: 'Curated opportunities',
        description: 'Every role is vetted. No spam, no irrelevant listings—just positions worth applying to.',
    },
    {
        number: '02',
        title: 'Direct connections',
        description: 'Skip the black hole. Your application goes straight to hiring managers.',
    },
    {
        number: '03',
        title: 'Transparent process',
        description: 'Know where you stand. Real-time updates on your application status.',
    },
]

export function FeaturesSection() {
    return (
        <section className="px-4 md:px-12 lg:px-24 py-24">
            <div className="max-w-7xl w-full mx-auto">
                <h2 className="font-serif text-h1 mb-20">
                    How we're different
                </h2>

                <div className="space-y-16">
                    {features.map((feature) => (
                        <Card key={feature.number} className="flex flex-col md:flex-row gap-8 items-start opacity-0 revealing-image">
                            <div className="font-mono text-6xl text-muted opacity-30 md:w-32 flex-shrink-0">
                                {feature.number}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-h3 mb-4">{feature.title}</h3>
                                <p className="text-lg text-muted leading-relaxed max-w-2xl">
                                    {feature.description}
                                </p>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}
