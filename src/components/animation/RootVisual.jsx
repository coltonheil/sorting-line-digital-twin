import { useEffect, useMemo } from 'react'
import { createRootMaterial, ROOT_COLOR, ROOT_SCALE, useRootAssets } from './rootAssets'

export default function RootVisual({
  variantIndex = 0,
  scale = ROOT_SCALE,
  emissiveIntensity = 0.5,
  halo = false,
  haloScale = 3,
  material: materialOverride,
}) {
  const { variants, haloTexture } = useRootAssets()
  const variant = variants[variantIndex % variants.length]
  const localMaterial = useMemo(
    () => materialOverride ?? createRootMaterial({ emissiveIntensity }),
    [materialOverride, emissiveIntensity],
  )

  useEffect(() => {
    return () => {
      if (!materialOverride) localMaterial.dispose()
    }
  }, [localMaterial, materialOverride])

  if (!variant) return null

  return (
    <group>
      {halo && (
        <sprite scale={[haloScale, haloScale, 1]}>
          <spriteMaterial
            map={haloTexture}
            color={ROOT_COLOR}
            transparent
            opacity={0.25}
            depthWrite={false}
            sizeAttenuation
          />
        </sprite>
      )}
      <mesh geometry={variant.geometry} material={localMaterial} castShadow receiveShadow scale={[scale, scale, scale]} />
    </group>
  )
}
