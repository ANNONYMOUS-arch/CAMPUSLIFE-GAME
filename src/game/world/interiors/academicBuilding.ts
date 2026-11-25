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
  buildCurvedSwitchbackStairFlight,
  buildDoorX,
  buildDoorZ,
  buildPerimeterShell,
  buildStraightStairFlight,
  buildWall,
  buildWallWithDoorwayX,
  buildWallWithDoorwayZ,
  makeBoxCollider,
} from './interiorHelpers';

const FLOOR_HEIGHT = 3.2;
const WALL_CLEAR_HEIGHT = 3.04;
const MIN_X = -34.0;
const MAX_X = 34.0;
const MIN_Z = -28.0;
const MAX_Z = 28.0;

// Central open-to-sky architectural courtyard (NO sitting benches)
const CY_MIN_X = -11.5;
const CY_MAX_X = 11.5;
const CY_MIN_Z = -9.0;
const CY_MAX_Z = 8.0;

// East Lightwell Voids flanking the East Gallery Corridor (X: +11.5..+16.5)
// Bridged at Z: -2.0..0.0 for East Hallway access
const LW_MIN_X = 16.5;
const LW_MAX_X = 19.0;
const LW_N_MIN_Z = -9.0;
const LW_N_MAX_Z = -2.0;
const LW_S_MIN_Z = 0.0;
const LW_S_MAX_Z = 7.0;

// Front Curved Switchback Staircase Pivot & Cutout (Right of Reception, BEFORE Classroom Hallway)
const FRONT_STAIR_CX = 15.0;
const FRONT_STAIR_CZ = 23.6;
const FRONT_STAIR_INNER_R = 1.35;
const FRONT_STAIR_OUTER_R = 3.75;
const FRONT_VOID_MIN_X = 12.6;
const FRONT_VOID_MAX_X = 19.2;
const FRONT_VOID_MIN_Z = 19.8;
const FRONT_VOID_MAX_Z = 27.6;

// Rear Switchback Staircase & Male/Female Toilets at VERY BACK (Z: -28.0..-20.5)
const REAR_CORE_MIN_Z = -28.0;
const REAR_CORE_MAX_Z = -20.5;
const REAR_HALF_LANDING_MAX_Z = -25.4;

const F1_Y = 0.0;
const F2_Y = FLOOR_HEIGHT; // 3.2
const F3_Y = FLOOR_HEIGHT * 2; // 6.4
const F4_Y = FLOOR_HEIGHT * 3; // 9.6

const RAW_CONCRETE_COLOR = '#969DA3';

const surfaces: InteriorSurfaceSpec[] = buildPerimeterShell({
  idPrefix: 'acad',
  minX: MIN_X,
  maxX: MAX_X,
  minZ: MIN_Z,
  maxZ: MAX_Z,
  totalHeight: FLOOR_HEIGHT * 4, // 4 FLOORS (12.8m)
  exitDoorCenterX: 0,
  exitDoorWidth: 1.8,
  exitDoorHeight: 2.45,
  northExitDoorCenterX: -21.0,
  northExitDoorWidth: 1.7,
  northExitDoorHeight: 2.4,
  courtyardOpenings: [
    { minX: CY_MIN_X, maxX: CY_MAX_X, minZ: CY_MIN_Z, maxZ: CY_MAX_Z },
    { minX: LW_MIN_X, maxX: LW_MAX_X, minZ: LW_N_MIN_Z, maxZ: LW_N_MAX_Z },
    { minX: LW_MIN_X, maxX: LW_MAX_X, minZ: LW_S_MIN_Z, maxZ: LW_S_MAX_Z },
  ],
});

const floorSlabs: StepSurface[] = [];

// Ground floor slab covers full footprint
addFloorSlab(surfaces, floorSlabs, 'acad-floor-0', MIN_X, MAX_X, MIN_Z, MAX_Z, 0.0, true);

// Architectural Courtyard Floor Trim & 4 Full-Height Structural Corner Columns (NO sitting benches)
surfaces.push(
  {
    id: 'acad-cy-pad-border-n',
    role: 'trim',
    x: 0,
    y: 0.012,
    z: CY_MIN_Z + 0.45,
    width: CY_MAX_X - CY_MIN_X - 1.0,
    height: 0.024,
    depth: 0.5,
    color: '#D5CBB8',
    collides: false,
  },
  {
    id: 'acad-cy-pad-border-s',
    role: 'trim',
    x: 0,
    y: 0.012,
    z: CY_MAX_Z - 0.45,
    width: CY_MAX_X - CY_MIN_X - 1.0,
    height: 0.024,
    depth: 0.5,
    color: '#D5CBB8',
    collides: false,
  },
  {
    id: 'acad-cy-center-medallion',
    role: 'trim',
    x: 0,
    y: 0.012,
    z: (CY_MIN_Z + CY_MAX_Z) / 2,
    width: 6.2,
    height: 0.024,
    depth: 6.2,
    color: '#DFD6C5',
    collides: false,
  },
  ...[
    ['nw', CY_MIN_X, CY_MIN_Z],
    ['ne', CY_MAX_X, CY_MIN_Z],
    ['sw', CY_MIN_X, CY_MAX_Z],
    ['se', CY_MAX_X, CY_MAX_Z],
  ].map(([tag, cx, cz]) => ({
    id: `acad-cy-col-${tag}`,
    role: 'trim' as const,
    x: cx as number,
    y: (FLOOR_HEIGHT * 4) / 2,
    z: cz as number,
    width: 0.34,
    height: FLOOR_HEIGHT * 4,
    depth: 0.34,
    color: '#E7DEC9',
    collides: true,
    blocksCamera: false,
  }))
);

function pushBurglaryRailing(
  id: string,
  x: number,
  elev: number,
  z: number,
  width: number,
  depth: number
): void {
  surfaces.push({
    id,
    role: 'railing',
    railingStyle: 'burglary',
    x,
    y: elev + 0.52,
    z,
    width,
    height: 1.04,
    depth,
    collides: true,
    blocksCamera: false,
  });
}

// Ground Floor Courtyard & East Lightwell Burglary Railings
pushBurglaryRailing('acad-cy-rail-0-w', CY_MIN_X + 0.06, F1_Y, -0.5, 0.12, 17.0);
pushBurglaryRailing('acad-cy-rail-0-e', CY_MAX_X - 0.06, F1_Y, -0.5, 0.12, 17.0);
pushBurglaryRailing('acad-cy-rail-0-nw', -7.25, F1_Y, CY_MIN_Z + 0.06, 8.5, 0.12);
pushBurglaryRailing('acad-cy-rail-0-ne', 7.25, F1_Y, CY_MIN_Z + 0.06, 8.5, 0.12);
pushBurglaryRailing('acad-cy-rail-0-sw', -7.25, F1_Y, CY_MAX_Z - 0.06, 8.5, 0.12);
pushBurglaryRailing('acad-cy-rail-0-se', 7.25, F1_Y, CY_MAX_Z - 0.06, 8.5, 0.12);

// East Corridor right-side burglary railings facing East Lightwell strips (leaving bridge Z:-2..0 open)
pushBurglaryRailing('acad-lw-rail-0-wn', LW_MIN_X + 0.06, F1_Y, -5.5, 0.12, 7.0);
pushBurglaryRailing('acad-lw-rail-0-ws', LW_MIN_X + 0.06, F1_Y, 3.5, 0.12, 7.0);

// Upper Floor Slabs (Levels 1, 2, 3 -> Floors 2, 3, 4)
// Leaving open:
// - Central Courtyard Void (X: -11.5..+11.5, Z: -9.0..+8.0)
// - Rear Staircase Shaft at VERY BACK (X: -4.0..+4.0, Z: -28.0..-20.5)
// - East Lightwell Voids (X: +16.5..+19.0, Z: -9.0..-2.0 & Z: 0.0..+7.0)
// - Front Curved Switchback Staircase Void (X: +12.6..+19.2, Z: +19.8..+27.6)
for (let lvl = 1; lvl <= 3; lvl++) {
  const elev = Number((lvl * FLOOR_HEIGHT).toFixed(2));

  // Band 1: West Wing + West Gallery (X: -34.0..-11.5)
  addFloorSlab(surfaces, floorSlabs, `acad-f${lvl}-band1`, MIN_X, CY_MIN_X, MIN_Z, MAX_Z, elev);

  // Band 2: Courtyard West Edge Wing (X: -11.5..-4.0)
  addFloorSlab(surfaces, floorSlabs, `acad-f${lvl}-band2-n`, CY_MIN_X, -4.0, MIN_Z, CY_MIN_Z, elev);
  addFloorSlab(surfaces, floorSlabs, `acad-f${lvl}-band2-s`, CY_MIN_X, -4.0, CY_MAX_Z, MAX_Z, elev);

  // Band 3: Rear Staircase Column (X: -4.0..+4.0) -> Shaft open at Z: -28.0..-20.5
  addFloorSlab(surfaces, floorSlabs, `acad-f${lvl}-band3-mid`, -4.0, 4.0, REAR_CORE_MAX_Z, CY_MIN_Z, elev, false, {
    minZ: REAR_CORE_MAX_Z - 0.65,
  });
  addFloorSlab(surfaces, floorSlabs, `acad-f${lvl}-band3-s`, -4.0, 4.0, CY_MAX_Z, MAX_Z, elev);

  // Band 4: Courtyard East Edge + Curved Stair West Landing (X: +4.0..+12.6)
  addFloorSlab(surfaces, floorSlabs, `acad-f${lvl}-band4-n`, 4.0, CY_MAX_X, MIN_Z, CY_MIN_Z, elev);
  addFloorSlab(surfaces, floorSlabs, `acad-f${lvl}-band4-s`, 4.0, FRONT_VOID_MIN_X, CY_MAX_Z, MAX_Z, elev);
  // Extend curved stair exit bridge step surface onto X: +10.2..+13.0, Z: +22.6..+27.6
  floorSlabs.push({
    id: `acad-f${lvl}-front-curved-exit-pad`,
    minX: 10.2,
    maxX: 13.0,
    minZ: 22.6,
    maxZ: 27.6,
    elevation: elev,
  });

  // Band 5: East Gallery North/South + East Lightwell Bridge (X: +11.5..+16.5)
  addFloorSlab(surfaces, floorSlabs, `acad-f${lvl}-band5-n`, CY_MAX_X, LW_MIN_X, MIN_Z, FRONT_VOID_MIN_Z, elev);
  addFloorSlab(
    surfaces,
    floorSlabs,
    `acad-f${lvl}-band5-br-n`,
    FRONT_VOID_MIN_X,
    LW_MIN_X,
    CY_MAX_Z,
    FRONT_VOID_MIN_Z,
    elev,
    false,
    { maxZ: FRONT_VOID_MIN_Z + 0.65 }
  );
  // Close the unused North-West corner of the curved stairwell cutout (X: 12.6..14.45, Z: 19.8..23.0)
  // so players at the bottom step (X ~ 15.0) cannot step sideways into an open shaft
  addFloorSlab(surfaces, floorSlabs, `acad-f${lvl}-front-nw-fill`, FRONT_VOID_MIN_X, 14.45, FRONT_VOID_MIN_Z, 23.0, elev);
  // Thin south perimeter strip along Z = 27.6..28.0
  addFloorSlab(surfaces, floorSlabs, `acad-f${lvl}-band5-s-rim`, FRONT_VOID_MIN_X, FRONT_VOID_MAX_X, FRONT_VOID_MAX_Z, MAX_Z, elev);

  // Band 6: East Lightwell Column (X: +16.5..+19.0) with tiled bridge Z: -2.0..0.0
  addFloorSlab(surfaces, floorSlabs, `acad-f${lvl}-band6-n`, LW_MIN_X, LW_MAX_X, MIN_Z, LW_N_MIN_Z, elev);
  addFloorSlab(surfaces, floorSlabs, `acad-f${lvl}-band6-br`, LW_MIN_X, LW_MAX_X, LW_N_MAX_Z, LW_S_MIN_Z, elev);
  addFloorSlab(surfaces, floorSlabs, `acad-f${lvl}-band6-s`, LW_MIN_X, LW_MAX_X, LW_S_MAX_Z, FRONT_VOID_MIN_Z, elev);

  // Band 7: Front Stair East Skirt / Long Classroom Hallway Strip (X: +19.0..+22.8)
  addFloorSlab(surfaces, floorSlabs, `acad-f${lvl}-band7-hall`, LW_MAX_X, 22.8, MIN_Z, MAX_Z, elev, false, {
    minZ: MIN_Z,
  });

  // Band 8: East Rooms Wing (X: +22.8..+34.0)
  addFloorSlab(surfaces, floorSlabs, `acad-f${lvl}-band8`, 22.8, MAX_X, MIN_Z, MAX_Z, elev);

  // Rear Half-Landings for 2-Flight Rear Switchback Staircase (at Z: -28.0..-25.4, elev - 1.6m)
  const halfElev = Number((elev - FLOOR_HEIGHT * 0.5).toFixed(2));
  addFloorSlab(
    surfaces,
    floorSlabs,
    `acad-rear-half-landing-${lvl}`,
    -4.0,
    4.0,
    MIN_Z,
    REAR_HALF_LANDING_MAX_Z,
    halfElev,
    false,
    { maxZ: REAR_HALF_LANDING_MAX_Z + 0.5 }
  );

  // 4-sided Central Courtyard Burglary Railings on Floors 2, 3, 4
  pushBurglaryRailing(`acad-cy-rail-${lvl}-w`, CY_MIN_X + 0.06, elev, -0.5, 0.12, 17.0);
  pushBurglaryRailing(`acad-cy-rail-${lvl}-e`, CY_MAX_X - 0.06, elev, -0.5, 0.12, 17.0);
  pushBurglaryRailing(`acad-cy-rail-${lvl}-n`, 0, elev, CY_MIN_Z + 0.06, 23.0, 0.12);
  pushBurglaryRailing(`acad-cy-rail-${lvl}-s`, 0, elev, CY_MAX_Z - 0.06, 23.0, 0.12);

  // East Lightwell Burglary Railings
  pushBurglaryRailing(`acad-lw-rail-${lvl}-wn`, LW_MIN_X + 0.06, elev, -5.5, 0.12, 7.0);
  pushBurglaryRailing(`acad-lw-rail-${lvl}-ws`, LW_MIN_X + 0.06, elev, 3.5, 0.12, 7.0);
  pushBurglaryRailing(`acad-lw-rail-${lvl}-en`, LW_MAX_X - 0.06, elev, -5.5, 0.12, 7.0);
  pushBurglaryRailing(`acad-lw-rail-${lvl}-es`, LW_MAX_X - 0.06, elev, 3.5, 0.12, 7.0);
  pushBurglaryRailing(`acad-lw-rail-${lvl}-n`, (LW_MIN_X + LW_MAX_X) / 2, elev, LW_N_MIN_Z + 0.06, 2.5, 0.12);
  pushBurglaryRailing(`acad-lw-rail-${lvl}-bn`, (LW_MIN_X + LW_MAX_X) / 2, elev, LW_N_MAX_Z - 0.06, 2.5, 0.12);
  pushBurglaryRailing(`acad-lw-rail-${lvl}-bs`, (LW_MIN_X + LW_MAX_X) / 2, elev, LW_S_MIN_Z + 0.06, 2.5, 0.12);
  pushBurglaryRailing(`acad-lw-rail-${lvl}-s`, (LW_MIN_X + LW_MAX_X) / 2, elev, LW_S_MAX_Z - 0.06, 2.5, 0.12);

  // Courtyard Fascia Trim Bands
  surfaces.push(
    {
      id: `acad-cy-fascia-${lvl}-w`,
      role: 'trim',
      x: CY_MIN_X - 0.04,
      y: elev - 0.1,
      z: -0.5,
      width: 0.14,
      height: 0.24,
      depth: 17.0,
      color: '#0D3B2E',
      collides: false,
    },
    {
      id: `acad-cy-fascia-${lvl}-e`,
      role: 'trim',
      x: CY_MAX_X + 0.04,
      y: elev - 0.1,
      z: -0.5,
      width: 0.14,
      height: 0.24,
      depth: 17.0,
      color: '#0D3B2E',
      collides: false,
    },
    {
      id: `acad-cy-fascia-${lvl}-n`,
      role: 'trim',
      x: 0,
      y: elev - 0.1,
      z: CY_MIN_Z - 0.04,
      width: 23.0,
      height: 0.24,
      depth: 0.14,
      color: '#0D3B2E',
      collides: false,
    },
    {
      id: `acad-cy-fascia-${lvl}-s`,
      role: 'trim',
      x: 0,
      y: elev - 0.1,
      z: CY_MAX_Z + 0.04,
      width: 23.0,
      height: 0.24,
      depth: 0.14,
      color: '#0D3B2E',
      collides: false,
    }
  );

  // Front Curved Stairwell Cutout Safety Railings (leaving North entry X:14.5..16.7 open on lvl 1-2, and West exit Z:23.6..27.4 open on all floors)
  pushBurglaryRailing(`acad-front-void-rail-e-${lvl}`, FRONT_VOID_MAX_X - 0.06, elev, 23.7, 0.12, 7.6);
  pushBurglaryRailing(`acad-front-void-rail-nw-e-${lvl}`, 14.39, elev, 21.4, 0.12, 3.1);
  pushBurglaryRailing(`acad-front-void-rail-nw-s-${lvl}`, 13.7, elev, 22.94, 1.4, 0.12);
  if (lvl === 3) {
    // Top Floor 4: close North stair entry since there is no 5th floor above
    pushBurglaryRailing(`acad-front-void-rail-n-${lvl}`, 16.7, elev, FRONT_VOID_MIN_Z + 0.06, 4.8, 0.12);
  } else {
    pushBurglaryRailing(`acad-front-void-rail-ne-${lvl}`, 17.9, elev, FRONT_VOID_MIN_Z + 0.06, 2.4, 0.12);
  }

  // Rear Stairwell Mid Divider Rail & Top Floor 4 Guard
  surfaces.push({
    id: `acad-rear-rail-mid-${lvl}`,
    role: 'railing',
    x: 0.0,
    y: elev + 0.52,
    z: -22.95,
    width: 0.12,
    height: 1.04,
    depth: 4.9,
    collides: true,
    blocksCamera: false,
  });
  if (lvl === 3) {
    pushBurglaryRailing(`acad-rear-top-guard-w`, -2.0, elev, REAR_CORE_MAX_Z + 0.06, 3.8, 0.12);
  }
}

