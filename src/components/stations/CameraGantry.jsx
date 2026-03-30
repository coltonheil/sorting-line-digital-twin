import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { STATION_DIMENSIONS } from '../../constants'
import useLineParameters from '../../hooks/useLineParameters'
import StationLabel from '../ui/StationLabel'
import DimensionTag from '../ui/DimensionTag'

const MODEL_PATH = '/models/camera-gantry.glb'

export default function CameraGantry() {
  const station = STATION_DIMENSIONS.cameraGantry
  const { scene } = useGLTF(MODEL_PATH)
  const model = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const ringRef = useRef(null)
  const { cameraHeight, animationSpeed, showLabels, showDimensions, setHoveredStation } =
    useLineParameters()
  const cameraHeightFeet = cameraHeight / 12

  useEffect(() => {
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    ringRef.current = model.getObjectByName('ring_light')
  }, [model])

  useFrame((state) => {
    const ring = ringRef.current
    if (!ring?.material) return
    ring.material.emissiveIntensity = 2.2 + Math.sin(state.clock.elapsedTime * 2 * animationSpeed) * 0.25
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
      <StationLabel text={station.name} position={[0, cameraHeightFeet + 1.05, 0]} visible={showLabels} />
      <DimensionTag
        text={`Camera height ${cameraHeight.toFixed(0)}"`}
        position={[0, cameraHeightFeet + 0.45, 0]}
        visible={showDimensions}
      />
    </group>
  )
}

useGLTF.preload(MODEL_PATH)
