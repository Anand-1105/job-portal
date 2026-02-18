import { useState, useEffect } from 'react'

export function useWebGLSupport() {
    const [isSupported, setIsSupported] = useState<boolean | null>(null)

    useEffect(() => {
        if (typeof window === 'undefined') {
            setIsSupported(null)
            return
        }

        try {
            const canvas = document.createElement('canvas')
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
            setIsSupported(!!gl)
        } catch (e) {
            setIsSupported(false)
        }
    }, [])

    return isSupported
}
