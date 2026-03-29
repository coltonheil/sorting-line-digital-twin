import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Capsule } from '@react-three/drei'
import { rootMaterial } from '../../materials'
import useLineParameters from '../../hooks/useLineParameters'

const ROOT_COUNT = 26

function pointOnPath(t, laneCount, cameraHeight) {
  if (t < 0.16) return [-20 + t * 28, 0.85 + Math.sin(t * 18) * 0.18, (Math.sin(t * 30) * 0.3)]
  if (t < 0.33) {
    const lt = (t - 0.16) / 0.17
    return [-15.5 + lt * 4.8, 0.65 + lt * 2.55, 0.2 * Math.sin(lt * 8)]
  }
  if (t < 0.47) {
    const lt = (t - 0.33) / 0.14
    return [-6 + lt * 3.2, 2.95 + Math.sin(lt * 12) * 0.15, (lt - 0.5) * 0.9]
  }
  if (t < 0.63) {
    const lt = (t - 0.47) / 0.16
    const laneSpread = laneCount === 1 ? 0 : laneCount === 2 ? 0.25 : 0.45
    return [-2.1 + lt * 7.7, 3.02, Math.sin(lt * 10) * laneSpread]
  }
  if (t < 0.76) {
    const lt = (t - 0.63) / 0.13
    return [5.6 + lt * 5.3, 3.02, Math.cos(lt * 7) * 0.16]
  }
  if (t < 0.88) {
    const lt = (t - 0.76) / 0.12
    const angle = -Math.PI / 6 + lt * Math.PI * 0.9
    return [14.9 + Math.cos(angle) * 1.4, 2.65 - lt * 0.95, Math.sin(angle) * 1.4]
  }
  const lt = (t - 0.88) / 0.12
  return [16.4 + lt * 2.5, 1.1 - lt * 0.5, -0.4 + lt * 2.1]
}

export default function RootParticles() {
  const groupRef = useRef()
  const roots = useMemo(() => Array.from({ length: ROOT_COUNT }, (_, index) => index), [])
  const { beltSpeed, animationSpeed, laneCount, cameraHeight } = useLineParameters()

  useFrame((state) => {
    if (!groupRef.current) return
    const children = groupRef.current.children
    children.forEach((child, index) => {
      const speed = beltSpeed / 60 / 8
      const t = (state.clock.elapsedTime * speed * animationSpeed + index / ROOT_COUNT) % 1
      const [x, y, z] = pointOnPath(t, laneCount, cameraHeight)
      child.position.set(x, y, z)
      child.rotation.set(0.5 + Math.sin(t * 18 + index) * 0.2, t > 0.76 ? t * Math.PI * 2 : 0, 1.2 + Math.cos(t * 22 + index) * 0.18)
      const scanning = t > 0.6 && t < 0.66
      child.scale.setScalar(scanning ? 1.18 : 1)
      child.children[0].material.emissive.set(scanning ? '#ffe3a1' : '#000000')
      child.children[0].material.emissiveIntensity = scanning ? 0.7 : 0
    })
  })

  return (
    <group ref={groupRef}>
      {roots.map((root) => (
        <group key={root}>
          <Capsule args={[0.2, 0.42, 6, 10]} castShadow receiveShadow>
            <meshStandardMaterial {...rootMaterial} />
          </Capsule>
        </group>
      ))}
    </group>
  )
}
