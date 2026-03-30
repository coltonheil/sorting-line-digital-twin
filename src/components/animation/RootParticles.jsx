import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import useLineParameters from '../../hooks/useLineParameters'
import { basePath, logRootPathAlignment } from './rootPath'

const ROOT_COUNT = 44
const ROOT_SCALE = 4.1
const ROOT_COLOR = new THREE.Color('#D4A855')
const ROOT_PATHS = [
  '/models/root-variant-1.glb',
  '/models/root-variant-2.glb',
  '/models/root-variant-3.glb',
  '/models/root-variant-4.glb',
  '/models/root-variant-5.glb',
]

const tmpCurrent = new THREE.Vector3()
const tmpNext = new THREE.Vector3()
const up = new THREE.Vector3(0, 1, 0)
const quat = new THREE.Quaternion()
const tiltQuat = new THREE.Quaternion()
const euler = new THREE.Euler()
let hasLoggedRootBounds = false

function getMeshFromScene(scene) {
  let found = null
  scene.traverse((child) => {
    if (!found && child.isMesh) found = child
  })
  return found
}

function createRootMaterial() {
  return new THREE.MeshStandardMaterial({
    color: ROOT_COLOR,
    emissive: ROOT_COLOR,
    emissiveIntensity: 0.3,
    roughness: 0.7,
    metalness: 0.08,
  })
}

export default function RootParticles() {
  const groupRef = useRef()
  const { beltSpeed, animationSpeed, laneCount } = useLineParameters()

  const gltf1 = useGLTF(ROOT_PATHS[0])
  const gltf2 = useGLTF(ROOT_PATHS[1])
  const gltf3 = useGLTF(ROOT_PATHS[2])
  const gltf4 = useGLTF(ROOT_PATHS[3])
  const gltf5 = useGLTF(ROOT_PATHS[4])

  const meshVariants = useMemo(() => {
    return [gltf1, gltf2, gltf3, gltf4, gltf5].map(({ scene }, index) => {
      const mesh = getMeshFromScene(scene)
      if (!mesh) return null

      if (!hasLoggedRootBounds && index === 0) {
        const bounds = new THREE.Box3().setFromObject(scene)
        const size = bounds.getSize(new THREE.Vector3())
        console.info('[RootFlow] Root GLB bounds', {
          min: bounds.min.toArray(),
          max: bounds.max.toArray(),
          size: size.toArray(),
          renderedLengthAtScale: Math.max(size.x, size.y, size.z) * ROOT_SCALE,
        })
        logRootPathAlignment()
        hasLoggedRootBounds = true
      }

      return {
        geometry: mesh.geometry,
      }
    }).filter(Boolean)
  }, [gltf1, gltf2, gltf3, gltf4, gltf5])

  const roots = useMemo(
    () =>
      Array.from({ length: ROOT_COUNT }, (_, index) => {
        const clusterSize = 3 + (index % 4)
        const groupIndex = Math.floor(index / 6)
        const laneSlot = index % 3
        const variantIndex = index % meshVariants.length
        return {
          index,
          variantIndex,
          material: createRootMaterial(),
          phase: index / ROOT_COUNT,
          speedJitter: 0.86 + (index % 9) * 0.038,
          wobblePhase: index * 1.37,
          wobbleAmount: 0.03 * (0.5 + ((index * 13) % 9) / 10),
          tilt: new THREE.Vector3(
            THREE.MathUtils.degToRad(-20 + (index % 9) * 4),
            THREE.MathUtils.degToRad(-16 + ((index * 7) % 7) * 5),
            THREE.MathUtils.degToRad(-24 + ((index * 5) % 11) * 4),
          ),
          tumble: new THREE.Vector3(
            1.5 + (index % 5) * 0.32,
            1.25 + ((index + 2) % 7) * 0.24,
            1.7 + ((index + 4) % 6) * 0.28,
          ),
          clusterIndex: index % clusterSize,
          clusterSize,
          laneBias: -1 + laneSlot,
          channelTarget: [-0.24, 0, 0.24][laneSlot],
          exitLane: [-0.44, 0, 0.44][laneSlot],
          sizeClass: index % 3,
          fallPoint: 0.16 + ((index * 17) % 11) / 20,
          scale: ROOT_SCALE * (1 + (index % 4) * 0.08),
          scanningBoost: groupIndex % 2 === 0 ? 1.2 : 1.08,
        }
      }),
    [meshVariants],
  )

  useEffect(() => {
    return () => {
      roots.forEach((root) => root.material.dispose())
    }
  }, [roots])

  useFrame((state) => {
    if (!groupRef.current) return
    const children = groupRef.current.children
    const speed = (beltSpeed / 60 / 8) * animationSpeed

    children.forEach((child, index) => {
      const config = roots[index]
      const t = (state.clock.elapsedTime * speed * config.speedJitter + config.phase) % 1
      const tAhead = (t + 0.0025) % 1
      const current = basePath(t, laneCount, config)
      const next = basePath(tAhead, laneCount, config)

      const wobbleX = Math.sin(state.clock.elapsedTime * 2.4 + config.wobblePhase) * config.wobbleAmount
      const wobbleZ = Math.cos(state.clock.elapsedTime * 1.8 + config.wobblePhase * 0.7) * config.wobbleAmount
      child.position.set(current.x + wobbleX, current.y, current.z + wobbleZ)

      tmpCurrent.copy(current)
      tmpNext.copy(next).sub(tmpCurrent).normalize()
      quat.setFromUnitVectors(up, tmpNext)
      child.quaternion.copy(quat)

      euler.set(
        config.tilt.x + state.clock.elapsedTime * config.tumble.x,
        config.tilt.y + state.clock.elapsedTime * config.tumble.y,
        config.tilt.z + state.clock.elapsedTime * config.tumble.z,
      )
      tiltQuat.setFromEuler(euler)
      child.quaternion.multiply(tiltQuat)

      const scanning = t > 0.79 && t < 0.84
      const scale = config.scale * (scanning ? config.scanningBoost : 1)
      child.scale.setScalar(scale)
      child.children[0].material.emissive.copy(scanning ? new THREE.Color('#ffe3a1') : ROOT_COLOR)
      child.children[0].material.emissiveIntensity = scanning ? 0.5 : 0.3
    })
  })

  return (
    <group ref={groupRef}>
      {roots.map((root) => {
        const variant = meshVariants[root.variantIndex]
        return (
          <group key={root.index}>
            <mesh geometry={variant.geometry} material={root.material} castShadow receiveShadow />
          </group>
        )
      })}
    </group>
  )
}

ROOT_PATHS.forEach((path) => useGLTF.preload(path))
