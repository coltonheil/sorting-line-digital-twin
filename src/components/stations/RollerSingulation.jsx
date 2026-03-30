import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'
import { STATION_DIMENSIONS } from '../../constants'
import useLineParameters from '../../hooks/useLineParameters'
import StationLabel from '../ui/StationLabel'
import DimensionTag from '../ui/DimensionTag'

const MODEL_PATH = '/models/roller-singulation.glb'
const ENTRY_COLOR = new THREE.Color('#2E8E6F')
const EXIT_COLOR = new THREE.Color('#E05A3A')

export default function RollerSingulation() {
  const station = STATION_DIMENSIONS.rollerSingulation
  const { scene } = useGLTF(MODEL_PATH)
  const model = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const rollerRefs = useRef([])
  const {
    rollerGapStart,
    rollerGapEnd,
    laneCount,
    beltSpeed,
    animationSpeed,
    showLabels,
    showDimensions,
    setHoveredStation,
  } = useLineParameters()

  useEffect(() => {
    const grooveGeometry = new THREE.TorusGeometry(0.032, 0.004, 10, 40)
    const grooveMaterial = new THREE.MeshStandardMaterial({ color: '#1B1E22', metalness: 0.22, roughness: 0.86 })
    const nextRollers = []

    model.traverse((child) => {
      if (!child.isMesh) return
      child.castShadow = true
      child.receiveShadow = true

      const name = child.name.toLowerCase()
      const materialName = child.material?.name?.toLowerCase() ?? ''

      if (name.startsWith('roller_')) {
        const rollerIndex = Number(name.split('_')[1])
        const color = ENTRY_COLOR.clone().lerp(EXIT_COLOR, rollerIndex / 13)
        child.material = new THREE.MeshStandardMaterial({
          color,
          emissive: color.clone().multiplyScalar(0.08),
          metalness: 0.8,
          roughness: 0.2,
        })
        nextRollers.push(child)
        return
      }

      if (materialName.includes('frame') || materialName.includes('channel') || name.includes('top_') || name.includes('base_') || name.includes('leg_') || name.includes('cross') || name.includes('lip')) {
        child.material = new THREE.MeshStandardMaterial({
          color: '#B8BDC3',
          metalness: 0.72,
          roughness: 0.34,
        })
        return
      }

      if (materialName.includes('bearing') || materialName.includes('chain') || name.includes('bearing') || name.includes('sprocket') || name.includes('chain_span')) {
        child.material = new THREE.MeshStandardMaterial({
          color: '#6F7680',
          metalness: 0.78,
          roughness: 0.36,
        })
      }
    })

    nextRollers.forEach((roller) => {
      if (roller.children.some((child) => child.name?.includes('_groove_'))) return
      ;[-0.22, 0.22].forEach((offset, grooveIndex) => {
        const groove = new THREE.Mesh(grooveGeometry, grooveMaterial)
        groove.name = `${roller.name}_groove_${grooveIndex}`
        groove.rotation.x = Math.PI / 2
        groove.position.set(0, 0, offset)
        roller.add(groove)
      })
    })

    rollerRefs.current = nextRollers
  }, [model])

  useFrame((_, delta) => {
    rollerRefs.current.forEach((roller) => {
      roller.rotation.z += delta * (beltSpeed / 60) * 4.4 * animationSpeed
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
      <StationLabel text={station.name} position={[0, 1.8, 0]} visible={showLabels} />
      <DimensionTag
        text={`14 diverging rollers • gap ${rollerGapStart.toFixed(2)}" → ${rollerGapEnd.toFixed(2)}" • ${laneCount} lane${laneCount > 1 ? 's' : ''}`}
        position={[0, 1.2, 0]}
        visible={showDimensions}
      />
    </group>
  )
}

useGLTF.preload(MODEL_PATH)
