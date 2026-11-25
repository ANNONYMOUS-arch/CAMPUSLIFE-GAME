import type { StepSurface } from '../../types/game';
import type {
  InteriorDoorSpec,
  InteriorFurnitureSpec,
  InteriorLightSpec,
  InteriorSurfaceSpec,
  InteriorWorld,
} from '../../types/interior';
import {
  addFloorSlab,
  buildDoorX,
  buildPerimeterShell,
  makeBoxCollider,
} from './interiorHelpers';

interface WorkshopConfig {
  id: string;
  name: string;
  subtitle: string;
  machineVariant: 'wood-lathe' | 'engine-rig' | 'welding-unit' | 'test-bench' | 'cnc-lathe';
  machineLabel: string;
  safetyTitle: string;
  safetySubtitle: string;
  returnX: number;
  returnZ: number;
}

function buildWorkshopInterior(cfg: WorkshopConfig): InteriorWorld {
  const MIN_X = -7.5;
  const MAX_X = 7.5;
  const MIN_Z = -6.5;
  const MAX_Z = 5.5;
  const HEIGHT = 4.2;

  const surfaces: InteriorSurfaceSpec[] = buildPerimeterShell({
    idPrefix: cfg.id,
    minX: MIN_X,
    maxX: MAX_X,
    minZ: MIN_Z,
    maxZ: MAX_Z,
    totalHeight: HEIGHT,
    exitDoorCenterX: 0,
    exitDoorWidth: 1.7,
    exitDoorHeight: 2.5,
  });

  // Safety yellow perimeter floor stripe along north equipment zone
  surfaces.push({
    id: `${cfg.id}-safety-stripe`,
    role: 'trim',
    x: 0,
    y: 0.015,
    z: -2.2,
    width: 12.6,
    height: 0.03,
    depth: 0.14,
    color: '#D4A024',
    collides: false,
  });

  const floorSlabs: StepSurface[] = [];
  addFloorSlab(surfaces, floorSlabs, `${cfg.id}-floor`, MIN_X, MAX_X, MIN_Z, MAX_Z, 0.0, true);

  const doors: InteriorDoorSpec[] = [
    buildDoorX({
      id: `${cfg.id}-door-exit`,
      label: 'Workshop Exit',
      subtitle: 'Workshop Apron',
      floorLevel: 0,
      kind: 'building-exit',
      centerX: 0,
      floorY: 0,
      z: MAX_Z + 0.06,
      width: 1.64,
      height: 2.48,
      swingDir: 1,
    }),
  ];

  const furniture: InteriorFurnitureSpec[] = [
    {
      id: `${cfg.id}-sign-main`,
      kind: 'wall-sign',
      x: 0,
      y: 2.15,
      z: MIN_Z + 0.12,
      rotationY: 0,
      label: cfg.name.toUpperCase(),
      subtitle: cfg.safetySubtitle,
    },
    {
      id: `${cfg.id}-sign-safety`,
      kind: 'wall-sign',
      x: -4.2,
      y: 2.0,
      z: MIN_Z + 0.12,
      rotationY: 0,
      label: cfg.safetyTitle,
      subtitle: 'Static Equipment Bay · PPE Mandatory',
    },
    {
      id: `${cfg.id}-notice`,
      kind: 'noticeboard',
      x: 4.5,
      y: 1.75,
      z: MIN_Z + 0.12,
      rotationY: 0,
    },
    // West & East Workbenches
    {
      id: `${cfg.id}-bench-w`,
      kind: 'workbench',
      x: -4.4,
      y: 0,
      z: 0.5,
      rotationY: 0,
      collider: makeBoxCollider(`${cfg.id}-bw-col`, 'Workshop Bench', -4.4, 0.45, 0.5, 2.4, 0.9, 1.0),
    },
    {
      id: `${cfg.id}-bench-e`,
      kind: 'workbench',
      x: 4.4,
      y: 0,
      z: 0.5,
      rotationY: 0,
      collider: makeBoxCollider(`${cfg.id}-be-col`, 'Workshop Bench', 4.4, 0.45, 0.5, 2.4, 0.9, 1.0),
    },
    // Static Equipment Display Props (no dangerous active interaction)
    {
      id: `${cfg.id}-equip-1`,
      kind: 'workshop-machine',
      variant: cfg.machineVariant,
      x: -3.2,
      y: 0,
      z: -4.2,
      rotationY: 0,
      collider: makeBoxCollider(`${cfg.id}-eq1-col`, cfg.machineLabel, -3.2, 0.75, -4.2, 2.1, 1.5, 1.3),
    },
    {
      id: `${cfg.id}-equip-2`,
      kind: 'workshop-machine',
      variant: cfg.machineVariant,
      x: 3.2,
      y: 0,
      z: -4.2,
      rotationY: 0,
      collider: makeBoxCollider(`${cfg.id}-eq2-col`, cfg.machineLabel, 3.2, 0.75, -4.2, 2.1, 1.5, 1.3),
    },
    // Tool & Material Storage Racks
    {
      id: `${cfg.id}-rack-w`,
      kind: 'storage-rack',
      x: -6.8,
      y: 0,
      z: -3.0,
      rotationY: Math.PI / 2,
      collider: makeBoxCollider(`${cfg.id}-rw-col`, 'Material Storage Rack', -6.8, 1.0, -3.0, 0.65, 2.0, 2.0),
    },
    {
      id: `${cfg.id}-rack-e`,
      kind: 'storage-rack',
      x: 6.8,
      y: 0,
      z: -3.0,
      rotationY: -Math.PI / 2,
      collider: makeBoxCollider(`${cfg.id}-re-col`, 'Tool Storage Rack', 6.8, 1.0, -3.0, 0.65, 2.0, 2.0),
    },
  ];

  const lights: InteriorLightSpec[] = [
    { id: `${cfg.id}-l1`, x: -3.0, y: 3.7, z: -1.0, color: '#F4FAFF', intensity: 1.7, distance: 18, castPointLight: true },
    { id: `${cfg.id}-l2`, x: 3.0, y: 3.7, z: -1.0, color: '#F4FAFF', intensity: 1.7, distance: 18, castPointLight: true },
  ];

  return {
    id: cfg.id,
    name: cfg.name,
    subtitle: cfg.subtitle,
    bounds: {
      minX: MIN_X + 0.12,
      maxX: MAX_X - 0.12,
      minZ: MIN_Z + 0.12,
      maxZ: MAX_Z - 0.12,
    },
    floorHeight: HEIGHT,
    floors: [{ level: 0, elevation: 0.0, label: 'Ground Floor' }],
    floorSlabs,
    rooms: [
      {
        id: `${cfg.id}-floor-bay`,
        name: cfg.name,
        subtitle: cfg.subtitle,
        floorLevel: 0,
        kind: 'workshop',
        minX: MIN_X,
        maxX: MAX_X,
        minZ: MIN_Z,
        maxZ: MAX_Z,
      },
    ],
    surfaces,
    windows: [
      { id: `${cfg.id}-win-w`, x: MIN_X + 0.02, y: 2.3, z: 0.5, width: 3.2, height: 1.2, rotationY: Math.PI / 2 },
      { id: `${cfg.id}-win-e`, x: MAX_X - 0.02, y: 2.3, z: 0.5, width: 3.2, height: 1.2, rotationY: -Math.PI / 2 },
    ],
    doors,
    stairs: [],
    furniture,
    lights,
    spawnPoint: {
      x: 0,
      y: 0.0,
      z: 3.8,
      yaw: 0,
    },
    exitReturnFallback: {
      x: cfg.returnX,
      y: 0.04,
      z: cfg.returnZ,
      yaw: Math.PI / 2,
    },
  };
}

