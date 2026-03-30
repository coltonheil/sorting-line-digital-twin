import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useLineParameters from '../hooks/useLineParameters'
import { sampleBasePath } from './animation/rootPath'

const FLOW_COLOR = new THREE.Color('#4ECDC4')

export default function FlowPath() {
  const materialRef = useRef()
  const pulseRef = useRef()
  const laneCount = useLineParameters((state) => state.laneCount)

  const curve = useMemo(() => {
    const sampled = sampleBasePath(200, laneCount)
    return new THREE.CatmullRomCurve3(sampled, false, 'centripetal', 0.25)
  }, [laneCount])

  const tubeGeometry = useMemo(() => new THREE.TubeGeometry(curve, 220, 0.065, 12, false), [curve])

  useFrame((state) => {
    const pulse = 0.55 + 0.25 * Math.sin(state.clock.elapsedTime * 2.6)
    if (materialRef.current) {
      materialRef.current.opacity = 0.22 + pulse * 0.16
      materialRef.current.emissiveIntensity = 0.34 + pulse * 0.26
    }
    if (pulseRef.current) {
      pulseRef.current.position.copy(curve.getPointAt((state.clock.elapsedTime * 0.12) % 1))
      pulseRef.current.material.emissiveIntensity = 0.95 + pulse * 0.55
      pulseRef.current.scale.setScalar(0.85 + pulse * 0.2)
    }
  })

  return (
    <group>
      <mesh geometry={tubeGeometry}>
        <meshStandardMaterial
          ref={materialRef}
          color={FLOW_COLOR}
          emissive={FLOW_COLOR}
          emissiveIntensity={0.5}
          transparent
          opacity={0.34}
          roughness={0.22}
          metalness={0.18}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshStandardMaterial color={FLOW_COLOR} emissive={FLOW_COLOR} emissiveIntensity={1.1} transparent opacity={0.92} />
      </mesh>
    </group>
  )
}
