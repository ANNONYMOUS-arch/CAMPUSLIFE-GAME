import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { detectSoftwareWebGL, scheduleAfterDraw } from '../../game/three/materials';
import { inputManager } from '../../game/input/inputManager';
import { CampusEnvironment } from './CampusEnvironment';
import { DevPortalMarker } from './DevPortalMarker';
import { InteriorEnvironment } from './InteriorEnvironment';
import { MenuShowcaseScene, type StudioCameraFocus } from './MenuShowcaseScene';
import { NpcCrowdController } from './NpcCrowdController';
import { PlayerController } from './PlayerController';
import { PLAYER_SPAWN } from '../../game/world/campusData';
import type { PlayerSnapshotForNpc } from '../../game/types/npc';
import type {
  CameraMode,
  CharacterAppearance,
  GameScreenState,
  GameSettings,
  HudSnapshot,
} from '../../game/types/game';
import type {
  ExteriorAnchor,
  InteriorWorld,
  WorldLocationState,
} from '../../game/types/interior';

interface GameCanvasProps {
  screenState: GameScreenState;
  appearance: CharacterAppearance;
  settings: GameSettings;
  cameraMode: CameraMode;
  worldLocation: WorldLocationState;
  activeInterior: InteriorWorld | null;
  doorStates: Record<string, boolean>;
  studioYawOffset: number;
  studioZoom: number;
  studioFocus: StudioCameraFocus;
  resetToken: number;
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
}

function SceneEnvironmentSetup() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmrem.dispose();

    return () => {
      scene.environment = null;
      envTarget.dispose();
    };
  }, [gl, scene]);

  return null;
}

/**
 * Software WebGL pacing driver:
 * Only runs when SwiftShader / llvmpipe is detected. Takes over render at priority 1
 * and schedules the next invalidate() strictly after WebGL2 fenceSync + 80ms cooldown.
 */
