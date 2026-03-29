import { create } from 'zustand'
import { DEFAULT_PARAMETERS, VIEW_PRESETS } from '../constants'

const useLineParameters = create((set) => ({
  ...DEFAULT_PARAMETERS,
  activeView: 'full',
  cameraTarget: VIEW_PRESETS.full,
  setParameter: (key, value) => set({ [key]: value }),
  setHoveredStation: (hoveredStation) => set({ hoveredStation }),
  setCameraPreset: (key) =>
    set({
      activeView: key,
      cameraTarget: VIEW_PRESETS[key],
    }),
  togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),
}))

export default useLineParameters
