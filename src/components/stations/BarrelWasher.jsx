import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Cylinder, RoundedBox } from '@react-three/drei'
import { STATION_DIMENSIONS } from '../../constants'
import {
  brushedSteelMaterial,
  greenMachineMaterial,
  rubberMaterial,
} from '../../materials'
import useLineParameters from '../../hooks/useLineParameters'
import StationLabel from '../ui/StationLabel'
import DimensionTag from '../ui/DimensionTag'

export default function BarrelWasher() {
  const drumRef = useRef()
  const station = STATION_DIMENSIONS.barrelWasher
  const { animationSpeed, showLabels, showDimensions, setHoveredStation } =
    useLineParameters()

  useFrame((_, delta) => {
    if (drumRef.current) drumRef.current.rotation.z += delta * 0.22 * animationSpeed
  })

  const frameLegs = useMemo(
    () => [
      [-1.9, -1.2, -1.1],
      [-1.9, -1.2, 1.1],
      [1.9, -1.2, -1.1],
      [1.9, -1.2, 1.1],
    ],
    [],
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
      <group ref={drumRef} rotation={[0, 0, Math.PI / 2]}>
        <Cylinder args={[2, 2, 6, 32]} castShadow receiveShadow>
          <meshStandardMaterial {...greenMachineMaterial} />
        </Cylinder>
        <mesh position={[0, 0, 0]}>
          <torusGeometry args={[2.06, 0.08, 12, 48]} />
          <meshStandardMaterial {...rubberMaterial} />
        </mesh>
      </group>

      {frameLegs.map((leg) => (
        <mesh key={leg.join('-')} position={leg} castShadow receiveShadow>
          <boxGeometry args={[0.18, 2.4, 0.18]} />
          <meshStandardMaterial {...brushedSteelMaterial} />
        </mesh>
      ))}

      <RoundedBox args={[6.4, 0.18, 2.6]} radius={0.05} position={[0, -2.45, 0]}>
        <meshStandardMaterial {...brushedSteelMaterial} />
      </RoundedBox>

      <mesh position={[3.5, -1.1, 0]} rotation={[0, 0, -0.52]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.28, 1.2]} />
        <meshStandardMaterial color="#94a66b" metalness={0.2} roughness={0.55} />
      </mesh>

      <mesh position={[4.35, -1.8, 0]} rotation={[0, 0, -0.52]} castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.08, 1.2, 12]} />
        <meshStandardMaterial {...brushedSteelMaterial} />
      </mesh>

      <StationLabel text={station.name} position={[0, 3.6, 0]} visible={showLabels} />
      <DimensionTag
        text="Ø4' x L6'"
        position={[0, 2.95, 0]}
        visible={showDimensions}
      />
    </group>
  )
}
