import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

export const ROOT_COLOR = new THREE.Color('#D4A855')
export const ROOT_EMISSIVE = new THREE.Color('#ffe3a1')
export const ROOT_SCALE = 12
export const ROOT_PATHS = [
  '/models/root-variant-1.glb',
  '/models/root-variant-2.glb',
  '/models/root-variant-3.glb',
  '/models/root-variant-4.glb',
  '/models/root-variant-5.glb',
]

let hasLoggedRootBounds = false

function getMeshFromScene(scene) {
  let found = null
  scene.traverse((child) => {
    if (!found && child.isMesh) found = child
  })
  return found
}

function createHaloTexture() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255, 227, 161, 0.95)')
  gradient.addColorStop(0.35, 'rgba(240, 191, 92, 0.45)')
  gradient.addColorStop(0.7, 'rgba(212, 168, 85, 0.12)')
  gradient.addColorStop(1, 'rgba(212, 168, 85, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

export function createRootMaterial({ emissiveIntensity = 0.5 } = {}) {
  return new THREE.MeshStandardMaterial({
    color: ROOT_COLOR,
    emissive: ROOT_COLOR,
    emissiveIntensity,
    roughness: 0.68,
    metalness: 0.08,
  })
}

export function useRootAssets() {
  const gltf1 = useGLTF(ROOT_PATHS[0])
  const gltf2 = useGLTF(ROOT_PATHS[1])
  const gltf3 = useGLTF(ROOT_PATHS[2])
  const gltf4 = useGLTF(ROOT_PATHS[3])
  const gltf5 = useGLTF(ROOT_PATHS[4])

  return useMemo(() => {
    const variants = [gltf1, gltf2, gltf3, gltf4, gltf5]
      .map(({ scene }) => {
        const mesh = getMeshFromScene(scene)
        if (!mesh) return null

        const bounds = new THREE.Box3().setFromObject(scene)
        const size = bounds.getSize(new THREE.Vector3())
        const renderedLengthAtScale = Math.max(size.x, size.y, size.z) * ROOT_SCALE

        if (!hasLoggedRootBounds) {
          console.info('[RootFlow] Root GLB bounds', {
            path: mesh.name,
            min: bounds.min.toArray(),
            max: bounds.max.toArray(),
            size: size.toArray(),
            renderedLengthAtScale,
          })
        }

        return {
          geometry: mesh.geometry,
          size,
          renderedLengthAtScale,
        }
      })
      .filter(Boolean)

    if (!hasLoggedRootBounds && variants.length > 0) {
      console.info(
        '[RootFlow] Rendered root lengths at scale 12x',
        variants.map((variant, index) => ({ variant: index + 1, length: Number(variant.renderedLengthAtScale.toFixed(3)) })),
      )
      hasLoggedRootBounds = true
    }

    return {
      variants,
      haloTexture: createHaloTexture(),
    }
  }, [gltf1, gltf2, gltf3, gltf4, gltf5])
}

ROOT_PATHS.forEach((path) => useGLTF.preload(path))
