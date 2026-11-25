import type {
  NpcNavGraph,
  NpcNavNode,
  NpcNavNodeKind,
  NpcSeatSpot,
  NpcWaitSpot,
} from '../types/npc';

interface RawNavNode {
  id: string;
  x: number;
  y?: number;
  z: number;
  kind: NpcNavNodeKind;
  zoneTag: string;
}

function buildNavGraph(
  id: string,
  rawNodes: RawNavNode[],
  edges: ReadonlyArray<readonly [string, string]>,
  seats: NpcSeatSpot[],
  waitSpots: NpcWaitSpot[],
  defaultY = 0.04
): NpcNavGraph {
  const nodes: Record<string, NpcNavNode> = {};
  for (const raw of rawNodes) {
    nodes[raw.id] = {
      id: raw.id,
      x: raw.x,
      y: raw.y ?? defaultY,
      z: raw.z,
      kind: raw.kind,
      zoneTag: raw.zoneTag,
      neighbors: [],
    };
  }

  for (const [aId, bId] of edges) {
    const a = nodes[aId];
    const b = nodes[bId];
    if (!a || !b) {
      throw new Error(`Invalid nav edge [${aId}, ${bId}] in graph ${id}`);
    }
    if (!a.neighbors.includes(bId)) a.neighbors.push(bId);
    if (!b.neighbors.includes(aId)) b.neighbors.push(aId);
  }

  return { id, nodes, seats, waitSpots };
}

