import type { AabbCollider, StepSurface } from '../../types/game';
import type {
  ExteriorAnchor,
  InteriorDoorKind,
  InteriorDoorSpec,
  InteriorStairSpec,
  InteriorStairTreadVisual,
  InteriorSurfaceSpec,
} from '../../types/interior';

export function makeBoxCollider(
  id: string,
  label: string,
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  depth: number
): AabbCollider {
  return {
    id,
    label,
    minX: x - width / 2,
    maxX: x + width / 2,
    minY: y - height / 2,
    maxY: y + height / 2,
    minZ: z - depth / 2,
    maxZ: z + depth / 2,
  };
}

export function buildWall(
  id: string,
  x: number,
  floorY: number,
  z: number,
  width: number,
  height: number,
  depth: number,
  color?: string
): InteriorSurfaceSpec {
  return {
    id,
    role: 'wall',
    x,
    y: floorY + height / 2,
    z,
    width,
    height,
    depth,
    color,
    collides: true,
  };
}

/**
 * Splits a wall running along the X axis (`minX..maxX` at fixed `z`) around a doorway opening
 * (`doorCenterX - doorWidth/2 .. doorCenterX + doorWidth/2`), automatically adding the upper lintel.
 */
export function buildWallWithDoorwayX(
  idPrefix: string,
  minX: number,
  maxX: number,
  z: number,
  floorY: number,
  wallHeight: number,
  doorCenterX: number,
  doorWidth = 1.4,
  doorHeight = 2.34,
  thickness = 0.24
): InteriorSurfaceSpec[] {
  const surfaces: InteriorSurfaceSpec[] = [];
  const gapLeft = doorCenterX - doorWidth / 2;
  const gapRight = doorCenterX + doorWidth / 2;

  if (gapLeft - minX > 0.05) {
    const w = gapLeft - minX;
    surfaces.push(buildWall(`${idPrefix}-left`, minX + w / 2, floorY, z, w, wallHeight, thickness));
  }
  if (maxX - gapRight > 0.05) {
    const w = maxX - gapRight;
    surfaces.push(buildWall(`${idPrefix}-right`, gapRight + w / 2, floorY, z, w, wallHeight, thickness));
  }
  const lintelH = wallHeight - doorHeight;
  if (lintelH > 0.05) {
    surfaces.push(
      buildWall(
        `${idPrefix}-lintel`,
        doorCenterX,
        floorY + doorHeight,
        z,
        doorWidth + 0.06,
        lintelH,
        thickness
      )
    );
  }
  return surfaces;
}

/**
 * Splits a wall running along the Z axis (`minZ..maxZ` at fixed `x`) around a doorway opening
 * (`doorCenterZ - doorWidth/2 .. doorCenterZ + doorWidth/2`), automatically adding the upper lintel.
 */
export function buildWallWithDoorwayZ(
  idPrefix: string,
  x: number,
  minZ: number,
  maxZ: number,
  floorY: number,
  wallHeight: number,
  doorCenterZ: number,
  doorWidth = 1.4,
  doorHeight = 2.34,
  thickness = 0.24
): InteriorSurfaceSpec[] {
  const surfaces: InteriorSurfaceSpec[] = [];
  const gapTop = doorCenterZ - doorWidth / 2;
  const gapBottom = doorCenterZ + doorWidth / 2;

  if (gapTop - minZ > 0.05) {
    const d = gapTop - minZ;
    surfaces.push(buildWall(`${idPrefix}-north`, x, floorY, minZ + d / 2, thickness, wallHeight, d));
  }
  if (maxZ - gapBottom > 0.05) {
    const d = maxZ - gapBottom;
    surfaces.push(buildWall(`${idPrefix}-south`, x, floorY, gapBottom + d / 2, thickness, wallHeight, d));
  }
  const lintelH = wallHeight - doorHeight;
  if (lintelH > 0.05) {
    surfaces.push(
      buildWall(
        `${idPrefix}-lintel`,
        x,
        floorY + doorHeight,
        doorCenterZ,
        thickness,
        lintelH,
        doorWidth + 0.06
      )
    );
  }
  return surfaces;
}

