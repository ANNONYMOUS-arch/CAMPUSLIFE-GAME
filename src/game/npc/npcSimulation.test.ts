import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { overlapsColliderXZ } from '../physics/collision';
import {
  buildInitialDoorStates,
  buildInteriorRuntimeColliders,
  buildInteriorStepSurfaces,
} from '../physics/interiorPhysics';
import { buildCharacterRig } from '../three/CharacterBuilder';
import {
  CAMPUS_BOUNDS,
  CAMPUS_COLLIDERS,
  CAMPUS_STEPS,
  CAMPUS_STREETLIGHTS,
  CAMPUS_TREES,
} from '../world/campusData';
import { getInteriorById } from '../world/interiorRegistry';
import {
  CAMPUS_EXTERIOR_NAV_GRAPH,
  findNavPath,
  INTERIOR_NAV_GRAPHS,
} from './campusNavGraph';
import {
  EXTERIOR_STUDENT_ROSTER,
  getStudentRosterForWorld,
  INTERIOR_STUDENT_ROSTERS,
  resolveMaxActiveNpcs,
} from './npcCatalog';
import {
  createNpcCrowdState,
  NPC_HEIGHT,
  NPC_RADIUS,
  PLAYER_NPC_MIN_SEPARATION,
  stepNpcCrowd,
} from './npcSimulation';

function checkSegmentClearOfColliders(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  y: number,
  radius: number,
  colliders: ReadonlyArray<{ id: string; label: string; minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number }>
): string | null {
  const len = Math.hypot(bx - ax, bz - az);
  const steps = Math.max(4, Math.ceil(len / 0.5));
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const px = ax + (bx - ax) * t;
    const pz = az + (bz - az) * t;
    for (const col of colliders) {
      if (overlapsColliderXZ(px, y, pz, radius, NPC_HEIGHT, col)) {
        return `${col.id} (${col.label}) at (${px.toFixed(2)}, ${pz.toFixed(2)})`;
      }
    }
  }
  return null;
}

test('student NPC catalog creates diverse grounded characters with zero identical clones', () => {
  const signatures = new Set<string>();
  const allProfiles = [
    ...EXTERIOR_STUDENT_ROSTER,
    ...Object.values(INTERIOR_STUDENT_ROSTERS).flat(),
  ];

  assert.ok(EXTERIOR_STUDENT_ROSTER.length >= 18, 'Expected at least 18 exterior students');

  for (const profile of allProfiles) {
    assert.ok(
      profile.heightScale >= 0.93 && profile.heightScale <= 1.07,
      `Height scale out of human range for ${profile.id}: ${profile.heightScale}`
    );

    const a = profile.appearance;
    const sig = [
      a.gender,
      a.skinTone,
      a.bodyBuild,
      a.hairStyle,
      a.hairColor,
      a.dressStyle,
      a.dressColor,
      a.topStyle,
      a.shirtColor,
      a.bottomStyle,
      a.trouserColor,
      a.hatStyle,
      a.glassesStyle,
    ].join('|');

    assert.ok(!signatures.has(sig), `Duplicate character appearance signature for ${profile.id}`);
    signatures.add(sig);

    const rig = buildCharacterRig(a);
    rig.root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(rig.root);
    assert.ok(Math.abs(box.min.y) < 0.015, `${profile.id} feet must rest at y=0 (got ${box.min.y})`);
    assert.ok(box.max.y > 1.65 && box.max.y < 1.95, `${profile.id} height invalid (${box.max.y})`);
    rig.dispose();
  }

  // Quality scaling caps
  assert.ok(resolveMaxActiveNpcs('low', false) < resolveMaxActiveNpcs('high', false));
  assert.equal(getStudentRosterForWorld('exterior', undefined, 12).length, 12);
});

