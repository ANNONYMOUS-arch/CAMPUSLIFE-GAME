import {
  getGroundElevationAt,
  PLAYER_RADIUS,
  resolveHorizontalCollision,
  type WorldBounds,
} from '../physics/collision';
import type { AabbCollider, StepSurface } from '../types/game';
import type {
  NpcNavGraph,
  NpcSeatSpot,
  PlayerSnapshotForNpc,
  StudentNpcProfile,
  StudentNpcRuntimeState,
} from '../types/npc';
import { findNavPath, findNearestNavNodeId } from './campusNavGraph';

export const NPC_RADIUS = 0.36;
export const NPC_HEIGHT = 1.72;
export const PLAYER_NPC_MIN_SEPARATION = PLAYER_RADIUS + NPC_RADIUS + 0.12; // ~0.90m

export interface NpcSimulationOptions {
  /** Force full simulation rate regardless of distance (useful for deterministic unit tests) */
  disableLodThrottling?: boolean;
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function deterministicFloat(seed: number): number {
  let x = (seed ^ 0x9e3779b9) >>> 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return (x >>> 0) / 4294967296;
}

function wrapAngleDelta(delta: number): number {
  let d = delta;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function yawFromVelocity(vx: number, vz: number, fallbackYaw: number): number {
  if (Math.hypot(vx, vz) < 0.08) return fallbackYaw;
  return Math.atan2(-vx, -vz);
}

function dampYaw(current: number, target: number, rate: number, dt: number): number {
  const delta = wrapAngleDelta(target - current);
  return current + delta * (1 - Math.exp(-rate * dt));
}

function pickDestinationNodeId(
  npc: StudentNpcRuntimeState,
  graph: NpcNavGraph,
  seedCounter: number
): string | null {
  const allNodes = Object.values(graph.nodes);
  if (allNodes.length <= 1) return null;

  const preferred = allNodes.filter(
    (n) =>
      n.id !== npc.currentNodeId &&
      npc.profile.preferredZones.includes(n.zoneTag)
  );
  const candidates = preferred.length > 0 ? preferred : allNodes.filter((n) => n.id !== npc.currentNodeId);
  if (candidates.length === 0) return null;

  const r = deterministicFloat(hashString(npc.id) + seedCounter * 7919);
  const picked = candidates[Math.floor(r * candidates.length) % candidates.length];
  return picked.id;
}

function isSeatOccupied(
  seatId: string,
  npcs: ReadonlyArray<StudentNpcRuntimeState>,
  excludeNpcId: string
): boolean {
  for (const other of npcs) {
    if (other.id !== excludeNpcId && other.activeSeatId === seatId) {
      return true;
    }
  }
  return false;
}

function isWaitSpotOccupied(
  waitId: string,
  npcs: ReadonlyArray<StudentNpcRuntimeState>,
  excludeNpcId: string
): boolean {
  for (const other of npcs) {
    if (other.id !== excludeNpcId && other.activeWaitId === waitId) {
      return true;
    }
  }
  return false;
}

export function createNpcCrowdState(
  profiles: ReadonlyArray<StudentNpcProfile>,
  graph: NpcNavGraph,
  colliders: ReadonlyArray<AabbCollider>,
  steps: ReadonlyArray<StepSurface>,
  bounds: WorldBounds,
  baseElevation: number
): StudentNpcRuntimeState[] {
  const activeIds = new Set(profiles.map((p) => p.id));
  const seatMap = new Map<string, NpcSeatSpot>(graph.seats.map((s) => [s.id, s]));
  const waitMap = new Map(graph.waitSpots.map((w) => [w.id, w]));

  const states: StudentNpcRuntimeState[] = [];

  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i];
    const beh = profile.initialBehavior;
    const phaseOffset = ((hashString(profile.id) % 1000) / 1000) * Math.PI * 2;

    let x = 0;
    let y = baseElevation;
    let z = 0;
    let yaw = 0;
    let activity: StudentNpcRuntimeState['activity'] = 'idle';
    let pose: StudentNpcRuntimeState['pose'] = 'idle';
    let pathNodeIds: string[] = [];
    let pathIndex = 0;
    let currentNodeId = Object.keys(graph.nodes)[0] ?? '';
    let destinationNodeId: string | null = null;
    let activeSeatId: string | null = null;
    let activeWaitId: string | null = null;
    let seatSurfaceY: number | null = null;
    let dwellTimer = 4.0;
    let groupLeaderId: string | null = null;
    let groupSideOffset = 0.85;
    let talkPartnerId: string | null = null;

    if (beh.kind === 'sit' && seatMap.has(beh.seatId)) {
      const seat = seatMap.get(beh.seatId)!;
      x = seat.x;
      y = Math.max(baseElevation, seat.y);
      z = seat.z;
      yaw = seat.yaw;
      activity = 'sitting';
      pose = 'sitting';
      currentNodeId = seat.nearbyNodeId;
      activeSeatId = seat.id;
      seatSurfaceY = seat.seatSurfaceY;
      dwellTimer = beh.duration;
    } else if (beh.kind === 'talk' && waitMap.has(beh.waitId)) {
      const wait = waitMap.get(beh.waitId)!;
      const partnerPresent = activeIds.has(beh.partnerId);
      if (beh.role === 'partner' && wait.partnerX !== undefined && wait.partnerZ !== undefined) {
        x = wait.partnerX;
        z = wait.partnerZ;
        yaw = wait.partnerYaw ?? wait.yaw + Math.PI;
      } else {
        x = wait.x;
        z = wait.z;
        yaw = wait.yaw;
      }
      y = getGroundElevationAt(x, z, steps, wait.y, baseElevation);
      currentNodeId = wait.nearbyNodeId;
      activeWaitId = wait.id;
      dwellTimer = beh.duration;
      if (partnerPresent) {
        activity = 'talking';
        pose = 'talking';
        talkPartnerId = beh.partnerId;
      } else {
        activity = 'waiting';
        pose = 'idle';
      }
    } else if (beh.kind === 'wait' && waitMap.has(beh.waitId)) {
      const wait = waitMap.get(beh.waitId)!;
      x = wait.x;
      z = wait.z;
      y = getGroundElevationAt(x, z, steps, wait.y, baseElevation);
      yaw = wait.yaw;
      currentNodeId = wait.nearbyNodeId;
      activeWaitId = wait.id;
      activity = 'waiting';
      pose = 'idle';
      dwellTimer = beh.duration;
    } else if (beh.kind === 'walk' || beh.kind === 'group-walk') {
      const startNode = graph.nodes[beh.startNodeId] ?? Object.values(graph.nodes)[0];
      if (startNode) {
        currentNodeId = startNode.id;
        x = startNode.x;
        z = startNode.z;
        if (beh.kind === 'group-walk' && beh.leaderId && activeIds.has(beh.leaderId)) {
          groupLeaderId = beh.leaderId;
          groupSideOffset = beh.sideOffset ?? 0.88;
          x += groupSideOffset;
          activity = 'group-walk';
        } else {
          activity = beh.kind === 'group-walk' && !beh.leaderId ? 'group-walk' : 'walking';
        }
        const safePos = resolveHorizontalCollision(
          startNode.x,
          startNode.z,
          x,
          z,
          baseElevation,
          NPC_RADIUS,
          NPC_HEIGHT,
          colliders,
          bounds
        );
        x = safePos.x;
        z = safePos.z;
        y = getGroundElevationAt(x, z, steps, startNode.y, baseElevation);

        const path = findNavPath(graph, startNode.id, beh.targetNodeId);
        if (path.length >= 2) {
          pathNodeIds = path;
          pathIndex = 1;
          destinationNodeId = beh.targetNodeId;
          pose = 'walking';
          const nextN = graph.nodes[path[1]];
          if (nextN) {
            yaw = yawFromVelocity(nextN.x - x, nextN.z - z, 0);
          }
        } else {
          activity = 'idle';
          pose = 'idle';
          dwellTimer = 3.0;
        }
      }
    }

    states.push({
      id: profile.id,
      profile,
      x,
      y,
      z,
      vx: 0,
      vz: 0,
      rotationYaw: yaw,
      horizontalSpeed: 0,
      activity,
      pose,
      pathNodeIds,
      pathIndex,
      currentNodeId,
      destinationNodeId,
      activeSeatId,
      activeWaitId,
      seatSurfaceY,
      dwellTimer,
      stuckTimer: 0,
      stuckCheckX: x,
      stuckCheckZ: z,
      groupLeaderId,
      groupSideOffset,
      talkPartnerId,
      phaseOffset,
      lodTier: 'near',
      lodAccumulator: 0,
    });
  }

