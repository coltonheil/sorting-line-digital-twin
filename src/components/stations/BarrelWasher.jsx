import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { STATION_DIMENSIONS } from '../../constants'
import useLineParameters from '../../hooks/useLineParameters'
import StationLabel from '../ui/StationLabel'
import DimensionTag from '../ui/DimensionTag'

const MODEL_PATH = './models/barrel-washer.glb'

export default function BarrelWasher() {
  const station = STATION_DIMENSIONS.barrelWasher
  const groupRef = useRef()
  const drumRef = useRef()
  const { scene } = useGLTF(MODEL_PATH)
  const model = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { animationSpeed, showLabels, showDimensions, setHoveredStation } =
    useLineParameters()

  useEffect(() => {
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    const drum = model.getObjectByName('drum_body')
    drumRef.current = drum ?? null
  }, [model])

  useFrame((_, delta) => {
    if (drumRef.current) {
      drumRef.current.rotation.x += delta * 0.22 * animationSpeed
    }
  })

  return (
    <group
      ref={groupRef}
      position={station.center}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHoveredStation(station.key)
      }}
      onPointerOut={() => setHoveredStation(null)}
    >
      <primitive object={model} />

      <StationLabel text={station.name} position={[0, 3.6, 0]} visible={showLabels} />
      <DimensionTag
        text="Ø4' x L6'"
        position={[0, 2.95, 0]}
        visible={showDimensions}
      />
    </group>
  )
}

useGLTF.preload(MODEL_PATH)