test('exterior navigation graph edges stay clear of buildings, props, trees, and lampposts', () => {
  const graph = CAMPUS_EXTERIOR_NAV_GRAPH;
  const tested = new Set<string>();

  for (const node of Object.values(graph.nodes)) {
    for (const neighborId of node.neighbors) {
      const pairKey = [node.id, neighborId].sort().join('--');
      if (tested.has(pairKey)) continue;
      tested.add(pairKey);

      const other = graph.nodes[neighborId];
      assert.ok(other, `Missing neighbor ${neighborId}`);

      const hit = checkSegmentClearOfColliders(
        node.x,
        node.z,
        other.x,
        other.z,
        Math.max(node.y, other.y),
        NPC_RADIUS,
        CAMPUS_COLLIDERS
      );
      assert.equal(hit, null, `Exterior nav edge ${node.id} <-> ${other.id} hits ${hit}`);

      // Also verify clearance from tree trunks & lamp poles along segment
      const len = Math.hypot(other.x - node.x, other.z - node.z);
      const steps = Math.max(4, Math.ceil(len / 0.5));
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const px = node.x + (other.x - node.x) * t;
        const pz = node.z + (other.z - node.z) * t;

        for (const tree of CAMPUS_TREES) {
          const trunkClear = tree.kind === 'shade' ? 0.85 : 0.68;
          const d = Math.hypot(px - tree.x, pz - tree.z);
          assert.ok(
            d >= trunkClear,
            `Edge ${node.id}<->${other.id} passes too close (${d.toFixed(2)}m) to ${tree.kind} tree at (${tree.x},${tree.z})`
          );
        }

        for (const lamp of CAMPUS_STREETLIGHTS) {
          const d = Math.hypot(px - lamp.x, pz - lamp.z);
          assert.ok(
            d >= 0.55,
            `Edge ${node.id}<->${other.id} passes too close (${d.toFixed(2)}m) to streetlight at (${lamp.x},${lamp.z})`
          );
        }
      }
    }
  }
});

test('interior navigation graphs stay clear of interior walls, railings, and furniture', () => {
  for (const [buildingId, graph] of Object.entries(INTERIOR_NAV_GRAPHS)) {
    const interior = getInteriorById(buildingId);
    assert.ok(interior, `Interior ${buildingId} must exist`);
    const colliders = buildInteriorRuntimeColliders(
      interior,
      buildInitialDoorStates(interior)
    );
    const tested = new Set<string>();

    for (const node of Object.values(graph.nodes)) {
      for (const neighborId of node.neighbors) {
        const pairKey = [node.id, neighborId].sort().join('--');
        if (tested.has(pairKey)) continue;
        tested.add(pairKey);

        const other = graph.nodes[neighborId];
        const hit = checkSegmentClearOfColliders(
          node.x,
          node.z,
          other.x,
          other.z,
          node.y,
          NPC_RADIUS,
          colliders
        );
        assert.equal(
          hit,
          null,
          `Interior ${buildingId} edge ${node.id} <-> ${other.id} hits ${hit}`
        );
      }
    }

    // Verify all interior NPCs spawn cleanly on the intended floor (never snapped to roof/upper slab)
    const roster = getStudentRosterForWorld('interior', buildingId, 16);
    const crowd = createNpcCrowdState(
      roster,
      graph,
      colliders,
      buildInteriorStepSurfaces(interior),
      interior.bounds,
      0.0
    );
    for (const npc of crowd) {
      assert.ok(
        Math.abs(npc.y) < 0.05,
        `Interior ${buildingId} NPC ${npc.id} spawned at unexpected elevation y=${npc.y}`
      );
    }
  }
});

test('A* pathfinding connects all major exterior campus landmarks', () => {
  const landmarks = [
    'ped-gate-south',
    'uhall-front',
    'admin-front',
    'bball-east',
    'rb-ne',
    'acad-fc-front',
    'clinic-front',
    'caf-front',
    'ws-bay-3',
    'ws-rear-passage',
    'vball-sideline',
    'fb-bleacher-front',
    'h100-front',
    'hsen-front',
  ];

  for (const target of landmarks) {
    const path = findNavPath(CAMPUS_EXTERIOR_NAV_GRAPH, 'ped-gate-south', target);
    assert.ok(path.length >= 1, `Expected reachable path from ped-gate-south to ${target}`);
    assert.equal(path[0], 'ped-gate-south');
    assert.equal(path[path.length - 1], target);
  }
});

