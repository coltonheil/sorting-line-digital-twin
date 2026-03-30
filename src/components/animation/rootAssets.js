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
const rootMaterialCache = new Map()

function getMeshFromScene(scene) {
  let largestMesh = null
  let largestVertexCount = -1

  scene.traverse((child) => {
    if (!child.isMesh || !child.geometry?.attributes?.position) return
    const vertexCount = child.geometry.attributes.position.count
    if (vertexCount > largestVertexCount) {
      largestMesh = child
      largestVertexCount = vertexCount
    }
  })

  return largestMesh
}

export function createRootMaterial({ emissiveIntensity = 0.5, shared = false } = {}) {
  const cacheKey = Number(emissiveIntensity.toFixed(3))
  if (shared && rootMaterialCache.has(cacheKey)) return rootMaterialCache.get(cacheKey)

  const material = new THREE.MeshStandardMaterial({
    color: ROOT_COLOR,
    emissive: ROOT_COLOR,
    emissiveIntensity,
    roughness: 0.68,
    metalness: 0.08,
  })

  if (shared) rootMaterialCache.set(cacheKey, material)
  return material
}

export function useRootAssets() {
  const gltf1 = useGLTF(ROOT_PATHS[0])
  const gltf2 = useGLTF(ROOT_PATHS[1])
  const gltf3 = useGLTF(ROOT_PATHS[2])
  const gltf4 = useGLTF(ROOT_PATHS[3])
  const gltf5 = useGLTF(ROOT_PATHS[4])

  return useMemo(() => {
    const variants = [gltf1, gltf2, gltf3, gltf4, gltf5]
      .map(({ scene }, index) => {
        const mesh = getMeshFromScene(scene)
        if (!mesh) return null

        scene.updateWorldMatrix(true, true)
        const geometry = mesh.geometry.clone()
        geometry.applyMatrix4(mesh.matrixWorld)
        geometry.computeBoundingBox()
        geometry.computeBoundingSphere()
        const bounds = geometry.boundingBox ?? new THREE.Box3().setFromObject(mesh)
        const center = bounds.getCenter(new THREE.Vector3())
        geometry.translate(-center.x, -center.y, -center.z)

        const size = bounds.getSize(new THREE.Vector3())
        const renderedLengthAtScale = Math.max(size.x, size.y, size.z) * ROOT_SCALE

        if (!hasLoggedRootBounds) {
          console.info('[RootFlow] Root GLB bounds', {
            variant: index + 1,
            mesh: mesh.name,
            min: bounds.min.toArray(),
            max: bounds.max.toArray(),
            size: size.toArray(),
            renderedLengthAtScale,
          })
        }

        return {
          geometry,
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

    return { variants }
  }, [gltf1, gltf2, gltf3, gltf4, gltf5])
}

ROOT_PATHS.forEach((path) => useGLTF.preload(path))
