import type { StepSurface } from '../../types/game';
import type {
  InteriorDoorSpec,
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
  buildWall,
  buildWallWithDoorwayX,
  makeBoxCollider,
} from './interiorHelpers';

const FLOOR_HEIGHT = 3.2;
const WALL_CLEAR_HEIGHT = 3.04;
const MIN_X = -10.0;
const MAX_X = 11.0;
const MIN_Z = -8.5;
const MAX_Z = 7.0;

const surfaces: InteriorSurfaceSpec[] = buildPerimeterShell({
  idPrefix: 'adm',
  minX: MIN_X,
  maxX: MAX_X,
  minZ: MIN_Z,
  maxZ: MAX_Z,
  totalHeight: FLOOR_HEIGHT * 2,
  exitDoorCenterX: 0,
  exitDoorWidth: 1.5,
  exitDoorHeight: 2.4,
});

const floorSlabs: StepSurface[] = [];
addFloorSlab(surfaces, floorSlabs, 'adm-floor-0', MIN_X, MAX_X, MIN_Z, MAX_Z, 0.0, true);

// First floor slab leaves stairwell shaft open at X: 8.2..11.0, Z: -0.4..5.65
addFloorSlab(surfaces, floorSlabs, 'adm-floor-1-main', MIN_X, 8.2, MIN_Z, MAX_Z, FLOOR_HEIGHT);
addFloorSlab(surfaces, floorSlabs, 'adm-floor-1-north', 8.2, MAX_X, MIN_Z, -0.4, FLOOR_HEIGHT, false, {
  maxZ: -0.18,
});
addFloorSlab(surfaces, floorSlabs, 'adm-floor-1-south', 8.2, MAX_X, 5.65, MAX_Z, FLOOR_HEIGHT, false, {
  minZ: 5.5,
});

surfaces.push(
  // Stairwell railing on Floor 1
  {
    id: 'adm-f1-rail-west',
    role: 'railing',
    x: 8.14,
    y: FLOOR_HEIGHT + 0.52,
    z: 2.65,
    width: 0.12,
    height: 1.04,
    depth: 5.85,
    collides: true,
  },
  {
    id: 'adm-f1-rail-south',
    role: 'railing',
    x: 9.6,
    y: FLOOR_HEIGHT + 0.52,
    z: 5.62,
    width: 2.8,
    height: 1.04,
    depth: 0.12,
    collides: true,
  },
  // Ground floor under-stair stepped blocks
  {
    id: 'adm-understair-1',
    role: 'trim',
    x: 9.6,
    y: 0.85,
    z: 0.55,
    width: 2.4,
    height: 1.7,
    depth: 1.5,
    color: '#DFD6C5',
    collides: true,
  },
  {
    id: 'adm-understair-2',
    role: 'trim',
    x: 9.6,
    y: 0.45,
    z: 2.0,
    width: 2.4,
    height: 0.9,
    depth: 1.2,
    color: '#DFD6C5',
    collides: true,
  }
);

// Ground floor partitions: Admissions & Registry (-10..-1.5) & Bursary Office (-1.5..6.2)
surfaces.push(
  ...buildWallWithDoorwayX('adm-f0-corr-w', -10.0, -1.5, 1.4, 0.0, WALL_CLEAR_HEIGHT, -5.8, 1.38, 2.34),
  ...buildWallWithDoorwayX('adm-f0-corr-e', -1.5, 6.2, 1.4, 0.0, WALL_CLEAR_HEIGHT, 2.3, 1.38, 2.34),
  buildWall('adm-f0-mid-div', -1.5, 0.0, -3.55, 0.24, WALL_CLEAR_HEIGHT, 9.9),
  buildWall('adm-f0-stair-div', 6.2, 0.0, -3.55, 0.24, WALL_CLEAR_HEIGHT, 9.9)
);

// First floor partitions: Registrar & Staff Suite (-10..-1.5) & Council Meeting Room (-1.5..6.2)
surfaces.push(
  ...buildWallWithDoorwayX('adm-f1-corr-w', -10.0, -1.5, 1.4, FLOOR_HEIGHT, WALL_CLEAR_HEIGHT, -5.8, 1.38, 2.34),
  ...buildWallWithDoorwayX('adm-f1-corr-e', -1.5, 6.2, 1.4, FLOOR_HEIGHT, WALL_CLEAR_HEIGHT, 2.3, 1.38, 2.34),
  buildWall('adm-f1-mid-div', -1.5, FLOOR_HEIGHT, -3.55, 0.24, WALL_CLEAR_HEIGHT, 9.9),
  buildWall('adm-f1-stair-div', 6.2, FLOOR_HEIGHT, -3.55, 0.24, WALL_CLEAR_HEIGHT, 9.9)
);

