import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { useSpring } from '@react-spring/three'
import * as THREE from 'three'
import { CAMERA_CONFIGS } from './utils/constants'

interface CameraRigProps {
    scene: number
}

export function CameraRig({ scene }: CameraRigProps) {
    const cameraRef = useRef<THREE.PerspectiveCamera>(null)
    const lookAtTarget = useRef(new THREE.Vector3(0, 1, 0))

    const config = CAMERA_CONFIGS[scene as keyof typeof CAMERA_CONFIGS]

    // Cinematic easing curves per scene
    const springConfig = {
        1: { tension: 60, friction: 40 },   // Slow ease-in (waiting)
        2: { tension: 200, friction: 20 },  // Quick snap (phone notification)
        3: { tension: 100, friction: 25 },  // Smooth zoom in (confidence)
        4: { tension: 50, friction: 50 },   // Slow pull out (wide shot)
    }[scene] || { tension: 80, friction: 30 }

    const { position, lookAt: lookAtSpring, fov } = useSpring({
        position: config.position,
        lookAt: config.lookAt,
        fov: config.fov,
        config: springConfig,
    })

    // Smoothly interpolate camera lookAt each frame
    useFrame(() => {
        if (!cameraRef.current) return

        const cam = cameraRef.current

        // Update position from spring
        const pos = position.get() as unknown as number[]
        if (Array.isArray(pos) && pos.length === 3) {
            cam.position.set(pos[0], pos[1], pos[2])
        }

        // Smoothly interpolate lookAt target
        const la = lookAtSpring.get() as unknown as number[]
        if (Array.isArray(la) && la.length === 3) {
            lookAtTarget.current.lerp(new THREE.Vector3(la[0], la[1], la[2]), 0.05)
            cam.lookAt(lookAtTarget.current)
        }

        // Update FOV
        const currentFov = fov.get() as unknown as number
        if (typeof currentFov === 'number' && cam.fov !== currentFov) {
            cam.fov = currentFov
            cam.updateProjectionMatrix()
        }
    })

    return (
        <PerspectiveCamera
            ref={cameraRef}
            makeDefault
            position={config.position}
            fov={config.fov as number}
        />
    )
}