// ============================================================================
// EXTERIOR CAMPUS NAVIGATION GRAPH
// Sidewalks, crosswalks, plazas, building approaches & athletics walkways
// ============================================================================
const EXTERIOR_NODES: RawNavNode[] = [
  // 1. Main Entrance & Pedestrian Gate (Z: 103..125)
  { id: 'ped-gate-south', x: 18.4, y: 0.04, z: 123.5, kind: 'entrance', zoneTag: 'main-gate' },
  { id: 'ped-gate-mid', x: 18.4, y: 0.26, z: 114.0, kind: 'entrance', zoneTag: 'main-gate' },
  { id: 'ped-gate-north', x: 18.4, y: 0.04, z: 105.5, kind: 'entrance', zoneTag: 'main-gate' },
  { id: 'gate-east-sw-south', x: 10.4, y: 0.04, z: 122.0, kind: 'sidewalk', zoneTag: 'main-gate' },
  { id: 'gate-east-sw-arch', x: 10.4, y: 0.04, z: 114.0, kind: 'entrance', zoneTag: 'main-gate' },
  { id: 'gate-west-sw-south', x: -10.4, y: 0.04, z: 122.0, kind: 'sidewalk', zoneTag: 'main-gate' },
  { id: 'gate-west-sw-arch', x: -10.4, y: 0.04, z: 114.0, kind: 'entrance', zoneTag: 'main-gate' },

  // 2. Main Avenue East Sidewalk (X ≈ 11.8..13.5, jogging past lamps/benches/sign)
  { id: 'ave-e-104', x: 11.85, y: 0.056, z: 104.0, kind: 'sidewalk', zoneTag: 'campus-boulevard' },
  { id: 'ave-e-90', x: 11.85, y: 0.056, z: 90.0, kind: 'sidewalk', zoneTag: 'campus-boulevard' },
  { id: 'ave-e-81', x: 11.85, y: 0.056, z: 81.0, kind: 'sidewalk', zoneTag: 'campus-boulevard' },
  { id: 'ave-e-75', x: 11.95, y: 0.056, z: 75.5, kind: 'sidewalk', zoneTag: 'campus-boulevard' },
  { id: 'ave-e-71-out', x: 13.5, y: 0.04, z: 71.7, kind: 'sidewalk', zoneTag: 'campus-boulevard' },
  { id: 'ave-e-66', x: 11.85, y: 0.056, z: 66.0, kind: 'crosswalk', zoneTag: 'campus-boulevard' },
  { id: 'ave-e-55-out', x: 13.5, y: 0.04, z: 55.0, kind: 'sidewalk', zoneTag: 'campus-boulevard' },
  { id: 'ave-e-44', x: 11.85, y: 0.056, z: 44.0, kind: 'sidewalk', zoneTag: 'campus-boulevard' },
  { id: 'ave-e-36-out', x: 13.5, y: 0.04, z: 35.7, kind: 'sidewalk', zoneTag: 'campus-boulevard' },
  { id: 'ave-e-25', x: 11.85, y: 0.056, z: 25.0, kind: 'sidewalk', zoneTag: 'campus-boulevard' },

  // 3. Main Avenue West Sidewalk (X ≈ -11.85..-13.5)
  { id: 'ave-w-104', x: -11.85, y: 0.056, z: 104.0, kind: 'sidewalk', zoneTag: 'campus-boulevard' },
  { id: 'ave-w-90', x: -11.85, y: 0.056, z: 90.0, kind: 'sidewalk', zoneTag: 'campus-boulevard' },
  { id: 'ave-w-82', x: -11.85, y: 0.056, z: 82.0, kind: 'sidewalk', zoneTag: 'campus-boulevard' },
  { id: 'ave-w-66', x: -11.85, y: 0.056, z: 66.0, kind: 'crosswalk', zoneTag: 'campus-boulevard' },
  { id: 'ave-w-58-out', x: -13.5, y: 0.04, z: 57.7, kind: 'sidewalk', zoneTag: 'campus-boulevard' },
  { id: 'ave-w-43', x: -11.85, y: 0.056, z: 43.0, kind: 'sidewalk', zoneTag: 'campus-boulevard' },
  { id: 'ave-w-25', x: -11.85, y: 0.056, z: 25.0, kind: 'sidewalk', zoneTag: 'campus-boulevard' },

  // Zebra Crosswalk across Dual Carriageway (Z = 66)
  { id: 'cross-66-w', x: -5.7, y: 0.042, z: 66.0, kind: 'crosswalk', zoneTag: 'campus-boulevard' },
  { id: 'cross-66-mid', x: 0.0, y: 0.042, z: 66.0, kind: 'crosswalk', zoneTag: 'campus-boulevard' },
  { id: 'cross-66-e', x: 5.7, y: 0.042, z: 66.0, kind: 'crosswalk', zoneTag: 'campus-boulevard' },

  // 4. Security Building & University Hall Surroundings (+X, Z: 80..108)
  { id: 'sec-west', x: 19.8, y: 0.04, z: 96.0, kind: 'plaza', zoneTag: 'security-building' },
  { id: 'uhall-plaza-w', x: 37.5, y: 0.04, z: 105.0, kind: 'plaza', zoneTag: 'university-hall' },
  { id: 'uhall-front', x: 54.0, y: 0.04, z: 106.5, kind: 'entrance', zoneTag: 'university-hall' },
  { id: 'uhall-plaza-e', x: 67.5, y: 0.04, z: 104.5, kind: 'plaza', zoneTag: 'university-hall' },
  { id: 'uhall-west-corner', x: 38.5, y: 0.04, z: 86.0, kind: 'plaza', zoneTag: 'university-hall' },
  { id: 'uhall-east-corner', x: 68.5, y: 0.04, z: 84.5, kind: 'plaza', zoneTag: 'university-hall' },
  { id: 'east-spur-mid', x: 34.0, y: 0.04, z: 81.0, kind: 'sidewalk', zoneTag: 'university-hall' },
  { id: 'east-spur-e', x: 54.0, y: 0.04, z: 84.5, kind: 'plaza', zoneTag: 'university-hall' },

  // 5. Basketball Court & Administrative Block Forecourt (-X, Z: 30..92)
  { id: 'bball-east', x: -29.5, y: 0.04, z: 82.0, kind: 'plaza', zoneTag: 'basketball-court' },
  { id: 'bball-west-mid', x: -54.8, y: 0.04, z: 82.0, kind: 'plaza', zoneTag: 'basketball-court' },
  { id: 'bball-north-path', x: -32.0, y: 0.04, z: 66.0, kind: 'plaza', zoneTag: 'basketball-court' },
  { id: 'admin-forecourt-e', x: -19.5, y: 0.04, z: 43.0, kind: 'plaza', zoneTag: 'administrative-block' },
  { id: 'admin-forecourt-mid', x: -34.0, y: 0.04, z: 43.0, kind: 'plaza', zoneTag: 'administrative-block' },
  { id: 'admin-front', x: -40.5, y: 0.04, z: 43.0, kind: 'entrance', zoneTag: 'administrative-block' },

  // 6. Flag Roundabout Outer Sidewalk Perimeter (r ≈ 18.8 around (0, 6), clear of lamps at ±17.6, 6)
  { id: 'rb-se', x: 13.2, y: 0.04, z: 19.0, kind: 'sidewalk', zoneTag: 'roundabout' },
  { id: 'rb-e-s', x: 18.8, y: 0.04, z: 11.8, kind: 'sidewalk', zoneTag: 'roundabout' },
  { id: 'rb-e-n', x: 18.8, y: 0.04, z: 0.2, kind: 'sidewalk', zoneTag: 'roundabout' },
  { id: 'rb-ne', x: 13.2, y: 0.04, z: -7.2, kind: 'sidewalk', zoneTag: 'roundabout' },
  { id: 'rb-nw', x: -13.2, y: 0.04, z: -7.2, kind: 'sidewalk', zoneTag: 'roundabout' },
  { id: 'rb-w-n', x: -18.8, y: 0.04, z: 0.2, kind: 'sidewalk', zoneTag: 'roundabout' },
  { id: 'rb-w-s', x: -18.8, y: 0.04, z: 11.8, kind: 'sidewalk', zoneTag: 'roundabout' },
  { id: 'rb-sw', x: -13.2, y: 0.04, z: 19.0, kind: 'sidewalk', zoneTag: 'roundabout' },

  // 7. Academic Forecourt Plaza & Portal Approach (Z: -32..-11)
  { id: 'acad-fc-w', x: -19.3, y: 0.04, z: -23.5, kind: 'plaza', zoneTag: 'academic-building' },
  { id: 'acad-fc-center-s', x: 0.0, y: 0.04, z: -13.2, kind: 'plaza', zoneTag: 'academic-building' },
  { id: 'acad-fc-front', x: 0.0, y: 0.04, z: -29.8, kind: 'entrance', zoneTag: 'academic-building' },
  { id: 'acad-fc-e', x: 19.3, y: 0.04, z: -23.5, kind: 'plaza', zoneTag: 'academic-building' },
  { id: 'acad-park-court', x: 34.5, y: 0.04, z: -21.0, kind: 'plaza', zoneTag: 'academic-building' },

  // 8. East Arterial & East Loop Road (+X Side)
  { id: 'east-art-1', x: 28.0, y: 0.056, z: 11.8, kind: 'sidewalk', zoneTag: 'campus-grounds' },
  { id: 'east-art-2', x: 42.0, y: 0.056, z: 11.8, kind: 'sidewalk', zoneTag: 'campus-grounds' },
  { id: 'east-loop-s', x: 52.0, y: 0.056, z: -10.0, kind: 'sidewalk', zoneTag: 'campus-grounds' },
  { id: 'east-loop-mid', x: 51.0, y: 0.056, z: -45.0, kind: 'sidewalk', zoneTag: 'campus-grounds' },
  { id: 'east-loop-n', x: 51.0, y: 0.056, z: -102.0, kind: 'sidewalk', zoneTag: 'campus-grounds' },

  // 9. West Arterial, Campus Clinic & Smooth Left Bend Sidewalk (Z: 0..16)
  { id: 'west-art-n-1', x: -27.5, y: 0.056, z: 0.2, kind: 'sidewalk', zoneTag: 'clinic' },
  { id: 'west-art-s-1', x: -27.5, y: 0.056, z: 11.8, kind: 'sidewalk', zoneTag: 'clinic' },
  { id: 'clinic-front', x: -39.5, y: 0.04, z: 13.8, kind: 'entrance', zoneTag: 'clinic' },
  { id: 'west-art-n-2', x: -46.0, y: 0.056, z: 0.2, kind: 'sidewalk', zoneTag: 'clinic' },
  { id: 'west-bend-e1', x: -51.0, y: 0.056, z: -1.6, kind: 'sidewalk', zoneTag: 'campus-boulevard' },
  { id: 'west-bend-e2', x: -54.2, y: 0.056, z: -4.0, kind: 'sidewalk', zoneTag: 'campus-boulevard' },

  // 10. Continued Northern Road East Sidewalk (X ≈ -58.0, clearing lamps at -58.45 and palm at -56.5,-38)
  { id: 'cont-e-10', x: -57.8, y: 0.056, z: -10.0, kind: 'sidewalk', zoneTag: 'campus-grounds' },
  { id: 'cont-e-30', x: -57.6, y: 0.056, z: -30.0, kind: 'sidewalk', zoneTag: 'cafeteria' },
  { id: 'cont-e-47', x: -57.6, y: 0.056, z: -47.0, kind: 'sidewalk', zoneTag: 'cafeteria' },
  { id: 'cont-e-60', x: -57.6, y: 0.056, z: -60.0, kind: 'sidewalk', zoneTag: 'workshops' },
  { id: 'cont-e-80', x: -57.6, y: 0.056, z: -80.0, kind: 'sidewalk', zoneTag: 'workshops' },
  { id: 'cont-e-92', x: -57.6, y: 0.056, z: -91.8, kind: 'sidewalk', zoneTag: 'workshops' },
  { id: 'cont-e-105', x: -57.6, y: 0.056, z: -105.0, kind: 'sidewalk', zoneTag: 'campus-grounds' },

  // Continued Northern Road West Sidewalk (X ≈ -70.6, clearing lamps at -69.55 and Cafeteria/Volleyball)
  { id: 'cont-w-22', x: -69.8, y: 0.056, z: -26.0, kind: 'sidewalk', zoneTag: 'cafeteria' },
  { id: 'buka-front', x: -71.2, y: 0.04, z: -33.0, kind: 'plaza', zoneTag: 'cafeteria' },
  { id: 'caf-front', x: -71.2, y: 0.04, z: -47.0, kind: 'entrance', zoneTag: 'cafeteria' },
  { id: 'caf-plaza-n', x: -71.2, y: 0.04, z: -57.5, kind: 'plaza', zoneTag: 'cafeteria' },
  { id: 'muster-plaza', x: -74.5, y: 0.04, z: -66.0, kind: 'plaza', zoneTag: 'volleyball' },
  { id: 'vball-sideline', x: -74.5, y: 0.04, z: -76.0, kind: 'plaza', zoneTag: 'volleyball' },
  { id: 'cont-w-95', x: -70.4, y: 0.056, z: -95.0, kind: 'sidewalk', zoneTag: 'volleyball' },
  { id: 'cont-w-111', x: -70.4, y: 0.056, z: -111.0, kind: 'sidewalk', zoneTag: 'campus-grounds' },

  // 11. Engineering Workshops Approach & Covered Rear Passage
  { id: 'ws-bay-1', x: -49.2, y: 0.04, z: -59.4, kind: 'entrance', zoneTag: 'workshops' },
  { id: 'ws-bay-3', x: -49.2, y: 0.04, z: -73.0, kind: 'entrance', zoneTag: 'workshops' },
  { id: 'ws-corner-nw', x: -49.2, y: 0.04, z: -91.8, kind: 'sidewalk', zoneTag: 'workshops' },
  { id: 'ws-rear-passage', x: -21.0, y: 0.04, z: -92.0, kind: 'entrance', zoneTag: 'workshops' },

  // 12. North Cross-Road & Upper Campus (Football Field, 100L Hostel, Senior Hostel)
  { id: 'cross-n-w', x: -57.6, y: 0.056, z: -111.5, kind: 'sidewalk', zoneTag: 'football-field' },
  { id: 'cross-n-mid', x: -25.0, y: 0.056, z: -111.5, kind: 'sidewalk', zoneTag: 'football-field' },
  { id: 'cross-n-e', x: 25.0, y: 0.056, z: -111.5, kind: 'sidewalk', zoneTag: 'campus-grounds' },
  { id: 'fb-sw-entry', x: -47.2, y: 0.04, z: -122.5, kind: 'sidewalk', zoneTag: 'football-field' },
  { id: 'fb-bleacher-front', x: -47.2, y: 0.04, z: -147.0, kind: 'plaza', zoneTag: 'football-field' },
  { id: 'fb-nw-exit', x: -47.2, y: 0.04, z: -161.0, kind: 'sidewalk', zoneTag: 'football-field' },
  { id: 'h100-walk-s', x: -72.8, y: 0.04, z: -123.5, kind: 'sidewalk', zoneTag: 'hostel-100l' },
  { id: 'h100-front', x: -72.8, y: 0.04, z: -140.0, kind: 'entrance', zoneTag: 'hostel-100l' },
  { id: 'h100-walk-n', x: -72.8, y: 0.04, z: -155.0, kind: 'sidewalk', zoneTag: 'hostel-100l' },
  { id: 'cont-e-124', x: -57.6, y: 0.056, z: -124.0, kind: 'sidewalk', zoneTag: 'hostel-100l' },
  { id: 'cont-e-148', x: -57.6, y: 0.056, z: -148.0, kind: 'sidewalk', zoneTag: 'football-field' },
  { id: 'cont-e-165', x: -57.6, y: 0.056, z: -165.0, kind: 'sidewalk', zoneTag: 'hostel-senior' },
  { id: 'cds-east', x: -52.8, y: 0.04, z: -176.0, kind: 'sidewalk', zoneTag: 'hostel-senior' },
  { id: 'hsen-front', x: -64.0, y: 0.04, z: -185.5, kind: 'entrance', zoneTag: 'hostel-senior' },
];