export const CARPENTRY_WORKSHOP_INTERIOR = buildWorkshopInterior({
  id: 'workshop-carpentry',
  name: 'Carpentry and Woodwork Workshop',
  subtitle: 'Timber Joinery, Planing & Pattern Making',
  machineVariant: 'wood-lathe',
  machineLabel: 'Woodworking Bench Saw & Planer (Static)',
  safetyTitle: 'SAFETY: DUST MASKS & GOGGLES',
  safetySubtitle: 'Joinery Benches · Timber Racks · Pattern Tools',
  returnX: -48.5,
  returnZ: -59.4,
});

export const MECHANICAL_WORKSHOP_INTERIOR = buildWorkshopInterior({
  id: 'workshop-mechanical',
  name: 'Mechanical Engineering Workshop',
  subtitle: 'Thermodynamics, Engine Rigs & Mechanics Bay',
  machineVariant: 'engine-rig',
  machineLabel: 'Engine Test Stand & Hydraulic Press (Static)',
  safetyTitle: 'SAFETY: STEEL-TOE BOOTS REQUIRED',
  safetySubtitle: 'Fitting Benches · Engine Test Rigs · Metrology',
  returnX: -48.5,
  returnZ: -66.2,
});

export const WELDING_WORKSHOP_INTERIOR = buildWorkshopInterior({
  id: 'workshop-welding',
  name: 'Welding and Fabrication Workshop',
  subtitle: 'Metal Joining, Sheet Forming & Structural Lab',
  machineVariant: 'welding-unit',
  machineLabel: 'Arc Welding Station & Gas Cylinders (Static)',
  safetyTitle: 'SAFETY: WELDING HELMET & APRON',
  safetySubtitle: 'Fabrication Tables · Shielded Arc Bays · PPE Zone',
  returnX: -48.5,
  returnZ: -73.0,
});

export const ELECTRICAL_WORKSHOP_INTERIOR = buildWorkshopInterior({
  id: 'workshop-electrical',
  name: 'Electrical and Electronics Workshop',
  subtitle: 'Circuit Prototyping, Power Machines & Control Lab',
  machineVariant: 'test-bench',
  machineLabel: 'Electrical Power & Oscilloscope Rack (Static)',
  safetyTitle: 'SAFETY: INSULATED MATS & PPE',
  safetySubtitle: 'ESD Benches · Circuit Test Racks · Switchgear',
  returnX: -48.5,
  returnZ: -79.8,
});

export const MACHINE_SHOP_INTERIOR = buildWorkshopInterior({
  id: 'workshop-machine',
  name: 'Machine Shop',
  subtitle: 'Precision Turning, Milling & Metal Machining',
  machineVariant: 'cnc-lathe',
  machineLabel: 'Centre Lathe & Milling Machine (Static)',
  safetyTitle: 'SAFETY: EYE PROTECTION MANDATORY',
  safetySubtitle: 'Centre Lathes · Milling Stations · Precision Tooling',
  returnX: -48.5,
  returnZ: -86.6,
});

export const ALL_WORKSHOP_INTERIORS: ReadonlyArray<InteriorWorld> = [
  CARPENTRY_WORKSHOP_INTERIOR,
  MECHANICAL_WORKSHOP_INTERIOR,
  WELDING_WORKSHOP_INTERIOR,
  ELECTRICAL_WORKSHOP_INTERIOR,
  MACHINE_SHOP_INTERIOR,
];
