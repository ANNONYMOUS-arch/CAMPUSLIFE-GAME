import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  MINIMAP_BUILDINGS,
  MINIMAP_HEIGHT,
  MINIMAP_ROAD_GEOMETRY,
  MINIMAP_SPORTS_COURTS,
  MINIMAP_WIDTH,
  getMinimapHeadingDegrees,
  projectCampusPoint,
  resolveExteriorPlayerCoords,
} from './campusMinimap';
import { PLAYER_SPAWN } from './campusData';
import { ROUNDABOUT_CENTER } from './campusRoad';

describe('Campus Mini-Map Projection & Layout Geometry', () => {
  it('projects key campus landmarks with North=-Z up and East=+X right ordering', () => {
    const gateSpawn = projectCampusPoint(PLAYER_SPAWN.x, PLAYER_SPAWN.z);
    const roundabout = projectCampusPoint(ROUNDABOUT_CENTER.x, ROUNDABOUT_CENTER.z);
    const academic = projectCampusPoint(0, -62);
    const seniorHostel = projectCampusPoint(-64, -197);

    assert.equal(gateSpawn.clamped, false);
    assert.equal(roundabout.clamped, false);
    assert.equal(academic.clamped, false);
    assert.equal(seniorHostel.clamped, false);

    // North (-Z) is smaller svgY than South (+Z)
    assert.ok(seniorHostel.svgY < academic.svgY);
    assert.ok(academic.svgY < roundabout.svgY);
    assert.ok(roundabout.svgY < gateSpawn.svgY);

    // West (-X) is smaller svgX than East (+X)
    assert.ok(seniorHostel.svgX < academic.svgX);
    assert.ok(academic.svgX < gateSpawn.svgX);
  });

  it('clamps out-of-bounds positions safely inside the SVG viewport', () => {
    const farNorthWest = projectCampusPoint(-500, -500);
    const farSouthEast = projectCampusPoint(500, 500);

    assert.equal(farNorthWest.clamped, true);
    assert.equal(farSouthEast.clamped, true);
    assert.ok(farNorthWest.svgX > 0 && farNorthWest.svgY > 0);
    assert.ok(farSouthEast.svgX < MINIMAP_WIDTH && farSouthEast.svgY < MINIMAP_HEIGHT);
  });

  it('converts player facingYaw into clockwise SVG heading degrees', () => {
    assert.equal(getMinimapHeadingDegrees(0), 0); // North (-Z) -> Up
    assert.equal(getMinimapHeadingDegrees(Math.PI / 2), -90); // West (-X) -> Left
    assert.equal(getMinimapHeadingDegrees(-Math.PI / 2), 90); // East (+X) -> Right
    assert.equal(Math.abs(getMinimapHeadingDegrees(Math.PI)), 180); // South (+Z) -> Down
  });

  it('anchors interior players onto their exterior campus building coordinates', () => {
    const ext = resolveExteriorPlayerCoords({
      worldMode: 'exterior',
      posX: 12,
      posZ: 48,
      exteriorAnchor: { x: 0, z: -30.8 },
    });
    assert.deepEqual(ext, { x: 12, z: 48 });

    const inside = resolveExteriorPlayerCoords({
      worldMode: 'interior',
      posX: 24,
      posZ: 5,
      exteriorAnchor: { x: 0, z: -30.8 },
    });
    assert.deepEqual(inside, { x: 0, z: -30.8 });
  });

  it('keeps all building footprints, sports courts, and Bezier polylines inside minimap bounds', () => {
    for (const rect of [...MINIMAP_BUILDINGS, ...MINIMAP_SPORTS_COURTS]) {
      assert.ok(rect.x >= 0 && rect.x + rect.width <= MINIMAP_WIDTH, `${rect.id} X out of bounds`);
      assert.ok(rect.y >= 0 && rect.y + rect.height <= MINIMAP_HEIGHT, `${rect.id} Y out of bounds`);
      assert.ok(rect.width > 0 && rect.height > 0, `${rect.id} invalid size`);
    }

    assert.ok(MINIMAP_ROAD_GEOMETRY.westBendPolyline.split(' ').length > 10);
    assert.ok(MINIMAP_ROAD_GEOMETRY.eastBendPolyline.split(' ').length > 10);
  });
});
