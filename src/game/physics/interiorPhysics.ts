import type { AabbCollider, PlayerPhysicsState, StepSurface } from '../types/game';
import type {
  ExteriorAnchor,
  InteriorDoorSpec,
  InteriorFloor,
  InteriorRoom,
  InteriorWorld,
  NearbyInteractionPrompt,
} from '../types/interior';
import { CAMPUS_BOUNDS, CAMPUS_COLLIDERS } from '../world/campusData';
import {
  COYOTE_TIME_MAX,
  overlapsColliderXZ,
  PLAYER_HEIGHT,
  PLAYER_RADIUS,
  resolveHorizontalCollision,
  type WorldBounds,
} from './collision';

export function buildInitialDoorStates(interior: InteriorWorld): Record<string, boolean> {
  const states: Record<string, boolean> = {};
  for (const door of interior.doors) {
    states[door.id] = door.defaultOpen;
  }
  return states;
}

export function buildInteriorRuntimeColliders(
  interior: InteriorWorld,
  doorStates: Record<string, boolean>
): AabbCollider[] {
  const colliders: AabbCollider[] = [];

  for (const surface of interior.surfaces) {
    if (!surface.collides) continue;
    colliders.push({
      id: surface.id,
      label: surface.role,
      minX: surface.x - surface.width / 2,
      maxX: surface.x + surface.width / 2,
      minY: surface.y - surface.height / 2,
      maxY: surface.y + surface.height / 2,
      minZ: surface.z - surface.depth / 2,
      maxZ: surface.z + surface.depth / 2,
    });
  }

  for (const stair of interior.stairs) {
    for (const rail of stair.railings) {
      if (!rail.collides) continue;
      colliders.push({
        id: rail.id,
        label: rail.role,
        minX: rail.x - rail.width / 2,
        maxX: rail.x + rail.width / 2,
        minY: rail.y - rail.height / 2,
        maxY: rail.y + rail.height / 2,
        minZ: rail.z - rail.depth / 2,
        maxZ: rail.z + rail.depth / 2,
      });
    }
  }

  for (const item of interior.furniture) {
    if (item.collider) {
      colliders.push(item.collider);
    }
  }

  for (const door of interior.doors) {
    const isOpen = doorStates[door.id] ?? door.defaultOpen;
    if (!isOpen) {
      colliders.push(door.closedCollider);
    }
  }

  return colliders;
}

export function buildInteriorCameraColliders(
  interior: InteriorWorld,
  doorStates: Record<string, boolean>
): AabbCollider[] {
  const skipCameraIds = new Set(
    interior.surfaces
      .filter(
        (s) =>
          s.collides &&
          ((s.role === 'floor' && s.blocksCamera !== true) || s.blocksCamera === false)
      )
      .map((s) => s.id)
  );
  return buildInteriorRuntimeColliders(interior, doorStates).filter(
    (col) => !skipCameraIds.has(col.id)
  );
}

export function buildInteriorStepSurfaces(interior: InteriorWorld): StepSurface[] {
  const steps: StepSurface[] = [...interior.floorSlabs];
  for (const stair of interior.stairs) {
    steps.push(...stair.steps);
  }
  return steps;
}

export function createInteriorSpawnState(
  interior: InteriorWorld,
  doorStates: Record<string, boolean> = buildInitialDoorStates(interior),
  spawnOverride?: ExteriorAnchor
): PlayerPhysicsState {
  const spawn = spawnOverride ?? interior.spawnPoint;
  const colliders = buildInteriorRuntimeColliders(interior, doorStates);
  const resolved = resolveHorizontalCollision(
    spawn.x,
    spawn.z,
    spawn.x,
    spawn.z,
    spawn.y,
    PLAYER_RADIUS,
    PLAYER_HEIGHT,
    colliders,
    interior.bounds
  );

  return {
    x: resolved.x,
    y: spawn.y,
    z: resolved.z,
    vx: 0,
    vy: 0,
    vz: 0,
    facingYaw: spawn.yaw,
    grounded: true,
    coyoteTimer: COYOTE_TIME_MAX,
    jumpBufferTimer: 0,
    isSprinting: false,
    horizontalSpeed: 0,
  };
}

