import { useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { STATION_DIMENSIONS } from '../../constants'
import useLineParameters from '../../hooks/useLineParameters'
import StationLabel from '../ui/StationLabel'
import DimensionTag from '../ui/DimensionTag'

const MODEL_PATH = '/models/infeed-conveyor.glb'

export default function InfeedConveyor() {
  const station = STATION_DIMENSIONS.infeedConveyor
  const { scene } = useGLTF(MODEL_PATH)
  const model = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { showLabels, showDimensions, setHoveredStation } = useLineParameters()

  useEffect(() => {
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [model])

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
      <StationLabel text={station.name} position={[0, 1.5, 0]} visible={showLabels} />
      <DimensionTag text="Transfer bridge" position={[0, 0.95, 0]} visible={showDimensions} />
    </group>
  )
}

useGLTF.preload(MODEL_PATH)