// Floor 0 Rear Stairwell Mid Divider & Under-Half-Landing Blocker (Z: -28.0..-25.6)
surfaces.push(
  {
    id: 'acad-rear-rail-mid-0',
    role: 'railing',
    x: 0.0,
    y: 0.52,
    z: -22.95,
    width: 0.12,
    height: 1.04,
    depth: 4.9,
    collides: true,
    blocksCamera: false,
  },
  {
    id: 'acad-rear-understair-half',
    role: 'trim',
    x: 0.0,
    y: 0.72,
    z: -26.8,
    width: 7.5,
    height: 1.44,
    depth: 2.2,
    color: '#DFD6C5',
    collides: true,
  }
);

// Helper: Rear Male Toilet (Left X: -11.5..-4.0) & Female Toilet (Right X: +4.0..+11.5)
// flanking Rear Switchback Staircase (X: -4.0..+4.0) strictly at VERY BACK (Z: -28.0..-20.5)
function pushRearToiletCoreWalls(floorIndex: number, floorY: number): void {
  surfaces.push(
    buildWall(`acad-f${floorIndex}-rear-shaft-w`, -4.0, floorY, -24.25, 0.24, WALL_CLEAR_HEIGHT, 7.5),
    buildWall(`acad-f${floorIndex}-rear-shaft-e`, 4.0, floorY, -24.25, 0.24, WALL_CLEAR_HEIGHT, 7.5),
    buildWall(`acad-f${floorIndex}-male-w`, -11.5, floorY, -24.25, 0.24, WALL_CLEAR_HEIGHT, 7.5),
    ...buildWallWithDoorwayX(
      `acad-f${floorIndex}-male-s`,
      -11.5,
      -4.0,
      REAR_CORE_MAX_Z,
      floorY,
      WALL_CLEAR_HEIGHT,
      -7.75,
      1.36,
      2.34
    ),
    buildWall(`acad-f${floorIndex}-female-e`, 11.5, floorY, -24.25, 0.24, WALL_CLEAR_HEIGHT, 7.5),
    ...buildWallWithDoorwayX(
      `acad-f${floorIndex}-female-s`,
      4.0,
      11.5,
      REAR_CORE_MAX_Z,
      floorY,
      WALL_CLEAR_HEIGHT,
      7.75,
      1.36,
      2.34
    )
  );
}

function buildRawWall(
  id: string,
  x: number,
  floorY: number,
  z: number,
  width: number,
  depth: number
): InteriorSurfaceSpec {
  return buildWall(id, x, floorY, z, width, WALL_CLEAR_HEIGHT, depth, RAW_CONCRETE_COLOR);
}

// ===========================================================================
// FLOOR 1 (level 0, y=0.0):
// - Center South: Enclosed Reception (X: -10.5..+10.5, Z: +15.0..+28.0) with solid rear wall
// - Turning Right (+X): Front Curved Switchback Staircase (X: +10.5..+19.5, Z: +19.5..+28.0) BEFORE Classroom Hallway
// - Past Staircase Turning Left (-Z): 48m Classroom/Lab Hallway (X: +19.0..+22.8) with Dean of BMS Office & BMS/Science Labs on RIGHT (+X)
// - Left Ground-Floor Wing (X: -34.0..-17.5): 5 Engineering Workshops + Hallway & Covered Rear Passage (NO ordinary classrooms/labs!)
// - Very Back Center (Z: -28.0..-20.5): Male Toilet (Left), Rear 2-Flight Switchback Staircase (Center), Female Toilet (Right)
// ===========================================================================
pushRearToiletCoreWalls(0, F1_Y);
surfaces.push(
  // Solid full-height partition wall behind Reception (Z=+15.0, X:-10.5..+10.5)
  buildWall('acad-f0-reception-rear-wall', 0.0, F1_Y, 15.0, 21.0, WALL_CLEAR_HEIGHT, 0.28),
  buildWall('acad-f0-reception-pier-w', -10.5, F1_Y, 17.5, 0.26, WALL_CLEAR_HEIGHT, 5.0),
  buildWall('acad-f0-reception-pier-e', 10.5, F1_Y, 17.5, 0.26, WALL_CLEAR_HEIGHT, 5.0),

  // RIGHT GROUND-FLOOR WING (X: +22.8..+34.0) ALONG CLASSROOM HALLWAY (X: +19.0..+22.8):
  // 1. Academic Records & Faculty Office (Z: +18.0..+28.0)
  ...buildWallWithDoorwayZ('acad-f0-records-w', 22.8, 18.0, 28.0, F1_Y, WALL_CLEAR_HEIGHT, 23.0, 1.44, 2.34),
  buildWall('acad-f0-records-n', 28.4, F1_Y, 18.0, 11.2, WALL_CLEAR_HEIGHT, 0.24),
  // 2. Dean of Basic Medical Sciences Office (Z: +9.0..+18.0) — directly on the right side entering the classroom hallway!
  ...buildWallWithDoorwayZ('acad-f0-dean-w', 22.8, 9.0, 18.0, F1_Y, WALL_CLEAR_HEIGHT, 13.5, 1.44, 2.34),
  buildWall('acad-f0-dean-n', 28.4, F1_Y, 9.0, 11.2, WALL_CLEAR_HEIGHT, 0.24),
  // 3. Medical Nursing Lab (Z: +1.5..+9.0)
  ...buildWallWithDoorwayZ('acad-f0-med-w', 22.8, 1.5, 9.0, F1_Y, WALL_CLEAR_HEIGHT, 5.25, 1.48, 2.34),
  buildWall('acad-f0-med-n', 28.4, F1_Y, 1.5, 11.2, WALL_CLEAR_HEIGHT, 0.24),
  // 4. Mental & Child Nursing Lab (Z: -6.0..+1.5)
  ...buildWallWithDoorwayZ('acad-f0-mcn-w', 22.8, -6.0, 1.5, F1_Y, WALL_CLEAR_HEIGHT, -2.25, 1.48, 2.34),
  buildWall('acad-f0-mcn-n', 28.4, F1_Y, -6.0, 11.2, WALL_CLEAR_HEIGHT, 0.24),
  // 5. History Lab (Z: -13.5..-6.0)
  ...buildWallWithDoorwayZ('acad-f0-hist-w', 22.8, -13.5, -6.0, F1_Y, WALL_CLEAR_HEIGHT, -9.75, 1.48, 2.34),
  buildWall('acad-f0-hist-n', 28.4, F1_Y, -13.5, 11.2, WALL_CLEAR_HEIGHT, 0.24),
  // 6. Physics Lab (Z: -20.8..-13.5)
  ...buildWallWithDoorwayZ('acad-f0-phys-w', 22.8, -20.8, -13.5, F1_Y, WALL_CLEAR_HEIGHT, -17.15, 1.48, 2.34),
  buildWall('acad-f0-phys-n', 28.4, F1_Y, -20.8, 11.2, WALL_CLEAR_HEIGHT, 0.24),
  // 7. Chemistry Lab (Z: -28.0..-20.8)
  ...buildWallWithDoorwayZ('acad-f0-chem-w', 22.8, -28.0, -20.8, F1_Y, WALL_CLEAR_HEIGHT, -24.4, 1.48, 2.34),

  // LEFT GROUND-FLOOR WING (X: -34.0..-23.5) ALONG WORKSHOP HALLWAY (X: -23.5..-17.5):
  // All 5 Engineering Workshops aligned 1:1 with the exterior Workshop Wing (Z: -28.0..+6.0) + PPE Briefing Store (Z: +6.0..+28.0)
  // Zero classrooms or science labs on the left ground floor!
  ...buildWallWithDoorwayZ('acad-f0-ws5-e', -23.5, -28.0, -21.2, F1_Y, WALL_CLEAR_HEIGHT, -24.6, 1.54, 2.38),
  buildWall('acad-f0-ws-d5', -28.75, F1_Y, -21.2, 10.5, WALL_CLEAR_HEIGHT, 0.24),
  ...buildWallWithDoorwayZ('acad-f0-ws4-e', -23.5, -21.2, -14.4, F1_Y, WALL_CLEAR_HEIGHT, -17.8, 1.54, 2.38),
  buildWall('acad-f0-ws-d4', -28.75, F1_Y, -14.4, 10.5, WALL_CLEAR_HEIGHT, 0.24),
  ...buildWallWithDoorwayZ('acad-f0-ws3-e', -23.5, -14.4, -7.6, F1_Y, WALL_CLEAR_HEIGHT, -11.0, 1.54, 2.38),
  buildWall('acad-f0-ws-d3', -28.75, F1_Y, -7.6, 10.5, WALL_CLEAR_HEIGHT, 0.24),
  ...buildWallWithDoorwayZ('acad-f0-ws2-e', -23.5, -7.6, -0.8, F1_Y, WALL_CLEAR_HEIGHT, -4.2, 1.54, 2.38),
  buildWall('acad-f0-ws-d2', -28.75, F1_Y, -0.8, 10.5, WALL_CLEAR_HEIGHT, 0.24),
  ...buildWallWithDoorwayZ('acad-f0-ws1-e', -23.5, -0.8, 6.0, F1_Y, WALL_CLEAR_HEIGHT, 2.6, 1.54, 2.38),
  buildWall('acad-f0-ws-d1', -28.75, F1_Y, 6.0, 10.5, WALL_CLEAR_HEIGHT, 0.24),
  // Engineering Workshop Tool & PPE Store (X: -34.0..-23.5, Z: +6.0..+16.5) & South Vestibule (Z: +16.5..+28.0)
  ...buildWallWithDoorwayZ('acad-f0-ws-tool-e', -23.5, 6.0, 16.5, F1_Y, WALL_CLEAR_HEIGHT, 11.25, 1.5, 2.34),
  buildWall('acad-f0-ws-tool-s', -28.75, F1_Y, 16.5, 10.5, WALL_CLEAR_HEIGHT, 0.24)
);

// ===========================================================================
// FLOOR 2 (level 1, y=3.2): COMPUTER, ENGINEERING & LECTURE FACILITIES
// ===========================================================================
pushRearToiletCoreWalls(1, F2_Y);
surfaces.push(
  // Left Wing (X: -34.0..-17.5): Library (-28..-11), E-library (-11..-2), Comp Workshop (-2..+6.5), Comp Lab (+6.5..+15)
  ...buildWallWithDoorwayZ('acad-f1-lib-e', -17.5, -28.0, -11.0, F2_Y, WALL_CLEAR_HEIGHT, -22.0, 1.5, 2.34),
  ...buildWallWithDoorwayX('acad-f1-lib-elab', -34.0, -17.5, -11.0, F2_Y, WALL_CLEAR_HEIGHT, -25.75, 1.44, 2.34),
  ...buildWallWithDoorwayZ('acad-f1-elab-e', -17.5, -11.0, -2.0, F2_Y, WALL_CLEAR_HEIGHT, -6.5, 1.46, 2.34),
  buildWall('acad-f1-elab-s', -25.75, F2_Y, -2.0, 16.5, WALL_CLEAR_HEIGHT, 0.24),
  ...buildWallWithDoorwayZ('acad-f1-cw-e', -17.5, -2.0, 6.5, F2_Y, WALL_CLEAR_HEIGHT, 2.25, 1.46, 2.34),
  buildWall('acad-f1-cw-s', -25.75, F2_Y, 6.5, 16.5, WALL_CLEAR_HEIGHT, 0.24),
  ...buildWallWithDoorwayZ('acad-f1-clab-e', -17.5, 6.5, 15.0, F2_Y, WALL_CLEAR_HEIGHT, 10.75, 1.46, 2.34),

  // East Wing (X: +22.8..+34.0 along East Hallway +19.0..+22.8):
  // Eng Drawing Studio (-28..-18), Classroom 201 (-18..-10), Classroom 202 (-10..-2), Lab (-2..+6), LH3 (+6..+16)
  ...buildWallWithDoorwayZ('acad-f1-eds-w', 22.8, -28.0, -18.0, F2_Y, WALL_CLEAR_HEIGHT, -23.0, 1.46, 2.34),
  buildWall('acad-f1-ew-d1', 28.4, F2_Y, -18.0, 11.2, WALL_CLEAR_HEIGHT, 0.24),
  ...buildWallWithDoorwayZ('acad-f1-c201-w', 22.8, -18.0, -10.0, F2_Y, WALL_CLEAR_HEIGHT, -14.0, 1.44, 2.34),
  buildWall('acad-f1-ew-d2', 28.4, F2_Y, -10.0, 11.2, WALL_CLEAR_HEIGHT, 0.24),
  ...buildWallWithDoorwayZ('acad-f1-c202-w', 22.8, -10.0, -2.0, F2_Y, WALL_CLEAR_HEIGHT, -6.0, 1.44, 2.34),
  buildWall('acad-f1-ew-d3', 28.4, F2_Y, -2.0, 11.2, WALL_CLEAR_HEIGHT, 0.24),
  ...buildWallWithDoorwayZ('acad-f1-lab-w', 22.8, -2.0, 6.0, F2_Y, WALL_CLEAR_HEIGHT, 2.0, 1.44, 2.34),
  buildWall('acad-f1-ew-d4', 28.4, F2_Y, 6.0, 11.2, WALL_CLEAR_HEIGHT, 0.24),
  ...buildWallWithDoorwayZ('acad-f1-lh3-w', 22.8, 6.0, 16.0, F2_Y, WALL_CLEAR_HEIGHT, 11.0, 1.5, 2.34),
  buildWall('acad-f1-ew-d5', 28.4, F2_Y, 16.0, 11.2, WALL_CLEAR_HEIGHT, 0.24),

  // South-East Eng/Toilet Suite (X: +22.8..+34.0, Z: +16.0..+28.0) opening onto East Hallway
  ...buildWallWithDoorwayZ('acad-f1-cpe-w', 22.8, 16.0, 20.0, F2_Y, WALL_CLEAR_HEIGHT, 18.0, 1.32, 2.34),
  ...buildWallWithDoorwayZ('acad-f1-cve-w', 22.8, 20.0, 24.0, F2_Y, WALL_CLEAR_HEIGHT, 22.0, 1.32, 2.34),
  ...buildWallWithDoorwayZ('acad-f1-tf-w', 22.8, 24.0, 28.0, F2_Y, WALL_CLEAR_HEIGHT, 26.0, 1.24, 2.34),
  buildWall('acad-f1-se-div1', 28.4, F2_Y, 20.0, 11.2, WALL_CLEAR_HEIGHT, 0.24),
  buildWall('acad-f1-se-div2', 28.4, F2_Y, 24.0, 11.2, WALL_CLEAR_HEIGHT, 0.24),

  // South-West Wing (Z: +15.0..+28.0, X: -34.0..+10.0 — clear of Front Curved Staircase X: +10.5..+19.5)
  // Theatre (-34..-18), Lecture Hall 1 (-18..-8.6), Lecture Hall 2 (-8.6..+0.7), Entrepreneurship (+0.7..+10.0)
  ...buildWallWithDoorwayX('acad-f1-theatre-n', -34.0, -18.0, 15.0, F2_Y, WALL_CLEAR_HEIGHT, -26.0, 1.6, 2.34),
  ...buildWallWithDoorwayX('acad-f1-lh1-n', -18.0, -8.6, 15.0, F2_Y, WALL_CLEAR_HEIGHT, -13.3, 1.5, 2.34),
  ...buildWallWithDoorwayX('acad-f1-lh2-n', -8.6, 0.7, 15.0, F2_Y, WALL_CLEAR_HEIGHT, -3.95, 1.5, 2.34),
  ...buildWallWithDoorwayX('acad-f1-elh-n', 0.7, 10.0, 15.0, F2_Y, WALL_CLEAR_HEIGHT, 5.35, 1.5, 2.34),
  buildWall('acad-f1-so-d0', -18.0, F2_Y, 21.5, 0.24, WALL_CLEAR_HEIGHT, 13.0),
  buildWall('acad-f1-so-d1', -8.6, F2_Y, 21.5, 0.24, WALL_CLEAR_HEIGHT, 13.0),
  buildWall('acad-f1-so-d2', 0.7, F2_Y, 21.5, 0.24, WALL_CLEAR_HEIGHT, 13.0),
  buildWall('acad-f1-so-d3', 10.0, F2_Y, 21.5, 0.24, WALL_CLEAR_HEIGHT, 13.0)
);

