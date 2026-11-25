import type { AabbCollider, PlayerPhysicsState, StepSurface } from '../types/game';
import { CAMPUS_BOUNDS, CAMPUS_COLLIDERS, CAMPUS_STEPS, PLAYER_SPAWN } from '../world/campusData';

export const PLAYER_RADIUS = 0.42;
export const PLAYER_HEIGHT = 1.72;
export const WALK_SPEED = 4.6;
export const SPRINT_SPEED = 8.2;
export const GRAVITY = 22.0;
export const JUMP_VELOCITY = 8.2;
export const COYOTE_TIME_MAX = 0.11;
export const JUMP_BUFFER_MAX = 0.12;
export const STEP_UP_MAX = 0.36;

export interface MovementIntent {
  moveForward: number; // -1..1 along camera look forward
  moveRight: number; // -1..1 along camera look right
  cameraYaw: number; // radians
  sprint: boolean;
  jumpJustPressed: boolean;
}

export interface WorldBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export function createInitialPlayerState(): PlayerPhysicsState {
  return {
    x: PLAYER_SPAWN.x,
    y: PLAYER_SPAWN.y,
    z: PLAYER_SPAWN.z,
    vx: 0,
    vy: 0,
    vz: 0,
    facingYaw: PLAYER_SPAWN.yaw,
    grounded: true,
    coyoteTimer: COYOTE_TIME_MAX,
    jumpBufferTimer: 0,
    isSprinting: false,
    horizontalSpeed: 0,
  };
}

export function getGroundElevationAt(
  x: number,
  z: number,
  steps: ReadonlyArray<StepSurface> = CAMPUS_STEPS,
  currentY?: number,
  baseElevation = 0.04
): number {
  let maxGround = baseElevation;
  const maxReachableY = currentY !== undefined ? currentY + STEP_UP_MAX + 0.14 : Infinity;
  for (const step of steps) {
    if (step.elevation > maxReachableY) {
      continue;
    }
    if (x >= step.minX && x <= step.maxX && z >= step.minZ && z <= step.maxZ) {
      if (step.elevation > maxGround) {
        maxGround = step.elevation;
      }
    }
  }
  return maxGround;
}

export function overlapsColliderXZ(
  x: number,
  y: number,
  z: number,
  radius: number,
  height: number,
  collider: AabbCollider
): boolean {
  if (y + height <= collider.minY || y >= collider.maxY - 0.05) {
    return false;
  }
  const closestX = Math.max(collider.minX, Math.min(x, collider.maxX));
  const closestZ = Math.max(collider.minZ, Math.min(z, collider.maxZ));
  const dx = x - closestX;
  const dz = z - closestZ;
  return dx * dx + dz * dz < radius * radius;
}

export function resolveHorizontalCollision(
  prevX: number,
  prevZ: number,
  nextX: number,
  nextZ: number,
  y: number,
  radius: number,
  height: number,
  colliders: ReadonlyArray<AabbCollider>,
  bounds: WorldBounds
): { x: number; z: number } {
  // Clamp to campus perimeter first
  let resolvedX = Math.max(bounds.minX + radius, Math.min(bounds.maxX - radius, nextX));
  let resolvedZ = Math.max(bounds.minZ + radius, Math.min(bounds.maxZ - radius, nextZ));

  // Axis-separated resolution allows smooth wall sliding
  // 1. Test X movement while holding prevZ
  for (const col of colliders) {
    if (overlapsColliderXZ(resolvedX, y, prevZ, radius, height, col)) {
      if (prevX <= col.minX) {
        resolvedX = Math.min(resolvedX, col.minX - radius - 0.001);
      } else if (prevX >= col.maxX) {
        resolvedX = Math.max(resolvedX, col.maxX + radius + 0.001);
      } else {
        resolvedX = prevX;
      }
    }
  }

  // 2. Test Z movement using resolvedX
  for (const col of colliders) {
    if (overlapsColliderXZ(resolvedX, y, resolvedZ, radius, height, col)) {
      if (prevZ <= col.minZ) {
        resolvedZ = Math.min(resolvedZ, col.minZ - radius - 0.001);
      } else if (prevZ >= col.maxZ) {
        resolvedZ = Math.max(resolvedZ, col.maxZ + radius + 0.001);
      } else {
        resolvedZ = prevZ;
      }
    }
  }

  return { x: resolvedX, z: resolvedZ };
}

