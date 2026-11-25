import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

const ORIENTATION_TIPS = [
  'Tip: Press V anytime to switch between third-person and first-person views.',
  'Tip: Walk through the University Main Gate down Freedom Boulevard toward the Senate Clock Tower.',
  'Tip: Visit the Student Union & Buka Pavilion on the northeast quad.',
];

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(12);
  const [tipIndex] = useState(() => Math.floor(Math.random() * ORIENTATION_TIPS.length));

  useEffect(() => {
    const start = performance.now();
    const durationMs = 750;
    let rafId = 0;

    const step = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(100, Math.round(12 + (elapsed / durationMs) * 88));
      setProgress(pct);
      if (pct >= 100) {
        onComplete();
      } else {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#081C15]/96 p-6">
      <div className="w-full max-w-md rounded-xl bg-[#0D2B21] border border-[#D4A024]/35 p-7 text-center shadow-2xl">
        <p className="text-xs font-semibold text-[#D4A024] mb-1">Campus Life</p>
        <h2 className="font-display text-2xl font-bold text-[#F5F0E6] mb-4">
          Entering Campus Grounds
        </h2>

        <div className="w-full h-2.5 rounded-full bg-[#071610] overflow-hidden border border-white/10 mb-3">
          <div
            className="h-full bg-[#D4A024] transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-[#B9C8C1] mb-4">
          <span>Preparing campus environment</span>
          <span className="font-mono-tabular text-[#F5F0E6]">{progress}%</span>
        </div>

        <p className="text-xs text-[#D5DDD9] leading-relaxed">{ORIENTATION_TIPS[tipIndex]}</p>
      </div>
    </div>
  );
}