  return states;
}

function transitionToNextWalk(
  npc: StudentNpcRuntimeState,
  graph: NpcNavGraph,
  stepCounter: number
): void {
  const nearest = graph.nodes[npc.currentNodeId]
    ? npc.currentNodeId
    : findNearestNavNodeId(graph, npc.x, npc.z);
  if (!nearest) {
    npc.activity = 'idle';
    npc.pose = 'idle';
    npc.dwellTimer = 4.0;
    return;
  }
  npc.currentNodeId = nearest;
  const targetId = pickDestinationNodeId(npc, graph, stepCounter);
  if (!targetId) {
    npc.activity = 'idle';
    npc.pose = 'idle';
    npc.dwellTimer = 4.0;
    return;
  }
  const path = findNavPath(graph, nearest, targetId);
  if (path.length >= 2) {
    npc.pathNodeIds = path;
    npc.pathIndex = 1;
    npc.destinationNodeId = targetId;
    npc.activity = npc.groupLeaderId ? 'group-walk' : 'walking';
    npc.pose = 'walking';
    npc.stuckTimer = 0;
    npc.stuckCheckX = npc.x;
    npc.stuckCheckZ = npc.z;
  } else {
    npc.activity = 'idle';
    npc.pose = 'idle';
    npc.dwellTimer = 3.5;
  }
}