export function stepPlayerPhysics(
  state: PlayerPhysicsState,
  intent: MovementIntent,
  rawDt: number,
  colliders: ReadonlyArray<AabbCollider> = CAMPUS_COLLIDERS,
  steps: ReadonlyArray<StepSurface> = CAMPUS_STEPS,
  bounds: WorldBounds = CAMPUS_BOUNDS,
  baseElevation = 0.04
): { landed: boolean; jumped: boolean } {
  const dt = Math.min(Math.max(rawDt, 0), 0.05);
  if (dt === 0) {
    return { landed: false, jumped: false };
  }

  // Compute camera-relative horizontal desired direction
  // cameraYaw = 0 looks along -Z, right is +X
  const forwardX = -Math.sin(intent.cameraYaw);
  const forwardZ = -Math.cos(intent.cameraYaw);
  const rightX = Math.cos(intent.cameraYaw);
  const rightZ = -Math.sin(intent.cameraYaw);

  let wishX = forwardX * intent.moveForward + rightX * intent.moveRight;
  let wishZ = forwardZ * intent.moveForward + rightZ * intent.moveRight;
  const wishMag = Math.hypot(wishX, wishZ);
  if (wishMag > 1) {
    wishX /= wishMag;
    wishZ /= wishMag;
  }

  const moving = wishMag > 0.05;
  const isSprinting = moving && intent.sprint;
  const targetSpeed = moving ? (isSprinting ? SPRINT_SPEED : WALK_SPEED) * Math.min(1, wishMag) : 0;

  const accel = state.grounded ? 16.0 : 6.5;
  const blend = 1 - Math.exp(-accel * dt);
  const targetVx = wishX * targetSpeed;
  const targetVz = wishZ * targetSpeed;

  state.vx += (targetVx - state.vx) * blend;
  state.vz += (targetVz - state.vz) * blend;
  state.isSprinting = isSprinting;
  state.horizontalSpeed = Math.hypot(state.vx, state.vz);

  // Smoothly turn character toward travel direction
  if (state.horizontalSpeed > 0.25) {
    const desiredYaw = Math.atan2(-state.vx, -state.vz);
    let deltaYaw = desiredYaw - state.facingYaw;
    while (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;
    while (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;
    state.facingYaw += deltaYaw * (1 - Math.exp(-14 * dt));
  }

  // Jump buffer + coyote time
  if (intent.jumpJustPressed) {
    state.jumpBufferTimer = JUMP_BUFFER_MAX;
  } else {
    state.jumpBufferTimer = Math.max(0, state.jumpBufferTimer - dt);
  }

  if (state.grounded) {
    state.coyoteTimer = COYOTE_TIME_MAX;
  } else {
    state.coyoteTimer = Math.max(0, state.coyoteTimer - dt);
  }

  let jumped = false;
  if (state.jumpBufferTimer > 0 && state.coyoteTimer > 0) {
    state.vy = JUMP_VELOCITY;
    state.grounded = false;
    state.coyoteTimer = 0;
    state.jumpBufferTimer = 0;
    jumped = true;
  }

  // Gravity
  state.vy -= GRAVITY * dt;

  // Horizontal move + collision sliding
  const nextX = state.x + state.vx * dt;
  const nextZ = state.z + state.vz * dt;
  const resolved = resolveHorizontalCollision(
    state.x,
    state.z,
    nextX,
    nextZ,
    state.y,
    PLAYER_RADIUS,
    PLAYER_HEIGHT,
    colliders,
    bounds
  );
  state.x = resolved.x;
  state.z = resolved.z;

  // Vertical move + ground/step resolution + ceiling clamp
  const groundY = getGroundElevationAt(state.x, state.z, steps, state.y, baseElevation);
  const prevY = state.y;
  let nextY = state.y + state.vy * dt;

  if (state.vy > 0) {
    for (const col of colliders) {
      if (
        prevY + PLAYER_HEIGHT <= col.minY + 0.05 &&
        nextY + PLAYER_HEIGHT > col.minY &&
        state.x + PLAYER_RADIUS > col.minX &&
        state.x - PLAYER_RADIUS < col.maxX &&
        state.z + PLAYER_RADIUS > col.minZ &&
        state.z - PLAYER_RADIUS < col.maxZ
      ) {
        nextY = col.minY - PLAYER_HEIGHT;
        state.vy = 0;
      }
    }
  }

  state.y = nextY;

  let landed = false;
  if (state.y <= groundY) {
    if (!state.grounded && state.vy < -2.5) {
      landed = true;
    }
    state.y = groundY;
    state.vy = 0;
    state.grounded = true;
  } else if (state.grounded && state.y - groundY <= STEP_UP_MAX && prevY >= groundY - STEP_UP_MAX) {
    // Stick gently when stepping down shallow stairs
    state.y = groundY;
    state.vy = 0;
  } else {
    state.grounded = false;
  }

  return { landed, jumped };
}

/**
 * Pulls a 3rd-person camera closer along its ray from anchor -> desiredCamPos
 * if any building/gate collider intersects the line of sight.
 */
export function resolveCameraObstruction(
  anchorX: number,
  anchorY: number,
  anchorZ: number,
  desiredX: number,
  desiredY: number,
  desiredZ: number,
  colliders: ReadonlyArray<AabbCollider> = CAMPUS_COLLIDERS
): { x: number; y: number; z: number } {
  const dx = desiredX - anchorX;
  const dy = desiredY - anchorY;
  const dz = desiredZ - anchorZ;
  const dist = Math.hypot(dx, dy, dz);
  if (dist < 0.001) return { x: desiredX, y: desiredY, z: desiredZ };

  let bestT = 1.0;
  const margin = 0.35;

  for (const col of colliders) {
    // Slab intersection for ray anchor + t * (desired - anchor), t in [0, 1]
    let tMin = 0;
    let tMax = bestT;

    const axes: Array<[number, number, number, number]> = [
      [anchorX, dx, col.minX - margin, col.maxX + margin],
      [anchorY, dy, col.minY, col.maxY + margin],
      [anchorZ, dz, col.minZ - margin, col.maxZ + margin],
    ];

    let hit = true;
    for (const [origin, dir, minB, maxB] of axes) {
      if (Math.abs(dir) < 1e-6) {
        if (origin < minB || origin > maxB) {
          hit = false;
          break;
        }
      } else {
        const inv = 1 / dir;
        let t1 = (minB - origin) * inv;
        let t2 = (maxB - origin) * inv;
        if (t1 > t2) {
          const tmp = t1;
          t1 = t2;
          t2 = tmp;
        }
        tMin = Math.max(tMin, t1);
        tMax = Math.min(tMax, t2);
        if (tMin > tMax) {
          hit = false;
          break;
        }
      }
    }

    if (hit && tMin > 0.05 && tMin < bestT) {
      bestT = Math.max(0.22, tMin);
    }
  }

  return {
    x: anchorX + dx * bestT,
    y: Math.max(0.45, anchorY + dy * bestT),
    z: anchorZ + dz * bestT,
  };
}
