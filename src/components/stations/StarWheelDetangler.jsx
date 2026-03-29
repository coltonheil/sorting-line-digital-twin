import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Shape } from 'three'
import { STATION_DIMENSIONS } from '../../constants'
import { brushedSteelMaterial, rubberMaterial } from '../../materials'
import useLineParameters from '../../hooks/useLineParameters'
import StationLabel from '../ui/StationLabel'
import DimensionTag from '../ui/DimensionTag'

function StarWheel({ index, refs }) {
  const points = useMemo(() => {
    const starPoints = []
    for (let i = 0; i < 16; i += 1) {
      const angle = (i / 16) * Math.PI * 2
      const radius = i % 2 === 0 ? 0.48 : 0.2
      starPoints.push([Math.cos(angle) * radius, Math.sin(angle) * radius])
    }
    return starPoints
  }, [])

  const shape = useMemo(() => {
    const nextShape = new Shape()
    points.forEach(([x, y], pointIndex) => {
      if (pointIndex === 0) nextShape.moveTo(x, y)
      else nextShape.lineTo(x, y)
    })
    nextShape.closePath()
    return nextShape
  }, [points])

  return (
    <group ref={(node) => (refs.current[index] = node)}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.1, 0.1, 2.2, 18]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial {...brushedSteelMaterial} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <extrudeGeometry args={[shape, { depth: 0.18, bevelEnabled: false }]} />
        <meshStandardMaterial {...rubberMaterial} />
      </mesh>
    </group>
  )
}

export default function StarWheelDetangler() {
  const station = STATION_DIMENSIONS.starWheelDetangler
  const wheelRefs = useRef([])
  const { starWheelSpeed, animationSpeed, showLabels, showDimensions, setHoveredStation } =
    useLineParameters()

  useFrame((_, delta) => {
    wheelRefs.current.forEach((wheel, index) => {
      if (!wheel) return
      const direction = index % 2 === 0 ? 1 : -1
      wheel.rotation.x += delta * direction * (starWheelSpeed / 60) * Math.PI * animationSpeed
    })
  })

  const wheelPositions = useMemo(
    () =>
      Array.from({ length: 8 }, (_, index) => [
        -1.4 + index * 0.4,
        0,
        index % 2 === 0 ? -0.35 : 0.35,
      ]),
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
      <mesh position={[0, -0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 0.16, 2.2]} />
        <meshStandardMaterial {...brushedSteelMaterial} />
      </mesh>
      {wheelPositions.map((position, index) => (
        <group key={index} position={position}>
          <StarWheel index={index} refs={wheelRefs} />
        </group>
      ))}
      {[-1.6, 1.6].map((x) =>
        [-0.85, 0.85].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, -1.9, z]} castShadow>
            <boxGeometry args={[0.12, 2, 0.12]} />
            <meshStandardMaterial {...brushedSteelMaterial} />
          </mesh>
        )),
      )}
      <StationLabel text={station.name} position={[0, 2.3, 0]} visible={showLabels} />
      <DimensionTag
        text={'8 rubber stars • 24" width'}
        position={[0, 1.7, 0]}
        visible={showDimensions}
      />
    </group>
  )
}
