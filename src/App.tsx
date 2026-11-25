/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameCanvas } from './components/three/GameCanvas';
import type { StudioCameraFocus } from './components/three/MenuShowcaseScene';
import { CharacterCustomizer } from './components/ui/CharacterCustomizer';
import { GameInfoModal } from './components/ui/GameInfoModal';
import { GameplayHud } from './components/ui/GameplayHud';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { MainMenu } from './components/ui/MainMenu';
import { SettingsPanel } from './components/ui/SettingsPanel';
import { soundEngine } from './game/audio/soundEffects';
import { inputManager } from './game/input/inputManager';
import { buildInitialDoorStates } from './game/physics/interiorPhysics';
import {
  loadAcademicProfile,
  loadCharacter,
  loadSettings,
  saveAcademicProfile,
  saveCharacter,
  saveSettings,
  validateCharacterIdentity,
} from './game/state/persistence';
import { validateAcademicAdmission } from './game/world/academicCatalog';
import {
  DEV_DEMO_ENTRY_PORTAL,
  getInteriorById,
  isDevelopmentInteriorAllowed,
} from './game/world/interiorRegistry';
import type {
  AcademicProfile,
  CameraMode,
  CharacterAppearance,
  GameScreenState,
  GameSettings,
  HudSnapshot,
} from './game/types/game';
import type { ExteriorAnchor, WorldLocationState } from './game/types/interior';

const INITIAL_HUD: HudSnapshot = {
  zoneName: 'University Main Gate',
  zoneSubtitle: 'Twin-Portal Entrance Avenue & Median',
  worldMode: 'exterior',
  floorLabel: null,
  nearbyPrompt: null,
  cameraMode: 'third-person',
  isSprinting: false,
  grounded: true,
  speedKmh: 0,
  posX: 6,
  posZ: 125,
  facingYaw: 0,
  campusPosX: 6,
  campusPosZ: 125,
};

function detectIsTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  if (new URLSearchParams(window.location.search).get('touch') === '1') return true;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia?.('(pointer: coarse)').matches
  );
}