test('NPC crowd simulation runs collision-free, steers around player, transitions activities, and applies LOD', () => {
  const roster = getStudentRosterForWorld('exterior', undefined, 20);
  const crowd = createNpcCrowdState(
    roster,
    CAMPUS_EXTERIOR_NAV_GRAPH,
    CAMPUS_COLLIDERS,
    CAMPUS_STEPS,
    CAMPUS_BOUNDS,
    0.04
  );

  assert.equal(crowd.length, 20);

  // Place player right in front of an active walking NPC (#15 or #3)
  const walker = crowd.find((n) => n.activity === 'walking' || n.activity === 'group-walk');
  assert.ok(walker, 'Expected at least one initial walking NPC');
  const nextNode = CAMPUS_EXTERIOR_NAV_GRAPH.nodes[walker.pathNodeIds[walker.pathIndex]];
  const player = {
    x: (walker.x + nextNode.x) * 0.5,
    y: 0.04,
    z: (walker.z + nextNode.z) * 0.5,
    vx: 0,
    vz: 0,
    active: true,
  };

  for (let step = 0; step < 900; step++) {
    stepNpcCrowd(
      crowd,
      CAMPUS_EXTERIOR_NAV_GRAPH,
      player,
      1 / 30,
      CAMPUS_COLLIDERS,
      CAMPUS_STEPS,
      CAMPUS_BOUNDS,
      0.04,
      step,
      { disableLodThrottling: true }
    );

    for (const npc of crowd) {
      assert.ok(
        Number.isFinite(npc.x) && Number.isFinite(npc.y) && Number.isFinite(npc.z),
        `Non-finite position for ${npc.id}`
      );
      assert.ok(Number.isFinite(npc.rotationYaw), `Non-finite yaw for ${npc.id}`);

      // Non-seated NPCs must never penetrate buildings or props, and never overlap player
      if (npc.activity !== 'sitting') {
        for (const col of CAMPUS_COLLIDERS) {
          assert.equal(
            overlapsColliderXZ(npc.x, npc.y, npc.z, NPC_RADIUS * 0.9, NPC_HEIGHT, col),
            false,
            `Step ${step}: ${npc.id} (${npc.activity}) overlapped collider ${col.id} at (${npc.x.toFixed(2)}, ${npc.z.toFixed(2)})`
          );
        }
        const playerDist = Math.hypot(npc.x - player.x, npc.z - player.z);
        assert.ok(
          playerDist >= PLAYER_NPC_MIN_SEPARATION - 0.05,
          `Step ${step}: ${npc.id} violated player separation (${playerDist.toFixed(2)}m)`
        );
      }
    }
  }

  // After 30 simulated seconds (900 * 1/30), seated & talking NPCs with 14-20s timers should have transitioned
  const movedWalkers = crowd.filter((n) => n.activity === 'walking' || n.activity === 'group-walk');
  assert.ok(movedWalkers.length >= 4, 'Expected multiple NPCs actively walking after 30s');

  // Verify distance-based LOD tier assignment when LOD throttling is enabled
  stepNpcCrowd(
    crowd,
    CAMPUS_EXTERIOR_NAV_GRAPH,
    { x: 5.7, y: 0.04, z: 125, vx: 0, vz: 0, active: true },
    1 / 60,
    CAMPUS_COLLIDERS,
    CAMPUS_STEPS,
    CAMPUS_BOUNDS,
    0.04,
    901,
    { disableLodThrottling: false }
  );

  const nearCount = crowd.filter((n) => n.lodTier === 'near').length;
  const farCount = crowd.filter((n) => n.lodTier === 'far').length;
  assert.ok(nearCount > 0, 'Expected near-tier NPCs near Main Gate');
  assert.ok(farCount > 0, 'Expected far-tier NPCs near upper campus');
});

test('stuck recovery reroutes a blocked NPC safely without freezing forever', () => {
  const roster = [EXTERIOR_STUDENT_ROSTER[14]]; // walker
  const crowd = createNpcCrowdState(
    roster,
    CAMPUS_EXTERIOR_NAV_GRAPH,
    CAMPUS_COLLIDERS,
    CAMPUS_STEPS,
    CAMPUS_BOUNDS,
    0.04
  );
  const npc = crowd[0];
  const initialDest = npc.destinationNodeId;

  // Trap NPC behind an artificial temporary wall collider directly in front of them
  const nx = npc.x + Math.sin(npc.rotationYaw) * -0.5;
  const nz = npc.z + Math.cos(npc.rotationYaw) * -0.5;
  const blocker = [
    ...CAMPUS_COLLIDERS,
    {
      id: 'temp-blocker',
      label: 'Temp Blocker',
      minX: nx - 1.5,
      maxX: nx + 1.5,
      minY: 0,
      maxY: 3,
      minZ: nz - 1.5,
      maxZ: nz + 1.5,
    },
  ];

  for (let step = 0; step < 90; step++) {
    stepNpcCrowd(
      crowd,
      CAMPUS_EXTERIOR_NAV_GRAPH,
      { x: 999, y: 0, z: 999, vx: 0, vz: 0, active: false },
      1 / 30,
      blocker,
      CAMPUS_STEPS,
      CAMPUS_BOUNDS,
      0.04,
      step,
      { disableLodThrottling: true }
    );
  }

  assert.ok(
    npc.destinationNodeId !== initialDest || npc.activity === 'idle',
    'Expected stuck detector to reroute or pause blocked NPC'
  );
});
