import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'
import { STATION_DIMENSIONS } from '../../constants'
import useLineParameters from '../../hooks/useLineParameters'
import RootVisual from '../animation/RootVisual'
import StationLabel from '../ui/StationLabel'
import DimensionTag from '../ui/DimensionTag'

const MODEL_PATH = '/models/roller-singulation.glb'
const ENTRY_COLOR = new THREE.Color('#2E8E6F')
const EXIT_COLOR = new THREE.Color('#E05A3A')
const RIDING_ROOTS = [
  { position: [-1.45, 0.38, -0.34], rotation: [0.18, 0.2, 0.92], variantIndex: 0, scale: 10.8 },
  { position: [-1.1, 0.36, 0.28], rotation: [-0.08, -0.22, 1.0], variantIndex: 1, scale: 11.0 },
  { position: [-0.25, 0.25, -0.12], rotation: [0.45, 0.08, 1.08], variantIndex: 2, scale: 10.5 },
  { position: [0.2, 0.12, 0.1], rotation: [0.72, -0.18, 1.18], variantIndex: 3, scale: 10.3 },
  { position: [0.48, -0.22, -0.32], rotation: [1.3, 0.1, 0.64], variantIndex: 4, scale: 10.0 },
  { position: [0.95, -0.28, 0.24], rotation: [1.05, -0.12, 0.58], variantIndex: 1, scale: 10.2 },
  { position: [1.62, 0.34, -0.08], rotation: [0.12, 0.24, 0.94], variantIndex: 2, scale: 11.5 },
  { position: [1.95, 0.37, 0.34], rotation: [-0.14, -0.18, 1.04], variantIndex: 0, scale: 11.7 },
]

export default function RollerSingulation() {
  const station = STATION_DIMENSIONS.rollerSingulation
  const { scene } = useGLTF(MODEL_PATH)
  const model = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const rollerRefs = useRef([])
  const rootRefs = useRef([])
  const {
    rollerGapStart,
    rollerGapEnd,
    laneCount,
    beltSpeed,
    animationSpeed,
    showLabels,
    showDimensions,
    setHoveredStation,
  } = useLineParameters()

  useEffect(() => {
    const grooveGeometry = new THREE.TorusGeometry(0.032, 0.004, 10, 40)
    const grooveMaterial = new THREE.MeshStandardMaterial({ color: '#1B1E22', metalness: 0.22, roughness: 0.86 })
    const nextRollers = []

    model.traverse((child) => {
      if (!child.isMesh) return
      child.castShadow = true
      child.receiveShadow = true

      const name = child.name.toLowerCase()
      const materialName = child.material?.name?.toLowerCase() ?? ''

      if (name.startsWith('roller_')) {
        const rollerIndex = Number(name.split('_')[1])
        const color = ENTRY_COLOR.clone().lerp(EXIT_COLOR, rollerIndex / 13)
        child.material = new THREE.MeshStandardMaterial({
          color,
          emissive: color.clone().multiplyScalar(0.08),
          metalness: 0.8,
          roughness: 0.2,
        })
        nextRollers.push(child)
        return
      }

      if (materialName.includes('frame') || materialName.includes('channel') || name.includes('top_') || name.includes('base_') || name.includes('leg_') || name.includes('cross') || name.includes('lip')) {
        child.material = new THREE.MeshStandardMaterial({
          color: '#B8BDC3',
          metalness: 0.72,
          roughness: 0.34,
        })
        return
      }

      if (materialName.includes('bearing') || materialName.includes('chain') || name.includes('bearing') || name.includes('sprocket') || name.includes('chain_span')) {
        child.material = new THREE.MeshStandardMaterial({
          color: '#6F7680',
          metalness: 0.78,
          roughness: 0.36,
        })
      }
    })

    nextRollers.forEach((roller) => {
      if (roller.children.some((child) => child.name?.includes('_groove_'))) return
      ;[-0.22, 0.22].forEach((offset, grooveIndex) => {
        const groove = new THREE.Mesh(grooveGeometry, grooveMaterial)
        groove.name = `${roller.name}_groove_${grooveIndex}`
        groove.rotation.x = Math.PI / 2
        groove.position.set(0, 0, offset)
        roller.add(groove)
      })
    })

    rollerRefs.current = nextRollers
  }, [model])

  useFrame((state, delta) => {
    rollerRefs.current.forEach((roller) => {
      roller.rotation.z += delta * (beltSpeed / 60) * 4.4 * animationSpeed
    })

    rootRefs.current.forEach((root, index) => {
      if (!root || index > 3) return
      root.position.y = RIDING_ROOTS[index].position[1] + Math.sin(state.clock.elapsedTime * 0.8 + index) * 0.02
      root.rotation.z = RIDING_ROOTS[index].rotation[2] + Math.sin(state.clock.elapsedTime * 0.7 + index) * 0.06
    })
  })

  return (
    <group
      position={station.center}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHoveredStation(station.key)
      }}
      onPointerOut={() => setHoveredStation(null)}
    >
      <primitive object={model} />

      {RIDING_ROOTS.map((root, index) => (
        <group
          key={`roller-root-${index}`}
          ref={(node) => {
            rootRefs.current[index] = node
          }}
          position={root.position}
          rotation={root.rotation}
        >
          <RootVisual variantIndex={root.variantIndex} scale={root.scale} haloScale={2.7} />
        </group>
      ))}

      <StationLabel text={station.name} position={[0, 1.8, 0]} visible={showLabels} />
      <DimensionTag
        text={`14 diverging rollers • gap ${rollerGapStart.toFixed(2)}" → ${rollerGapEnd.toFixed(2)}" • ${laneCount} lane${laneCount > 1 ? 's' : ''}`}
        position={[0, 1.2, 0]}
        visible={showDimensions}
      />
    </group>
  )
}

useGLTF.preload(MODEL_PATH)
