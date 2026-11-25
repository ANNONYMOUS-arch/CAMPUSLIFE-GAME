# Campus Life — Architecture Guide (Phase 1)

## 1. Architectural Separation of Concerns

Campus Life separates pure simulation logic, input handling, 3D rendering, audio synthesis, and UI overlays into distinct layers so the codebase can scale cleanly into multiplayer and economy features in future phases.

### Layer Breakdown

- **Types & Future Contracts (`src/game/types/`)**
  - `game.ts`: Phase 1 screen states, character appearance model, settings, physics state, AABB colliders, step surfaces, and HUD snapshots.
  - `future.ts`: Clean TypeScript contracts (`MultiplayerTransportContract`, `AuthServiceContract`, `PlayerInventoryContract`, `BankingServiceContract`, `MissionDefinition`, `JobShiftContract`, `HostelAccommodation`, `AcademicActivity`) prepared for Phase 2+ without premature stubs.
- **Pure Simulation & World Data (`src/game/physics/`, `src/game/world/`, `src/game/state/`)**
  - `collision.ts`: Deterministic, React-free AABB collision resolution with axis-separated wall sliding, step-up elevation checks, gravity, coyote time, jump buffering, and 3rd-person camera obstruction pull-in.
  - `campusData.ts`: Authoritative coordinates for university campus landmarks, walkable step surfaces, campus zone boundaries, spawn point, trees, and streetlights.
  - `persistence.ts`: Schema-sanitized local storage persistence for student customization and game settings.
- **Input & Audio (`src/game/input/`, `src/game/audio/`)**
  - `inputManager.ts`: Unified desktop (WASD/Arrows, pointer lock + drag fallback, scroll zoom) and mobile (virtual joystick, touch look pad, jump/run) hub decoupled from React 60Hz re-renders.
  - `soundEffects.ts`: Zero-dependency Web Audio API procedural sound effects (footsteps, jump, landing, UI clicks).
- **3D Rendering Layer (`src/game/three/` & `src/components/three/`)**
  - `textures.ts` & `materials.ts`: Procedural `CanvasTexture` generators (asphalt road markings, interlocking pavers, laterite/grass, Nigerian university signage, Senate clock face), `RoomEnvironment` PBR reflections, and `detectSoftwareWebGL()` + `scheduleAfterDraw()` pacing for software rasterizers.
  - `CharacterBuilder.ts`: Articulated multi-part 3D human student rig supporting customizable skin tones, 5 hairstyles/headwear, clothing colors, backpack, glasses, and speed-synced walk/run/jump/idle animations.
  - `CampusEnvironment.tsx`: Procedural university campus featuring `InstancedMesh` palms, shade trees, and solar streetlights for low draw calls on mobile devices.
  - `PlayerController.tsx` & `MenuShowcaseScene.tsx`: Camera choreography (live menu flyover, 3D Character Studio podium, damped 3rd-person follow rig, and 1st-person eye perspective).
- **UI & Shell Layer (`src/components/ui/`, `src/App.tsx`)**
  - Full-viewport Game Shell (`title`, `character`, `settings`, `loading`, `playing`, `paused`) mirrored to `document.body.dataset.state`, with throttled HUD updates (`~8Hz`) and responsive touch controls.
