import type { StepSurface } from '../../types/game';
import type {
  InteriorDoorSpec,
  InteriorFloor,
  InteriorFurnitureSpec,
  InteriorLightSpec,
  InteriorRoom,
  InteriorStairSpec,
  InteriorSurfaceSpec,
  InteriorWindowSpec,
  InteriorWorld,
} from '../../types/interior';
import {
  addFloorSlab,
  buildDoorX,
  buildPerimeterShell,
  buildStraightStairFlight,
  buildWallWithDoorwayX,
  makeBoxCollider,
} from './interiorHelpers';

const FLOOR_HEIGHT = 3.2;
const WALL_CLEAR_HEIGHT = 3.04;
const MIN_X = -11.0;
const MAX_X = 12.0;
const MIN_Z = -9.0;
const MAX_Z = 7.5;

const surfaces: InteriorSurfaceSpec[] = buildPerimeterShell({
  idPrefix: 'caf',
  minX: MIN_X,
  maxX: MAX_X,
  minZ: MIN_Z,
  maxZ: MAX_Z,
  totalHeight: FLOOR_HEIGHT * 2,
  exitDoorCenterX: 0,
  exitDoorWidth: 1.6,
  exitDoorHeight: 2.4,
});

const floorSlabs: StepSurface[] = [];
addFloorSlab(surfaces, floorSlabs, 'caf-floor-0', MIN_X, MAX_X, MIN_Z, MAX_Z, 0.0, true);

// First floor (Fellowship Hall) leaves stairwell opening at X: 9.0..12.0, Z: -0.38..5.85
addFloorSlab(surfaces, floorSlabs, 'caf-floor-1-main', MIN_X, 9.0, MIN_Z, MAX_Z, FLOOR_HEIGHT);
addFloorSlab(surfaces, floorSlabs, 'caf-floor-1-north', 9.0, MAX_X, MIN_Z, -0.38, FLOOR_HEIGHT, false, {
  maxZ: 0.02,
});
addFloorSlab(surfaces, floorSlabs, 'caf-floor-1-south', 9.0, MAX_X, 5.85, MAX_Z, FLOOR_HEIGHT, false, {
  minZ: 5.7,
});

surfaces.push(
  // First floor stairwell railings
  {
    id: 'caf-f1-rail-west',
    role: 'railing',
    x: 8.94,
    y: FLOOR_HEIGHT + 0.52,
    z: 2.75,
    width: 0.12,
    height: 1.04,
    depth: 6.1,
    collides: true,
  },
  {
    id: 'caf-f1-rail-south',
    role: 'railing',
    x: 10.5,
    y: FLOOR_HEIGHT + 0.52,
    z: 5.82,
    width: 3.0,
    height: 1.04,
    depth: 0.12,
    collides: true,
  },
  // Ground floor under-stair trim blockers
  {
    id: 'caf-understair-1',
    role: 'trim',
    x: 10.5,
    y: 0.85,
    z: 0.75,
    width: 2.4,
    height: 1.7,
    depth: 1.5,
    color: '#DFD6C5',
    collides: true,
  },
  {
    id: 'caf-understair-2',
    role: 'trim',
    x: 10.5,
    y: 0.45,
    z: 2.2,
    width: 2.4,
    height: 0.9,
    depth: 1.2,
    color: '#DFD6C5',
    collides: true,
  },
  // Ground floor kitchen partition wall at Z = -4.2 (open service pass-through + kitchen door)
  ...buildWallWithDoorwayX('caf-kitchen-wall', -11.0, 8.6, -4.2, 0.0, WALL_CLEAR_HEIGHT, -7.8, 1.4, 2.34)
);

const doors: InteriorDoorSpec[] = [
  buildDoorX({
    id: 'caf-door-exit',
    label: 'Cafeteria Exit',
    subtitle: 'Academic Avenue Plaza',
    floorLevel: 0,
    kind: 'building-exit',
    centerX: 0,
    floorY: 0,
    z: MAX_Z + 0.06,
    width: 1.54,
    height: 2.4,
    swingDir: 1,
  }),
  buildDoorX({
    id: 'caf-door-kitchen',
    label: 'Cafeteria Kitchen',
    subtitle: 'Food Preparation Area',
    floorLevel: 0,
    centerX: -7.8,
    floorY: 0,
    z: -4.2,
    width: 1.36,
  }),
];

const stairs: InteriorStairSpec[] = [
  buildStraightStairFlight({
    id: 'caf-stair-0-1',
    fromFloor: 0,
    toFloor: 1,
    baseElevation: 0.0,
    centerX: 10.5,
    width: 2.4,
    startZ: 5.76,
    direction: 'north',
    stepCount: 16,
    totalRise: FLOOR_HEIGHT,
    totalRun: 5.76,
    includeWestRailing: true,
  }),
];

