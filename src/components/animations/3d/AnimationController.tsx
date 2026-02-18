import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface AnimationControllerProps {
    actions: Record<string, THREE.AnimationAction | null>
    mixer: THREE.AnimationMixer
    currentAnimation: string
    fadeTime?: number
    rootBoneName?: string
}

/**
 * Handles cross-fade transitions between animations.
 * Includes root motion removal to keep the character at world origin.
 */
export function AnimationController({
    actions,
    mixer,
    currentAnimation,
    fadeTime = 0.5,
    rootBoneName = 'Hips',
}: AnimationControllerProps) {
    const previousAnimRef = useRef<string>('')
    const activeActionRef = useRef<THREE.AnimationAction | null>(null)
    const rootBoneRef = useRef<THREE.Bone | null>(null)
    const rootOriginRef = useRef<THREE.Vector3>(new THREE.Vector3())

    // Find root bone for root motion removal
    useEffect(() => {
        if (!mixer) return
        const root = (mixer as any)._root as THREE.Object3D
        if (!root) return

        root.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Bone && child.name === rootBoneName) {
                rootBoneRef.current = child
                rootOriginRef.current.copy(child.position)
            }
        })
    }, [mixer, rootBoneName])

    // Find the best-matching action for an animation name
    const findAction = (animName: string): THREE.AnimationAction | null => {
        if (!actions) return null

        // Try exact match first
        for (const [key, action] of Object.entries(actions)) {
            if (key.toLowerCase().includes(animName.toLowerCase())) {
                return action
            }
        }

        // Try matching clip names within the animation
        for (const [, action] of Object.entries(actions)) {
            if (action) {
                const clipName = action.getClip().name.toLowerCase()
                if (clipName.includes(animName.toLowerCase())) {
                    return action
                }
            }
        }

        console.warn(`[AnimationController] No action found for "${animName}". Available:`, Object.keys(actions))
        return null
    }

    // Cross-fade animation transitions
    useEffect(() => {
        if (!actions || !currentAnimation || !mixer) return

        const prevAnimName = previousAnimRef.current
        if (prevAnimName === currentAnimation) return

        const nextAction = findAction(currentAnimation)
        const prevAction = prevAnimName ? findAction(prevAnimName) : null

        if (!nextAction) {
            console.warn(`[AnimationController] Failed to play "${currentAnimation}", falling back`)
            // Try falling back to the first available action
            const fallback = Object.values(actions).find((a) => a !== null)
            if (fallback) {
                fallback.reset().fadeIn(fadeTime).play()
                activeActionRef.current = fallback
            }
            return
        }

        // Determine loop behavior
        const shouldLoop = ['sitting', 'texting', 'walking', 'victory'].some(
            (name) => currentAnimation.toLowerCase().includes(name)
        )

        nextAction.reset()
        nextAction.setLoop(shouldLoop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity)
        nextAction.clampWhenFinished = !shouldLoop
        nextAction.setEffectiveTimeScale(1)
        nextAction.setEffectiveWeight(1)

        if (prevAction && prevAction !== nextAction) {
            // Smooth crossFade: fade out previous, fade in next
            prevAction.fadeOut(fadeTime)
            nextAction.fadeIn(fadeTime)
            nextAction.play()
        } else {
            nextAction.fadeIn(fadeTime)
            nextAction.play()
        }

        activeActionRef.current = nextAction
        previousAnimRef.current = currentAnimation
    }, [currentAnimation, actions, fadeTime, mixer])

    // Update mixer + root motion removal every frame
    useFrame((_, delta) => {
        if (!mixer) return

        // Clamp delta to prevent large jumps (e.g. tab switch)
        const clampedDelta = Math.min(delta, 0.1)
        mixer.update(clampedDelta)

        // Root motion removal: lock hip bone to origin position
        if (rootBoneRef.current) {
            rootBoneRef.current.position.x = rootOriginRef.current.x
            rootBoneRef.current.position.z = rootOriginRef.current.z
            // Keep Y for sit/stand transitions but clamp to reasonable range
            rootBoneRef.current.position.y = Math.max(
                rootOriginRef.current.y,
                Math.min(rootBoneRef.current.position.y, rootOriginRef.current.y + 0.5)
            )
        }
    })

    return null // Renderless controller
}
