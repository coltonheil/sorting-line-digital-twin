import { useEffect, useMemo, useState } from 'react'
import { Text, useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { GRADE_LABELS, STATION_DIMENSIONS } from '../../constants'
import useLineParameters from '../../hooks/useLineParameters'
import StationLabel from '../ui/StationLabel'

const MODEL_PATH = '/models/grade-bins.glb'

export default function GradeBins() {
  const station = STATION_DIMENSIONS.gradeBins
  const { scene } = useGLTF(MODEL_PATH)
  const model = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { fillLevels, setHoveredStation } = useLineParameters()
  const [binObjects, setBinObjects] = useState([])

  useEffect(() => {
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    setBinObjects(Array.from({ length: 8 }, (_, index) => model.getObjectByName(`grade_bin_${index}`)).filter(Boolean))
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

      {binObjects.map((bin, index) => {
        const fill = fillLevels[index] ?? 0.2
        return (
          <group
            key={bin.name}
            position={[bin.position.x, bin.position.y, bin.position.z]}
            rotation={[bin.rotation.x, bin.rotation.y, bin.rotation.z]}
          >
            <mesh position={[0, -0.02 + fill * 0.12, 0]}>
              <boxGeometry args={[0.34, Math.max(0.04, fill * 0.24), 0.5]} />
              <meshStandardMaterial color="#ad8b5c" roughness={0.95} metalness={0.02} />
            </mesh>
            <Text
              position={[0, 0.42, 0]}
              fontSize={0.08}
              anchorX="center"
              anchorY="middle"
              color="#f8fbff"
              outlineColor="#0e151c"
              outlineWidth={0.004}
              maxWidth={0.7}
            >
              {GRADE_LABELS[index]}
            </Text>
          </group>
        )
      })}

      <StationLabel text={station.name} position={[0, 2.2, 0]} visible />
    </group>
  )
}

useGLTF.preload(MODEL_PATH)
