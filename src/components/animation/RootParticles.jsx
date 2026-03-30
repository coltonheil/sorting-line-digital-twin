import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import useLineParameters from '../../hooks/useLineParameters'

const ROOT_COUNT = 26
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

function smoothstep(min, max, value) {
  const t = THREE.MathUtils.clamp((value - min) / (max - min), 0, 1)
  return t * t * (3 - 2 * t)
}

function getMeshFromScene(scene) {
  let found = null
  scene.traverse((child) => {
    if (!found && child.isMesh) found = child
  })
  return found
}

function basePath(t, laneCount, config) {
  const clusterSpread = THREE.MathUtils.lerp(0.015, 0.38 + (laneCount - 1) * 0.09, smoothstep(0.48, 0.63, t))
  const clusterCenter = (config.clusterIndex - (config.clusterSize - 1) / 2) * 0.08
  const clusterOffset = clusterCenter * (1 - smoothstep(0.44, 0.64, t))
  const singulatedOffset = config.laneBias * clusterSpread
  const zBias = clusterOffset + singulatedOffset

  if (t < 0.16) {
    return new THREE.Vector3(
      -20 + t * 28,
      0.85 + Math.sin(t * 18 + config.wobblePhase) * 0.18,
      Math.sin(t * 24 + config.clusterIndex) * 0.12 + clusterOffset * 0.7,
    )
  }

  if (t < 0.33) {
    const lt = (t - 0.16) / 0.17
    return new THREE.Vector3(
      -15.5 + lt * 4.8,
      0.65 + lt * 2.55,
      THREE.MathUtils.lerp(clusterOffset * 0.75, clusterOffset * 0.35, lt),
    )
  }

  if (t < 0.47) {
    const lt = (t - 0.33) / 0.14
    return new THREE.Vector3(
      -6 + lt * 1.5,
      2.95 + Math.sin(lt * Math.PI * 10 + config.wobblePhase) * 0.08,
      clusterOffset * 0.65,
    )
  }

  if (t < 0.63) {
    const lt = (t - 0.47) / 0.16
    const rowPulse = Math.sin(lt * Math.PI * 16 + config.clusterIndex * 0.7) * 0.018
    return new THREE.Vector3(
      -4.5 + lt * 2.6,
      2.99,
      THREE.MathUtils.lerp(clusterOffset * 0.5, zBias, lt) + rowPulse,
    )
  }

  if (t < 0.76) {
    const lt = (t - 0.63) / 0.13
    const fallProgress = smoothstep(config.fallPoint, 1, lt)
    return new THREE.Vector3(
      -1.9 + lt * 3.9,
      THREE.MathUtils.lerp(3.04, 2.68 - config.sizeClass * 0.06, fallProgress),
      THREE.MathUtils.lerp(zBias, config.channelTarget, fallProgress),
    )
  }

  if (t < 0.88) {
    const lt = (t - 0.76) / 0.12
    return new THREE.Vector3(
      2.0 + lt * 3.5,
      THREE.MathUtils.lerp(2.62 - config.sizeClass * 0.05, 3.06, lt),
      THREE.MathUtils.lerp(config.channelTarget, config.exitLane, lt),
    )
  }

  const lt = (t - 0.88) / 0.12
  const angle = -Math.PI / 6 + lt * Math.PI * 0.9
  return new THREE.Vector3(
    14.9 + Math.cos(angle) * 1.4,
    2.65 - lt * 0.95,
    THREE.MathUtils.lerp(config.exitLane, -0.4 + lt * 2.1, 0.45) + Math.sin(angle) * 0.25,
  )
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
    return [gltf1, gltf2, gltf3, gltf4, gltf5].map(({ scene }) => {
      const mesh = getMeshFromScene(scene)
      return {
        geometry: mesh.geometry,
        material: mesh.material,
      }
    })
  }, [gltf1, gltf2, gltf3, gltf4, gltf5])

  const roots = useMemo(
    () =>
      Array.from({ length: ROOT_COUNT }, (_, index) => {
        const clusterSize = 3 + (index % 3)
        const groupIndex = Math.floor(index / 5)
        const laneSlot = index % 3
        const variantIndex = index % meshVariants.length
        return {
          index,
          variantIndex,
          material: meshVariants[variantIndex].material.clone(),
          phase: index / ROOT_COUNT,
          speedJitter: 0.88 + (index % 7) * 0.045,
          wobblePhase: index * 1.37,
          wobbleAmount: 0.02 * (0.45 + ((index * 13) % 9) / 10),
          tilt: new THREE.Vector3(
            THREE.MathUtils.degToRad(-18 + (index % 9) * 4),
            THREE.MathUtils.degToRad(-12 + ((index * 7) % 7) * 4),
            THREE.MathUtils.degToRad(-20 + ((index * 5) % 11) * 4),
          ),
          tumble: new THREE.Vector3(
            1.4 + (index % 5) * 0.3,
            1.1 + ((index + 2) % 7) * 0.22,
            1.6 + ((index + 4) % 6) * 0.25,
          ),
          clusterIndex: index % clusterSize,
          clusterSize,
          laneBias: -1 + laneSlot,
          channelTarget: [-0.2, 0, 0.2][laneSlot],
          exitLane: [-0.42, 0, 0.42][laneSlot],
          sizeClass: index % 3,
          fallPoint: 0.18 + ((index * 17) % 11) / 20,
          scale: 1 + (index % 4) * 0.06,
          scanningBoost: groupIndex % 2 === 0 ? 1.15 : 1.05,
        }
      }),
    [meshVariants],
  )

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
      child.children[0].material.emissive.set(scanning ? '#ffe3a1' : '#000000')
      child.children[0].material.emissiveIntensity = scanning ? 0.45 : 0
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