const doors: InteriorDoorSpec[] = [
  buildDoorX({
    id: 'adm-door-exit',
    label: 'Administrative Exit',
    subtitle: 'Campus Front Plaza',
    floorLevel: 0,
    kind: 'building-exit',
    centerX: 0,
    floorY: 0,
    z: MAX_Z + 0.06,
    width: 1.46,
    height: 2.4,
    swingDir: 1,
  }),
  buildDoorX({
    id: 'adm-door-f0-registry',
    label: 'Registry & Admissions',
    subtitle: 'Ground Floor Office',
    floorLevel: 0,
    centerX: -5.8,
    floorY: 0,
    z: 1.4,
  }),
  buildDoorX({
    id: 'adm-door-f0-bursary',
    label: 'Bursary & Accounts',
    subtitle: 'Ground Floor Office',
    floorLevel: 0,
    centerX: 2.3,
    floorY: 0,
    z: 1.4,
  }),
  buildDoorX({
    id: 'adm-door-f1-staff',
    label: 'Staff & Registrar Suite',
    subtitle: 'First Floor Offices',
    floorLevel: 1,
    centerX: -5.8,
    floorY: FLOOR_HEIGHT,
    z: 1.4,
  }),
  buildDoorX({
    id: 'adm-door-f1-meeting',
    label: 'Executive Meeting Room',
    subtitle: 'First Floor Boardroom',
    floorLevel: 1,
    centerX: 2.3,
    floorY: FLOOR_HEIGHT,
    z: 1.4,
  }),
];

const stairs: InteriorStairSpec[] = [
  buildStraightStairFlight({
    id: 'adm-stair-0-1',
    fromFloor: 0,
    toFloor: 1,
    baseElevation: 0.0,
    centerX: 9.6,
    width: 2.4,
    startZ: 5.56,
    direction: 'north',
    stepCount: 16,
    totalRise: FLOOR_HEIGHT,
    totalRun: 5.76,
    includeWestRailing: true,
  }),
];