export function buildDoorX(params: {
  id: string;
  label: string;
  subtitle?: string;
  floorLevel: number;
  kind?: InteriorDoorKind;
  centerX: number;
  floorY: number;
  z: number;
  width?: number;
  height?: number;
  swingDir?: 1 | -1;
  defaultOpen?: boolean;
  exitReturnAnchor?: ExteriorAnchor;
}): InteriorDoorSpec {
  const width = params.width ?? 1.36;
  const height = params.height ?? 2.32;
  const swingDir = params.swingDir ?? -1;
  return {
    id: params.id,
    label: params.label,
    subtitle: params.subtitle,
    floorLevel: params.floorLevel,
    kind: params.kind ?? 'room',
    hingeX: params.centerX - width / 2,
    hingeY: params.floorY,
    hingeZ: params.z,
    width,
    height,
    thickness: 0.08,
    closedYaw: 0,
    openYaw: swingDir * Math.PI * 0.48,
    axis: 'x',
    swingDir,
    defaultOpen: params.defaultOpen ?? false,
    exitReturnAnchor: params.exitReturnAnchor,
    closedCollider: makeBoxCollider(
      `${params.id}-col`,
      `${params.label} Door`,
      params.centerX,
      params.floorY + height / 2,
      params.z,
      width + 0.04,
      height,
      0.26
    ),
  };
}

export function buildDoorZ(params: {
  id: string;
  label: string;
  subtitle?: string;
  floorLevel: number;
  kind?: InteriorDoorKind;
  x: number;
  floorY: number;
  centerZ: number;
  width?: number;
  height?: number;
  swingDir?: 1 | -1;
  defaultOpen?: boolean;
  exitReturnAnchor?: ExteriorAnchor;
}): InteriorDoorSpec {
  const width = params.width ?? 1.36;
  const height = params.height ?? 2.32;
  const swingDir = params.swingDir ?? -1;
  const closedYaw = -Math.PI / 2;
  return {
    id: params.id,
    label: params.label,
    subtitle: params.subtitle,
    floorLevel: params.floorLevel,
    kind: params.kind ?? 'room',
    hingeX: params.x,
    hingeY: params.floorY,
    hingeZ: params.centerZ - width / 2,
    width,
    height,
    thickness: 0.08,
    closedYaw,
    openYaw: closedYaw + swingDir * Math.PI * 0.48,
    axis: 'z',
    swingDir,
    defaultOpen: params.defaultOpen ?? false,
    exitReturnAnchor: params.exitReturnAnchor,
    closedCollider: makeBoxCollider(
      `${params.id}-col`,
      `${params.label} Door`,
      params.x,
      params.floorY + height / 2,
      params.centerZ,
      0.26,
      height,
      width + 0.04
    ),
  };
}

export function buildStraightStairFlight(params: {
  id: string;
  fromFloor: number;
  toFloor: number;
  baseElevation: number;
  centerX: number;
  width: number;
  startZ: number;
  direction: 'north' | 'south';
  stepCount?: number;
  totalRise?: number;
  totalRun?: number;
  includeWestRailing?: boolean;
  includeEastRailing?: boolean;
}): InteriorStairSpec {
  const stepCount = params.stepCount ?? 16;
  const totalRise = params.totalRise ?? 3.2;
  const totalRun = params.totalRun ?? 5.76;
  const dirZ = params.direction === 'north' ? -1 : 1;
  const stepRise = totalRise / stepCount;
  const stepDepth = totalRun / stepCount;
  const steps: StepSurface[] = [];
  const treads: InteriorStairTreadVisual[] = [];

  for (let i = 0; i < stepCount; i++) {
    const elevation = Number((params.baseElevation + (i + 1) * stepRise).toFixed(3));
    const treadCenterZ = params.startZ + dirZ * ((i + 0.5) * stepDepth);
    steps.push({
      id: `${params.id}-step-${i}`,
      minX: params.centerX - params.width / 2,
      maxX: params.centerX + params.width / 2,
      minZ: treadCenterZ - stepDepth * 0.56,
      maxZ: treadCenterZ + stepDepth * 0.56,
      elevation,
    });
    treads.push({
      x: params.centerX,
      y: elevation - stepRise * 0.5,
      z: treadCenterZ,
      width: params.width,
      height: stepRise,
      depth: stepDepth + 0.02,
    });
  }

  const midZ = params.startZ + dirZ * (totalRun / 2);
  const topY = params.baseElevation + totalRise;
  const railings: InteriorSurfaceSpec[] = [];

  if (params.includeWestRailing) {
    railings.push({
      id: `${params.id}-west-rail`,
      role: 'railing',
      x: params.centerX - params.width / 2 - 0.06,
      y: topY + 0.52,
      z: midZ,
      width: 0.12,
      height: 1.04,
      depth: totalRun + 0.28,
      collides: true,
    });
  }

  if (params.includeEastRailing) {
    railings.push({
      id: `${params.id}-east-rail`,
      role: 'railing',
      x: params.centerX + params.width / 2 + 0.06,
      y: topY + 0.52,
      z: midZ,
      width: 0.12,
      height: 1.04,
      depth: totalRun + 0.28,
      collides: true,
    });
  }

  return {
    id: params.id,
    fromFloor: params.fromFloor,
    toFloor: params.toFloor,
    steps,
    treads,
    railings,
  };
}

