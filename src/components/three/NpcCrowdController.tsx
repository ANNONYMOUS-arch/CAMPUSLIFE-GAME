import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  animateNpcCharacterRig,
  buildCharacterRig,
  type CharacterRig,
} from '../../game/three/CharacterBuilder';
import { createContactShadowTexture } from '../../game/three/materials';
import { getGroundElevationAt } from '../../game/physics/collision';
import {
  buildInteriorRuntimeColliders,
  buildInteriorStepSurfaces,
} from '../../game/physics/interiorPhysics';
import { CAMPUS_BOUNDS, CAMPUS_COLLIDERS, CAMPUS_STEPS } from '../../game/world/campusData';
import { getNavGraphForWorld } from '../../game/npc/campusNavGraph';
import {
  getStudentRosterForWorld,
  resolveMaxActiveNpcs,
} from '../../game/npc/npcCatalog';
import { createNpcCrowdState, stepNpcCrowd } from '../../game/npc/npcSimulation';
import type { GameScreenState, GameSettings } from '../../game/types/game';
import type { InteriorWorld, WorldLocationState } from '../../game/types/interior';
import type {
  NpcNavGraph,
  PlayerSnapshotForNpc,
  StudentNpcRuntimeState,
} from '../../game/types/npc';

interface NpcCrowdControllerProps {
  screenState: GameScreenState;
  settings: GameSettings;
  isSoftwareGl: boolean;
  worldLocation: WorldLocationState;
  activeInterior: InteriorWorld | null;
  doorStates: Record<string, boolean>;
  playerStateRef: MutableRefObject<PlayerSnapshotForNpc>;
}

interface MountedNpcVisual {
  npcId: string;
  rootGroup: THREE.Group;
  rig: CharacterRig;
  shadowMesh: THREE.Mesh;
}

function computeSeatHipY(npc: StudentNpcRuntimeState): number | undefined {
  if (npc.pose !== 'sitting' || npc.seatSurfaceY === null) return undefined;
  const localSeatHeight = (npc.seatSurfaceY - npc.y) / npc.profile.heightScale;
  return THREE.MathUtils.clamp(localSeatHeight + 0.092, 0.52, 0.72);
}

