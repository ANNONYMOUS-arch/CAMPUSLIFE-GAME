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
  buildStraightStairFlight,
  buildWallWithDoorwayX,
  makeBoxCollider,
} from './interiorHelpers';

function buildUniversityHallInterior(): InteriorWorld {
  const MIN_X = -12.0;
  const MAX_X = 12.0;
  const MIN_Z = -8.0;
  const MAX_Z = 8.0;
  const FLOOR_HEIGHT = 3.4;
  const TOTAL_HEIGHT = FLOOR_HEIGHT * 2; // 6.8m inside 2-storey hall

  const surfaces: InteriorSurfaceSpec[] = buildPerimeterShell({
    idPrefix: 'uhall',
    minX: MIN_X,
    maxX: MAX_X,
    minZ: MIN_Z,
    maxZ: MAX_Z,
    totalHeight: TOTAL_HEIGHT,
    exitDoorCenterX: 0,
    exitDoorWidth: 2.0,
    exitDoorHeight: 2.5,
  });

  const floorSlabs: StepSurface[] = [];
  // Ground floor main slab
  addFloorSlab(surfaces, floorSlabs, 'uhall-g-floor', MIN_X, MAX_X, MIN_Z, MAX_Z, 0.0, true);

  // Raised Auditorium Stage at North end (Z: -8.0..-3.8, elevation: 0.48m)
  surfaces.push({
    id: 'uhall-stage-deck',
    role: 'trim',
    x: 0,
    y: 0.24,
    z: -5.9,
    width: 19.6,
    height: 0.48,
    depth: 4.2,
    color: '#6B3E22',
    collides: true,
    blocksCamera: false,
  });
  floorSlabs.push({
    id: 'uhall-stage-top',
    minX: -9.8,
    maxX: 9.8,
    minZ: -8.0,
    maxZ: -3.8,
    elevation: 0.48,
  });

  // Twin side stage access steps (West & East sides of stage front)
  for (const [sideId, sx] of [
    ['w', -8.0],
    ['e', 8.0],
  ] as const) {
    surfaces.push({
      id: `uhall-stage-step-${sideId}`,
      role: 'trim',
      x: sx,
      y: 0.12,
      z: -3.45,
      width: 2.2,
      height: 0.24,
      depth: 0.7,
      color: '#5C341C',
      collides: true,
      blocksCamera: false,
    });
    floorSlabs.push({
      id: `uhall-stage-step-${sideId}-surf`,
      minX: sx - 1.1,
      maxX: sx + 1.1,
      minZ: -3.82,
      maxZ: -3.08,
      elevation: 0.24,
    });
  }

  // Acoustic timber wall panelling behind stage
  surfaces.push({
    id: 'uhall-stage-backdrop',
    role: 'trim',
    x: 0,
    y: 2.9,
    z: MIN_Z + 0.14,
    width: 15.0,
    height: 4.2,
    depth: 0.12,
    color: '#5B341E',
    collides: false,
  });

  // Ground-floor Foyer partition wall (Z = +4.6) separating entrance vestibule from auditorium seating,
  // stopping at X = +8.2 so the East Staircase (X: 8.6..11.0) climbs cleanly through to the upper balcony
  surfaces.push(
    ...buildWallWithDoorwayX('uhall-foyer-wall', MIN_X, 8.2, 4.6, 0.0, FLOOR_HEIGHT, 0, 2.2, 2.42)
  );

  // Upper Balcony / Mezzanine Floor Slab (Z: +2.0..+8.0, elevation 3.4m, cut around East stairwell X: +7.4..+11.6, Z: +2.0..+7.4)
  addFloorSlab(surfaces, floorSlabs, 'uhall-balcony-main', MIN_X, 7.4, 2.0, MAX_Z, FLOOR_HEIGHT, false);
  // Start collider at 7.75 (> step-15 + PLAYER_RADIUS) with continuous visual trim at 7.4..7.75 so climbing onto 3.4m never snags
  addFloorSlab(surfaces, floorSlabs, 'uhall-balcony-east-north', 7.4, MAX_X, 7.75, MAX_Z, FLOOR_HEIGHT, false, {
    minZ: 7.35,
  });
  surfaces.push({
    id: 'uhall-balcony-east-north-lip',
    role: 'floor',
    x: (7.4 + MAX_X) / 2,
    y: FLOOR_HEIGHT - 0.08,
    z: 7.575,
    width: MAX_X - 7.4,
    height: 0.16,
    depth: 0.35,
    collides: false,
    blocksCamera: true,
  });

  // Open balcony burglary railing overlooking main auditorium & stage (Z = +2.06)
  surfaces.push({
    id: 'uhall-balcony-overlook-rail',
    role: 'railing',
    railingStyle: 'burglary',
    x: -2.3,
    y: FLOOR_HEIGHT + 0.52,
    z: 2.06,
    width: 19.3,
    height: 1.04,
    depth: 0.12,
    collides: true,
    blocksCamera: false,
  });

  // East Staircase (Foyer/Auditorium up to First-Floor Balcony)
  // Climbs North-to-South? Let's climb South-to-North from Z=+7.2 (y=0) toward Z=+1.5 (y=3.4) or North-to-South from Z=+1.8 -> +7.4 so you step onto East Balcony landing Z:+7.4..+8.0
  const balconyStair = buildStraightStairFlight({
    id: 'uhall-stair-east',
    fromFloor: 0,
    toFloor: 1,
    baseElevation: 0.0,
    centerX: 9.8,
    width: 2.4,
    startZ: 1.7,
    direction: 'south',
    stepCount: 16,
    totalRise: FLOOR_HEIGHT,
    totalRun: 5.7,
    includeWestRailing: true,
    includeEastRailing: false,
  });

  const doors: InteriorDoorSpec[] = [
    buildDoorX({
      id: 'uhall-door-exit',
      label: 'Campus Avenue Exit',
      subtitle: 'Campus Entrance Avenue',
      floorLevel: 0,
      kind: 'building-exit',
      centerX: 0,
      floorY: 0,
      z: MAX_Z + 0.06,
      width: 1.96,
      height: 2.46,
      swingDir: 1,
      exitReturnAnchor: {
        x: 54.0,
        y: 0.04,
        z: 104.6,
        yaw: 0,
      },
    }),
    buildDoorX({
      id: 'uhall-door-auditorium',
      label: 'Main Auditorium Double Doors',
      subtitle: 'Ground Floor · Seating & Stage',
      floorLevel: 0,
      centerX: 0,
      floorY: 0,
      z: 4.6,
      width: 2.1,
      height: 2.38,
      swingDir: -1,
      defaultOpen: true,
    }),
  ];

  const furniture: InteriorFurnitureSpec[] = [
    {
      id: 'uhall-sign-main',
      kind: 'wall-sign',
      x: 0,
      y: 3.4,
      z: MIN_Z + 0.24,
      rotationY: 0,
      label: 'UNIVERSITY HALL · AUDITORIUM',
      subtitle: 'Convocation, Matriculation & General Assemblies',
    },
    {
      id: 'uhall-sign-foyer',
      kind: 'wall-sign',
      x: -5.4,
      y: 2.05,
      z: 4.74,
      rotationY: 0,
      label: 'UNIVERSITY HALL FOYER',
      subtitle: 'Stairs Right -> Upper Balcony · Straight Ahead -> Auditorium',
    },
    {
      id: 'uhall-foyer-counter',
      kind: 'reception-counter',
      x: -5.6,
      y: 0,
      z: 6.4,
      rotationY: 0,
      collider: makeBoxCollider('uhall-fc-col', 'Event Registration Desk', -5.6, 0.55, 6.4, 2.7, 1.1, 0.9),
    },
    {
      id: 'uhall-foyer-plant-w',
      kind: 'potted-plant',
      x: -2.4,
      y: 0,
      z: 7.2,
      rotationY: 0,
    },
    {
      id: 'uhall-foyer-plant-e',
      kind: 'potted-plant',
      x: 2.4,
      y: 0,
      z: 7.2,
      rotationY: 0,
    },
    {
      id: 'uhall-stage-lectern',
      kind: 'lectern',
      x: 0,
      y: 0.48,
      z: -4.4,
      rotationY: 0,
      collider: makeBoxCollider('uhall-lec-col', 'Ceremonial Podium', 0, 1.0, -4.4, 0.9, 1.1, 0.7),
    },
    {
      id: 'uhall-stage-bench-w',
      kind: 'sofa-bench',
      x: -4.8,
      y: 0.48,
      z: -6.4,
      rotationY: 0,
      collider: makeBoxCollider('uhall-sbw-col', 'VIP High Table Bench', -4.8, 0.9, -6.4, 2.1, 0.9, 0.8),
    },
    {
      id: 'uhall-stage-bench-e',
      kind: 'sofa-bench',
      x: 4.8,
      y: 0.48,
      z: -6.4,
      rotationY: 0,
      collider: makeBoxCollider('uhall-sbe-col', 'VIP High Table Bench', 4.8, 0.9, -6.4, 2.1, 0.9, 0.8),
    },
  ];

  // Ground-Floor Auditorium Rows (West & East flanks leaving wide center & side aisles)
  const rowZs = [-1.8, -0.3, 1.2, 2.7];
  for (let r = 0; r < rowZs.length; r++) {
    const rz = rowZs[r];
    for (const [sideId, px] of [
      ['w1', -7.2],
      ['w2', -3.2],
      ['e1', 3.2],
      ['e2', 7.2],
    ] as const) {
      furniture.push({
        id: `uhall-pew-${r}-${sideId}`,
        kind: 'fellowship-pew',
        x: px,
        y: 0,
        z: rz,
        rotationY: 0,
        collider: makeBoxCollider(`uhall-pew-${r}-${sideId}-col`, 'Auditorium Row', px, 0.45, rz, 3.4, 0.9, 0.56),
      });
    }
  }

  // First-Floor Upper Balcony Seating & AV Control Booth
  for (const [bId, bx] of [
    ['w1', -8.0],
    ['w2', -3.8],
    ['e1', 1.2],
  ] as const) {
    furniture.push({
      id: `uhall-balc-pew-front-${bId}`,
      kind: 'fellowship-pew',
      x: bx,
      y: FLOOR_HEIGHT,
      z: 3.4,
      rotationY: 0,
      collider: makeBoxCollider(
        `uhall-balc-pf-${bId}-col`,
        'Balcony Gallery Seating',
        bx,
        FLOOR_HEIGHT + 0.45,
        3.4,
        3.4,
        0.9,
        0.56
      ),
    });
    furniture.push({
      id: `uhall-balc-pew-back-${bId}`,
      kind: 'fellowship-pew',
      x: bx,
      y: FLOOR_HEIGHT,
      z: 5.1,
      rotationY: 0,
      collider: makeBoxCollider(
        `uhall-balc-pb-${bId}-col`,
        'Balcony Gallery Seating',
        bx,
        FLOOR_HEIGHT + 0.45,
        5.1,
        3.4,
        0.9,
        0.56
      ),
    });
  }

  furniture.push({
    id: 'uhall-balc-av-desk',
    kind: 'computer-station',
    x: 5.2,
    y: FLOOR_HEIGHT,
    z: 6.2,
    rotationY: Math.PI,
    collider: makeBoxCollider('uhall-av-col', 'Hall Sound & Projection Console', 5.2, FLOOR_HEIGHT + 0.5, 6.2, 1.7, 1.0, 0.9),
  });

  furniture.push({
    id: 'uhall-balc-sign',
    kind: 'wall-sign',
    x: -2.5,
    y: FLOOR_HEIGHT + 2.05,
    z: MAX_Z - 0.14,
    rotationY: Math.PI,
    label: 'FIRST FLOOR GALLERY BALCONY',
    subtitle: 'Public Address & Auditorium Overlook',
  });

  const rooms: InteriorRoom[] = [
    {
      id: 'uhall-foyer',
      name: 'University Hall Entrance Foyer',
      subtitle: 'Ground Floor · Registration & Staircase',
      floorLevel: 0,
      kind: 'lobby',
      minX: MIN_X,
      maxX: MAX_X,
      minZ: 4.6,
      maxZ: MAX_Z,
    },
    {
      id: 'uhall-auditorium',
      name: 'Main Auditorium Hall',
      subtitle: 'Ground Floor · Assemblies & Ceremonies',
      floorLevel: 0,
      kind: 'fellowship-hall',
      minX: MIN_X,
      maxX: MAX_X,
      minZ: -3.8,
      maxZ: 4.6,
    },
    {
      id: 'uhall-stage',
      name: 'University Hall Ceremonial Stage',
      subtitle: 'Ground Floor · High Table & Podium',
      floorLevel: 0,
      kind: 'fellowship-hall',
      minX: -9.8,
      maxX: 9.8,
      minZ: MIN_Z,
      maxZ: -3.8,
    },
    {
      id: 'uhall-balcony',
      name: 'Upper Gallery Balcony',
      subtitle: 'First Floor · Mezzanine Seating & AV Control',
      floorLevel: 1,
      kind: 'fellowship-hall',
      minX: MIN_X,
      maxX: MAX_X,
      minZ: 2.0,
      maxZ: MAX_Z,
    },
  ];

  const windows: InteriorWindowSpec[] = [
    { id: 'uhall-win-w1', x: MIN_X + 0.02, y: 2.0, z: 0.0, width: 3.4, height: 1.5, rotationY: Math.PI / 2 },
    { id: 'uhall-win-w2', x: MIN_X + 0.02, y: 5.1, z: 4.8, width: 2.8, height: 1.2, rotationY: Math.PI / 2 },
    { id: 'uhall-win-e1', x: MAX_X - 0.02, y: 2.0, z: -2.0, width: 3.4, height: 1.5, rotationY: -Math.PI / 2 },
    { id: 'uhall-win-e2', x: MAX_X - 0.02, y: 5.1, z: 4.8, width: 2.8, height: 1.2, rotationY: -Math.PI / 2 },
  ];

  const lights: InteriorLightSpec[] = [
    { id: 'uhall-l-stage', x: 0, y: TOTAL_HEIGHT - 0.4, z: -5.4, color: '#FFF7E4', intensity: 2.0, distance: 22, castPointLight: true },
    { id: 'uhall-l-aud-w', x: -5.5, y: TOTAL_HEIGHT - 0.4, z: -0.5, color: '#FFF9ED', intensity: 1.8, distance: 20, castPointLight: true },
    { id: 'uhall-l-aud-e', x: 5.5, y: TOTAL_HEIGHT - 0.4, z: -0.5, color: '#FFF9ED', intensity: 1.8, distance: 20, castPointLight: true },
    { id: 'uhall-l-foyer', x: 0, y: FLOOR_HEIGHT - 0.35, z: 6.2, color: '#FFFDF7', intensity: 1.6, distance: 16, castPointLight: true },
    { id: 'uhall-l-balc', x: -2.5, y: TOTAL_HEIGHT - 0.4, z: 4.8, color: '#FFF9ED', intensity: 1.6, distance: 18, castPointLight: true },
  ];

  return {
    id: 'university-hall',
    name: 'University Hall',
    subtitle: 'Two-Storey Auditorium, Stage & Gallery Balcony',
    bounds: {
      minX: MIN_X + 0.12,
      maxX: MAX_X - 0.12,
      minZ: MIN_Z + 0.12,
      maxZ: MAX_Z - 0.12,
    },
    floorHeight: FLOOR_HEIGHT,
    floors: [
      { level: 0, elevation: 0.0, label: 'Ground Floor' },
      { level: 1, elevation: FLOOR_HEIGHT, label: 'First Floor Gallery' },
    ],
    floorSlabs,
    rooms,
    surfaces,
    windows,
    doors,
    stairs: [balconyStair],
    furniture,
    lights,
    spawnPoint: {
      x: 0,
      y: 0.0,
      z: 6.6,
      yaw: 0,
    },
    exitReturnFallback: {
      x: 54.0,
      y: 0.04,
      z: 104.6,
      yaw: 0,
    },
  };
}

export const UNIVERSITY_HALL_INTERIOR = buildUniversityHallInterior();
