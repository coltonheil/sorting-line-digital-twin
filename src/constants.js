export const FEET = 1
export const INCH = 1 / 12

export const STATION_ORDER = [
  'barrelWasher',
  'beltElevator',
  'starWheelDetangler',
  'rollerSingulation',
  'cameraGantry',
  'infeedConveyor',
  'rotaryTraySorter',
  'gradeBins',
]

export const GRADE_LABELS = [
  'Grade 2A',
  'Grade A',
  'Grade B',
  'Grade C',
  'Grade 2B',
  'Grade 3',
  'Grade 4',
  'Blemish',
]

export const DEFAULT_PARAMETERS = {
  beltSpeed: 30,
  laneCount: 2,
  cameraHeight: 24,
  rollerGapStart: 0.5,
  rollerGapEnd: 2,
  carouselSpeed: 15,
  starWheelSpeed: 60,
  showLabels: true,
  showDimensions: true,
  animationSpeed: 1,
  panelOpen: true,
  hoveredStation: null,
  fillLevels: [0.72, 0.6, 0.48, 0.35, 0.56, 0.24, 0.18, 0.11],
}

export const STATION_DIMENSIONS = {
  barrelWasher: {
    key: 'barrelWasher',
    name: 'Barrel Washer Output',
    purpose: 'Rotary wash drum discharging cleaned ginseng roots to the sorting line.',
    length: 6 * FEET,
    diameter: 4 * FEET,
    width: 4.5 * FEET,
    center: [-18, 2.4, 0],
  },
  beltElevator: {
    key: 'beltElevator',
    name: 'Inclined Cleated Belt Elevator',
    purpose: 'Transfers roots up to operator and machine working height.',
    length: 8 * FEET,
    width: 1.5 * FEET,
    inclineDeg: 30,
    center: [-11, 2.6, 0],
  },
  starWheelDetangler: {
    key: 'starWheelDetangler',
    name: 'Star Wheel Detangler',
    purpose: 'Separates clumps and presents more individual roots downstream.',
    length: 3.5 * FEET,
    width: 2 * FEET,
    height: 3.2 * FEET,
    center: [-4.2, 2.9, 0],
  },
  rollerSingulation: {
    key: 'rollerSingulation',
    name: 'Roller Singulation',
    purpose: 'Orients roots lengthwise and narrows them into controlled lanes.',
    length: 4 * FEET,
    width: 2.2 * FEET,
    center: [1.2, 3, 0],
  },
  cameraGantry: {
    key: 'cameraGantry',
    name: 'Camera + Lighting Gantry',
    purpose: 'Inspects each singulated root with controlled contrast and lighting.',
    length: 3 * FEET,
    width: 1.4 * FEET,
    center: [6.2, 3.2, 0],
  },
  infeedConveyor: {
    key: 'infeedConveyor',
    name: 'Infeed Conveyor',
    purpose: 'Bridges inspected roots into the rotary tray sorter.',
    length: 2.6 * FEET,
    width: 1.2 * FEET,
    center: [10, 3.1, 0],
  },
  rotaryTraySorter: {
    key: 'rotaryTraySorter',
    name: 'Rotary Tray Sorter',
    purpose: 'Classifies scanned roots into one of eight grade outlets.',
    diameter: 4 * FEET,
    trayCount: 28,
    outletCount: 8,
    center: [15.2, 2.25, 0],
  },
  gradeBins: {
    key: 'gradeBins',
    name: 'Grade Collection Bins',
    purpose: 'Receives sorted roots by grade with live fill-level visualization.',
    count: 8,
    radius: 5.3 * FEET,
    center: [15.2, 0.75, 0],
  },
}

export const VIEW_PRESETS = {
  full: {
    label: 'Full Line',
    position: [20, 11, 16],
    target: [1, 2.6, 0],
  },
  top: {
    label: 'Top Down',
    position: [3, 22, 0.01],
    target: [3, 2.8, 0],
  },
  side: {
    label: 'Side View',
    position: [5, 6.5, 22],
    target: [4, 2.8, 0],
  },
  operator: {
    label: 'Operator POV',
    position: [2.8, 4.8, 7.5],
    target: [7.5, 3.1, 0],
  },
}

// Per-station camera positions for "walk the line" navigation
export const STATION_VIEWS = [
  { key: 'barrelWasher',       label: '1. Barrel Washer',    position: [-18, 5.5, 8],    target: [-18, 2.4, 0] },
  { key: 'beltElevator',       label: '2. Belt Elevator',    position: [-11, 5.5, 8],    target: [-11, 2.6, 0] },
  { key: 'starWheelDetangler', label: '3. Star Wheels',      position: [-4.2, 5.5, 7],   target: [-4.2, 2.9, 0] },
  { key: 'rollerSingulation',  label: '4. Rollers',          position: [1.2, 5.5, 7],    target: [1.2, 3, 0] },
  { key: 'cameraGantry',       label: '5. Camera/AI',        position: [6.2, 5.5, 7],    target: [6.2, 3.2, 0] },
  { key: 'infeedConveyor',     label: '6. Infeed',           position: [10, 5.5, 7],     target: [10, 3.1, 0] },
  { key: 'rotaryTraySorter',   label: '7. Rotary Sorter',    position: [15.2, 6, 8],     target: [15.2, 2.25, 0] },
  { key: 'gradeBins',          label: '8. Grade Bins',       position: [15.2, 5, 10],    target: [15.2, 0.75, 0] },
]

export const STATION_INFO = Object.fromEntries(
  Object.values(STATION_DIMENSIONS).map((station) => [station.key, station]),
)