// ===========================================================================
// FLOOR 3 (level 2, y=6.4): SCHOOL OF ENGINEERING
// 8 Individual Staff Offices + 2 Staff Toilets, 100L Hall, CI, C2, C3, C4, C5, C6
// ===========================================================================
pushRearToiletCoreWalls(2, F3_Y);

const STAFF_BANDS = [
  [-28.0, -20.3],
  [-20.3, -12.6],
  [-12.6, -4.9],
  [-4.9, 2.8],
  [2.8, 10.5],
] as const;

surfaces.push(
  buildWall('acad-f2-staff-e-main', -17.5, F3_Y, -8.75, 0.24, WALL_CLEAR_HEIGHT, 38.5),
  ...buildWallWithDoorwayZ('acad-f2-staff-vest-e', -17.5, 10.5, 15.0, F3_Y, WALL_CLEAR_HEIGHT, 12.75, 1.6, 2.34),
  buildWall('acad-f2-staff-sw', -30.6, F3_Y, 10.5, 6.8, WALL_CLEAR_HEIGHT, 0.24),
  buildWall('acad-f2-staff-se', -20.9, F3_Y, 10.5, 6.8, WALL_CLEAR_HEIGHT, 0.24),
  ...buildWallWithDoorwayX('acad-f2-staff-entry', -27.2, -24.3, 10.5, F3_Y, WALL_CLEAR_HEIGHT, -25.75, 1.5, 2.34)
);

STAFF_BANDS.forEach(([z0, z1], idx) => {
  const cz = (z0 + z1) / 2;
  if (idx > 0) {
    surfaces.push(
      buildWall(`acad-f2-st-hw-${idx}`, -30.6, F3_Y, z0, 6.8, WALL_CLEAR_HEIGHT, 0.22),
      buildWall(`acad-f2-st-he-${idx}`, -20.9, F3_Y, z0, 6.8, WALL_CLEAR_HEIGHT, 0.22)
    );
  }
  surfaces.push(
    ...buildWallWithDoorwayZ(`acad-f2-st-w-${idx}`, -27.2, z0, z1, F3_Y, WALL_CLEAR_HEIGHT, cz, 1.12, 2.3, 0.2),
    ...buildWallWithDoorwayZ(`acad-f2-st-e-${idx}`, -24.3, z0, z1, F3_Y, WALL_CLEAR_HEIGHT, cz, 1.12, 2.3, 0.2)
  );
});

surfaces.push(
  // East Wing (X: +22.8..+34.0 along East Hallway +19.0..+22.8): C5 (-28..-14), C2 (-14..0), C6 (0..+14), C4 (+14..+28)
  ...buildWallWithDoorwayZ('acad-f2-c5-w', 22.8, -28.0, -14.0, F3_Y, WALL_CLEAR_HEIGHT, -21.0, 1.5, 2.34),
  buildWall('acad-f2-ew-div1', 28.4, F3_Y, -14.0, 11.2, WALL_CLEAR_HEIGHT, 0.24),
  ...buildWallWithDoorwayZ('acad-f2-c2-w', 22.8, -14.0, 0.0, F3_Y, WALL_CLEAR_HEIGHT, -7.0, 1.5, 2.34),
  buildWall('acad-f2-ew-div2', 28.4, F3_Y, 0.0, 11.2, WALL_CLEAR_HEIGHT, 0.24),
  ...buildWallWithDoorwayZ('acad-f2-c6-w', 22.8, 0.0, 14.0, F3_Y, WALL_CLEAR_HEIGHT, 7.0, 1.5, 2.34),
  buildWall('acad-f2-ew-div3', 28.4, F3_Y, 14.0, 11.2, WALL_CLEAR_HEIGHT, 0.24),
  ...buildWallWithDoorwayZ('acad-f2-c4-w', 22.8, 14.0, 28.0, F3_Y, WALL_CLEAR_HEIGHT, 21.0, 1.54, 2.34),

  // South-West Wing (X: -34.0..+10.0, Z: +15.0..+28.0): 100L General Hall, 400L Mech (CI), 400L Civil (C3)
  ...buildWallWithDoorwayX('acad-f2-100l-n', -34.0, -18.0, 15.0, F3_Y, WALL_CLEAR_HEIGHT, -26.0, 1.6, 2.34),
  ...buildWallWithDoorwayX('acad-f2-ci-n', -18.0, -4.0, 15.0, F3_Y, WALL_CLEAR_HEIGHT, -11.0, 1.54, 2.34),
  ...buildWallWithDoorwayX('acad-f2-c3-n', -4.0, 10.0, 15.0, F3_Y, WALL_CLEAR_HEIGHT, 3.0, 1.54, 2.34),
  buildWall('acad-f2-so-d1', -18.0, F3_Y, 21.5, 0.24, WALL_CLEAR_HEIGHT, 13.0),
  buildWall('acad-f2-so-d2', -4.0, F3_Y, 21.5, 0.24, WALL_CLEAR_HEIGHT, 13.0),
  buildWall('acad-f2-so-d3', 10.0, F3_Y, 21.5, 0.24, WALL_CLEAR_HEIGHT, 13.0)
);

// ===========================================================================
// FLOOR 4 (level 3, y=9.6): MASS COMMUNICATION & UNDER-CONSTRUCTION 100L WING
// ===========================================================================
pushRearToiletCoreWalls(3, F4_Y);
surfaces.push(
  // Left Wing: Library (Mass Comm) (-28..-4) & Radio Station (-4..+15)
  ...buildWallWithDoorwayZ('acad-f3-lib-e-bypass', -17.5, -28.0, -16.0, F4_Y, WALL_CLEAR_HEIGHT, -22.0, 1.5, 2.34),
  ...buildWallWithDoorwayZ('acad-f3-lib-e-gal', -17.5, -16.0, -4.0, F4_Y, WALL_CLEAR_HEIGHT, -10.5, 1.5, 2.34),
  buildWall('acad-f3-lib-rad-div', -25.75, F4_Y, -4.0, 16.5, WALL_CLEAR_HEIGHT, 0.24),
  ...buildWallWithDoorwayZ('acad-f3-rad-e', -17.5, -4.0, 15.0, F4_Y, WALL_CLEAR_HEIGHT, 5.5, 1.52, 2.34),
  buildWall('acad-f3-rad-s', -25.75, F4_Y, 15.0, 16.5, WALL_CLEAR_HEIGHT, 0.24),

  // Mass Communication Department South-Left (X: -34.0..-1.0, Z: +15.0..+28.0)
  ...buildWallWithDoorwayX('acad-f3-mcomm-n', -34.0, -1.0, 15.0, F4_Y, WALL_CLEAR_HEIGHT, -17.5, 1.6, 2.34),

  // RIGHT SIDE UNDER CONSTRUCTION: 100-Level Classroom A (X: -1.0..+10.0, Z: +15.0..+28.0)
  ...buildWallWithDoorwayX('acad-f3-uc-a-n', -1.0, 10.0, 15.0, F4_Y, WALL_CLEAR_HEIGHT, 4.5, 1.6, 2.34).map((w) => ({
    ...w,
    color: RAW_CONCRETE_COLOR,
  })),
  buildRawWall('acad-f3-uc-a-w', -1.0, F4_Y, 21.5, 0.24, 13.0),
  buildRawWall('acad-f3-uc-a-e', 10.0, F4_Y, 21.5, 0.24, 13.0),

  // RIGHT SIDE UNDER CONSTRUCTION: 100-Level Classroom B (X: +22.8..+34.0, Z: -28.0..+14.0)
  ...buildWallWithDoorwayZ('acad-f3-uc-b-w', 22.8, -28.0, 14.0, F4_Y, WALL_CLEAR_HEIGHT, -2.0, 1.6, 2.34).map((w) => ({
    ...w,
    color: RAW_CONCRETE_COLOR,
  })),
  buildRawWall('acad-f3-uc-b-s', 28.4, F4_Y, 14.0, 11.2, 0.24)
);

// ===========================================================================
// INTERACTIVE DOORS ACROSS ALL 4 FLOORS
// ===========================================================================
function makeRearToiletDoors(floorIdx: number, floorY: number): InteriorDoorSpec[] {
  return [
    buildDoorX({
      id: `acad-door-f${floorIdx}-male-toilet`,
      label: floorIdx === 0 ? 'Bathroom & Male Toilet' : 'Male Toilet',
      subtitle: floorIdx === 0 ? 'Floor 1 Rear Restroom' : 'Rear Staircase Left',
      floorLevel: floorIdx,
      centerX: -7.75,
      floorY,
      z: REAR_CORE_MAX_Z,
      width: 1.32,
    }),
    buildDoorX({
      id: `acad-door-f${floorIdx}-female-toilet`,
      label: floorIdx === 0 ? 'Bathroom & Female Toilet' : 'Female Toilet',
      subtitle: floorIdx === 0 ? 'Floor 1 Rear Restroom' : 'Rear Staircase Right',
      floorLevel: floorIdx,
      centerX: 7.75,
      floorY,
      z: REAR_CORE_MAX_Z,
      width: 1.32,
    }),
  ];
}

const staffDoors: InteriorDoorSpec[] = [
  buildDoorZ({
    id: 'acad-door-f2-staff-vestibule',
    label: 'Staff Offices Suite',
    subtitle: 'School of Engineering · 8 Offices & 2 Toilets',
    floorLevel: 2,
    x: -17.5,
    floorY: F3_Y,
    centerZ: 12.75,
    width: 1.54,
    swingDir: -1,
    defaultOpen: true,
  }),
  buildDoorX({
    id: 'acad-door-f2-staff-entry',
    label: 'Staff Offices Corridor',
    subtitle: 'Offices 301–308 & Restrooms',
    floorLevel: 2,
    centerX: -25.75,
    floorY: F3_Y,
    z: 10.5,
    width: 1.44,
    defaultOpen: true,
  }),
  ...STAFF_BANDS.flatMap(([z0, z1], idx) => {
    const cz = (z0 + z1) / 2;
    const isToiletRow = idx === 4;
    return [
      buildDoorZ({
        id: `acad-door-f2-st-w-${idx}`,
        label: isToiletRow ? 'Staff Toilet 1' : `Staff Office 30${idx + 1}`,
        subtitle: isToiletRow ? 'Staff Office Restroom' : 'School of Engineering',
        floorLevel: 2,
        x: -27.2,
        floorY: F3_Y,
        centerZ: cz,
        width: 1.08,
        swingDir: -1,
      }),
      buildDoorZ({
        id: `acad-door-f2-st-e-${idx}`,
        label: isToiletRow ? 'Staff Toilet 2' : `Staff Office 30${idx + 5}`,
        subtitle: isToiletRow ? 'Staff Office Restroom' : 'School of Engineering',
        floorLevel: 2,
        x: -24.3,
        floorY: F3_Y,
        centerZ: cz,
        width: 1.08,
        swingDir: 1,
      }),
    ];
  }),
];

