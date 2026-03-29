import { create } from 'zustand'
import { DEFAULT_PARAMETERS, VIEW_PRESETS, STATION_VIEWS } from '../constants'

const useLineParameters = create((set, get) => ({
  ...DEFAULT_PARAMETERS,
  activeView: 'full',
  cameraTarget: VIEW_PRESETS.full,
  currentStationIndex: -1, // -1 means no station selected (global view)
  setParameter: (key, value) => set({ [key]: value }),
  setHoveredStation: (hoveredStation) => set({ hoveredStation }),
  setCameraPreset: (key) =>
    set({
      activeView: key,
      currentStationIndex: -1,
      cameraTarget: VIEW_PRESETS[key],
    }),
  goToStation: (index) => {
    const clamped = Math.max(0, Math.min(index, STATION_VIEWS.length - 1))
    set({
      activeView: STATION_VIEWS[clamped].key,
      currentStationIndex: clamped,
      cameraTarget: STATION_VIEWS[clamped],
    })
  },
  nextStation: () => {
    const { currentStationIndex } = get()
    const next = currentStationIndex < 0 ? 0 : Math.min(currentStationIndex + 1, STATION_VIEWS.length - 1)
    get().goToStation(next)
  },
  prevStation: () => {
    const { currentStationIndex } = get()
    const prev = currentStationIndex <= 0 ? 0 : currentStationIndex - 1
    get().goToStation(prev)
  },
  togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),
}))

export default useLineParameters
