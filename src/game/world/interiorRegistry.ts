import type {
  ExteriorAnchor,
  ExteriorPortalSpec,
  InteriorWorld,
  NearbyInteractionPrompt,
} from '../types/interior';
import { DEMO_INTERIOR } from './demoInterior';
import { ACADEMIC_BUILDING_INTERIOR } from './interiors/academicBuilding';
import { ADMINISTRATIVE_BUILDING_INTERIOR } from './interiors/administrativeBuilding';
import { CAFETERIA_INTERIOR } from './interiors/cafeteria';
import { CLINIC_INTERIOR } from './interiors/clinic';
import { UNIVERSITY_HALL_INTERIOR } from './interiors/universityHall';
import { ALL_WORKSHOP_INTERIORS } from './interiors/workshops';

const INTERIOR_REGISTRY = new Map<string, InteriorWorld>();

export function registerInterior(interior: InteriorWorld): void {
  INTERIOR_REGISTRY.set(interior.id, interior);
}

export function unregisterInterior(id: string): void {
  INTERIOR_REGISTRY.delete(id);
}

export function getInteriorById(id: string): InteriorWorld | undefined {
  return INTERIOR_REGISTRY.get(id);
}

export function listRegisteredInteriors(): InteriorWorld[] {
  return Array.from(INTERIOR_REGISTRY.values());
}

/**
 * Isolated development/testing entry portal positioned off to the west edge of the
 * entrance paver plaza (never attached to any campus building). Only active in
 * development builds (`import.meta.env.DEV`).
 */
export const DEV_DEMO_ENTRY_PORTAL: {
  interiorId: string;
  label: string;
  x: number;
  y: number;
  z: number;
  triggerRadius: number;
  returnAnchor: ExteriorAnchor;
} = {
  interiorId: DEMO_INTERIOR.id,
  label: 'Dev Test: Enter Demo Interior',
  x: -16.5,
  y: 0.04,
  z: 120.0,
  triggerRadius: 2.3,
  returnAnchor: {
    x: -16.5,
    y: 0.04,
    z: 122.5,
    yaw: 0,
  },
};

export function isDevelopmentInteriorAllowed(isDevEnvironment: boolean): boolean {
  return isDevEnvironment === true;
}

/**
 * Confirmed Combined Phase 2.3 exterior building entrances mapped to their interiors
 * and exact collision-free step-out return anchors.
 */