const doors: InteriorDoorSpec[] = [
  buildDoorX({
    id: 'acad-door-exit',
    label: 'Academic Building Exit',
    subtitle: 'Academic Forecourt & Roundabout',
    floorLevel: 0,
    kind: 'building-exit',
    centerX: 0,
    floorY: F1_Y,
    z: MAX_Z + 0.06,
    width: 1.74,
    height: 2.42,
    swingDir: 1,
    exitReturnAnchor: {
      x: 0.0,
      y: 0.04,
      z: -30.8,
      yaw: Math.PI,
    },
  }),
  buildDoorX({
    id: 'acad-door-workshop-exit',
    label: 'Rear Workshop Passage Exit',
    subtitle: 'Covered Passage to Workshops',
    floorLevel: 0,
    kind: 'building-exit',
    centerX: -21.0,
    floorY: F1_Y,
    z: MIN_Z - 0.06,
    width: 1.64,
    height: 2.4,
    swingDir: -1,
    exitReturnAnchor: {
      x: -21.0,
      y: 0.04,
      z: -91.8,
      yaw: Math.PI / 2,
    },
  }),

  // Floor 1 (level 0)
  ...makeRearToiletDoors(0, F1_Y),

  // Floor 1 Right-Side Hallway (X: 22.8): Records Office, Dean of BMS Office & 5 BMS/Science Labs
  buildDoorZ({
    id: 'acad-door-f0-records-office',
    label: 'Academic Records & Faculty Office',
    subtitle: 'Right Hallway South-East',
    floorLevel: 0,
    x: 22.8,
    floorY: F1_Y,
    centerZ: 23.0,
    width: 1.4,
    swingDir: 1,
  }),
  buildDoorZ({
    id: 'acad-door-f0-dean-bms',
    label: 'Dean of Basic Medical Sciences',
    subtitle: 'Room 101 · Right of Classroom Hallway',
    floorLevel: 0,
    x: 22.8,
    floorY: F1_Y,
    centerZ: 13.5,
    width: 1.4,
    swingDir: 1,
  }),
  buildDoorZ({
    id: 'acad-door-f0-med-nursing',
    label: 'Medical Nursing Laboratory',
    subtitle: 'Room 102 · Ward Beds & Mannequins',
    floorLevel: 0,
    x: 22.8,
    floorY: F1_Y,
    centerZ: 5.25,
    width: 1.44,
    swingDir: 1,
  }),
  buildDoorZ({
    id: 'acad-door-f0-mental-nursing',
    label: 'Mental & Child Nursing Lab',
    subtitle: 'Room 103 · Pediatric Beds & Mannequins',
    floorLevel: 0,
    x: 22.8,
    floorY: F1_Y,
    centerZ: -2.25,
    width: 1.44,
    swingDir: 1,
  }),
  buildDoorZ({
    id: 'acad-door-f0-history-lab',
    label: 'History Laboratory',
    subtitle: 'Room 104 · Medical Heritage & Specimens',
    floorLevel: 0,
    x: 22.8,
    floorY: F1_Y,
    centerZ: -9.75,
    width: 1.44,
    swingDir: 1,
  }),
  buildDoorZ({
    id: 'acad-door-f0-physics-lab',
    label: 'Physics Laboratory',
    subtitle: 'Room 105 · Optics & Electromagnetism',
    floorLevel: 0,
    x: 22.8,
    floorY: F1_Y,
    centerZ: -17.15,
    width: 1.44,
    swingDir: 1,
  }),
  buildDoorZ({
    id: 'acad-door-f0-chemistry-lab',
    label: 'Chemistry Laboratory',
    subtitle: 'Room 106 · Analytical & Wet Chemistry',
    floorLevel: 0,
    x: 22.8,
    floorY: F1_Y,
    centerZ: -24.4,
    width: 1.44,
    swingDir: 1,
  }),

  // Floor 1 Left-Side Hallway (X: -23.5): 5 Engineering Workshops + Tool/PPE Store
  buildDoorZ({
    id: 'acad-door-f0-ws-carpentry',
    label: 'Carpentry & Woodwork Workshop',
    subtitle: 'Workshop 1 · Left Corridor',
    floorLevel: 0,
    x: -23.5,
    floorY: F1_Y,
    centerZ: 2.6,
    width: 1.48,
    swingDir: -1,
  }),
  buildDoorZ({
    id: 'acad-door-f0-ws-mechanical',
    label: 'Mechanical Engineering Workshop',
    subtitle: 'Workshop 2 · Left Corridor',
    floorLevel: 0,
    x: -23.5,
    floorY: F1_Y,
    centerZ: -4.2,
    width: 1.48,
    swingDir: -1,
  }),
  buildDoorZ({
    id: 'acad-door-f0-ws-welding',
    label: 'Welding & Fabrication Workshop',
    subtitle: 'Workshop 3 · Left Corridor',
    floorLevel: 0,
    x: -23.5,
    floorY: F1_Y,
    centerZ: -11.0,
    width: 1.48,
    swingDir: -1,
  }),
  buildDoorZ({
    id: 'acad-door-f0-ws-electrical',
    label: 'Electrical & Electronics Workshop',
    subtitle: 'Workshop 4 · Left Corridor',
    floorLevel: 0,
    x: -23.5,
    floorY: F1_Y,
    centerZ: -17.8,
    width: 1.48,
    swingDir: -1,
  }),
  buildDoorZ({
    id: 'acad-door-f0-ws-machine',
    label: 'Machine Shop (Workshop 5)',
    subtitle: 'Workshop 5 · Rear Bypass Corridor',
    floorLevel: 0,
    x: -23.5,
    floorY: F1_Y,
    centerZ: -24.6,
    width: 1.48,
    swingDir: -1,
  }),
  buildDoorZ({
    id: 'acad-door-f0-ws-tool-store',
    label: 'Workshop Tool & PPE Issue Store',
    subtitle: 'Engineering Support Room',
    floorLevel: 0,
    x: -23.5,
    floorY: F1_Y,
    centerZ: 11.25,
    width: 1.44,
    swingDir: -1,
  }),

  // Floor 2 (level 1)
  ...makeRearToiletDoors(1, F2_Y),
  buildDoorZ({
    id: 'acad-door-f1-library',
    label: 'Academic Library',
    subtitle: 'Floor 2 Left Wing',
    floorLevel: 1,
    x: -17.5,
    floorY: F2_Y,
    centerZ: -22.0,
    width: 1.44,
    swingDir: -1,
  }),
  buildDoorX({
    id: 'acad-door-f1-lib-to-elab',
    label: 'E-library (Library Wing)',
    subtitle: 'Direct Access from Library',
    floorLevel: 1,
    centerX: -25.75,
    floorY: F2_Y,
    z: -11.0,
    width: 1.4,
    defaultOpen: true,
  }),
  buildDoorZ({
    id: 'acad-door-f1-elab-corridor',
    label: 'E-library',
    subtitle: 'Digital Terminals & Journals',
    floorLevel: 1,
    x: -17.5,
    floorY: F2_Y,
    centerZ: -6.5,
    width: 1.4,
    swingDir: -1,
  }),
  buildDoorZ({
    id: 'acad-door-f1-comp-workshop',
    label: 'Computer Workshop',
    subtitle: 'Hardware Assembly & Servicing',
    floorLevel: 1,
    x: -17.5,
    floorY: F2_Y,
    centerZ: 2.25,
    width: 1.4,
    swingDir: -1,
  }),
  buildDoorZ({
    id: 'acad-door-f1-comp-lab',
    label: 'Computer Laboratory',
    subtitle: 'Workstation & Programming Lab',
    floorLevel: 1,
    x: -17.5,
    floorY: F2_Y,
    centerZ: 10.75,
    width: 1.4,
    swingDir: -1,
  }),
  buildDoorX({
    id: 'acad-door-f1-theatre',
    label: 'Theatre (Floor 2 Left)',
    subtitle: 'Tiered Presentation Theatre',
    floorLevel: 1,
    centerX: -26.0,
    floorY: F2_Y,
    z: 15.0,
    width: 1.54,
    swingDir: 1,
  }),
  buildDoorX({
    id: 'acad-door-f1-lh1',
    label: 'Lecture Hall 1',
    subtitle: 'General Engineering Lectures',
    floorLevel: 1,
    centerX: -13.3,
    floorY: F2_Y,
    z: 15.0,
    width: 1.46,
    swingDir: 1,
  }),
  buildDoorX({
    id: 'acad-door-f1-lh2',
    label: 'Lecture Hall 2',
    subtitle: 'General Engineering Lectures',
    floorLevel: 1,
    centerX: -3.95,
    floorY: F2_Y,
    z: 15.0,
    width: 1.46,
    swingDir: 1,
  }),
  buildDoorX({
    id: 'acad-door-f1-entrepreneurship',
    label: 'Entrepreneurship Lecture Hall',
    subtitle: 'Enterprise & Innovation Studies',
    floorLevel: 1,
    centerX: 5.35,
    floorY: F2_Y,
    z: 15.0,
    width: 1.46,
    swingDir: 1,
  }),
  buildDoorZ({
    id: 'acad-door-f1-drawing-studio',
    label: 'Engineering Drawing Studio',
    subtitle: 'CAD & Drafting Boards',
    floorLevel: 1,
    x: 22.8,
    floorY: F2_Y,
    centerZ: -23.0,
    width: 1.4,
    swingDir: 1,
  }),
  buildDoorZ({
    id: 'acad-door-f1-c201',
    label: 'Classroom 201',
    subtitle: 'Floor 2 East Wing',
    floorLevel: 1,
    x: 22.8,
    floorY: F2_Y,
    centerZ: -14.0,
    width: 1.38,
    swingDir: 1,
  }),
  buildDoorZ({
    id: 'acad-door-f1-c202',
    label: 'Classroom 202',
    subtitle: 'Floor 2 East Wing',
    floorLevel: 1,
    x: 22.8,
    floorY: F2_Y,
    centerZ: -6.0,
    width: 1.38,
    swingDir: 1,
  }),
  buildDoorZ({
    id: 'acad-door-f1-lab',
    label: 'Laboratory',
    subtitle: 'Applied Engineering Lab',
    floorLevel: 1,
    x: 22.8,
    floorY: F2_Y,
    centerZ: 2.0,
    width: 1.38,
    swingDir: 1,
  }),
  buildDoorZ({
    id: 'acad-door-f1-lh3',
    label: 'Lecture Hall 3',
    subtitle: 'General Engineering Lectures',
    floorLevel: 1,
    x: 22.8,
    floorY: F2_Y,
    centerZ: 11.0,
    width: 1.46,
    swingDir: 1,
  }),
  buildDoorZ({
    id: 'acad-door-f1-comp-eng',
    label: 'Computer Engineering Dept',
    subtitle: 'Department Office',
    floorLevel: 1,
    x: 22.8,
    floorY: F2_Y,
    centerZ: 18.0,
    width: 1.26,
    swingDir: 1,
  }),
  buildDoorZ({
    id: 'acad-door-f1-civil-eng',
    label: 'Civil Engineering Dept',
    subtitle: 'Department Office',
    floorLevel: 1,
    x: 22.8,
    floorY: F2_Y,
    centerZ: 22.0,
    width: 1.26,
    swingDir: 1,
  }),
  buildDoorZ({
    id: 'acad-door-f1-toilet-fac',
    label: 'Toilet Facilities',
    subtitle: 'Floor 2 South-East Restrooms',
    floorLevel: 1,
    x: 22.8,
    floorY: F2_Y,
    centerZ: 26.0,
    width: 1.2,
    swingDir: 1,
  }),

  // Floor 3 (level 2)
  ...makeRearToiletDoors(2, F3_Y),
  ...staffDoors,
  buildDoorZ({
    id: 'acad-door-f2-c5',
    label: '400L Computer Eng (C5)',
    subtitle: 'Room C5 · Computer Engineering',
    floorLevel: 2,
    x: 22.8,
    floorY: F3_Y,
    centerZ: -21.0,
    width: 1.44,
    swingDir: 1,
  }),
  buildDoorZ({
    id: 'acad-door-f2-c2',
    label: 'Classroom C2',
    subtitle: 'School of Engineering',
    floorLevel: 2,
    x: 22.8,
    floorY: F3_Y,
    centerZ: -7.0,
    width: 1.44,
    swingDir: 1,
  }),
  buildDoorZ({
    id: 'acad-door-f2-c6',
    label: 'Classroom C6',
    subtitle: 'School of Engineering',
    floorLevel: 2,
    x: 22.8,
    floorY: F3_Y,
    centerZ: 7.0,
    width: 1.44,
    swingDir: 1,
  }),
  buildDoorZ({
    id: 'acad-door-f2-c4',
    label: '500L Civil Eng (C4)',
    subtitle: 'Room C4 · Civil Engineering',
    floorLevel: 2,
    x: 22.8,
    floorY: F3_Y,
    centerZ: 21.0,
    width: 1.48,
    swingDir: 1,
  }),
  buildDoorX({
    id: 'acad-door-f2-100l-hall',
    label: '100-level General Lecture Hall',
    subtitle: 'Engineering Foundation Hall',
    floorLevel: 2,
    centerX: -26.0,
    floorY: F3_Y,
    z: 15.0,
    width: 1.54,
    swingDir: 1,
  }),
  buildDoorX({
    id: 'acad-door-f2-ci',
    label: '400L Mechanical Eng (CI)',
    subtitle: 'Room CI · Mechanical Engineering',
    floorLevel: 2,
    centerX: -11.0,
    floorY: F3_Y,
    z: 15.0,
    width: 1.48,
    swingDir: 1,
  }),
  buildDoorX({
    id: 'acad-door-f2-c3',
    label: '400L Civil Eng (C3)',
    subtitle: 'Room C3 · Civil Engineering',
    floorLevel: 2,
    centerX: 3.0,
    floorY: F3_Y,
    z: 15.0,
    width: 1.48,
    swingDir: 1,
  }),

  // Floor 4 (level 3)
  ...makeRearToiletDoors(3, F4_Y),
  buildDoorZ({
    id: 'acad-door-f3-library-bypass',
    label: 'Mass Comm Library (North)',
    subtitle: 'Floor 4 Left Wing',
    floorLevel: 3,
    x: -17.5,
    floorY: F4_Y,
    centerZ: -22.0,
    width: 1.44,
    swingDir: -1,
  }),
  buildDoorZ({
    id: 'acad-door-f3-library-gal',
    label: 'Mass Comm Library',
    subtitle: 'Media & Research Collection',
    floorLevel: 3,
    x: -17.5,
    floorY: F4_Y,
    centerZ: -10.5,
    width: 1.44,
    swingDir: -1,
  }),
  buildDoorZ({
    id: 'acad-door-f3-radio',
    label: 'Campus Radio Station',
    subtitle: 'Broadcast & Sound Studio',
    floorLevel: 3,
    x: -17.5,
    floorY: F4_Y,
    centerZ: 5.5,
    width: 1.46,
    swingDir: -1,
  }),
  buildDoorX({
    id: 'acad-door-f3-masscomm',
    label: 'Mass Communication Dept',
    subtitle: 'Journalism & Media Studies',
    floorLevel: 3,
    centerX: -17.5,
    floorY: F4_Y,
    z: 15.0,
    width: 1.54,
    swingDir: 1,
  }),
  buildDoorX({
    id: 'acad-door-f3-uc-a',
    label: '100L Classroom A (Construction)',
    subtitle: 'UNDER CONSTRUCTION · Hard Hat Zone',
    floorLevel: 3,
    centerX: 4.5,
    floorY: F4_Y,
    z: 15.0,
    width: 1.54,
    swingDir: 1,
  }),
  buildDoorZ({
    id: 'acad-door-f3-uc-b',
    label: '100L Classroom B (Construction)',
    subtitle: 'UNDER CONSTRUCTION · Hard Hat Zone',
    floorLevel: 3,
    x: 22.8,
    floorY: F4_Y,
    centerZ: -2.0,
    width: 1.54,
    swingDir: 1,
  }),
];

