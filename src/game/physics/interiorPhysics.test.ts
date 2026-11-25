import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PLAYER_HEIGHT, stepPlayerPhysics } from './collision';
import {
  buildInitialDoorStates,
  buildInteriorCameraColliders,
  buildInteriorRuntimeColliders,
  buildInteriorStepSurfaces,
  canToggleDoorSafely,
  createExteriorReturnState,
  createInteriorSpawnState,
  findNearestInteriorInteraction,
  getInteriorFloorAt,
  getInteriorRoomAt,
} from './interiorPhysics';
import { DEMO_INTERIOR } from '../world/demoInterior';
import { ACADEMIC_BUILDING_INTERIOR } from '../world/interiors/academicBuilding';
import { ADMINISTRATIVE_BUILDING_INTERIOR } from '../world/interiors/administrativeBuilding';
import { CAFETERIA_INTERIOR } from '../world/interiors/cafeteria';
import { CLINIC_INTERIOR } from '../world/interiors/clinic';
import { UNIVERSITY_HALL_INTERIOR } from '../world/interiors/universityHall';
import { ALL_WORKSHOP_INTERIORS } from '../world/interiors/workshops';
import {
  CAMPUS_BUILDING_PORTALS,
  findNearestExteriorPortal,
  getInteriorById,
  isDevelopmentInteriorAllowed,
  listRegisteredInteriors,
  registerInterior,
  unregisterInterior,
} from '../world/interiorRegistry';
import { CAMPUS_BOUNDS, CAMPUS_COLLIDERS } from '../world/campusData';

