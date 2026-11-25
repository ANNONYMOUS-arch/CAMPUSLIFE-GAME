import { X } from 'lucide-react';
import { soundEngine } from '../../game/audio/soundEffects';

interface GameInfoModalProps {
  onClose: () => void;
}

export function GameInfoModal({ onClose }: GameInfoModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#06140F]/75 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Campus Guide and Controls"
        className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-xl bg-[#0B241C] border border-[#D4A024]/35 p-6 text-[#F5F0E6] shadow-2xl flex flex-col gap-5"
      >
        <div className="flex items-start justify-between border-b border-white/10 pb-3.5">
          <div>
            <h2 className="font-display text-xl font-bold">Campus Life Guide</h2>
            <p className="text-xs text-[#B9C8C1]">Campus Life · Campus &amp; Building Exploration</p>
          </div>
          <button
            type="button"
            aria-label="Close Campus Guide"
            onClick={() => {
              soundEngine.playUiClick();
              onClose();
            }}
            className="rounded-lg p-2 text-[#C7D4CE] hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <p className="text-sm text-[#DCE5E0] leading-relaxed">
          Campus Life is an original 3D Nigerian university-life simulation. Explore the open campus grounds, enter university buildings and workshops, switch freely between third-person and first-person perspectives, and tailor your student character.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-lg bg-[#081C15] border border-white/10 p-3.5">
            <h3 className="font-display text-sm font-bold text-[#D4A024] mb-2">Desktop Controls</h3>
            <ul className="space-y-1.5 text-[#D5DDD9]">
              <li>W A S D / Arrows — Walk</li>
              <li>Hold Shift — Run / Sprint</li>
              <li>Space — Jump</li>
              <li>E — Enter Building / Open Door</li>
              <li>Mouse Drag or Click — Look Around</li>
              <li>Scroll Wheel — Camera Distance</li>
              <li>V — Toggle 1st / 3rd Person</li>
              <li>Esc or P — Pause Menu</li>
            </ul>
          </div>

          <div className="rounded-lg bg-[#081C15] border border-white/10 p-3.5">
            <h3 className="font-display text-sm font-bold text-[#D4A024] mb-2">Mobile &amp; Touch</h3>
            <ul className="space-y-1.5 text-[#D5DDD9]">
              <li>Left Thumb Pad — Walk &amp; Steer</li>
              <li>Right Screen Drag — Rotate Camera</li>
              <li>Tap Prompt — Enter Building / Open Door</li>
              <li>Run Button — Toggle Sprint</li>
              <li>Jump Button — Jump</li>
              <li>Top-Right Camera Icon — 1st / 3rd View</li>
            </ul>
          </div>
        </div>

        <div className="rounded-lg bg-[#081C15] border border-white/10 p-3.5 text-xs">
          <h3 className="font-display text-sm font-bold text-[#D4A024] mb-2">Campus Landmarks</h3>
          <p className="text-[#D5DDD9] leading-relaxed">
            University Main Gate · 2-Storey Security Building &amp; University Hall · Basketball Court · 3-Storey Administrative Block · Flag Roundabout · 4-Storey Extended Academic Building (Medical Sciences, Engineering, Library &amp; Mass Communication) &amp; 5 Attached Engineering Workshops · Campus Clinic &amp; Ambulance Bay · Cafeteria &amp; Fellowship Hall · Volleyball Court &amp; Muster Point · Female &amp; Male 100-Level Hostel · Football Field · Male 200–500-Level Hostel
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.playUiClick();
            onClose();
          }}
          className="rounded-lg bg-[#D4A024] px-5 py-2.5 text-sm font-bold text-[#0B241C] hover:bg-[#E2B23B] transition-colors cursor-pointer"
        >
          Got It
        </button>
      </section>
    </div>
  );
}