// ===========================================================================
// TWO 4-FLOOR STAIRCASES:
// 1. FRONT CURVED SWITCHBACK STAIRCASE (X:+10.5..+19.5, Z:+19.5..+27.8) BEFORE Classroom Hallway
// 2. REAR 2-FLIGHT SWITCHBACK STAIRCASE (X:-4.0..+4.0, Z:-28.0..-20.5) BETWEEN MALE & FEMALE TOILETS
// ===========================================================================
const stairs: InteriorStairSpec[] = [
  // Front Curved Switchback Flights (0->1, 1->2, 2->3)
  // Enters from North side (15.0, 21.05) sweeping East -> South (+Z with Main Lobby on the RIGHT) -> West landing (12.6, 24.9)
  buildCurvedSwitchbackStairFlight({
    id: 'acad-front-stair-0-1',
    fromFloor: 0,
    toFloor: 1,
    baseElevation: F1_Y,
    centerX: FRONT_STAIR_CX,
    centerZ: FRONT_STAIR_CZ,
    innerRadius: FRONT_STAIR_INNER_R,
    outerRadius: FRONT_STAIR_OUTER_R,
    startAngle: -Math.PI * 0.52,
    endAngle: Math.PI * 0.84,
    stepCount: 16,
    totalRise: FLOOR_HEIGHT,
  }),
  buildCurvedSwitchbackStairFlight({
    id: 'acad-front-stair-1-2',
    fromFloor: 1,
    toFloor: 2,
    baseElevation: F2_Y,
    centerX: FRONT_STAIR_CX,
    centerZ: FRONT_STAIR_CZ,
    innerRadius: FRONT_STAIR_INNER_R,
    outerRadius: FRONT_STAIR_OUTER_R,
    startAngle: -Math.PI * 0.52,
    endAngle: Math.PI * 0.84,
    stepCount: 16,
    totalRise: FLOOR_HEIGHT,
  }),
  buildCurvedSwitchbackStairFlight({
    id: 'acad-front-stair-2-3',
    fromFloor: 2,
    toFloor: 3,
    baseElevation: F3_Y,
    centerX: FRONT_STAIR_CX,
    centerZ: FRONT_STAIR_CZ,
    innerRadius: FRONT_STAIR_INNER_R,
    outerRadius: FRONT_STAIR_OUTER_R,
    startAngle: -Math.PI * 0.52,
    endAngle: Math.PI * 0.84,
    stepCount: 16,
    totalRise: FLOOR_HEIGHT,
  }),

  // Rear 2-Flight Switchback Staircase at VERY BACK (Z: -28.0..-20.5)
  // West lane (-2.0) climbs North (Z: -20.9 -> -25.4) to Rear Half-Landing; East lane (+2.0) climbs South (Z: -25.4 -> -20.9)
  buildStraightStairFlight({
    id: 'acad-rear-stair-0-1-a',
    fromFloor: 0,
    toFloor: 1,
    baseElevation: F1_Y,
    centerX: -2.0,
    width: 3.2,
    startZ: -20.9,
    direction: 'north',
    stepCount: 8,
    totalRise: FLOOR_HEIGHT * 0.5,
    totalRun: 4.5,
  }),
  buildStraightStairFlight({
    id: 'acad-rear-stair-0-1-b',
    fromFloor: 0,
    toFloor: 1,
    baseElevation: F1_Y + FLOOR_HEIGHT * 0.5,
    centerX: 2.0,
    width: 3.2,
    startZ: -25.4,
    direction: 'south',
    stepCount: 8,
    totalRise: FLOOR_HEIGHT * 0.5,
    totalRun: 4.5,
  }),
  buildStraightStairFlight({
    id: 'acad-rear-stair-1-2-a',
    fromFloor: 1,
    toFloor: 2,
    baseElevation: F2_Y,
    centerX: -2.0,
    width: 3.2,
    startZ: -20.9,
    direction: 'north',
    stepCount: 8,
    totalRise: FLOOR_HEIGHT * 0.5,
    totalRun: 4.5,
  }),
  buildStraightStairFlight({
    id: 'acad-rear-stair-1-2-b',
    fromFloor: 1,
    toFloor: 2,
    baseElevation: F2_Y + FLOOR_HEIGHT * 0.5,
    centerX: 2.0,
    width: 3.2,
    startZ: -25.4,
    direction: 'south',
    stepCount: 8,
    totalRise: FLOOR_HEIGHT * 0.5,
    totalRun: 4.5,
  }),
  buildStraightStairFlight({
    id: 'acad-rear-stair-2-3-a',
    fromFloor: 2,
    toFloor: 3,
    baseElevation: F3_Y,
    centerX: -2.0,
    width: 3.2,
    startZ: -20.9,
    direction: 'north',
    stepCount: 8,
    totalRise: FLOOR_HEIGHT * 0.5,
    totalRun: 4.5,
  }),
  buildStraightStairFlight({
    id: 'acad-rear-stair-2-3-b',
    fromFloor: 2,
    toFloor: 3,
    baseElevation: F3_Y + FLOOR_HEIGHT * 0.5,
    centerX: 2.0,
    width: 3.2,
    startZ: -25.4,
    direction: 'south',
    stepCount: 8,
    totalRise: FLOOR_HEIGHT * 0.5,
    totalRun: 4.5,
  }),
];

// ===========================================================================
// DISCIPLINE-SPECIFIC FURNITURE GENERATORS
// ===========================================================================
function pushClassroomRows(
  list: InteriorFurnitureSpec[],
  prefix: string,
  floorY: number,
  cx: number,
  cz: number,
  boardWallZ: number,
  title: string,
  subtitle: string,
  cols: number,
  rows: number,
  dx = 2.4,
  dz = 2.1
): void {
  const boardDir = boardWallZ > cz ? Math.PI : 0;
  const wallOffset = boardWallZ > cz ? -0.16 : 0.16;
  const faceTowardBoard = boardWallZ > cz ? 0 : Math.PI;
  const lecternZ = boardWallZ + (boardWallZ > cz ? -1.4 : 1.4);

  list.push(
    {
      id: `${prefix}-board`,
      kind: 'whiteboard',
      x: cx,
      y: floorY + 1.55,
      z: boardWallZ + wallOffset,
      rotationY: boardDir,
    },
    {
      id: `${prefix}-sign`,
      kind: 'wall-sign',
      x: cx,
      y: floorY + 2.55,
      z: boardWallZ + wallOffset,
      rotationY: boardDir,
      label: title.toUpperCase(),
      subtitle,
    },
    {
      id: `${prefix}-lectern`,
      kind: 'lectern',
      x: cx,
      y: floorY,
      z: lecternZ,
      rotationY: boardDir,
      collider: makeBoxCollider(`${prefix}-lec-col`, 'Lectern', cx, floorY + 0.54, lecternZ, 0.9, 1.1, 0.7),
    }
  );

  const rowDir = boardWallZ > cz ? -1 : 1;
  const firstRowZ = lecternZ + rowDir * 2.2;
  for (let r = 0; r < rows; r++) {
    const rz = firstRowZ + rowDir * r * dz;
    for (let c = 0; c < cols; c++) {
      const rx = cx + (c - (cols - 1) / 2) * dx;
      list.push({
        id: `${prefix}-sd-${r}-${c}`,
        kind: 'student-desk-set',
        x: rx,
        y: floorY,
        z: rz,
        rotationY: faceTowardBoard,
        collider: makeBoxCollider(`${prefix}-sdcol-${r}-${c}`, 'Student Desk', rx, floorY + 0.4, rz, 1.4, 0.8, 1.05),
      });
    }
  }
}

function pushToiletFixtures(
  list: InteriorFurnitureSpec[],
  prefix: string,
  floorY: number,
  cx: number,
  isMale: boolean
): void {
  const basinX = isMale ? cx - 2.9 : cx + 2.9;
  const basinRot = isMale ? Math.PI / 2 : -Math.PI / 2;
  list.push(
    {
      id: `${prefix}-cubicle-1`,
      kind: 'toilet-cubicle',
      x: cx - 1.2,
      y: floorY,
      z: -26.8,
      rotationY: 0,
      collider: makeBoxCollider(`${prefix}-cub1-col`, 'Toilet Stall', cx - 1.2, floorY + 0.96, -26.8, 1.18, 1.92, 1.28),
    },
    {
      id: `${prefix}-cubicle-2`,
      kind: 'toilet-cubicle',
      x: cx + 1.2,
      y: floorY,
      z: -26.8,
      rotationY: 0,
      collider: makeBoxCollider(`${prefix}-cub2-col`, 'Toilet Stall', cx + 1.2, floorY + 0.96, -26.8, 1.18, 1.92, 1.28),
    },
    {
      id: `${prefix}-basin`,
      kind: 'wash-basin',
      x: basinX,
      y: floorY,
      z: -23.6,
      rotationY: basinRot,
      collider: makeBoxCollider(`${prefix}-bas-col`, 'Wash Basin', basinX, floorY + 0.6, -23.6, 0.64, 1.2, 1.7),
    }
  );
}