describe('Building Interiors Framework (Phase 2.1)', () => {
  it('registers and unregisters interiors independently and gates dev-only demo mode', () => {
    const customId = 'test-custom-hostel-wing';
    registerInterior({ ...DEMO_INTERIOR, id: customId, isDevelopmentDemo: false });
    assert.equal(getInteriorById(customId)?.id, customId);
    unregisterInterior(customId);
    assert.equal(getInteriorById(customId), undefined);

    // Demo interior remains registered cleanly
    assert.equal(getInteriorById(DEMO_INTERIOR.id)?.id, DEMO_INTERIOR.id);

    // Production/non-dev builds must never unlock dev demo access
    assert.equal(isDevelopmentInteriorAllowed(false), false);
    assert.equal(isDevelopmentInteriorAllowed(true), true);
  });

  it('spawns player inside a clear corridor without clipping walls or obstacles', () => {
    const doorStates = buildInitialDoorStates(DEMO_INTERIOR);
    const player = createInteriorSpawnState(DEMO_INTERIOR, doorStates);
    assert.equal(player.y, 0);
    assert.equal(player.grounded, true);

    const loc = getInteriorRoomAt(player.x, player.y, player.z, DEMO_INTERIOR);
    assert.equal(loc.floor.level, 0);
    assert.equal(loc.room?.name, 'Main Ground Corridor');
  });

  it('blocks doorway traversal when closed and allows entry into Seminar Room A when opened', () => {
    const doorStates = buildInitialDoorStates(DEMO_INTERIOR);
    const steps = buildInteriorStepSurfaces(DEMO_INTERIOR);

    const closedPlayer = createInteriorSpawnState(DEMO_INTERIOR, doorStates);
    closedPlayer.x = -4.2;
    closedPlayer.z = 1.9;

    const closedColliders = buildInteriorRuntimeColliders(DEMO_INTERIOR, doorStates);
    for (let i = 0; i < 60; i++) {
      stepPlayerPhysics(
        closedPlayer,
        { moveForward: 1, moveRight: 0, cameraYaw: 0, sprint: false, jumpJustPressed: false },
        1 / 60,
        closedColliders,
        steps,
        DEMO_INTERIOR.bounds,
        0
      );
    }
    assert.ok(closedPlayer.z > 1.2, `Expected closed door to block at z > 1.2, got ${closedPlayer.z}`);

    const openStates = { ...doorStates, 'demo-door-seminar': true };
    const openColliders = buildInteriorRuntimeColliders(DEMO_INTERIOR, openStates);
    const openPlayer = createInteriorSpawnState(DEMO_INTERIOR, openStates);
    openPlayer.x = -4.2;
    openPlayer.z = 1.9;

    for (let i = 0; i < 90; i++) {
      stepPlayerPhysics(
        openPlayer,
        { moveForward: 1, moveRight: 0, cameraYaw: 0, sprint: false, jumpJustPressed: false },
        1 / 60,
        openColliders,
        steps,
        DEMO_INTERIOR.bounds,
        0
      );
    }
    assert.ok(openPlayer.z < 0.0, `Expected open door to allow entry into room, got z=${openPlayer.z}`);
    const insideLoc = getInteriorRoomAt(openPlayer.x, openPlayer.y, openPlayer.z, DEMO_INTERIOR);
    assert.equal(insideLoc.room?.name, 'Seminar Room A');
  });

  it('prevents closing an open door directly onto a standing player', () => {
    const door = DEMO_INTERIOR.doors.find((d) => d.id === 'demo-door-seminar')!;
    assert.ok(door);

    assert.equal(canToggleDoorSafely(door, true, { x: -4.2, y: 0, z: 1.0 }), false);
    assert.equal(canToggleDoorSafely(door, true, { x: -4.2, y: 0, z: 2.0 }), true);
    assert.equal(canToggleDoorSafely(door, false, { x: -4.2, y: 0, z: 1.55 }), true);
  });

  it('supports climbing the East staircase to First Floor (y=3.2) and walking back down', () => {
    const doorStates = buildInitialDoorStates(DEMO_INTERIOR);
    const colliders = buildInteriorRuntimeColliders(DEMO_INTERIOR, doorStates);
    const steps = buildInteriorStepSurfaces(DEMO_INTERIOR);

    const player = createInteriorSpawnState(DEMO_INTERIOR, doorStates);
    player.x = 8.6;
    player.z = 6.2;
    player.y = 0.0;

    for (let i = 0; i < 160; i++) {
      stepPlayerPhysics(
        player,
        { moveForward: 1, moveRight: 0, cameraYaw: 0, sprint: false, jumpJustPressed: false },
        1 / 60,
        colliders,
        steps,
        DEMO_INTERIOR.bounds,
        0
      );
    }

    assert.ok(
      Math.abs(player.y - 3.2) < 0.05,
      `Expected player at First Floor elevation 3.2m, got y=${player.y} (z=${player.z})`
    );
    const upperLoc = getInteriorRoomAt(player.x, player.y, player.z, DEMO_INTERIOR);
    assert.equal(upperLoc.floor.label, 'First Floor');
    assert.equal(upperLoc.room?.name, 'First Floor Study Gallery');

    for (let i = 0; i < 180; i++) {
      stepPlayerPhysics(
        player,
        { moveForward: -1, moveRight: 0, cameraYaw: 0, sprint: false, jumpJustPressed: false },
        1 / 60,
        colliders,
        steps,
        DEMO_INTERIOR.bounds,
        0
      );
    }

    assert.ok(
      player.y < 0.15,
      `Expected player back on Ground Floor near y=0, got y=${player.y} (z=${player.z})`
    );
    assert.equal(getInteriorFloorAt(player.y, DEMO_INTERIOR).label, 'Ground Floor');
  });

  it('prevents Ground Floor jumps from clipping through or snapping onto First Floor slab', () => {
    const doorStates = buildInitialDoorStates(DEMO_INTERIOR);
    const colliders = buildInteriorRuntimeColliders(DEMO_INTERIOR, doorStates);
    const steps = buildInteriorStepSurfaces(DEMO_INTERIOR);
    const player = createInteriorSpawnState(DEMO_INTERIOR, doorStates);

    let maxHeadY = 0;
    for (let i = 0; i < 60; i++) {
      stepPlayerPhysics(
        player,
        {
          moveForward: 0,
          moveRight: 0,
          cameraYaw: 0,
          sprint: false,
          jumpJustPressed: i === 0,
        },
        1 / 60,
        colliders,
        steps,
        DEMO_INTERIOR.bounds,
        0
      );
      maxHeadY = Math.max(maxHeadY, player.y + PLAYER_HEIGHT);
    }

    assert.ok(maxHeadY <= 3.05, `Expected head below First Floor underside 3.04m, got ${maxHeadY}`);
    assert.equal(player.y, 0);
  });

  it('finds nearby door and exit interactions and safely resolves exterior return positions', () => {
    const doorStates = buildInitialDoorStates(DEMO_INTERIOR);

    const exitPrompt = findNearestInteriorInteraction(0, 0, 5.5, DEMO_INTERIOR, doorStates);
    assert.equal(exitPrompt?.kind, 'exit-interior');
    assert.equal(exitPrompt?.targetId, 'demo-door-exit');

    const semPrompt = findNearestInteriorInteraction(-4.2, 0, 2.0, DEMO_INTERIOR, doorStates);
    assert.equal(semPrompt?.kind, 'toggle-door');
    assert.equal(semPrompt?.targetId, 'demo-door-seminar');

    const camCols = buildInteriorCameraColliders(DEMO_INTERIOR, doorStates);
    assert.ok(camCols.some((c) => c.id === 'demo-roof-ceiling'));
    assert.ok(!camCols.some((c) => c.id === 'demo-floor-0'));

    const returnState = createExteriorReturnState(
      { x: 5.7, y: 0.04, z: 100.0, yaw: 0.5 },
      CAMPUS_COLLIDERS
    );
    assert.equal(returnState.y, 0.04);
    assert.equal(returnState.facingYaw, 0.5);
  });
});