const EXTERIOR_EDGES: ReadonlyArray<readonly [string, string]> = [
  // Pedestrian gate & main gate to sidewalks + plaza
  ['ped-gate-south', 'ped-gate-mid'],
  ['ped-gate-mid', 'ped-gate-north'],
  ['ped-gate-north', 'sec-west'],
  ['ped-gate-north', 'ave-e-104'],
  ['ped-gate-south', 'gate-east-sw-south'],
  ['gate-east-sw-south', 'gate-east-sw-arch'],
  ['gate-east-sw-arch', 'ave-e-104'],
  ['gate-west-sw-south', 'gate-west-sw-arch'],
  ['gate-west-sw-arch', 'ave-w-104'],
  ['gate-east-sw-south', 'gate-west-sw-south'],

  // East main avenue sidewalk
  ['ave-e-104', 'ave-e-90'],
  ['ave-e-90', 'ave-e-81'],
  ['ave-e-81', 'ave-e-75'],
  ['ave-e-75', 'ave-e-71-out'],
  ['ave-e-71-out', 'ave-e-66'],
  ['ave-e-66', 'ave-e-55-out'],
  ['ave-e-55-out', 'ave-e-44'],
  ['ave-e-44', 'ave-e-36-out'],
  ['ave-e-36-out', 'ave-e-25'],

  // West main avenue sidewalk
  ['ave-w-104', 'ave-w-90'],
  ['ave-w-90', 'ave-w-82'],
  ['ave-w-82', 'ave-w-66'],
  ['ave-w-66', 'ave-w-58-out'],
  ['ave-w-58-out', 'ave-w-43'],
  ['ave-w-43', 'ave-w-25'],

  // Crosswalk at Z=66
  ['ave-w-66', 'cross-66-w'],
  ['cross-66-w', 'cross-66-mid'],
  ['cross-66-mid', 'cross-66-e'],
  ['cross-66-e', 'ave-e-66'],

  // University Hall & Security Plaza (routed cleanly around building perimeter)
  ['ped-gate-north', 'uhall-plaza-w'],
  ['sec-west', 'ave-e-90'],
  ['uhall-plaza-w', 'uhall-front'],
  ['uhall-front', 'uhall-plaza-e'],
  ['uhall-plaza-w', 'uhall-west-corner'],
  ['uhall-west-corner', 'east-spur-mid'],
  ['ave-e-81', 'east-spur-mid'],
  ['east-spur-mid', 'east-spur-e'],
  ['east-spur-e', 'uhall-east-corner'],
  ['uhall-east-corner', 'uhall-plaza-e'],

  // Basketball & Admin Block
  ['ave-w-82', 'bball-east'],
  ['bball-east', 'bball-north-path'],
  ['bball-north-path', 'bball-west-mid'],
  ['bball-north-path', 'ave-w-66'],
  ['ave-w-43', 'admin-forecourt-e'],
  ['admin-forecourt-e', 'admin-forecourt-mid'],
  ['admin-forecourt-mid', 'admin-front'],

  // Roundabout Perimeter Ring
  ['ave-e-25', 'rb-se'],
  ['rb-se', 'rb-e-s'],
  ['rb-e-s', 'rb-e-n'],
  ['rb-e-n', 'rb-ne'],
  ['rb-ne', 'rb-nw'],
  ['rb-nw', 'rb-w-n'],
  ['rb-w-n', 'rb-w-s'],
  ['rb-w-s', 'rb-sw'],
  ['rb-sw', 'ave-w-25'],
  ['rb-sw', 'rb-se'],

  // Academic Forecourt & Parking Court
  ['rb-nw', 'acad-fc-center-s'],
  ['rb-ne', 'acad-fc-center-s'],
  ['acad-fc-center-s', 'acad-fc-front'],
  ['acad-fc-w', 'acad-fc-front'],
  ['acad-fc-front', 'acad-fc-e'],
  ['rb-nw', 'acad-fc-w'],
  ['rb-ne', 'acad-fc-e'],
  ['acad-fc-e', 'acad-park-court'],

  // East Arterial & Loop
  ['rb-e-s', 'east-art-1'],
  ['east-art-1', 'east-art-2'],
  ['east-art-2', 'east-loop-s'],
  ['east-loop-s', 'east-loop-mid'],
  ['east-loop-mid', 'east-loop-n'],
  ['east-loop-n', 'cross-n-e'],

  // West Arterial, Clinic & Curve
  ['rb-w-n', 'west-art-n-1'],
  ['rb-w-s', 'west-art-s-1'],
  ['west-art-s-1', 'clinic-front'],
  ['west-art-n-1', 'west-art-n-2'],
  ['west-art-n-2', 'clinic-front'],
  ['west-art-n-2', 'west-bend-e1'],
  ['west-bend-e1', 'west-bend-e2'],
  ['west-bend-e2', 'cont-e-10'],

  // Continued Road East Sidewalk
  ['cont-e-10', 'cont-e-30'],
  ['cont-e-30', 'cont-e-47'],
  ['cont-e-47', 'cont-e-60'],
  ['cont-e-60', 'cont-e-80'],
  ['cont-e-80', 'cont-e-92'],
  ['cont-e-92', 'cont-e-105'],
  ['cont-e-105', 'cross-n-w'],

  // Continued Road West Sidewalk, Cafeteria, Buka, Volleyball, Muster
  ['cont-e-30', 'cont-w-22'],
  ['cont-w-22', 'buka-front'],
  ['buka-front', 'caf-front'],
  ['cont-e-47', 'caf-front'],
  ['caf-front', 'caf-plaza-n'],
  ['caf-plaza-n', 'cont-e-60'],
  ['caf-plaza-n', 'muster-plaza'],
  ['muster-plaza', 'vball-sideline'],
  ['vball-sideline', 'cont-w-95'],
  ['cont-w-95', 'cont-w-111'],
  ['cont-w-111', 'cross-n-w'],

  // Engineering Workshops & Rear Passage
  ['cont-e-60', 'ws-bay-1'],
  ['ws-bay-1', 'ws-bay-3'],
  ['ws-bay-3', 'ws-corner-nw'],
  ['ws-corner-nw', 'ws-rear-passage'],
  ['ws-corner-nw', 'cont-e-92'],

  // Upper Campus: Cross-Road, Football, 100L Hostel, Senior Hostel
  ['cross-n-w', 'cross-n-mid'],
  ['cross-n-mid', 'cross-n-e'],
  ['cross-n-w', 'cont-e-124'],
  ['cross-n-w', 'h100-walk-s'],
  ['h100-walk-s', 'h100-front'],
  ['h100-front', 'h100-walk-n'],
  ['h100-walk-n', 'cont-e-165'],
  ['cross-n-mid', 'fb-sw-entry'],
  ['cont-e-124', 'fb-sw-entry'],
  ['fb-sw-entry', 'fb-bleacher-front'],
  ['fb-bleacher-front', 'fb-nw-exit'],
  ['fb-nw-exit', 'cont-e-165'],
  ['cont-e-124', 'cont-e-148'],
  ['cont-e-148', 'cont-e-165'],
  ['cont-e-165', 'cds-east'],
  ['cds-east', 'hsen-front'],
];

