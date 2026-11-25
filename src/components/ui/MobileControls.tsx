import { useRef, useState, type PointerEvent } from 'react';
import { ArrowUp, Zap } from 'lucide-react';
import { inputManager } from '../../game/input/inputManager';

export function MobileControls() {
  const joyBaseRef = useRef<HTMLDivElement>(null);
  const joyPointerIdRef = useRef<number | null>(null);
  const lookPointerIdRef = useRef<number | null>(null);
  const lastLookPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [sprinting, setSprinting] = useState(false);

  const maxRadius = 42;

  const updateJoystickFromClient = (clientX: number, clientY: number) => {
    const base = joyBaseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setKnobOffset({ x: dx, y: dy });
    inputManager.setVirtualJoystick(dx / maxRadius, dy / maxRadius);
  };

  const onJoyDown = (e: PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    joyPointerIdRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateJoystickFromClient(e.clientX, e.clientY);
  };

  const onJoyMove = (e: PointerEvent<HTMLDivElement>) => {
    if (joyPointerIdRef.current !== e.pointerId) return;
    updateJoystickFromClient(e.clientX, e.clientY);
  };

  const onJoyUp = (e: PointerEvent<HTMLDivElement>) => {
    if (joyPointerIdRef.current !== e.pointerId) return;
    joyPointerIdRef.current = null;
    setKnobOffset({ x: 0, y: 0 });
    inputManager.setVirtualJoystick(0, 0);
  };

  const onLookDown = (e: PointerEvent<HTMLDivElement>) => {
    lookPointerIdRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    lastLookPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const onLookMove = (e: PointerEvent<HTMLDivElement>) => {
    if (lookPointerIdRef.current !== e.pointerId) return;
    const dx = e.clientX - lastLookPosRef.current.x;
    const dy = e.clientY - lastLookPosRef.current.y;
    lastLookPosRef.current = { x: e.clientX, y: e.clientY };
    inputManager.addTouchLookDelta(dx, dy);
  };

  const onLookUp = (e: PointerEvent<HTMLDivElement>) => {
    if (lookPointerIdRef.current !== e.pointerId) return;
    lookPointerIdRef.current = null;
  };

  const toggleSprint = () => {
    const next = !sprinting;
    setSprinting(next);
    inputManager.setTouchSprint(next);
  };

  return (
    <div
      data-testid="mobile-controls"
      className="fixed inset-0 z-10 pointer-events-none"
    >
      {/* Right-half invisible touch camera look pad */}
      <div
        aria-label="Touch camera look area"
        onPointerDown={onLookDown}
        onPointerMove={onLookMove}
        onPointerUp={onLookUp}
        onPointerCancel={onLookUp}
        className="absolute top-16 right-0 bottom-0 left-1/2 pointer-events-auto touch-none"
      />

      {/* Left-thumb Virtual Analog Joystick */}
      <div
        ref={joyBaseRef}
        role="slider"
        aria-label="Movement joystick"
        aria-valuetext={`${Math.round(knobOffset.x)}, ${Math.round(knobOffset.y)}`}
        onPointerDown={onJoyDown}
        onPointerMove={onJoyMove}
        onPointerUp={onJoyUp}
        onPointerCancel={onJoyUp}
        className="pointer-events-auto absolute bottom-7 left-6 w-28 h-28 rounded-full bg-[#0B241C]/78 border-2 border-[#D4A024]/55 flex items-center justify-center touch-none shadow-lg"
      >
        <div
          className="w-12 h-12 rounded-full bg-[#D4A024] border-2 border-[#FFF8EC] shadow-md"
          style={{
            transform: `translate3d(${knobOffset.x}px, ${knobOffset.y}px, 0)`,
          }}
        />
      </div>

      {/* Right-thumb Action Buttons (Run + Jump) */}
      <div className="pointer-events-auto absolute bottom-7 right-6 flex items-end gap-3.5">
        <button
          type="button"
          aria-label="Toggle Run"
          aria-pressed={sprinting}
          onPointerDown={(e) => {
            e.stopPropagation();
            toggleSprint();
          }}
          className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center gap-0.5 shadow-lg transition-colors cursor-pointer ${
            sprinting
              ? 'bg-[#D4A024] border-[#FFF8EC] text-[#0B241C]'
              : 'bg-[#0B241C]/88 border-white/30 text-[#F5F0E6]'
          }`}
        >
          <Zap className="w-4 h-4" aria-hidden="true" />
          <span className="text-[10px] font-bold">RUN</span>
        </button>

        <button
          type="button"
          aria-label="Jump"
          onPointerDown={(e) => {
            e.stopPropagation();
            inputManager.triggerJump();
          }}
          className="w-16 h-16 rounded-full bg-[#0D3B2E]/92 border-2 border-[#D4A024] text-[#F5F0E6] active:bg-[#D4A024] active:text-[#0B241C] flex flex-col items-center justify-center gap-0.5 shadow-xl cursor-pointer"
        >
          <ArrowUp className="w-5 h-5" aria-hidden="true" />
          <span className="text-[10px] font-bold">JUMP</span>
        </button>
      </div>
    </div>
  );
}
