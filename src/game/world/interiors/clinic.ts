import type { StepSurface } from '../../types/game';
import type {
  InteriorDoorSpec,
  InteriorFurnitureSpec,
  InteriorLightSpec,
  InteriorRoom,
  InteriorSurfaceSpec,
  InteriorWindowSpec,
  InteriorWorld,
} from '../../types/interior';
import {
  addFloorSlab,
  buildDoorX,
  buildPerimeterShell,
  buildWall,
  buildWallWithDoorwayX,
  makeBoxCollider,
} from './interiorHelpers';

const FLOOR_HEIGHT = 3.4;
const MIN_X = -11.0;
const MAX_X = 11.0;
const MIN_Z = -8.0;
const MAX_Z = 7.0;

const surfaces: InteriorSurfaceSpec[] = buildPerimeterShell({
  idPrefix: 'cli',
  minX: MIN_X,
  maxX: MAX_X,
  minZ: MIN_Z,
  maxZ: MAX_Z,
  totalHeight: FLOOR_HEIGHT,
  exitDoorCenterX: 0,
  exitDoorWidth: 1.56,
  exitDoorHeight: 2.4,
});

const floorSlabs: StepSurface[] = [];
addFloorSlab(surfaces, floorSlabs, 'cli-floor-0', MIN_X, MAX_X, MIN_Z, MAX_Z, 0.0, true);

// North clinical rooms across corridor at Z = 0.6:
// Consultation 1 (-11.0..-4.2), Consultation 2 (-4.2..2.2), Treatment & Triage Bay (2.2..11.0)
// Staff Duty & Pharmacy Room (West wing south side: -11.0..-4.6, Z: 0.6..7.0, door on X=-4.6? Or along Z=0.6!)
// Let's keep corridor along Z: 0.6..7.0 (with Staff Room at East-South corner X: 5.0..11.0, Z: 0.6..7.0? Better: all 4 rooms cleanly off a wide central corridor Z: 0.6..7.0 with Staff & Pharmacy at X: 5.5..11.0, Z: -8.0..0.6, and Treatment at X: -0.2..5.5, Consultations at -11.0..-5.6 and -5.6..-0.2!)
surfaces.push(
  ...buildWallWithDoorwayX('cli-wall-cons1', -11.0, -5.6, 0.6, 0.0, FLOOR_HEIGHT, -8.3, 1.34, 2.34),
  ...buildWallWithDoorwayX('cli-wall-cons2', -5.6, -0.2, 0.6, 0.0, FLOOR_HEIGHT, -2.9, 1.34, 2.34),
  ...buildWallWithDoorwayX('cli-wall-treat', -0.2, 5.8, 0.6, 0.0, FLOOR_HEIGHT, 2.8, 1.44, 2.34),
  ...buildWallWithDoorwayX('cli-wall-staff', 5.8, 11.0, 0.6, 0.0, FLOOR_HEIGHT, 8.4, 1.34, 2.34),
  buildWall('cli-div-1', -5.6, 0.0, -3.7, 0.22, FLOOR_HEIGHT, 8.6),
  buildWall('cli-div-2', -0.2, 0.0, -3.7, 0.22, FLOOR_HEIGHT, 8.6),
  buildWall('cli-div-3', 5.8, 0.0, -3.7, 0.22, FLOOR_HEIGHT, 8.6)
);

const doors: InteriorDoorSpec[] = [
  buildDoorX({
    id: 'cli-door-exit',
    label: 'Clinic Exit',
    subtitle: 'Ambulance Bay & Plaza',
    floorLevel: 0,
    kind: 'building-exit',
    centerX: 0,
    floorY: 0,
    z: MAX_Z + 0.06,
    width: 1.5,
    height: 2.4,
    swingDir: 1,
  }),
  buildDoorX({
    id: 'cli-door-cons1',
    label: 'Consultation Room 1',
    subtitle: 'Medical Doctor',
    floorLevel: 0,
    centerX: -8.3,
    floorY: 0,
    z: 0.6,
  }),
  buildDoorX({
    id: 'cli-door-cons2',
    label: 'Consultation Room 2',
    subtitle: 'Medical Officer',
    floorLevel: 0,
    centerX: -2.9,
    floorY: 0,
    z: 0.6,
  }),
  buildDoorX({
    id: 'cli-door-treat',
    label: 'Treatment & Triage',
    subtitle: 'First Aid & Observation',
    floorLevel: 0,
    centerX: 2.8,
    floorY: 0,
    z: 0.6,
    width: 1.42,
  }),
  buildDoorX({
    id: 'cli-door-staff',
    label: 'Staff & Pharmacy Area',
    subtitle: 'Authorized Medical Staff',
    floorLevel: 0,
    centerX: 8.4,
    floorY: 0,
    z: 0.6,
  }),
];