const EXTERIOR_SEATS: NpcSeatSpot[] = [
  {
    id: 'seat-ave-west-1',
    label: 'Avenue West Bench',
    x: -11.76,
    y: 0.04,
    z: 57.7,
    seatSurfaceY: 0.49,
    yaw: Math.PI / 2,
    nearbyNodeId: 'ave-w-58-out',
    zoneTag: 'campus-boulevard',
    benchColliderId: 'bench-west-1',
  },
  {
    id: 'seat-ave-east-1',
    label: 'Avenue East South Bench',
    x: 11.76,
    y: 0.04,
    z: 71.7,
    seatSurfaceY: 0.49,
    yaw: -Math.PI / 2,
    nearbyNodeId: 'ave-e-71-out',
    zoneTag: 'campus-boulevard',
    benchColliderId: 'bench-east-2',
  },
  {
    id: 'seat-ave-east-2',
    label: 'Avenue East North Bench',
    x: 11.76,
    y: 0.04,
    z: 35.7,
    seatSurfaceY: 0.49,
    yaw: -Math.PI / 2,
    nearbyNodeId: 'ave-e-36-out',
    zoneTag: 'campus-boulevard',
    benchColliderId: 'bench-east-1',
  },
  {
    id: 'seat-acad-forecourt-w',
    label: 'Academic Forecourt West Bench',
    x: -19.3,
    y: 0.04,
    z: -26.96,
    seatSurfaceY: 0.49,
    yaw: 0,
    nearbyNodeId: 'acad-fc-w',
    zoneTag: 'academic-building',
    benchColliderId: 'bench-forecourt-w',
  },
  {
    id: 'seat-acad-forecourt-e',
    label: 'Academic Forecourt East Bench',
    x: 19.3,
    y: 0.04,
    z: -26.96,
    seatSurfaceY: 0.49,
    yaw: 0,
    nearbyNodeId: 'acad-fc-e',
    zoneTag: 'academic-building',
    benchColliderId: 'bench-forecourt-e',
  },
  {
    id: 'seat-bball-bench-1',
    label: 'Basketball Court Bench',
    x: -56.49,
    y: 0.04,
    z: 77.8,
    seatSurfaceY: 0.49,
    yaw: Math.PI / 2,
    nearbyNodeId: 'bball-west-mid',
    zoneTag: 'basketball-court',
    benchColliderId: 'basketball-bench-west-1',
  },
  {
    id: 'seat-bball-bench-2',
    label: 'Basketball Court South Bench',
    x: -56.49,
    y: 0.04,
    z: 86.2,
    seatSurfaceY: 0.49,
    yaw: Math.PI / 2,
    nearbyNodeId: 'bball-west-mid',
    zoneTag: 'basketball-court',
    benchColliderId: 'basketball-bench-west-2',
  },
  {
    id: 'seat-football-bleacher-1',
    label: 'Football Pitch Bleacher',
    x: -50.35,
    y: 0.7,
    z: -145.5,
    seatSurfaceY: 1.125,
    yaw: -Math.PI / 2,
    nearbyNodeId: 'fb-bleacher-front',
    zoneTag: 'football-field',
    benchColliderId: 'football-bleacher-west',
  },
];

