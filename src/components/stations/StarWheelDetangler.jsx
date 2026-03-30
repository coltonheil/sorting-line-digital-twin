import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'
import { STATION_DIMENSIONS } from '../../constants'
import useLineParameters from '../../hooks/useLineParameters'
import StationLabel from '../ui/StationLabel'
import DimensionTag from '../ui/DimensionTag'

const MODEL_PATH = '/models/star-wheel-detangler.glb'
const RUBBER_COLOR = new THREE.Color('#1A1A1A')
const FRAME_COLOR = new THREE.Color('#C0C0C0')

export default function StarWheelDetangler() {
  const station = STATION_DIMENSIONS.starWheelDetangler
  const { scene } = useGLTF(MODEL_PATH)
  const model = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const shaftRefs = useRef([])
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
      const isFrame = name.includes('rail') || name.includes('cross') || name.includes('leg') || name.includes('feed_tray') || materialName.includes('frame')

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

      if (materialName.includes('bearing') || materialName.includes('chain') || materialName.includes('motor') || name.includes('bearing') || name.includes('sprocket') || name.includes('motor')) {
        child.material = new THREE.MeshStandardMaterial({
          color: '#727981',
          metalness: 0.75,
          roughness: 0.42,
        })
      }
    })

    shaftRefs.current = Array.from({ length: 8 }, (_, index) => model.getObjectByName(`star_wheel_shaft_${index}`)).filter(Boolean)
  }, [model])

  useFrame((_, delta) => {
    shaftRefs.current.forEach((shaft, index) => {
      const direction = index % 2 === 0 ? 1 : -1
      shaft.rotation.x += delta * direction * (Math.max(starWheelSpeed, 120) / 60) * Math.PI * animationSpeed
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
