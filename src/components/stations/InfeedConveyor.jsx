import { STATION_DIMENSIONS } from '../../constants'
import { brushedSteelMaterial, rubberMaterial } from '../../materials'
import useLineParameters from '../../hooks/useLineParameters'
import StationLabel from '../ui/StationLabel'
import DimensionTag from '../ui/DimensionTag'

export default function InfeedConveyor() {
  const station = STATION_DIMENSIONS.infeedConveyor
  const { showLabels, showDimensions, setHoveredStation } = useLineParameters()

  return (
    <group
      position={station.center}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHoveredStation(station.key)
      }}
      onPointerOut={() => setHoveredStation(null)}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.7, 0.14, 1.25]} />
        <meshStandardMaterial {...rubberMaterial} />
      </mesh>
      <mesh position={[1.15, -0.1, 0]} rotation={[0, 0, -0.18]} castShadow>
        <boxGeometry args={[0.9, 0.16, 1.1]} />
        <meshStandardMaterial color="#dde4e6" metalness={0.7} roughness={0.28} />
      </mesh>
      {[-1.1, 1.1].map((x) =>
        [-0.55, 0.55].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, -0.7, z]} castShadow>
            <boxGeometry args={[0.1, 1.4, 0.1]} />
            <meshStandardMaterial {...brushedSteelMaterial} />
          </mesh>
        )),
      )}
      <StationLabel text={station.name} position={[0, 1.5, 0]} visible={showLabels} />
      <DimensionTag text="Transfer bridge" position={[0, 0.95, 0]} visible={showDimensions} />
    </group>
  )
}
