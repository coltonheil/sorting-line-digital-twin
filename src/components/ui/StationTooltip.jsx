import { STATION_INFO } from '../../constants'
import useLineParameters from '../../hooks/useLineParameters'

export default function StationTooltip() {
  const hoveredStation = useLineParameters((state) => state.hoveredStation)

  if (!hoveredStation || !STATION_INFO[hoveredStation]) return null
  const station = STATION_INFO[hoveredStation]

  return (
    <div className="station-tooltip">
      <p className="eyebrow">Station detail</p>
      <h3>{station.name}</h3>
      <p>{station.purpose}</p>
      <ul>
        {Object.entries(station)
          .filter(([key]) => !['key', 'name', 'purpose', 'center'].includes(key))
          .slice(0, 3)
          .map(([key, value]) => (
            <li key={key}>
              <span>{key}</span>
              <strong>{typeof value === 'number' ? value.toFixed(2) : String(value)}</strong>
            </li>
          ))}
      </ul>
    </div>
  )
}