const furniture: InteriorFurnitureSpec[] = [
  // Medical Reception & Waiting Hall (Z: 0.6 .. 7.0)
  {
    id: 'cli-reception',
    kind: 'reception-counter',
    x: -4.2,
    y: 0,
    z: 3.1,
    rotationY: 0,
    collider: makeBoxCollider('cli-rec-col', 'Medical Reception Desk', -4.2, 0.55, 3.1, 2.8, 1.1, 1.0),
  },
  {
    id: 'cli-wait-sofa-1',
    kind: 'sofa-bench',
    x: 4.5,
    y: 0,
    z: 5.5,
    rotationY: Math.PI,
    collider: makeBoxCollider('cli-sofa-1-col', 'Waiting Sofa', 4.5, 0.45, 5.5, 2.2, 0.9, 0.9),
  },
  {
    id: 'cli-wait-sofa-2',
    kind: 'sofa-bench',
    x: 8.0,
    y: 0,
    z: 5.5,
    rotationY: Math.PI,
    collider: makeBoxCollider('cli-sofa-2-col', 'Waiting Sofa', 8.0, 0.45, 5.5, 2.2, 0.9, 0.9),
  },
  {
    id: 'cli-wait-sofa-3',
    kind: 'sofa-bench',
    x: -8.2,
    y: 0,
    z: 5.5,
    rotationY: Math.PI,
    collider: makeBoxCollider('cli-sofa-3-col', 'Waiting Sofa', -8.2, 0.45, 5.5, 2.2, 0.9, 0.9),
  },
  { id: 'cli-plant-1', kind: 'potted-plant', x: -1.7, y: 0, z: 6.1, rotationY: 0 },
  { id: 'cli-plant-2', kind: 'potted-plant', x: 1.7, y: 0, z: 6.1, rotationY: 0 },
  { id: 'cli-notice', kind: 'noticeboard', x: -0.2, y: 1.65, z: 0.75, rotationY: 0 },
  {
    id: 'cli-sign',
    kind: 'wall-sign',
    x: 5.5,
    y: 1.85,
    z: 0.75,
    rotationY: 0,
    label: 'CAMPUS MEDICAL CENTRE',
    subtitle: 'Reception · Consultations · Treatment · Pharmacy',
  },

  // Consultation Room 1 (-11.0 .. -5.6)
  {
    id: 'cli-c1-desk',
    kind: 'computer-station',
    x: -8.3,
    y: 0,
    z: -4.8,
    rotationY: 0,
    collider: makeBoxCollider('cli-c1-dcol', 'Doctor Desk', -8.3, 0.45, -4.8, 1.7, 0.9, 0.9),
  },
  { id: 'cli-c1-chair', kind: 'chair', x: -8.3, y: 0, z: -3.2, rotationY: Math.PI },
  {
    id: 'cli-c1-bed',
    kind: 'medical-bed',
    x: -9.6,
    y: 0,
    z: -6.2,
    rotationY: Math.PI / 2,
    collider: makeBoxCollider('cli-c1-bcol', 'Examination Couch', -9.6, 0.45, -6.2, 2.1, 0.9, 1.0),
  },

  // Consultation Room 2 (-5.6 .. -0.2)
  {
    id: 'cli-c2-desk',
    kind: 'computer-station',
    x: -2.9,
    y: 0,
    z: -4.8,
    rotationY: 0,
    collider: makeBoxCollider('cli-c2-dcol', 'Medical Desk', -2.9, 0.45, -4.8, 1.7, 0.9, 0.9),
  },
  { id: 'cli-c2-chair', kind: 'chair', x: -2.9, y: 0, z: -3.2, rotationY: Math.PI },
  {
    id: 'cli-c2-bed',
    kind: 'medical-bed',
    x: -1.5,
    y: 0,
    z: -6.2,
    rotationY: -Math.PI / 2,
    collider: makeBoxCollider('cli-c2-bcol', 'Examination Couch', -1.5, 0.45, -6.2, 2.1, 0.9, 1.0),
  },

  // Treatment Room (-0.2 .. 5.8)
  {
    id: 'cli-tr-bed1',
    kind: 'medical-bed',
    x: 1.5,
    y: 0,
    z: -5.4,
    rotationY: 0,
    collider: makeBoxCollider('cli-tr-b1col', 'Treatment Bed 1', 1.5, 0.45, -5.4, 1.0, 0.9, 2.1),
  },
  {
    id: 'cli-tr-bed2',
    kind: 'medical-bed',
    x: 4.1,
    y: 0,
    z: -5.4,
    rotationY: 0,
    collider: makeBoxCollider('cli-tr-b2col', 'Treatment Bed 2', 4.1, 0.45, -5.4, 1.0, 0.9, 2.1),
  },
  {
    id: 'cli-tr-rack',
    kind: 'storage-rack',
    x: 2.8,
    y: 0,
    z: -7.45,
    rotationY: 0,
    collider: makeBoxCollider('cli-tr-rcol', 'First Aid Supply Rack', 2.8, 1.0, -7.45, 2.0, 2.0, 0.65),
  },

  // Staff Area & Dispensary (5.8 .. 11.0)
  {
    id: 'cli-st-desk',
    kind: 'desk',
    x: 8.4,
    y: 0,
    z: -4.2,
    rotationY: 0,
    collider: makeBoxCollider('cli-st-dcol', 'Nurses Station Desk', 8.4, 0.4, -4.2, 1.7, 0.8, 0.8),
  },
  { id: 'cli-st-chair', kind: 'chair', x: 8.4, y: 0, z: -3.2, rotationY: Math.PI },
  {
    id: 'cli-st-rack',
    kind: 'storage-rack',
    x: 8.4,
    y: 0,
    z: -7.35,
    rotationY: 0,
    collider: makeBoxCollider('cli-st-rcol', 'Dispensary Shelf', 8.4, 1.0, -7.35, 2.0, 2.0, 0.65),
  },
];