const furniture: InteriorFurnitureSpec[] = [
  // Ground Floor Reception & Lobby
  {
    id: 'adm-f0-rec',
    kind: 'reception-counter',
    x: -3.2,
    y: 0,
    z: 3.6,
    rotationY: 0,
    collider: makeBoxCollider('adm-f0-rec-col', 'Reception Counter', -3.2, 0.55, 3.6, 2.8, 1.1, 1.0),
  },
  {
    id: 'adm-f0-sofa-w',
    kind: 'sofa-bench',
    x: -7.6,
    y: 0,
    z: 6.25,
    rotationY: Math.PI,
    collider: makeBoxCollider('adm-f0-sofa-wcol', 'Waiting Sofa', -7.6, 0.45, 6.25, 2.2, 0.9, 0.9),
  },
  {
    id: 'adm-f0-sofa-e',
    kind: 'sofa-bench',
    x: 4.0,
    y: 0,
    z: 6.25,
    rotationY: Math.PI,
    collider: makeBoxCollider('adm-f0-sofa-ecol', 'Waiting Sofa', 4.0, 0.45, 6.25, 2.2, 0.9, 0.9),
  },
  { id: 'adm-f0-plant-1', kind: 'potted-plant', x: -1.8, y: 0, z: 6.1, rotationY: 0 },
  { id: 'adm-f0-plant-2', kind: 'potted-plant', x: 1.8, y: 0, z: 6.1, rotationY: 0 },
  { id: 'adm-f0-notice', kind: 'noticeboard', x: 0, y: 1.65, z: 1.55, rotationY: 0 },
  {
    id: 'adm-f0-dir',
    kind: 'wall-sign',
    x: 4.6,
    y: 1.85,
    z: 1.55,
    rotationY: 0,
    label: 'ADMINISTRATIVE BUILDING',
    subtitle: 'F0 Registry & Bursary · F1 Registrar & Boardroom',
  },

  // Registry Office
  {
    id: 'adm-f0-reg-pc1',
    kind: 'computer-station',
    x: -6.0,
    y: 0,
    z: -5.4,
    rotationY: 0,
    collider: makeBoxCollider('adm-f0-reg-c1', 'Registry Desk', -6.0, 0.45, -5.4, 1.8, 0.9, 0.9),
  },
  {
    id: 'adm-f0-reg-shelf',
    kind: 'bookshelf',
    x: -9.35,
    y: 0,
    z: -4.8,
    rotationY: Math.PI / 2,
    collider: makeBoxCollider('adm-f0-reg-scol', 'Records Shelf', -9.35, 1.0, -4.8, 0.6, 2.0, 1.8),
  },
  { id: 'adm-f0-reg-ch1', kind: 'chair', x: -6.5, y: 0, z: -3.3, rotationY: Math.PI },
  { id: 'adm-f0-reg-ch2', kind: 'chair', x: -5.3, y: 0, z: -3.3, rotationY: Math.PI },

  // Bursary Office
  {
    id: 'adm-f0-bur-pc',
    kind: 'computer-station',
    x: 2.3,
    y: 0,
    z: -5.4,
    rotationY: 0,
    collider: makeBoxCollider('adm-f0-bur-c1', 'Bursary Desk', 2.3, 0.45, -5.4, 1.8, 0.9, 0.9),
  },
  {
    id: 'adm-f0-bur-shelf',
    kind: 'bookshelf',
    x: 5.55,
    y: 0,
    z: -4.8,
    rotationY: -Math.PI / 2,
    collider: makeBoxCollider('adm-f0-bur-scol', 'Accounts Archive', 5.55, 1.0, -4.8, 0.6, 2.0, 1.8),
  },
  { id: 'adm-f0-bur-sofa', kind: 'sofa-bench', x: 2.3, y: 0, z: -2.4, rotationY: 0 },

  // Floor 1 Corridor & Staff Offices
  {
    id: 'adm-f1-sign',
    kind: 'wall-sign',
    x: 0,
    y: FLOOR_HEIGHT + 1.85,
    z: 1.55,
    rotationY: 0,
    label: 'FIRST FLOOR · ADMINISTRATION',
    subtitle: 'Registrar & Senior Staff · Meeting Room',
  },
  {
    id: 'adm-f1-staff-pc1',
    kind: 'computer-station',
    x: -7.5,
    y: FLOOR_HEIGHT,
    z: -5.5,
    rotationY: 0,
    collider: makeBoxCollider('adm-f1-s-c1', 'Registrar Desk', -7.5, FLOOR_HEIGHT + 0.45, -5.5, 1.8, 0.9, 0.9),
  },
  {
    id: 'adm-f1-staff-pc2',
    kind: 'computer-station',
    x: -4.1,
    y: FLOOR_HEIGHT,
    z: -5.5,
    rotationY: 0,
    collider: makeBoxCollider('adm-f1-s-c2', 'Deputy Desk', -4.1, FLOOR_HEIGHT + 0.45, -5.5, 1.8, 0.9, 0.9),
  },
  {
    id: 'adm-f1-staff-shelf',
    kind: 'bookshelf',
    x: -5.8,
    y: FLOOR_HEIGHT,
    z: -7.85,
    rotationY: 0,
    collider: makeBoxCollider('adm-f1-s-scol', 'Policy Shelf', -5.8, FLOOR_HEIGHT + 1.0, -7.85, 1.8, 2.0, 0.6),
  },

  // Floor 1 Executive Meeting Room
  { id: 'adm-f1-meet-wb', kind: 'whiteboard', x: 2.3, y: FLOOR_HEIGHT + 1.65, z: -8.32, rotationY: 0 },
  {
    id: 'adm-f1-meet-tbl-1',
    kind: 'desk',
    x: 1.45,
    y: FLOOR_HEIGHT,
    z: -4.2,
    rotationY: Math.PI / 2,
    collider: makeBoxCollider('adm-f1-mt-1', 'Conference Table', 1.45, FLOOR_HEIGHT + 0.4, -4.2, 0.85, 0.8, 1.8),
  },
  {
    id: 'adm-f1-meet-tbl-2',
    kind: 'desk',
    x: 3.15,
    y: FLOOR_HEIGHT,
    z: -4.2,
    rotationY: Math.PI / 2,
    collider: makeBoxCollider('adm-f1-mt-2', 'Conference Table', 3.15, FLOOR_HEIGHT + 0.4, -4.2, 0.85, 0.8, 1.8),
  },
  { id: 'adm-f1-mch-1', kind: 'chair', x: 0.45, y: FLOOR_HEIGHT, z: -4.6, rotationY: Math.PI / 2 },
  { id: 'adm-f1-mch-2', kind: 'chair', x: 0.45, y: FLOOR_HEIGHT, z: -3.6, rotationY: Math.PI / 2 },
  { id: 'adm-f1-mch-3', kind: 'chair', x: 4.15, y: FLOOR_HEIGHT, z: -4.6, rotationY: -Math.PI / 2 },
  { id: 'adm-f1-mch-4', kind: 'chair', x: 4.15, y: FLOOR_HEIGHT, z: -3.6, rotationY: -Math.PI / 2 },
];