const EXTERIOR_WAIT_SPOTS: NpcWaitSpot[] = [
  {
    id: 'wait-ped-gate',
    label: 'Pedestrian Gate Concourse',
    x: 17.8,
    y: 0.04,
    z: 105.6,
    yaw: Math.PI * 0.85,
    nearbyNodeId: 'ped-gate-north',
    zoneTag: 'main-gate',
    partnerX: 19.1,
    partnerZ: 105.9,
    partnerYaw: -Math.PI * 0.15,
  },
  {
    id: 'wait-uhall-plaza',
    label: 'University Hall Forecourt',
    x: 50.8,
    y: 0.04,
    z: 107.0,
    yaw: -Math.PI * 0.45,
    nearbyNodeId: 'uhall-front',
    zoneTag: 'university-hall',
    partnerX: 52.1,
    partnerZ: 107.2,
    partnerYaw: Math.PI * 0.55,
  },
  {
    id: 'wait-acad-forecourt',
    label: 'Academic Plaza Pair',
    x: -6.4,
    y: 0.04,
    z: -27.4,
    yaw: -Math.PI / 2,
    nearbyNodeId: 'acad-fc-front',
    zoneTag: 'academic-building',
    partnerX: -5.1,
    partnerZ: -27.4,
    partnerYaw: Math.PI / 2,
  },
  {
    id: 'wait-cafeteria-buka',
    label: 'Cafeteria & Buka Plaza',
    x: -70.6,
    y: 0.04,
    z: -39.5,
    yaw: Math.PI * 0.9,
    nearbyNodeId: 'caf-front',
    zoneTag: 'cafeteria',
    partnerX: -70.4,
    partnerZ: -40.8,
    partnerYaw: -Math.PI * 0.1,
  },
  {
    id: 'wait-hostel-100l',
    label: '100L Hostel Courtyard',
    x: -72.8,
    y: 0.04,
    z: -136.5,
    yaw: Math.PI * 0.85,
    nearbyNodeId: 'h100-front',
    zoneTag: 'hostel-100l',
    partnerX: -72.2,
    partnerZ: -137.8,
    partnerYaw: -Math.PI * 0.15,
  },
  {
    id: 'wait-hostel-senior',
    label: 'Senior Male Hostel Forecourt',
    x: -60.2,
    y: 0.04,
    z: -185.0,
    yaw: Math.PI * 0.45,
    nearbyNodeId: 'hsen-front',
    zoneTag: 'hostel-senior',
    partnerX: -61.5,
    partnerZ: -185.0,
    partnerYaw: -Math.PI * 0.55,
  },
  {
    id: 'wait-bball-court',
    label: 'Basketball Sideline',
    x: -31.0,
    y: 0.04,
    z: 80.5,
    yaw: Math.PI / 2,
    nearbyNodeId: 'bball-east',
    zoneTag: 'basketball-court',
  },
  {
    id: 'wait-muster-square',
    label: 'Muster Square & Volleyball',
    x: -74.5,
    y: 0.04,
    z: -68.5,
    yaw: Math.PI / 2,
    nearbyNodeId: 'muster-plaza',
    zoneTag: 'volleyball',
  },
];

