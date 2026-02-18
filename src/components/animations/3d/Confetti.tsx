import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ConfettiProps {
    count?: number
}

const CONFETTI_COLORS = ['#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444']

export function Confetti({ count = 100 }: ConfettiProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null!)
    const dummy = useMemo(() => new THREE.Object3D(), [])

    const particles = useMemo(() => {
        return Array.from({ length: count }, () => ({
            position: new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                Math.random() * 4 + 2,
                (Math.random() - 0.5) * 5
            ),
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.03,
                -(Math.random() * 0.02 + 0.008),
                (Math.random() - 0.5) * 0.03
            ),
            rotation: new THREE.Euler(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                0
            ),
            rotationSpeed: new THREE.Vector3(
                (Math.random() - 0.5) * 0.15,
                (Math.random() - 0.5) * 0.15,
                0
            ),
            color: new THREE.Color(
                CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]
            ),
        }))
    }, [count])

    // Set initial colors
    useMemo(() => {
        if (!meshRef.current) return
        particles.forEach((p, i) => {
            meshRef.current.setColorAt(i, p.color)
        })
        if (meshRef.current.instanceColor) {
            meshRef.current.instanceColor.needsUpdate = true
        }
    }, [particles])

    useFrame(() => {
        if (!meshRef.current) return

        particles.forEach((particle, i) => {
            // Update physics
            particle.position.add(particle.velocity)
            particle.rotation.x += particle.rotationSpeed.x
            particle.rotation.y += particle.rotationSpeed.y

            // Reset when fallen below ground
            if (particle.position.y < -0.5) {
                particle.position.set(
                    (Math.random() - 0.5) * 5,
                    Math.random() * 2 + 3,
                    (Math.random() - 0.5) * 5
                )
            }

            // Apply transform
            dummy.position.copy(particle.position)
            dummy.rotation.copy(particle.rotation)
            dummy.scale.set(1, 1, 1)
            dummy.updateMatrix()
            meshRef.current.setMatrixAt(i, dummy.matrix)
        })

        meshRef.current.instanceMatrix.needsUpdate = true
    })

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <planeGeometry args={[0.06, 0.04]} />
            <meshBasicMaterial side={THREE.DoubleSide} vertexColors />
        </instancedMesh>
    )
}
