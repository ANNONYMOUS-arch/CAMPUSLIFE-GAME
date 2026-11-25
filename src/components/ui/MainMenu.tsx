import { useEffect } from 'react';
import { BookOpen, Play, Settings, User } from 'lucide-react';
import { soundEngine } from '../../game/audio/soundEffects';
import type { AcademicProfile } from '../../game/types/game';
import { getCourseById } from '../../game/world/academicCatalog';

interface MainMenuProps {
  studentName: string;
  nickname: string;
  academicProfile: AcademicProfile;
  onPlay: () => void;
  onOpenCharacter: () => void;
  onOpenSettings: () => void;
  onOpenInfo: () => void;
}

export function MainMenu({
  studentName,
  nickname,
  academicProfile,
  onPlay,
  onOpenCharacter,
  onOpenSettings,
  onOpenInfo,
}: MainMenuProps) {
  const displayNick = nickname.trim() || studentName;
  const enrolledCourse = academicProfile.admitted
    ? getCourseById(academicProfile.courseId)
    : undefined;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        const activeTag = (document.activeElement as HTMLElement | null)?.tagName;
        if (activeTag === 'BUTTON' || activeTag === 'INPUT' || activeTag === 'SELECT') return;
        e.preventDefault();
        soundEngine.playUiClick();
        onPlay();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onPlay]);

  return (
    <div className="fixed inset-0 z-10 flex flex-col justify-between p-6 md:p-12 pointer-events-none">
      {/* Subtle directional gradient scrim on left side for crisp text legibility */}
      <div
        aria-hidden="true"
        className="fixed inset-y-0 left-0 w-full md:w-[520px] bg-gradient-to-r from-[#071B14]/88 via-[#071B14]/60 to-transparent pointer-events-none"
      />

      {/* Top University Crest Mark */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <svg
            width="46"
            height="46"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M8 8H40V25C40 34.5 24 42 24 42C24 42 8 34.5 8 25V8Z"
              fill="#0D3B2E"
              stroke="#D4A024"
              strokeWidth="2.5"
            />
            <path
              d="M24 14L29 22L24 31L19 22L24 14Z"
              fill="#D4A024"
            />
            <path
              d="M15 16H20M28 16H33"
              stroke="#F5F0E6"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <div>
            <p className="text-xs font-semibold tracking-wider text-[#D4A024]">
              University Campus
            </p>
            <p className="text-xs text-[#D5DDD9]">
              3D Open-World Simulation
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.playUiClick();
            onOpenInfo();
          }}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-lg bg-[#0B241C]/90 px-4 py-2.5 text-sm font-medium text-[#F5F0E6] border border-[#D4A024]/30 hover:bg-[#133A2D] hover:border-[#D4A024]/60 transition-colors focus-visible:outline-2 focus-visible:outline-[#D4A024] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-[#D4A024]" aria-hidden="true" />
          <span>Campus Guide</span>
        </button>
      </div>

      {/* Main Title & Actions Block */}
      <main className="relative z-10 max-w-md my-auto py-6">
        <h1
          className="font-display text-5xl md:text-6xl font-extrabold tracking-tight text-[#F5F0E6] leading-[1.02] mb-3"
          style={{ textShadow: '0 4px 20px rgba(0,0,0,0.45)' }}
        >
          Campus Life
        </h1>
        <p className="text-base text-[#DCE5E0] leading-relaxed mb-4 max-w-sm">
          Step onto the university grounds. Walk Freedom Boulevard, explore academic faculties, and customize your student character in the 3D studio.
        </p>
        {enrolledCourse && academicProfile.level ? (
          <p className="text-xs font-medium text-[#D4A024] mb-6 max-w-sm truncate">
            {studentName} · {academicProfile.level}L · {enrolledCourse.name}
          </p>
        ) : (
          <p className="text-xs font-medium text-[#B9C8C1] mb-6 max-w-sm">
            Create your character &amp; choose your faculty before entering campus.
          </p>
        )}

        <div className="flex flex-col gap-3 max-w-xs pointer-events-auto">
          <button
            type="button"
            data-start="true"
            onClick={() => {
              soundEngine.playUiClick();
              onPlay();
            }}
            className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-[#D4A024] px-6 py-3.5 text-base font-bold text-[#0A1F18] shadow-lg hover:bg-[#E2B23B] active:scale-[0.99] transition-all focus-visible:outline-2 focus-visible:outline-white whitespace-nowrap cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" aria-hidden="true" />
            <span>
              {academicProfile.admitted ? `Play as ${displayNick}` : 'Create Student & Enroll'}
            </span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                soundEngine.playUiClick();
                onOpenCharacter();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0D2B21]/92 px-4 py-3 text-sm font-semibold text-[#F5F0E6] border border-white/15 hover:bg-[#154133] hover:border-[#D4A024]/50 transition-colors focus-visible:outline-2 focus-visible:outline-[#D4A024] whitespace-nowrap cursor-pointer"
            >
              <User className="w-4 h-4 text-[#D4A024]" aria-hidden="true" />
              <span>Character</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playUiClick();
                onOpenSettings();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0D2B21]/92 px-4 py-3 text-sm font-semibold text-[#F5F0E6] border border-white/15 hover:bg-[#154133] hover:border-[#D4A024]/50 transition-colors focus-visible:outline-2 focus-visible:outline-[#D4A024] whitespace-nowrap cursor-pointer"
            >
              <Settings className="w-4 h-4 text-[#D4A024]" aria-hidden="true" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </main>

      {/* Subtle bottom gradient scrim for footer contrast */}
      <div
        aria-hidden="true"
        className="fixed inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#071B14]/75 to-transparent pointer-events-none"
      />

      {/* Flat, borderless bottom control hint */}
      <footer
        className="relative z-10 flex flex-wrap items-center justify-between gap-4 text-xs text-[#E8EFEA]"
        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.65)' }}
      >
        <span>WASD Move · Shift Run · Space Jump · V Camera · Esc Pause</span>
        <span>Campus Life · Phase 1 Prototype</span>
      </footer>
    </div>
  );
}