const furniture: InteriorFurnitureSpec[] = [
  // Ground-Floor Open Courtyard: STRICTLY ARCHITECTURAL (ONLY small corner planters, ZERO benches!)
  { id: 'acad-cy-plant-nw', kind: 'potted-plant', x: -10.3, y: F1_Y, z: -7.8, rotationY: 0 },
  { id: 'acad-cy-plant-ne', kind: 'potted-plant', x: 10.3, y: F1_Y, z: -7.8, rotationY: 0 },
  { id: 'acad-cy-plant-sw', kind: 'potted-plant', x: -10.3, y: F1_Y, z: 6.8, rotationY: 0 },
  { id: 'acad-cy-plant-se', kind: 'potted-plant', x: 10.3, y: F1_Y, z: 6.8, rotationY: 0 },

  // Floor 1 Enclosed Reception & Waiting Hall (Z: +15.0..+28.0)
  {
    id: 'acad-f0-main-sign',
    kind: 'wall-sign',
    x: 0,
    y: 2.25,
    z: 15.18,
    rotationY: 0,
    label: 'ACADEMIC BUILDING RECEPTION',
    subtitle: 'Right -> Curved Stair & BMS Classroom Hallway · Left -> Engineering Workshops',
  },
  {
    id: 'acad-f0-stair-dir-sign',
    kind: 'wall-sign',
    x: 10.66,
    y: 2.25,
    z: 17.5,
    rotationY: Math.PI / 2,
    label: 'CURVED SWITCHBACK STAIRCASE',
    subtitle: 'Floors 1–4 · Stairs Ahead Right & BMS Classroom Hallway East',
  },
  {
    id: 'acad-f0-workshop-pass-sign',
    kind: 'wall-sign',
    x: -21.0,
    y: 2.25,
    z: -27.7,
    rotationY: 0,
    label: 'REAR WORKSHOP PASSAGE',
    subtitle: 'Exit to Exterior Workshops · Right to Rear Staircase & Toilets',
  },
  {
    id: 'acad-f0-reception',
    kind: 'reception-counter',
    x: 0.0,
    y: F1_Y,
    z: 18.8,
    rotationY: 0,
    collider: makeBoxCollider('acad-f0-rec-col', 'Reception Counter', 0.0, 0.55, 18.8, 2.7, 1.1, 0.9),
  },
  {
    id: 'acad-f0-rec-chair',
    kind: 'chair',
    x: 0.0,
    y: F1_Y,
    z: 17.5,
    rotationY: 0,
  },
  {
    id: 'acad-f0-lobby-sofa-w',
    kind: 'sofa-bench',
    x: -7.4,
    y: F1_Y,
    z: 21.5,
    rotationY: Math.PI / 2,
    collider: makeBoxCollider('acad-f0-sw-col', 'Reception Waiting Sofa', -7.4, 0.45, 21.5, 0.85, 0.9, 2.1),
  },
  {
    id: 'acad-f0-lobby-sofa-e',
    kind: 'sofa-bench',
    x: 7.4,
    y: F1_Y,
    z: 21.5,
    rotationY: -Math.PI / 2,
    collider: makeBoxCollider('acad-f0-se-col', 'Reception Waiting Sofa', 7.4, 0.45, 21.5, 0.85, 0.9, 2.1),
  },
  { id: 'acad-f0-plant-1', kind: 'potted-plant', x: -3.2, y: F1_Y, z: 16.0, rotationY: 0 },
  { id: 'acad-f0-plant-2', kind: 'potted-plant', x: 3.2, y: F1_Y, z: 16.0, rotationY: 0 },

  // =========================================================================
  // FLOOR 1 RIGHT HALLWAY ROOMS (X: +22.8..+34.0)
  // =========================================================================
  // 1. Academic Records & Faculty Office (Z: +18.0..+28.0)
  {
    id: 'acad-f0-rec-off-sign',
    kind: 'wall-sign',
    x: 33.8,
    y: 2.15,
    z: 23.0,
    rotationY: -Math.PI / 2,
    label: 'ACADEMIC RECORDS & FACULTY OFFICE',
    subtitle: 'Student Verification & Departmental Files',
  },
  {
    id: 'acad-f0-records-pc1',
    kind: 'computer-station',
    x: 28.0,
    y: F1_Y,
    z: 21.0,
    rotationY: -Math.PI / 2,
    collider: makeBoxCollider('acad-f0-rp1-col', 'Records Desk', 28.0, 0.45, 21.0, 0.9, 0.9, 1.7),
  },
  {
    id: 'acad-f0-records-pc2',
    kind: 'computer-station',
    x: 28.0,
    y: F1_Y,
    z: 25.0,
    rotationY: -Math.PI / 2,
    collider: makeBoxCollider('acad-f0-rp2-col', 'Records Desk', 28.0, 0.45, 25.0, 0.9, 0.9, 1.7),
  },
  {
    id: 'acad-f0-records-shelf',
    kind: 'bookshelf',
    x: 33.2,
    y: F1_Y,
    z: 23.0,
    rotationY: -Math.PI / 2,
    collider: makeBoxCollider('acad-f0-rs-col', 'Records Shelf', 33.2, 1.0, 23.0, 0.55, 2.0, 1.8),
  },

  // 2. Dean of Basic Medical Sciences Office (Z: +9.0..+18.0, right side of long classroom hallway)
  {
    id: 'acad-f0-dean-sign',
    kind: 'wall-sign',
    x: 33.8,
    y: 2.15,
    z: 13.5,
    rotationY: -Math.PI / 2,
    label: 'DEAN OF BASIC MEDICAL SCIENCES',
    subtitle: 'Room 101 · Faculty Administration',
  },
  {
    id: 'acad-f0-dean-desk',
    kind: 'computer-station',
    x: 28.5,
    y: F1_Y,
    z: 13.5,
    rotationY: -Math.PI / 2,
    collider: makeBoxCollider('acad-f0-dd-col', 'Dean Office Desk', 28.5, 0.45, 13.5, 0.9, 0.9, 1.7),
  },
  {
    id: 'acad-f0-dean-shelf',
    kind: 'bookshelf',
    x: 33.2,
    y: F1_Y,
    z: 11.2,
    rotationY: -Math.PI / 2,
    collider: makeBoxCollider('acad-f0-ds-col', 'Dean Archive Shelf', 33.2, 1.0, 11.2, 0.55, 2.0, 1.8),
  },
  {
    id: 'acad-f0-dean-sofa',
    kind: 'sofa-bench',
    x: 28.4,
    y: F1_Y,
    z: 16.8,
    rotationY: Math.PI,
    collider: makeBoxCollider('acad-f0-dsofa-col', 'Visitor Sofa', 28.4, 0.45, 16.8, 2.1, 0.9, 0.85),
  },

  // 3. Medical Nursing Lab (Z: +1.5..+9.0) — Ward beds, mannequins & clinical trolleys
  {
    id: 'acad-f0-mn-sign',
    kind: 'wall-sign',
    x: 33.8,
    y: 2.15,
    z: 5.25,
    rotationY: -Math.PI / 2,
    label: 'MEDICAL NURSING LABORATORY',
    subtitle: 'Clinical Simulation Mannequins & Ward Beds',
  },
  {
    id: 'acad-f0-mn-mannequin-1',
    kind: 'nursing-mannequin',
    x: 30.8,
    y: F1_Y,
    z: 3.4,
    rotationY: -Math.PI / 2,
    collider: makeBoxCollider('acad-f0-mnm1-col', 'Nursing Training Mannequin', 30.8, 0.5, 3.4, 2.0, 1.0, 1.2),
  },
  {
    id: 'acad-f0-mn-bed-2',
    kind: 'medical-bed',
    x: 30.8,
    y: F1_Y,
    z: 6.8,
    rotationY: -Math.PI / 2,
    collider: makeBoxCollider('acad-f0-mnb2-col', 'Nursing Ward Bed', 30.8, 0.45, 6.8, 2.0, 0.9, 0.95),
  },
  {
    id: 'acad-f0-mn-trolley-1',
    kind: 'nursing-trolley',
    x: 27.2,
    y: F1_Y,
    z: 3.4,
    rotationY: 0,
    collider: makeBoxCollider('acad-f0-mnt1-col', 'Clinical Trolley', 27.2, 0.45, 3.4, 0.9, 0.9, 0.65),
  },
  {
    id: 'acad-f0-mn-trolley-2',
    kind: 'nursing-trolley',
    x: 27.2,
    y: F1_Y,
    z: 6.8,
    rotationY: 0,
    collider: makeBoxCollider('acad-f0-mnt2-col', 'Clinical Trolley', 27.2, 0.45, 6.8, 0.9, 0.9, 0.65),
  },

  // 4. Mental & Child Nursing Lab (Z: -6.0..+1.5) — Pediatric beds & nursing mannequins
  {
    id: 'acad-f0-mcn-sign',
    kind: 'wall-sign',
    x: 33.8,
    y: 2.15,
    z: -2.25,
    rotationY: -Math.PI / 2,
    label: 'MENTAL & CHILD NURSING LAB',
    subtitle: 'Pediatric Simulation Mannequins & Care Stations',
  },
  {
    id: 'acad-f0-mcn-mannequin-1',
    kind: 'nursing-mannequin',
    x: 30.8,
    y: F1_Y,
    z: -4.0,
    rotationY: -Math.PI / 2,
    collider: makeBoxCollider('acad-f0-mcnm1-col', 'Pediatric Nursing Mannequin', 30.8, 0.5, -4.0, 2.0, 1.0, 1.2),
  },
  {
    id: 'acad-f0-mcn-bed-2',
    kind: 'medical-bed',
    x: 30.8,
    y: F1_Y,
    z: -0.5,
    rotationY: -Math.PI / 2,
    collider: makeBoxCollider('acad-f0-mcnb2-col', 'Pediatric Nursing Bed', 30.8, 0.45, -0.5, 2.0, 0.9, 0.95),
  },
  {
    id: 'acad-f0-mcn-trolley-1',
    kind: 'nursing-trolley',
    x: 27.2,
    y: F1_Y,
    z: -2.25,
    rotationY: 0,
    collider: makeBoxCollider('acad-f0-mcnt1-col', 'Nursing Instrument Trolley', 27.2, 0.45, -2.25, 0.9, 0.9, 0.65),
  },

  // 5. History Lab (Z: -13.5..-6.0)
  {
    id: 'acad-f0-hist-sign',
    kind: 'wall-sign',
    x: 33.8,
    y: 2.15,
    z: -9.75,
    rotationY: -Math.PI / 2,
    label: 'HISTORY LABORATORY',
    subtitle: 'Medical Heritage Specimens & Study Benches',
  },
  {
    id: 'acad-f0-hist-bench-1',
    kind: 'workbench',
    x: 28.4,
    y: F1_Y,
    z: -11.2,
    rotationY: 0,
    collider: makeBoxCollider('acad-f0-hb1-col', 'History Lab Table', 28.4, 0.45, -11.2, 2.3, 0.9, 0.95),
  },
  {
    id: 'acad-f0-hist-bench-2',
    kind: 'workbench',
    x: 28.4,
    y: F1_Y,
    z: -8.3,
    rotationY: 0,
    collider: makeBoxCollider('acad-f0-hb2-col', 'History Lab Table', 28.4, 0.45, -8.3, 2.3, 0.9, 0.95),
  },
  {
    id: 'acad-f0-hist-shelf',
    kind: 'bookshelf',
    x: 33.2,
    y: F1_Y,
    z: -11.8,
    rotationY: -Math.PI / 2,
    collider: makeBoxCollider('acad-f0-hs-col', 'Heritage Archive Shelf', 33.2, 1.0, -11.8, 0.55, 2.0, 1.8),
  },

  // 6. Physics Laboratory (Z: -20.8..-13.5)
  {
    id: 'acad-f0-phys-sign',
    kind: 'wall-sign',
    x: 33.8,
    y: 2.15,
    z: -17.15,
    rotationY: -Math.PI / 2,
    label: 'PHYSICS LABORATORY',
    subtitle: 'Optics Benches · Circuits & Mechanics Rigs',
  },
  {
    id: 'acad-f0-phys-bench-1',
    kind: 'physics-bench',
    x: 28.4,
    y: F1_Y,
    z: -18.8,
    rotationY: 0,
    collider: makeBoxCollider('acad-f0-phb1-col', 'Physics Apparatus Bench', 28.4, 0.5, -18.8, 2.4, 1.0, 1.05),
  },
  {
    id: 'acad-f0-phys-bench-2',
    kind: 'physics-bench',
    x: 28.4,
    y: F1_Y,
    z: -15.5,
    rotationY: 0,
    collider: makeBoxCollider('acad-f0-phb2-col', 'Physics Apparatus Bench', 28.4, 0.5, -15.5, 2.4, 1.0, 1.05),
  },

  // 7. Chemistry Laboratory (Z: -28.0..-20.8)
  {
    id: 'acad-f0-chem-sign',
    kind: 'wall-sign',
    x: 33.8,
    y: 2.15,
    z: -24.4,
    rotationY: -Math.PI / 2,
    label: 'CHEMISTRY LABORATORY',
    subtitle: 'Wet Chemistry Benches · Sinks & Reagent Racks',
  },
  {
    id: 'acad-f0-chem-bench-1',
    kind: 'chemistry-bench',
    x: 28.4,
    y: F1_Y,
    z: -25.8,
    rotationY: 0,
    collider: makeBoxCollider('acad-f0-chb1-col', 'Chemistry Lab Bench', 28.4, 0.55, -25.8, 2.5, 1.1, 1.15),
  },
  {
    id: 'acad-f0-chem-bench-2',
    kind: 'chemistry-bench',
    x: 28.4,
    y: F1_Y,
    z: -22.8,
    rotationY: 0,
    collider: makeBoxCollider('acad-f0-chb2-col', 'Chemistry Lab Bench', 28.4, 0.55, -22.8, 2.5, 1.1, 1.15),
  },

  // =========================================================================
  // FLOOR 1 LEFT HALLWAY: FIVE ENGINEERING WORKSHOPS + PPE TOOL STORE
  // =========================================================================
  ...[
    { id: 'carp', z: 2.6, title: 'CARPENTRY & WOODWORK WORKSHOP', variant: 'wood-lathe' as const },
    { id: 'mech', z: -4.2, title: 'MECHANICAL ENGINEERING WORKSHOP', variant: 'engine-rig' as const },
    { id: 'weld', z: -11.0, title: 'WELDING & FABRICATION WORKSHOP', variant: 'welding-unit' as const },
    { id: 'elec', z: -17.8, title: 'ELECTRICAL & ELECTRONICS WORKSHOP', variant: 'test-bench' as const },
    { id: 'mach', z: -24.6, title: 'MACHINE SHOP · WORKSHOP 5', variant: 'cnc-lathe' as const },
  ].flatMap((w) => [
    {
      id: `acad-f0-ws-${w.id}-sign`,
      kind: 'wall-sign' as const,
      x: -33.8,
      y: 2.15,
      z: w.z,
      rotationY: Math.PI / 2,
      label: w.title,
      subtitle: 'Ground Floor Engineering Workshop Wing',
    },
    {
      id: `acad-f0-ws-${w.id}-mach`,
      kind: 'workshop-machine' as const,
      variant: w.variant,
      x: -29.8,
      y: F1_Y,
      z: w.z - 1.2,
      rotationY: Math.PI / 2,
      collider: makeBoxCollider(`acad-f0-wsm-${w.id}-col`, w.title, -29.8, 0.75, w.z - 1.2, 1.3, 1.5, 2.1),
    },
    {
      id: `acad-f0-ws-${w.id}-bench`,
      kind: 'workbench' as const,
      x: -28.8,
      y: F1_Y,
      z: w.z + 1.4,
      rotationY: 0,
      collider: makeBoxCollider(`acad-f0-wsb-${w.id}-col`, 'Workshop Bench', -28.8, 0.45, w.z + 1.4, 2.4, 0.9, 1.0),
    },
  ]),
  {
    id: 'acad-f0-ws-tool-sign',
    kind: 'wall-sign',
    x: -33.8,
    y: 2.15,
    z: 11.25,
    rotationY: Math.PI / 2,
    label: 'WORKSHOP TOOL & PPE STORE',
    subtitle: 'Helmets · Goggles · Metrology Issue',
  },
  {
    id: 'acad-f0-ws-tool-rack',
    kind: 'storage-rack',
    x: -30.5,
    y: F1_Y,
    z: 11.25,
    rotationY: Math.PI / 2,
    collider: makeBoxCollider('acad-f0-wstr-col', 'PPE Storage Rack', -30.5, 1.0, 11.25, 0.65, 2.0, 2.0),
  },
  {
    id: 'acad-f0-ws-vestibule-bench',
    kind: 'bench',
    x: -29.0,
    y: F1_Y,
    z: 22.0,
    rotationY: 0,
    collider: makeBoxCollider('acad-f0-wsvb-col', 'Workshop Waiting Bench', -29.0, 0.4, 22.0, 2.2, 0.8, 0.6),
  },

  // Floor 2 (elev = 3.2): Library, E-library, Computer Workshop, Computer Lab, Eng Drawing, Lab, Depts
  ...[-24.5, -19.5, -14.5].flatMap((lz, idx) => [
    {
      id: `acad-f1-lib-shelf-w-${idx}`,
      kind: 'bookshelf' as const,
      x: -31.5,
      y: F2_Y,
      z: lz,
      rotationY: Math.PI / 2,
      collider: makeBoxCollider(`acad-f1-lsw-${idx}-col`, 'Library Bookshelf', -31.5, F2_Y + 1.0, lz, 0.55, 2.0, 1.8),
    },
    {
      id: `acad-f1-lib-shelf-e-${idx}`,
      kind: 'bookshelf' as const,
      x: -23.0,
      y: F2_Y,
      z: lz,
      rotationY: -Math.PI / 2,
      collider: makeBoxCollider(`acad-f1-lse-${idx}-col`, 'Library Bookshelf', -23.0, F2_Y + 1.0, lz, 0.55, 2.0, 1.8),
    },
  ]),
  {
    id: 'acad-f1-lib-table',
    kind: 'desk',
    x: -27.2,
    y: F2_Y,
    z: -19.5,
    rotationY: 0,
    collider: makeBoxCollider('acad-f1-libt-col', 'Reading Table', -27.2, F2_Y + 0.4, -19.5, 1.7, 0.8, 0.8),
  },
  ...[
    [-29.5, -8.0],
    [-23.5, -8.0],
    [-29.5, -4.6],
    [-23.5, -4.6],
  ].map(([ex, ez], idx) => ({
    id: `acad-f1-elab-pc-${idx}`,
    kind: 'computer-station' as const,
    x: ex,
    y: F2_Y,
    z: ez,
    rotationY: 0,
    collider: makeBoxCollider(`acad-f1-ep-${idx}-col`, 'E-library Terminal', ex, F2_Y + 0.45, ez, 1.7, 0.9, 0.9),
  })),
  {
    id: 'acad-f1-cw-bench-1',
    kind: 'workbench',
    x: -29.0,
    y: F2_Y,
    z: 2.25,
    rotationY: 0,
    collider: makeBoxCollider('acad-f1-cwb1-col', 'Hardware Repair Bench', -29.0, F2_Y + 0.45, 2.25, 2.3, 0.9, 0.95),
  },
  {
    id: 'acad-f1-cw-bench-2',
    kind: 'workbench',
    x: -23.5,
    y: F2_Y,
    z: 2.25,
    rotationY: 0,
    collider: makeBoxCollider('acad-f1-cwb2-col', 'Hardware Repair Bench', -23.5, F2_Y + 0.45, 2.25, 2.3, 0.9, 0.95),
  },
  ...[
    [-29.5, 8.8],
    [-23.5, 8.8],
    [-29.5, 12.2],
    [-23.5, 12.2],
  ].map(([cx, cz], idx) => ({
    id: `acad-f1-clab-pc-${idx}`,
    kind: 'computer-station' as const,
    x: cx,
    y: F2_Y,
    z: cz,
    rotationY: 0,
    collider: makeBoxCollider(`acad-f1-clp-${idx}-col`, 'Computer Lab Station', cx, F2_Y + 0.45, cz, 1.7, 0.9, 0.9),
  })),
  ...[
    [28.4, -25.0],
    [28.4, -21.0],
  ].map(([dx, dz], idx) => ({
    id: `acad-f1-eds-bench-${idx}`,
    kind: 'workbench' as const,
    x: dx,
    y: F2_Y,
    z: dz,
    rotationY: 0,
    collider: makeBoxCollider(`acad-f1-eds-${idx}-col`, 'Drafting Table', dx, F2_Y + 0.45, dz, 2.3, 0.9, 0.95),
  })),
  {
    id: 'acad-f1-lab-bench-1',
    kind: 'physics-bench',
    x: 28.4,
    y: F2_Y,
    z: 0.4,
    rotationY: 0,
    collider: makeBoxCollider('acad-f1-lab1-col', 'Engineering Lab Bench', 28.4, F2_Y + 0.5, 0.4, 2.4, 1.0, 1.05),
  },
  {
    id: 'acad-f1-lab-bench-2',
    kind: 'chemistry-bench',
    x: 28.4,
    y: F2_Y,
    z: 3.6,
    rotationY: 0,
    collider: makeBoxCollider('acad-f1-lab2-col', 'Materials Testing Bench', 28.4, F2_Y + 0.55, 3.6, 2.5, 1.1, 1.15),
  },
  {
    id: 'acad-f1-cpe-desk',
    kind: 'computer-station',
    x: 29.0,
    y: F2_Y,
    z: 18.0,
    rotationY: -Math.PI / 2,
    collider: makeBoxCollider('acad-f1-cped-col', 'Dept Desk', 29.0, F2_Y + 0.45, 18.0, 0.9, 0.9, 1.7),
  },
  {
    id: 'acad-f1-cve-desk',
    kind: 'computer-station',
    x: 29.0,
    y: F2_Y,
    z: 22.0,
    rotationY: -Math.PI / 2,
    collider: makeBoxCollider('acad-f1-cved-col', 'Dept Desk', 29.0, F2_Y + 0.45, 22.0, 0.9, 0.9, 1.7),
  },
  {
    id: 'acad-f1-tf-cubicle',
    kind: 'toilet-cubicle',
    x: 31.2,
    y: F2_Y,
    z: 26.0,
    rotationY: -Math.PI / 2,
    collider: makeBoxCollider('acad-f1-tfc-col', 'Restroom Stall', 31.2, F2_Y + 0.96, 26.0, 1.28, 1.92, 1.18),
  },

  // Floor 3 (elev = 6.4): Staff Offices 301-308 + 2 Staff Toilets
  ...STAFF_BANDS.flatMap(([z0, z1], idx): InteriorFurnitureSpec[] => {
    const cz = (z0 + z1) / 2;
    if (idx === 4) {
      return [
        {
          id: 'acad-f2-st-t1',
          kind: 'toilet-cubicle' as const,
          x: -31.4,
          y: F3_Y,
          z: cz,
          rotationY: Math.PI / 2,
          collider: makeBoxCollider('acad-f2-stt1-col', 'Staff Toilet 1', -31.4, F3_Y + 0.96, cz, 1.28, 1.92, 1.18),
        },
        {
          id: 'acad-f2-st-t2',
          kind: 'toilet-cubicle' as const,
          x: -19.8,
          y: F3_Y,
          z: cz,
          rotationY: -Math.PI / 2,
          collider: makeBoxCollider('acad-f2-stt2-col', 'Staff Toilet 2', -19.8, F3_Y + 0.96, cz, 1.28, 1.92, 1.18),
        },
      ];
    }
    return [
      {
        id: `acad-f2-st-desk-w-${idx}`,
        kind: 'desk' as const,
        x: -31.2,
        y: F3_Y,
        z: cz,
        rotationY: Math.PI / 2,
        collider: makeBoxCollider(`acad-f2-sdw-${idx}-col`, 'Staff Desk', -31.2, F3_Y + 0.4, cz, 0.85, 0.8, 1.7),
      },
      {
        id: `acad-f2-st-desk-e-${idx}`,
        kind: 'desk' as const,
        x: -20.2,
        y: F3_Y,
        z: cz,
        rotationY: -Math.PI / 2,
        collider: makeBoxCollider(`acad-f2-sde-${idx}-col`, 'Staff Desk', -20.2, F3_Y + 0.4, cz, 0.85, 0.8, 1.7),
      },
    ];
  }),

  // Floor 4 (elev = 9.6): Mass Comm Library, Radio Station, Mass Comm Dept, Under Construction 100L Wing
  ...[-22.0, -16.0, -10.0].map((lz, idx) => ({
    id: `acad-f3-lib-shelf-${idx}`,
    kind: 'bookshelf' as const,
    x: -30.5,
    y: F4_Y,
    z: lz,
    rotationY: Math.PI / 2,
    collider: makeBoxCollider(`acad-f3-ls-${idx}-col`, 'Media Library Shelf', -30.5, F4_Y + 1.0, lz, 0.55, 2.0, 1.8),
  })),
  {
    id: 'acad-f3-rad-console',
    kind: 'computer-station',
    x: -26.0,
    y: F4_Y,
    z: 5.5,
    rotationY: Math.PI / 2,
    collider: makeBoxCollider('acad-f3-radc-col', 'Broadcast Console', -26.0, F4_Y + 0.45, 5.5, 0.9, 0.9, 1.7),
  },
  {
    id: 'acad-f3-rad-sign',
    kind: 'wall-sign',
    x: -33.82,
    y: F4_Y + 2.15,
    z: 5.5,
    rotationY: Math.PI / 2,
    label: 'CAMPUS RADIO STATION · ON AIR',
    subtitle: 'Broadcast Desk & Mixing Suite',
  },
  {
    id: 'acad-f3-mcomm-sign',
    kind: 'wall-sign',
    x: -17.5,
    y: F4_Y + 2.15,
    z: 27.82,
    rotationY: Math.PI,
    label: 'MASS COMMUNICATION DEPARTMENT',
    subtitle: 'Journalism, Media & Broadcast Wing',
  },
  {
    id: 'acad-f3-mcomm-desk-1',
    kind: 'computer-station',
    x: -21.0,
    y: F4_Y,
    z: 22.5,
    rotationY: Math.PI,
    collider: makeBoxCollider('acad-f3-mcd1-col', 'Newsroom Desk', -21.0, F4_Y + 0.45, 22.5, 1.7, 0.9, 0.9),
  },
  {
    id: 'acad-f3-mcomm-desk-2',
    kind: 'computer-station',
    x: -14.0,
    y: F4_Y,
    z: 22.5,
    rotationY: Math.PI,
    collider: makeBoxCollider('acad-f3-mcd2-col', 'Newsroom Desk', -14.0, F4_Y + 0.45, 22.5, 1.7, 0.9, 0.9),
  },

  // Floor 4 UNDER CONSTRUCTION 100L Classrooms A & B
  {
    id: 'acad-f3-uc-a-sign',
    kind: 'wall-sign',
    variant: 'construction',
    x: 4.5,
    y: F4_Y + 2.15,
    z: 27.82,
    rotationY: Math.PI,
    label: 'UNDER CONSTRUCTION · 100L CLASSROOM A',
    subtitle: 'HARD HAT AREA · UNFINISHED CONCRETE',
  },
  {
    id: 'acad-f3-uc-a-bar-1',
    kind: 'construction-barrier',
    x: 4.5,
    y: F4_Y,
    z: 21.5,
    rotationY: 0,
    collider: makeBoxCollider('acad-f3-uc-ab1-col', 'Construction Barrier', 4.5, F4_Y + 0.5, 21.5, 2.8, 1.0, 0.9),
  },
  {
    id: 'acad-f3-uc-b-sign',
    kind: 'wall-sign',
    variant: 'construction',
    x: 33.82,
    y: F4_Y + 2.15,
    z: -4.0,
    rotationY: -Math.PI / 2,
    label: 'UNDER CONSTRUCTION · 100L CLASSROOM B',
    subtitle: 'CONTRACTORS ONLY · NO FURNITURE INSTALLED',
  },
  {
    id: 'acad-f3-uc-b-bar-1',
    kind: 'construction-barrier',
    x: 28.4,
    y: F4_Y,
    z: -14.0,
    rotationY: Math.PI / 2,
    collider: makeBoxCollider('acad-f3-uc-bb1-col', 'Construction Barrier', 28.4, F4_Y + 0.5, -14.0, 0.9, 1.0, 2.8),
  },
  {
    id: 'acad-f3-uc-b-bar-2',
    kind: 'construction-barrier',
    x: 28.4,
    y: F4_Y,
    z: -2.0,
    rotationY: Math.PI / 2,
    collider: makeBoxCollider('acad-f3-uc-bb2-col', 'Construction Barrier', 28.4, F4_Y + 0.5, -2.0, 0.9, 1.0, 2.8),
  },
];

