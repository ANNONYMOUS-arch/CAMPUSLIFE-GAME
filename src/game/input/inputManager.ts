/**
 * Unified Desktop + Mobile Input Hub for Campus Life.
 * Reads keyboard, mouse (pointer-lock & drag fallback), scroll wheel,
 * and virtual touch controls without triggering React re-renders at 60Hz.
 */

export interface InputSnapshot {
  moveForward: number;
  moveRight: number;
  sprint: boolean;
  jumpJustPressed: boolean;
  interactJustPressed: boolean;
  toggleCameraJustPressed: boolean;
  pauseJustPressed: boolean;
  lookDeltaX: number;
  lookDeltaY: number;
  zoomDelta: number;
}

class InputManager {
  private keys = new Set<string>();
  private jumpQueued = false;
  private interactQueued = false;
  private cameraToggleQueued = false;
  private pauseQueued = false;

  private lookDeltaX = 0;
  private lookDeltaY = 0;
  private zoomDelta = 0;
  private isDraggingMouse = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  // Virtual mobile touch inputs
  private joyX = 0;
  private joyY = 0;
  private touchSprinting = false;

  private attached = false;
  private canvasEl: HTMLElement | null = null;
  private gameplayActive = false;

  public setGameplayActive(active: boolean): void {
    this.gameplayActive = active;
    if (!active) {
      this.clearAll();
      if (typeof document !== 'undefined' && document.pointerLockElement) {
        document.exitPointerLock?.();
      }
    }
  }

  public setCanvasElement(el: HTMLElement | null): void {
    this.canvasEl = el;
  }

  public attach(): () => void {
    if (this.attached || typeof window === 'undefined') {
      return () => {};
    }
    this.attached = true;

    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore keyboard shortcuts when typing into an input field
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      const code = e.code;
      const wasDown = this.keys.has(code);
      this.keys.add(code);

      if (!wasDown) {
        if (code === 'Space') {
          this.jumpQueued = true;
        } else if (code === 'KeyE') {
          this.interactQueued = true;
        } else if (code === 'KeyV') {
          this.cameraToggleQueued = true;
        } else if (code === 'Escape' || code === 'KeyP') {
          this.pauseQueued = true;
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      this.keys.delete(e.code);
    };

    const onMouseDown = (e: MouseEvent) => {
      if (!this.gameplayActive) return;
      // Only start look-drag if clicking the canvas itself
      if (this.canvasEl && e.target !== this.canvasEl) return;
      if (e.button === 0 || e.button === 2) {
        this.isDraggingMouse = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    };

    const onMouseUp = () => {
      this.isDraggingMouse = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!this.gameplayActive) return;
      if (document.pointerLockElement === this.canvasEl) {
        this.lookDeltaX += e.movementX || 0;
        this.lookDeltaY += e.movementY || 0;
      } else if (this.isDraggingMouse) {
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.lookDeltaX += dx * 1.4;
        this.lookDeltaY += dy * 1.4;
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (!this.gameplayActive) return;
      this.zoomDelta += Math.sign(e.deltaY) * 0.6;
    };

    const onBlurOrHide = () => {
      this.clearAll();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('blur', onBlurOrHide);
    document.addEventListener('visibilitychange', onBlurOrHide);

    return () => {
      this.attached = false;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('blur', onBlurOrHide);
      document.removeEventListener('visibilitychange', onBlurOrHide);
    };
  }

  public clearAll(): void {
    this.keys.clear();
    this.isDraggingMouse = false;
    this.jumpQueued = false;
    this.interactQueued = false;
    this.cameraToggleQueued = false;
    this.pauseQueued = false;
    this.lookDeltaX = 0;
    this.lookDeltaY = 0;
    this.zoomDelta = 0;
    this.joyX = 0;
    this.joyY = 0;
    this.touchSprinting = false;
  }

  // Mobile control feeds
  public setVirtualJoystick(x: number, y: number): void {
    this.joyX = Math.max(-1, Math.min(1, x));
    this.joyY = Math.max(-1, Math.min(1, y));
  }

  public addTouchLookDelta(dx: number, dy: number): void {
    this.lookDeltaX += dx * 1.6;
    this.lookDeltaY += dy * 1.6;
  }

  public triggerJump(): void {
    this.jumpQueued = true;
  }

  public triggerInteract(): void {
    this.interactQueued = true;
  }

  public setTouchSprint(active: boolean): void {
    this.touchSprinting = active;
  }

  public triggerCameraToggle(): void {
    this.cameraToggleQueued = true;
  }

  public triggerPause(): void {
    this.pauseQueued = true;
  }

  public consumeSnapshot(): InputSnapshot {
    let kbForward = 0;
    let kbRight = 0;

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) kbForward += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) kbForward -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) kbRight += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) kbRight -= 1;

    // Combine keyboard + virtual joystick (-joyY is forward because screen Y goes down)
    const moveForward = Math.max(-1, Math.min(1, kbForward - this.joyY));
    const moveRight = Math.max(-1, Math.min(1, kbRight + this.joyX));

    const sprint =
      this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.touchSprinting;

    const snap: InputSnapshot = {
      moveForward,
      moveRight,
      sprint,
      jumpJustPressed: this.jumpQueued,
      interactJustPressed: this.interactQueued,
      toggleCameraJustPressed: this.cameraToggleQueued,
      pauseJustPressed: this.pauseQueued,
      lookDeltaX: this.lookDeltaX,
      lookDeltaY: this.lookDeltaY,
      zoomDelta: this.zoomDelta,
    };

    this.jumpQueued = false;
    this.interactQueued = false;
    this.cameraToggleQueued = false;
    this.pauseQueued = false;
    this.lookDeltaX = 0;
    this.lookDeltaY = 0;
    this.zoomDelta = 0;

    return snap;
  }
}

export const inputManager = new InputManager();
