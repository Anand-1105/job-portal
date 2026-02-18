import { useEffect, useRef } from 'react'
import { Howl } from 'howler'

interface UseSoundOptions {
    volume?: number
    enabled?: boolean
}

export function useSound(src: string, options: UseSoundOptions = {}) {
    const { volume = 0.5, enabled = true } = options
    const soundRef = useRef<Howl>()

    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return

        soundRef.current = new Howl({
            src: [src],
            volume,
            html5: true, // Stream for mobile
            preload: true,
        })

        return () => {
            soundRef.current?.unload()
        }
    }, [src, volume, enabled])

    const play = () => {
        if (enabled && soundRef.current) {
            soundRef.current.play()
        }
    }

    return { play }
}
