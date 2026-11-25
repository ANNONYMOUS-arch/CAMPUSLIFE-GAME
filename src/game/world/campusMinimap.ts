import {
  APPROACH_ROAD_CENTER_X,
  CUL_DE_SAC_CENTER,
  CUL_DE_SAC_RADIUS,
  DUAL_ROAD_OUTER_HALF_WIDTH,
  EAST_HALL_SPUR_Z,
  EAST_LOOP_ROAD_X,
  NORTH_CROSS_ROAD_Z,
  ROUNDABOUT_CENTER,
  ROUNDABOUT_INNER_RADIUS,
  ROUNDABOUT_OUTER_RADIUS,
  ROAD_WIDTH,
  SECONDARY_ROAD_WIDTH,
  ADMIN_ACCESS_Z,
  WEST_ARTERIAL_Z,
  sampleEastBendCenterline,
  sampleLeftBendCenterline,
} from './campusRoad';
import type { ExteriorAnchor } from '../types/interior';

export const MINIMAP_BOUNDS = {
  minX: -116,
  maxX: 76,
  minZ: -214,
  maxZ: 132,
} as const;

export const MINIMAP_WIDTH = MINIMAP_BOUNDS.maxX - MINIMAP_BOUNDS.minX; // 192
export const MINIMAP_HEIGHT = MINIMAP_BOUNDS.maxZ - MINIMAP_BOUNDS.minZ; // 346

export interface MinimapProjectedPoint {
  svgX: number;
  svgY: number;
  clamped: boolean;
}

export interface MinimapRectSpec {
  id: string;
  label?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke?: string;
}

export interface MinimapLabelSpec {
  id: string;
  text: string;
  x: number;
  y: number;
  tone?: 'light' | 'gold' | 'muted';
}

function worldRectToSvg(
  id: string,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  fill: string,
  stroke?: string,
  label?: string
): MinimapRectSpec {
  return {
    id,
    label,
    x: minX - MINIMAP_BOUNDS.minX,
    y: minZ - MINIMAP_BOUNDS.minZ,
    width: maxX - minX,
    height: maxZ - minZ,
    fill,
    stroke,
  };
}

export function projectCampusPoint(x: number, z: number): MinimapProjectedPoint {
  const pad = 4;
  const minClampedX = MINIMAP_BOUNDS.minX + pad;
  const maxClampedX = MINIMAP_BOUNDS.maxX - pad;
  const minClampedZ = MINIMAP_BOUNDS.minZ + pad;
  const maxClampedZ = MINIMAP_BOUNDS.maxZ - pad;

  const clampedX = Math.max(minClampedX, Math.min(maxClampedX, x));
  const clampedZ = Math.max(minClampedZ, Math.min(maxClampedZ, z));

  return {
    svgX: Number((clampedX - MINIMAP_BOUNDS.minX).toFixed(2)),
    svgY: Number((clampedZ - MINIMAP_BOUNDS.minZ).toFixed(2)),
    clamped: clampedX !== x || clampedZ !== z,
  };
}

/**
 * Converts physics facingYaw (0 = North/-Z, +PI/2 = West/-X) into SVG clockwise rotation degrees
 * where 0 deg points straight up (-Y in SVG).
 */
export function getMinimapHeadingDegrees(facingYaw: number): number {
  const raw = (-facingYaw * 180) / Math.PI;
  const wrapped = ((raw + 180) % 360 + 360) % 360 - 180;
  return Number(wrapped.toFixed(1));
}

export function resolveExteriorPlayerCoords(params: {
  worldMode: 'exterior' | 'interior';
  posX: number;
  posZ: number;
  exteriorAnchor?: Pick<ExteriorAnchor, 'x' | 'z'> | null;
}): { x: number; z: number } {
  if (params.worldMode === 'interior' && params.exteriorAnchor) {
    return { x: params.exteriorAnchor.x, z: params.exteriorAnchor.z };
  }
  return { x: params.posX, z: params.posZ };
}

function samplesToSvgPolyline(samples: ReadonlyArray<{ x: number; z: number }>): string {
  return samples
    .map((pt) => `${(pt.x - MINIMAP_BOUNDS.minX).toFixed(1)},${(pt.z - MINIMAP_BOUNDS.minZ).toFixed(1)}`)
    .join(' ');
}

