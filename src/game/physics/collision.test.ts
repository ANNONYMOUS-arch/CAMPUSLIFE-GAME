import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialPlayerState,
  getGroundElevationAt,
  overlapsColliderXZ,
  resolveCameraObstruction,
  stepPlayerPhysics,
} from './collision';
import { CAMPUS_COLLIDERS, getCampusZoneAt, PLAYER_SPAWN } from '../world/campusData';

test('spawn position is collision-free and starts in University Main Gate zone', () => {
  const player = createInitialPlayerState();
  assert.equal(player.x, PLAYER_SPAWN.x);
  assert.equal(player.z, PLAYER_SPAWN.z);
  assert.equal(player.grounded, true);

  for (const col of CAMPUS_COLLIDERS) {
    assert.equal(
      overlapsColliderXZ(player.x, player.y, player.z, 0.42, 1.72, col),
      false,
      `Spawn should not overlap collider ${col.id}`
    );
  }

  const zone = getCampusZoneAt(player.x, player.z);
  assert.equal(zone.name, 'University Main Gate');
});

test('walking forward from spawn passes cleanly through Main Gate into Campus Main Avenue', () => {
  const player = createInitialPlayerState();
  // Simulate 4 seconds of sprinting straight ahead (-Z) at 60Hz from z=125
  for (let i = 0; i < 240; i++) {
    stepPlayerPhysics(
      player,
      {
        moveForward: 1,
        moveRight: 0,
        cameraYaw: 0,
        sprint: true,
        jumpJustPressed: false,
      },
      1 / 60
    );
  }

  assert.ok(player.z < 105, `Expected player to pass through Main Gate (z < 105), got z=${player.z}`);
  assert.equal(getCampusZoneAt(player.x, player.z).name, 'Campus Main Avenue');
});

test('player collides and slides smoothly against Academic Building without tunneling', () => {
  const player = createInitialPlayerState();
  player.x = -10.0;
  player.z = -31.5;
  player.y = getGroundElevationAt(player.x, player.z);

  // Walk diagonally into Academic Building south wall (maxZ = -34.0)
  for (let i = 0; i < 90; i++) {
    stepPlayerPhysics(
      player,
      {
        moveForward: 1,
        moveRight: 0.7,
        cameraYaw: 0,
        sprint: false,
        jumpJustPressed: false,
      },
      1 / 60
    );
  }

  // Should slide along +X while stopped outside Academic Building south wall
  assert.ok(player.z >= -34.0, `Player tunneled into Academic Building: z=${player.z}`);
  assert.ok(player.x > -9.0, `Player failed to slide laterally along wall: x=${player.x}`);
});

test('jumping lifts player into air and lands cleanly back on campus ground', () => {
  const player = createInitialPlayerState();
  const resJump = stepPlayerPhysics(
    player,
    { moveForward: 0, moveRight: 0, cameraYaw: 0, sprint: false, jumpJustPressed: true },
    1 / 60
  );
  assert.equal(resJump.jumped, true);
  assert.equal(player.grounded, false);
  assert.ok(player.y > 0.1);

  let landedObserved = false;
  for (let i = 0; i < 120; i++) {
    const res = stepPlayerPhysics(
      player,
      { moveForward: 0, moveRight: 0, cameraYaw: 0, sprint: false, jumpJustPressed: false },
      1 / 60
    );
    if (res.landed) landedObserved = true;
  }

  assert.equal(landedObserved, true);
  assert.equal(player.grounded, true);
  assert.ok(Math.abs(player.y - 0.04) < 0.001);
});

test('camera obstruction ray pulls camera forward in front of solid buildings', () => {
  // Anchor in front of Academic Building looking north, desired camera inside Academic Building (z = -42)
  const pulled = resolveCameraObstruction(-10.0, 1.5, -30.0, -10.0, 2.5, -42.0);
  assert.ok(pulled.z > -34.5, `Expected camera to pull in front of Academic wall, got z=${pulled.z}`);
});
