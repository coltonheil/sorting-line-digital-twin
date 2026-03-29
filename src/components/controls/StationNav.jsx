import { STATION_VIEWS } from '../../constants'
import useLineParameters from '../../hooks/useLineParameters'

export default function StationNav() {
  const currentStationIndex = useLineParameters((s) => s.currentStationIndex)
  const goToStation = useLineParameters((s) => s.goToStation)
  const nextStation = useLineParameters((s) => s.nextStation)
  const prevStation = useLineParameters((s) => s.prevStation)
  const setCameraPreset = useLineParameters((s) => s.setCameraPreset)

  return (
    <div className="station-nav">
      <button
        className="station-nav-arrow"
        onClick={prevStation}
        disabled={currentStationIndex <= 0}
        title="Previous station"
      >
        ◀
      </button>

      <div className="station-nav-pills">
        <button
          className={`station-pill ${currentStationIndex === -1 ? 'active' : ''}`}
          onClick={() => setCameraPreset('full')}
          title="Full line overview"
        >
          All
        </button>
        {STATION_VIEWS.map((sv, i) => (
          <button
            key={sv.key}
            className={`station-pill ${currentStationIndex === i ? 'active' : ''}`}
            onClick={() => goToStation(i)}
            title={sv.label}
          >
            <span className="pill-number">{i + 1}</span>
            <span className="pill-label">{sv.label.replace(/^\d+\.\s*/, '')}</span>
          </button>
        ))}
      </div>

      <button
        className="station-nav-arrow"
        onClick={nextStation}
        disabled={currentStationIndex >= STATION_VIEWS.length - 1}
        title="Next station"
      >
        ▶
      </button>
    </div>
  )
}
