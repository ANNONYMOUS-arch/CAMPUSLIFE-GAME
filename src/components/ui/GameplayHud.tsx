import { useEffect, useState } from 'react';
import { BookOpen, DoorOpen, Eye, HelpCircle, Pause, Play, Settings, User } from 'lucide-react';
import { soundEngine } from '../../game/audio/soundEffects';
import { inputManager } from '../../game/input/inputManager';
import type { AcademicProfile, HudSnapshot } from '../../game/types/game';
import { getCourseById } from '../../game/world/academicCatalog';
import { CampusMinimap } from './CampusMinimap';
import { MobileControls } from './MobileControls';

interface GameplayHudProps {
  studentName: string;
  nickname: string;
  academicProfile: AcademicProfile;
  hud: HudSnapshot;
  showTouchControls: boolean;
  isPaused: boolean;
  onToggleCamera: () => void;
  onOpenGuide: () => void;
  onPause: () => void;
  onResume: () => void;
  onOpenCharacter: () => void;
  onOpenSettings: () => void;
  onExitToMenu: () => void;
  onDevToggleInterior?: () => void;
}

export function GameplayHud({
  studentName,
  nickname,
  academicProfile,
  hud,
  showTouchControls,
  isPaused,
  onToggleCamera,
  onOpenGuide,
  onPause,
  onResume,
  onOpenCharacter,
  onOpenSettings,
  onExitToMenu,
  onDevToggleInterior,
}: GameplayHudProps) {
  const [isMinimapOpen, setIsMinimapOpen] = useState(true);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isPaused || e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      if (e.code === 'KeyM') {
        setIsMinimapOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPaused]);

  const displayNick = nickname.trim() || studentName;
  const enrolledCourse = academicProfile.admitted
    ? getCourseById(academicProfile.courseId)
    : undefined;

  return (
    <>
      <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-3 sm:p-5">
        {/* Top Perimeter Bar */}
        <div className="flex items-start justify-between gap-2 sm:gap-4 w-full min-w-0">
          {/* Top-Left: Zone Banner & Student Identity */}
          <div className="flex-1 min-w-0 max-w-xs sm:max-w-md rounded-lg bg-[#0B241C]/90 border border-[#D4A024]/35 px-3 py-2 sm:px-4 sm:py-2.5 shadow-lg">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#D4A024]">
              <span data-testid="hud-student-nickname" className="truncate">
                {displayNick}
              </span>
              {enrolledCourse && academicProfile.level && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="whitespace-nowrap shrink-0 text-[#DCE5E0]">
                    {academicProfile.level}L {enrolledCourse.code}
                  </span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular whitespace-nowrap shrink-0">
                {hud.speedKmh} km/h
              </span>
            </div>
            <p
              data-testid="hud-zone-name"
              data-pos={`${hud.posX},${hud.posZ}`}
              className="font-display text-sm sm:text-base font-bold text-[#F5F0E6] leading-tight truncate"
            >
              {hud.zoneName}
            </p>
            <p className="text-[11px] text-[#C7D4CE] truncate">
              {hud.floorLabel && (
                <span data-testid="hud-floor-label" className="text-[#D4A024] font-semibold">
                  {hud.floorLabel} ·{' '}
                </span>
              )}
              {hud.zoneSubtitle}
            </p>
          </div>

          {/* Top-Right: Utility Controls + Campus Mini-Map */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                tabIndex={-1}
                aria-label={`Switch camera perspective (currently ${hud.cameraMode === 'third-person' ? '3rd Person' : '1st Person'})`}
                onClick={(e) => {
                  e.currentTarget.blur();
                  soundEngine.playUiClick();
                  onToggleCamera();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B241C]/90 border border-[#D4A024]/35 px-2.5 sm:px-3 h-9 sm:h-10 text-xs font-semibold text-[#F5F0E6] hover:bg-[#143D30] transition-colors shadow-lg cursor-pointer whitespace-nowrap"
              >
                <Eye className="w-4 h-4 text-[#D4A024] shrink-0" aria-hidden="true" />
                <span className="sm:hidden">{hud.cameraMode === 'third-person' ? '3rd' : '1st'}</span>
                <span className="hidden sm:inline">{hud.cameraMode === 'third-person' ? '3rd Person' : '1st Person'}</span>
                <span className="hidden md:inline text-[#B9C8C1]">[V]</span>
              </button>

              <button
                type="button"
                tabIndex={-1}
                aria-label="Campus Guide and Controls"
                onClick={(e) => {
                  e.currentTarget.blur();
                  soundEngine.playUiClick();
                  onOpenGuide();
                }}
                className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#0B241C]/90 border border-white/15 text-[#F5F0E6] hover:bg-[#143D30] transition-colors shadow-lg cursor-pointer shrink-0"
              >
                <HelpCircle className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                tabIndex={-1}
                aria-label="Pause Game"
                onClick={(e) => {
                  e.currentTarget.blur();
                  soundEngine.playUiClick();
                  onPause();
                }}
                className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#0B241C]/90 border border-white/15 text-[#F5F0E6] hover:bg-[#143D30] transition-colors shadow-lg cursor-pointer shrink-0"
              >
                <Pause className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {!isPaused && (
              <CampusMinimap
                campusPosX={hud.campusPosX}
                campusPosZ={hud.campusPosZ}
                facingYaw={hud.facingYaw}
                worldMode={hud.worldMode}
                isOpen={isMinimapOpen}
                onToggleOpen={() => {
                  soundEngine.playUiClick();
                  setIsMinimapOpen((prev) => !prev);
                }}
              />
            )}
          </div>
        </div>

        {/* First-person subtle center crosshair */}
        {hud.cameraMode === 'first-person' && !isPaused && (
          <div
            aria-hidden="true"
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#F5F0E6]/80 border border-[#0B241C]"
          />
        )}

        {/* Bottom Prompt & Control Hint Cluster */}
        <div className="flex flex-col items-center gap-2">
          {hud.nearbyPrompt && !isPaused && (
            <button
              type="button"
              data-testid="hud-interact-prompt"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                inputManager.triggerInteract();
              }}
              className={`pointer-events-auto inline-flex items-center gap-2 rounded-lg bg-[#0D3B2E]/95 border border-[#D4A024] px-4 py-2 text-xs sm:text-sm font-bold text-[#F5F0E6] shadow-xl hover:bg-[#144E3D] active:scale-95 transition-all cursor-pointer ${
                showTouchControls ? 'mb-36' : ''
              }`}
            >
              <span className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded bg-[#D4A024] text-[#0B241C] text-xs font-extrabold">
                E
              </span>
              <span>{hud.nearbyPrompt.label}</span>
            </button>
          )}

          {/* Bottom Control Hint Bar (Desktop only) */}
          {!showTouchControls && !isPaused && (
            <div className="self-center rounded-lg bg-[#0B241C]/82 border border-white/10 px-4 py-1.5 text-[11px] text-[#DCE5E0] shadow-md">
              WASD Move · Mouse Drag / Click Look · E Interact · Shift Run · Space Jump · V Camera · M Map · Esc Pause
            </div>
          )}
        </div>
      </div>

      {/* Virtual Touch Controls for Mobile or forced Touch mode */}
      {showTouchControls && !isPaused && <MobileControls />}

      {/* Pause Modal */}
      {isPaused && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#06140F]/75 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Game Paused"
            className="w-full max-w-sm rounded-xl bg-[#0B241C] border border-[#D4A024]/35 p-6 text-[#F5F0E6] shadow-2xl flex flex-col gap-4"
          >
            <div className="border-b border-white/10 pb-3">
              <p className="text-xs font-semibold text-[#D4A024]">
                {displayNick} ({studentName})
              </p>
              <h2 className="font-display text-2xl font-bold">Game Paused</h2>
              <p className="text-xs text-[#B9C8C1] mt-0.5">
                Current Location: {hud.zoneName}
                {hud.floorLabel ? ` · ${hud.floorLabel}` : ''}
              </p>
              {enrolledCourse && academicProfile.level && (
                <p className="text-[11px] text-[#DCE5E0] mt-0.5 truncate">
                  {academicProfile.level} Level · {enrolledCourse.name}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  onResume();
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#D4A024] px-5 py-3 text-sm font-bold text-[#0B241C] hover:bg-[#E2B23B] transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                <span>Resume {hud.worldMode === 'interior' ? 'Interior' : 'Campus'}</span>
              </button>

              {import.meta.env.DEV && onDevToggleInterior && (
                <button
                  type="button"
                  data-testid="dev-interior-toggle-btn"
                  onClick={() => {
                    soundEngine.playUiClick();
                    onDevToggleInterior();
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#143D30] px-5 py-2.5 text-sm font-semibold text-[#F5F0E6] border border-[#D4A024]/45 hover:bg-[#1A4D3D] transition-colors cursor-pointer"
                >
                  <DoorOpen className="w-4 h-4 text-[#D4A024]" aria-hidden="true" />
                  <span>
                    {hud.worldMode === 'interior'
                      ? 'Dev Test: Exit to Campus'
                      : 'Dev Test: Demo Interior'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  onOpenCharacter();
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#081C15] px-5 py-2.5 text-sm font-semibold text-[#F5F0E6] border border-white/15 hover:bg-[#143D30] transition-colors cursor-pointer"
              >
                <User className="w-4 h-4 text-[#D4A024]" aria-hidden="true" />
                <span>Customize Character</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  onOpenSettings();
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#081C15] px-5 py-2.5 text-sm font-semibold text-[#F5F0E6] border border-white/15 hover:bg-[#143D30] transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4 text-[#D4A024]" aria-hidden="true" />
                <span>Settings</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  onOpenGuide();
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#081C15] px-5 py-2.5 text-sm font-semibold text-[#F5F0E6] border border-white/15 hover:bg-[#143D30] transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-[#D4A024]" aria-hidden="true" />
                <span>Campus Guide</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  onExitToMenu();
                }}
                className="mt-1 rounded-lg px-5 py-2.5 text-xs font-semibold text-[#D5DDD9] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Return to Main Menu
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