export const CAMPUS_EXTERIOR_NAV_GRAPH = buildNavGraph(
  'exterior',
  EXTERIOR_NODES,
  EXTERIOR_EDGES,
  EXTERIOR_SEATS,
  EXTERIOR_WAIT_SPOTS,
  0.04
);

// ============================================================================
// INTERIOR NAVIGATION GRAPHS (Select Major Buildings)
// ============================================================================
const ACADEMIC_INTERIOR_GRAPH = buildNavGraph(
  'academic-building',
  [
    { id: 'acad-in-lobby-s', x: -2.4, y: 0, z: 24.5, kind: 'interior', zoneTag: 'reception' },
    { id: 'acad-in-lobby-w', x: -5.4, y: 0, z: 24.4, kind: 'interior', zoneTag: 'reception' },
    { id: 'acad-in-lobby-sw', x: -10.5, y: 0, z: 24.4, kind: 'interior', zoneTag: 'reception' },
    { id: 'acad-in-lobby-e', x: 5.4, y: 0, z: 24.4, kind: 'interior', zoneTag: 'reception' },
    { id: 'acad-in-ws-corner', x: -20.5, y: 0, z: 24.4, kind: 'interior', zoneTag: 'workshop-corridor' },
    { id: 'acad-in-ws-mid', x: -20.5, y: 0, z: 4.0, kind: 'interior', zoneTag: 'workshop-corridor' },
    { id: 'acad-in-ws-rear', x: -20.5, y: 0, z: -22.5, kind: 'interior', zoneTag: 'workshop-corridor' },
    { id: 'acad-in-east-entry-w', x: 11.0, y: 0, z: 24.4, kind: 'interior', zoneTag: 'east-hallway' },
    { id: 'acad-in-east-entry-n', x: 11.4, y: 0, z: 17.2, kind: 'interior', zoneTag: 'east-hallway' },
    { id: 'acad-in-east-hall-s', x: 20.8, y: 0, z: 17.2, kind: 'interior', zoneTag: 'east-hallway' },
    { id: 'acad-in-east-hall-dean', x: 20.8, y: 0, z: 12.0, kind: 'interior', zoneTag: 'east-hallway' },
    { id: 'acad-in-east-hall-mid', x: 20.8, y: 0, z: -1.0, kind: 'interior', zoneTag: 'east-hallway' },
    { id: 'acad-in-east-hall-n', x: 20.8, y: 0, z: -19.5, kind: 'interior', zoneTag: 'east-hallway' },
    { id: 'acad-in-cy-bridge-w', x: 14.2, y: 0, z: -1.0, kind: 'interior', zoneTag: 'courtyard-walkway' },
    { id: 'acad-in-cy-se', x: 14.2, y: 0, z: 11.5, kind: 'interior', zoneTag: 'courtyard-walkway' },
    { id: 'acad-in-cy-s', x: 0.0, y: 0, z: 11.5, kind: 'interior', zoneTag: 'courtyard-walkway' },
    { id: 'acad-in-cy-sw', x: -14.5, y: 0, z: 11.5, kind: 'interior', zoneTag: 'courtyard-walkway' },
    { id: 'acad-in-cy-w', x: -14.5, y: 0, z: -1.0, kind: 'interior', zoneTag: 'courtyard-walkway' },
    { id: 'acad-in-cy-nw', x: -14.5, y: 0, z: -13.0, kind: 'interior', zoneTag: 'courtyard-walkway' },
    { id: 'acad-in-cy-n', x: 0.0, y: 0, z: -13.0, kind: 'interior', zoneTag: 'courtyard-walkway' },
  ],
  [
    ['acad-in-lobby-s', 'acad-in-lobby-w'],
    ['acad-in-lobby-w', 'acad-in-lobby-sw'],
    ['acad-in-lobby-sw', 'acad-in-ws-corner'],
    ['acad-in-lobby-s', 'acad-in-lobby-e'],
    ['acad-in-ws-corner', 'acad-in-ws-mid'],
    ['acad-in-ws-mid', 'acad-in-ws-rear'],
    ['acad-in-ws-mid', 'acad-in-cy-w'],
    ['acad-in-lobby-e', 'acad-in-east-entry-w'],
    ['acad-in-east-entry-w', 'acad-in-east-entry-n'],
    ['acad-in-east-entry-n', 'acad-in-east-hall-s'],
    ['acad-in-east-hall-s', 'acad-in-east-hall-dean'],
    ['acad-in-east-hall-dean', 'acad-in-east-hall-mid'],
    ['acad-in-east-hall-mid', 'acad-in-east-hall-n'],
    ['acad-in-east-hall-mid', 'acad-in-cy-bridge-w'],
    ['acad-in-cy-bridge-w', 'acad-in-cy-se'],
    ['acad-in-cy-se', 'acad-in-cy-s'],
    ['acad-in-cy-s', 'acad-in-cy-sw'],
    ['acad-in-cy-sw', 'acad-in-cy-w'],
    ['acad-in-cy-w', 'acad-in-cy-nw'],
    ['acad-in-cy-nw', 'acad-in-cy-n'],
    ['acad-in-cy-nw', 'acad-in-ws-rear'],
  ],
  [
    {
      id: 'seat-acad-lobby-sofa-w',
      label: 'Reception Sofa West',
      x: -7.25,
      y: 0,
      z: 21.5,
      seatSurfaceY: 0.48,
      yaw: -Math.PI / 2,
      nearbyNodeId: 'acad-in-lobby-w',
      zoneTag: 'reception',
      benchColliderId: 'acad-f0-sw-col',
    },
    {
      id: 'seat-acad-lobby-sofa-e',
      label: 'Reception Sofa East',
      x: 7.25,
      y: 0,
      z: 21.5,
      seatSurfaceY: 0.48,
      yaw: Math.PI / 2,
      nearbyNodeId: 'acad-in-lobby-e',
      zoneTag: 'reception',
      benchColliderId: 'acad-f0-se-col',
    },
  ],
  [
    {
      id: 'wait-acad-lobby',
      label: 'Academic Reception Lounge',
      x: -2.0,
      y: 0,
      z: 21.0,
      yaw: -Math.PI * 0.45,
      nearbyNodeId: 'acad-in-lobby-s',
      zoneTag: 'reception',
      partnerX: -0.8,
      partnerZ: 21.1,
      partnerYaw: Math.PI * 0.55,
    },
  ],
  0.0
);

