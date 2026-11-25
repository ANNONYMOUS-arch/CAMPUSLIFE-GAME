import type { AabbCollider, CampusZone, StepSurface } from '../types/game';
import {
  APPROACH_ROAD_CENTER_X,
  CUL_DE_SAC_CENTER,
  DUAL_ROAD_OUTER_HALF_WIDTH,
  EAST_BEND_CONTROL_POINTS,
  ROUNDABOUT_CENTER,
  SECONDARY_ROAD_HALF_WIDTH,
  sampleCurveCenterline,
  sampleLeftBendCenterline,
} from './campusRoad';

export const CAMPUS_BOUNDS = {
  minX: -145,
  maxX: 135,
  minZ: -215,
  maxZ: 140,
} as const;

export const PLAYER_SPAWN = {
  x: 5.7,
  y: 0.04,
  z: 125,
  yaw: 0, // Faces -Z (North on East Carriageway through Main Gate toward Roundabout & Academic Building)
} as const;

export const CAMPUS_COLLIDERS: ReadonlyArray<AabbCollider> = [
  // =========================================================================
  // 1. ARCHED TWIN-PORTAL MAIN GATE, OPEN IRON GATES & PEDESTRIAN GATE (z = 114)
  // =========================================================================
  {
    id: 'gate-pillar-west',
    label: 'Main Gate West Pillar',
    minX: -15.8,
    maxX: -12.6,
    minY: 0,
    maxY: 9.2,
    minZ: 112.5,
    maxZ: 115.5,
  },
  {
    id: 'gate-pillar-center',
    label: 'Main Gate Median Pier',
    minX: -1.1,
    maxX: 1.1,
    minY: 0,
    maxY: 8.8,
    minZ: 112.5,
    maxZ: 115.5,
  },
  {
    id: 'gate-pillar-east',
    label: 'Main Gate East Pillar',
    minX: 12.6,
    maxX: 15.8,
    minY: 0,
    maxY: 9.2,
    minZ: 112.5,
    maxZ: 115.5,
  },
  {
    id: 'gate-iron-leaf-west-open',
    label: 'Open Iron Gate Leaf (West)',
    minX: -12.6,
    maxX: -12.1,
    minY: 0,
    maxY: 3.4,
    minZ: 110.8,
    maxZ: 113.8,
  },
  {
    id: 'gate-iron-leaf-east-open',
    label: 'Open Iron Gate Leaf (East)',
    minX: 12.1,
    maxX: 12.6,
    minY: 0,
    maxY: 3.4,
    minZ: 110.8,
    maxZ: 113.8,
  },
  {
    id: 'gate-pedestrian-pillar-east',
    label: 'Pedestrian Gate East Pillar',
    minX: 21.0,
    maxX: 23.4,
    minY: 0,
    maxY: 6.0,
    minZ: 112.7,
    maxZ: 115.3,
  },
  {
    id: 'gate-pedestrian-balcony-post',
    label: 'Pedestrian Gate Guard Balcony Deck',
    minX: 21.8,
    maxX: 25.4,
    minY: 0,
    maxY: 4.0,
    minZ: 109.5,
    maxZ: 113.6,
  },
  {
    id: 'fence-front-west',
    label: 'Campus Front Wall West',
    minX: -145,
    maxX: -15.8,
    minY: 0,
    maxY: 2.8,
    minZ: 113.6,
    maxZ: 114.4,
  },
  {
    id: 'fence-front-east',
    label: 'Campus Front Wall East',
    minX: 23.4,
    maxX: 135,
    minY: 0,
    maxY: 2.8,
    minZ: 113.6,
    maxZ: 114.4,
  },

  // =========================================================================
  // 2. DELAYED DUAL CARRIAGEWAY CENTRAL GRASS MEDIAN CURBS (starts Z=96 inside gate)
  // =========================================================================
  {
    id: 'median-curb-south',
    label: 'Avenue Central Median South',
    minX: -1.65,
    maxX: 1.65,
    minY: 0,
    maxY: 0.3,
    minZ: 68.5,
    maxZ: 96.0,
  },
  {
    id: 'median-curb-north',
    label: 'Avenue Central Median North',
    minX: -1.65,
    maxX: 1.65,
    minY: 0,
    maxY: 0.3,
    minZ: 24.5,
    maxZ: 63.5,
  },

  // =========================================================================
  // 3. MAIN ENTRANCE RIGHT SIDE (+X): 2-STOREY SECURITY BUILDING & UNIVERSITY HALL
  // =========================================================================
  {
    id: 'security-building',
    label: 'Campus Security Building (Ground & First Floor)',
    minX: 22.0,
    maxX: 34.0,
    minY: 0,
    maxY: 7.0,
    minZ: 90.0,
    maxZ: 100.0,
  },
  {
    id: 'university-hall',
    label: 'University Hall (Ground & First Floor)',
    minX: 42.0,
    maxX: 66.0,
    minY: 0,
    maxY: 7.2,
    minZ: 88.0,
    maxZ: 102.0,
  },

  // =========================================================================
  // 4. MAIN ENTRANCE LEFT SIDE (-X): BASKETBALL ARENA & 3-STOREY ADMIN BLOCK
  //    Shifted West to -44, 82 with wide open setback plaza
  // =========================================================================
  {
    id: 'basketball-hoop-north',
    label: 'Basketball Hoop Post',
    minX: -44.4,
    maxX: -43.6,
    minY: 0,
    maxY: 3.8,
    minZ: 72.3,
    maxZ: 73.1,
  },
  {
    id: 'basketball-hoop-south',
    label: 'Basketball Hoop Post',
    minX: -44.4,
    maxX: -43.6,
    minY: 0,
    maxY: 3.8,
    minZ: 90.9,
    maxZ: 91.7,
  },
  {
    id: 'basketball-bench-west-1',
    label: 'Basketball Court Bench',
    minX: -57.0,
    maxX: -56.1,
    minY: 0,
    maxY: 0.9,
    minZ: 76.5,
    maxZ: 79.1,
  },
  {
    id: 'basketball-bench-west-2',
    label: 'Basketball Court Bench',
    minX: -57.0,
    maxX: -56.1,
    minY: 0,
    maxY: 0.9,
    minZ: 84.9,
    maxZ: 87.5,
  },
  {
    id: 'administrative-building',
    label: 'Administrative Block (3 Storeys)',
    minX: -64.0,
    maxX: -44.0,
    minY: 0,
    maxY: 10.4,
    minZ: 34.0,
    maxZ: 52.0,
  },
  // Two White Coaster Buses parked side by side at Admin Forecourt
  {
    id: 'admin-coaster-bus-1',
    label: 'University Coaster Bus 1',
    minX: -36.2,
    maxX: -28.8,
    minY: 0,
    maxY: 2.9,
    minZ: 32.7,
    maxZ: 35.3,
  },
  {
    id: 'admin-coaster-bus-2',
    label: 'University Coaster Bus 2',
    minX: -36.2,
    maxX: -28.8,
    minY: 0,
    maxY: 2.9,
    minZ: 36.7,
    maxZ: 39.3,
  },
  // Ordinary Staff Cars in Admin Forecourt marked stalls
  {
    id: 'admin-staff-car-1',
    label: 'Admin Staff Car',
    minX: -25.3,
    maxX: -20.7,
    minY: 0,
    maxY: 1.6,
    minZ: 47.0,
    maxZ: 49.0,
  },
  {
    id: 'admin-staff-car-2',
    label: 'Admin Staff Car',
    minX: -25.3,
    maxX: -20.7,
    minY: 0,
    maxY: 1.6,
    minZ: 50.5,
    maxZ: 52.5,
  },
  {
    id: 'admin-staff-car-3',
    label: 'Admin Staff Car',
    minX: -25.3,
    maxX: -20.7,
    minY: 0,
    maxY: 1.6,
    minZ: 54.0,
    maxZ: 56.0,
  },
  {
    id: 'admin-staff-car-4',
    label: 'Admin Staff Car',
    minX: -34.8,
    maxX: -30.2,
    minY: 0,
    maxY: 1.6,
    minZ: 51.0,
    maxZ: 53.0,
  },

  // =========================================================================
  // 5. FLAG ROUNDABOUT (0, 6) DIRECTLY IN FRONT OF ACADEMIC BUILDING
  // =========================================================================
  {
    id: 'flag-roundabout-monument',
    label: 'Flag Roundabout Island',
    minX: -3.5,
    maxX: 3.5,
    minY: 0,
    maxY: 8.2,
    minZ: 2.5,
    maxZ: 9.5,
  },

  // =========================================================================
  // 6. FOUR-STOREY ACADEMIC BUILDING (68m x 56m) + TRACTOR-SIDE PARKING COURT
  //    Outer footprint: X: -34..+34, Z: -90..-34
  //    Open Courtyard Void: X: -11.5..+11.5, Z: -71..-54
  // =========================================================================
  {
    id: 'academic-building-west',
    label: 'Academic Building West Wing (4 Floors)',
    minX: -34.0,
    maxX: -11.5,
    minY: 0,
    maxY: 13.5,
    minZ: -90.0,
    maxZ: -34.0,
  },
  {
    id: 'academic-building-east',
    label: 'Academic Building East Wing (4 Floors)',
    minX: 11.5,
    maxX: 34.0,
    minY: 0,
    maxY: 13.5,
    minZ: -90.0,
    maxZ: -34.0,
  },
  {
    id: 'academic-building-north',
    label: 'Academic Building North Wing (4 Floors)',
    minX: -11.5,
    maxX: 11.5,
    minY: 0,
    maxY: 13.5,
    minZ: -90.0,
    maxZ: -71.0,
  },
  {
    id: 'academic-building-south',
    label: 'Academic Building South Wing (4 Floors)',
    minX: -11.5,
    maxX: 11.5,
    minY: 0,
    maxY: 13.5,
    minZ: -54.0,
    maxZ: -34.0,
  },
  // Entrance Approach Right-Hand Utility Bay (X: 18..29, Z: 60..72) near entrance benches
  {
    id: 'campus-tractor',
    label: 'University Grounds Tractor',
    minX: 19.3,
    maxX: 23.7,
    minY: 0,
    maxY: 2.5,
    minZ: 66.5,
    maxZ: 70.3,
  },
  {
    id: 'entrance-utility-container',
    label: 'Entrance Grounds Utility Container',
    minX: 21.3,
    maxX: 27.7,
    minY: 0,
    maxY: 2.7,
    minZ: 61.8,
    maxZ: 64.6,
  },
  {
    id: 'academic-staff-car-1',
    label: 'Faculty Staff Car',
    minX: 36.2,
    maxX: 40.8,
    minY: 0,
    maxY: 1.6,
    minZ: -15.5,
    maxZ: -13.5,
  },
  {
    id: 'academic-staff-car-2',
    label: 'Faculty Staff Car',
    minX: 36.2,
    maxX: 40.8,
    minY: 0,
    maxY: 1.6,
    minZ: -19.5,
    maxZ: -17.5,
  },
  {
    id: 'academic-staff-car-3',
    label: 'Faculty Staff Car',
    minX: 36.2,
    maxX: 40.8,
    minY: 0,
    maxY: 1.6,
    minZ: -23.5,
    maxZ: -21.5,
  },
  {
    id: 'academic-staff-car-4',
    label: 'Faculty Staff Car',
    minX: 36.2,
    maxX: 40.8,
    minY: 0,
    maxY: 1.6,
    minZ: -27.5,
    maxZ: -25.5,
  },

  // =========================================================================
  // 7. FIVE SINGLE-STOREY ENGINEERING WORKSHOPS, BLUE CONTAINER #2 & REAR PASSAGE
  // =========================================================================
  {
    id: 'engineering-workshops-wing',
    label: 'Engineering Workshops Wing (5 Single-Storey Bays)',
    minX: -46.0,
    maxX: -34.0,
    minY: 0,
    maxY: 4.8,
    minZ: -90.0,
    maxZ: -56.0,
  },
  {
    id: 'workshop-5-blue-container',
    label: 'Blue Shipping Container (Machine Shop Approach)',
    minX: -54.8,
    maxX: -52.2,
    minY: 0,
    maxY: 2.7,
    minZ: -88.0,
    maxZ: -82.0,
  },
  {
    id: 'workshop-rear-passage-rail',
    label: 'Workshop Rear Passage North Colonnade Rail',
    minX: -50.2,
    maxX: -18.0,
    minY: 0,
    maxY: 1.2,
    minZ: -94.0,
    maxZ: -93.6,
  },

  // =========================================================================
  // 8. REAR WORKSHOP JUNK AREA (X: -56..-24, Z: -109..-95.2)
  // =========================================================================
  {
    id: 'junk-diesel-generator',
    label: 'Large Industrial Power Generator',
    minX: -52.8,
    maxX: -46.2,
    minY: 0,
    maxY: 3.1,
    minZ: -103.5,
    maxZ: -100.1,
  },
  {
    id: 'junk-yellow-truck',
    label: 'Yellow Maintenance Flatbed Truck',
    minX: -43.4,
    maxX: -37.0,
    minY: 0,
    maxY: 2.9,
    minZ: -103.8,
    maxZ: -100.8,
  },
  {
    id: 'junk-scrap-metal-5',
    label: 'Heavy Workshop Steel Scrap Stack',
    minX: -33.3,
    maxX: -29.7,
    minY: 0,
    maxY: 1.4,
    minZ: -103.5,
    maxZ: -100.5,
  },
  {
    id: 'junk-scrap-metal-1',
    label: 'Scrap Steel & Copper Pile',
    minX: -53.3,
    maxX: -49.7,
    minY: 0,
    maxY: 1.4,
    minZ: -108.0,
    maxZ: -105.0,
  },
  {
    id: 'junk-scrap-metal-2',
    label: 'Galvanized Roofing & Beam Scrap',
    minX: -49.3,
    maxX: -45.7,
    minY: 0,
    maxY: 1.3,
    minZ: -98.6,
    maxZ: -95.8,
  },
  {
    id: 'junk-scrap-metal-3',
    label: 'Aluminium & Drum Scrap Cluster',
    minX: -39.3,
    maxX: -35.7,
    minY: 0,
    maxY: 1.4,
    minZ: -108.0,
    maxZ: -105.0,
  },
  {
    id: 'junk-scrap-metal-4',
    label: 'Mixed Scrap Metal Heap',
    minX: -39.2,
    maxX: -35.8,
    minY: 0,
    maxY: 1.3,
    minZ: -99.2,
    maxZ: -96.4,
  },

  // =========================================================================
  // 9. CAMPUS CLINIC & AMBULANCE BAY
  // =========================================================================
  {
    id: 'campus-clinic',
    label: 'Campus Clinic',
    minX: -52.0,
    maxX: -36.0,
    minY: 0,
    maxY: 4.2,
    minZ: 17.5,
    maxZ: 27.5,
  },
  {
    id: 'clinic-ambulance',
    label: 'Campus Ambulance',
    minX: -48.0,
    maxX: -45.6,
    minY: 0,
    maxY: 2.5,
    minZ: 11.4,
    maxZ: 16.4,
  },

  // =========================================================================
  // 10. CAFETERIA, FELLOWSHIP HALL & BUKA KIOSK (LEFT, BEFORE VOLLEYBALL)
  // =========================================================================
  {
    id: 'cafeteria-building',
    label: 'Cafeteria & Fellowship Hall',
    minX: -94.0,
    maxX: -74.0,
    minY: 0,
    maxY: 6.8,
    minZ: -56.0,
    maxZ: -38.0,
  },
  {
    id: 'buka-kiosk',
    label: 'Campus Buka Kiosk',
    minX: -80.0,
    maxX: -74.0,
    minY: 0,
    maxY: 3.5,
    minZ: -34.0,
    maxZ: -28.0,
  },

  // =========================================================================
  // 11. VOLLEYBALL COURT & MUSTER POINT (LEFT OF CONTINUED ROAD, AFTER CAFETERIA)
  // =========================================================================
  {
    id: 'volleyball-post-north',
    label: 'Volleyball Net Post',
    minX: -87.3,
    maxX: -86.7,
    minY: 0,
    maxY: 2.6,
    minZ: -80.4,
    maxZ: -79.8,
  },
  {
    id: 'volleyball-post-south',
    label: 'Volleyball Net Post',
    minX: -87.3,
    maxX: -86.7,
    minY: 0,
    maxY: 2.6,
    minZ: -72.2,
    maxZ: -71.6,
  },
  {
    id: 'muster-sign-post',
    label: 'Muster Point Signboard',
    minX: -79.2,
    maxX: -76.4,
    minY: 0,
    maxY: 3.2,
    minZ: -66.8,
    maxZ: -65.8,
  },

  // =========================================================================
  // 12. HOSTELS & FOOTBALL FIELD (UPPER CAMPUS, NORTH OF CROSS-ROAD Z=-117)
  // =========================================================================
  {
    id: 'hostel-100l',
    label: 'Female & Male 100-Level Hostel',
    minX: -106.0,
    maxX: -76.0,
    minY: 0,
    maxY: 7.5,
    minZ: -156.0,
    maxZ: -124.0,
  },
  {
    id: 'football-goal-north',
    label: 'Football Goal Frame North',
    minX: -28.8,
    maxX: -21.2,
    minY: 0,
    maxY: 2.6,
    minZ: -169.4,
    maxZ: -167.8,
  },
  {
    id: 'football-goal-south',
    label: 'Football Goal Frame South',
    minX: -28.8,
    maxX: -21.2,
    minY: 0,
    maxY: 2.6,
    minZ: -126.2,
    maxZ: -124.6,
  },
  {
    id: 'football-bleacher-west',
    label: 'Football Field Sideline Bleachers',
    minX: -51.4,
    maxX: -48.8,
    minY: 0,
    maxY: 2.5,
    minZ: -156.0,
    maxZ: -138.0,
  },
  {
    id: 'hostel-male-senior',
    label: 'Male 200-500-Level Hostel',
    minX: -88.0,
    maxX: -40.0,
    minY: 0,
    maxY: 10.6,
    minZ: -206.0,
    maxZ: -188.0,
  },

  // =========================================================================
  // 13. DIRECTIONAL SIGNPOST & CAMPUS BENCHES
  // =========================================================================
  {
    id: 'campus-signpost',
    label: 'Directional Campus Sign',
    minX: 11.2,
    maxX: 12.6,
    minY: 0,
    maxY: 3.2,
    minZ: 54.4,
    maxZ: 55.6,
  },
  {
    id: 'bench-west-1',
    label: 'Campus Bench',
    minX: -12.6,
    maxX: -10.8,
    minY: 0,
    maxY: 0.9,
    minZ: 56.5,
    maxZ: 58.9,
  },
  {
    id: 'bench-east-1',
    label: 'Campus Bench',
    minX: 10.8,
    maxX: 12.6,
    minY: 0,
    maxY: 0.9,
    minZ: 34.5,
    maxZ: 36.9,
  },
  {
    id: 'bench-east-2',
    label: 'Campus Bench',
    minX: 10.8,
    maxX: 12.6,
    minY: 0,
    maxY: 0.9,
    minZ: 70.5,
    maxZ: 72.9,
  },
  {
    id: 'bench-forecourt-w',
    label: 'Academic Forecourt Bench',
    minX: -20.5,
    maxX: -18.1,
    minY: 0,
    maxY: 0.9,
    minZ: -27.5,
    maxZ: -26.3,
  },
  {
    id: 'bench-forecourt-e',
    label: 'Academic Forecourt Bench',
    minX: 18.1,
    maxX: 20.5,
    minY: 0,
    maxY: 0.9,
    minZ: -27.5,
    maxZ: -26.3,
  },
];

