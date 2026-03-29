import { Text } from '@react-three/drei'

export default function DimensionTag({ text, position, visible = true }) {
  if (!visible) return null

  return (
    <Text
      position={position}
      fontSize={0.22}
      color="#9fe0ff"
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.01}
      outlineColor="#0f141a"
    >
      {text}
    </Text>
  )
}