// Rear Male/Female Toilet fixtures on all 4 floors (Z: -28.0..-20.5)
for (let lvl = 0; lvl < 4; lvl++) {
  const fy = lvl * FLOOR_HEIGHT;
  pushToiletFixtures(furniture, `acad-f${lvl}-male`, fy, -7.75, true);
  pushToiletFixtures(furniture, `acad-f${lvl}-female`, fy, 7.75, false);
}

// Spacious Multi-Row Classroom & Lecture Hall Seating on Floors 2 & 3
pushClassroomRows(furniture, 'acad-f1-theatre', F2_Y, -26.0, 21.5, 27.9, 'Theatre', 'Floor 2 Left Wing', 4, 3, 2.6, 2.2);
pushClassroomRows(furniture, 'acad-f1-lh1', F2_Y, -13.3, 21.5, 27.9, 'Lecture Hall 1', 'Engineering Wing', 3, 3, 2.4, 2.1);
pushClassroomRows(furniture, 'acad-f1-lh2', F2_Y, -3.95, 21.5, 27.9, 'Lecture Hall 2', 'Engineering Wing', 3, 3, 2.4, 2.1);
pushClassroomRows(furniture, 'acad-f1-elh', F2_Y, 5.35, 21.5, 27.9, 'Entrepreneurship Hall', 'Innovation Studies', 3, 3, 2.4, 2.1);
pushClassroomRows(furniture, 'acad-f1-lh3', F2_Y, 28.4, 11.0, 6.2, 'Lecture Hall 3', 'Engineering Wing', 3, 3, 2.6, 2.1);
pushClassroomRows(furniture, 'acad-f1-c201', F2_Y, 28.4, -14.0, -17.9, 'Classroom 201', 'Floor 2 East Wing', 3, 2, 2.6, 2.0);
pushClassroomRows(furniture, 'acad-f1-c202', F2_Y, 28.4, -6.0, -9.9, 'Classroom 202', 'Floor 2 East Wing', 3, 2, 2.6, 2.0);

pushClassroomRows(furniture, 'acad-f2-100l', F3_Y, -26.0, 21.5, 27.9, '100-level General Hall', 'Engineering Foundation', 4, 3, 2.7, 2.2);
pushClassroomRows(furniture, 'acad-f2-ci', F3_Y, -11.0, 21.5, 27.9, '400L Mechanical (CI)', 'Mechanical Engineering', 4, 3, 2.6, 2.1);
pushClassroomRows(furniture, 'acad-f2-c3', F3_Y, 3.0, 21.5, 27.9, '400L Civil (C3)', 'Civil Engineering', 4, 3, 2.6, 2.1);
pushClassroomRows(furniture, 'acad-f2-c4', F3_Y, 28.4, 21.0, 27.9, '500L Civil (C4)', 'Final Year Civil', 3, 4, 2.6, 2.2);
pushClassroomRows(furniture, 'acad-f2-c5', F3_Y, 28.4, -21.0, -27.9, '400L Computer (C5)', 'Computer Engineering', 3, 4, 2.6, 2.2);
pushClassroomRows(furniture, 'acad-f2-c2', F3_Y, 28.4, -7.0, -13.9, 'Classroom C2', 'School of Engineering', 3, 4, 2.6, 2.2);
pushClassroomRows(furniture, 'acad-f2-c6', F3_Y, 28.4, 7.0, 0.1, 'Classroom C6', 'School of Engineering', 3, 4, 2.6, 2.2);

// ===========================================================================
// ROOM ZONES ACROSS ALL 4 FLOORS
// ===========================================================================
function makeRearStairAndToiletRooms(floorIdx: number): InteriorRoom[] {
  const floorLabel = `Floor ${floorIdx + 1}`;
  return [
    {
      id: `acad-f${floorIdx}-rear-stair`,
      name: `Rear Staircase (${floorLabel})`,
      subtitle: 'Rear Wall Switchback Between Male & Female Toilets',
      floorLevel: floorIdx,
      kind: 'stairwell',
      minX: -4.0,
      maxX: 4.0,
      minZ: REAR_CORE_MIN_Z,
      maxZ: REAR_CORE_MAX_Z,
    },
    {
      id: `acad-f${floorIdx}-male-toilet`,
      name: floorIdx === 0 ? 'Bathroom / Male Toilet' : 'Male Toilet',
      subtitle: `${floorLabel} · Left of Rear Staircase`,
      floorLevel: floorIdx,
      kind: 'restroom',
      minX: -11.5,
      maxX: -4.0,
      minZ: REAR_CORE_MIN_Z,
      maxZ: REAR_CORE_MAX_Z,
    },
    {
      id: `acad-f${floorIdx}-female-toilet`,
      name: floorIdx === 0 ? 'Bathroom / Female Toilet' : 'Female Toilet',
      subtitle: `${floorLabel} · Right of Rear Staircase`,
      floorLevel: floorIdx,
      kind: 'restroom',
      minX: 4.0,
      maxX: 11.5,
      minZ: REAR_CORE_MIN_Z,
      maxZ: REAR_CORE_MAX_Z,
    },
    {
      id: `acad-f${floorIdx}-front-stair`,
      name: `Front Curved Staircase (${floorLabel})`,
      subtitle: 'Curved Switchback Stairwell · Lobby on Right',
      floorLevel: floorIdx,
      kind: 'stairwell',
      minX: 10.5,
      maxX: 19.5,
      minZ: 19.5,
      maxZ: MAX_Z,
    },
  ];
}