/** Walkable raised plinths & stairs (smooth step-up elevation) */
export const CAMPUS_STEPS: ReadonlyArray<StepSurface> = [
  {
    id: 'roundabout-plinth',
    minX: -6.8,
    maxX: 6.8,
    minZ: -0.8,
    maxZ: 12.8,
    elevation: 0.22,
  },
  {
    id: 'pedestrian-gate-platform-main',
    minX: 15.8,
    maxX: 24.8,
    minZ: 109.2,
    maxZ: 118.2,
    elevation: 0.26,
  },
  {
    id: 'pedestrian-gate-step-south',
    minX: 15.8,
    maxX: 24.8,
    minZ: 118.2,
    maxZ: 119.1,
    elevation: 0.13,
  },
  {
    id: 'pedestrian-gate-step-north',
    minX: 15.8,
    maxX: 24.8,
    minZ: 108.3,
    maxZ: 109.2,
    elevation: 0.13,
  },
];

export const CAMPUS_ZONES: ReadonlyArray<CampusZone> = [
  {
    id: 'main-gate',
    name: 'University Main Gate',
    subtitle: 'Arched Twin-Portal Entrance & Pedestrian Gate',
    minX: -24,
    maxX: 26,
    minZ: 105,
    maxZ: 140,
  },
  {
    id: 'security-building-zone',
    name: 'Campus Security Building',
    subtitle: 'Ground & First Floor Gate Operations',
    minX: 19,
    maxX: 37,
    minZ: 86,
    maxZ: 104,
  },
  {
    id: 'university-hall-zone',
    name: 'University Hall',
    subtitle: 'Two-Storey Assembly & Event Hall',
    minX: 39,
    maxX: 69,
    minZ: 80,
    maxZ: 106,
  },
  {
    id: 'entrance-tractor-utility-zone',
    name: 'Grounds Tractor & Utility Container Bay',
    subtitle: 'Campus Entrance Approach Right Side',
    minX: 16,
    maxX: 31,
    minZ: 58,
    maxZ: 74,
  },
  {
    id: 'basketball-court-zone',
    name: 'Campus Basketball Arena',
    subtitle: 'Outdoor Athletics & Spectator Court',
    minX: -61,
    maxX: -28,
    minZ: 66,
    maxZ: 98,
  },
  {
    id: 'admin-building-zone',
    name: 'Administrative Block & Bus Plaza',
    subtitle: 'Registry, Bursary, Coaster Bus & Staff Car Forecourt',
    minX: -68,
    maxX: -14,
    minZ: 28,
    maxZ: 58,
  },
  {
    id: 'roundabout',
    name: 'Flag Roundabout',
    subtitle: 'Ceremonial Crossroads & Academic Forecourt',
    minX: -18,
    maxX: 18,
    minZ: -12,
    maxZ: 23,
  },
  {
    id: 'campus-clinic-zone',
    name: 'Campus Clinic & Ambulance Bay',
    subtitle: 'Medical Centre, Triage & Emergency Ambulance',
    minX: -56,
    maxX: -32,
    minZ: 10,
    maxZ: 28,
  },
  {
    id: 'workshop-rear-passage-zone',
    name: 'Covered Workshop Rear Passage',
    subtitle: 'Direct Walkway to Academic Rear Staircase & Toilets',
    minX: -52,
    maxX: -16,
    minZ: -95,
    maxZ: -89,
  },
  {
    id: 'workshop-junk-area-zone',
    name: 'Workshop Maintenance & Junk Yard',
    subtitle: 'Large Power Generator, Yellow Truck & Scrap Metal',
    minX: -58,
    maxX: -22,
    minZ: -111,
    maxZ: -94,
  },
  {
    id: 'academic-parking-court-zone',
    name: 'Academic Staff Parking Court',
    subtitle: 'Faculty & Staff Parking Bays',
    minX: 34,
    maxX: 54,
    minZ: -34,
    maxZ: -8,
  },
  {
    id: 'academic-building-zone',
    name: 'Academic Building Complex',
    subtitle: '4 Floors · Open Courtyard, Medical, Engineering & Mass Comm',
    minX: -35,
    maxX: 35,
    minZ: -90,
    maxZ: -12,
  },
  {
    id: 'engineering-workshops-zone',
    name: 'Engineering Workshops Wing',
    subtitle: 'Carpentry, Mechanical, Welding, Electrical & Machine Shop',
    minX: -56,
    maxX: -34,
    minZ: -90,
    maxZ: -55,
  },
  {
    id: 'cafeteria-zone',
    name: 'Cafeteria & Fellowship Hall',
    subtitle: 'Dining Hall, Buka & Upper Fellowship Hall',
    minX: -98,
    maxX: -70,
    minZ: -58,
    maxZ: -26,
  },
  {
    id: 'volleyball-muster-zone',
    name: 'Muster Point & Volleyball Court',
    subtitle: 'Campus Assembly Square & Outdoor Volleyball',
    minX: -104,
    maxX: -70,
    minZ: -92,
    maxZ: -61,
  },
  {
    id: 'hostel-100l-zone',
    name: 'Female & Male 100-Level Hostel',
    subtitle: 'Freshmen & Female Student Residences',
    minX: -110,
    maxX: -72,
    minZ: -160,
    maxZ: -121,
  },
  {
    id: 'football-field-zone',
    name: 'University Football Field',
    subtitle: 'Full Turf Pitch & Touchline Bleachers',
    minX: -54,
    maxX: 4,
    minZ: -174,
    maxZ: -121,
  },
  {
    id: 'hostel-male-senior-zone',
    name: 'Male 200-500-Level Hostel',
    subtitle: 'Senior Undergraduate Residences',
    minX: -94,
    maxX: -36,
    minZ: -210,
    maxZ: -174,
  },
  {
    id: 'campus-boulevard',
    name: 'Campus Main Avenue',
    subtitle: 'Dual Carriageway Boulevard & Median',
    minX: -18,
    maxX: 18,
    minZ: 22,
    maxZ: 105,
  },
];

