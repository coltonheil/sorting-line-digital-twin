import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { STATION_DIMENSIONS } from '../../constants'
import useLineParameters from '../../hooks/useLineParameters'
import StationLabel from '../ui/StationLabel'
import DimensionTag from '../ui/DimensionTag'

const MODEL_PATH = '/models/star-wheel-detangler.glb'

export default function StarWheelDetangler() {
  const station = STATION_DIMENSIONS.starWheelDetangler
  const { scene } = useGLTF(MODEL_PATH)
  const model = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const wheelRefs = useRef([])
  const { starWheelSpeed, animationSpeed, showLabels, showDimensions, setHoveredStation } =
    useLineParameters()

  useEffect(() => {
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    wheelRefs.current = Array.from({ length: 8 }, (_, index) => model.getObjectByName(`star_wheel_${index + 1}`)).filter(Boolean)
  }, [model])

  useFrame((_, delta) => {
    wheelRefs.current.forEach((wheel, index) => {
      const direction = index % 2 === 0 ? 1 : -1
      wheel.rotation.x += delta * direction * (starWheelSpeed / 60) * Math.PI * animationSpeed
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
        text={'8 rubber stars • 24" width'}
        position={[0, 1.7, 0]}
        visible={showDimensions}
      />
    </group>
  )
}

useGLTF.preload(MODEL_PATH)
