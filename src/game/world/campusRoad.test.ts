import test from 'node:test';
import assert from 'node:assert/strict';
import { overlapsColliderXZ } from '../physics/collision';
import {
  CAMPUS_BOUNDS,
  CAMPUS_COLLIDERS,
  CAMPUS_STREETLIGHTS,
  getCampusZoneAt,
} from './campusData';
import {
  CONTINUED_ROAD_CENTER_X,
  CUL_DE_SAC_CENTER,
  DUAL_EAST_CARRIAGEWAY_X,
  DUAL_MEDIAN_HALF_WIDTH,
  DUAL_ROAD_OUTER_HALF_WIDTH,
  DUAL_WEST_CARRIAGEWAY_X,
  EAST_BEND_CONTROL_POINTS,
  EAST_LOOP_ROAD_X,
  NORTH_CROSS_ROAD_Z,
  ROUNDABOUT_CENTER,
  ROUNDABOUT_INNER_RADIUS,
  ROUNDABOUT_OUTER_RADIUS,
  SECONDARY_ROAD_HALF_WIDTH,
  sampleCurveCenterline,
  sampleLeftBendCenterline,
} from './campusRoad';

function getById(id: string) {
  const col = CAMPUS_COLLIDERS.find((c) => c.id === id);
  assert.ok(col, `Expected collider ${id} to exist`);
  return col;
}

test('West & East smooth Bezier curves maintain C1 continuity and remain clear of all campus obstacles', () => {
  const westSamples = sampleLeftBendCenterline(48);
  assert.equal(westSamples.length, 49);

  // West curve starts tangent to West Arterial (-X) and ends tangent to Continued North Road (-Z)
  assert.ok(Math.abs(westSamples[0].tx + 1) < 1e-6 && Math.abs(westSamples[0].tz) < 1e-6);
  assert.ok(
    Math.abs(westSamples[westSamples.length - 1].tx) < 1e-6 &&
      Math.abs(westSamples[westSamples.length - 1].tz + 1) < 1e-6
  );

  for (let i = 1; i < westSamples.length; i++) {
    const prev = westSamples[i - 1];
    const curr = westSamples[i];
    const dot = prev.tx * curr.tx + prev.tz * curr.tz;
    const angleDeg = (Math.acos(Math.min(1, Math.max(-1, dot))) * 180) / Math.PI;
    assert.ok(angleDeg < 4.5, `West road bend too sharp at step ${i}: ${angleDeg.toFixed(2)} deg`);
    assert.ok(curr.x <= prev.x + 1e-6, 'West curve should sweep monotonically West (-X)');
    assert.ok(curr.z <= prev.z + 1e-6, 'West curve should progress continuously North (-Z)');
  }

  for (const s of westSamples) {
    for (const offset of [-SECONDARY_ROAD_HALF_WIDTH + 0.5, 0, SECONDARY_ROAD_HALF_WIDTH - 0.5]) {
      const px = s.x + s.nx * offset;
      const pz = s.z + s.nz * offset;
      for (const col of CAMPUS_COLLIDERS) {
        assert.equal(
          overlapsColliderXZ(px, 0.04, pz, 0.42, 1.72, col),
          false,
          `West curved road point (${px.toFixed(1)}, ${pz.toFixed(1)}) overlaps collider ${col.id}`
        );
      }
    }
  }

  const eastSamples = sampleCurveCenterline(EAST_BEND_CONTROL_POINTS, 40);
  assert.ok(Math.abs(eastSamples[0].tx - 1) < 1e-6 && Math.abs(eastSamples[0].tz) < 1e-6);
  assert.ok(
    Math.abs(eastSamples[eastSamples.length - 1].tx) < 1e-6 &&
      Math.abs(eastSamples[eastSamples.length - 1].tz + 1) < 1e-6
  );
  for (const s of eastSamples) {
    for (const offset of [-SECONDARY_ROAD_HALF_WIDTH + 0.5, 0, SECONDARY_ROAD_HALF_WIDTH - 0.5]) {
      const px = s.x + s.nx * offset;
      const pz = s.z + s.nz * offset;
      for (const col of CAMPUS_COLLIDERS) {
        assert.equal(
          overlapsColliderXZ(px, 0.04, pz, 0.42, 1.72, col),
          false,
          `East curved road point (${px.toFixed(1)}, ${pz.toFixed(1)}) overlaps collider ${col.id}`
        );
      }
    }
  }
});