/**
 * Builds a curved switchback staircase sweeping smoothly around a central pivot `(centerX, centerZ)`
 * from `startAngle` to `endAngle` (standard XZ polar: x = cx + r*cos(a), z = cz + r*sin(a)).
 * Visual treads are radially oriented wedge boxes; collision uses overlapping twin radial square pads
 * per step plus small square arc boundary posts so movement along the curved flight is seamless.
 */
export function buildCurvedSwitchbackStairFlight(params: {
  id: string;
  fromFloor: number;
  toFloor: number;
  baseElevation: number;
  centerX: number;
  centerZ: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  stepCount?: number;
  totalRise?: number;
  includeOuterRailing?: boolean;
  includeInnerCore?: boolean;
}): InteriorStairSpec {
  const stepCount = params.stepCount ?? 16;
  const totalRise = params.totalRise ?? 3.2;
  const stepRise = totalRise / stepCount;
  const angleSpan = params.endAngle - params.startAngle;
  const midRadius = (params.innerRadius + params.outerRadius) / 2;
  const treadSpanW = params.outerRadius - params.innerRadius;
  const steps: StepSurface[] = [];
  const treads: InteriorStairTreadVisual[] = [];
  const railings: InteriorSurfaceSpec[] = [];

  const r1 = params.innerRadius + treadSpanW * 0.28;
  const r2 = params.outerRadius - treadSpanW * 0.28;
  const padHalf = Math.max(0.54, treadSpanW * 0.34);

  for (let i = 0; i < stepCount; i++) {
    const t = (i + 0.5) / stepCount;
    const angle = params.startAngle + angleSpan * t;
    const elevation = Number((params.baseElevation + (i + 1) * stepRise).toFixed(3));
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const arcChordAtOuter = Math.abs(angleSpan / stepCount) * params.outerRadius;

    // Two overlapping horizontal square step-surfaces per wedge tread so walking anywhere
    // from inner to outer arc tracks elevation smoothly without stair gaps.
    const x1 = params.centerX + cosA * r1;
    const z1 = params.centerZ + sinA * r1;
    const x2 = params.centerX + cosA * r2;
    const z2 = params.centerZ + sinA * r2;

    steps.push(
      {
        id: `${params.id}-step-${i}-in`,
        minX: x1 - padHalf,
        maxX: x1 + padHalf,
        minZ: z1 - padHalf,
        maxZ: z1 + padHalf,
        elevation,
      },
      {
        id: `${params.id}-step-${i}-out`,
        minX: x2 - padHalf,
        maxX: x2 + padHalf,
        minZ: z2 - padHalf,
        maxZ: z2 + padHalf,
        elevation,
      }
    );

    treads.push({
      x: params.centerX + cosA * midRadius,
      y: elevation - stepRise * 0.5,
      z: params.centerZ + sinA * midRadius,
      width: treadSpanW,
      height: stepRise,
      depth: Math.max(0.42, arcChordAtOuter * 1.18),
      // Box width aligns along radial direction (cosA, 0, sinA) => yaw = -angle
      rotationY: -angle,
    });
  }

  // Central spiral structural core column (visual + solid AABB core collider)
  if (params.includeInnerCore !== false && params.innerRadius >= 0.45) {
    const coreHalf = Math.max(0.35, params.innerRadius - 0.14);
    railings.push({
      id: `${params.id}-inner-core`,
      role: 'wall',
      x: params.centerX,
      y: params.baseElevation + totalRise * 0.5,
      z: params.centerZ,
      width: coreHalf * 2,
      height: totalRise + 1.05,
      depth: coreHalf * 2,
      collides: true,
      blocksCamera: false,
    });
  }

  // Curved outer balustrade: small square collidable arc posts + rotated non-colliding rail chords
  // Start at s = 1 so the bottom entry threshold at startAngle remains open and unobstructed.
  if (params.includeOuterRailing !== false) {
    const segments = Math.max(8, Math.round(stepCount * 0.75));
    const railRadius = params.outerRadius + 0.08;
    for (let s = 1; s < segments; s++) {
      const a0 = params.startAngle + (angleSpan * s) / segments;
      const a1 = params.startAngle + (angleSpan * (s + 1)) / segments;
      const aMid = (a0 + a1) / 2;
      const tMid = (s + 0.5) / segments;
      const railY = params.baseElevation + tMid * totalRise + 0.52;
      const chordLen = 2 * railRadius * Math.sin(Math.abs(a1 - a0) / 2) + 0.08;

      railings.push({
        id: `${params.id}-outer-rail-seg-${s}`,
        role: 'railing',
        x: params.centerX + Math.cos(aMid) * railRadius,
        y: railY,
        z: params.centerZ + Math.sin(aMid) * railRadius,
        width: 0.1,
        height: 1.04,
        depth: chordLen,
        rotationY: -aMid,
        collides: false,
        blocksCamera: false,
      });

      railings.push({
        id: `${params.id}-outer-rail-post-${s}`,
        role: 'railing',
        x: params.centerX + Math.cos(a0) * railRadius,
        y: params.baseElevation + (s / segments) * totalRise + 0.52,
        z: params.centerZ + Math.sin(a0) * railRadius,
        width: 0.14,
        height: 1.04,
        depth: 0.14,
        collides: true,
        blocksCamera: false,
      });
    }
  }

  return {
    id: params.id,
    fromFloor: params.fromFloor,
    toFloor: params.toFloor,
    steps,
    treads,
    railings,
  };
}

