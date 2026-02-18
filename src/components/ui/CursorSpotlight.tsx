import { useState, useEffect } from 'react'

export function CursorSpotlight() {
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [opacity, setOpacity] = useState(0)

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY })
            setOpacity(1)
        }

        const handleMouseLeave = () => {
            setOpacity(0)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseleave', handleMouseLeave)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseleave', handleMouseLeave)
        }
    }, [])

    return (
        <div
            className="pointer-events-none fixed inset-0 z-50 transition-opacity duration-300"
            style={{ opacity }}
        >
            <div
                className="absolute h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/5 blur-3xl"
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                }}
            />
        </div>
    )
}