export const CAMPUS_BUILDING_PORTALS: ReadonlyArray<ExteriorPortalSpec> = [
  {
    id: 'portal-academic-building',
    buildingId: ACADEMIC_BUILDING_INTERIOR.id,
    label: 'Enter Academic Building',
    x: 0.0,
    y: 0.04,
    z: -32.4,
    triggerRadius: 2.65,
    returnAnchor: {
      x: 0.0,
      y: 0.04,
      z: -30.8,
      yaw: Math.PI,
    },
  },
  {
    id: 'portal-academic-rear-passage',
    buildingId: ACADEMIC_BUILDING_INTERIOR.id,
    label: 'Enter Rear Workshop Passage (To Rear Stairs & Toilets)',
    x: -21.0,
    y: 0.04,
    z: -90.8,
    triggerRadius: 2.65,
    entrySpawn: {
      x: -21.0,
      y: 0.0,
      z: -25.8,
      yaw: Math.PI,
    },
    returnAnchor: {
      x: -21.0,
      y: 0.04,
      z: -91.8,
      yaw: Math.PI / 2,
    },
  },
  {
    id: 'portal-workshop-carpentry',
    buildingId: 'workshop-carpentry',
    label: 'Enter Carpentry & Woodwork Workshop',
    x: -47.3,
    y: 0.04,
    z: -59.4,
    triggerRadius: 2.15,
    returnAnchor: {
      x: -48.5,
      y: 0.04,
      z: -59.4,
      yaw: Math.PI / 2,
    },
  },
  {
    id: 'portal-workshop-mechanical',
    buildingId: 'workshop-mechanical',
    label: 'Enter Mechanical Engineering Workshop',
    x: -47.3,
    y: 0.04,
    z: -66.2,
    triggerRadius: 2.15,
    returnAnchor: {
      x: -48.5,
      y: 0.04,
      z: -66.2,
      yaw: Math.PI / 2,
    },
  },
  {
    id: 'portal-workshop-welding',
    buildingId: 'workshop-welding',
    label: 'Enter Welding & Fabrication Workshop',
    x: -47.3,
    y: 0.04,
    z: -73.0,
    triggerRadius: 2.15,
    returnAnchor: {
      x: -48.5,
      y: 0.04,
      z: -73.0,
      yaw: Math.PI / 2,
    },
  },
  {
    id: 'portal-workshop-electrical',
    buildingId: 'workshop-electrical',
    label: 'Enter Electrical & Electronics Workshop',
    x: -47.3,
    y: 0.04,
    z: -79.8,
    triggerRadius: 2.15,
    returnAnchor: {
      x: -48.5,
      y: 0.04,
      z: -79.8,
      yaw: Math.PI / 2,
    },
  },
  {
    id: 'portal-workshop-machine',
    buildingId: 'workshop-machine',
    label: 'Enter Machine Shop',
    x: -47.3,
    y: 0.04,
    z: -86.6,
    triggerRadius: 2.15,
    returnAnchor: {
      x: -48.5,
      y: 0.04,
      z: -86.6,
      yaw: Math.PI / 2,
    },
  },
  {
    id: 'portal-clinic',
    buildingId: CLINIC_INTERIOR.id,
    label: 'Enter Campus Clinic',
    x: -39.5,
    y: 0.04,
    z: 16.3,
    triggerRadius: 2.6,
    returnAnchor: {
      x: -39.5,
      y: 0.04,
      z: 15.0,
      yaw: 0,
    },
  },
  {
    id: 'portal-administrative-building',
    buildingId: ADMINISTRATIVE_BUILDING_INTERIOR.id,
    label: 'Enter Administrative Building',
    x: -42.5,
    y: 0.04,
    z: 43.0,
    triggerRadius: 2.6,
    returnAnchor: {
      x: -41.2,
      y: 0.04,
      z: 43.0,
      yaw: -Math.PI / 2,
    },
  },
  {
    id: 'portal-cafeteria',
    buildingId: CAFETERIA_INTERIOR.id,
    label: 'Enter Cafeteria & Fellowship Hall',
    x: -72.5,
    y: 0.04,
    z: -47.0,
    triggerRadius: 2.6,
    returnAnchor: {
      x: -71.2,
      y: 0.04,
      z: -47.0,
      yaw: -Math.PI / 2,
    },
  },
  {
    id: 'portal-university-hall',
    buildingId: UNIVERSITY_HALL_INTERIOR.id,
    label: 'Enter University Hall',
    x: 54.0,
    y: 0.04,
    z: 103.2,
    triggerRadius: 2.65,
    returnAnchor: {
      x: 54.0,
      y: 0.04,
      z: 104.6,
      yaw: 0,
    },
  },
];

export function findNearestExteriorPortal(
  x: number,
  z: number,
  isDevEnvironment: boolean
): NearbyInteractionPrompt | null {
  let bestPrompt: NearbyInteractionPrompt | null = null;
  let bestDistSq = Infinity;

  for (const portal of CAMPUS_BUILDING_PORTALS) {
    const dx = x - portal.x;
    const dz = z - portal.z;
    const distSq = dx * dx + dz * dz;
    if (distSq <= portal.triggerRadius * portal.triggerRadius && distSq < bestDistSq) {
      bestDistSq = distSq;
      bestPrompt = {
        id: portal.id,
        kind: 'enter-interior',
        label: portal.label,
        targetId: portal.buildingId,
        returnAnchor: portal.returnAnchor,
        entrySpawn: portal.entrySpawn,
      };
    }
  }

  if (isDevelopmentInteriorAllowed(isDevEnvironment)) {
    const dx = x - DEV_DEMO_ENTRY_PORTAL.x;
    const dz = z - DEV_DEMO_ENTRY_PORTAL.z;
    const distSq = dx * dx + dz * dz;
    if (
      distSq <= DEV_DEMO_ENTRY_PORTAL.triggerRadius * DEV_DEMO_ENTRY_PORTAL.triggerRadius &&
      distSq < bestDistSq
    ) {
      bestPrompt = {
        id: 'dev-demo-portal',
        kind: 'enter-dev-interior',
        label: DEV_DEMO_ENTRY_PORTAL.label,
        targetId: DEV_DEMO_ENTRY_PORTAL.interiorId,
        returnAnchor: DEV_DEMO_ENTRY_PORTAL.returnAnchor,
      };
    }
  }

  return bestPrompt;
}

// Register standalone demonstration interior + all confirmed Phase 2.2 buildings
registerInterior(DEMO_INTERIOR);
registerInterior(ACADEMIC_BUILDING_INTERIOR);
registerInterior(ADMINISTRATIVE_BUILDING_INTERIOR);
registerInterior(CLINIC_INTERIOR);
registerInterior(CAFETERIA_INTERIOR);
registerInterior(UNIVERSITY_HALL_INTERIOR);
for (const workshop of ALL_WORKSHOP_INTERIORS) {
  registerInterior(workshop);
}