export function getCampusZoneAt(x: number, z: number): { name: string; subtitle: string } {
  for (const zone of CAMPUS_ZONES) {
    if (x >= zone.minX && x <= zone.maxX && z >= zone.minZ && z <= zone.maxZ) {
      return { name: zone.name, subtitle: zone.subtitle };
    }
  }
  return { name: 'University Campus Grounds', subtitle: 'Green Lawns & Campus Road Network' };
}

export interface TreePlacement {
  x: number;
  z: number;
  scale: number;
  rotationY: number;
  kind: 'palm' | 'shade';
}

export const CAMPUS_TREES: ReadonlyArray<TreePlacement> = [
  // Royal Palms along the Delayed Central Grass Median (starts Z=96 inside gate, clear of Z:64..68 crosswalk)
  { x: 0, z: 91, scale: 1.06, rotationY: 0.3, kind: 'palm' },
  { x: 0, z: 77, scale: 1.06, rotationY: 2.1, kind: 'palm' },
  { x: 0, z: 56, scale: 1.08, rotationY: 0.7, kind: 'palm' },
  { x: 0, z: 44, scale: 1.02, rotationY: 1.8, kind: 'palm' },
  { x: 0, z: 32, scale: 1.05, rotationY: 2.8, kind: 'palm' },

  // Palms framing Approach Avenue Setbacks & Forecourt (clear of Pedestrian Gate & Tractor Utility Bay)
  { x: -14.5, z: 98, scale: 1.04, rotationY: 0.4, kind: 'palm' },
  { x: 14.5, z: 98, scale: 1.02, rotationY: 1.5, kind: 'palm' },
  { x: -14.5, z: 74, scale: 1.06, rotationY: 2.3, kind: 'palm' },
  { x: 14.5, z: 75.5, scale: 1.0, rotationY: 0.9, kind: 'palm' },
  { x: -14.5, z: 32, scale: 1.04, rotationY: 3.1, kind: 'palm' },
  { x: 14.5, z: 32, scale: 1.05, rotationY: 1.1, kind: 'palm' },
  { x: -29.0, z: -20, scale: 1.08, rotationY: 0.8, kind: 'palm' },
  { x: 29.0, z: -20, scale: 1.06, rotationY: 2.2, kind: 'palm' },

  // Palms along Continued Northern Road (-64) & Upper Campus
  { x: -71.5, z: -22, scale: 1.05, rotationY: 1.3, kind: 'palm' },
  { x: -56.5, z: -38, scale: 1.02, rotationY: 2.6, kind: 'palm' },
  { x: -71.5, z: -102, scale: 1.08, rotationY: 0.6, kind: 'palm' },
  { x: -56.5, z: -136, scale: 1.04, rotationY: 1.9, kind: 'palm' },
  { x: -71.5, z: -162, scale: 1.1, rotationY: 2.8, kind: 'palm' },

  // Broad Shade Trees (Mango / Neem style) in spacious lawns & setbacks
  { x: 34, z: 62, scale: 1.18, rotationY: 0.5, kind: 'shade' },
  { x: 42, z: 60, scale: 1.24, rotationY: 1.4, kind: 'shade' },
  { x: 74, z: 92, scale: 1.2, rotationY: 2.2, kind: 'shade' },
  { x: 30, z: 30, scale: 1.22, rotationY: 0.9, kind: 'shade' },
  { x: 48, z: 24, scale: 1.18, rotationY: 2.7, kind: 'shade' },
  { x: 72, z: -40, scale: 1.26, rotationY: 1.1, kind: 'shade' },
  { x: 72, z: -85, scale: 1.22, rotationY: 2.4, kind: 'shade' },
  { x: -64, z: 92, scale: 1.24, rotationY: 0.8, kind: 'shade' },
  { x: -74, z: 42, scale: 1.22, rotationY: 1.7, kind: 'shade' },
  { x: -66, z: 20, scale: 1.16, rotationY: 2.9, kind: 'shade' },
  { x: -112, z: -46, scale: 1.26, rotationY: 0.4, kind: 'shade' },
  { x: -112, z: -80, scale: 1.22, rotationY: 2.1, kind: 'shade' },
  { x: 16, z: -146, scale: 1.24, rotationY: 1.5, kind: 'shade' },
  { x: 16, z: -168, scale: 1.2, rotationY: 2.6, kind: 'shade' },
  { x: -98, z: -196, scale: 1.25, rotationY: 0.7, kind: 'shade' },
  { x: -28, z: -196, scale: 1.22, rotationY: 1.9, kind: 'shade' },

  // Outer perimeter grove beyond playable bounds
  { x: -156, z: 90, scale: 1.35, rotationY: 0.7, kind: 'shade' },
  { x: 146, z: 90, scale: 1.3, rotationY: 1.4, kind: 'shade' },
  { x: -158, z: 0, scale: 1.38, rotationY: 2.6, kind: 'palm' },
  { x: 148, z: 0, scale: 1.32, rotationY: 0.2, kind: 'palm' },
  { x: -156, z: -90, scale: 1.35, rotationY: 1.9, kind: 'shade' },
  { x: 146, z: -90, scale: 1.3, rotationY: 3.0, kind: 'shade' },
  { x: -154, z: -175, scale: 1.34, rotationY: 0.5, kind: 'palm' },
  { x: 144, z: -175, scale: 1.32, rotationY: 2.1, kind: 'palm' },
  { x: -60, z: -225, scale: 1.35, rotationY: 1.6, kind: 'shade' },
];

