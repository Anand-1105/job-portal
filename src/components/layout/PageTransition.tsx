import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function PageTransition({ children }: { children: React.ReactNode }) {
    const location = useLocation()

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [location])

    return (
        <div
            key={location.pathname}
            className="animate-fade-in"
        >
            {children}
        </div>
    )
}