function SoftwareGlPacer() {
  const { gl, scene, camera, invalidate } = useThree();
  const timerRef = useRef<number | null>(null);
  const pendingRef = useRef(false);

  useEffect(() => {
    // Kick initial frame
    invalidate();
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [invalidate]);

  useFrame(() => {
    gl.render(scene, camera);
    if (!pendingRef.current) {
      pendingRef.current = true;
      scheduleAfterDraw(
        gl.getContext(),
        () => {
          pendingRef.current = false;
          invalidate();
        },
        (id) => {
          timerRef.current = id;
        }
      );
    }
  }, 1);

  return null;
}

export function GameCanvas({
  screenState,
  appearance,
  settings,
  cameraMode,
  worldLocation,
  activeInterior,
  doorStates,
  studioYawOffset,
  studioZoom,
  studioFocus,
  resetToken,
  onToggleCameraMode,
  onRequestPause,
  onToggleDoor,
  onEnterInterior,
  onExitInterior,
  onHudUpdate,
}: GameCanvasProps) {
  const isSoftwareGl = useMemo(() => detectSoftwareWebGL(), []);
  const [contextLost, setContextLost] = useState(false);
  const playerStateRef = useRef<PlayerSnapshotForNpc>({
    x: PLAYER_SPAWN.x,
    y: PLAYER_SPAWN.y,
    z: PLAYER_SPAWN.z,
    vx: 0,
    vz: 0,
    active: false,
  });

  const dpr: number | [number, number] = isSoftwareGl
    ? 1
    : settings.graphicsQuality === 'low'
      ? 1
      : settings.graphicsQuality === 'medium'
        ? [1, 1.5]
        : [1, 2];

  const shadowsEnabled = !isSoftwareGl && settings.graphicsQuality !== 'low';
  const shadowMapSize = settings.graphicsQuality === 'high' ? 2048 : 1024;
  const isInterior = worldLocation.mode === 'interior' && activeInterior !== null;
  const isCourtyardInterior = isInterior && Boolean(activeInterior?.hasOpenCourtyard);

  return (
    <div
      data-testid="game-viewport"
      className={`fixed inset-0 z-0 transition-colors duration-200 ${
        isInterior && !isCourtyardInterior ? 'bg-[#111916]' : 'bg-[#89BEE0]'
      }`}
    >
      {contextLost && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0B241C] text-[#F5F0E6] p-6 text-center">
          <div>
            <h2 className="font-display text-2xl font-bold mb-2">3D Context Paused</h2>
            <p className="text-sm text-[#C7D4CE]">
              Graphics resources were temporarily suspended by the browser. Restoring campus view...
            </p>
          </div>
        </div>
      )}

      <Canvas
        frameloop={isSoftwareGl ? 'demand' : 'always'}
        dpr={dpr}
        shadows={shadowsEnabled}
        camera={{ fov: 56, near: 0.15, far: 580, position: [5.7, 9.5, 118] }}
        gl={{
          antialias: !isSoftwareGl,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.08,
        }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          inputManager.setCanvasElement(gl.domElement);

          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            setContextLost(true);
          });
          gl.domElement.addEventListener('webglcontextrestored', () => {
            setContextLost(false);
          });
        }}
      >
        <SceneEnvironmentSetup />
        {isSoftwareGl && <SoftwareGlPacer />}

        {/* Warm Nigerian afternoon key sun + cool sky/laterite hemisphere fill */}
        <hemisphereLight
          args={['#B8E0F6', '#7A684C', isCourtyardInterior ? 0.95 : isInterior ? 0.65 : 0.85]}
        />
        <directionalLight
          position={[40, 75, 20]}
          intensity={isCourtyardInterior ? 1.55 : isInterior ? 0.65 : 1.95}
          color="#FFF2D6"
          castShadow={shadowsEnabled && !isInterior}
          shadow-mapSize-width={shadowMapSize}
          shadow-camera-near={5}
          shadow-camera-far={420}
          shadow-camera-left={-165}
          shadow-camera-right={165}
          shadow-camera-top={230}
          shadow-camera-bottom={-165}
          shadow-bias={-0.0005}
          shadow-normalBias={0.02}
          shadow-mapSize-height={shadowMapSize}
        />
        <directionalLight
          position={[-35, 24, -40]}
          intensity={isCourtyardInterior ? 0.48 : isInterior ? 0.35 : 0.45}
          color="#A3CFEF"
        />

        {isInterior && activeInterior ? (
          <InteriorEnvironment
            interior={activeInterior}
            doorStates={doorStates}
            graphicsQuality={settings.graphicsQuality}
            isSoftwareGl={isSoftwareGl}
          />
        ) : (
          <>
            <CampusEnvironment />
            {import.meta.env.DEV && <DevPortalMarker />}
          </>
        )}

        <MenuShowcaseScene
          screenState={screenState}
          appearance={appearance}
          studioYawOffset={studioYawOffset}
          studioZoom={studioZoom}
          studioFocus={studioFocus}
        />

        <PlayerController
          screenState={screenState}
          appearance={appearance}
          settings={settings}
          cameraMode={cameraMode}
          worldLocation={worldLocation}
          activeInterior={activeInterior}
          doorStates={doorStates}
          onToggleCameraMode={onToggleCameraMode}
          onRequestPause={onRequestPause}
          onToggleDoor={onToggleDoor}
          onEnterInterior={onEnterInterior}
          onExitInterior={onExitInterior}
          onHudUpdate={onHudUpdate}
          resetToken={resetToken}
          playerStateRef={playerStateRef}
        />

        {(screenState === 'playing' || screenState === 'paused') && (
          <NpcCrowdController
            screenState={screenState}
            settings={settings}
            isSoftwareGl={isSoftwareGl}
            worldLocation={worldLocation}
            activeInterior={activeInterior}
            doorStates={doorStates}
            playerStateRef={playerStateRef}
          />
        )}
      </Canvas>
    </div>
  );
}
