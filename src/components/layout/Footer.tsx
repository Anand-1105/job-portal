import { Link } from 'react-router-dom'

export function Footer() {
    return (
        <footer className="border-t border-border px-4 md:px-12 lg:px-24 py-12">
            <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row justify-between gap-8">
                <div className="flex flex-col">
                    <span className="font-serif text-xl font-bold tracking-tight text-white">
                        Chosen
                    </span>
                    <span className="text-[10px] text-muted font-medium tracking-widest uppercase opacity-70 mt-1">
                        Curated talent. Serious companies.
                    </span>
                </div>

                <div className="flex flex-col md:flex-row gap-8 md:gap-12 font-mono text-xs text-muted">
                    <div>© 2024 Chosen</div>
                    <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
                    <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                    <a href="mailto:contact@chosen.com" className="hover:text-white transition-colors">Contact</a>
                </div>
            </div>
        </footer>
    )
}
