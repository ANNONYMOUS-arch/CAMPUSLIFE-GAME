import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  animateCharacterRig,
  buildCharacterRig,
  type CharacterRig,
} from '../../game/three/CharacterBuilder';
import { createContactShadowTexture } from '../../game/three/materials';
import {
  createInitialPlayerState,
  getGroundElevationAt,
  resolveCameraObstruction,
  stepPlayerPhysics,
} from '../../game/physics/collision';
import {
  buildInteriorCameraColliders,
  buildInteriorRuntimeColliders,
  buildInteriorStepSurfaces,
  canToggleDoorSafely,
  createExteriorReturnState,
  createInteriorSpawnState,
  findNearestInteriorInteraction,
  getInteriorRoomAt,
} from '../../game/physics/interiorPhysics';
import {
  CAMPUS_BOUNDS,
  CAMPUS_COLLIDERS,
  CAMPUS_STEPS,
  PLAYER_SPAWN,
  getCampusZoneAt,
} from '../../game/world/campusData';
import {
  CAMPUS_BUILDING_PORTALS,
  findNearestExteriorPortal,
} from '../../game/world/interiorRegistry';
import { resolveExteriorPlayerCoords } from '../../game/world/campusMinimap';
import { inputManager } from '../../game/input/inputManager';
import { soundEngine } from '../../game/audio/soundEffects';
import type {
  CameraMode,
  CharacterAppearance,
  GameScreenState,
  GameSettings,
  HudSnapshot,
  PlayerPhysicsState,
} from '../../game/types/game';
import type {
  ExteriorAnchor,
  InteriorWorld,
  NearbyInteractionPrompt,
  WorldLocationState,
} from '../../game/types/interior';
import type { PlayerSnapshotForNpc } from '../../game/types/npc';

interface PlayerControllerProps {
  screenState: GameScreenState;
  appearance: CharacterAppearance;
  settings: GameSettings;
  cameraMode: CameraMode;
  worldLocation: WorldLocationState;
  activeInterior: InteriorWorld | null;
  doorStates: Record<string, boolean>;
  onToggleCameraMode: () => void;
  onRequestPause: () => void;
  onToggleDoor: (doorId: string) => void;
  onEnterInterior: (
    buildingId: string,
    returnAnchor?: ExteriorAnchor,
    entrySpawn?: ExteriorAnchor
  ) => void;
  onExitInterior: (returnAnchor?: ExteriorAnchor) => void;
  onHudUpdate: (snapshot: HudSnapshot) => void;
  resetToken: number;
  playerStateRef?: MutableRefObject<PlayerSnapshotForNpc>;
}

const _camTargetPos = new THREE.Vector3();
const _camDesiredPos = new THREE.Vector3();

