import { useMemo } from 'react'
import { createRootMaterial, ROOT_SCALE, useRootAssets } from './rootAssets'

export default function RootVisual({
  variantIndex = 0,
  scale = ROOT_SCALE,
  emissiveIntensity = 0.5,
  material: materialOverride,
}) {
  const { variants } = useRootAssets()
  const safeIndex = variants.length ? ((variantIndex % variants.length) + variants.length) % variants.length : 0
  const variant = variants[safeIndex]
  const localMaterial = useMemo(
    () => materialOverride ?? createRootMaterial({ emissiveIntensity, shared: true }),
    [materialOverride, emissiveIntensity],
  )

  if (!variant) return null

  return <mesh geometry={variant.geometry} material={localMaterial} castShadow receiveShadow scale={[scale, scale, scale]} />
}
