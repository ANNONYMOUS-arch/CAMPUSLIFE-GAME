import type { CharacterAppearance, GenderId } from './game';

export type NpcActivity =
  | 'walking'
  | 'idle'
  | 'sitting'
  | 'waiting'
  | 'group-walk'
  | 'talking';

export type NpcAnimPose = 'idle' | 'walking' | 'sitting' | 'talking';

export type NpcNavNodeKind =
  | 'sidewalk'
  | 'plaza'
  | 'entrance'
  | 'crosswalk'
  | 'interior';

export interface NpcNavNode {
  id: string;
  x: number;
  y: number;
  z: number;
  kind: NpcNavNodeKind;
  zoneTag: string;
  neighbors: string[];
}

export interface NpcSeatSpot {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  /** World Y height of the top of the seat cushion/plank */
  seatSurfaceY: number;
  /** World yaw (0 faces -Z) */
  yaw: number;
  nearbyNodeId: string;
  zoneTag: string;
  /** Collider ID of the bench/sofa to ignore only while seated on or stepping onto this spot */
  benchColliderId?: string;
}

export interface NpcWaitSpot {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  nearbyNodeId: string;
  zoneTag: string;
  partnerX?: number;
  partnerZ?: number;
  partnerYaw?: number;
}

export interface NpcNavGraph {
  id: string;
  nodes: Record<string, NpcNavNode>;
  seats: NpcSeatSpot[];
  waitSpots: NpcWaitSpot[];
}

export type NpcInitialBehavior =
  | { kind: 'walk'; startNodeId: string; targetNodeId: string }
  | { kind: 'sit'; seatId: string; duration: number }
  | { kind: 'wait'; waitId: string; duration: number }
  | { kind: 'talk'; waitId: string; role: 'primary' | 'partner'; partnerId: string; duration: number }
  | { kind: 'group-walk'; startNodeId: string; targetNodeId: string; leaderId?: string; sideOffset?: number };

export interface StudentNpcProfile {
  id: string;
  name: string;
  gender: GenderId;
  appearance: CharacterAppearance;
  heightScale: number;
  walkSpeed: number;
  homeZone: string;
  preferredZones: string[];
  initialBehavior: NpcInitialBehavior;
  /** Priority rank (1..N); lower ranks remain active under lower graphics/population caps */
  priority: number;
}

export type NpcLodTier = 'near' | 'mid' | 'far';

export interface StudentNpcRuntimeState {
  id: string;
  profile: StudentNpcProfile;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  rotationYaw: number;
  horizontalSpeed: number;
  activity: NpcActivity;
  pose: NpcAnimPose;
  pathNodeIds: string[];
  pathIndex: number;
  currentNodeId: string;
  destinationNodeId: string | null;
  activeSeatId: string | null;
  activeWaitId: string | null;
  seatSurfaceY: number | null;
  dwellTimer: number;
  stuckTimer: number;
  stuckCheckX: number;
  stuckCheckZ: number;
  groupLeaderId: string | null;
  groupSideOffset: number;
  talkPartnerId: string | null;
  phaseOffset: number;
  lodTier: NpcLodTier;
  lodAccumulator: number;
}

export interface PlayerSnapshotForNpc {
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  active: boolean;
}
