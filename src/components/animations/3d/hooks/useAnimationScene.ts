import { useState, useEffect, useCallback } from 'react'
import { SCENE_DURATIONS, VICTORY_DELAY } from '../utils/constants'

export function useAnimationScene() {
    const [scene, setScene] = useState(1)
    const [showNotification, setShowNotification] = useState(false)
    const [isVictory, setIsVictory] = useState(false)

    const advanceScene = useCallback(() => {
        setScene((current) => {
            const next = current >= 4 ? 1 : current + 1

            // Reset sub-states
            setIsVictory(false)

            // Trigger notification popup in scene 2 after a short delay
            if (next === 2) {
                setTimeout(() => setShowNotification(true), 600)
            } else {
                setShowNotification(false)
            }

            // Scene 4: switch to victory after VICTORY_DELAY
            if (next === 4) {
                setTimeout(() => setIsVictory(true), VICTORY_DELAY)
            }

            return next
        })
    }, [])

    useEffect(() => {
        const durations = Object.values(SCENE_DURATIONS)
        const duration = durations[scene - 1]
        const timer = setTimeout(advanceScene, duration)

        return () => clearTimeout(timer)
    }, [scene, advanceScene])

    return { scene, showNotification, isVictory }
}
