import useLineParameters from '../../hooks/useLineParameters'

function Slider({ label, min, max, step, value, onChange, suffix = '' }) {
  return (
    <label className="control-group">
      <div className="control-row">
        <span>{label}</span>
        <strong>{`${value}${suffix}`}</strong>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={onChange} />
    </label>
  )
}

export default function ParameterPanel() {
  const store = useLineParameters()

  return (
    <aside className={`parameter-panel ${store.panelOpen ? 'open' : 'collapsed'}`}>
      <button className="panel-toggle" onClick={store.togglePanel}>
        {store.panelOpen ? 'Hide controls' : 'Controls'}
      </button>

      {store.panelOpen && (
        <div className="panel-body">
          <div>
            <p className="eyebrow">Parametric controls</p>
            <h2>Sorting line settings</h2>
          </div>

          <Slider
            label="Belt speed"
            min={10}
            max={60}
            step={1}
            value={store.beltSpeed}
            suffix=" ft/min"
            onChange={(e) => store.setParameter('beltSpeed', Number(e.target.value))}
          />

          <label className="control-group">
            <div className="control-row">
              <span>Singulation lanes</span>
            </div>
            <select
              value={store.laneCount}
              onChange={(e) => store.setParameter('laneCount', Number(e.target.value))}
            >
              {[1, 2, 3].map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>

          <Slider
            label="Camera height"
            min={12}
            max={36}
            step={1}
            value={store.cameraHeight}
            suffix='"'
            onChange={(e) => store.setParameter('cameraHeight', Number(e.target.value))}
          />

          <Slider
            label="Roller gap start"
            min={0.25}
            max={1}
            step={0.05}
            value={store.rollerGapStart}
            suffix='"'
            onChange={(e) => store.setParameter('rollerGapStart', Number(e.target.value))}
          />

          <Slider
            label="Roller gap end"
            min={1}
            max={3}
            step={0.1}
            value={store.rollerGapEnd}
            suffix='"'
            onChange={(e) => store.setParameter('rollerGapEnd', Number(e.target.value))}
          />

          <Slider
            label="Carousel speed"
            min={5}
            max={30}
            step={1}
            value={store.carouselSpeed}
            suffix=' RPM'
            onChange={(e) => store.setParameter('carouselSpeed', Number(e.target.value))}
          />

          <Slider
            label="Star wheel speed"
            min={20}
            max={100}
            step={1}
            value={store.starWheelSpeed}
            suffix=' RPM'
            onChange={(e) => store.setParameter('starWheelSpeed', Number(e.target.value))}
          />

          <Slider
            label="Animation speed"
            min={0.5}
            max={3}
            step={0.1}
            value={store.animationSpeed}
            suffix='x'
            onChange={(e) => store.setParameter('animationSpeed', Number(e.target.value))}
          />

          <label className="toggle-row">
            <span>Show station labels</span>
            <input
              type="checkbox"
              checked={store.showLabels}
              onChange={(e) => store.setParameter('showLabels', e.target.checked)}
            />
          </label>

          <label className="toggle-row">
            <span>Show dimensions</span>
            <input
              type="checkbox"
              checked={store.showDimensions}
              onChange={(e) => store.setParameter('showDimensions', e.target.checked)}
            />
          </label>
        </div>
      )}
    </aside>
  )
}
