import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { GRADE_LABELS, STATION_DIMENSIONS } from '../../constants'
import { brushedSteelMaterial, rubberMaterial } from '../../materials'
import useLineParameters from '../../hooks/useLineParameters'
import StationLabel from '../ui/StationLabel'
import DimensionTag from '../ui/DimensionTag'

export default function RotaryTraysorter() {
  const station = STATION_DIMENSIONS.rotaryTraySorter
  const trayRefs = useRef([])
  const carouselRef = useRef()
  const { carouselSpeed, animationSpeed, showLabels, showDimensions, setHoveredStation } =
    useLineParameters()
  const trays = useMemo(() => Array.from({ length: station.trayCount }, (_, index) => index), [station.trayCount])
  const outlets = useMemo(() => Array.from({ length: station.outletCount }, (_, index) => index), [station.outletCount])

  useFrame((state, delta) => {
    if (carouselRef.current) {
      carouselRef.current.rotation.y -= delta * (carouselSpeed / 60) * Math.PI * 2 * 0.3 * animationSpeed
    }

    trayRefs.current.forEach((tray, index) => {
      if (!tray) return
      const phase = ((state.clock.elapsedTime * animationSpeed * carouselSpeed * 0.12) + index / trays.length) % 1
      const nearDrop = Math.abs(phase - 0.15) < 0.045 || Math.abs(phase - 0.65) < 0.045
      tray.rotation.z = nearDrop ? -0.55 : -0.08
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
      <mesh receiveShadow castShadow>
        <cylinderGeometry args={[2.3, 2.4, 0.5, 64]} />
        <meshStandardMaterial color="#d9dee3" metalness={0.94} roughness={0.23} />
      </mesh>

      <group ref={carouselRef} position={[0, 0.48, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[1.95, 1.95, 0.2, 64]} />
          <meshStandardMaterial {...brushedSteelMaterial} />
        </mesh>
        {trays.map((tray, index) => {
          const angle = (index / trays.length) * Math.PI * 2
          const x = Math.cos(angle) * 1.86
          const z = Math.sin(angle) * 1.86
          return (
            <group key={tray} position={[x, 0.06, z]} rotation={[0, -angle, 0]}>
              <mesh
                ref={(node) => {
                  trayRefs.current[index] = node
                }}
                position={[0, 0, 0.32]}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[0.3, 0.08, 0.5]} />
                <meshStandardMaterial color="#cfd5dc" metalness={0.88} roughness={0.24} />
              </mesh>
            </group>
          )
        })}
      </group>

      {outlets.map((outlet, index) => {
        const angle = Math.PI * 0.8 + (index / (outlets.length - 1)) * Math.PI * 1.4
        const x = Math.cos(angle) * 3.05
        const z = Math.sin(angle) * 3.05
        return (
          <group key={outlet} position={[x, -0.2, z]} rotation={[0, -angle, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.72, 0.16, 0.45]} />
              <meshStandardMaterial {...rubberMaterial} />
            </mesh>
            <Text
              position={[0, -0.45, 0]}
              fontSize={0.16}
              color="#cfeeff"
              anchorX="center"
              anchorY="middle"
              rotation={[-Math.PI / 2, 0, 0]}
              maxWidth={1.8}
            >
              {GRADE_LABELS[index]}
            </Text>
          </group>
        )
      })}

      <StationLabel text={station.name} position={[0, 3.15, 0]} visible={showLabels} />
      <DimensionTag
        text={`${station.trayCount} trays • 8 drop chutes • ${carouselSpeed.toFixed(0)} RPM`}
        position={[0, 2.5, 0]}
        visible={showDimensions}
      />
    </group>
  )
}