export const MINIMAP_ROAD_GEOMETRY = {
  mainAvenue: worldRectToSvg(
    'road-main-avenue',
    APPROACH_ROAD_CENTER_X - DUAL_ROAD_OUTER_HALF_WIDTH,
    APPROACH_ROAD_CENTER_X + DUAL_ROAD_OUTER_HALF_WIDTH,
    ROUNDABOUT_CENTER.z + ROUNDABOUT_INNER_RADIUS,
    130,
    '#2B3A35'
  ),
  medianSouth: worldRectToSvg('median-south', -1.65, 1.65, 68.5, 96.0, '#2F6849'),
  medianNorth: worldRectToSvg('median-north', -1.65, 1.65, 24.5, 63.5, '#2F6849'),
  roundaboutCx: ROUNDABOUT_CENTER.x - MINIMAP_BOUNDS.minX,
  roundaboutCy: ROUNDABOUT_CENTER.z - MINIMAP_BOUNDS.minZ,
  roundaboutRingRadius: (ROUNDABOUT_INNER_RADIUS + ROUNDABOUT_OUTER_RADIUS) / 2,
  roundaboutRingStrokeWidth: ROUNDABOUT_OUTER_RADIUS - ROUNDABOUT_INNER_RADIUS,
  roundaboutIslandRadius: ROUNDABOUT_INNER_RADIUS,
  westArterial: worldRectToSvg(
    'road-west-arterial',
    -48,
    ROUNDABOUT_CENTER.x - ROUNDABOUT_OUTER_RADIUS + 1.5,
    WEST_ARTERIAL_Z - ROAD_WIDTH / 2,
    WEST_ARTERIAL_Z + ROAD_WIDTH / 2,
    '#2B3A35'
  ),
  westBendPolyline: samplesToSvgPolyline(sampleLeftBendCenterline(24)),
  continuedNorthRoad: worldRectToSvg(
    'road-continued-north',
    -64 - ROAD_WIDTH / 2,
    -64 + ROAD_WIDTH / 2,
    CUL_DE_SAC_CENTER.z,
    -10,
    '#2B3A35'
  ),
  culDeSacCx: CUL_DE_SAC_CENTER.x - MINIMAP_BOUNDS.minX,
  culDeSacCy: CUL_DE_SAC_CENTER.z - MINIMAP_BOUNDS.minZ,
  culDeSacRadius: CUL_DE_SAC_RADIUS,
  eastArterial: worldRectToSvg(
    'road-east-arterial',
    ROUNDABOUT_CENTER.x + ROUNDABOUT_OUTER_RADIUS - 1.5,
    42,
    WEST_ARTERIAL_Z - ROAD_WIDTH / 2,
    WEST_ARTERIAL_Z + ROAD_WIDTH / 2,
    '#2B3A35'
  ),
  eastBendPolyline: samplesToSvgPolyline(sampleEastBendCenterline(24)),
  eastLoopNorth: worldRectToSvg(
    'road-east-loop',
    EAST_LOOP_ROAD_X - SECONDARY_ROAD_WIDTH / 2,
    EAST_LOOP_ROAD_X + SECONDARY_ROAD_WIDTH / 2,
    NORTH_CROSS_ROAD_Z,
    -10,
    '#2B3A35'
  ),
  forecourtCrossRoad: worldRectToSvg(
    'road-forecourt-cross',
    -64,
    EAST_LOOP_ROAD_X,
    -18 - SECONDARY_ROAD_WIDTH / 2,
    -18 + SECONDARY_ROAD_WIDTH / 2,
    '#2B3A35'
  ),
  northCrossRoad: worldRectToSvg(
    'road-north-cross',
    -96,
    EAST_LOOP_ROAD_X + SECONDARY_ROAD_WIDTH / 2,
    NORTH_CROSS_ROAD_Z - SECONDARY_ROAD_WIDTH / 2,
    NORTH_CROSS_ROAD_Z + SECONDARY_ROAD_WIDTH / 2,
    '#2B3A35'
  ),
  adminSpur: worldRectToSvg(
    'road-admin-spur',
    -44,
    -DUAL_ROAD_OUTER_HALF_WIDTH + 1,
    ADMIN_ACCESS_Z - SECONDARY_ROAD_WIDTH / 2,
    ADMIN_ACCESS_Z + SECONDARY_ROAD_WIDTH / 2,
    '#2B3A35'
  ),
  eastHallSpur: worldRectToSvg(
    'road-east-hall-spur',
    DUAL_ROAD_OUTER_HALF_WIDTH - 1,
    58,
    EAST_HALL_SPUR_Z - SECONDARY_ROAD_WIDTH / 2,
    EAST_HALL_SPUR_Z + SECONDARY_ROAD_WIDTH / 2,
    '#2B3A35'
  ),
  roadStrokeWidth: ROAD_WIDTH,
  secondaryRoadStrokeWidth: SECONDARY_ROAD_WIDTH,
} as const;

export const MINIMAP_SPORTS_COURTS: ReadonlyArray<MinimapRectSpec> = [
  worldRectToSvg('court-basketball', -58, -30, 69, 95, '#256147', '#D4A024'),
  worldRectToSvg('court-volleyball', -94, -80, -85, -67, '#256147', '#D4A024'),
  worldRectToSvg('pitch-football', -46, -4, -169, -125, '#246842', '#9AE6B4'),
];

