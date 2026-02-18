import { Html } from '@react-three/drei'
import { motion } from 'framer-motion'

interface NotificationCardProps {
    name: string
    company: string
}

export function NotificationCard({ name, company }: NotificationCardProps) {
    return (
        <Html
            position={[0.8, 2.2, 0]}
            center
            distanceFactor={6}
            zIndexRange={[100, 0]}
        >
            <motion.div
                initial={{ scale: 0.3, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 250, delay: 0.2 }}
                className="pointer-events-none select-none"
            >
                <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 p-[2px] rounded-2xl shadow-2xl shadow-purple-500/50">
                    <div className="bg-slate-900/95 backdrop-blur-sm rounded-2xl p-5 min-w-[260px]">
                        <div className="flex items-start gap-3">
                            <motion.div
                                animate={{ rotate: [0, 15, -15, 10, -10, 0] }}
                                transition={{ duration: 0.6, repeat: 2, delay: 0.5 }}
                                className="text-2xl"
                            >
                                🎉
                            </motion.div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-1">
                                    Congratulations {name}!
                                </h3>
                                <p className="text-sm text-slate-300">
                                    Selected at <span className="font-bold text-white">{company}</span> 🎉
                                </p>
                                <p className="text-xs text-slate-400 mt-1.5">
                                    Offer Letter Sent 📧
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </Html>
    )
}
