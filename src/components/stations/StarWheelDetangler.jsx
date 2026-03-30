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

const MODEL_PATH = '/models/star-wheel-detangler.glb'
const RUBBER_COLOR = new THREE.Color('#1A1A1A')
const FRAME_COLOR = new THREE.Color('#C0C0C0')
const STAR_WHEEL_Y_OFFSET = -0.18
const STUCK_ROOTS = [
  { shaft: 1, rootPosition: [-0.35, 0.02, -0.18], shaftPosition: [-0.65, 0.1, -0.55], rotation: [0.45, 0.2, 0.9], variantIndex: 0 },
  { shaft: 2, rootPosition: [-0.28, -0.02, 0.12], shaftPosition: [-0.38, -0.02, -0.3], rotation: [-0.35, -0.1, 1.05], variantIndex: 1 },
  { shaft: 3, rootPosition: [-0.25, 0.04, -0.05], shaftPosition: [-0.1, 0.06, -0.1], rotation: [0.2, 0.1, 0.82], variantIndex: 2 },
  { shaft: 4, rootPosition: [-0.22, -0.03, 0.18], shaftPosition: [0.16, 0.02, 0.08], rotation: [-0.55, 0.28, 1.12], variantIndex: 3 },
  { shaft: 5, rootPosition: [-0.18, 0.04, -0.16], shaftPosition: [0.42, 0.03, 0.25], rotation: [0.35, -0.24, 0.95], variantIndex: 4 },
  { shaft: 6, rootPosition: [-0.2, -0.01, 0.09], shaftPosition: [0.7, 0.0, 0.48], rotation: [-0.25, 0.22, 1.0], variantIndex: 0 },
]
const RELEASED_ROOTS = [
  { position: [1.45, -0.08, -0.26], rotation: [0.6, 0.4, 0.5], variantIndex: 1 },
  { position: [1.7, -0.24, 0.04], rotation: [0.9, -0.2, -0.2], variantIndex: 3 },
  { position: [1.92, -0.36, 0.28], rotation: [1.15, 0.15, 0.35], variantIndex: 2 },
]

export default function StarWheelDetangler() {
  const station = STATION_DIMENSIONS.starWheelDetangler
  const { scene } = useGLTF(MODEL_PATH)
  const model = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const shaftRefs = useRef([])
  const shaftMeshRefs = useRef([])
  const stuckRootRefs = useRef([])
  const { starWheelSpeed, animationSpeed, showLabels, showDimensions, setHoveredStation } =
    useLineParameters()

  useEffect(() => {
    model.traverse((child) => {
      if (!child.isMesh) return
      child.castShadow = true
      child.receiveShadow = true

      const name = child.name.toLowerCase()
      const materialName = child.material?.name?.toLowerCase() ?? ''
      const isFinger = name.includes('star_') || materialName.includes('rubber')
      const isFrame =
        name.includes('rail') ||
        name.includes('cross') ||
        name.includes('leg') ||
        name.includes('feed_tray') ||
        materialName.includes('frame')

      if (isFinger) {
        child.material = new THREE.MeshStandardMaterial({
          color: RUBBER_COLOR,
          roughness: 0.85,
          metalness: 0.02,
        })
        return
      }

      if (isFrame) {
        child.material = new THREE.MeshStandardMaterial({
          color: FRAME_COLOR,
          metalness: 0.7,
          roughness: 0.35,
        })
        return
      }

      if (materialName.includes('shaft') || name.includes('shaft_')) {
        child.material = new THREE.MeshStandardMaterial({
          color: '#8D949A',
          metalness: 0.82,
          roughness: 0.28,
        })
        return
      }

      if (
        materialName.includes('bearing') ||
        materialName.includes('chain') ||
        materialName.includes('motor') ||
        name.includes('bearing') ||
        name.includes('sprocket') ||
        name.includes('motor')
      ) {
        child.material = new THREE.MeshStandardMaterial({
          color: '#727981',
          metalness: 0.75,
          roughness: 0.42,
        })
      }
    })

    shaftRefs.current = Array.from({ length: 8 }, (_, index) => model.getObjectByName(`star_wheel_shaft_${index}`)).filter(Boolean)
    shaftMeshRefs.current = Array.from({ length: 8 }, (_, index) => model.getObjectByName(`shaft_${index}`)).filter(Boolean)

    ;[...shaftRefs.current, ...shaftMeshRefs.current].forEach((shaft) => {
      shaft.position.y += STAR_WHEEL_Y_OFFSET
    })
  }, [model])

  useFrame((_, delta) => {
    shaftRefs.current.forEach((shaft, index) => {
      const direction = index % 2 === 0 ? 1 : -1
      shaft.rotation.x += delta * direction * (Math.max(starWheelSpeed, 120) / 60) * Math.PI * animationSpeed
    })

    stuckRootRefs.current.forEach((rootGroup, index) => {
      if (!rootGroup) return
      const config = STUCK_ROOTS[index]
      const shaft = shaftRefs.current[config.shaft]
      const localSpin = new THREE.Euler(shaft?.rotation.x ?? 0, 0, 0)
      rootGroup.position.set(config.shaftPosition[0], config.shaftPosition[1] + STAR_WHEEL_Y_OFFSET, config.shaftPosition[2])
      rootGroup.rotation.set(
        config.rotation[0] + localSpin.x,
        config.rotation[1],
        config.rotation[2],
      )
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

      {STUCK_ROOTS.map((root, index) => (
        <group
          key={`stuck-root-${index}`}
          ref={(node) => {
            stuckRootRefs.current[index] = node
          }}
          position={root.shaftPosition}
        >
          <group position={root.rootPosition} rotation={root.rotation}>
            <RootVisual variantIndex={root.variantIndex} scale={11.2} haloScale={2.8} />
          </group>
        </group>
      ))}

      {RELEASED_ROOTS.map((root, index) => (
        <group key={`released-root-${index}`} position={[root.position[0], root.position[1] + STAR_WHEEL_Y_OFFSET, root.position[2]]} rotation={root.rotation}>
          <RootVisual variantIndex={root.variantIndex} scale={10.8} haloScale={2.6} />
        </group>
      ))}

      <StationLabel text={station.name} position={[0, 2.3, 0]} visible={showLabels} />
      <DimensionTag
        text={'8 shafts • 6 interleaved rubber stars per shaft • counter-rotating rows'}
        position={[0, 1.7, 0]}
        visible={showDimensions}
      />
    </group>
  )
}

useGLTF.preload(MODEL_PATH)