const rooms: InteriorRoom[] = [
  {
    id: 'adm-f0-reception',
    name: 'Admin Reception & Waiting Hall',
    subtitle: 'Ground Floor Inquiries',
    floorLevel: 0,
    kind: 'reception',
    minX: MIN_X,
    maxX: 8.2,
    minZ: 1.4,
    maxZ: MAX_Z,
  },
  {
    id: 'adm-f0-stair',
    name: 'Admin Stairwell',
    subtitle: 'Stairs to First Floor',
    floorLevel: 0,
    kind: 'stairwell',
    minX: 8.2,
    maxX: MAX_X,
    minZ: MIN_Z,
    maxZ: MAX_Z,
  },
  {
    id: 'adm-f0-registry',
    name: 'Registry & Admissions Office',
    subtitle: 'Student Records & Verification',
    floorLevel: 0,
    kind: 'office',
    minX: MIN_X,
    maxX: -1.5,
    minZ: MIN_Z,
    maxZ: 1.4,
  },
  {
    id: 'adm-f0-bursary',
    name: 'Bursary & Accounts Office',
    subtitle: 'University Finance & Fees',
    floorLevel: 0,
    kind: 'office',
    minX: -1.5,
    maxX: 6.2,
    minZ: MIN_Z,
    maxZ: 1.4,
  },
  {
    id: 'adm-f1-corridor',
    name: 'First Floor Admin Corridor',
    subtitle: 'Executive & Staff Wing',
    floorLevel: 1,
    kind: 'corridor',
    minX: MIN_X,
    maxX: 8.2,
    minZ: 1.4,
    maxZ: MAX_Z,
  },
  {
    id: 'adm-f1-stair',
    name: 'First Floor Stairwell',
    subtitle: 'Stairs to Ground Floor',
    floorLevel: 1,
    kind: 'stairwell',
    minX: 8.2,
    maxX: MAX_X,
    minZ: MIN_Z,
    maxZ: MAX_Z,
  },
  {
    id: 'adm-f1-staff',
    name: 'Registrar & Staff Suite',
    subtitle: 'Senior Administrative Offices',
    floorLevel: 1,
    kind: 'office',
    minX: MIN_X,
    maxX: -1.5,
    minZ: MIN_Z,
    maxZ: 1.4,
  },
  {
    id: 'adm-f1-meeting',
    name: 'Executive Meeting Room',
    subtitle: 'Committee & Council Boardroom',
    floorLevel: 1,
    kind: 'meeting-room',
    minX: -1.5,
    maxX: 6.2,
    minZ: MIN_Z,
    maxZ: 1.4,
  },
];

const windows: InteriorWindowSpec[] = [
  { id: 'adm-win-w0', x: MIN_X + 0.02, y: 1.7, z: -3.5, width: 3.4, height: 1.5, rotationY: Math.PI / 2 },
  { id: 'adm-win-w1', x: MIN_X + 0.02, y: FLOOR_HEIGHT + 1.7, z: -3.5, width: 3.4, height: 1.5, rotationY: Math.PI / 2 },
  { id: 'adm-win-n1', x: 2.3, y: FLOOR_HEIGHT + 1.7, z: MIN_Z + 0.02, width: 3.6, height: 1.5, rotationY: 0 },
];

const lights: InteriorLightSpec[] = [
  { id: 'adm-l-0-hub', x: 0, y: 2.88, z: 4.0, color: '#FFF6E5', intensity: 1.7, distance: 20, castPointLight: true },
  { id: 'adm-l-0-reg', x: -5.5, y: 2.88, z: -4.0, color: '#FFF8EC', intensity: 1.4, distance: 15, castPointLight: true },
  { id: 'adm-l-1-hub', x: 0, y: FLOOR_HEIGHT + 2.88, z: 3.5, color: '#FFF6E5', intensity: 1.7, distance: 20, castPointLight: true },
  { id: 'adm-l-1-meet', x: 2.3, y: FLOOR_HEIGHT + 2.88, z: -4.0, color: '#FFF8EC', intensity: 1.5, distance: 15, castPointLight: true },
];

export const ADMINISTRATIVE_BUILDING_INTERIOR: InteriorWorld = {
  id: 'administrative-building',
  name: 'Administrative Building',
  subtitle: 'Two-Storey Registry, Bursary & Executive Offices',
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
    z: 5.2,
    yaw: 0,
  },
  exitReturnFallback: {
    x: -41.2,
    y: 0.04,
    z: 43.0,
    yaw: -Math.PI / 2,
  },
};
