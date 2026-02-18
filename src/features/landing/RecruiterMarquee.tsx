export function RecruiterMarquee() {
    const companies = [
        'Vercel', 'Linear', 'Stripe', 'GitHub', 'Notion',
        'Figma', 'Shopify', 'Discord', 'OpenAI', 'Anthropic'
    ]

    return (
        <section className="py-12 border-y border-border overflow-hidden">
            <div className="text-center mb-8">
                <p className="text-sm md:text-base tracking-[0.2em] uppercase font-light text-muted">
                    Top brands trust us, so can you
                </p>
            </div>
            <div className="flex animate-marquee whitespace-nowrap">
                {[...companies, ...companies].map((company, i) => (
                    <span
                        key={i}
                        className="mx-8 text-muted font-mono text-sm uppercase tracking-wider"
                    >
                        {company}
                    </span>
                ))}
            </div>
        </section>
    )
}
