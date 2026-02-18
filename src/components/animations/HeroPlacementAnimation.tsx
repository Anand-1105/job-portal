import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Sparkles, Building2 } from 'lucide-react'

interface HeroPlacementAnimationProps {
    candidateName?: string
    companyName?: string
    hideOnMobile?: boolean
    // Custom image URLs (optional - will use defaults from unDraw/Storyset)
    waitingImage?: string
    celebrationImage?: string
    confidenceImage?: string
    crowdImage?: string
}

export function HeroPlacementAnimation({
    candidateName = 'Anand',
    companyName = 'TCS',
    hideOnMobile = true,
    // Default to free illustration URLs from unDraw/Storyset
    waitingImage = 'https://illustrations.popsy.co/amber/man-sitting-and-using-smartphone.svg',
    celebrationImage = 'https://illustrations.popsy.co/amber/success.svg',
    confidenceImage = 'https://illustrations.popsy.co/amber/man-riding-a-rocket.svg',
    crowdImage = 'https://illustrations.popsy.co/amber/teamwork.svg'
}: HeroPlacementAnimationProps) {
    const [scene, setScene] = useState(1)
    const [showNotification, setShowNotification] = useState(false)
    const [confettiParticles, setConfettiParticles] = useState<Array<{ id: number; x: number; delay: number }>>([])

    // Scene timing orchestration
    useEffect(() => {
        const timeline = [
            { scene: 1, duration: 3000 }, // Waiting - 3s
            { scene: 2, duration: 3500 }, // Notification - 3.5s
            { scene: 3, duration: 2500 }, // Transformation - 2.5s
            { scene: 4, duration: 4000 }, // Placement Crowd - 4s
        ]

        let currentIndex = 0

        const advanceScene = () => {
            currentIndex = (currentIndex + 1) % timeline.length
            setScene(timeline[currentIndex].scene)

            // Trigger notification popup in scene 2
            if (timeline[currentIndex].scene === 2) {
                setTimeout(() => setShowNotification(true), 500)
                // Generate confetti particles
                const particles = Array.from({ length: 30 }, (_, i) => ({
                    id: i,
                    x: Math.random() * 100,
                    delay: Math.random() * 0.5
                }))
                setConfettiParticles(particles)
            } else {
                setShowNotification(false)
                setConfettiParticles([])
            }

            setTimeout(advanceScene, timeline[currentIndex].duration)
        }

        const timer = setTimeout(advanceScene, timeline[currentIndex].duration)
        return () => clearTimeout(timer)
    }, [scene])

    // Company logos for scene 4
    const companies = [
        { name: 'TCS', color: 'from-blue-500 to-cyan-500' },
        { name: 'Infosys', color: 'from-blue-600 to-indigo-600' },
        { name: 'Google', color: 'from-red-500 to-yellow-500' },
        { name: 'Microsoft', color: 'from-blue-400 to-cyan-400' },
        { name: 'Amazon', color: 'from-orange-500 to-yellow-600' },
    ]

    return (
        <div className={`relative w-full h-[500px] ${hideOnMobile ? 'hidden lg:block' : ''}`}>
            {/* Main Animation Container */}
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-slate-700/50">

                {/* Background ambient light - changes with scenes */}
                <motion.div
                    className="absolute inset-0 opacity-30"
                    animate={{
                        background: scene === 1
                            ? 'radial-gradient(circle at 30% 50%, rgba(100, 100, 150, 0.15), transparent 70%)'
                            : scene === 2
                                ? 'radial-gradient(circle at 50% 40%, rgba(139, 92, 246, 0.3), transparent 70%)'
                                : scene === 3
                                    ? 'radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.25), transparent 70%)'
                                    : 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.2), transparent 80%)'
                    }}
                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                />

                {/* Scene 1: Waiting - Person checking phone anxiously */}
                <AnimatePresence mode="wait">
                    {scene === 1 && (
                        <motion.div
                            key="scene1"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.8 }}
                            className="relative flex items-center justify-center"
                        >
                            {/* Illustration */}
                            <motion.div
                                className="relative w-80 h-80"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <img
                                    src={waitingImage}
                                    alt="Person waiting anxiously"
                                    className="w-full h-full object-contain opacity-80"
                                />

                                {/* Subtle dim overlay for anxious mood */}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent rounded-2xl" />
                            </motion.div>

                            {/* Thought bubble - anxiety */}
                            <motion.div
                                className="absolute -top-8 right-12 text-sm text-slate-400"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: [0.5, 0.8, 0.5], scale: 1 }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <div className="bg-slate-800/90 px-4 py-2 rounded-lg border border-slate-700 backdrop-blur-sm">
                                    Any results...? 🤔
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Scene 2: Celebration - SUCCESS! */}
                    {scene === 2 && (
                        <motion.div
                            key="scene2"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.8 }}
                            className="relative flex items-center justify-center"
                        >
                            {/* Illustration with glow effect */}
                            <motion.div
                                className="relative w-80 h-80"
                                animate={{
                                    scale: [1, 1.05, 1],
                                    rotate: [0, -2, 2, 0]
                                }}
                                transition={{ duration: 0.8, repeat: 2 }}
                            >
                                <img
                                    src={celebrationImage}
                                    alt="Person celebrating success"
                                    className="w-full h-full object-contain"
                                />

                                {/* Success glow */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-t from-purple-500/20 via-pink-500/10 to-transparent rounded-2xl blur-xl"
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                            </motion.div>

                            {/* Premium Notification Card */}
                            <AnimatePresence>
                                {showNotification && (
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0, y: 20 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                                        className="absolute top-8 left-1/2 -translate-x-1/2 z-10"
                                    >
                                        <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 p-[2px] rounded-2xl shadow-2xl shadow-purple-500/50">
                                            <div className="bg-slate-900 rounded-2xl p-6 min-w-[280px]">
                                                <div className="flex items-start gap-3">
                                                    <motion.div
                                                        animate={{ rotate: [0, 10, -10, 0] }}
                                                        transition={{ duration: 0.5, repeat: 3 }}
                                                    >
                                                        <Sparkles className="w-6 h-6 text-yellow-400" />
                                                    </motion.div>
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-1">
                                                            Congratulations {candidateName}!
                                                        </h3>
                                                        <p className="text-sm text-slate-300">
                                                            Selected at <span className="font-bold text-white">{companyName}</span>
                                                        </p>
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            Offer Letter Sent 📧
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Confetti Particles */}
                            {confettiParticles.map((particle) => (
                                <motion.div
                                    key={particle.id}
                                    className="absolute top-10 w-2 h-2 rounded-full"
                                    style={{
                                        left: `${particle.x}%`,
                                        background: ['#a855f7', '#ec4899', '#f59e0b', '#10b981'][particle.id % 4]
                                    }}
                                    initial={{ y: 0, opacity: 1, scale: 0 }}
                                    animate={{
                                        y: 200,
                                        opacity: 0,
                                        scale: [0, 1, 0.5],
                                        rotate: Math.random() * 360
                                    }}
                                    transition={{
                                        duration: 2.5,
                                        delay: particle.delay,
                                        ease: 'easeOut'
                                    }}
                                />
                            ))}
                        </motion.div>
                    )}

                    {/* Scene 3: Confidence - Standing proud */}
                    {scene === 3 && (
                        <motion.div
                            key="scene3"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1.05, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.8, type: 'spring', damping: 12 }}
                            className="relative flex items-center justify-center"
                        >
                            {/* Illustration with empowerment glow */}
                            <motion.div
                                className="relative w-80 h-80"
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <img
                                    src={confidenceImage}
                                    alt="Professional standing confidently"
                                    className="w-full h-full object-contain"
                                />

                                {/* Empowerment glow effect */}
                                <motion.div
                                    className="absolute inset-0 blur-3xl -z-10"
                                    animate={{
                                        background: [
                                            'radial-gradient(circle, rgba(139, 92, 246, 0.4), transparent 70%)',
                                            'radial-gradient(circle, rgba(236, 72, 153, 0.4), transparent 70%)',
                                            'radial-gradient(circle, rgba(139, 92, 246, 0.4), transparent 70%)',
                                        ]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            </motion.div>

                            {/* Sparkle effects around */}
                            {[...Array(8)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute"
                                    style={{
                                        top: `${20 + Math.random() * 60}%`,
                                        left: `${20 + Math.random() * 60}%`
                                    }}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{
                                        scale: [0, 1, 0],
                                        opacity: [0, 1, 0]
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        delay: i * 0.2,
                                        repeat: Infinity,
                                        repeatDelay: 1
                                    }}
                                >
                                    <Sparkles className="w-5 h-5 text-purple-400" />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {/* Scene 4: Professional Crowd - Community */}
                    {scene === 4 && (
                        <motion.div
                            key="scene4"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.8 }}
                            className="relative w-full h-full flex items-center justify-center"
                        >
                            {/* Company logos floating in background */}
                            <div className="absolute inset-0 overflow-hidden">
                                {companies.map((company, i) => (
                                    <motion.div
                                        key={company.name}
                                        className="absolute"
                                        style={{
                                            left: `${15 + i * 18}%`,
                                            top: `${15 + (i % 2) * 20}%`
                                        }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{
                                            opacity: [0, 0.6, 0.4],
                                            y: [20, 0, -5, 0],
                                        }}
                                        transition={{
                                            duration: 2,
                                            delay: i * 0.3,
                                            repeat: Infinity,
                                            repeatDelay: 2
                                        }}
                                    >
                                        <div className={`bg-gradient-to-br ${company.color} p-[1px] rounded-lg`}>
                                            <div className="bg-slate-900/80 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                                                <Building2 className="w-4 h-4 inline-block mr-1 opacity-70" />
                                                <span className="text-xs font-medium text-slate-300">{company.name}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Team illustration */}
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 1, type: 'spring' }}
                                className="relative w-96 h-96 z-10"
                            >
                                <img
                                    src={crowdImage}
                                    alt="Team of professionals"
                                    className="w-full h-full object-contain"
                                />

                                {/* Highlight ring effect */}
                                <motion.div
                                    className="absolute inset-0 border-2 border-purple-500/50 rounded-3xl blur-sm"
                                    animate={{
                                        opacity: [0.3, 0.7, 0.3],
                                        scale: [1, 1.02, 1]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Placement Counter - Always visible at bottom */}
                <motion.div
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                >
                    <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700 px-6 py-3 rounded-full shadow-lg">
                        <p className="text-sm">
                            <span className="font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent text-lg">
                                500+
                            </span>
                            <span className="text-slate-300 ml-2">students placed this month</span>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