export function PlayerController({
  screenState,
  appearance,
  settings,
  cameraMode,
  worldLocation,
  activeInterior,
  doorStates,
  onToggleCameraMode,
  onRequestPause,
  onToggleDoor,
  onEnterInterior,
  onExitInterior,
  onHudUpdate,
  resetToken,
  playerStateRef,
}: PlayerControllerProps) {
  const { camera, invalidate } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);

  const physicsRef = useRef<PlayerPhysicsState>(createInitialPlayerState());
  const lastExteriorAnchorRef = useRef<ExteriorAnchor>({
    x: PLAYER_SPAWN.x,
    y: PLAYER_SPAWN.y,
    z: PLAYER_SPAWN.z,
    yaw: PLAYER_SPAWN.yaw,
  });
  const prevWorldKeyRef = useRef<string>('exterior');

  const camYawRef = useRef(0);
  const camPitchRef = useRef(0.24);
  const camZoomRef = useRef(5.4);
  const smoothCamPosRef = useRef(new THREE.Vector3(PLAYER_SPAWN.x, 3.0, PLAYER_SPAWN.z + 5.5));
  const smoothLookAtRef = useRef(new THREE.Vector3(PLAYER_SPAWN.x, 1.4, PLAYER_SPAWN.z));
  const hudTimerRef = useRef(0);
  const rigRef = useRef<CharacterRig | null>(null);

  // Store callbacks and volatile refs so HUD updates never tear down or reset loop state
  const toggleCameraRef = useRef(onToggleCameraMode);
  const pauseRef = useRef(onRequestPause);
  const toggleDoorRef = useRef(onToggleDoor);
  const enterInteriorRef = useRef(onEnterInterior);
  const exitInteriorRef = useRef(onExitInterior);
  const hudUpdateRef = useRef(onHudUpdate);
  const doorStatesRef = useRef(doorStates);

  toggleCameraRef.current = onToggleCameraMode;
  pauseRef.current = onRequestPause;
  toggleDoorRef.current = onToggleDoor;
  enterInteriorRef.current = onEnterInterior;
  exitInteriorRef.current = onExitInterior;
  hudUpdateRef.current = onHudUpdate;
  doorStatesRef.current = doorStates;

  const contactShadowTex = useMemo(() => createContactShadowTexture(), []);

  useEffect(() => {
    return () => {
      contactShadowTex.dispose();
    };
  }, [contactShadowTex]);

  const activeColliders = useMemo(() => {
    if (worldLocation.mode === 'interior' && activeInterior) {
      return buildInteriorRuntimeColliders(activeInterior, doorStates);
    }
    return CAMPUS_COLLIDERS;
  }, [worldLocation.mode, activeInterior, doorStates]);

  const activeCameraColliders = useMemo(() => {
    if (worldLocation.mode === 'interior' && activeInterior) {
      return buildInteriorCameraColliders(activeInterior, doorStates);
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

  // Reset player back to campus spawn when requested (e.g. Return to Title -> Play again)
  useEffect(() => {
    const devSpots: Record<string, ExteriorAnchor> = {
      maingate: { x: 5.7, y: 0.04, z: 124.0, yaw: 0 },
      gate_pedestrian: { x: 19.5, y: 0.04, z: 123.5, yaw: -0.18 },
      median: { x: 4.5, y: 0.04, z: 101.5, yaw: 0.15 },
      tractor_utility: { x: 11.5, y: 0.04, z: 75.0, yaw: -0.68 },
      university_hall: { x: 54.0, y: 0.04, z: 111.5, yaw: 0 },
      university_hall_portal: { x: 54.0, y: 0.04, z: 103.5, yaw: 0 },
      admin: { x: -24.0, y: 0.04, z: 43.0, yaw: Math.PI / 2 },
      basketball: { x: -24.0, y: 0.04, z: 82.0, yaw: Math.PI / 2 },
      roundabout: { x: 0.0, y: 0.04, z: 23.0, yaw: 0 },
      forecourt: { x: 0.0, y: 0.04, z: -12.0, yaw: 0 },
      academic: { x: 0.0, y: 0.04, z: -26.0, yaw: 0 },
      tractor_side: { x: 44.0, y: 0.04, z: -9.5, yaw: 0.15 },
      clinic: { x: -41.5, y: 0.04, z: 6.0, yaw: Math.PI - 0.3 },
      workshops: { x: -58.0, y: 0.04, z: -76.5, yaw: -Math.PI / 2 },
      workshop_container: { x: -62.0, y: 0.04, z: -85.0, yaw: -Math.PI / 2 },
      rear_passage: { x: -34.0, y: 0.04, z: -92.0, yaw: -Math.PI / 2 },
      junk_area: { x: -42.5, y: 0.04, z: -112.5, yaw: Math.PI },
      cafeteria: { x: -64.0, y: 0.04, z: -47.0, yaw: Math.PI / 2 },
      upper_campus: { x: -64.0, y: 0.04, z: -140.0, yaw: 0 },
    };
    const params =
      import.meta.env.DEV && typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : null;
    const spotParam = params?.get('campusSpot') ?? null;
    const spot = spotParam ? devSpots[spotParam] : undefined;
    const rawPitch = params?.get('camPitch');
    const rawZoom = params?.get('camZoom');
    const parsedPitch = rawPitch !== null ? Number(rawPitch) : NaN;
    const parsedZoom = rawZoom !== null ? Number(rawZoom) : NaN;

    const initial = createInitialPlayerState();
    if (spot) {
      initial.x = spot.x;
      initial.y = spot.y;
      initial.z = spot.z;
      initial.facingYaw = spot.yaw;
    }
    physicsRef.current = initial;
    if (playerStateRef) {
      playerStateRef.current = {
        x: initial.x,
        y: initial.y,
        z: initial.z,
        vx: 0,
        vz: 0,
        active: screenState === 'playing' || screenState === 'paused',
      };
    }
    lastExteriorAnchorRef.current = spot ?? {
      x: PLAYER_SPAWN.x,
      y: PLAYER_SPAWN.y,
      z: PLAYER_SPAWN.z,
      yaw: PLAYER_SPAWN.yaw,
    };
    prevWorldKeyRef.current = 'exterior';
    camYawRef.current = spot ? spot.yaw : 0;
    camPitchRef.current = Number.isFinite(parsedPitch) ? parsedPitch : 0.24;
    camZoomRef.current = Number.isFinite(parsedZoom) ? parsedZoom : 5.4;
    const horiz = Math.cos(camPitchRef.current) * camZoomRef.current;
    const vert = Math.sin(camPitchRef.current) * camZoomRef.current;
    smoothCamPosRef.current.set(
      initial.x + Math.sin(camYawRef.current) * horiz,
      initial.y + 1.44 + vert,
      initial.z + Math.cos(camYawRef.current) * horiz
    );
    smoothLookAtRef.current.set(initial.x, initial.y + 1.44, initial.z);
    hudTimerRef.current = 1;
    invalidate();
  }, [resetToken, invalidate]);

  // Handle seamless transitions between exterior campus and building interiors
  const worldKey =
    worldLocation.mode === 'interior'
      ? `interior:${worldLocation.buildingId}`
      : 'exterior';

  const syncWorldTransition = () => {
    if (worldKey === prevWorldKeyRef.current) return false;
    const prevKey = prevWorldKeyRef.current;
    prevWorldKeyRef.current = worldKey;

    const params =
      import.meta.env.DEV && typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : null;
    const rawPitch = params?.get('camPitch');
    const parsedPitch = rawPitch !== null ? Number(rawPitch) : NaN;

    if (worldLocation.mode === 'interior' && activeInterior) {
      if (worldLocation.returnPosition) {
        lastExteriorAnchorRef.current = worldLocation.returnPosition;
      } else if (prevKey === 'exterior') {
        const cur = physicsRef.current;
        lastExteriorAnchorRef.current = {
          x: cur.x,
          y: cur.y,
          z: cur.z,
          yaw: cur.facingYaw,
        };
      }
      const spawnAnchor = worldLocation.entrySpawn ?? activeInterior.spawnPoint;
      physicsRef.current = createInteriorSpawnState(
        activeInterior,
        doorStatesRef.current,
        worldLocation.entrySpawn
      );
      camYawRef.current = spawnAnchor.yaw;
      camPitchRef.current = Number.isFinite(parsedPitch) ? parsedPitch : 0.22;
      camZoomRef.current = Math.min(camZoomRef.current, 4.8);
    } else if (worldLocation.mode === 'exterior') {
      const targetAnchor = worldLocation.returnPosition ?? lastExteriorAnchorRef.current;
      physicsRef.current = createExteriorReturnState(targetAnchor, CAMPUS_COLLIDERS, CAMPUS_BOUNDS);
      camYawRef.current = targetAnchor.yaw;
      camPitchRef.current = Number.isFinite(parsedPitch) ? parsedPitch : 0.24;
    }

    const nextP = physicsRef.current;
    const anchorY = nextP.y + 1.44;
    const dist =
      worldLocation.mode === 'interior' ? Math.min(camZoomRef.current, 4.8) : camZoomRef.current;
    const horiz = Math.cos(camPitchRef.current) * dist;
    const vert = Math.sin(camPitchRef.current) * dist;
    const rawCamX = nextP.x + Math.sin(camYawRef.current) * horiz;
    const rawCamY = anchorY + vert;
    const rawCamZ = nextP.z + Math.cos(camYawRef.current) * horiz;
    const transitionCamColliders =
      worldLocation.mode === 'interior' && activeInterior
        ? buildInteriorCameraColliders(activeInterior, doorStatesRef.current)
        : CAMPUS_COLLIDERS;
    const safeTransitionCam = resolveCameraObstruction(
      nextP.x,
      anchorY,
      nextP.z,
      rawCamX,
      rawCamY,
      rawCamZ,
      transitionCamColliders
    );
    smoothCamPosRef.current.set(safeTransitionCam.x, safeTransitionCam.y, safeTransitionCam.z);
    smoothLookAtRef.current.set(nextP.x, anchorY, nextP.z);

    hudTimerRef.current = 1; // Force immediate HUD sync on next frame
    return true;
  };

  useLayoutEffect(() => {
    if (syncWorldTransition()) {
      invalidate();
    }
  }, [worldKey, worldLocation, activeInterior, invalidate]);

  // Rebuild articulated 3D character mesh only when appearance changes
  useEffect(() => {
    const mountGroup = groupRef.current;
    if (!mountGroup) return;

    const rig = buildCharacterRig(appearance);
    rigRef.current = rig;
    mountGroup.add(rig.root);

    return () => {
      mountGroup.remove(rig.root);
      rig.dispose();
      rigRef.current = null;
    };
  }, [appearance]);

  // Snap camera immediately on entering playing state, toggling 1st/3rd person, or switching worlds
  useEffect(() => {
    if (screenState === 'playing') {
      const p = physicsRef.current;
      if (groupRef.current) {
        groupRef.current.position.set(p.x, p.y, p.z);
        groupRef.current.rotation.y = p.facingYaw;
        groupRef.current.visible = cameraMode === 'third-person';
      }

      if (cameraMode === 'first-person') {
        const eyeY = p.y + 1.58;
        const lookDist = 10;
        const fwdX = -Math.sin(camYawRef.current) * Math.cos(camPitchRef.current);
        const fwdY = -Math.sin(camPitchRef.current);
        const fwdZ = -Math.cos(camYawRef.current) * Math.cos(camPitchRef.current);
        camera.position.set(p.x, eyeY, p.z);
        camera.lookAt(p.x + fwdX * lookDist, eyeY + fwdY * lookDist, p.z + fwdZ * lookDist);
      } else {
        const anchorY = p.y + 1.44;
        const dist = camZoomRef.current;
        const horiz = Math.cos(camPitchRef.current) * dist;
        const vert = Math.sin(camPitchRef.current) * dist;
        const rawCamX = p.x + Math.sin(camYawRef.current) * horiz;
        const rawCamY = anchorY + vert;
        const rawCamZ = p.z + Math.cos(camYawRef.current) * horiz;
        const safeCam = resolveCameraObstruction(
          p.x,
          anchorY,
          p.z,
          rawCamX,
          rawCamY,
          rawCamZ,
          activeCameraColliders
        );
        smoothCamPosRef.current.set(safeCam.x, safeCam.y, safeCam.z);
        smoothLookAtRef.current.set(p.x, anchorY, p.z);
        camera.position.copy(smoothCamPosRef.current);
        camera.lookAt(smoothLookAtRef.current);
      }
      invalidate();
    }
  }, [screenState, cameraMode, worldKey, camera, invalidate, activeCameraColliders]);

  useFrame((state, rawDelta) => {
    if (syncWorldTransition()) {
      invalidate();
    }
    const dt = Math.min(rawDelta, 0.05);
    const rig = rigRef.current;
    const p = physicsRef.current;

    if (playerStateRef) {
      playerStateRef.current.x = p.x;
      playerStateRef.current.y = p.y;
      playerStateRef.current.z = p.z;
      playerStateRef.current.vx = p.vx;
      playerStateRef.current.vz = p.vz;
      playerStateRef.current.active = screenState === 'playing' || screenState === 'paused';
    }

    if (screenState === 'playing') {
      const snap = inputManager.consumeSnapshot();

      if (snap.pauseJustPressed) {
        pauseRef.current();
        return;
      }
      if (snap.toggleCameraJustPressed) {
        toggleCameraRef.current();
      }

      // Compute current proximity interaction prompt
      let nearbyPrompt: NearbyInteractionPrompt | null = null;
      if (worldLocation.mode === 'interior' && activeInterior) {
        nearbyPrompt = findNearestInteriorInteraction(
          p.x,
          p.y,
          p.z,
          activeInterior,
          doorStatesRef.current
        );
      } else if (worldLocation.mode === 'exterior') {
        nearbyPrompt = findNearestExteriorPortal(p.x, p.z, import.meta.env.DEV);
      }

      // Handle [E] / Interact button action
      if (snap.interactJustPressed && nearbyPrompt) {
        if (
          nearbyPrompt.kind === 'enter-interior' ||
          nearbyPrompt.kind === 'enter-dev-interior'
        ) {
          soundEngine.playBuildingTransition();
          enterInteriorRef.current(
            nearbyPrompt.targetId,
            nearbyPrompt.returnAnchor ?? {
              x: p.x,
              y: p.y,
              z: p.z,
              yaw: p.facingYaw,
            },
            nearbyPrompt.entrySpawn
          );
          return;
        } else if (nearbyPrompt.kind === 'exit-interior') {
          soundEngine.playBuildingTransition();
          exitInteriorRef.current(nearbyPrompt.returnAnchor);
          return;
        } else if (nearbyPrompt.kind === 'toggle-door' && activeInterior) {
          const door = activeInterior.doors.find((d) => d.id === nearbyPrompt.targetId);
          if (door) {
            const currentlyOpen = doorStatesRef.current[door.id] ?? door.defaultOpen;
            if (canToggleDoorSafely(door, currentlyOpen, p)) {
              soundEngine.playDoorToggle(!currentlyOpen);
              toggleDoorRef.current(door.id);
              hudTimerRef.current = 1;
            }
          }
        }
      }

      // Camera rotation
      const sens = 0.0028 * settings.cameraSensitivity;
      const ySign = settings.invertY ? -1 : 1;
      camYawRef.current -= snap.lookDeltaX * sens;
      camPitchRef.current = THREE.MathUtils.clamp(
        camPitchRef.current + snap.lookDeltaY * sens * ySign,
        cameraMode === 'first-person' ? -1.32 : -0.24,
        cameraMode === 'first-person' ? 1.15 : 1.05
      );
      camZoomRef.current = THREE.MathUtils.clamp(camZoomRef.current + snap.zoomDelta, 2.8, 9.2);

      // Step physics against active world (campus or interior)
      const events = stepPlayerPhysics(
        p,
        {
          moveForward: snap.moveForward,
          moveRight: snap.moveRight,
          cameraYaw: camYawRef.current,
          sprint: snap.sprint,
          jumpJustPressed: snap.jumpJustPressed,
        },
        dt,
        activeColliders,
        activeSteps,
        activeBounds,
        baseElevation
      );

      if (events.jumped) {
        soundEngine.playJump();
      }
      if (events.landed) {
        soundEngine.playLand();
        if (rig) rig.landingSquash = 1.0;
      }
      if (p.grounded && p.horizontalSpeed > 0.65) {
        soundEngine.playFootstep(p.isSprinting);
      }

      // Update player root transform
      if (groupRef.current) {
        groupRef.current.position.set(p.x, p.y, p.z);
        groupRef.current.rotation.y = p.facingYaw;
        groupRef.current.visible = cameraMode === 'third-person';
      }

      // Ground contact shadow aligned with current floor or stair step elevation
      const groundY = getGroundElevationAt(p.x, p.z, activeSteps, p.y, baseElevation);
      if (shadowRef.current) {
        shadowRef.current.position.set(p.x, groundY + 0.015, p.z);
        const heightAboveGround = Math.max(0, p.y - groundY);
        const shadowScale = Math.max(0.45, 1 - heightAboveGround * 0.28);
        shadowRef.current.scale.set(shadowScale, shadowScale, 1);
        const mat = shadowRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0.14, 0.55 - heightAboveGround * 0.16);
      }

      // Animate character limbs
      if (rig) {
        animateCharacterRig(
          rig,
          dt,
          p.horizontalSpeed,
          p.isSprinting,
          p.grounded,
          p.vy,
          state.clock.elapsedTime
        );
      }

      // Camera positioning
      if (cameraMode === 'first-person') {
        const eyeY = p.y + 1.58;
        const lookDist = 10;
        const fwdX = -Math.sin(camYawRef.current) * Math.cos(camPitchRef.current);
        const fwdY = -Math.sin(camPitchRef.current);
        const fwdZ = -Math.cos(camYawRef.current) * Math.cos(camPitchRef.current);

        camera.position.set(p.x, eyeY, p.z);
        camera.lookAt(p.x + fwdX * lookDist, eyeY + fwdY * lookDist, p.z + fwdZ * lookDist);
      } else {
        const anchorY = p.y + 1.44;
        const dist = worldLocation.mode === 'interior' ? Math.min(camZoomRef.current, 4.8) : camZoomRef.current;
        const horiz = Math.cos(camPitchRef.current) * dist;
        const vert = Math.sin(camPitchRef.current) * dist;

        const rawCamX = p.x + Math.sin(camYawRef.current) * horiz;
        const rawCamY = anchorY + vert;
        const rawCamZ = p.z + Math.cos(camYawRef.current) * horiz;

        const safeCam = resolveCameraObstruction(
          p.x,
          anchorY,
          p.z,
          rawCamX,
          rawCamY,
          rawCamZ,
          activeCameraColliders
        );
        _camDesiredPos.set(safeCam.x, safeCam.y, safeCam.z);
        _camTargetPos.set(p.x, anchorY, p.z);

        const damp = 1 - Math.exp(-16 * dt);
        smoothCamPosRef.current.lerp(_camDesiredPos, damp);
        smoothLookAtRef.current.lerp(_camTargetPos, damp);

        camera.position.copy(smoothCamPosRef.current);
        camera.lookAt(smoothLookAtRef.current);
      }

      // Throttle HUD updates to ~8Hz
      hudTimerRef.current += dt;
      if (hudTimerRef.current >= 0.12) {
        hudTimerRef.current = 0;

        if (worldLocation.mode === 'interior' && activeInterior) {
          const { room, floor } = getInteriorRoomAt(p.x, p.y, p.z, activeInterior);
          const portalFallback = CAMPUS_BUILDING_PORTALS.find(
            (portal) => portal.buildingId === activeInterior.id
          )?.returnAnchor;
          const exteriorAnchor =
            worldLocation.returnPosition ?? portalFallback ?? lastExteriorAnchorRef.current;
          const campusCoords = resolveExteriorPlayerCoords({
            worldMode: 'interior',
            posX: p.x,
            posZ: p.z,
            exteriorAnchor,
          });
          hudUpdateRef.current({
            zoneName: room ? room.name : activeInterior.name,
            zoneSubtitle: room ? room.subtitle : activeInterior.subtitle,
            worldMode: 'interior',
            floorLabel: floor.label,
            nearbyPrompt,
            cameraMode,
            isSprinting: p.isSprinting,
            grounded: p.grounded,
            speedKmh: Math.round(p.horizontalSpeed * 3.6),
            posX: Math.round(p.x),
            posZ: Math.round(p.z),
            facingYaw: Number(p.facingYaw.toFixed(3)),
            campusPosX: Number(campusCoords.x.toFixed(1)),
            campusPosZ: Number(campusCoords.z.toFixed(1)),
          });
        } else {
          const zone = getCampusZoneAt(p.x, p.z);
          hudUpdateRef.current({
            zoneName: zone.name,
            zoneSubtitle: zone.subtitle,
            worldMode: 'exterior',
            floorLabel: null,
            nearbyPrompt,
            cameraMode,
            isSprinting: p.isSprinting,
            grounded: p.grounded,
            speedKmh: Math.round(p.horizontalSpeed * 3.6),
            posX: Math.round(p.x),
            posZ: Math.round(p.z),
            facingYaw: Number(p.facingYaw.toFixed(3)),
            campusPosX: Number(p.x.toFixed(1)),
            campusPosZ: Number(p.z.toFixed(1)),
          });
        }
      }
    } else if (screenState === 'paused') {
      // Hold character visible in current pose while paused
      if (groupRef.current) {
        groupRef.current.visible = cameraMode === 'third-person';
      }
    }
  });

  return (
    <group visible={screenState === 'playing' || screenState === 'paused'}>
      <group ref={groupRef} position={[PLAYER_SPAWN.x, PLAYER_SPAWN.y, PLAYER_SPAWN.z]} />
      <mesh
        ref={shadowRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[PLAYER_SPAWN.x, PLAYER_SPAWN.y + 0.015, PLAYER_SPAWN.z]}
      >
        <circleGeometry args={[0.55, 20]} />
        <meshBasicMaterial
          map={contactShadowTex}
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
