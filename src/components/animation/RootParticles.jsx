import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useLineParameters from '../../hooks/useLineParameters'
import { basePath, logRootPathAlignment } from './rootPath'
import { createRootMaterial, ROOT_COLOR, ROOT_EMISSIVE, ROOT_SCALE, useRootAssets } from './rootAssets'

const ROOT_COUNT = 28

const tmpCurrent = new THREE.Vector3()
const tmpNext = new THREE.Vector3()
const up = new THREE.Vector3(0, 1, 0)
const quat = new THREE.Quaternion()
const tiltQuat = new THREE.Quaternion()
const euler = new THREE.Euler()
let hasLoggedAlignment = false

export default function RootParticles() {
  const groupRef = useRef()
  const { beltSpeed, animationSpeed, laneCount } = useLineParameters()
  const { variants: meshVariants } = useRootAssets()

  const roots = useMemo(
    () =>
      Array.from({ length: ROOT_COUNT }, (_, index) => {
        const clusterSize = 3 + (index % 4)
        const groupIndex = Math.floor(index / 4)
        const laneSlot = index % 3
        const variantIndex = index % meshVariants.length
        return {
          index,
          variantIndex,
          material: createRootMaterial(),
          phase: index / ROOT_COUNT,
          speedJitter: 0.9 + (index % 7) * 0.04,
          wobblePhase: index * 1.37,
          wobbleAmount: 0.028 * (0.5 + ((index * 13) % 9) / 10),
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
          scanningBoost: groupIndex % 2 === 0 ? 1.14 : 1.08,
        }
      }),
    [meshVariants],
  )

  useEffect(() => {
    if (!hasLoggedAlignment) {
      logRootPathAlignment()
      hasLoggedAlignment = true
    }

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
      const tAhead = (t + 0.003) % 1
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
      child.material.emissive.copy(scanning ? ROOT_EMISSIVE : ROOT_COLOR)
      child.material.emissiveIntensity = scanning ? 0.62 : 0.5
    })
  })

  return (
    <group ref={groupRef}>
      {roots.map((root) => {
        const variant = meshVariants[root.variantIndex]
        return <mesh key={root.index} geometry={variant.geometry} material={root.material} castShadow receiveShadow />
      })}
    </group>
  )
}