describe('Phase 4 Campus Building Interiors & Portals', () => {
  it('registers all 10 campus buildings (incl. University Hall) + dev demo and 11 exterior portals with collision-free return anchors', () => {
    const registered = listRegisteredInteriors();
    assert.equal(registered.length, 11);
    assert.equal(CAMPUS_BUILDING_PORTALS.length, 11);

    for (const portal of CAMPUS_BUILDING_PORTALS) {
      const interior = getInteriorById(portal.buildingId);
      assert.ok(interior, `Missing registered interior for ${portal.buildingId}`);

      const nearby = findNearestExteriorPortal(portal.x, portal.z, false);
      assert.equal(nearby?.kind, 'enter-interior');
      assert.equal(nearby?.targetId, portal.buildingId);

      const ret = createExteriorReturnState(portal.returnAnchor, CAMPUS_COLLIDERS, CAMPUS_BOUNDS);
      assert.ok(
        Math.hypot(ret.x - portal.returnAnchor.x, ret.z - portal.returnAnchor.z) < 0.05,
        `Return anchor for ${portal.buildingId} collided with exterior obstacle`
      );
    }
  });

  it('has exactly 4 floors and allows climbing & descending all 4 floors via BOTH Front Curved Switchback Staircase and Rear Switchback Staircase', () => {
    assert.equal(ACADEMIC_BUILDING_INTERIOR.floors.length, 4);
    assert.deepEqual(
      ACADEMIC_BUILDING_INTERIOR.floors.map((f) => f.elevation),
      [0.0, 3.2, 6.4, 9.6]
    );

    const doorStates = buildInitialDoorStates(ACADEMIC_BUILDING_INTERIOR);
    const colliders = buildInteriorRuntimeColliders(ACADEMIC_BUILDING_INTERIOR, doorStates);
    const steps = buildInteriorStepSurfaces(ACADEMIC_BUILDING_INTERIOR);

    const walk = (p: ReturnType<typeof createInteriorSpawnState>, moveForward: number, moveRight: number, frames: number) => {
      for (let i = 0; i < frames; i++) {
        stepPlayerPhysics(
          p,
          { moveForward, moveRight, cameraYaw: 0, sprint: false, jumpJustPressed: false },
          1 / 60,
          colliders,
          steps,
          ACADEMIC_BUILDING_INTERIOR.bounds,
          0
        );
      }
    };

    // 1. FRONT CURVED SWITCHBACK STAIRCASE (center=(15.0, 23.6), r=2.55, located BEFORE classroom hallway X>=19.0)
    const walkCurvedFlight = (
      p: ReturnType<typeof createInteriorSpawnState>,
      clockwiseUp: boolean,
      maxFrames = 260
    ) => {
      const cx = 15.0;
      const cz = 23.6;
      const targetR = 2.55;
      for (let i = 0; i < maxFrames; i++) {
        const dx = p.x - cx;
        const dz = p.z - cz;
        const theta = Math.atan2(dz, dx);
        if (clockwiseUp && theta >= Math.PI * 0.80) {
          break;
        }
        if (!clockwiseUp && theta <= -Math.PI * 0.48 && theta >= -Math.PI * 0.75) {
          break;
        }
        const r = Math.hypot(dx, dz) || 1;
        const dirSign = clockwiseUp ? 1 : -1;
        // Clockwise unit tangent around (cx, cz) in XZ is (-dz/r, dx/r)
        let vx = dirSign * (-dz / r) + ((targetR - r) * (dx / r)) * 0.45;
        let vz = dirSign * (dx / r) + ((targetR - r) * (dz / r)) * 0.45;
        const vLen = Math.hypot(vx, vz) || 1;
        vx /= vLen;
        vz /= vLen;
        stepPlayerPhysics(
          p,
          { moveForward: -vz, moveRight: vx, cameraYaw: 0, sprint: false, jumpJustPressed: false },
          1 / 60,
          colliders,
          steps,
          ACADEMIC_BUILDING_INTERIOR.bounds,
          0
        );
      }
    };

    const frontPlayer = createInteriorSpawnState(ACADEMIC_BUILDING_INTERIOR, doorStates);
    // Start just north of curved stair entry (X: 15.0, Z: 20.6) -> climb 0 -> 3.2 -> 6.4 -> 9.6
    frontPlayer.x = 14.9;
    frontPlayer.z = 20.9;
    walkCurvedFlight(frontPlayer, true, 240);
    walk(frontPlayer, 0, -1, 45); // step West onto Floor 2 exit landing (X < 12.6)
    assert.ok(Math.abs(frontPlayer.y - 3.2) < 0.08, `Curved Stair Floor 2 (3.2m) failed: y=${frontPlayer.y}`);

    // Walk around north of stairwell cutout to re-enter curved flight on Floor 2 (14.8, 20.8)
    walk(frontPlayer, 1, 0, 75);
    walk(frontPlayer, 0, 1, 52);
    walk(frontPlayer, -1, 0, 52);
    walkCurvedFlight(frontPlayer, true, 240);
    walk(frontPlayer, 0, -1, 45);
    assert.ok(Math.abs(frontPlayer.y - 6.4) < 0.08, `Curved Stair Floor 3 (6.4m) failed: y=${frontPlayer.y}`);

    walk(frontPlayer, 1, 0, 75);
    walk(frontPlayer, 0, 1, 52);
    walk(frontPlayer, -1, 0, 52);
    walkCurvedFlight(frontPlayer, true, 240);
    walk(frontPlayer, 0, -1, 45);
    assert.ok(Math.abs(frontPlayer.y - 9.6) < 0.08, `Curved Stair Floor 4 (9.6m) failed: y=${frontPlayer.y}`);
    assert.equal(getInteriorFloorAt(frontPlayer.y, ACADEMIC_BUILDING_INTERIOR).level, 3);

    // Descend Curved Staircase 4 -> 3 -> 2 -> 1
    walk(frontPlayer, 0, 1, 50);
    walkCurvedFlight(frontPlayer, false, 240);
    walk(frontPlayer, 1, 0, 70);
    assert.ok(Math.abs(frontPlayer.y - 6.4) < 0.14, `Curved Stair descent to 3 failed: y=${frontPlayer.y}`);
    walk(frontPlayer, 0, -1, 45);
    walk(frontPlayer, -1, 0, 120);
    walk(frontPlayer, 0, 1, 45);
    walkCurvedFlight(frontPlayer, false, 240);
    walk(frontPlayer, 1, 0, 70);
    assert.ok(Math.abs(frontPlayer.y - 3.2) < 0.14, `Curved Stair descent to 2 failed: y=${frontPlayer.y}`);
    walk(frontPlayer, 0, -1, 45);
    walk(frontPlayer, -1, 0, 120);
    walk(frontPlayer, 0, 1, 45);
    walkCurvedFlight(frontPlayer, false, 240);
    walk(frontPlayer, 1, 0, 70);
    assert.ok(frontPlayer.y < 0.15, `Curved Stair descent to 1 failed: y=${frontPlayer.y}`);

    // 2. REAR 2-FLIGHT SWITCHBACK STAIRCASE AT VERY BACK (Z: -28.0..-20.5)
    // West lane x=-2.0 North (-20.8 -> -25.4) to Rear Half-Landing (-28..-25.4), East lane x=+2.0 South (-25.4 -> -20.8)
    const rearPlayer = createInteriorSpawnState(ACADEMIC_BUILDING_INTERIOR, doorStates);
    rearPlayer.x = -2.0;
    rearPlayer.z = -19.8;
    walk(rearPlayer, 1, 0, 145);
    assert.ok(Math.abs(rearPlayer.y - 1.6) < 0.08, `Rear Half-Landing (1.6m) failed: y=${rearPlayer.y}`);
    assert.ok(rearPlayer.z < -25.4, `Expected Rear Half-Landing at very back (z < -25.4), got z=${rearPlayer.z}`);

    walk(rearPlayer, 0, 1, 57);
    assert.ok(rearPlayer.x > 0.6 && rearPlayer.x < 3.4, `Expected Rear East lane, got x=${rearPlayer.x}`);
    walk(rearPlayer, -1, 0, 145);
    assert.ok(Math.abs(rearPlayer.y - 3.2) < 0.08, `Rear Stair Floor 2 (3.2m) failed: y=${rearPlayer.y}`);

    // Floor 2 -> Floor 3
    walk(rearPlayer, 0, -1, 57);
    walk(rearPlayer, 1, 0, 145);
    walk(rearPlayer, 0, 1, 57);
    walk(rearPlayer, -1, 0, 145);
    assert.ok(Math.abs(rearPlayer.y - 6.4) < 0.08, `Rear Stair Floor 3 (6.4m) failed: y=${rearPlayer.y}`);

    // Floor 3 -> Floor 4
    walk(rearPlayer, 0, -1, 57);
    walk(rearPlayer, 1, 0, 145);
    walk(rearPlayer, 0, 1, 57);
    walk(rearPlayer, -1, 0, 145);
    assert.ok(Math.abs(rearPlayer.y - 9.6) < 0.08, `Rear Stair Floor 4 (9.6m) failed: y=${rearPlayer.y}`);

    // Descend Rear Staircase 4 -> 3 -> 2 -> 1
    // Arrived on Floor 4 at East lane (x=+2.37, z=-16.59): descend East lane -> cross West -> descend West lane
    walk(rearPlayer, 1, 0, 145);
    walk(rearPlayer, 0, -1, 57);
    walk(rearPlayer, -1, 0, 155);
    assert.ok(Math.abs(rearPlayer.y - 6.4) < 0.14, `Rear Stair descent to 3 failed: y=${rearPlayer.y}`);
    // Arrived on Floor 3 at West lane (x=-2.0, z=-15.83): step East in corridor to East lane (+2.0), then descend
    walk(rearPlayer, 0, 1, 57);
    walk(rearPlayer, 1, 0, 145);
    walk(rearPlayer, 0, -1, 57);
    walk(rearPlayer, -1, 0, 155);
    assert.ok(Math.abs(rearPlayer.y - 3.2) < 0.14, `Rear Stair descent to 2 failed: y=${rearPlayer.y}`);
    // Arrived on Floor 2 at West lane (x=-2.0, z=-15.83): step East in corridor to East lane (+2.0), then descend
    walk(rearPlayer, 0, 1, 57);
    walk(rearPlayer, 1, 0, 145);
    walk(rearPlayer, 0, -1, 57);
    walk(rearPlayer, -1, 0, 165);
    assert.ok(rearPlayer.y < 0.15, `Rear Stair descent to 1 failed: y=${rearPlayer.y}`);
  });

  it('enforces Phase 4 Academic room placement: Dean on right of classroom hallway, 5 workshops on left ground floor, Nursing mannequins, very-back toilets, and Floor 2–4 layouts', () => {
    const roomsByFloor = (lvl: number) =>
      ACADEMIC_BUILDING_INTERIOR.rooms.filter((r) => r.floorLevel === lvl).map((r) => r.name);

    // Floor 1 Right Hallway (Basic Medical Sciences + Dean Office + Nursing/History/Physics/Chemistry + Records)
    const f1 = roomsByFloor(0);
    for (const expected of [
      'Reception & Main Lobby',
      'Dean of Basic Medical Sciences Office',
      'Medical Nursing Laboratory',
      'History Laboratory',
      'Mental and Child Nursing Laboratory',
      'Physics Laboratory',
      'Chemistry Laboratory',
      'Academic Records & Faculty Office',
      'Bathroom / Male Toilet',
      'Bathroom / Female Toilet',
      'Front Curved Staircase (Floor 1)',
      'Rear Staircase (Floor 1)',
      'Carpentry & Woodwork Workshop',
      'Mechanical Engineering Workshop',
      'Welding & Fabrication Workshop',
      'Electrical & Electronics Workshop',
      'Machine Shop (Workshop 5)',
      'Engineering Workshops Hallway & Rear Bypass',
    ]) {
      assert.ok(f1.includes(expected), `Missing Floor 1 room: ${expected}`);
    }

    // Dean of BMS Office sits strictly on the RIGHT (+X) of the long Classroom Hallway (19.0..22.8)
    const deanRoom = ACADEMIC_BUILDING_INTERIOR.rooms.find(
      (r) => r.floorLevel === 0 && r.name === 'Dean of Basic Medical Sciences Office'
    );
    assert.ok(deanRoom && deanRoom.minX >= 22.8 && deanRoom.maxX === 34.0);

    // Left ground-floor wing houses ONLY Engineering Workshops + Tool Store + Rear Bypass (NO ordinary classrooms/labs!)
    const leftGroundBadRooms = ACADEMIC_BUILDING_INTERIOR.rooms.filter(
      (r) => r.floorLevel === 0 && r.maxX <= -17.5 && (r.kind === 'lecture-room' || r.kind === 'lab')
    );
    assert.equal(leftGroundBadRooms.length, 0, 'Left ground floor must NOT hold ordinary classrooms or science labs');

    // Nursing mannequins in both Medical Nursing Lab & Mental and Child Nursing Lab
    const mannequins = ACADEMIC_BUILDING_INTERIOR.furniture.filter(
      (f) => f.kind === 'nursing-mannequin'
    );
    assert.ok(mannequins.length >= 2, 'Expected nursing mannequins in both Nursing Laboratories');

    // Floor 2
    const f2 = roomsByFloor(1);
    for (const expected of [
      'Theatre',
      'Computer Workshop',
      'Classroom 201',
      'Computer Laboratory',
      'Computer Engineering Department',
      'Civil Engineering Department',
      'Laboratory',
      'Toilet Facilities',
      'Library',
      'Engineering Drawing Studio',
      'E-library',
      'Classroom 202',
      'Lecture Hall 1',
      'Lecture Hall 2',
      'Entrepreneurship Lecture Hall',
      'Lecture Hall 3',
      'Male Toilet',
      'Female Toilet',
      'Front Curved Staircase (Floor 2)',
      'Rear Staircase (Floor 2)',
    ]) {
      assert.ok(f2.includes(expected), `Missing Floor 2 room: ${expected}`);
    }

    // Floor 3 (School of Engineering)
    const f3 = roomsByFloor(2);
    for (let i = 1; i <= 8; i++) {
      assert.ok(f3.includes(`Staff Office 30${i}`), `Missing Staff Office 30${i}`);
    }
    assert.ok(f3.includes('Staff Office Toilet 1') && f3.includes('Staff Office Toilet 2'));
    for (const expected of [
      '100-level General Lecture Hall',
      '400-level Mechanical Engineering Classroom (CI)',
      '400-level Civil Engineering Classroom (C3)',
      '500-level Civil Engineering Classroom (C4)',
      '400-level Computer Engineering Classroom (C5)',
      'Engineering Classroom C2',
      'Engineering Classroom C6',
    ]) {
      assert.ok(f3.includes(expected), `Missing Floor 3 room: ${expected}`);
    }

    // Floor 4 (Mass Communication)
    const f4 = roomsByFloor(3);
    for (const expected of [
      'Mass Communication Department',
      'Radio Station',
      'Library (Mass Communication)',
      '100-level Classroom A (Under Construction)',
      '100-level Classroom B (Under Construction)',
      'Male Toilet',
      'Female Toilet',
      'Front Curved Staircase (Floor 4)',
      'Rear Staircase (Floor 4)',
    ]) {
      assert.ok(f4.includes(expected), `Missing Floor 4 room: ${expected}`);
    }

    // Rear Staircase & Male/Female Toilets positioned strictly at VERY BACK (Z: -28.0..-20.5)
    for (let lvl = 0; lvl < 4; lvl++) {
      const elev = lvl * 3.2;
      const male = getInteriorRoomAt(-7.75, elev, -24.0, ACADEMIC_BUILDING_INTERIOR).room;
      const stair = getInteriorRoomAt(0.0, elev, -24.0, ACADEMIC_BUILDING_INTERIOR).room;
      const female = getInteriorRoomAt(7.75, elev, -24.0, ACADEMIC_BUILDING_INTERIOR).room;
      assert.ok(male?.name.includes('Male Toilet'));
      assert.ok(stair?.name.startsWith('Rear Staircase'));
      assert.ok(female?.name.includes('Female Toilet'));

      const midCenter = getInteriorRoomAt(0.0, elev, -15.0, ACADEMIC_BUILDING_INTERIOR).room;
      assert.ok(!midCenter?.name.startsWith('Rear Staircase'), 'Rear staircase must sit at very back Z <= -20.5, not z = -15');
    }

    // Floor 4 Under Construction right-wing uses raw concrete walls & construction barriers
    assert.ok(
      ACADEMIC_BUILDING_INTERIOR.surfaces.some((s) => s.id.includes('f3-uc') && s.color === '#969DA3'),
      'Expected raw concrete walls in Floor 4 under-construction wing'
    );
    assert.ok(
      ACADEMIC_BUILDING_INTERIOR.furniture.filter((f) => f.kind === 'construction-barrier').length >= 3,
      'Expected safety construction barriers in Floor 4 under-construction classrooms'
    );
  });

  it('supports Administrative Building (2 floors), Cafeteria & Fellowship Hall (2 floors), Clinic, and all 5 Workshops', () => {
    // Administrative Building stair climb 0 -> 1
    {
      const doors = buildInitialDoorStates(ADMINISTRATIVE_BUILDING_INTERIOR);
      const cols = buildInteriorRuntimeColliders(ADMINISTRATIVE_BUILDING_INTERIOR, doors);
      const steps = buildInteriorStepSurfaces(ADMINISTRATIVE_BUILDING_INTERIOR);
      const p = createInteriorSpawnState(ADMINISTRATIVE_BUILDING_INTERIOR, doors);
      p.x = 9.6;
      p.z = 6.2;
      for (let i = 0; i < 175; i++) {
        stepPlayerPhysics(
          p,
          { moveForward: 1, moveRight: 0, cameraYaw: 0, sprint: false, jumpJustPressed: false },
          1 / 60,
          cols,
          steps,
          ADMINISTRATIVE_BUILDING_INTERIOR.bounds,
          0
        );
      }
      assert.ok(Math.abs(p.y - 3.2) < 0.08, `Admin Floor 1 expected 3.2m, got ${p.y}`);
      assert.equal(getInteriorFloorAt(p.y, ADMINISTRATIVE_BUILDING_INTERIOR).label, 'First Floor');
    }

    // Cafeteria stair climb 0 -> Upper Fellowship Hall
    {
      const doors = buildInitialDoorStates(CAFETERIA_INTERIOR);
      const cols = buildInteriorRuntimeColliders(CAFETERIA_INTERIOR, doors);
      const steps = buildInteriorStepSurfaces(CAFETERIA_INTERIOR);
      const p = createInteriorSpawnState(CAFETERIA_INTERIOR, doors);
      assert.equal(
        getInteriorRoomAt(p.x, p.y, p.z, CAFETERIA_INTERIOR).room?.name,
        'Campus Cafeteria & Dining Hall'
      );
      p.x = 10.5;
      p.z = 6.4;
      for (let i = 0; i < 175; i++) {
        stepPlayerPhysics(
          p,
          { moveForward: 1, moveRight: 0, cameraYaw: 0, sprint: false, jumpJustPressed: false },
          1 / 60,
          cols,
          steps,
          CAFETERIA_INTERIOR.bounds,
          0
        );
      }
      assert.ok(Math.abs(p.y - 3.2) < 0.08, `Fellowship Floor 1 expected 3.2m, got ${p.y}`);
      for (let i = 0; i < 90; i++) {
        stepPlayerPhysics(
          p,
          { moveForward: 0, moveRight: -1, cameraYaw: 0, sprint: false, jumpJustPressed: false },
          1 / 60,
          cols,
          steps,
          CAFETERIA_INTERIOR.bounds,
          0
        );
      }
      assert.equal(
        getInteriorRoomAt(p.x, p.y, p.z, CAFETERIA_INTERIOR).room?.name,
        'Upper Floor Fellowship Hall'
      );
    }

    // Campus Clinic reception & medical rooms
    {
      const doors = buildInitialDoorStates(CLINIC_INTERIOR);
      const p = createInteriorSpawnState(CLINIC_INTERIOR, doors);
      assert.equal(
        getInteriorRoomAt(p.x, p.y, p.z, CLINIC_INTERIOR).room?.name,
        'Clinic Reception & Waiting Area'
      );
      assert.equal(
        getInteriorRoomAt(-8.3, 0, -4.0, CLINIC_INTERIOR).room?.name,
        'Consultation Room 1'
      );
      assert.equal(
        getInteriorRoomAt(2.8, 0, -4.0, CLINIC_INTERIOR).room?.name,
        'Treatment & Observation Room'
      );
    }

    // University Hall (Ground Foyer, Raised Stage & Upper Balcony via Staircase)
    {
      const doors = buildInitialDoorStates(UNIVERSITY_HALL_INTERIOR);
      const cols = buildInteriorRuntimeColliders(UNIVERSITY_HALL_INTERIOR, doors);
      const steps = buildInteriorStepSurfaces(UNIVERSITY_HALL_INTERIOR);
      const p = createInteriorSpawnState(UNIVERSITY_HALL_INTERIOR, doors);
      assert.equal(
        getInteriorRoomAt(p.x, p.y, p.z, UNIVERSITY_HALL_INTERIOR).room?.name,
        'University Hall Entrance Foyer'
      );
      assert.equal(
        getInteriorRoomAt(0, 0.48, -5.0, UNIVERSITY_HALL_INTERIOR).room?.name,
        'University Hall Ceremonial Stage'
      );
      p.x = 9.8;
      p.z = 1.6;
      for (let i = 0; i < 225; i++) {
        stepPlayerPhysics(
          p,
          { moveForward: -1, moveRight: 0, cameraYaw: 0, sprint: false, jumpJustPressed: false },
          1 / 60,
          cols,
          steps,
          UNIVERSITY_HALL_INTERIOR.bounds,
          0
        );
      }
      assert.ok(Math.abs(p.y - 3.4) < 0.08, `University Hall Balcony expected 3.4m, got ${p.y}`);
      assert.equal(getInteriorFloorAt(p.y, UNIVERSITY_HALL_INTERIOR).label, 'First Floor Gallery');
      assert.equal(
        getInteriorRoomAt(-2.0, p.y, 4.0, UNIVERSITY_HALL_INTERIOR).room?.name,
        'Upper Gallery Balcony'
      );
    }

    // All 5 Engineering Workshops
    assert.equal(ALL_WORKSHOP_INTERIORS.length, 5);
    for (const workshop of ALL_WORKSHOP_INTERIORS) {
      const doors = buildInitialDoorStates(workshop);
      const p = createInteriorSpawnState(workshop, doors);
      assert.equal(p.y, 0);
      assert.equal(getInteriorRoomAt(p.x, p.y, p.z, workshop).room?.name, workshop.name);
      const exitPrompt = findNearestInteriorInteraction(
        0,
        0,
        workshop.bounds.maxZ - 0.8,
        workshop,
        doors
      );
      assert.equal(exitPrompt?.kind, 'exit-interior');
    }
  });

  it('enforces enclosed Reception blocking direct walk/sightline, open-to-sky Courtyard (NO benches) & East Lightwells, double-railed galleries, and direct Workshop Rear Passage', () => {
    assert.equal(ACADEMIC_BUILDING_INTERIOR.hasOpenCourtyard, true);
    const cy = ACADEMIC_BUILDING_INTERIOR.courtyardBounds!;
    assert.ok(cy && cy.maxX - cy.minX >= 20 && cy.maxZ - cy.minZ >= 15);

    // 1. Verify Central Courtyard contains ZERO sitting benches
    const benchesInCourtyard = ACADEMIC_BUILDING_INTERIOR.furniture.filter(
      (f) =>
        (f.kind === 'bench' || f.kind === 'sofa-bench') &&
        f.x >= cy.minX &&
        f.x <= cy.maxX &&
        f.z >= cy.minZ &&
        f.z <= cy.maxZ
    );
    assert.equal(benchesInCourtyard.length, 0, 'Central Courtyard must NOT contain sitting benches');

    // 2. Verify NO ceiling or upper floor slab covers EITHER Central Courtyard OR East Lightwells
    const lightwells = [
      { minX: 16.5, maxX: 19.0, minZ: -9.0, maxZ: -2.0 },
      { minX: 16.5, maxX: 19.0, minZ: 0.0, maxZ: 7.0 },
    ];
    for (const voidBox of [cy, ...lightwells]) {
      const innerMinX = voidBox.minX + 0.4;
      const innerMaxX = voidBox.maxX - 0.4;
      const innerMinZ = voidBox.minZ + 0.4;
      const innerMaxZ = voidBox.maxZ - 0.4;
      for (const s of ACADEMIC_BUILDING_INTERIOR.surfaces) {
        if (s.role === 'ceiling' || (s.role === 'floor' && s.y > 0.5)) {
          const sMinX = s.x - s.width / 2;
          const sMaxX = s.x + s.width / 2;
          const sMinZ = s.z - s.depth / 2;
          const sMaxZ = s.z + s.depth / 2;
          const overlapsVoid =
            sMaxX > innerMinX && sMinX < innerMaxX && sMaxZ > innerMinZ && sMinZ < innerMaxZ;
          assert.equal(
            overlapsVoid,
            false,
            `Upper floor/ceiling surface ${s.id} covers open void (${voidBox.minX}..${voidBox.maxX})`
          );
        }
      }
    }

    // 3. Enclosed Reception solid rear wall blocks walking straight north from spawn into Central Courtyard
    const doorStates = buildInitialDoorStates(ACADEMIC_BUILDING_INTERIOR);
    const colliders = buildInteriorRuntimeColliders(ACADEMIC_BUILDING_INTERIOR, doorStates);
    const camCols = buildInteriorCameraColliders(ACADEMIC_BUILDING_INTERIOR, doorStates);
    const steps = buildInteriorStepSurfaces(ACADEMIC_BUILDING_INTERIOR);

    const blockedPlayer = createInteriorSpawnState(ACADEMIC_BUILDING_INTERIOR, doorStates);
    for (let i = 0; i < 120; i++) {
      stepPlayerPhysics(
        blockedPlayer,
        { moveForward: 1, moveRight: 0, cameraYaw: 0, sprint: true, jumpJustPressed: false },
        1 / 60,
        colliders,
        steps,
        ACADEMIC_BUILDING_INTERIOR.bounds,
        0
      );
    }
    assert.ok(
      blockedPlayer.z >= 15.14,
      `Expected enclosed Reception rear wall (z=15.0) to block straight-ahead walk, got z=${blockedPlayer.z}`
    );

    // 4. Walking around Reception via the Left Workshop Corridor reaches Engineering Workshops Hallway & Rear Bypass
    const corridorPlayer = createInteriorSpawnState(ACADEMIC_BUILDING_INTERIOR, doorStates);
    corridorPlayer.x = -20.5;
    corridorPlayer.z = 22.0;
    for (let i = 0; i < 180; i++) {
      stepPlayerPhysics(
        corridorPlayer,
        { moveForward: 1, moveRight: 0, cameraYaw: 0, sprint: true, jumpJustPressed: false },
        1 / 60,
        colliders,
        steps,
        ACADEMIC_BUILDING_INTERIOR.bounds,
        0
      );
    }
    const galLoc = getInteriorRoomAt(corridorPlayer.x, corridorPlayer.y, corridorPlayer.z, ACADEMIC_BUILDING_INTERIOR);
    assert.equal(galLoc.room?.name, 'Engineering Workshops Hallway & Rear Bypass');

    // 5. Burglary railings on BOTH sides of East Corridor & around Courtyard collide with player, never block camera
    const burglaryRails = ACADEMIC_BUILDING_INTERIOR.surfaces.filter(
      (s) => s.role === 'railing' && s.railingStyle === 'burglary'
    );
    assert.ok(burglaryRails.length >= 40, 'Expected burglary railings across Courtyard & East Lightwell corridors');
    assert.ok(burglaryRails.some((r) => r.id.startsWith('acad-lw-rail-1-wn')));
    assert.ok(burglaryRails.some((r) => r.id.startsWith('acad-lw-rail-1-en')));
    for (const rail of burglaryRails) {
      assert.ok(rail.height <= 1.15 && rail.height >= 0.9);
      assert.equal(rail.collides, true);
      assert.equal(rail.blocksCamera, false);
      assert.equal(
        camCols.some((c) => c.id === rail.id),
        false,
        `Burglary railing ${rail.id} should not block 3rd-person camera`
      );
    }

    // Upper West gallery corridor railing blocks falling into courtyard void
    const upperGalPlayer = createInteriorSpawnState(ACADEMIC_BUILDING_INTERIOR, doorStates);
    upperGalPlayer.x = -14.5;
    upperGalPlayer.y = 3.2;
    upperGalPlayer.z = 0.0;
    for (let i = 0; i < 90; i++) {
      stepPlayerPhysics(
        upperGalPlayer,
        { moveForward: 0, moveRight: 1, cameraYaw: 0, sprint: false, jumpJustPressed: false },
        1 / 60,
        colliders,
        steps,
        ACADEMIC_BUILDING_INTERIOR.bounds,
        0
      );
    }
    assert.ok(
      upperGalPlayer.x < cy.minX,
      `Expected Floor 2 West burglary railing to hold player inside gallery (x < ${cy.minX}), got x=${upperGalPlayer.x}`
    );

    // 6. Direct Workshop Rear Passage portal spawns inside passage & exits back to Covered Passage (z < -90)
    const rearPortal = CAMPUS_BUILDING_PORTALS.find((p) => p.id === 'portal-academic-rear-passage');
    assert.ok(rearPortal && rearPortal.entrySpawn);
    const rearEntry = createInteriorSpawnState(
      ACADEMIC_BUILDING_INTERIOR,
      doorStates,
      rearPortal.entrySpawn
    );
    assert.equal(
      getInteriorRoomAt(rearEntry.x, rearEntry.y, rearEntry.z, ACADEMIC_BUILDING_INTERIOR).room?.name,
      'Engineering Workshops Hallway & Rear Bypass'
    );
    const rearExitPrompt = findNearestInteriorInteraction(
      rearEntry.x,
      rearEntry.y,
      -27.2,
      ACADEMIC_BUILDING_INTERIOR,
      doorStates
    );
    assert.equal(rearExitPrompt?.kind, 'exit-interior');
    assert.equal(rearExitPrompt?.targetId, 'acad-door-workshop-exit');
    assert.ok(rearExitPrompt?.returnAnchor && rearExitPrompt.returnAnchor.z < -90);
  });
});