const rooms: InteriorRoom[] = [
  // Floor 1 (level 0)
  ...makeRearStairAndToiletRooms(0),
  {
    id: 'acad-f0-courtyard',
    name: 'Central Open Courtyard',
    subtitle: 'Open-to-Sky Architectural Shaft · Basic Medical Sciences',
    floorLevel: 0,
    kind: 'courtyard',
    minX: CY_MIN_X,
    maxX: CY_MAX_X,
    minZ: CY_MIN_Z,
    maxZ: CY_MAX_Z,
  },
  // Left Ground-Floor Wing: 5 Engineering Workshops + Rear Passage
  {
    id: 'acad-f0-ws-machine',
    name: 'Machine Shop (Workshop 5)',
    subtitle: 'Left Ground-Floor Engineering Corridor',
    floorLevel: 0,
    kind: 'workshop',
    minX: MIN_X,
    maxX: -23.5,
    minZ: MIN_Z,
    maxZ: -21.2,
  },
  {
    id: 'acad-f0-ws-electrical',
    name: 'Electrical & Electronics Workshop',
    subtitle: 'Left Ground-Floor Engineering Corridor',
    floorLevel: 0,
    kind: 'workshop',
    minX: MIN_X,
    maxX: -23.5,
    minZ: -21.2,
    maxZ: -14.4,
  },
  {
    id: 'acad-f0-ws-welding',
    name: 'Welding & Fabrication Workshop',
    subtitle: 'Left Ground-Floor Engineering Corridor',
    floorLevel: 0,
    kind: 'workshop',
    minX: MIN_X,
    maxX: -23.5,
    minZ: -14.4,
    maxZ: -7.6,
  },
  {
    id: 'acad-f0-ws-mechanical',
    name: 'Mechanical Engineering Workshop',
    subtitle: 'Left Ground-Floor Engineering Corridor',
    floorLevel: 0,
    kind: 'workshop',
    minX: MIN_X,
    maxX: -23.5,
    minZ: -7.6,
    maxZ: -0.8,
  },
  {
    id: 'acad-f0-ws-carpentry',
    name: 'Carpentry & Woodwork Workshop',
    subtitle: 'Left Ground-Floor Engineering Corridor',
    floorLevel: 0,
    kind: 'workshop',
    minX: MIN_X,
    maxX: -23.5,
    minZ: -0.8,
    maxZ: 6.0,
  },
  {
    id: 'acad-f0-ws-tool-store',
    name: 'Workshop Tool & PPE Issue Store',
    subtitle: 'Left Ground-Floor Engineering Support',
    floorLevel: 0,
    kind: 'workshop',
    minX: MIN_X,
    maxX: -23.5,
    minZ: 6.0,
    maxZ: 16.5,
  },
  {
    id: 'acad-f0-workshop-passage',
    name: 'Engineering Workshops Hallway & Rear Bypass',
    subtitle: 'Left Ground-Floor Corridor · Connects 5 Workshops, Rear Toilets & Stairs',
    floorLevel: 0,
    kind: 'corridor',
    minX: -23.5,
    maxX: -17.5,
    minZ: MIN_Z,
    maxZ: MAX_Z,
  },

  // Right Ground-Floor Wing: Classroom/Lab Hallway (+19.0..+22.8) + Dean Office & Labs (+22.8..+34.0)
  {
    id: 'acad-f0-records-office',
    name: 'Academic Records & Faculty Office',
    subtitle: 'Floor 1 South-East Corner',
    floorLevel: 0,
    kind: 'office',
    minX: 22.8,
    maxX: MAX_X,
    minZ: 18.0,
    maxZ: MAX_Z,
  },
  {
    id: 'acad-f0-dean-office',
    name: 'Dean of Basic Medical Sciences Office',
    subtitle: 'Right Side of Classroom Hallway · Floor 1',
    floorLevel: 0,
    kind: 'office',
    minX: 22.8,
    maxX: MAX_X,
    minZ: 9.0,
    maxZ: 18.0,
  },
  {
    id: 'acad-f0-med-nursing',
    name: 'Medical Nursing Laboratory',
    subtitle: 'Clinical Ward Beds & Nursing Mannequins',
    floorLevel: 0,
    kind: 'lab',
    minX: 22.8,
    maxX: MAX_X,
    minZ: 1.5,
    maxZ: 9.0,
  },
  {
    id: 'acad-f0-mcn-lab',
    name: 'Mental and Child Nursing Laboratory',
    subtitle: 'Pediatric Simulation & Nursing Mannequins',
    floorLevel: 0,
    kind: 'lab',
    minX: 22.8,
    maxX: MAX_X,
    minZ: -6.0,
    maxZ: 1.5,
  },
  {
    id: 'acad-f0-history-lab',
    name: 'History Laboratory',
    subtitle: 'Medical Heritage & Study Collection',
    floorLevel: 0,
    kind: 'lab',
    minX: 22.8,
    maxX: MAX_X,
    minZ: -13.5,
    maxZ: -6.0,
  },
  {
    id: 'acad-f0-physics-lab',
    name: 'Physics Laboratory',
    subtitle: 'Optics, Mechanics & Electromagnetism',
    floorLevel: 0,
    kind: 'lab',
    minX: 22.8,
    maxX: MAX_X,
    minZ: -20.8,
    maxZ: -13.5,
  },
  {
    id: 'acad-f0-chemistry-lab',
    name: 'Chemistry Laboratory',
    subtitle: 'Analytical & Wet Chemistry Benches',
    floorLevel: 0,
    kind: 'lab',
    minX: 22.8,
    maxX: MAX_X,
    minZ: MIN_Z,
    maxZ: -20.8,
  },
  {
    id: 'acad-f0-classroom-hallway',
    name: 'Basic Medical Sciences & Science Classroom Hallway',
    subtitle: 'Long Corridor · Dean Office, Nursing & Science Labs on Right',
    floorLevel: 0,
    kind: 'corridor',
    minX: 19.0,
    maxX: 22.8,
    minZ: MIN_Z,
    maxZ: 20.0,
  },
  {
    id: 'acad-f0-reception',
    name: 'Reception & Main Lobby',
    subtitle: 'Enclosed Entrance Hall · Curved Stair Right, Workshops Left',
    floorLevel: 0,
    kind: 'lobby',
    minX: -10.5,
    maxX: 10.5,
    minZ: 15.0,
    maxZ: MAX_Z,
  },
  {
    id: 'acad-f0-gallery',
    name: 'Ground Gallery & North Rear Corridor',
    subtitle: 'Courtyard Gallery · Rear Toilets & Staircase',
    floorLevel: 0,
    kind: 'corridor',
    minX: -17.5,
    maxX: 19.0,
    minZ: MIN_Z,
    maxZ: MAX_Z,
  },

  // Floor 2 (level 1)
  ...makeRearStairAndToiletRooms(1),
  {
    id: 'acad-f1-library',
    name: 'Library',
    subtitle: 'Academic Reading & Reference Collection',
    floorLevel: 1,
    kind: 'library',
    minX: MIN_X,
    maxX: -17.5,
    minZ: MIN_Z,
    maxZ: -11.0,
  },
  {
    id: 'acad-f1-elibrary',
    name: 'E-library',
    subtitle: 'Digital Terminals & Journals (via Library)',
    floorLevel: 1,
    kind: 'library',
    minX: MIN_X,
    maxX: -17.5,
    minZ: -11.0,
    maxZ: -2.0,
  },
  {
    id: 'acad-f1-comp-workshop',
    name: 'Computer Workshop',
    subtitle: 'Hardware Assembly & Maintenance',
    floorLevel: 1,
    kind: 'workshop',
    minX: MIN_X,
    maxX: -17.5,
    minZ: -2.0,
    maxZ: 6.5,
  },
  {
    id: 'acad-f1-comp-lab',
    name: 'Computer Laboratory',
    subtitle: 'Programming & Computing Workstations',
    floorLevel: 1,
    kind: 'lab',
    minX: MIN_X,
    maxX: -17.5,
    minZ: 6.5,
    maxZ: 15.0,
  },
  {
    id: 'acad-f1-theatre',
    name: 'Theatre',
    subtitle: 'Floor 2 Left Wing · Presentation Theatre',
    floorLevel: 1,
    kind: 'lecture-room',
    minX: MIN_X,
    maxX: -18.0,
    minZ: 15.0,
    maxZ: MAX_Z,
  },
  {
    id: 'acad-f1-lh1',
    name: 'Lecture Hall 1',
    subtitle: 'Floor 2 South Wing',
    floorLevel: 1,
    kind: 'lecture-room',
    minX: -18.0,
    maxX: -8.6,
    minZ: 15.0,
    maxZ: MAX_Z,
  },
  {
    id: 'acad-f1-lh2',
    name: 'Lecture Hall 2',
    subtitle: 'Floor 2 South Wing',
    floorLevel: 1,
    kind: 'lecture-room',
    minX: -8.6,
    maxX: 0.7,
    minZ: 15.0,
    maxZ: MAX_Z,
  },
  {
    id: 'acad-f1-entrepreneurship',
    name: 'Entrepreneurship Lecture Hall',
    subtitle: 'Innovation & Enterprise Studies',
    floorLevel: 1,
    kind: 'lecture-room',
    minX: 0.7,
    maxX: 10.0,
    minZ: 15.0,
    maxZ: MAX_Z,
  },
  {
    id: 'acad-f1-eng-drawing',
    name: 'Engineering Drawing Studio',
    subtitle: 'CAD & Technical Drafting',
    floorLevel: 1,
    kind: 'lab',
    minX: 22.8,
    maxX: MAX_X,
    minZ: MIN_Z,
    maxZ: -18.0,
  },
  {
    id: 'acad-f1-c201',
    name: 'Classroom 201',
    subtitle: 'Floor 2 East Wing',
    floorLevel: 1,
    kind: 'lecture-room',
    minX: 22.8,
    maxX: MAX_X,
    minZ: -18.0,
    maxZ: -10.0,
  },
  {
    id: 'acad-f1-c202',
    name: 'Classroom 202',
    subtitle: 'Floor 2 East Wing',
    floorLevel: 1,
    kind: 'lecture-room',
    minX: 22.8,
    maxX: MAX_X,
    minZ: -10.0,
    maxZ: -2.0,
  },
  {
    id: 'acad-f1-lab',
    name: 'Laboratory',
    subtitle: 'Applied Engineering & Testing Lab',
    floorLevel: 1,
    kind: 'lab',
    minX: 22.8,
    maxX: MAX_X,
    minZ: -2.0,
    maxZ: 6.0,
  },
  {
    id: 'acad-f1-lh3',
    name: 'Lecture Hall 3',
    subtitle: 'Floor 2 East Hallway Wing',
    floorLevel: 1,
    kind: 'lecture-room',
    minX: 22.8,
    maxX: MAX_X,
    minZ: 6.0,
    maxZ: 16.0,
  },
  {
    id: 'acad-f1-comp-eng',
    name: 'Computer Engineering Department',
    subtitle: 'Departmental Office',
    floorLevel: 1,
    kind: 'office',
    minX: 22.8,
    maxX: MAX_X,
    minZ: 16.0,
    maxZ: 20.0,
  },
  {
    id: 'acad-f1-civil-eng',
    name: 'Civil Engineering Department',
    subtitle: 'Departmental Office',
    floorLevel: 1,
    kind: 'office',
    minX: 22.8,
    maxX: MAX_X,
    minZ: 20.0,
    maxZ: 24.0,
  },
  {
    id: 'acad-f1-toilet-fac',
    name: 'Toilet Facilities',
    subtitle: 'Floor 2 South-East Restrooms',
    floorLevel: 1,
    kind: 'restroom',
    minX: 22.8,
    maxX: MAX_X,
    minZ: 24.0,
    maxZ: MAX_Z,
  },
  {
    id: 'acad-f1-gallery',
    name: 'Floor 2 Gallery & Hallway',
    subtitle: 'Overlooking Central Courtyard · Burglary Railings',
    floorLevel: 1,
    kind: 'corridor',
    minX: -17.5,
    maxX: 22.8,
    minZ: MIN_Z,
    maxZ: MAX_Z,
  },

  // Floor 3 (level 2): School of Engineering
  ...makeRearStairAndToiletRooms(2),
  ...STAFF_BANDS.flatMap(([z0, z1], idx): InteriorRoom[] => {
    const isToiletRow = idx === 4;
    return [
      {
        id: `acad-f2-st-w-${idx}`,
        name: isToiletRow ? 'Staff Office Toilet 1' : `Staff Office 30${idx + 1}`,
        subtitle: isToiletRow ? 'Staff Offices Suite Restroom' : 'School of Engineering Faculty',
        floorLevel: 2,
        kind: isToiletRow ? 'restroom' : 'office',
        minX: MIN_X,
        maxX: -27.2,
        minZ: z0,
        maxZ: z1,
      },
      {
        id: `acad-f2-st-e-${idx}`,
        name: isToiletRow ? 'Staff Office Toilet 2' : `Staff Office 30${idx + 5}`,
        subtitle: isToiletRow ? 'Staff Offices Suite Restroom' : 'School of Engineering Faculty',
        floorLevel: 2,
        kind: isToiletRow ? 'restroom' : 'office',
        minX: -24.3,
        maxX: -17.5,
        minZ: z0,
        maxZ: z1,
      },
    ];
  }),
  {
    id: 'acad-f2-staff-corridor',
    name: 'Staff Offices Suite Corridor',
    subtitle: '8 Staff Offices & 2 Restrooms',
    floorLevel: 2,
    kind: 'corridor',
    minX: MIN_X,
    maxX: -17.5,
    minZ: MIN_Z,
    maxZ: 15.0,
  },
  {
    id: 'acad-f2-c5-comp',
    name: '400-level Computer Engineering Classroom (C5)',
    subtitle: 'Room C5 · Computer Engineering',
    floorLevel: 2,
    kind: 'lecture-room',
    minX: 22.8,
    maxX: MAX_X,
    minZ: MIN_Z,
    maxZ: -14.0,
  },
  {
    id: 'acad-f2-c2',
    name: 'Engineering Classroom C2',
    subtitle: 'School of Engineering Additional Classroom',
    floorLevel: 2,
    kind: 'lecture-room',
    minX: 22.8,
    maxX: MAX_X,
    minZ: -14.0,
    maxZ: 0.0,
  },
  {
    id: 'acad-f2-c6',
    name: 'Engineering Classroom C6',
    subtitle: 'School of Engineering Additional Classroom',
    floorLevel: 2,
    kind: 'lecture-room',
    minX: 22.8,
    maxX: MAX_X,
    minZ: 0.0,
    maxZ: 14.0,
  },
  {
    id: 'acad-f2-c4-civil',
    name: '500-level Civil Engineering Classroom (C4)',
    subtitle: 'Room C4 · Final Year Civil Engineering',
    floorLevel: 2,
    kind: 'lecture-room',
    minX: 22.8,
    maxX: MAX_X,
    minZ: 14.0,
    maxZ: MAX_Z,
  },
  {
    id: 'acad-f2-100l-hall',
    name: '100-level General Lecture Hall',
    subtitle: 'School of Engineering Foundation Hall',
    floorLevel: 2,
    kind: 'lecture-room',
    minX: MIN_X,
    maxX: -18.0,
    minZ: 15.0,
    maxZ: MAX_Z,
  },
  {
    id: 'acad-f2-ci-mech',
    name: '400-level Mechanical Engineering Classroom (CI)',
    subtitle: 'Room CI · Mechanical Engineering',
    floorLevel: 2,
    kind: 'lecture-room',
    minX: -18.0,
    maxX: -4.0,
    minZ: 15.0,
    maxZ: MAX_Z,
  },
  {
    id: 'acad-f2-c3-civil',
    name: '400-level Civil Engineering Classroom (C3)',
    subtitle: 'Room C3 · Civil Engineering',
    floorLevel: 2,
    kind: 'lecture-room',
    minX: -4.0,
    maxX: 10.0,
    minZ: 15.0,
    maxZ: MAX_Z,
  },
  {
    id: 'acad-f2-gallery',
    name: 'Floor 3 Gallery & Hallway',
    subtitle: 'School of Engineering · Overlooking Courtyard',
    floorLevel: 2,
    kind: 'corridor',
    minX: -17.5,
    maxX: 22.8,
    minZ: MIN_Z,
    maxZ: MAX_Z,
  },

  // Floor 4 (level 3): Mass Communication & Under Construction 100L Wing
  ...makeRearStairAndToiletRooms(3),
  {
    id: 'acad-f3-library',
    name: 'Library (Mass Communication)',
    subtitle: 'Floor 4 Left Wing · Media & Archive Library',
    floorLevel: 3,
    kind: 'library',
    minX: MIN_X,
    maxX: -17.5,
    minZ: MIN_Z,
    maxZ: -4.0,
  },
  {
    id: 'acad-f3-radio-station',
    name: 'Radio Station',
    subtitle: 'Floor 4 · Campus Broadcast Studio',
    floorLevel: 3,
    kind: 'office',
    minX: MIN_X,
    maxX: -17.5,
    minZ: -4.0,
    maxZ: 15.0,
  },
  {
    id: 'acad-f3-masscomm-dept',
    name: 'Mass Communication Department',
    subtitle: 'Floor 4 · Faculty & Journalism Wing',
    floorLevel: 3,
    kind: 'office',
    minX: MIN_X,
    maxX: -1.0,
    minZ: 15.0,
    maxZ: MAX_Z,
  },
  {
    id: 'acad-f3-uc-100l-a',
    name: '100-level Classroom A (Under Construction)',
    subtitle: 'UNDER CONSTRUCTION · Right Wing',
    floorLevel: 3,
    kind: 'lecture-room',
    minX: -1.0,
    maxX: 10.0,
    minZ: 15.0,
    maxZ: MAX_Z,
  },
  {
    id: 'acad-f3-uc-100l-b',
    name: '100-level Classroom B (Under Construction)',
    subtitle: 'UNDER CONSTRUCTION · Right Wing',
    floorLevel: 3,
    kind: 'lecture-room',
    minX: 22.8,
    maxX: MAX_X,
    minZ: MIN_Z,
    maxZ: 14.0,
  },
  {
    id: 'acad-f3-gallery',
    name: 'Floor 4 Gallery & Hallway',
    subtitle: 'Mass Communication · Open Courtyard Above',
    floorLevel: 3,
    kind: 'corridor',
    minX: -17.5,
    maxX: 22.8,
    minZ: MIN_Z,
    maxZ: MAX_Z,
  },
];

const floors: InteriorFloor[] = [
  { level: 0, elevation: 0.0, label: 'First Floor · Basic Medical Sciences & Workshops' },
  { level: 1, elevation: 3.2, label: 'Second Floor · Computer & Engineering' },
  { level: 2, elevation: 6.4, label: 'Third Floor · School of Engineering' },
  { level: 3, elevation: 9.6, label: 'Fourth Floor · Mass Communication' },
];

const windows: InteriorWindowSpec[] = [];
for (let lvl = 0; lvl <= 3; lvl++) {
  const winY = lvl * FLOOR_HEIGHT + 1.75;
  windows.push(
    { id: `acad-win-w-${lvl}`, x: MIN_X + 0.02, y: winY, z: 5.0, width: 5.4, height: 1.5, rotationY: Math.PI / 2 },
    { id: `acad-win-n-${lvl}`, x: -28.0, y: winY, z: MIN_Z + 0.02, width: 4.8, height: 1.5, rotationY: 0 },
    { id: `acad-win-e-${lvl}`, x: MAX_X - 0.02, y: winY, z: -11.0, width: 5.4, height: 1.5, rotationY: -Math.PI / 2 }
  );
}

const lights: InteriorLightSpec[] = [
  { id: 'acad-l-0-rec', x: 0, y: F1_Y + 2.88, z: 21.5, color: '#FFF6E3', intensity: 1.8, distance: 32, castPointLight: true },
  { id: 'acad-l-0-east', x: 20.9, y: F1_Y + 2.88, z: 0.0, color: '#FFF8EC', intensity: 1.5, distance: 28, castPointLight: false },
  { id: 'acad-l-0-west', x: -20.5, y: F1_Y + 2.88, z: -10.0, color: '#FFF8EC', intensity: 1.4, distance: 28, castPointLight: false },
  { id: 'acad-l-1-south', x: 0, y: F2_Y + 2.88, z: 12.0, color: '#F7FBFF', intensity: 1.8, distance: 32, castPointLight: true },
  { id: 'acad-l-1-rear', x: 0, y: F2_Y + 2.88, z: -16.0, color: '#F5FAFF', intensity: 1.4, distance: 26, castPointLight: false },
  { id: 'acad-l-2-south', x: 0, y: F3_Y + 2.88, z: 12.0, color: '#FFF6E3', intensity: 1.8, distance: 32, castPointLight: true },
  { id: 'acad-l-2-staff', x: -25.75, y: F3_Y + 2.88, z: -10.0, color: '#FFF8EC', intensity: 1.4, distance: 24, castPointLight: false },
  { id: 'acad-l-3-south', x: 0, y: F4_Y + 2.88, z: 12.0, color: '#FFF6E3', intensity: 1.8, distance: 32, castPointLight: true },
  { id: 'acad-l-3-right', x: 28.0, y: F4_Y + 2.88, z: -6.0, color: '#FDE68A', intensity: 1.3, distance: 22, castPointLight: false },
];

export const ACADEMIC_BUILDING_INTERIOR: InteriorWorld = {
  id: 'academic-building',
  name: 'Academic Building',
  subtitle: 'Four-Storey Faculties, Central Courtyard, Labs, Library & Lecture Halls',
  bounds: {
    minX: MIN_X + 0.12,
    maxX: MAX_X - 0.12,
    minZ: MIN_Z + 0.12,
    maxZ: MAX_Z - 0.12,
  },
  floorHeight: FLOOR_HEIGHT,
  hasOpenCourtyard: true,
  courtyardBounds: {
    minX: CY_MIN_X,
    maxX: CY_MAX_X,
    minZ: CY_MIN_Z,
    maxZ: CY_MAX_Z,
  },
  floors,
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
    z: 24.5,
    yaw: 0,
  },
  exitReturnFallback: {
    x: 0.0,
    y: 0.04,
    z: -30.8,
    yaw: Math.PI,
  },
};
