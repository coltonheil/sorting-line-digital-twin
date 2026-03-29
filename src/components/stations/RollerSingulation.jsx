import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { STATION_DIMENSIONS } from '../../constants'
import { brushedSteelMaterial } from '../../materials'
import useLineParameters from '../../hooks/useLineParameters'
import StationLabel from '../ui/StationLabel'
import DimensionTag from '../ui/DimensionTag'

export default function RollerSingulation() {
  const station = STATION_DIMENSIONS.rollerSingulation
  const rollerRefs = useRef([])
  const { rollerGapStart, rollerGapEnd, laneCount, animationSpeed, showLabels, showDimensions, setHoveredStation } =
    useLineParameters()

  useFrame((_, delta) => {
    rollerRefs.current.forEach((roller) => {
      if (!roller) return
      roller.rotation.x += delta * 2.4 * animationSpeed
    })
  })

  const rollers = useMemo(() => Array.from({ length: 7 }, (_, index) => index), [])
  const laneOffsets = useMemo(
    () =>
      Array.from({ length: laneCount }, (_, index) => {
        if (laneCount === 1) return 0
        if (laneCount === 2) return index === 0 ? -0.35 : 0.35
        return -0.5 + index * 0.5
      }),
    [laneCount],
  )

  return (
    <group
      position={station.center}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHoveredStation(station.key)
      }}
      onPointerOut={() => setHoveredStation(null)}
    >
      {rollers.map((roller, index) => {
        const t = index / Math.max(rollers.length - 1, 1)
        const gap = (rollerGapStart + (rollerGapEnd - rollerGapStart) * t) / 12
        const z = -0.6 + index * 0.2 + gap * index * 0.18
        return (
          <mesh
            key={roller}
            ref={(node) => {
              rollerRefs.current[index] = node
            }}
            position={[0, 0, z]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
            receiveShadow
          >
            <cylinderGeometry args={[0.11, 0.11, 4, 20]} />
            <meshStandardMaterial {...brushedSteelMaterial} />
          </mesh>
        )
      })}

      <mesh position={[0, -0.36, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.4, 0.12, 2.2]} />
        <meshStandardMaterial color="#73808b" metalness={0.62} roughness={0.44} />
      </mesh>

      {laneOffsets.map((offset) => (
        <mesh key={offset} position={[2.1, 0.36, offset]} rotation={[0, 0, Math.PI / 4]} castShadow>
          <boxGeometry args={[0.95, 0.05, 0.05]} />
          <meshStandardMaterial color="#dae3ea" metalness={0.9} roughness={0.22} />
        </mesh>
      ))}

      <StationLabel text={station.name} position={[0, 1.8, 0]} visible={showLabels} />
      <DimensionTag
        text={`Gap ${rollerGapStart.toFixed(2)}" → ${rollerGapEnd.toFixed(2)}" • ${laneCount} lane${laneCount > 1 ? "s" : ""}`}
        position={[0, 1.2, 0]}
        visible={showDimensions}
      />
    </group>
  )
}
