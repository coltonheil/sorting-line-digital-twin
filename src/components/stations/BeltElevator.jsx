import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { STATION_DIMENSIONS } from '../../constants'
import useLineParameters from '../../hooks/useLineParameters'
import StationLabel from '../ui/StationLabel'
import DimensionTag from '../ui/DimensionTag'

const MODEL_PATH = '/models/belt-elevator.glb'

export default function BeltElevator() {
  const station = STATION_DIMENSIONS.beltElevator
  const { scene } = useGLTF(MODEL_PATH)
  const model = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const headDrumRef = useRef(null)
  const tailDrumRef = useRef(null)
  const { beltSpeed, animationSpeed, showLabels, showDimensions, setHoveredStation } =
    useLineParameters()

  useEffect(() => {
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    headDrumRef.current = model.getObjectByName('head_drum')
    tailDrumRef.current = model.getObjectByName('tail_drum')
  }, [model])

  useFrame((_, delta) => {
    const speed = delta * beltSpeed * 0.08 * animationSpeed
    if (headDrumRef.current) headDrumRef.current.rotation.z -= speed
    if (tailDrumRef.current) tailDrumRef.current.rotation.z -= speed
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
      <StationLabel text={station.name} position={[0.2, 3.1, 0]} visible={showLabels} />
      <DimensionTag
        text={'30° incline • 18" belt'}
        position={[0.2, 2.45, 0]}
        visible={showDimensions}
      />
    </group>
  )
}

useGLTF.preload(MODEL_PATH)