export function NpcCrowdController({
  screenState,
  settings,
  isSoftwareGl,
  worldLocation,
  activeInterior,
  doorStates,
  playerStateRef,
}: NpcCrowdControllerProps) {
  const containerRef = useRef<THREE.Group>(null);
  const crowdRef = useRef<StudentNpcRuntimeState[]>([]);
  const visualsRef = useRef<MountedNpcVisual[]>([]);
  const frameCounterRef = useRef(0);

  const contactShadowTex = useMemo(() => createContactShadowTexture(), []);
  const shadowGeo = useMemo(() => new THREE.CircleGeometry(0.45, 16), []);
  const shadowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: contactShadowTex,
        transparent: true,
        opacity: 0.44,
        depthWrite: false,
      }),
    [contactShadowTex]
  );

  useEffect(() => {
    return () => {
      shadowGeo.dispose();
      shadowMat.dispose();
      contactShadowTex.dispose();
    };
  }, [shadowGeo, shadowMat, contactShadowTex]);

  const activeColliders = useMemo(() => {
    if (worldLocation.mode === 'interior' && activeInterior) {
      return buildInteriorRuntimeColliders(activeInterior, doorStates);
    }
    return CAMPUS_COLLIDERS;
  }, [worldLocation.mode, activeInterior, doorStates]);

  const activeSteps = useMemo(() => {
    if (worldLocation.mode === 'interior' && activeInterior) {
      return buildInteriorStepSurfaces(activeInterior);
    }
    return CAMPUS_STEPS;
  }, [worldLocation.mode, activeInterior]);

  const activeBounds =
    worldLocation.mode === 'interior' && activeInterior
      ? activeInterior.bounds
      : CAMPUS_BOUNDS;
  const baseElevation = worldLocation.mode === 'interior' ? 0.0 : 0.04;
  const maxActiveNpcs = resolveMaxActiveNpcs(settings.graphicsQuality, isSoftwareGl);

  const navGraph: NpcNavGraph | null = useMemo(
    () => getNavGraphForWorld(worldLocation.mode, activeInterior?.id),
    [worldLocation.mode, activeInterior?.id]
  );

  // Keep latest physics inputs in refs so toggling an interior door never respawns the crowd
  const collidersRef = useRef(activeColliders);
  const stepsRef = useRef(activeSteps);
  const boundsRef = useRef(activeBounds);
  const baseElevationRef = useRef(baseElevation);
  const graphRef = useRef(navGraph);
  const screenStateRef = useRef(screenState);

  collidersRef.current = activeColliders;
  stepsRef.current = activeSteps;
  boundsRef.current = activeBounds;
  baseElevationRef.current = baseElevation;
  graphRef.current = navGraph;
  screenStateRef.current = screenState;

  const worldIdentityKey = `${worldLocation.mode}:${
    worldLocation.mode === 'interior' ? activeInterior?.id ?? 'none' : 'exterior'
  }:${maxActiveNpcs}`;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Cleanly dispose any existing pooled student rigs before switching worlds/caps
    for (const v of visualsRef.current) {
      container.remove(v.rootGroup);
      container.remove(v.shadowMesh);
      v.rig.dispose();
    }
    visualsRef.current = [];
    crowdRef.current = [];

    const graph = graphRef.current;
    if (!graph) return;

    const roster = getStudentRosterForWorld(
      worldLocation.mode,
      activeInterior?.id,
      maxActiveNpcs
    );
    if (roster.length === 0) return;

    const crowd = createNpcCrowdState(
      roster,
      graph,
      collidersRef.current,
      stepsRef.current,
      boundsRef.current,
      baseElevationRef.current
    );
    crowdRef.current = crowd;

    const mounted: MountedNpcVisual[] = [];
    for (const npc of crowd) {
      const rootGroup = new THREE.Group();
      rootGroup.position.set(npc.x, npc.y, npc.z);
      rootGroup.rotation.y = npc.rotationYaw;

      const rig = buildCharacterRig(npc.profile.appearance);
      rig.root.scale.setScalar(npc.profile.heightScale);
      rig.gaitPhase = npc.phaseOffset;

      // Pre-settle initial seated/talking/idle pose cleanly so frame 0 renders grounded
      const seatHipY = computeSeatHipY(npc);
      const settlePasses = npc.pose === 'sitting' ? 24 : 4;
      for (let p = 0; p < settlePasses; p++) {
        animateNpcCharacterRig(rig, 0.05, {
          pose: npc.pose,
          horizontalSpeed: npc.horizontalSpeed,
          elapsedTime: p * 0.05,
          phaseOffset: npc.phaseOffset,
          seatHipY,
        });
      }

      rootGroup.add(rig.root);
      container.add(rootGroup);

      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      const groundY = getGroundElevationAt(
        npc.x,
        npc.z,
        stepsRef.current,
        npc.y,
        baseElevationRef.current
      );
      shadowMesh.position.set(npc.x, groundY + 0.014, npc.z);
      shadowMesh.visible = !(npc.activity === 'sitting' && npc.y > baseElevationRef.current + 0.2);
      container.add(shadowMesh);

      mounted.push({
        npcId: npc.id,
        rootGroup,
        rig,
        shadowMesh,
      });
    }
    visualsRef.current = mounted;
    frameCounterRef.current = 0;

    return () => {
      for (const v of mounted) {
        container.remove(v.rootGroup);
        container.remove(v.shadowMesh);
        v.rig.dispose();
      }
      visualsRef.current = [];
      crowdRef.current = [];
    };
  }, [worldIdentityKey, worldLocation.mode, activeInterior?.id, maxActiveNpcs, shadowGeo, shadowMat]);

  useFrame((state, rawDelta) => {
    if (screenStateRef.current !== 'playing') return;
    const graph = graphRef.current;
    const crowd = crowdRef.current;
    const visuals = visualsRef.current;
    if (!graph || crowd.length === 0 || visuals.length === 0) return;

    frameCounterRef.current += 1;
    const simDt = Math.min(Math.max(rawDelta, 0.001), 0.08);
    const animDt = Math.min(Math.max(rawDelta, 0.001), 0.05);

    stepNpcCrowd(
      crowd,
      graph,
      playerStateRef.current,
      simDt,
      collidersRef.current,
      stepsRef.current,
      boundsRef.current,
      baseElevationRef.current,
      frameCounterRef.current
    );

    const elapsed = state.clock.elapsedTime;
    const count = Math.min(crowd.length, visuals.length);
    for (let i = 0; i < count; i++) {
      const npc = crowd[i];
      const vis = visuals[i];

      vis.rootGroup.position.set(npc.x, npc.y, npc.z);
      vis.rootGroup.rotation.y = npc.rotationYaw;

      const isElevatedSeat =
        npc.activity === 'sitting' && npc.y > baseElevationRef.current + 0.2;
      vis.shadowMesh.visible = !isElevatedSeat;
      if (!isElevatedSeat) {
        vis.shadowMesh.position.set(npc.x, npc.y + 0.014, npc.z);
      }

      // Skip skeletal updates on off-ticks for distant NPCs
      if (npc.lodTier === 'far' && frameCounterRef.current % 4 !== 0) {
        continue;
      }

      animateNpcCharacterRig(vis.rig, animDt, {
        pose: npc.pose,
        horizontalSpeed: npc.horizontalSpeed,
        elapsedTime: elapsed,
        phaseOffset: npc.phaseOffset,
        seatHipY: computeSeatHipY(npc),
      });
    }
  });

  return <group ref={containerRef} name="campus-student-npc-crowd" />;
}
