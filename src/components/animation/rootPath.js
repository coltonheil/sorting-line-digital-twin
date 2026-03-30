import * as THREE from 'three'
import { STATION_DIMENSIONS } from '../../constants'

export function smoothstep(min, max, value) {
  const t = THREE.MathUtils.clamp((value - min) / (max - min), 0, 1)
  return t * t * (3 - 2 * t)
}

export const ROOT_FLOW_STATIONS = {
  barrelWasher: STATION_DIMENSIONS.barrelWasher.center,
  beltElevator: STATION_DIMENSIONS.beltElevator.center,
  starWheelDetangler: STATION_DIMENSIONS.starWheelDetangler.center,
  rollerSingulation: STATION_DIMENSIONS.rollerSingulation.center,
  cameraGantry: STATION_DIMENSIONS.cameraGantry.center,
  infeedConveyor: STATION_DIMENSIONS.infeedConveyor.center,
  rotaryTraySorter: STATION_DIMENSIONS.rotaryTraySorter.center,
}

export function logRootPathAlignment() {
  console.info('[RootFlow] Station centers', ROOT_FLOW_STATIONS)
}

export function basePath(t, laneCount, config) {
  const clusterSpread = THREE.MathUtils.lerp(0.03, 0.42 + (laneCount - 1) * 0.1, smoothstep(0.48, 0.63, t))
  const clusterCenter = (config.clusterIndex - (config.clusterSize - 1) / 2) * 0.08
  const clusterOffset = clusterCenter * (1 - smoothstep(0.44, 0.64, t))
  const singulatedOffset = config.laneBias * clusterSpread
  const zBias = clusterOffset + singulatedOffset

  if (t < 0.16) {
    const lt = t / 0.16
    return new THREE.Vector3(
      THREE.MathUtils.lerp(ROOT_FLOW_STATIONS.barrelWasher[0] - 2.1, ROOT_FLOW_STATIONS.beltElevator[0] - 1.1, lt),
      THREE.MathUtils.lerp(2.48, 2.28, lt) + Math.sin(t * 18 + config.wobblePhase) * 0.16,
      Math.sin(t * 24 + config.clusterIndex) * 0.12 + clusterOffset * 0.7,
    )
  }

  if (t < 0.33) {
    const lt = (t - 0.16) / 0.17
    return new THREE.Vector3(
      THREE.MathUtils.lerp(ROOT_FLOW_STATIONS.beltElevator[0] - 0.95, ROOT_FLOW_STATIONS.beltElevator[0] + 0.85, lt),
      THREE.MathUtils.lerp(2.28, ROOT_FLOW_STATIONS.starWheelDetangler[1] + 0.12, lt),
      THREE.MathUtils.lerp(clusterOffset * 0.75, clusterOffset * 0.35, lt),
    )
  }

  if (t < 0.47) {
    const lt = (t - 0.33) / 0.14
    return new THREE.Vector3(
      THREE.MathUtils.lerp(ROOT_FLOW_STATIONS.beltElevator[0] + 0.85, ROOT_FLOW_STATIONS.starWheelDetangler[0] - 0.45, lt),
      THREE.MathUtils.lerp(ROOT_FLOW_STATIONS.starWheelDetangler[1] + 0.1, ROOT_FLOW_STATIONS.starWheelDetangler[1] + 0.05, lt) + Math.sin(lt * Math.PI * 10 + config.wobblePhase) * 0.08,
      clusterOffset * 0.65,
    )
  }

  if (t < 0.63) {
    const lt = (t - 0.47) / 0.16
    const rowPulse = Math.sin(lt * Math.PI * 16 + config.clusterIndex * 0.7) * 0.02
    return new THREE.Vector3(
      THREE.MathUtils.lerp(ROOT_FLOW_STATIONS.starWheelDetangler[0] - 0.25, ROOT_FLOW_STATIONS.rollerSingulation[0] - 0.45, lt),
      ROOT_FLOW_STATIONS.rollerSingulation[1],
      THREE.MathUtils.lerp(clusterOffset * 0.5, zBias, lt) + rowPulse,
    )
  }

  if (t < 0.76) {
    const lt = (t - 0.63) / 0.13
    const fallProgress = smoothstep(config.fallPoint, 1, lt)
    return new THREE.Vector3(
      THREE.MathUtils.lerp(ROOT_FLOW_STATIONS.rollerSingulation[0] - 0.4, ROOT_FLOW_STATIONS.rollerSingulation[0] + 2.15, lt),
      THREE.MathUtils.lerp(ROOT_FLOW_STATIONS.rollerSingulation[1] + 0.04, 2.68 - config.sizeClass * 0.08, fallProgress),
      THREE.MathUtils.lerp(zBias, config.channelTarget, fallProgress),
    )
  }

  if (t < 0.88) {
    const lt = (t - 0.76) / 0.12
    return new THREE.Vector3(
      THREE.MathUtils.lerp(ROOT_FLOW_STATIONS.cameraGantry[0] - 0.55, ROOT_FLOW_STATIONS.infeedConveyor[0] + 0.2, lt),
      THREE.MathUtils.lerp(2.62 - config.sizeClass * 0.05, ROOT_FLOW_STATIONS.infeedConveyor[1], lt),
      THREE.MathUtils.lerp(config.channelTarget, config.exitLane, lt),
    )
  }

  const lt = (t - 0.88) / 0.12
  const angle = -Math.PI / 5 + lt * Math.PI * 0.92
  return new THREE.Vector3(
    ROOT_FLOW_STATIONS.rotaryTraySorter[0] + Math.cos(angle) * 1.45,
    THREE.MathUtils.lerp(ROOT_FLOW_STATIONS.infeedConveyor[1] - 0.08, ROOT_FLOW_STATIONS.rotaryTraySorter[1] - 0.92, lt),
    THREE.MathUtils.lerp(config.exitLane, -0.35 + lt * 2.05, 0.48) + Math.sin(angle) * 0.26,
  )
}

export function sampleBasePath(pointCount, laneCount = 2, config = { clusterIndex: 0, clusterSize: 3, laneBias: 0, wobblePhase: 0, fallPoint: 0.5, sizeClass: 1, channelTarget: 0, exitLane: 0 }) {
  return Array.from({ length: pointCount }, (_, index) => basePath(index / (pointCount - 1), laneCount, config))
}
