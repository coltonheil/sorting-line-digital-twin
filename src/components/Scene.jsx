import { Suspense, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  AdaptiveDpr,
  AdaptiveEvents,
  ContactShadows,
  Environment,
  Float,
  Grid,
  OrbitControls,
  PerspectiveCamera,
  Text,
} from '@react-three/drei'
import { EffectComposer, Bloom, SSAO } from '@react-three/postprocessing'
import * as THREE from 'three'
import BarrelWasher from './stations/BarrelWasher'
import BeltElevator from './stations/BeltElevator'
import StarWheelDetangler from './stations/StarWheelDetangler'
import RollerSingulation from './stations/RollerSingulation'
import CameraGantry from './stations/CameraGantry'
import InfeedConveyor from './stations/InfeedConveyor'
import RotaryTraysorter from './stations/RotaryTraysorter'
import GradeBins from './stations/GradeBins'
import RootParticles from './animation/RootParticles'
import useLineParameters from '../hooks/useLineParameters'

function CameraRig() {
  const controlsRef = useRef()
  const { camera } = useThree()
  const cameraTarget = useLineParameters((state) => state.cameraTarget)
  const isAnimating = useRef(false)
  const animProgress = useRef(0)

  // Only animate when a NEW preset is selected, then stop so user can freely orbit
  useEffect(() => {
    isAnimating.current = true
    animProgress.current = 0
  }, [cameraTarget])

  useFrame((_, delta) => {
    if (!isAnimating.current) return
    animProgress.current += delta * 2.5
    const t = Math.min(animProgress.current, 1)
    const ease = 1 - Math.pow(1 - t, 3) // ease-out cubic
    camera.position.lerp(new THREE.Vector3(...cameraTarget.position), ease * 0.15)
    if (controlsRef.current) {
      controlsRef.current.target.lerp(new THREE.Vector3(...cameraTarget.target), ease * 0.15)
      controlsRef.current.update()
    }
    if (t >= 1) {
      isAnimating.current = false
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.12}
      minDistance={2}
      maxDistance={80}
      maxPolarAngle={Math.PI / 2.05}
      enablePan
      panSpeed={1.2}
      rotateSpeed={0.8}
      zoomSpeed={1.2}
      onStart={() => { isAnimating.current = false }}
    />
  )
}

function FloorAnnotations() {
  const showDimensions = useLineParameters((state) => state.showDimensions)
  if (!showDimensions) return null

  return (
    <group>
      {[-15, -10, -5, 0, 5, 10, 15, 20].map((x) => (
        <Text
          key={x}
          position={[x, 0.02, -5.8]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.2}
          color="#7fb7d3"
          anchorX="center"
          anchorY="middle"
        >
          {`${x + 20} ft`}
        </Text>
      ))}
    </group>
  )
}

function SceneContents() {
  return (
    <>
      <color attach="background" args={['#0f141a']} />
      <fog attach="fog" args={['#0f141a', 18, 40]} />
      <Environment files="./hdri/warehouse.hdr" background={false} intensity={1.15} />
      <directionalLight
        position={[9, 14, 6]}
        intensity={0.7}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 40]} />
        <meshStandardMaterial color="#697078" roughness={0.98} metalness={0} />
      </mesh>

      <Grid
        position={[0, 0.01, 0]}
        args={[70, 30]}
        sectionColor="#6ab1d4"
        cellColor="#30414d"
        sectionSize={5}
        cellSize={1}
        infiniteGrid
        fadeDistance={42}
        fadeStrength={1.6}
      />

      <group position={[0, 0.02, 0]}>
        <BarrelWasher />
        <BeltElevator />
        <StarWheelDetangler />
        <RollerSingulation />
        <CameraGantry />
        <InfeedConveyor />
        <RotaryTraysorter />
        <GradeBins />
      </group>

      <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.25}>
        <RootParticles />
      </Float>

      <FloorAnnotations />

      <ContactShadows position={[0, 0.02, 0]} scale={40} blur={1.8} opacity={0.45} far={14} />

      <EffectComposer multisampling={4}>
        <SSAO samples={10} radius={0.12} intensity={12} luminanceInfluence={0.3} color="black" />
        <Bloom mipmapBlur intensity={0.45} luminanceThreshold={0.55} />
      </EffectComposer>
    </>
  )
}

export default function Scene() {
  return (
    <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
      <PerspectiveCamera makeDefault position={[20, 11, 16]} fov={42} />
      <Suspense fallback={null}>
        <SceneContents />
      </Suspense>
      <CameraRig />
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
    </Canvas>
  )
}
