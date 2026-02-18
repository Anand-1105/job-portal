import { useMemo, useRef } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { AnimationController } from './AnimationController'
import { ANIMATIONS, ANIMATION_PATHS } from './utils/constants'

interface CharacterProps {
    scene: number
    currentAnimation: string
}

// Scene-to-animation is now driven by the parent via currentAnimation prop

/**
 * Retargets animation clips from a source skeleton onto a target skeleton,
 * matching bones by name. This is needed because each Mixamo GLB has its
 * own skeleton instance.
 */
function retargetClips(
    clips: THREE.AnimationClip[],
    sourceSkeleton: THREE.Skeleton | null,
    targetSkeleton: THREE.Skeleton | null
): THREE.AnimationClip[] {
    if (!sourceSkeleton || !targetSkeleton) return clips

    // Build a map from target bone names to their indices
    const targetBoneMap = new Map<string, number>()
    targetSkeleton.bones.forEach((bone, index) => {
        targetBoneMap.set(bone.name, index)
    })

    return clips.map((clip) => {
        const retargetedTracks: THREE.KeyframeTrack[] = []

        for (const track of clip.tracks) {
            // Mixamo track names look like: "mixamorig:Hips.position" or "Armature.mixamorig:Hips.quaternion"
            // We need to extract the bone name and check if it exists in the target skeleton
            const parts = track.name.split('.')
            const nodePath = parts.slice(0, -1).join('.')

            // Extract bone name (after last colon or slash)
            const boneName = nodePath.includes(':')
                ? nodePath.split(':').pop()!
                : nodePath

            // Check if this bone exists in the target skeleton
            if (targetBoneMap.has(boneName) || targetBoneMap.has(`mixamorig:${boneName}`)) {
                // Keep this track - the bone exists in target
                retargetedTracks.push(track.clone())
            } else if (nodePath.includes('Hips') || nodePath.includes('Root')) {
                // Always keep root/hip tracks
                retargetedTracks.push(track.clone())
            }
        }

        return new THREE.AnimationClip(clip.name, clip.duration, retargetedTracks, clip.blendMode)
    })
}

/**
 * Gets the skeleton from a GLTF scene.
 */
function extractSkeleton(scene: THREE.Object3D): THREE.Skeleton | null {
    let skeleton: THREE.Skeleton | null = null
    scene.traverse((child) => {
        if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
            skeleton = (child as THREE.SkinnedMesh).skeleton
        }
    })
    return skeleton
}

export function Character({ currentAnimation }: CharacterProps) {
    const groupRef = useRef<THREE.Group>(null)

    // Load base character from the first animation GLB (it includes the mesh + skeleton)
    // Load base character from base.glb (mesh + skeleton)
    const baseGltf = useGLTF(ANIMATION_PATHS.BASE)

    // Load all animation GLBs
    const sittingGltf = useGLTF(ANIMATION_PATHS.SITTING)
    const textingGltf = useGLTF(ANIMATION_PATHS.TEXTING)
    const standingGltf = useGLTF(ANIMATION_PATHS.STANDING)
    const walkingGltf = useGLTF(ANIMATION_PATHS.WALKING)
    const victoryGltf = useGLTF(ANIMATION_PATHS.VICTORY)

    // Clone the base scene to avoid mutating the cached original
    const characterScene = useMemo(() => {
        const cloned = baseGltf.scene.clone(true)

        // ===== AUTO CENTER MODEL =====
        const box = new THREE.Box3().setFromObject(cloned)
        const center = new THREE.Vector3()
        box.getCenter(center)
        cloned.position.sub(center)   // move model to origin

        // optional small lift if feet inside ground
        cloned.position.y += 0.1

        // keep rotation
        cloned.rotation.set(0, Math.PI, 0)

        // Iterate meshes to enable shadows
        cloned.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                child.castShadow = true
                child.receiveShadow = true
                // Ensure materials are properly set up
                const mesh = child as THREE.Mesh
                if (mesh.material) {
                    const mat = mesh.material as THREE.MeshStandardMaterial
                    if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace
                }
            }
        })

        return cloned
    }, [baseGltf.scene])

    // Extract base skeleton for retargeting
    const baseSkeleton = useMemo(() => extractSkeleton(characterScene), [characterScene])

    // Combine and retarget all animations onto the base skeleton
    const allAnimations = useMemo(() => {
        const animSources = [
            { gltf: sittingGltf, name: ANIMATIONS.SITTING },
            { gltf: textingGltf, name: ANIMATIONS.TEXTING },
            { gltf: standingGltf, name: ANIMATIONS.STANDING },
            { gltf: walkingGltf, name: ANIMATIONS.WALKING },
            { gltf: victoryGltf, name: ANIMATIONS.VICTORY },
        ]

        const allClips: THREE.AnimationClip[] = []

        for (const { gltf, name } of animSources) {
            if (!gltf.animations || gltf.animations.length === 0) {
                console.warn(`[Character] No animations found in GLB for "${name}"`)
                continue
            }

            const sourceSkeleton = extractSkeleton(gltf.scene)

            // Retarget clips from source skeleton to base skeleton
            const retargeted = retargetClips(gltf.animations, sourceSkeleton, baseSkeleton)

            // Rename clips to include our animation identifier for lookup
            retargeted.forEach((clip, i) => {
                // Use exact name for the first clip so actions[name] works
                clip.name = i === 0 ? name : `${name}_${i}`
                allClips.push(clip)
            })
        }

        return allClips
    }, [sittingGltf, textingGltf, standingGltf, walkingGltf, victoryGltf, baseSkeleton])

    // Attach all animations to the character scene
    const { actions, mixer } = useAnimations(allAnimations, characterScene)

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            <primitive object={characterScene} />

            {/* AnimationController handles crossFade transitions + root motion removal */}
            {mixer && (
                <AnimationController
                    actions={actions}
                    mixer={mixer}
                    currentAnimation={currentAnimation}
                    fadeTime={0.5}
                />
            )}
        </group>
    )
}

// Preload all GLBs for better loading performance
export function preloadAllModels() {
    Object.values(ANIMATION_PATHS).forEach((path) => {
        useGLTF.preload(path)
    })
}

// Call preload immediately on module load
preloadAllModels()
