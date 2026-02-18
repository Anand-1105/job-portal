import { Environment } from '@react-three/drei'
import { LIGHTING_CONFIGS } from './utils/constants'
import { useSpring, a } from '@react-spring/three'

interface LightingProps {
    scene: number
    quality: 'HIGH' | 'MEDIUM' | 'LOW'
}

export function Lighting({ scene, quality }: LightingProps) {
    const config = LIGHTING_CONFIGS[scene as keyof typeof LIGHTING_CONFIGS]

    const { intensity, ambientIntensity } = useSpring({
        intensity: 2.0,
        ambientIntensity: 1.0,
        config: { tension: 80, friction: 30 },
    })

    const enableShadows = quality !== 'LOW'

    return (
        <>
            {/* HDRI Environment for realistic IBL */}
            <Environment preset="city" background={false} />

            {/* Key Light – primary directional */}
            <a.directionalLight
                position={[5, 5, 5]}
                intensity={intensity}
                castShadow={enableShadows}
                shadow-mapSize={quality === 'HIGH' ? 1024 : 512}
                shadow-bias={-0.001}
            />

            {/* Rim Light – cinematic edge highlight, disabled on LOW */}
            {quality !== 'LOW' && (
                <spotLight
                    position={[-3, 3, -3]}
                    intensity={0.6}
                    angle={0.5}
                    penumbra={1}
                    color={config.rimColor}
                />
            )}

            {/* Fill Light – soften shadows */}
            <a.ambientLight intensity={ambientIntensity} />

            {/* Ground plane for shadow receiving */}
            {enableShadows && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                    <planeGeometry args={[20, 20]} />
                    <shadowMaterial transparent opacity={0.15} />
                </mesh>
            )}
        </>
    )
}
