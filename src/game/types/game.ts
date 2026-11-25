import type { NearbyInteractionPrompt } from './interior';

export type GameScreenState =
  | 'title'
  | 'character'
  | 'settings'
  | 'loading'
  | 'playing'
  | 'paused';

export type CameraMode = 'third-person' | 'first-person';

export type GraphicsQuality = 'auto' | 'low' | 'medium' | 'high';

export type ControlScheme = 'auto' | 'desktop' | 'touch';

export type GenderId = 'male' | 'female';

export type BodyBuildId = 'slim' | 'average' | 'athletic' | 'curvy' | 'broad';

export type FaceShapeId = 'oval' | 'round' | 'square' | 'heart';

export type EyeShapeId = 'almond' | 'round' | 'wide' | 'relaxed';

export type NoseShapeId = 'balanced' | 'broad' | 'aquiline' | 'button';

export type MouthShapeId = 'neutral' | 'warm-smile' | 'full-lips' | 'calm';

export type FacialDetailId =
  | 'none'
  | 'light-stubble'
  | 'beard-goatee'
  | 'full-beard'
  | 'freckles-beauty';

export type HairStyleId =
  | 'low-fade'
  | 'high-fade'
  | 'natural-afro'
  | 'short-natural'
  | 'twists'
  | 'locs'
  | 'box-braids'
  | 'cornrows'
  | 'afro-puffs'
  | 'hijab-classic'
  | 'hijab-turban'
  | 'side-part';

export type TopStyleId =
  | 'tshirt'
  | 'collared-shirt'
  | 'hoodie'
  | 'jacket'
  | 'agbada-kaftan'
  | 'ankara-top';

export type BottomStyleId =
  | 'chinos'
  | 'jeans'
  | 'joggers'
  | 'shorts'
  | 'midi-skirt';

export type DressStyleId =
  | 'none'
  | 'a-line-dress'
  | 'ankara-gown'
  | 'wrap-midi-dress';

export type FootwearStyleId =
  | 'sneakers'
  | 'sandals'
  | 'slides'
  | 'formal-shoes';

export type GlassesStyleId =
  | 'none'
  | 'round'
  | 'rectangular'
  | 'sunglasses';

export type HatStyleId =
  | 'none'
  | 'baseball-cap'
  | 'beanie'
  | 'bucket-hat';

export type AcademicLevel = 100 | 200 | 300 | 400 | 500;

export interface AcademicProfile {
  facultyId: string;
  departmentId: string;
  courseId: string;
  level: AcademicLevel | null;
  admitted: boolean;
}

export interface CharacterAppearance {
  gender: GenderId;
  studentName: string;
  nickname: string;
  skinTone: string;
  bodyBuild: BodyBuildId;
  faceShape: FaceShapeId;
  eyeShape: EyeShapeId;
  noseShape: NoseShapeId;
  mouthShape: MouthShapeId;
  facialDetail: FacialDetailId;
  hairStyle: HairStyleId;
  hairColor: string;
  dressStyle: DressStyleId;
  dressColor: string;
  topStyle: TopStyleId;
  shirtColor: string;
  bottomStyle: BottomStyleId;
  trouserColor: string;
  footwearStyle: FootwearStyleId;
  shoeColor: string;
  glassesStyle: GlassesStyleId;
  hatStyle: HatStyleId;
  hatColor: string;
  hasWatch: boolean;
  hasNecklace: boolean;
  hasEarrings: boolean;
  hasBackpack: boolean;
  backpackColor: string;
}

export interface GameSettings {
  graphicsQuality: GraphicsQuality;
  cameraSensitivity: number;
  invertY: boolean;
  controlScheme: ControlScheme;
  soundEnabled: boolean;
}

export interface AabbCollider {
  id: string;
  label: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export interface StepSurface {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  elevation: number;
}

export interface CampusZone {
  id: string;
  name: string;
  subtitle: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface PlayerPhysicsState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  facingYaw: number;
  grounded: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;
  isSprinting: boolean;
  horizontalSpeed: number;
}

export interface HudSnapshot {
  zoneName: string;
  zoneSubtitle: string;
  worldMode: 'exterior' | 'interior';
  floorLabel: string | null;
  nearbyPrompt: NearbyInteractionPrompt | null;
  cameraMode: CameraMode;
  isSprinting: boolean;
  grounded: boolean;
  speedKmh: number;
  posX: number;
  posZ: number;
  facingYaw: number;
  campusPosX: number;
  campusPosZ: number;
}
