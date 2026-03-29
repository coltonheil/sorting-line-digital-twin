import { VIEW_PRESETS } from '../../constants'
import useLineParameters from '../../hooks/useLineParameters'

export default function ViewPresets() {
  const activeView = useLineParameters((state) => state.activeView)
  const setCameraPreset = useLineParameters((state) => state.setCameraPreset)

  return (
    <div className="view-presets">
      {Object.entries(VIEW_PRESETS).map(([key, preset]) => (
        <button
          key={key}
          className={activeView === key ? 'active' : ''}
          onClick={() => setCameraPreset(key)}
        >
          {preset.label}
        </button>
      ))}
    </div>
  )
}
