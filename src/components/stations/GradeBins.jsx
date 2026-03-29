import { Text } from '@react-three/drei'
import { GRADE_LABELS, STATION_DIMENSIONS } from '../../constants'
import { steelMaterial } from '../../materials'
import useLineParameters from '../../hooks/useLineParameters'
import StationLabel from '../ui/StationLabel'

export default function GradeBins() {
  const station = STATION_DIMENSIONS.gradeBins
  const { fillLevels, setHoveredStation } = useLineParameters()

  return (
    <group
      position={station.center}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHoveredStation(station.key)
      }}
      onPointerOut={() => setHoveredStation(null)}
    >
      {GRADE_LABELS.map((label, index) => {
        const angle = Math.PI * 0.82 + (index / (GRADE_LABELS.length - 1)) * Math.PI * 1.36
        const x = Math.cos(angle) * station.radius
        const z = Math.sin(angle) * station.radius
        const fill = fillLevels[index] ?? 0.2
        return (
          <group key={label} position={[x, 0, z]} rotation={[0, -angle + Math.PI, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.05, 1.15, 1.05]} />
              <meshStandardMaterial {...steelMaterial} />
            </mesh>
            <mesh position={[0, -0.2 + fill * 0.42, 0]}>
              <boxGeometry args={[0.85, Math.max(0.05, fill * 0.84), 0.85]} />
              <meshStandardMaterial color="#ad8b5c" roughness={0.95} metalness={0.02} />
            </mesh>
            <Text
              position={[0, 1.05, 0]}
              fontSize={0.16}
              anchorX="center"
              anchorY="middle"
              color="#f8fbff"
              outlineColor="#0e151c"
              outlineWidth={0.008}
              maxWidth={1.6}
            >
              {label}
            </Text>
          </group>
        )
      })}
      <StationLabel text={station.name} position={[0, 2.2, 0]} visible />
    </group>
  )
}