export interface StreetlightPlacement {
  x: number;
  z: number;
  armDirX: number; // +1 faces +X (east), -1 faces -X (west)
}

const WEST_CURVE_SAMPLES = sampleLeftBendCenterline(48);
const EAST_CURVE_SAMPLES = sampleCurveCenterline(EAST_BEND_CONTROL_POINTS, 40);
const CURVE_LIGHT_OFFSET = SECONDARY_ROAD_HALF_WIDTH + 1.35;

export const CAMPUS_STREETLIGHTS: ReadonlyArray<StreetlightPlacement> = [
  // Dual Carriageway Approach Avenue outer sidewalks (median starts at Z=96)
  ...[104, 88, 72, 56, 40, 26].flatMap((z) => [
    { x: -10.85, z, armDirX: 1 },
    { x: 10.85, z, armDirX: -1 },
  ]),
  ...[92, 80, 56, 40, 26].map((z) => ({ x: 0.0, z, armDirX: 1 })),

  // Roundabout Perimeter (outside r = 16.5)
  { x: -17.6, z: 6, armDirX: 1 },
  { x: 17.6, z: 6, armDirX: -1 },

  // West Smooth Curve Sidewalks
  ...[12, 24, 36].flatMap((idx) => {
    const s = WEST_CURVE_SAMPLES[idx];
    return [
      {
        x: Number((s.x - s.nx * CURVE_LIGHT_OFFSET).toFixed(2)),
        z: Number((s.z - s.nz * CURVE_LIGHT_OFFSET).toFixed(2)),
        armDirX: 1,
      },
      {
        x: Number((s.x + s.nx * CURVE_LIGHT_OFFSET).toFixed(2)),
        z: Number((s.z + s.nz * CURVE_LIGHT_OFFSET).toFixed(2)),
        armDirX: -1,
      },
    ];
  }),

  // East Smooth Curve Sidewalks
  ...[10, 20, 30].flatMap((idx) => {
    const s = EAST_CURVE_SAMPLES[idx];
    return [
      {
        x: Number((s.x - s.nx * CURVE_LIGHT_OFFSET).toFixed(2)),
        z: Number((s.z - s.nz * CURVE_LIGHT_OFFSET).toFixed(2)),
        armDirX: 1,
      },
      {
        x: Number((s.x + s.nx * CURVE_LIGHT_OFFSET).toFixed(2)),
        z: Number((s.z + s.nz * CURVE_LIGHT_OFFSET).toFixed(2)),
        armDirX: -1,
      },
    ];
  }),

  // Continued Northern Road (-64)
  ...[-28, -50, -72, -96, -134, -158].flatMap((z) => [
    { x: -69.55, z, armDirX: 1 },
    { x: -58.45, z, armDirX: -1 },
  ]),

  // East Loop Road (+58)
  ...[-28, -56, -84, -106].flatMap((z) => [
    { x: 52.45, z, armDirX: 1 },
    { x: 63.55, z, armDirX: -1 },
  ]),
];

// Export check helper reference for tests
export { APPROACH_ROAD_CENTER_X, DUAL_ROAD_OUTER_HALF_WIDTH, ROUNDABOUT_CENTER };