const furniture: InteriorFurnitureSpec[] = [
  // Ground Floor: Food Serving Line & Dining Area
  {
    id: 'caf-serving-1',
    kind: 'kitchen-counter',
    x: -1.8,
    y: 0,
    z: -2.4,
    rotationY: 0,
    collider: makeBoxCollider('caf-srv-1-col', 'Food Serving Counter', -1.8, 0.55, -2.4, 3.0, 1.1, 1.0),
  },
  {
    id: 'caf-serving-2',
    kind: 'kitchen-counter',
    x: 1.6,
    y: 0,
    z: -2.4,
    rotationY: 0,
    collider: makeBoxCollider('caf-srv-2-col', 'Hot Meals Counter', 1.6, 0.55, -2.4, 3.0, 1.1, 1.0),
  },
  {
    id: 'caf-cashier',
    kind: 'reception-counter',
    x: 5.2,
    y: 0,
    z: -2.4,
    rotationY: 0,
    collider: makeBoxCollider('caf-cash-col', 'Cashier Counter', 5.2, 0.55, -2.4, 2.5, 1.1, 1.0),
  },
  {
    id: 'caf-menu-sign',
    kind: 'wall-sign',
    x: 1.6,
    y: 2.0,
    z: -4.05,
    rotationY: 0,
    label: 'CAMPUS CAFETERIA & BUKA',
    subtitle: 'Jollof · Fried Rice · Snacks · Drinks · Stairs to Fellowship ↑',
  },

  // Dining Tables & Chairs (4 spaced dining clusters in central & west dining hall)
  ...[
    [-6.6, 1.2],
    [-2.4, 1.2],
    [2.6, 1.2],
    [-6.6, 4.6],
    [3.8, 3.6],
  ].map(([dx, dz], idx) => ({
    id: `caf-table-${idx}`,
    kind: 'dining-table' as const,
    x: dx,
    y: 0,
    z: dz,
    rotationY: 0,
    collider: makeBoxCollider(`caf-tcol-${idx}`, 'Dining Table', dx, 0.45, dz, 2.0, 0.9, 1.8),
  })),
  { id: 'caf-plant-1', kind: 'potted-plant', x: -2.0, y: 0, z: 6.6, rotationY: 0 },
  { id: 'caf-plant-2', kind: 'potted-plant', x: 2.0, y: 0, z: 6.6, rotationY: 0 },

  // Kitchen Area (Z: -9.0 .. -4.2)
  {
    id: 'caf-kit-prep-1',
    kind: 'kitchen-counter',
    x: -1.5,
    y: 0,
    z: -7.8,
    rotationY: 0,
    collider: makeBoxCollider('caf-kp-1', 'Kitchen Prep Counter', -1.5, 0.55, -7.8, 3.0, 1.1, 1.0),
  },
  {
    id: 'caf-kit-prep-2',
    kind: 'kitchen-counter',
    x: 2.5,
    y: 0,
    z: -7.8,
    rotationY: 0,
    collider: makeBoxCollider('caf-kp-2', 'Kitchen Cooking Range', 2.5, 0.55, -7.8, 3.0, 1.1, 1.0),
  },
  {
    id: 'caf-kit-rack',
    kind: 'storage-rack',
    x: 6.5,
    y: 0,
    z: -7.9,
    rotationY: 0,
    collider: makeBoxCollider('caf-kr-1', 'Pantry Rack', 6.5, 1.0, -7.9, 2.0, 2.0, 0.65),
  },

  // First Floor: Fellowship & Church Activities Hall (y = 3.2)
  {
    id: 'caf-f1-sign',
    kind: 'wall-sign',
    x: -1.0,
    y: FLOOR_HEIGHT + 2.0,
    z: -8.82,
    rotationY: 0,
    label: 'UPPER FLOOR FELLOWSHIP HALL',
    subtitle: 'Campus Worship · Choir & Student Fellowship',
  },
  {
    id: 'caf-f1-pulpit',
    kind: 'lectern',
    x: -1.0,
    y: FLOOR_HEIGHT,
    z: -6.8,
    rotationY: 0,
    collider: makeBoxCollider('caf-f1-pulp-col', 'Fellowship Lectern', -1.0, FLOOR_HEIGHT + 0.55, -6.8, 0.9, 1.1, 0.65),
  },
  { id: 'caf-f1-plant-w', kind: 'potted-plant', x: -4.2, y: FLOOR_HEIGHT, z: -7.6, rotationY: 0 },
  { id: 'caf-f1-plant-e', kind: 'potted-plant', x: 2.2, y: FLOOR_HEIGHT, z: -7.6, rotationY: 0 },
  // 3 Rows x 2 Columns of Fellowship Pews
  ...[-3.4, -0.6, 2.2].flatMap((pz, rIdx) =>
    [-5.4, 3.4].map((px, cIdx) => ({
      id: `caf-f1-pew-${rIdx}-${cIdx}`,
      kind: 'fellowship-pew' as const,
      x: px,
      y: FLOOR_HEIGHT,
      z: pz,
      rotationY: 0,
      collider: makeBoxCollider(`caf-f1-pewcol-${rIdx}-${cIdx}`, 'Fellowship Pew', px, FLOOR_HEIGHT + 0.45, pz, 3.6, 0.9, 0.85),
    }))
  ),
];

