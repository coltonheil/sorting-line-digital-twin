import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, RoundedBox } from '@react-three/drei'
import { STATION_DIMENSIONS } from '../../constants'
import { brushedSteelMaterial, glowMaterial } from '../../materials'
import useLineParameters from '../../hooks/useLineParameters'
import StationLabel from '../ui/StationLabel'
import DimensionTag from '../ui/DimensionTag'

export default function CameraGantry() {
  const station = STATION_DIMENSIONS.cameraGantry
  const ringRef = useRef()
  const { cameraHeight, animationSpeed, showLabels, showDimensions, setHoveredStation } =
    useLineParameters()
  const cameraHeightFeet = cameraHeight / 12

  useFrame((state) => {
    if (!ringRef.current) return
    ringRef.current.material.emissiveIntensity = 2.2 + Math.sin(state.clock.elapsedTime * 2 * animationSpeed) * 0.25
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
      <RoundedBox args={[3.2, 0.12, 1.5]} radius={0.03} castShadow receiveShadow>
        <meshStandardMaterial color="#f2f2ef" metalness={0.28} roughness={0.7} />
      </RoundedBox>

      {[-1.3, 1.3].map((x) => (
        <mesh key={x} position={[x, cameraHeightFeet / 2, 0]} castShadow>
          <boxGeometry args={[0.12, cameraHeightFeet, 0.12]} />
          <meshStandardMaterial {...brushedSteelMaterial} />
        </mesh>
      ))}
      <mesh position={[0, cameraHeightFeet, 0]} castShadow>
        <boxGeometry args={[2.8, 0.12, 0.12]} />
        <meshStandardMaterial {...brushedSteelMaterial} />
      </mesh>

      <mesh position={[0, cameraHeightFeet - 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.33, 0.42, 0.25]} />
        <meshStandardMaterial color="#242931" metalness={0.4} roughness={0.44} />
      </mesh>

      <mesh ref={ringRef} position={[0, cameraHeightFeet - 0.27, 0.16]}>
        <torusGeometry args={[0.22, 0.05, 16, 48]} />
        <meshStandardMaterial {...glowMaterial} />
      </mesh>

      <mesh position={[-0.84, 0.18, 0.76]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 0.18, 18]} />
        <meshStandardMaterial color="#c1c8cf" metalness={0.8} roughness={0.24} />
      </mesh>

      <Html position={[0.5, 0.35, -0.9]} transform sprite distanceFactor={10}>
        <div className="scan-indicator">AI Vision</div>
      </Html>

      <StationLabel text={station.name} position={[0, cameraHeightFeet + 1.05, 0]} visible={showLabels} />
      <DimensionTag
        text={`Camera height ${cameraHeight.toFixed(0)}"`}
        position={[0, cameraHeightFeet + 0.45, 0]}
        visible={showDimensions}
      />
    </group>
  )
}