const CAFETERIA_INTERIOR_GRAPH = buildNavGraph(
  'cafeteria',
  [
    { id: 'caf-in-entry', x: -0.3, y: 0, z: 5.9, kind: 'interior', zoneTag: 'dining' },
    { id: 'caf-in-se', x: 6.4, y: 0, z: 5.9, kind: 'interior', zoneTag: 'dining' },
    { id: 'caf-in-aisle-w', x: -4.5, y: 0, z: 3.1, kind: 'interior', zoneTag: 'dining' },
    { id: 'caf-in-aisle-c', x: -0.2, y: 0, z: 3.1, kind: 'interior', zoneTag: 'dining' },
    { id: 'caf-in-aisle-e', x: 6.4, y: 0, z: 3.1, kind: 'interior', zoneTag: 'dining' },
    { id: 'caf-in-counter-w', x: -4.5, y: 0, z: -0.6, kind: 'interior', zoneTag: 'serving' },
    { id: 'caf-in-counter-c', x: 0.0, y: 0, z: -0.6, kind: 'interior', zoneTag: 'serving' },
    { id: 'caf-in-counter-e', x: 6.4, y: 0, z: -0.6, kind: 'interior', zoneTag: 'serving' },
  ],
  [
    ['caf-in-entry', 'caf-in-aisle-c'],
    ['caf-in-entry', 'caf-in-se'],
    ['caf-in-se', 'caf-in-aisle-e'],
    ['caf-in-aisle-w', 'caf-in-aisle-c'],
    ['caf-in-aisle-w', 'caf-in-counter-w'],
    ['caf-in-aisle-c', 'caf-in-counter-c'],
    ['caf-in-aisle-e', 'caf-in-counter-e'],
    ['caf-in-counter-w', 'caf-in-counter-c'],
    ['caf-in-counter-c', 'caf-in-counter-e'],
  ],
  [
    {
      id: 'seat-caf-table-0-s',
      label: 'Cafeteria Dining Seat',
      x: -2.88,
      y: 0,
      z: 1.86,
      seatSurfaceY: 0.465,
      yaw: 0,
      nearbyNodeId: 'caf-in-aisle-c',
      zoneTag: 'dining',
      benchColliderId: 'caf-tcol-1',
    },
    {
      id: 'seat-caf-table-2-n',
      label: 'Cafeteria Dining Seat East',
      x: 2.12,
      y: 0,
      z: 0.54,
      seatSurfaceY: 0.465,
      yaw: Math.PI,
      nearbyNodeId: 'caf-in-counter-c',
      zoneTag: 'dining',
      benchColliderId: 'caf-tcol-2',
    },
  ],
  [
    {
      id: 'wait-caf-counter',
      label: 'Cafeteria Serving Line',
      x: 1.2,
      y: 0,
      z: -1.1,
      yaw: 0,
      nearbyNodeId: 'caf-in-counter-c',
      zoneTag: 'serving',
    },
  ],
  0.0
);