test('dual carriageway lanes, roundabout ring, cross-road, continued road, and cul-de-sac are walkable and streetlights stay clear of asphalt', () => {
  // Dual Carriageway Approach Avenue (West & East lanes clear from gate Z=125 to roundabout edge Z=25)
  for (let z = 125; z >= 25; z -= 5) {
    for (const laneX of [DUAL_WEST_CARRIAGEWAY_X, DUAL_EAST_CARRIAGEWAY_X]) {
      for (const col of CAMPUS_COLLIDERS) {
        assert.equal(
          overlapsColliderXZ(laneX, 0.04, z, 0.42, 1.72, col),
          false,
          `Dual carriageway (${laneX}, ${z}) overlaps ${col.id}`
        );
      }
    }
  }

  // Flag Roundabout circular carriageway ring (midpoint radius ~11.85m)
  const ringR = (ROUNDABOUT_INNER_RADIUS + ROUNDABOUT_OUTER_RADIUS) / 2;
  for (let i = 0; i < 16; i++) {
    const theta = (i / 16) * Math.PI * 2;
    const rx = ROUNDABOUT_CENTER.x + Math.cos(theta) * ringR;
    const rz = ROUNDABOUT_CENTER.z + Math.sin(theta) * ringR;
    for (const col of CAMPUS_COLLIDERS) {
      assert.equal(
        overlapsColliderXZ(rx, 0.04, rz, 0.42, 1.72, col),
        false,
        `Roundabout ring point (${rx.toFixed(1)}, ${rz.toFixed(1)}) overlaps ${col.id}`
      );
    }
  }

  // Continued Northern Road (-64) down to Cul-de-sac (-176) and North Cross-Road (Z=-117)
  for (let z = -10; z >= CUL_DE_SAC_CENTER.z; z -= 6) {
    for (const col of CAMPUS_COLLIDERS) {
      assert.equal(
        overlapsColliderXZ(CONTINUED_ROAD_CENTER_X, 0.04, z, 0.42, 1.72, col),
        false,
        `Continued road at z=${z} overlaps ${col.id}`
      );
    }
  }
  for (let x = CONTINUED_ROAD_CENTER_X; x <= EAST_LOOP_ROAD_X; x += 6) {
    for (const col of CAMPUS_COLLIDERS) {
      assert.equal(
        overlapsColliderXZ(x, 0.04, NORTH_CROSS_ROAD_Z, 0.42, 1.72, col),
        false,
        `North Cross-Road at x=${x} overlaps ${col.id}`
      );
    }
  }

  // Streetlights never sit on asphalt carriageways (either inside central grass median or outside road edges)
  const westCurve = sampleLeftBendCenterline(96);
  const eastCurve = sampleCurveCenterline(EAST_BEND_CONTROL_POINTS, 80);
  for (const light of CAMPUS_STREETLIGHTS) {
    if (light.z >= 25 && Math.abs(light.x) <= 12) {
      const inMedian = Math.abs(light.x) < DUAL_MEDIAN_HALF_WIDTH - 0.3;
      const outsideOuter = Math.abs(light.x) > DUAL_ROAD_OUTER_HALF_WIDTH + 0.5;
      assert.ok(inMedian || outsideOuter, `Dual carriageway light (${light.x}, ${light.z}) on asphalt`);
    } else if (Math.abs(light.x) <= 20 && light.z >= -4 && light.z <= 16) {
      const distR = Math.hypot(light.x - ROUNDABOUT_CENTER.x, light.z - ROUNDABOUT_CENTER.z);
      assert.ok(distR > ROUNDABOUT_OUTER_RADIUS + 0.3, `Roundabout light inside road ring: r=${distR}`);
    } else if (light.x < -50 && light.z <= -20) {
      assert.ok(Math.abs(light.x - CONTINUED_ROAD_CENTER_X) > SECONDARY_ROAD_HALF_WIDTH + 0.5);
    } else if (light.x > 45 && light.z <= -20) {
      assert.ok(Math.abs(light.x - EAST_LOOP_ROAD_X) > SECONDARY_ROAD_HALF_WIDTH + 0.5);
    } else {
      let minDist = Infinity;
      for (const s of [...westCurve, ...eastCurve]) {
        minDist = Math.min(minDist, Math.hypot(light.x - s.x, light.z - s.z));
      }
      assert.ok(
        minDist > SECONDARY_ROAD_HALF_WIDTH + 0.5,
        `Curved road light (${light.x}, ${light.z}) on asphalt: d=${minDist.toFixed(2)}`
      );
    }
  }
});