export function createExteriorReturnState(
  returnTarget: ExteriorAnchor,
  colliders: ReadonlyArray<AabbCollider> = CAMPUS_COLLIDERS,
  bounds: WorldBounds = CAMPUS_BOUNDS
): PlayerPhysicsState {
  const resolved = resolveHorizontalCollision(
    returnTarget.x,
    returnTarget.z,
    returnTarget.x,
    returnTarget.z,
    returnTarget.y,
    PLAYER_RADIUS,
    PLAYER_HEIGHT,
    colliders,
    bounds
  );

  return {
    x: resolved.x,
    y: returnTarget.y,
    z: resolved.z,
    vx: 0,
    vy: 0,
    vz: 0,
    facingYaw: returnTarget.yaw,
    grounded: true,
    coyoteTimer: COYOTE_TIME_MAX,
    jumpBufferTimer: 0,
    isSprinting: false,
    horizontalSpeed: 0,
  };
}

export function canToggleDoorSafely(
  door: InteriorDoorSpec,
  currentlyOpen: boolean,
  player: Pick<PlayerPhysicsState, 'x' | 'y' | 'z'>
): boolean {
  if (!currentlyOpen) {
    return true; // Opening a door is always safe
  }
  // Prevent closing a door directly onto the player's body
  return !overlapsColliderXZ(
    player.x,
    player.y,
    player.z,
    PLAYER_RADIUS + 0.08,
    PLAYER_HEIGHT,
    door.closedCollider
  );
}

export function findNearestInteriorInteraction(
  x: number,
  y: number,
  z: number,
  interior: InteriorWorld,
  doorStates: Record<string, boolean>,
  maxDistance = 2.25
): NearbyInteractionPrompt | null {
  let bestPrompt: NearbyInteractionPrompt | null = null;
  let bestDistSq = maxDistance * maxDistance;

  for (const door of interior.doors) {
    if (Math.abs(y - door.hingeY) > 1.7) continue;

    const centerX = (door.closedCollider.minX + door.closedCollider.maxX) / 2;
    const centerZ = (door.closedCollider.minZ + door.closedCollider.maxZ) / 2;
    const dx = x - centerX;
    const dz = z - centerZ;
    const distSq = dx * dx + dz * dz;

    if (distSq <= bestDistSq) {
      bestDistSq = distSq;
      if (door.kind === 'building-exit') {
        bestPrompt = {
          id: door.id,
          kind: 'exit-interior',
          label: door.subtitle ? `Exit to ${door.subtitle}` : 'Exit to Campus',
          targetId: door.id,
          returnAnchor: door.exitReturnAnchor,
        };
      } else {
        const isOpen = doorStates[door.id] ?? door.defaultOpen;
        bestPrompt = {
          id: door.id,
          kind: 'toggle-door',
          label: `${isOpen ? 'Close' : 'Open'} ${door.label}`,
          targetId: door.id,
        };
      }
    }
  }

  return bestPrompt;
}

export function getInteriorFloorAt(y: number, interior: InteriorWorld): InteriorFloor {
  let closest = interior.floors[0];
  let bestDiff = Math.abs(y - closest.elevation);
  for (const floor of interior.floors) {
    const diff = Math.abs(y - floor.elevation);
    if (diff < bestDiff) {
      bestDiff = diff;
      closest = floor;
    }
  }
  return closest;
}

export function getInteriorRoomAt(
  x: number,
  y: number,
  z: number,
  interior: InteriorWorld
): { room: InteriorRoom | null; floor: InteriorFloor } {
  const floor = getInteriorFloorAt(y, interior);
  for (const room of interior.rooms) {
    if (room.floorLevel !== floor.level) continue;
    if (x >= room.minX && x <= room.maxX && z >= room.minZ && z <= room.maxZ) {
      return { room, floor };
    }
  }
  return { room: null, floor };
}
