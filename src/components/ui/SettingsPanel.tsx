import { ArrowLeft } from 'lucide-react';
import { DEFAULT_SETTINGS } from '../../game/state/persistence';
import { soundEngine } from '../../game/audio/soundEffects';
import type { ControlScheme, GameSettings, GraphicsQuality } from '../../game/types/game';

interface SettingsPanelProps {
  settings: GameSettings;
  onChange: (next: GameSettings) => void;
  onClose: () => void;
}

const QUALITY_OPTIONS: Array<{ id: GraphicsQuality; label: string }> = [
  { id: 'auto', label: 'Auto' },
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
];

const CONTROL_OPTIONS: Array<{ id: ControlScheme; label: string }> = [
  { id: 'auto', label: 'Auto' },
  { id: 'desktop', label: 'Desktop' },
  { id: 'touch', label: 'Touch Pad' },
];

export function SettingsPanel({ settings, onChange, onClose }: SettingsPanelProps) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#06140F]/72 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Game Settings"
        className="w-full max-w-md rounded-xl bg-[#0B241C] border border-[#D4A024]/35 p-6 text-[#F5F0E6] shadow-2xl flex flex-col gap-5"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
          <div>
            <h2 className="font-display text-xl font-bold">Settings</h2>
            <p className="text-xs text-[#B9C8C1]">Graphics, camera, and controls</p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onChange({ ...DEFAULT_SETTINGS });
            }}
            className="text-xs font-medium text-[#D4A024] hover:text-[#F0C14B] px-2.5 py-1.5 rounded-md hover:bg-white/5 cursor-pointer"
          >
            Defaults
          </button>
        </div>

        {/* Graphics Quality */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-[#D5DDD9]">Graphics Quality</span>
          <div className="grid grid-cols-4 gap-2">
            {QUALITY_OPTIONS.map((q) => {
              const active = settings.graphicsQuality === q.id;
              return (
                <button
                  key={q.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    soundEngine.playUiClick();
                    onChange({ ...settings, graphicsQuality: q.id });
                  }}
                  className={`rounded-lg py-2 text-xs font-semibold border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#D4A024] text-[#0B241C] border-[#D4A024]'
                      : 'bg-[#081C15] text-[#DCE5E0] border-white/12 hover:border-[#D4A024]/50'
                  }`}
                >
                  {q.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Control Scheme */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-[#D5DDD9]">Input Controls</span>
          <div className="grid grid-cols-3 gap-2">
            {CONTROL_OPTIONS.map((c) => {
              const active = settings.controlScheme === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    soundEngine.playUiClick();
                    onChange({ ...settings, controlScheme: c.id });
                  }}
                  className={`rounded-lg py-2 text-xs font-semibold border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#D4A024] text-[#0B241C] border-[#D4A024]'
                      : 'bg-[#081C15] text-[#DCE5E0] border-white/12 hover:border-[#D4A024]/50'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Camera Sensitivity */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="cam-sens-range" className="text-xs font-semibold text-[#D5DDD9]">
              Camera Sensitivity
            </label>
            <span className="font-mono-tabular text-xs text-[#D4A024]">
              {settings.cameraSensitivity.toFixed(1)}x
            </span>
          </div>
          <input
            id="cam-sens-range"
            type="range"
            min="0.4"
            max="2.0"
            step="0.1"
            value={settings.cameraSensitivity}
            onChange={(e) =>
              onChange({ ...settings, cameraSensitivity: parseFloat(e.target.value) })
            }
            className="w-full accent-[#D4A024] cursor-pointer"
          />
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            aria-pressed={settings.invertY}
            onClick={() => {
              soundEngine.playUiClick();
              onChange({ ...settings, invertY: !settings.invertY });
            }}
            className={`rounded-lg px-3 py-2.5 text-xs font-semibold border transition-colors cursor-pointer ${
              settings.invertY
                ? 'bg-[#164A39] text-[#F5F0E6] border-[#D4A024]'
                : 'bg-[#081C15] text-[#B9C8C1] border-white/12'
            }`}
          >
            Invert Look Y: {settings.invertY ? 'On' : 'Off'}
          </button>
          <button
            type="button"
            aria-pressed={settings.soundEnabled}
            onClick={() => {
              const nextSound = !settings.soundEnabled;
              onChange({ ...settings, soundEnabled: nextSound });
              if (nextSound) soundEngine.playUiClick();
            }}
            className={`rounded-lg px-3 py-2.5 text-xs font-semibold border transition-colors cursor-pointer ${
              settings.soundEnabled
                ? 'bg-[#164A39] text-[#F5F0E6] border-[#D4A024]'
                : 'bg-[#081C15] text-[#B9C8C1] border-white/12'
            }`}
          >
            Sound Effects: {settings.soundEnabled ? 'On' : 'Off'}
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.playUiClick();
            onClose();
          }}
          className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#D4A024] px-5 py-3 text-sm font-bold text-[#0B241C] hover:bg-[#E2B23B] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Save &amp; Return</span>
        </button>
      </section>
    </div>
  );
}