export default function App() {
  const autostart = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('autostart') === '1';
  }, []);

  const devInitialInterior = useMemo(() => {
    if (!import.meta.env.DEV || typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('interiorId');
    if (!id) return null;
    const target = getInteriorById(id);
    if (!target) return null;
    const ix = params.get('ix');
    const iy = params.get('iy');
    const iz = params.get('iz');
    const iyaw = params.get('iyaw');
    const entrySpawn =
      ix !== null && iy !== null && iz !== null
        ? {
            x: Number(ix),
            y: Number(iy),
            z: Number(iz),
            yaw: iyaw !== null ? Number(iyaw) : 0,
          }
        : undefined;
    return { target, entrySpawn };
  }, []);

  const [screenState, setScreenState] = useState<GameScreenState>(
    autostart ? 'playing' : 'title'
  );
  const [returnTargetAfterSubscreen, setReturnTargetAfterSubscreen] = useState<
    'title' | 'paused'
  >('title');
  const [showGuideModal, setShowGuideModal] = useState(false);

  const [appearance, setAppearance] = useState<CharacterAppearance>(() => loadCharacter());
  const [academicProfile, setAcademicProfile] = useState<AcademicProfile>(() =>
    loadAcademicProfile()
  );
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [cameraMode, setCameraMode] = useState<CameraMode>('third-person');
  const [studioYawOffset, setStudioYawOffset] = useState(0);
  const [studioZoom, setStudioZoom] = useState(1);
  const [studioFocus, setStudioFocus] = useState<StudioCameraFocus>('full');
  const [resetToken, setResetToken] = useState(0);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [isTouchDevice, setIsTouchDevice] = useState(() => detectIsTouchDevice());

  const [worldLocation, setWorldLocation] = useState<WorldLocationState>(() =>
    devInitialInterior
      ? {
          mode: 'interior',
          buildingId: devInitialInterior.target.id,
          entrySpawn: devInitialInterior.entrySpawn,
        }
      : { mode: 'exterior' }
  );
  const [doorStates, setDoorStates] = useState<Record<string, boolean>>(() =>
    devInitialInterior ? buildInitialDoorStates(devInitialInterior.target) : {}
  );
  const [transitionBanner, setTransitionBanner] = useState<string | null>(null);
  const transitionLockRef = useRef(false);
  const transitionTimersRef = useRef<number[]>([]);

  const activeInterior = useMemo(() => {
    if (worldLocation.mode !== 'interior') return null;
    return getInteriorById(worldLocation.buildingId) ?? null;
  }, [worldLocation]);

  useEffect(() => {
    return () => {
      for (const id of transitionTimersRef.current) {
        window.clearTimeout(id);
      }
    };
  }, []);

  // Sync game state to body attribute for accessibility & deterministic verification
  useEffect(() => {
    document.body.dataset.state = screenState;
    document.body.dataset.world = worldLocation.mode;
    inputManager.setGameplayActive(screenState === 'playing' && !showGuideModal);
  }, [screenState, showGuideModal, worldLocation.mode]);

  // Attach global keyboard/mouse listener once
  useEffect(() => {
    return inputManager.attach();
  }, []);

  // Re-evaluate touch capability on resize (supports responsive device switching)
  useEffect(() => {
    const onResize = () => {
      setIsTouchDevice(detectIsTouchDevice());
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Sync audio mute setting
  useEffect(() => {
    soundEngine.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  const handleAppearanceChange = useCallback((next: CharacterAppearance) => {
    setAppearance(next);
    saveCharacter(next);
  }, []);

  const handleAcademicChange = useCallback((next: AcademicProfile) => {
    setAcademicProfile(next);
    saveAcademicProfile(next);
  }, []);

  const handleSettingsChange = useCallback((next: GameSettings) => {
    setSettings(next);
    saveSettings(next);
  }, []);

  const handleToggleCameraMode = useCallback(() => {
    setCameraMode((prev) => (prev === 'third-person' ? 'first-person' : 'third-person'));
  }, []);

  const handleToggleDoor = useCallback((doorId: string) => {
    setDoorStates((prev) => ({
      ...prev,
      [doorId]: !(prev[doorId] ?? false),
    }));
  }, []);

  const runTransition = useCallback((label: string, applySwitch: () => void) => {
    if (transitionLockRef.current) return;
    transitionLockRef.current = true;
    setTransitionBanner(label);

    const swapTimer = window.setTimeout(() => {
      applySwitch();
    }, 90);
    const clearTimer = window.setTimeout(() => {
      setTransitionBanner(null);
      transitionLockRef.current = false;
    }, 240);

    transitionTimersRef.current.push(swapTimer, clearTimer);
  }, []);

  const handleEnterInterior = useCallback(
    (buildingId: string, returnAnchor?: ExteriorAnchor, entrySpawn?: ExteriorAnchor) => {
      const target = getInteriorById(buildingId);
      if (!target) return;
      if (target.isDevelopmentDemo && !isDevelopmentInteriorAllowed(import.meta.env.DEV)) {
        return;
      }

      runTransition(`Entering ${target.name}`, () => {
        setDoorStates(buildInitialDoorStates(target));
        setWorldLocation({
          mode: 'interior',
          buildingId: target.id,
          returnPosition: returnAnchor,
          entrySpawn,
        });
      });
    },
    [runTransition]
  );

  const handleExitInterior = useCallback(
    (returnAnchor?: ExteriorAnchor) => {
      runTransition('Returning to Campus', () => {
        setWorldLocation({
          mode: 'exterior',
          returnPosition: returnAnchor,
        });
      });
    },
    [runTransition]
  );

  const handleDevToggleInterior = useCallback(() => {
    if (!isDevelopmentInteriorAllowed(import.meta.env.DEV)) return;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setScreenState('playing');
    if (worldLocation.mode === 'interior') {
      handleExitInterior();
    } else {
      handleEnterInterior(DEV_DEMO_ENTRY_PORTAL.interiorId);
    }
  }, [handleEnterInterior, handleExitInterior, worldLocation.mode]);

  const enterCampusLoading = useCallback(() => {
    setWorldLocation({ mode: 'exterior' });
    setResetToken((n) => n + 1);
    setHud({ ...INITIAL_HUD, cameraMode });
    setScreenState('loading');
  }, [cameraMode]);

  const handleStartFromMenu = useCallback(() => {
    const identityOk = validateCharacterIdentity(appearance.studentName, appearance.nickname).valid;
    const admissionOk =
      academicProfile.admitted && validateAcademicAdmission(academicProfile).valid;
    if (!identityOk || !admissionOk) {
      setReturnTargetAfterSubscreen('title');
      setStudioZoom(1);
      setStudioFocus('full');
      setScreenState('character');
      return;
    }
    enterCampusLoading();
  }, [academicProfile, appearance.nickname, appearance.studentName, enterCampusLoading]);

  const handleLoadingComplete = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setScreenState('playing');
  }, []);

  const showTouchControls =
    settings.controlScheme === 'touch' ||
    (settings.controlScheme === 'auto' && isTouchDevice);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <GameCanvas
        screenState={screenState}
        appearance={appearance}
        settings={settings}
        cameraMode={cameraMode}
        worldLocation={worldLocation}
        activeInterior={activeInterior}
        doorStates={doorStates}
        studioYawOffset={studioYawOffset}
        studioZoom={studioZoom}
        studioFocus={studioFocus}
        resetToken={resetToken}
        onToggleCameraMode={handleToggleCameraMode}
        onRequestPause={() => setScreenState('paused')}
        onToggleDoor={handleToggleDoor}
        onEnterInterior={handleEnterInterior}
        onExitInterior={handleExitInterior}
        onHudUpdate={setHud}
      />

      {screenState === 'title' && (
        <MainMenu
          studentName={appearance.studentName}
          nickname={appearance.nickname}
          academicProfile={academicProfile}
          onPlay={handleStartFromMenu}
          onOpenCharacter={() => {
            setReturnTargetAfterSubscreen('title');
            setStudioZoom(1);
            setStudioFocus('full');
            setScreenState('character');
          }}
          onOpenSettings={() => {
            setReturnTargetAfterSubscreen('title');
            setScreenState('settings');
          }}
          onOpenInfo={() => setShowGuideModal(true)}
        />
      )}

      {screenState === 'character' && (
        <CharacterCustomizer
          appearance={appearance}
          academicProfile={academicProfile}
          studioZoom={studioZoom}
          studioFocus={studioFocus}
          isReturnFromPause={returnTargetAfterSubscreen === 'paused'}
          onChange={handleAppearanceChange}
          onAcademicChange={handleAcademicChange}
          onRotateCharacter={(delta) => setStudioYawOffset((y) => y + delta)}
          onZoomChange={setStudioZoom}
          onFocusChange={setStudioFocus}
          onResetView={() => {
            setStudioYawOffset(0);
            setStudioZoom(1);
          }}
          onBack={() => setScreenState(returnTargetAfterSubscreen)}
          onConfirmAdmission={() => {
            const admittedProfile: AcademicProfile = {
              ...academicProfile,
              admitted: true,
            };
            setAcademicProfile(admittedProfile);
            saveAcademicProfile(admittedProfile);
            saveCharacter(appearance);
            if (returnTargetAfterSubscreen === 'paused') {
              setScreenState('playing');
            } else {
              enterCampusLoading();
            }
          }}
        />
      )}

      {screenState === 'settings' && (
        <SettingsPanel
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => setScreenState(returnTargetAfterSubscreen)}
        />
      )}

      {screenState === 'loading' && <LoadingScreen onComplete={handleLoadingComplete} />}

      {(screenState === 'playing' || screenState === 'paused') && (
        <GameplayHud
          studentName={appearance.studentName}
          nickname={appearance.nickname}
          academicProfile={academicProfile}
          hud={{ ...hud, cameraMode }}
          showTouchControls={showTouchControls}
          isPaused={screenState === 'paused'}
          onToggleCamera={handleToggleCameraMode}
          onOpenGuide={() => setShowGuideModal(true)}
          onPause={() => setScreenState('paused')}
          onResume={() => {
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
            setScreenState('playing');
          }}
          onOpenCharacter={() => {
            setReturnTargetAfterSubscreen('paused');
            setScreenState('character');
          }}
          onOpenSettings={() => {
            setReturnTargetAfterSubscreen('paused');
            setScreenState('settings');
          }}
          onExitToMenu={() => {
            setShowGuideModal(false);
            setWorldLocation({ mode: 'exterior' });
            setScreenState('title');
          }}
          onDevToggleInterior={import.meta.env.DEV ? handleDevToggleInterior : undefined}
        />
      )}

      {/* Smooth Building Entry / Exit Transition Overlay */}
      {transitionBanner && (
        <div
          aria-live="polite"
          className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center bg-[#06140F]/85 transition-opacity duration-150"
        >
          <p className="font-display text-lg sm:text-xl font-bold text-[#F5F0E6] tracking-wide">
            {transitionBanner}
          </p>
        </div>
      )}

      {showGuideModal && <GameInfoModal onClose={() => setShowGuideModal(false)} />}
    </div>
  );
}
