import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { STATION_DIMENSIONS } from '../../constants'
import useLineParameters from '../../hooks/useLineParameters'
import StationLabel from '../ui/StationLabel'
import DimensionTag from '../ui/DimensionTag'

const MODEL_PATH = '/models/roller-singulation.glb'

export default function RollerSingulation() {
  const station = STATION_DIMENSIONS.rollerSingulation
  const { scene } = useGLTF(MODEL_PATH)
  const model = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const rollerRefs = useRef([])
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
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    rollerRefs.current = Array.from({ length: 14 }, (_, index) => model.getObjectByName(`roller_${index}`)).filter(Boolean)
  }, [model])

  useFrame((_, delta) => {
    rollerRefs.current.forEach((roller) => {
      roller.rotation.z += delta * (beltSpeed / 60) * 3.2 * animationSpeed
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