function handleNodeArrival(
  npc: StudentNpcRuntimeState,
  npcs: ReadonlyArray<StudentNpcRuntimeState>,
  graph: NpcNavGraph,
  steps: ReadonlyArray<StepSurface>,
  baseElevation: number,
  stepCounter: number
): void {
  const arrivedNodeId = npc.pathNodeIds[npc.pathIndex] ?? npc.currentNodeId;
  npc.currentNodeId = arrivedNodeId;
  npc.pathNodeIds = [];
  npc.pathIndex = 0;
  npc.destinationNodeId = null;

  const r = deterministicFloat(hashString(npc.id) + stepCounter * 3571);

  // 1. Check if there's an unoccupied bench/seat right at this node
  const canSitCleanly =
    !npc.profile.appearance.hasBackpack &&
    npc.profile.appearance.dressStyle === 'none' &&
    npc.profile.appearance.bottomStyle !== 'midi-skirt';
  if (!npc.groupLeaderId && canSitCleanly && r < 0.34) {
    const freeSeat = graph.seats.find(
      (s) => s.nearbyNodeId === arrivedNodeId && !isSeatOccupied(s.id, npcs, npc.id)
    );
    if (freeSeat) {
      npc.activeSeatId = freeSeat.id;
      npc.seatSurfaceY = freeSeat.seatSurfaceY;
      npc.x = freeSeat.x;
      npc.y = Math.max(baseElevation, freeSeat.y);
      npc.z = freeSeat.z;
      npc.vx = 0;
      npc.vz = 0;
      npc.horizontalSpeed = 0;
      npc.rotationYaw = freeSeat.yaw;
      npc.activity = 'sitting';
      npc.pose = 'sitting';
      npc.dwellTimer = 11 + r * 12;
      return;
    }
  }

  // 2. Check if there's a wait spot right at this node
  if (!npc.groupLeaderId && r < 0.56) {
    const freeWait = graph.waitSpots.find(
      (w) => w.nearbyNodeId === arrivedNodeId && !isWaitSpotOccupied(w.id, npcs, npc.id)
    );
    if (freeWait) {
      npc.activeWaitId = freeWait.id;
      npc.x = freeWait.x;
      npc.z = freeWait.z;
      npc.y = getGroundElevationAt(npc.x, npc.z, steps, npc.y, baseElevation);
      npc.vx = 0;
      npc.vz = 0;
      npc.horizontalSpeed = 0;
      npc.rotationYaw = freeWait.yaw;
      npc.activity = 'waiting';
      npc.pose = 'idle';
      npc.dwellTimer = 6 + r * 8;
      return;
    }
  }

  // 3. Brief idle pause or immediate continuation
  if (r < 0.72) {
    npc.vx = 0;
    npc.vz = 0;
    npc.horizontalSpeed = 0;
    npc.activity = 'idle';
    npc.pose = 'idle';
    npc.dwellTimer = 2.0 + r * 3.5;
    return;
  }

  transitionToNextWalk(npc, graph, stepCounter + 17);
}