export const MINIMAP_BUILDINGS: ReadonlyArray<MinimapRectSpec> = [
  // Academic Building (4 wings around open central courtyard -11.5..+11.5, -71..-54)
  worldRectToSvg('acad-west', -34, -11.5, -90, -34, '#ECE4D6', '#8F9B93'),
  worldRectToSvg('acad-east', 11.5, 34, -90, -34, '#ECE4D6', '#8F9B93'),
  worldRectToSvg('acad-north', -11.5, 11.5, -90, -71, '#ECE4D6', '#8F9B93'),
  worldRectToSvg('acad-south', -11.5, 11.5, -54, -34, '#ECE4D6', '#8F9B93'),
  // 5 Engineering Workshops + Blue Shipping Container #2 + Rear Junkyard
  worldRectToSvg('workshops-wing', -46, -34, -90, -56, '#D6DCE0', '#64748B'),
  worldRectToSvg('workshop-5-container', -54.8, -52.2, -88, -82, '#2563EB'),
  worldRectToSvg('junkyard-pad', -55, -29, -109, -95, '#6B665C', '#A8A29E'),
  // Entrance Right: Security Building & University Hall + Utility Bay
  worldRectToSvg('security-building', 22, 34, 90, 100, '#EAE2D4', '#A3482E'),
  worldRectToSvg('university-hall', 42, 66, 88, 102, '#ECE4D6', '#D4A024'),
  worldRectToSvg('entrance-utility', 19, 28, 61, 71, '#4D7C5F'),
  // Entrance Left: Administrative Block & Campus Clinic
  worldRectToSvg('admin-block', -64, -44, 34, 52, '#9CA3AF', '#CBD5E1'),
  worldRectToSvg('campus-clinic', -52, -36, 17.5, 27.5, '#F8FAFC', '#DC2626'),
  // Cafeteria, Fellowship Hall & Buka Kiosk
  worldRectToSvg('cafeteria', -94, -74, -56, -38, '#E6D8C3', '#D97706'),
  worldRectToSvg('buka-kiosk', -80, -74, -34, -28, '#D9A76A'),
  // Hostels (North of Cross Road)
  worldRectToSvg('hostel-100l', -106, -76, -156, -124, '#EAE0CF', '#94A3B8'),
  worldRectToSvg('hostel-senior', -88, -40, -206, -188, '#EAE0CF', '#94A3B8'),
  // Main Gate Piers
  worldRectToSvg('gate-west', -15.8, -12.6, 112.5, 115.5, '#D4A024'),
  worldRectToSvg('gate-east', 12.6, 15.8, 112.5, 115.5, '#D4A024'),
  worldRectToSvg('gate-ped', 21.0, 23.4, 112.5, 115.5, '#D4A024'),
];

export const MINIMAP_LABELS: ReadonlyArray<MinimapLabelSpec> = [
  { id: 'lbl-hostel-sr', text: '200-500L', x: -64 - MINIMAP_BOUNDS.minX, y: -194.5 - MINIMAP_BOUNDS.minZ, tone: 'light' },
  { id: 'lbl-hostel-100', text: '100L', x: -91 - MINIMAP_BOUNDS.minX, y: -137.5 - MINIMAP_BOUNDS.minZ, tone: 'light' },
  { id: 'lbl-pitch', text: 'PITCH', x: -25 - MINIMAP_BOUNDS.minX, y: -144.5 - MINIMAP_BOUNDS.minZ, tone: 'gold' },
  { id: 'lbl-acad', text: 'ACADEMIC', x: 0 - MINIMAP_BOUNDS.minX, y: -41.5 - MINIMAP_BOUNDS.minZ, tone: 'light' },
  { id: 'lbl-work', text: 'WORK', x: -40 - MINIMAP_BOUNDS.minX, y: -70.5 - MINIMAP_BOUNDS.minZ, tone: 'light' },
  { id: 'lbl-cafe', text: 'CAFE', x: -84 - MINIMAP_BOUNDS.minX, y: -44.5 - MINIMAP_BOUNDS.minZ, tone: 'light' },
  { id: 'lbl-clinic', text: 'CLINIC', x: -44 - MINIMAP_BOUNDS.minX, y: 24.5 - MINIMAP_BOUNDS.minZ, tone: 'light' },
  { id: 'lbl-admin', text: 'ADMIN', x: -54 - MINIMAP_BOUNDS.minX, y: 45 - MINIMAP_BOUNDS.minZ, tone: 'light' },
  { id: 'lbl-court', text: 'COURT', x: -44 - MINIMAP_BOUNDS.minX, y: 84 - MINIMAP_BOUNDS.minZ, tone: 'gold' },
  { id: 'lbl-sec', text: 'SEC', x: 28 - MINIMAP_BOUNDS.minX, y: 97 - MINIMAP_BOUNDS.minZ, tone: 'light' },
  { id: 'lbl-uhall', text: 'HALL', x: 54 - MINIMAP_BOUNDS.minX, y: 97 - MINIMAP_BOUNDS.minZ, tone: 'light' },
  { id: 'lbl-gate', text: 'GATE', x: -32 - MINIMAP_BOUNDS.minX, y: 122 - MINIMAP_BOUNDS.minZ, tone: 'gold' },
];
