import type { AabbCollider, StepSurface } from './game';

export type InteriorRoomKind =
  | 'corridor'
  | 'lobby'
  | 'reception'
  | 'lecture-room'
  | 'office'
  | 'study-room'
  | 'library'
  | 'computer-lab'
  | 'lab'
  | 'courtyard'
  | 'meeting-room'
  | 'clinic-bay'
  | 'dining-hall'
  | 'kitchen'
  | 'fellowship-hall'
  | 'workshop'
  | 'restroom'
  | 'stairwell';

export interface InteriorFloor {
  level: number;
  elevation: number;
  label: string;
}

export interface InteriorRoom {
  id: string;
  name: string;
  subtitle: string;
  floorLevel: number;
  kind: InteriorRoomKind;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export type InteriorSurfaceRole =
  | 'floor'
  | 'ceiling'
  | 'wall'
  | 'trim'
  | 'railing';

export interface InteriorSurfaceSpec {
  id: string;
  role: InteriorSurfaceRole;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  color?: string;
  collides: boolean;
  blocksCamera?: boolean;
  railingStyle?: 'solid' | 'burglary';
  rotationY?: number;
}

export interface InteriorWindowSpec {
  id: string;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  rotationY: number;
}

export type InteriorDoorKind = 'room' | 'building-exit';

export interface InteriorDoorSpec {
  id: string;
  label: string;
  subtitle?: string;
  floorLevel: number;
  kind: InteriorDoorKind;
  hingeX: number;
  hingeY: number;
  hingeZ: number;
  width: number;
  height: number;
  thickness: number;
  closedYaw: number;
  openYaw: number;
  axis: 'x' | 'z';
  swingDir: 1 | -1;
  defaultOpen: boolean;
  /** Exact closed doorway collider spanning the opening */
  closedCollider: AabbCollider;
  /** Optional physical exterior return anchor when exiting through this specific door */
  exitReturnAnchor?: ExteriorAnchor;
}

export interface InteriorStairTreadVisual {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  rotationY?: number;
}

export interface InteriorStairSpec {
  id: string;
  fromFloor: number;
  toFloor: number;
  steps: ReadonlyArray<StepSurface>;
  treads: ReadonlyArray<InteriorStairTreadVisual>;
  railings: ReadonlyArray<InteriorSurfaceSpec>;
}

export type InteriorFurnitureKind =
  | 'desk'
  | 'chair'
  | 'student-desk-set'
  | 'chemistry-bench'
  | 'physics-bench'
  | 'nursing-trolley'
  | 'nursing-mannequin'
  | 'lectern'
  | 'whiteboard'
  | 'bookshelf'
  | 'bench'
  | 'noticeboard'
  | 'potted-plant'
  | 'computer-station'
  | 'sofa-bench'
  | 'reception-counter'
  | 'medical-bed'
  | 'dining-table'
  | 'kitchen-counter'
  | 'fellowship-pew'
  | 'workbench'
  | 'workshop-machine'
  | 'storage-rack'
  | 'toilet-cubicle'
  | 'wash-basin'
  | 'construction-barrier'
  | 'wall-sign';

export interface InteriorFurnitureSpec {
  id: string;
  kind: InteriorFurnitureKind;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  color?: string;
  label?: string;
  subtitle?: string;
  variant?: string;
  collider?: AabbCollider;
}

export interface InteriorLightSpec {
  id: string;
  x: number;
  y: number;
  z: number;
  color: string;
  intensity: number;
  distance: number;
  castPointLight?: boolean;
}

export interface InteriorWorld {
  id: string;
  name: string;
  subtitle: string;
  isDevelopmentDemo?: boolean;
  hasOpenCourtyard?: boolean;
  courtyardBounds?: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  floorHeight: number;
  floors: ReadonlyArray<InteriorFloor>;
  floorSlabs: ReadonlyArray<StepSurface>;
  rooms: ReadonlyArray<InteriorRoom>;
  surfaces: ReadonlyArray<InteriorSurfaceSpec>;
  windows: ReadonlyArray<InteriorWindowSpec>;
  doors: ReadonlyArray<InteriorDoorSpec>;
  stairs: ReadonlyArray<InteriorStairSpec>;
  furniture: ReadonlyArray<InteriorFurnitureSpec>;
  lights: ReadonlyArray<InteriorLightSpec>;
  spawnPoint: {
    x: number;
    y: number;
    z: number;
    yaw: number;
  };
  exitReturnFallback: {
    x: number;
    y: number;
    z: number;
    yaw: number;
  };
}

export interface ExteriorAnchor {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export interface ExteriorPortalSpec {
  id: string;
  buildingId: string;
  label: string;
  x: number;
  y: number;
  z: number;
  triggerRadius: number;
  returnAnchor: ExteriorAnchor;
  entrySpawn?: ExteriorAnchor;
}

export type WorldLocationState =
  | { mode: 'exterior'; returnPosition?: ExteriorAnchor }
  | {
      mode: 'interior';
      buildingId: string;
      returnPosition?: ExteriorAnchor;
      entrySpawn?: ExteriorAnchor;
    };

export interface NearbyInteractionPrompt {
  id: string;
  kind: 'toggle-door' | 'exit-interior' | 'enter-interior' | 'enter-dev-interior';
  label: string;
  targetId: string;
  returnAnchor?: ExteriorAnchor;
  entrySpawn?: ExteriorAnchor;
}