const rooms: InteriorRoom[] = [
  {
    id: 'caf-dining',
    name: 'Campus Cafeteria & Dining Hall',
    subtitle: 'Ground Floor Food Counter & Seating',
    floorLevel: 0,
    kind: 'dining-hall',
    minX: MIN_X,
    maxX: 9.0,
    minZ: -4.2,
    maxZ: MAX_Z,
  },
  {
    id: 'caf-kitchen',
    name: 'Cafeteria Kitchen & Pantry',
    subtitle: 'Culinary Preparation Area',
    floorLevel: 0,
    kind: 'kitchen',
    minX: MIN_X,
    maxX: 9.0,
    minZ: MIN_Z,
    maxZ: -4.2,
  },
  {
    id: 'caf-stair-0',
    name: 'Cafeteria Stairwell',
    subtitle: 'Stairs to Upper Fellowship Hall',
    floorLevel: 0,
    kind: 'stairwell',
    minX: 9.0,
    maxX: MAX_X,
    minZ: MIN_Z,
    maxZ: MAX_Z,
  },
  {
    id: 'caf-fellowship',
    name: 'Upper Floor Fellowship Hall',
    subtitle: 'Church & Christian Fellowship Auditorium',
    floorLevel: 1,
    kind: 'fellowship-hall',
    minX: MIN_X,
    maxX: 9.0,
    minZ: MIN_Z,
    maxZ: MAX_Z,
  },
  {
    id: 'caf-stair-1',
    name: 'Fellowship Hall Stairwell',
    subtitle: 'Stairs to Ground Dining Hall',
    floorLevel: 1,
    kind: 'stairwell',
    minX: 9.0,
    maxX: MAX_X,
    minZ: MIN_Z,
    maxZ: MAX_Z,
  },
];

const windows: InteriorWindowSpec[] = [
  { id: 'caf-win-w0', x: MIN_X + 0.02, y: 1.75, z: 1.5, width: 3.6, height: 1.5, rotationY: Math.PI / 2 },
  { id: 'caf-win-w1', x: MIN_X + 0.02, y: FLOOR_HEIGHT + 1.75, z: 0.0, width: 4.0, height: 1.5, rotationY: Math.PI / 2 },
  { id: 'caf-win-s1', x: -3.5, y: FLOOR_HEIGHT + 1.75, z: MAX_Z - 0.02, width: 4.0, height: 1.5, rotationY: Math.PI },
];

const lights: InteriorLightSpec[] = [
  { id: 'caf-l-0-din', x: -1.0, y: 2.88, z: 2.0, color: '#FFF5DF', intensity: 1.8, distance: 22, castPointLight: true },
  { id: 'caf-l-0-kit', x: 0, y: 2.88, z: -6.5, color: '#F5FAFF', intensity: 1.4, distance: 16, castPointLight: true },
  { id: 'caf-l-1-fel', x: -1.0, y: FLOOR_HEIGHT + 2.88, z: -1.0, color: '#FFF5DF', intensity: 1.9, distance: 24, castPointLight: true },
];

export const CAFETERIA_INTERIOR: InteriorWorld = {
  id: 'cafeteria',
  name: 'Cafeteria & Fellowship Hall',
  subtitle: 'Ground Dining Hall & Upper Fellowship Auditorium',
  bounds: {
    minX: MIN_X + 0.12,
    maxX: MAX_X - 0.12,
    minZ: MIN_Z + 0.12,
    maxZ: MAX_Z - 0.12,
  },
  floorHeight: FLOOR_HEIGHT,
  floors: [
    { level: 0, elevation: 0.0, label: 'Ground Floor' },
    { level: 1, elevation: FLOOR_HEIGHT, label: 'First Floor' },
  ],
  floorSlabs,
  rooms,
  surfaces,
  windows,
  doors,
  stairs,
  furniture,
  lights,
  spawnPoint: {
    x: 0,
    y: 0.0,
    z: 5.5,
    yaw: 0,
  },
  exitReturnFallback: {
    x: -71.2,
    y: 0.04,
    z: -47.0,
    yaw: -Math.PI / 2,
  },
};
