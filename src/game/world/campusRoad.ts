export interface RoadPoint2D {
  x: number;
  z: number;
}

export interface RoadSample {
  x: number;
  z: number;
  tx: number; // unit tangent x
  tz: number; // unit tangent z
  nx: number; // unit right normal x
  nz: number; // unit right normal z
  s: number;  // cumulative arc length in metres
}

// ===========================================================================
// EXPANDED UNIVERSITY CAMPUS ROAD NETWORK CONSTANTS (COMBINED PHASE 2.3)
// ===========================================================================

export const APPROACH_ROAD_CENTER_X = 0;
export const DUAL_MEDIAN_HALF_WIDTH = 1.8; // 3.6m wide central landscaped grass median
export const DUAL_LANE_WIDTH = 7.8; // Each one-way carriageway side (2 lanes)
export const DUAL_WEST_CARRIAGEWAY_X = -(DUAL_MEDIAN_HALF_WIDTH + DUAL_LANE_WIDTH / 2); // -5.7
export const DUAL_EAST_CARRIAGEWAY_X = DUAL_MEDIAN_HALF_WIDTH + DUAL_LANE_WIDTH / 2; // +5.7
export const DUAL_ROAD_OUTER_HALF_WIDTH = DUAL_MEDIAN_HALF_WIDTH + DUAL_LANE_WIDTH; // 9.6

export const ROAD_WIDTH = 9.6;
export const ROAD_HALF_WIDTH = ROAD_WIDTH / 2; // 4.8
export const SECONDARY_ROAD_WIDTH = 8.4;
export const SECONDARY_ROAD_HALF_WIDTH = SECONDARY_ROAD_WIDTH / 2; // 4.2
export const KERB_WIDTH = 0.24;
export const SIDEWALK_WIDTH = 2.6;
export const DRAIN_WIDTH = 0.45;

// Flag Roundabout positioned DIRECTLY IN FRONT of the Academic Building (-34..+34, -90..-34)
export const ROUNDABOUT_CENTER = { x: 0, z: 6 } as const;
export const ROUNDABOUT_INNER_RADIUS = 7.2;
export const ROUNDABOUT_OUTER_RADIUS = 16.5;

// West Campus Arterial & Continued Road toward Clinic, Cafeteria, Workshops, Sports & Hostels
export const WEST_ARTERIAL_Z = 6;
export const CONTINUED_ROAD_CENTER_X = -64;
export const NORTH_CROSS_ROAD_Z = -117;
export const EAST_LOOP_ROAD_X = 58;
export const EAST_HALL_SPUR_Z = 81;
export const ADMIN_ACCESS_Z = 43;

export const CUL_DE_SAC_CENTER = { x: CONTINUED_ROAD_CENTER_X, z: -176 } as const;
export const CUL_DE_SAC_RADIUS = 10.5;

/**
 * Smooth C1 cubic Bezier curve turning North (-Z) from the West Campus Arterial
 * (-48, 6) onto the Continued Northern Road (-64, -10).
 */
export const BEND_CONTROL_POINTS: Readonly<[RoadPoint2D, RoadPoint2D, RoadPoint2D, RoadPoint2D]> = [
  { x: -48, z: 6 },
  { x: -57, z: 6 },
  { x: -64, z: -1 },
  { x: -64, z: -10 },
];

/**
 * Smooth C1 cubic Bezier curve turning North (-Z) from the East Campus Loop
 * (+42, 6) onto the East Campus Road (+58, -10).
 */
export const EAST_BEND_CONTROL_POINTS: Readonly<[RoadPoint2D, RoadPoint2D, RoadPoint2D, RoadPoint2D]> = [
  { x: 42, z: 6 },
  { x: 51, z: 6 },
  { x: 58, z: -1 },
  { x: 58, z: -10 },
];

export function evaluateCubicBezier(
  t: number,
  pts: Readonly<[RoadPoint2D, RoadPoint2D, RoadPoint2D, RoadPoint2D]> = BEND_CONTROL_POINTS
): RoadPoint2D {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return {
    x:
      uuu * pts[0].x +
      3 * uu * t * pts[1].x +
      3 * u * tt * pts[2].x +
      ttt * pts[3].x,
    z:
      uuu * pts[0].z +
      3 * uu * t * pts[1].z +
      3 * u * tt * pts[2].z +
      ttt * pts[3].z,
  };
}

export function evaluateCubicBezierTangent(
  t: number,
  pts: Readonly<[RoadPoint2D, RoadPoint2D, RoadPoint2D, RoadPoint2D]> = BEND_CONTROL_POINTS
): RoadPoint2D {
  const u = 1 - t;
  const dx =
    3 * u * u * (pts[1].x - pts[0].x) +
    6 * u * t * (pts[2].x - pts[1].x) +
    3 * t * t * (pts[3].x - pts[2].x);
  const dz =
    3 * u * u * (pts[1].z - pts[0].z) +
    6 * u * t * (pts[2].z - pts[1].z) +
    3 * t * t * (pts[3].z - pts[2].z);

  const len = Math.hypot(dx, dz) || 1;
  return { x: dx / len, z: dz / len };
}

export function sampleCurveCenterline(
  pts: Readonly<[RoadPoint2D, RoadPoint2D, RoadPoint2D, RoadPoint2D]>,
  segments = 40
): RoadSample[] {
  const samples: RoadSample[] = [];
  let cumulativeS = 0;
  let prevX = pts[0].x;
  let prevZ = pts[0].z;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const pos = evaluateCubicBezier(t, pts);
    const tan = evaluateCubicBezierTangent(t, pts);
    if (i > 0) {
      cumulativeS += Math.hypot(pos.x - prevX, pos.z - prevZ);
    }
    prevX = pos.x;
    prevZ = pos.z;

    const nx = -tan.z;
    const nz = tan.x;

    samples.push({
      x: pos.x,
      z: pos.z,
      tx: tan.x,
      tz: tan.z,
      nx,
      nz,
      s: cumulativeS,
    });
  }

  return samples;
}

export function sampleLeftBendCenterline(segments = 48): RoadSample[] {
  return sampleCurveCenterline(BEND_CONTROL_POINTS, segments);
}

export function sampleEastBendCenterline(segments = 40): RoadSample[] {
  return sampleCurveCenterline(EAST_BEND_CONTROL_POINTS, segments);
}
