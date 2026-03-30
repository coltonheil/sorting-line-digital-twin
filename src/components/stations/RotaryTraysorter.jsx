import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'
import { GRADE_LABELS, STATION_DIMENSIONS } from '../../constants'
import useLineParameters from '../../hooks/useLineParameters'
import RootVisual from '../animation/RootVisual'
import StationLabel from '../ui/StationLabel'
import DimensionTag from '../ui/DimensionTag'

const MODEL_PATH = './models/rotary-tray-sorter.glb'
const TRAY_ROOTS = [
  { angle: 0.2, radius: 1.35, y: -0.28, rotation: [0.25, 0.3, 0.8], variantIndex: 0 },
  { angle: 1.55, radius: 1.38, y: -0.24, rotation: [-0.15, -0.25, 1.1], variantIndex: 1 },
  { angle: 3.05, radius: 1.32, y: -0.3, rotation: [0.42, 0.1, 0.65], variantIndex: 2 },
  { angle: 4.5, radius: 1.36, y: -0.26, rotation: [-0.3, 0.18, 0.95], variantIndex: 3 },
]

export default function RotaryTraysorter() {
  const station = STATION_DIMENSIONS.rotaryTraySorter
  const { scene } = useGLTF(MODEL_PATH)
  const model = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const carouselRef = useRef()
  const trayRefs = useRef([])
  const interactionRootGroupRef = useRef()
  const { carouselSpeed, animationSpeed, showLabels, showDimensions, setHoveredStation } =
    useLineParameters()

  useEffect(() => {
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    carouselRef.current =
      model.getObjectByName('turntable_mesh') ||
      model.getObjectByName('carousel_disc') ||
      null
    trayRefs.current = Array.from({ length: station.trayCount }, (_, index) =>
      model.getObjectByName(`tray_pivot_${String(index + 1).padStart(2, '0')}`),
    ).filter(Boolean)
  }, [model, station.trayCount])

  useFrame((state, delta) => {
    const spinDelta = delta * (carouselSpeed / 60) * Math.PI * 2 * 0.3 * animationSpeed

    if (carouselRef.current) {
      carouselRef.current.rotation.y -= spinDelta
    }
    if (interactionRootGroupRef.current) {
      interactionRootGroupRef.current.rotation.y -= spinDelta
    }

    trayRefs.current.forEach((tray, index) => {
      const phase =
        ((state.clock.elapsedTime * animationSpeed * carouselSpeed * 0.12) +
          index / station.trayCount) %
        1
      const nearDrop =
        Math.abs(phase - 0.15) < 0.045 || Math.abs(phase - 0.65) < 0.045
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
      <primitive object={model} />

      <group ref={interactionRootGroupRef}>
        {TRAY_ROOTS.map((root, index) => (
          <group
            key={`tray-root-${index}`}
            position={[Math.cos(root.angle) * root.radius, root.y, Math.sin(root.angle) * root.radius]}
            rotation={root.rotation}
          >
            <RootVisual variantIndex={root.variantIndex} scale={10.8} haloScale={2.6} />
          </group>
        ))}
      </group>

      {GRADE_LABELS.map((label, index) => {
        const angle = Math.PI * 0.8 + (index / (GRADE_LABELS.length - 1)) * Math.PI * 1.4
        const x = Math.cos(angle) * 3.05
        const z = Math.sin(angle) * 3.05
        return (
          <Text
            key={label}
            position={[x, -0.65, z]}
            fontSize={0.16}
            color="#cfeeff"
            anchorX="center"
            anchorY="middle"
            rotation={[-Math.PI / 2, 0, 0]}
            maxWidth={1.8}
          >
            {label}
          </Text>
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

useGLTF.preload(MODEL_PATH)