const rooms: InteriorRoom[] = [
  {
    id: 'cli-reception',
    name: 'Clinic Reception & Waiting Area',
    subtitle: 'Triage Registration & Patient Lounge',
    floorLevel: 0,
    kind: 'reception',
    minX: MIN_X,
    maxX: MAX_X,
    minZ: 0.6,
    maxZ: MAX_Z,
  },
  {
    id: 'cli-cons1',
    name: 'Consultation Room 1',
    subtitle: 'Outpatient Medical Examination',
    floorLevel: 0,
    kind: 'clinic-bay',
    minX: MIN_X,
    maxX: -5.6,
    minZ: MIN_Z,
    maxZ: 0.6,
  },
  {
    id: 'cli-cons2',
    name: 'Consultation Room 2',
    subtitle: 'Doctor Consultation Suite',
    floorLevel: 0,
    kind: 'clinic-bay',
    minX: -5.6,
    maxX: -0.2,
    minZ: MIN_Z,
    maxZ: 0.6,
  },
  {
    id: 'cli-treatment',
    name: 'Treatment & Observation Room',
    subtitle: 'Wound Care & Recovery Beds',
    floorLevel: 0,
    kind: 'clinic-bay',
    minX: -0.2,
    maxX: 5.8,
    minZ: MIN_Z,
    maxZ: 0.6,
  },
  {
    id: 'cli-staff',
    name: 'Medical Staff & Dispensary Area',
    subtitle: 'Duty Station & Pharmacy Store',
    floorLevel: 0,
    kind: 'office',
    minX: 5.8,
    maxX: MAX_X,
    minZ: MIN_Z,
    maxZ: 0.6,
  },
];

const windows: InteriorWindowSpec[] = [
  { id: 'cli-win-w', x: MIN_X + 0.02, y: 1.75, z: 3.6, width: 3.2, height: 1.45, rotationY: Math.PI / 2 },
  { id: 'cli-win-e', x: MAX_X - 0.02, y: 1.75, z: 3.6, width: 3.2, height: 1.45, rotationY: -Math.PI / 2 },
  { id: 'cli-win-n', x: 2.8, y: 1.75, z: MIN_Z + 0.02, width: 3.2, height: 1.45, rotationY: 0 },
];

const lights: InteriorLightSpec[] = [
  { id: 'cli-l-rec', x: 0, y: 3.05, z: 3.8, color: '#F7FBFF', intensity: 1.8, distance: 20, castPointLight: true },
  { id: 'cli-l-cons', x: -5.5, y: 3.05, z: -3.5, color: '#F7FBFF', intensity: 1.5, distance: 16, castPointLight: true },
  { id: 'cli-l-treat', x: 4.5, y: 3.05, z: -3.5, color: '#F7FBFF', intensity: 1.5, distance: 16, castPointLight: true },
];

export const CLINIC_INTERIOR: InteriorWorld = {
  id: 'clinic',
  name: 'Campus Clinic',
  subtitle: 'Single-Storey University Medical Centre',
  bounds: {
    minX: MIN_X + 0.12,
    maxX: MAX_X - 0.12,
    minZ: MIN_Z + 0.12,
    maxZ: MAX_Z - 0.12,
  },
  floorHeight: FLOOR_HEIGHT,
  floors: [{ level: 0, elevation: 0.0, label: 'Ground Floor' }],
  floorSlabs,
  rooms,
  surfaces,
  windows,
  doors,
  stairs: [],
  furniture,
  lights,
  spawnPoint: {
    x: 0,
    y: 0.0,
    z: 5.2,
    yaw: 0,
  },
  exitReturnFallback: {
    x: -39.5,
    y: 0.04,
    z: 15.0,
    yaw: 0,
  },
};