test('Phase 4 campus places arched Main Gate + Pedestrian Gate, delayed median, shifted Basketball Arena, entrance Tractor + Utility Container #1, Workshop 5 Blue Container #2 & large Junkyard Generator', () => {
  const security = getById('security-building');
  const hall = getById('university-hall');
  const gateWest = getById('gate-pillar-west');
  const gateEast = getById('gate-pillar-east');
  const gateLeafW = getById('gate-iron-leaf-west-open');
  const gateLeafE = getById('gate-iron-leaf-east-open');
  const pedEast = getById('gate-pedestrian-pillar-east');
  const medianSouth = getById('median-curb-south');
  const admin = getById('administrative-building');
  const bus1 = getById('admin-coaster-bus-1');
  const bus2 = getById('admin-coaster-bus-2');
  const hoopNorth = getById('basketball-hoop-north');
  const acadWest = getById('academic-building-west');
  const acadEast = getById('academic-building-east');
  const acadNorth = getById('academic-building-north');
  const acadSouth = getById('academic-building-south');
  const tractor = getById('campus-tractor');
  const utilityContainer = getById('entrance-utility-container');
  const workshops = getById('engineering-workshops-wing');
  const workshopBlueContainer = getById('workshop-5-blue-container');
  const passageRail = getById('workshop-rear-passage-rail');
  const junkGen = getById('junk-diesel-generator');
  const junkTruck = getById('junk-yellow-truck');
  const junkScrap1 = getById('junk-scrap-metal-1');
  const junkScrap5 = getById('junk-scrap-metal-5');
  const clinic = getById('campus-clinic');
  const ambulance = getById('clinic-ambulance');
  const cafeteria = getById('cafeteria-building');
  const buka = getById('buka-kiosk');
  const volleyballSouth = getById('volleyball-post-south');
  const hostel100 = getById('hostel-100l');
  const hostelMale = getById('hostel-male-senior');

  // Widened Main Gate (gap >= 25m), open iron gate leaves, Pedestrian Gate & Delayed Median starting Z=96
  assert.ok(gateEast.minX - gateWest.maxX >= 25.0);
  assert.ok(gateLeafW.maxZ < 114.0 && gateLeafE.maxZ < 114.0);
  assert.ok(pedEast.minX > gateEast.maxX);
  assert.ok(medianSouth.maxZ <= 96.0, `Median must start further inside at Z<=96, got ${medianSouth.maxZ}`);

  // Security & University Hall on right (+X) inside main gate (Z < 114)
  assert.ok(security.minX > DUAL_ROAD_OUTER_HALF_WIDTH && hall.minX > security.maxX);
  assert.ok(security.maxZ < 112 && hall.maxZ < 112);

  // Basketball Court shifted further West (-44, 82) clear of entrance avenue & Admin Block (-64..-44, 34..52)
  assert.ok(hoopNorth.minX < -42.0 && hoopNorth.maxX < -40.0);
  assert.ok(admin.maxX < -DUAL_ROAD_OUTER_HALF_WIDTH);
  assert.ok(bus1.minX > admin.maxX && bus2.minX > admin.maxX);
  assert.ok(bus1.maxX < -DUAL_ROAD_OUTER_HALF_WIDTH && bus2.maxX < -DUAL_ROAD_OUTER_HALF_WIDTH);

  // Full-scale 68x56m 4-storey Academic Building directly ahead of Roundabout (0, 6)
  assert.ok(acadSouth.maxZ < ROUNDABOUT_CENTER.z);
  assert.ok(acadWest.minX < 0 && acadEast.maxX > 0);
  assert.equal(acadEast.maxX - acadWest.minX, 68);
  assert.equal(acadSouth.maxZ - acadNorth.minZ, 56);
  assert.equal(acadWest.maxY, 13.5);
  assert.equal(acadEast.maxY, 13.5);
  assert.equal(acadNorth.maxY, 13.5);
  assert.equal(acadSouth.maxY, 13.5);
  assert.ok(acadEast.minX - acadWest.maxX >= 20);
  assert.ok(acadSouth.minZ - acadNorth.maxZ >= 15);

  // Tractor + Utility Container #1 sit on the right-hand entrance approach road (Z: 60..72), NOT Academic parking court
  assert.ok(tractor.minX > DUAL_ROAD_OUTER_HALF_WIDTH && tractor.minZ > 58 && tractor.maxZ < 75);
  assert.ok(utilityContainer.minX > DUAL_ROAD_OUTER_HALF_WIDTH && utilityContainer.minZ > 58 && utilityContainer.maxZ < 70);

  // 5 single-storey Engineering Workshops flush on Academic West-rear side + separate Blue Container #2 outside Workshop 5
  assert.equal(workshops.maxX, acadWest.minX);
  assert.equal(workshops.maxY, 4.8);
  assert.ok(workshops.minX > CONTINUED_ROAD_CENTER_X + SECONDARY_ROAD_HALF_WIDTH);
  assert.ok(workshopBlueContainer.maxX < workshops.minX - 4.0);
  assert.ok(workshopBlueContainer.minX > CONTINUED_ROAD_CENTER_X + SECONDARY_ROAD_HALF_WIDTH);
  assert.ok(workshopBlueContainer.minZ >= -89.0 && workshopBlueContainer.maxZ <= -81.0);

  // Front entrance sightline check from Forecourt (0, -30) past Academic front-left corner (-34, -34):
  // Workshops (X <= -34, Z <= -56) stay completely occluded behind Academic mass
  const sightSlopeZPerX = (-34 - -30) / (-34 - 0);
  const occludedZAtWorkshopWestEdge = -30 + sightSlopeZPerX * -46;
  assert.ok(
    workshops.maxZ < occludedZAtWorkshopWestEdge,
    `Expected workshops (maxZ=${workshops.maxZ}) occluded behind front facade (occludedZ=${occludedZAtWorkshopWestEdge})`
  );

  // Covered Workshop-to-Rear Passage walkway (Z = -92.0) is obstacle-free from Workshop Apron (-48.5) to Rear Door (-21.0)
  for (let x = -48.5; x <= -21.0; x += 2.0) {
    for (const col of CAMPUS_COLLIDERS) {
      assert.equal(
        overlapsColliderXZ(x, 0.04, -92.0, 0.42, 1.72, col),
        false,
        `Covered Rear Passage at x=${x.toFixed(1)} overlaps collider ${col.id}`
      );
    }
  }
  assert.ok(passageRail.maxZ < -93.0);

  // Rear Workshop Junk Area: Large Power Generator (>= 6m wide), Yellow Truck & Scrap Metal stacks
  assert.ok(junkGen.maxX - junkGen.minX >= 6.0 && junkGen.maxY >= 2.8);
  for (const junk of [junkGen, junkTruck, junkScrap1, junkScrap5]) {
    assert.ok(junk.maxZ < workshops.minZ - 4, `${junk.id} should sit behind workshops/passage`);
    assert.ok(junk.minZ > NORTH_CROSS_ROAD_Z + 4, `${junk.id} should clear North Cross-Road`);
  }

  // Clinic & Ambulance Bay on West side near Roundabout/West Arterial
  assert.ok(clinic.maxX < -30 && ambulance.maxX < -30);
  assert.ok(clinic.minZ > ROUNDABOUT_CENTER.z);

  // Cafeteria & Buka Kiosk on LEFT (-X) strictly south of Volleyball & Muster Point
  assert.ok(cafeteria.maxX < CONTINUED_ROAD_CENTER_X);
  assert.ok(buka.maxX < CONTINUED_ROAD_CENTER_X);
  assert.ok(
    cafeteria.minZ > volleyballSouth.maxZ,
    `Expected Cafeteria south of Volleyball (cafeteria.minZ=${cafeteria.minZ} > volleyball.maxZ=${volleyballSouth.maxZ})`
  );

  // 100L Hostel left, Male 200-500L Hostel at end of road inside Campus Bounds
  assert.ok(hostel100.maxX < CONTINUED_ROAD_CENTER_X);
  assert.ok(hostelMale.maxZ < CUL_DE_SAC_CENTER.z);
  assert.ok(hostelMale.minZ >= CAMPUS_BOUNDS.minZ);

  // Zones resolve accurately across the refined Phase 4 campus
  assert.equal(getCampusZoneAt(54.0, 96.0).name, 'University Hall');
  assert.equal(getCampusZoneAt(23.0, 66.0).name, 'Grounds Tractor & Utility Container Bay');
  assert.equal(getCampusZoneAt(-44.0, 82.0).name, 'Campus Basketball Arena');
  assert.equal(getCampusZoneAt(0, 6).name, 'Flag Roundabout');
  assert.equal(getCampusZoneAt(0, -25.0).name, 'Academic Building Complex');
  assert.equal(getCampusZoneAt(44.0, -20.0).name, 'Academic Staff Parking Court');
  assert.equal(getCampusZoneAt(-44.0, 20.0).name, 'Campus Clinic & Ambulance Bay');
  assert.equal(getCampusZoneAt(-42.0, -70.0).name, 'Engineering Workshops Wing');
  assert.equal(getCampusZoneAt(-34.0, -92.0).name, 'Covered Workshop Rear Passage');
  assert.equal(getCampusZoneAt(-42.0, -102.0).name, 'Workshop Maintenance & Junk Yard');
  assert.equal(getCampusZoneAt(-84.0, -47.0).name, 'Cafeteria & Fellowship Hall');
  assert.equal(getCampusZoneAt(-87.0, -76.0).name, 'Muster Point & Volleyball Court');
  assert.equal(getCampusZoneAt(-25.0, -147.0).name, 'University Football Field');
  assert.equal(getCampusZoneAt(-64.0, -195.0).name, 'Male 200-500-Level Hostel');
});