export function stepNpcCrowd(
  npcs: StudentNpcRuntimeState[],
  graph: NpcNavGraph,
  player: PlayerSnapshotForNpc,
  rawDt: number,
  colliders: ReadonlyArray<AabbCollider>,
  steps: ReadonlyArray<StepSurface>,
  bounds: WorldBounds,
  baseElevation: number,
  stepCounter = 0,
  options: NpcSimulationOptions = {}
): void {
  const frameDt = Math.min(Math.max(rawDt, 0), 0.05);
  if (frameDt === 0) return;

  const npcById = new Map<string, StudentNpcRuntimeState>(npcs.map((n) => [n.id, n]));
  const seatById = new Map<string, NpcSeatSpot>(graph.seats.map((s) => [s.id, s]));

  for (let i = 0; i < npcs.length; i++) {
    const npc = npcs[i];

    // 1. Distance-based LOD tier calculation
    const distToPlayer = player.active
      ? Math.hypot(npc.x - player.x, npc.z - player.z)
      : 0;
    if (options.disableLodThrottling || distToPlayer <= 55) {
      npc.lodTier = 'near';
    } else if (distToPlayer <= 115) {
      npc.lodTier = 'mid';
    } else {
      npc.lodTier = 'far';
    }

    let stepDt = frameDt;
    if (npc.lodTier === 'mid') {
      npc.lodAccumulator += frameDt;
      if (npc.lodAccumulator < 0.08) continue;
      stepDt = Math.min(npc.lodAccumulator, 0.12);
      npc.lodAccumulator = 0;
    } else if (npc.lodTier === 'far') {
      npc.lodAccumulator += frameDt;
      if (npc.lodAccumulator < 0.2) continue;
      stepDt = Math.min(npc.lodAccumulator, 0.25);
      npc.lodAccumulator = 0;
    } else {
      npc.lodAccumulator = 0;
    }

    // 2. Stationary activities (sitting, waiting, idle, talking)
    if (
      npc.activity === 'sitting' ||
      npc.activity === 'waiting' ||
      npc.activity === 'idle' ||
      npc.activity === 'talking'
    ) {
      npc.vx = 0;
      npc.vz = 0;
      npc.horizontalSpeed = 0;

      // Face talking partner if talking
      if (npc.activity === 'talking' && npc.talkPartnerId) {
        const partner = npcById.get(npc.talkPartnerId);
        if (partner && partner.activity === 'talking') {
          const targetYaw = yawFromVelocity(partner.x - npc.x, partner.z - npc.z, npc.rotationYaw);
          npc.rotationYaw = dampYaw(npc.rotationYaw, targetYaw, 6, stepDt);
        }
      }

      // If player walks right into a standing/waiting/idle NPC, gently yield out of personal space
      if (npc.activity !== 'sitting' && player.active && Math.abs(npc.y - player.y) < 1.8) {
        const dxP = npc.x - player.x;
        const dzP = npc.z - player.z;
        const dP = Math.hypot(dxP, dzP);
        if (dP < PLAYER_NPC_MIN_SEPARATION) {
          const nx = dP > 0.001 ? dxP / dP : 1;
          const nz = dP > 0.001 ? dzP / dP : 0;
          const pushTargetX = player.x + nx * (PLAYER_NPC_MIN_SEPARATION + 0.08);
          const pushTargetZ = player.z + nz * (PLAYER_NPC_MIN_SEPARATION + 0.08);
          const resolved = resolveHorizontalCollision(
            npc.x,
            npc.z,
            pushTargetX,
            pushTargetZ,
            npc.y,
            NPC_RADIUS,
            NPC_HEIGHT,
            colliders,
            bounds
          );
          npc.x = resolved.x;
          npc.z = resolved.z;
        }
      }

      npc.dwellTimer -= stepDt;
      if (npc.dwellTimer <= 0) {
        // Stand up cleanly from seat onto nearbyNodeId
        if (npc.activity === 'sitting' && npc.activeSeatId) {
          const seat = seatById.get(npc.activeSeatId);
          if (seat) {
            const standNode = graph.nodes[seat.nearbyNodeId];
            if (standNode) {
              npc.x = standNode.x;
              npc.z = standNode.z;
              npc.y = getGroundElevationAt(npc.x, npc.z, steps, standNode.y, baseElevation);
              npc.currentNodeId = standNode.id;
            }
          }
          npc.activeSeatId = null;
          npc.seatSurfaceY = null;
        }
        npc.activeWaitId = null;
        npc.talkPartnerId = null;
        transitionToNextWalk(npc, graph, stepCounter + i * 31);
      }
      continue;
    }

    // 3. Walking / Group-walk steering
    let targetX = npc.x;
    let targetZ = npc.z;
    let hasWaypointTarget = false;
    let isGroupFollower = false;

    if (npc.groupLeaderId) {
      const leader = npcById.get(npc.groupLeaderId);
      if (leader && (leader.activity === 'walking' || leader.activity === 'group-walk')) {
        isGroupFollower = true;
        const fwdX = -Math.sin(leader.rotationYaw);
        const fwdZ = -Math.cos(leader.rotationYaw);
        const rightX = Math.cos(leader.rotationYaw);
        const rightZ = -Math.sin(leader.rotationYaw);
        targetX = leader.x + rightX * npc.groupSideOffset - fwdX * 0.42;
        targetZ = leader.z + rightZ * npc.groupSideOffset - fwdZ * 0.42;
        hasWaypointTarget = true;
        npc.currentNodeId = leader.currentNodeId;
      } else if (leader && leader.activity !== 'walking') {
        // Leader paused; follower switches to independent campus walk cleanly
        npc.groupLeaderId = null;
      }
    }

    if (!isGroupFollower) {
      if (npc.pathNodeIds.length === 0 || npc.pathIndex >= npc.pathNodeIds.length) {
        transitionToNextWalk(npc, graph, stepCounter + i * 19);
      }
      const targetNodeId = npc.pathNodeIds[npc.pathIndex];
      const targetNode = targetNodeId ? graph.nodes[targetNodeId] : undefined;
      if (targetNode) {
        targetX = targetNode.x;
        targetZ = targetNode.z;
        hasWaypointTarget = true;
      }
    }

    if (!hasWaypointTarget) {
      npc.activity = 'idle';
      npc.pose = 'idle';
      npc.dwellTimer = 2.5;
      continue;
    }

    const toTargetX = targetX - npc.x;
    const toTargetZ = targetZ - npc.z;
    const distToTarget = Math.hypot(toTargetX, toTargetZ);

    // Arrival check
    if (!isGroupFollower && distToTarget < 0.72) {
      const arrivedId = npc.pathNodeIds[npc.pathIndex];
      if (arrivedId) npc.currentNodeId = arrivedId;

      if (npc.pathIndex < npc.pathNodeIds.length - 1) {
        npc.pathIndex += 1;
        continue;
      } else {
        handleNodeArrival(npc, npcs, graph, steps, baseElevation, stepCounter + i * 29);
        continue;
      }
    }

    // Desired velocity toward waypoint
    let desiredDirX = distToTarget > 0.01 ? toTargetX / distToTarget : 0;
    let desiredDirZ = distToTarget > 0.01 ? toTargetZ / distToTarget : 0;

    // Gentle personal-space repulsion from other NPCs
    for (let j = 0; j < npcs.length; j++) {
      if (i === j) continue;
      const other = npcs[j];
      if (other.activity === 'sitting' || Math.abs(other.y - npc.y) > 1.6) continue;
      const dx = npc.x - other.x;
      const dz = npc.z - other.z;
      const dist = Math.hypot(dx, dz);
      const minSep = 0.96;
      if (dist > 0.001 && dist < minSep) {
        const push = ((minSep - dist) / minSep) * 1.15;
        desiredDirX += (dx / dist) * push;
        desiredDirZ += (dz / dist) * push;
      }
    }

    // Polite player avoidance steering (side-steps around player without trapping)
    let speedMultiplier = isGroupFollower ? Math.min(1.12, distToTarget * 1.15) : 1.0;
    if (isGroupFollower && distToTarget < 0.35) {
      speedMultiplier = 0.25;
    }

    if (player.active && Math.abs(npc.y - player.y) < 1.8) {
      const dx = npc.x - player.x;
      const dz = npc.z - player.z;
      const dist = Math.hypot(dx, dz);
      const avoidRadius = 1.75;
      if (dist > 0.001 && dist < avoidRadius) {
        const inv = 1 / dist;
        const rx = dx * inv;
        const rz = dz * inv;
        // Tangent side-step perpendicular to radial vector
        const sideSign = i % 2 === 0 ? 1 : -1;
        const tx = -rz * sideSign;
        const tz = rx * sideSign;
        const strength = (avoidRadius - dist) / avoidRadius;
        desiredDirX += rx * strength * 1.6 + tx * strength * 1.1;
        desiredDirZ += rz * strength * 1.6 + tz * strength * 1.1;
      }
    }

    const dirMag = Math.hypot(desiredDirX, desiredDirZ);
    if (dirMag > 0.001) {
      desiredDirX /= dirMag;
      desiredDirZ /= dirMag;
    }

    const targetSpeed = npc.profile.walkSpeed * Math.max(0.2, Math.min(1.15, speedMultiplier));
    const accelBlend = 1 - Math.exp(-8.5 * stepDt);
    npc.vx += (desiredDirX * targetSpeed - npc.vx) * accelBlend;
    npc.vz += (desiredDirZ * targetSpeed - npc.vz) * accelBlend;

    const candidateX = npc.x + npc.vx * stepDt;
    const candidateZ = npc.z + npc.vz * stepDt;

    const resolved = resolveHorizontalCollision(
      npc.x,
      npc.z,
      candidateX,
      candidateZ,
      npc.y,
      NPC_RADIUS,
      NPC_HEIGHT,
      colliders,
      bounds
    );

    // Enforce hard separation from player if within PLAYER_NPC_MIN_SEPARATION
    let finalX = resolved.x;
    let finalZ = resolved.z;
    if (player.active && Math.abs(npc.y - player.y) < 1.8) {
      const dxP = finalX - player.x;
      const dzP = finalZ - player.z;
      const distP = Math.hypot(dxP, dzP);
      if (distP < PLAYER_NPC_MIN_SEPARATION) {
        const nx = distP > 0.001 ? dxP / distP : 1;
        const nz = distP > 0.001 ? dzP / distP : 0;
        const sepResolved = resolveHorizontalCollision(
          finalX,
          finalZ,
          player.x + nx * (PLAYER_NPC_MIN_SEPARATION + 0.02),
          player.z + nz * (PLAYER_NPC_MIN_SEPARATION + 0.02),
          npc.y,
          NPC_RADIUS,
          NPC_HEIGHT,
          colliders,
          bounds
        );
        finalX = sepResolved.x;
        finalZ = sepResolved.z;
      }
    }

    const actualDx = finalX - npc.x;
    const actualDz = finalZ - npc.z;
    npc.x = finalX;
    npc.z = finalZ;
    npc.y = getGroundElevationAt(npc.x, npc.z, steps, npc.y, baseElevation);
    npc.horizontalSpeed = Math.hypot(actualDx, actualDz) / stepDt;
    npc.pose = npc.horizontalSpeed > 0.18 ? 'walking' : 'idle';

    if (npc.horizontalSpeed > 0.2) {
      const targetYaw = yawFromVelocity(actualDx, actualDz, npc.rotationYaw);
      npc.rotationYaw = dampYaw(npc.rotationYaw, targetYaw, 9.0, stepDt);
    }

    // 4. Stuck detection & recovery
    npc.stuckTimer += stepDt;
    if (npc.stuckTimer >= 1.9) {
      const moved = Math.hypot(npc.x - npc.stuckCheckX, npc.z - npc.stuckCheckZ);
      npc.stuckTimer = 0;
      npc.stuckCheckX = npc.x;
      npc.stuckCheckZ = npc.z;

      if (moved < 0.22 && !isGroupFollower) {
        // Reroute from nearest clean node or safely pause in idle
        const nearestId = findNearestNavNodeId(graph, npc.x, npc.z);
        if (nearestId) {
          npc.currentNodeId = nearestId;
          transitionToNextWalk(npc, graph, stepCounter + i * 53 + 7);
        } else {
          npc.activity = 'idle';
          npc.pose = 'idle';
          npc.dwellTimer = 3.0;
        }
      }
    }
  }
}
