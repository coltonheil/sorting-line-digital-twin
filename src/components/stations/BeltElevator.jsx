import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { STATION_DIMENSIONS } from '../../constants'
import { brushedSteelMaterial, rubberMaterial } from '../../materials'
import useLineParameters from '../../hooks/useLineParameters'
import StationLabel from '../ui/StationLabel'
import DimensionTag from '../ui/DimensionTag'

export default function BeltElevator() {
  const station = STATION_DIMENSIONS.beltElevator
  const cleatsRef = useRef([])
  const { beltSpeed, animationSpeed, showLabels, showDimensions, setHoveredStation } =
    useLineParameters()
  const incline = (station.inclineDeg * Math.PI) / 180

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * beltSpeed * 0.08 * animationSpeed
    cleatsRef.current.forEach((cleat, index) => {
      if (!cleat) return
      cleat.position.y = ((t + index * 0.68) % 7.4) - 3.7
    })
  })

  const cleats = useMemo(() => Array.from({ length: 10 }, (_, index) => index), [])

  return (
    <group
      position={station.center}
      rotation={[0, 0, incline]}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHoveredStation(station.key)
      }}
      onPointerOut={() => setHoveredStation(null)}
    >
      <RoundedBox args={[8, 0.18, 1.8]} radius={0.03} castShadow receiveShadow>
        <meshStandardMaterial {...rubberMaterial} />
      </RoundedBox>

      {cleats.map((_, index) => (
        <mesh
          key={index}
          ref={(node) => {
            cleatsRef.current[index] = node
          }}
          position={[0, index * 0.68 - 3.2, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.16, 0.1, 1.84]} />
          <meshStandardMaterial color="#3a4048" metalness={0.1} roughness={0.78} />
        </mesh>
      ))}

      {[-3.4, -0.8, 1.8, 3.8].map((x) => (
        <mesh key={x} position={[x, -1.05, x < 0 ? -0.95 : 0.95]} castShadow>
          <boxGeometry args={[0.16, 2, 0.16]} />
          <meshStandardMaterial {...brushedSteelMaterial} />
        </mesh>
      ))}

      <mesh position={[0, -0.15, 1.08]} castShadow receiveShadow>
        <boxGeometry args={[8.1, 0.08, 0.08]} />
        <meshStandardMaterial {...brushedSteelMaterial} />
      </mesh>
      <mesh position={[0, -0.15, -1.08]} castShadow receiveShadow>
        <boxGeometry args={[8.1, 0.08, 0.08]} />
        <meshStandardMaterial {...brushedSteelMaterial} />
      </mesh>

      <group rotation={[0, 0, -incline]}>
        <StationLabel text={station.name} position={[0.2, 3.1, 0]} visible={showLabels} />
        <DimensionTag
          text={'30° incline • 18" belt'}
          position={[0.2, 2.45, 0]}
          visible={showDimensions}
        />
      </group>
    </group>
  )
}
