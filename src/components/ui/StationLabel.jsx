import { Text } from '@react-three/drei'

export default function StationLabel({ text, position, visible = true }) {
  if (!visible) return null

  return (
    <Text
      position={position}
      fontSize={0.38}
      color="#f8fbff"
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.02}
      outlineColor="#10151c"
      maxWidth={8}
    >
      {text}
    </Text>
  )
}
