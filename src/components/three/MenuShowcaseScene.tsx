import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  animateCharacterRig,
  buildCharacterRig,
  type CharacterRig,
} from '../../game/three/CharacterBuilder';
import type { CharacterAppearance, GameScreenState } from '../../game/types/game';

export type StudioCameraFocus = 'full' | 'head';

interface MenuShowcaseSceneProps {
  screenState: GameScreenState;
  appearance: CharacterAppearance;
  studioYawOffset: number;
  studioZoom: number;
  studioFocus: StudioCameraFocus;
}

const STUDIO_STAGE_POS = new THREE.Vector3(0, 0.2, 42);

function getStudioFraming(
  isNarrowViewport: boolean,
  studioFocus: StudioCameraFocus,
  studioZoom: number
) {
  const isHeadFocus = studioFocus === 'head';
  const xOffset = isNarrowViewport ? 0 : isHeadFocus ? 0.24 : 0.48;
  const baseDistance = isHeadFocus
    ? isNarrowViewport
      ? 1.65
      : 1.02
    : isNarrowViewport
      ? 4.65
      : 2.35;
  const distance = baseDistance / Math.max(0.65, Math.min(2.0, studioZoom));
  const lookY =
    STUDIO_STAGE_POS.y + (isHeadFocus ? (isNarrowViewport ? 1.22 : 1.56) : isNarrowViewport ? -0.02 : 0.94);
  const camY =
    STUDIO_STAGE_POS.y + (isHeadFocus ? (isNarrowViewport ? 1.56 : 1.59) : isNarrowViewport ? 1.05 : 1.15);
  return { xOffset, distance, lookY, camY };
}

export function MenuShowcaseScene({
  screenState,
  appearance,
  studioYawOffset,
  studioZoom,
  studioFocus,
}: MenuShowcaseSceneProps) {
  const { camera, size, invalidate } = useThree();
  const studioGroupRef = useRef<THREE.Group>(null);
  const rigRef = useRef<CharacterRig | null>(null);
  const prevScreenRef = useRef<GameScreenState>(screenState);
  const lookAtVecRef = useRef(new THREE.Vector3(STUDIO_STAGE_POS.x + 0.5, STUDIO_STAGE_POS.y + 1.0, STUDIO_STAGE_POS.z));

  useEffect(() => {
    const group = studioGroupRef.current;
    if (!group) return;

    const rig = buildCharacterRig(appearance);
    rigRef.current = rig;
    group.add(rig.root);
    invalidate();

    return () => {
      group.remove(rig.root);
      rig.dispose();
      rigRef.current = null;
    };
  }, [appearance, invalidate]);

  useEffect(() => {
    if (screenState === 'character') {
      const { xOffset, distance, lookY, camY } = getStudioFraming(
        size.width < 768,
        studioFocus,
        studioZoom
      );

      // Snap immediately when entering Character Studio from Title or Paused menu
      if (prevScreenRef.current !== 'character') {
        camera.position.set(STUDIO_STAGE_POS.x + xOffset, camY, STUDIO_STAGE_POS.z - distance);
        lookAtVecRef.current.set(STUDIO_STAGE_POS.x + xOffset * 0.85, lookY, STUDIO_STAGE_POS.z);
        camera.lookAt(lookAtVecRef.current);
      }
      invalidate();
    }
    prevScreenRef.current = screenState;
  }, [screenState, studioYawOffset, studioZoom, studioFocus, size.width, camera, invalidate]);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const t = state.clock.elapsedTime;

    if (screenState === 'title' || screenState === 'settings' || screenState === 'loading') {
      // Sweeping unobstructed vista ahead of median palms toward Flag Roundabout & Academic Building
      const orbitAngle = t * 0.12;
      const camX = -6 + Math.sin(orbitAngle) * 5;
      const camZ = 24 + Math.cos(orbitAngle) * 3;
      const camY = 10.8 + Math.sin(t * 0.25) * 0.9;

      camera.position.set(camX, camY, camZ);
      camera.lookAt(2, 4.4, -26);
    } else if (screenState === 'character') {
      const { xOffset, distance, lookY, camY } = getStudioFraming(
        size.width < 768,
        studioFocus,
        studioZoom
      );

      const targetCamX = STUDIO_STAGE_POS.x + xOffset;
      const targetCamZ = STUDIO_STAGE_POS.z - distance;
      const targetLookX = STUDIO_STAGE_POS.x + xOffset * 0.85;

      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 14, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, camY, 14, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 14, dt);

      lookAtVecRef.current.x = THREE.MathUtils.damp(lookAtVecRef.current.x, targetLookX, 14, dt);
      lookAtVecRef.current.y = THREE.MathUtils.damp(lookAtVecRef.current.y, lookY, 14, dt);
      lookAtVecRef.current.z = STUDIO_STAGE_POS.z;
      camera.lookAt(lookAtVecRef.current);

      if (studioGroupRef.current) {
        studioGroupRef.current.rotation.y = studioYawOffset + Math.sin(t * 0.45) * 0.04;
      }

      if (rigRef.current) {
        animateCharacterRig(rigRef.current, dt, 0, false, true, 0, t);
      }
    }
  });

  return (
    <group visible={screenState === 'character'}>
      {/* Character Studio Podium on Freedom Boulevard */}
      <mesh position={[STUDIO_STAGE_POS.x, 0.12, STUDIO_STAGE_POS.z]} receiveShadow castShadow>
        <cylinderGeometry args={[1.25, 1.45, 0.16, 24]} />
        <meshStandardMaterial color="#0D3B2E" roughness={0.55} />
      </mesh>
      <mesh position={[STUDIO_STAGE_POS.x, 0.21, STUDIO_STAGE_POS.z]} receiveShadow>
        <cylinderGeometry args={[1.14, 1.14, 0.04, 24]} />
        <meshStandardMaterial color="#D4A024" roughness={0.35} metalness={0.65} />
      </mesh>
      <group ref={studioGroupRef} position={[STUDIO_STAGE_POS.x, 0.22, STUDIO_STAGE_POS.z]} />
    </group>
  );
}