const UNIVERSITY_HALL_INTERIOR_GRAPH = buildNavGraph(
  'university-hall',
  [
    { id: 'uh-in-foyer-c', x: 0.0, y: 0, z: 6.2, kind: 'interior', zoneTag: 'foyer' },
    { id: 'uh-in-foyer-e', x: 4.5, y: 0, z: 6.2, kind: 'interior', zoneTag: 'foyer' },
    { id: 'uh-in-aisle-s', x: 0.0, y: 0, z: 2.7, kind: 'interior', zoneTag: 'auditorium' },
    { id: 'uh-in-aisle-m', x: 0.0, y: 0, z: 0.5, kind: 'interior', zoneTag: 'auditorium' },
    { id: 'uh-in-aisle-n', x: 0.0, y: 0, z: -2.5, kind: 'interior', zoneTag: 'auditorium' },
    { id: 'uh-in-flank-e', x: 5.5, y: 0, z: 0.5, kind: 'interior', zoneTag: 'auditorium' },
  ],
  [
    ['uh-in-foyer-c', 'uh-in-foyer-e'],
    ['uh-in-foyer-c', 'uh-in-aisle-s'],
    ['uh-in-aisle-s', 'uh-in-aisle-m'],
    ['uh-in-aisle-m', 'uh-in-aisle-n'],
    ['uh-in-aisle-m', 'uh-in-flank-e'],
  ],
  [
    {
      id: 'seat-uhall-pew-w',
      label: 'Auditorium Row Seat West',
      x: -2.6,
      y: 0,
      z: 1.16,
      seatSurfaceY: 0.51,
      yaw: 0,
      nearbyNodeId: 'uh-in-aisle-m',
      zoneTag: 'auditorium',
      benchColliderId: 'uhall-pew-2-w2-col',
    },
    {
      id: 'seat-uhall-pew-e',
      label: 'Auditorium Row Seat East',
      x: 3.6,
      y: 0,
      z: -0.34,
      seatSurfaceY: 0.51,
      yaw: 0,
      nearbyNodeId: 'uh-in-aisle-m',
      zoneTag: 'auditorium',
      benchColliderId: 'uhall-pew-1-e1-col',
    },
  ],
  [
    {
      id: 'wait-uhall-foyer',
      label: 'University Hall Foyer',
      x: 3.6,
      y: 0,
      z: 6.2,
      yaw: -Math.PI / 2,
      nearbyNodeId: 'uh-in-foyer-e',
      zoneTag: 'foyer',
      partnerX: 4.9,
      partnerZ: 6.2,
      partnerYaw: Math.PI / 2,
    },
  ],
  0.0
);

const ADMINISTRATIVE_INTERIOR_GRAPH = buildNavGraph(
  'administrative-building',
  [
    { id: 'adm-in-lobby-c', x: 0.0, y: 0, z: 4.5, kind: 'interior', zoneTag: 'lobby' },
    { id: 'adm-in-lobby-w', x: -5.8, y: 0, z: 4.6, kind: 'interior', zoneTag: 'lobby' },
    { id: 'adm-in-lobby-e', x: 4.0, y: 0, z: 4.2, kind: 'interior', zoneTag: 'lobby' },
  ],
  [
    ['adm-in-lobby-w', 'adm-in-lobby-c'],
    ['adm-in-lobby-c', 'adm-in-lobby-e'],
  ],
  [
    {
      id: 'seat-adm-sofa-e',
      label: 'Admin Waiting Sofa',
      x: 4.0,
      y: 0,
      z: 6.1,
      seatSurfaceY: 0.48,
      yaw: 0,
      nearbyNodeId: 'adm-in-lobby-e',
      zoneTag: 'lobby',
      benchColliderId: 'adm-f0-sofa-ecol',
    },
  ],
  [
    {
      id: 'wait-adm-registry',
      label: 'Registry Inquiry Queue',
      x: -5.8,
      y: 0,
      z: 3.4,
      yaw: 0,
      nearbyNodeId: 'adm-in-lobby-w',
      zoneTag: 'lobby',
    },
  ],
  0.0
);

export const INTERIOR_NAV_GRAPHS: Readonly<Record<string, NpcNavGraph>> = {
  'academic-building': ACADEMIC_INTERIOR_GRAPH,
  cafeteria: CAFETERIA_INTERIOR_GRAPH,
  'university-hall': UNIVERSITY_HALL_INTERIOR_GRAPH,
  'administrative-building': ADMINISTRATIVE_INTERIOR_GRAPH,
};

export function getNavGraphForWorld(
  mode: 'exterior' | 'interior',
  buildingId?: string
): NpcNavGraph | null {
  if (mode === 'exterior') {
    return CAMPUS_EXTERIOR_NAV_GRAPH;
  }
  if (!buildingId) return null;
  return INTERIOR_NAV_GRAPHS[buildingId] ?? null;
}

/**
 * Shortest-path A* solver on any NpcNavGraph. Returns an ordered array of node IDs
 * from `fromId` to `toId` inclusive, or [] if unreachable.
 */
export function findNavPath(graph: NpcNavGraph, fromId: string, toId: string): string[] {
  const start = graph.nodes[fromId];
  const goal = graph.nodes[toId];
  if (!start || !goal) return [];
  if (fromId === toId) return [fromId];

  const open = new Set<string>([fromId]);
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>([[fromId, 0]]);
  const fScore = new Map<string, number>([
    [fromId, Math.hypot(goal.x - start.x, goal.z - start.z)],
  ]);

  while (open.size > 0) {
    let current = '';
    let bestF = Infinity;
    for (const id of open) {
      const f = fScore.get(id) ?? Infinity;
      if (f < bestF) {
        bestF = f;
        current = id;
      }
    }

    if (current === toId) {
      const path: string[] = [current];
      let cursor = current;
      while (cameFrom.has(cursor)) {
        cursor = cameFrom.get(cursor)!;
        path.push(cursor);
      }
      path.reverse();
      return path;
    }

    open.delete(current);
    const curNode = graph.nodes[current];
    if (!curNode) continue;

    for (const nextId of curNode.neighbors) {
      const nextNode = graph.nodes[nextId];
      if (!nextNode) continue;
      const stepCost = Math.hypot(nextNode.x - curNode.x, nextNode.z - curNode.z);
      const tentativeG = (gScore.get(current) ?? Infinity) + stepCost;
      if (tentativeG < (gScore.get(nextId) ?? Infinity)) {
        cameFrom.set(nextId, current);
        gScore.set(nextId, tentativeG);
        const h = Math.hypot(goal.x - nextNode.x, goal.z - nextNode.z);
        fScore.set(nextId, tentativeG + h);
        open.add(nextId);
      }
    }
  }

  return [];
}

export function findNearestNavNodeId(graph: NpcNavGraph, x: number, z: number): string | null {
  let bestId: string | null = null;
  let bestDistSq = Infinity;
  for (const node of Object.values(graph.nodes)) {
    const dx = node.x - x;
    const dz = node.z - z;
    const d2 = dx * dx + dz * dz;
    if (d2 < bestDistSq) {
      bestDistSq = d2;
      bestId = node.id;
    }
  }
  return bestId;
}
