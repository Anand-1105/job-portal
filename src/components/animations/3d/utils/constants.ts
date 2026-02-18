// Animation timings (milliseconds)
export const SCENE_DURATIONS = {
    WAITING: 4000,       // Scene 1: sitting idle
    CHECKING_PHONE: 4000, // Scene 2: texting + notification popup
    CONFIDENCE: 3000,     // Scene 3: standing up, camera zoom
    PLACEMENT: 7000,      // Scene 4: walking (3s) + victory (4s)
} as const

// Victory sub-transition delay within Scene 4
export const VICTORY_DELAY = 3000

// Animation names (used to match Mixamo clip names by substring)
export const ANIMATIONS = {
    SITTING: 'sitting',
    TEXTING: 'texting',
    STANDING: 'standing',
    WALKING: 'walking',
    VICTORY: 'victory',
} as const

// Actual file paths on disk (Refunded structure)
export const ANIMATION_PATHS = {
    BASE: '/models/base.glb',
    SITTING: '/models/anims/sitting.glb',
    TEXTING: '/models/anims/texting.glb',
    STANDING: '/models/anims/stand.glb',
    WALKING: '/models/anims/walking.glb',
    VICTORY: '/models/anims/victory.glb',
} as const

// Scene-to-animation mapping
export const SCENE_TO_ANIMATION: Record<number, string> = {
    1: ANIMATIONS.SITTING,
    2: ANIMATIONS.TEXTING,
    3: ANIMATIONS.STANDING,
    4: ANIMATIONS.WALKING, // Sub-transitions to VICTORY after VICTORY_DELAY
}

// Camera positions for each scene
export const CAMERA_CONFIGS = {
    1: {
        position: [0, 1.6, 8] as [number, number, number],
        lookAt: [0, 1, 0] as [number, number, number],
        fov: 55,
    },
    2: {
        position: [0, 1.6, 7] as [number, number, number],
        lookAt: [0, 1, 0] as [number, number, number],
        fov: 55,
    },
    3: {
        position: [0, 1.6, 6] as [number, number, number],
        lookAt: [0, 1, 0] as [number, number, number],
        fov: 50,
    },
    4: {
        position: [0, 1.6, 8] as [number, number, number],
        lookAt: [0, 1, 0] as [number, number, number],
        fov: 55,
    },
} as const

// Lighting configs per scene
export const LIGHTING_CONFIGS = {
    1: { intensity: 0.8, rimColor: '#6366f1', ambientIntensity: 0.3 },
    2: { intensity: 1.2, rimColor: '#a855f7', ambientIntensity: 0.5 },
    3: { intensity: 1.8, rimColor: '#f59e0b', ambientIntensity: 0.7 }, // Brighter for confidence
    4: { intensity: 1.0, rimColor: '#ec4899', ambientIntensity: 0.4 },
} as const

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
    LOW_FPS: 40,
    CRITICAL_FPS: 30,
} as const

// Quality settings
export const QUALITY_LEVELS = {
    HIGH: {
        shadows: true,
        particleCount: 120,
        shadowMapSize: 1024,
    },
    MEDIUM: {
        shadows: true,
        particleCount: 50,
        shadowMapSize: 512,
    },
    LOW: {
        shadows: false,
        particleCount: 0,  // Disable confetti entirely
        shadowMapSize: 256,
    },
} as const
