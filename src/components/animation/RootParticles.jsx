import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useLineParameters from '../../hooks/useLineParameters'
import { basePath, logRootPathAlignment } from './rootPath'
import { createRootMaterial, ROOT_SCALE, useRootAssets } from './rootAssets'

const ROOT_COUNT = 20
const tmpCurrent = new THREE.Vector3()
const tmpNext = new THREE.Vector3()
const tmpPosition = new THREE.Vector3()
const tmpQuaternion = new THREE.Quaternion()
const tmpTiltQuat = new THREE.Quaternion()
const tmpEuler = new THREE.Euler()
const tmpMatrix = new THREE.Matrix4()
const tmpScale = new THREE.Vector3()
const up = new THREE.Vector3(0, 1, 0)
let hasLoggedAlignment = false

function RootBatch({ roots, geometry, material, beltSpeed, animationSpeed, laneCount, timeOffset = 0 }) {
  const meshRef = useRef()

  useFrame((state) => {
    if (!meshRef.current) return
    const speed = (beltSpeed / 60 / 8) * animationSpeed
    const elapsedTime = state.clock.elapsedTime + timeOffset

    roots.forEach((config, index) => {
      const t = (elapsedTime * speed * config.speedJitter + config.phase) % 1
      const tAhead = (t + 0.003) % 1
      const current = basePath(t, laneCount, config)
      const next = basePath(tAhead, laneCount, config)

      const wobbleX = Math.sin(elapsedTime * 2.4 + config.wobblePhase) * config.wobbleAmount
      const wobbleZ = Math.cos(elapsedTime * 1.8 + config.wobblePhase * 0.7) * config.wobbleAmount
      tmpPosition.set(current.x + wobbleX, current.y, current.z + wobbleZ)

      tmpCurrent.copy(current)
      tmpNext.copy(next).sub(tmpCurrent).normalize()
      tmpQuaternion.setFromUnitVectors(up, tmpNext)

      tmpEuler.set(
        config.tilt.x + elapsedTime * config.tumble.x,
        config.tilt.y + elapsedTime * config.tumble.y,
        config.tilt.z + elapsedTime * config.tumble.z,
      )
      tmpTiltQuat.setFromEuler(tmpEuler)
      tmpQuaternion.multiply(tmpTiltQuat)

      const scanning = t > 0.79 && t < 0.84
      const scale = config.scale * (scanning ? config.scanningBoost : 1)
      tmpScale.setScalar(scale)
      tmpMatrix.compose(tmpPosition, tmpQuaternion, tmpScale)
      meshRef.current.setMatrixAt(index, tmpMatrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={meshRef} args={[geometry, material, roots.length]} castShadow receiveShadow frustumCulled={false} />
}

export default function RootParticles() {
  const { beltSpeed, animationSpeed, laneCount } = useLineParameters()
  const { variants: meshVariants } = useRootAssets()
  const sharedMaterial = useMemo(() => createRootMaterial({ emissiveIntensity: 0.52, shared: true }), [])

  const roots = useMemo(
    () =>
      Array.from({ length: ROOT_COUNT }, (_, index) => {
        const clusterSize = 3 + (index % 4)
        const groupIndex = Math.floor(index / 4)
        const laneSlot = index % 3
        const variantIndex = meshVariants.length ? index % meshVariants.length : 0
        return {
          index,
          variantIndex,
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

  const rootsByVariant = useMemo(() => {
    if (!meshVariants.length) return []
    return meshVariants.map((variant, variantIndex) => ({
      geometry: variant.geometry,
      roots: roots.filter((root) => root.variantIndex === variantIndex),
    })).filter((entry) => entry.roots.length > 0)
  }, [meshVariants, roots])

  useEffect(() => {
    if (!hasLoggedAlignment) {
      logRootPathAlignment()
      hasLoggedAlignment = true
    }
  }, [])

  return (
    <group>
      {rootsByVariant.map((entry, index) => (
        <RootBatch
          key={`root-batch-${index}`}
          roots={entry.roots}
          geometry={entry.geometry}
          material={sharedMaterial}
          beltSpeed={beltSpeed}
          animationSpeed={animationSpeed}
          laneCount={laneCount}
          timeOffset={index * 0.0375}
        />
      ))}
    </group>
  )
}
