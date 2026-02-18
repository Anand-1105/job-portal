import { Suspense, useState, useEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { Character } from './Character'
import { CameraRig } from './CameraRig'
import { Lighting } from './Lighting'
import { NotificationCard } from './NotificationCard'
import { Confetti } from './Confetti'
import { useAnimationScene } from './hooks/useAnimationScene'
import { ANIMATIONS, SCENE_TO_ANIMATION, QUALITY_LEVELS, PERFORMANCE_THRESHOLDS } from './utils/constants'

interface Hero3DPlacementAnimationProps {
    candidateName?: string
    companyName?: string
    hideOnMobile?: boolean
}

type QualityLevel = keyof typeof QUALITY_LEVELS

export function Hero3DPlacementAnimation({
    candidateName = 'Anand',
    companyName = 'TCS',
    hideOnMobile = true,
}: Hero3DPlacementAnimationProps) {
    const { scene, showNotification, isVictory } = useAnimationScene()
    const [quality, setQuality] = useState<QualityLevel>('HIGH')
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)

    // Mobile detection (SSR safe)
    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const checkMobile = () => setIsMobile(window.innerWidth < 1024)
            checkMobile()
            window.addEventListener('resize', checkMobile)
            return () => window.removeEventListener('resize', checkMobile)
        }
    }, [])

    // WebGL support check
    const [webglSupported, setWebglSupported] = useState<boolean | null>(null)
    useEffect(() => {
        try {
            const canvas = document.createElement('canvas')
            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
            setWebglSupported(!!gl)
        } catch {
            setWebglSupported(false)
        }
    }, [])

    // Determine current animation name
    // In scene 4: starts with walking, switches to victory after 3s
    const currentAnimation = useMemo(() => {
        if (scene === 4 && isVictory) {
            return ANIMATIONS.VICTORY
        }
        return SCENE_TO_ANIMATION[scene] || ANIMATIONS.SITTING
    }, [scene, isVictory])

    // Show confetti during notification (scene 2) and victory
    const showConfetti = (scene === 2 && showNotification) || (scene === 4 && isVictory)

    // Particle count based on quality (0 = disabled)
    const particleCount = QUALITY_LEVELS[quality].particleCount

    // Fallback: WebGL not supported
    if (webglSupported === false) {
        return (
            <div className="w-full h-[500px] flex items-center justify-center bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-2xl border border-slate-700/50">
                <div className="text-center px-6">
                    <p className="text-slate-400 text-sm">3D animation not supported on this device</p>
                    <p className="text-slate-500 text-xs mt-2">WebGL is required for 3D graphics</p>
                </div>
            </div>
        )
    }

    // Fallback: Mobile
    if (hideOnMobile && isMobile) {
        return (
            <div className="w-full h-[400px] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900/50 to-purple-900/30 flex items-center justify-center border border-slate-700/50">
                <div className="text-center px-8">
                    <div className="text-5xl mb-4">🎯</div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                        500+ Students Placed
                    </h3>
                    <p className="text-slate-400 text-sm">
                        Open on desktop to see our 3D placement story
                    </p>
                </div>
            </div>
        )
    }

    // Error state
    if (hasError) {
        return (
            <div className="w-full h-[500px] flex items-center justify-center bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-2xl border border-slate-700/50">
                <div className="text-center px-6">
                    <div className="text-4xl mb-4">⚠️</div>
                    <p className="text-slate-400 text-sm">Failed to load 3D animation</p>
                    <p className="text-slate-500 text-xs mt-2">Please refresh the page</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`relative w-full h-[500px] ${hideOnMobile ? 'hidden lg:block' : ''}`}>
            {/* Loading skeleton */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-2xl border border-slate-700/50 z-10">
                    <div className="text-center">
                        <div className="w-14 h-14 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-slate-400 text-sm">Loading 3D experience...</p>
                    </div>
                </div>
            )}

            <Canvas
                shadows={quality !== 'LOW'}
                className="rounded-2xl"
                gl={{
                    antialias: quality === 'HIGH',
                    alpha: true,
                    powerPreference: 'high-performance',
                    failIfMajorPerformanceCaveat: false,
                }}
                onCreated={() => setIsLoading(false)}
                onError={() => setHasError(true)}
            >
                {/* Auto-adjust quality based on FPS */}
                <PerformanceMonitor
                    onIncline={() => {
                        if (quality === 'MEDIUM') setQuality('HIGH')
                        if (quality === 'LOW') setQuality('MEDIUM')
                    }}
                    onDecline={() => {
                        if (quality === 'HIGH') setQuality('MEDIUM')
                        if (quality === 'MEDIUM') setQuality('LOW')
                    }}
                    flipflops={2}
                    onChange={({ factor }) => {
                        const fps = factor * 60
                        if (fps < PERFORMANCE_THRESHOLDS.CRITICAL_FPS && quality !== 'LOW') {
                            setQuality('LOW')
                        } else if (fps < PERFORMANCE_THRESHOLDS.LOW_FPS && quality === 'HIGH') {
                            setQuality('MEDIUM')
                        }
                    }}
                >
                    <Suspense fallback={null}>
                        {/* Cinematic camera rig */}
                        <CameraRig scene={scene} />

                        {/* Lighting system with HDRI */}
                        <Lighting scene={scene} quality={quality} />

                        {/* Main Mixamo character with animation controller */}
                        <Character
                            scene={scene}
                            currentAnimation={currentAnimation}
                        />

                        {/* Notification popup in scene 2 */}
                        {showNotification && (
                            <NotificationCard name={candidateName} company={companyName} />
                        )}

                        {/* Confetti particles (auto-disabled on LOW quality) */}
                        {showConfetti && particleCount > 0 && (
                            <Confetti count={particleCount} />
                        )}
                    </Suspense>
                </PerformanceMonitor>
            </Canvas>

            {/* Bottom badge overlay */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20">
                <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700/80 px-5 py-2.5 rounded-full shadow-lg">
                    <p className="text-sm whitespace-nowrap">
                        <span className="font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent text-lg">
                            500+
                        </span>
                        <span className="text-slate-300 ml-2">students placed this month</span>
                    </p>
                </div>
            </div>
        </div>
    )
}
