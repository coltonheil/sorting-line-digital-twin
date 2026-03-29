import Scene from './components/Scene'
import ParameterPanel from './components/controls/ParameterPanel'
import ViewPresets from './components/controls/ViewPresets'
import StationNav from './components/controls/StationNav'
import StationTooltip from './components/ui/StationTooltip'
import FPSCounter from './components/ui/FPSCounter'
import './App.css'

export default function App() {
  return (
    <main className="app-shell">
      <div className="viewport-shell">
        <div className="hud top-left">
          <p className="eyebrow">Heil Ginseng</p>
          <h1>Root Sorting Line Digital Twin</h1>
          <p className="subtitle">Interactive OEM-ready visualization with parametric controls and animated product flow.</p>
        </div>

        <div className="hud top-center">
          <ViewPresets />
        </div>

        <div className="canvas-wrap">
          <Scene />
        </div>

        <div className="hud bottom-center">
          <StationNav />
        </div>

        <div className="hud bottom-left">
          <StationTooltip />
        </div>

        <div className="hud bottom-right">
          <FPSCounter />
        </div>
      </div>

      <ParameterPanel />
    </main>
  )
}