export function addFloorSlab(
  surfaces: InteriorSurfaceSpec[],
  floorSlabs: StepSurface[],
  id: string,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  elevation: number,
  isGroundFloor = false,
  stepOverrides?: { minZ?: number; maxZ?: number }
): void {
  const width = maxX - minX;
  const depth = maxZ - minZ;
  surfaces.push({
    id,
    role: 'floor',
    x: minX + width / 2,
    y: elevation - 0.08,
    z: minZ + depth / 2,
    width,
    height: 0.16,
    depth,
    collides: !isGroundFloor,
    blocksCamera: !isGroundFloor,
  });
  floorSlabs.push({
    id: `${id}-step`,
    minX,
    maxX,
    minZ: stepOverrides?.minZ ?? minZ,
    maxZ: stepOverrides?.maxZ ?? maxZ,
    elevation,
  });
}

export function buildPerimeterShell(params: {
  idPrefix: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  totalHeight: number;
  exitDoorCenterX?: number;
  exitDoorWidth?: number;
  exitDoorHeight?: number;
  northExitDoorCenterX?: number;
  northExitDoorWidth?: number;
  northExitDoorHeight?: number;
  courtyardOpening?: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  courtyardOpenings?: ReadonlyArray<{
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  }>;
}): InteriorSurfaceSpec[] {
  const width = params.maxX - params.minX;
  const depth = params.maxZ - params.minZ;
  const cx = params.minX + width / 2;
  const cz = params.minZ + depth / 2;
  const surfaces: InteriorSurfaceSpec[] = [
    // West & East outer walls
    buildWall(`${params.idPrefix}-wall-west`, params.minX - 0.12, 0, cz, 0.24, params.totalHeight, depth + 0.48),
    buildWall(`${params.idPrefix}-wall-east`, params.maxX + 0.12, 0, cz, 0.24, params.totalHeight, depth + 0.48),
  ];

  // North outer wall (solid or split around optional rear passage doorway)
  if (params.northExitDoorCenterX !== undefined) {
    surfaces.push(
      ...buildWallWithDoorwayX(
        `${params.idPrefix}-wall-north`,
        params.minX - 0.24,
        params.maxX + 0.24,
        params.minZ - 0.12,
        0,
        params.totalHeight,
        params.northExitDoorCenterX,
        params.northExitDoorWidth ?? 1.64,
        params.northExitDoorHeight ?? 2.4,
        0.24
      )
    );
  } else {
    surfaces.push(
      buildWall(`${params.idPrefix}-wall-north`, cx, 0, params.minZ - 0.12, width + 0.48, params.totalHeight, 0.24)
    );
  }

  // Roof ceiling slab(s): split around all courtyard/lightwell openings so sky is truly open
  const roofY = params.totalHeight + 0.09;
  const openings =
    params.courtyardOpenings ?? (params.courtyardOpening ? [params.courtyardOpening] : []);
  if (openings.length > 0) {
    const outerMinX = params.minX - 0.24;
    const outerMaxX = params.maxX + 0.24;
    const outerMinZ = params.minZ - 0.24;
    const outerMaxZ = params.maxZ + 0.24;
    const xs = Array.from(
      new Set([outerMinX, outerMaxX, ...openings.flatMap((o) => [o.minX, o.maxX])])
    ).sort((a, b) => a - b);
    const zs = Array.from(
      new Set([outerMinZ, outerMaxZ, ...openings.flatMap((o) => [o.minZ, o.maxZ])])
    ).sort((a, b) => a - b);

    let cellIdx = 0;
    for (let xi = 0; xi < xs.length - 1; xi++) {
      const x0 = xs[xi];
      const x1 = xs[xi + 1];
      const rw = x1 - x0;
      if (rw <= 0.01) continue;
      const midX = (x0 + x1) / 2;

      for (let zi = 0; zi < zs.length - 1; zi++) {
        const z0 = zs[zi];
        const z1 = zs[zi + 1];
        const rd = z1 - z0;
        if (rd <= 0.01) continue;
        const midZ = (z0 + z1) / 2;

        const insideOpening = openings.some(
          (o) => midX > o.minX && midX < o.maxX && midZ > o.minZ && midZ < o.maxZ
        );
        if (insideOpening) continue;

        surfaces.push({
          id: `${params.idPrefix}-roof-${cellIdx++}`,
          role: 'ceiling',
          x: midX,
          y: roofY,
          z: midZ,
          width: rw,
          height: 0.18,
          depth: rd,
          collides: true,
          blocksCamera: true,
        });
      }
    }
  } else {
    surfaces.push({
      id: `${params.idPrefix}-roof-ceiling`,
      role: 'ceiling',
      x: cx,
      y: roofY,
      z: cz,
      width: width + 0.48,
      height: 0.18,
      depth: depth + 0.48,
      collides: true,
      blocksCamera: true,
    });
  }

  // South wall split around main entrance/exit doorway
  if (params.exitDoorCenterX !== undefined) {
    surfaces.push(
      ...buildWallWithDoorwayX(
        `${params.idPrefix}-wall-south`,
        params.minX - 0.24,
        params.maxX + 0.24,
        params.maxZ + 0.12,
        0,
        params.totalHeight,
        params.exitDoorCenterX,
        params.exitDoorWidth ?? 1.5,
        params.exitDoorHeight ?? 2.4,
        0.24
      )
    );
  } else {
    surfaces.push(
      buildWall(`${params.idPrefix}-wall-south`, cx, 0, params.maxZ + 0.12, width + 0.48, params.totalHeight, 0.24)
    );
  }

  return surfaces;
}
