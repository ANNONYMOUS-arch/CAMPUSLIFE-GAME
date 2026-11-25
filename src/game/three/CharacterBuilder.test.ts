import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  BODY_BUILD_OPTIONS,
  BOTTOM_STYLE_OPTIONS,
  DEFAULT_CHARACTER,
  DRESS_STYLE_OPTIONS,
  FOOTWEAR_STYLE_OPTIONS,
  GENDER_OPTIONS,
  GLASSES_STYLE_OPTIONS,
  HAIR_STYLE_OPTIONS,
  HAT_STYLE_OPTIONS,
  TOP_STYLE_OPTIONS,
} from '../state/persistence';
import {
  animateCharacterRig,
  animateNpcCharacterRig,
  buildCharacterRig,
} from './CharacterBuilder';

test('default character rig builds grounded anatomical hierarchy within human height bounds', () => {
  const rig = buildCharacterRig(DEFAULT_CHARACTER);
  rig.root.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(rig.root);
  const height = box.max.y - box.min.y;

  // Feet soles touch y=0 within 1cm and total height is ~1.7-1.8m
  assert.ok(Math.abs(box.min.y) < 0.015, `Expected grounded feet near y=0, got min.y=${box.min.y}`);
  assert.ok(height > 1.65 && height < 1.95, `Expected realistic human height, got ${height}`);

  // Verify articulated joints exist
  assert.ok(rig.leftElbowPivot && rig.rightElbowPivot);
  assert.ok(rig.leftKneePivot && rig.rightKneePivot);

  // Verify animation steps cleanly without NaN
  animateCharacterRig(rig, 0.016, 4.5, true, true, 0, 1.0);
  assert.ok(Number.isFinite(rig.leftKneePivot.rotation.x));
  assert.ok(Number.isFinite(rig.rightElbowPivot.rotation.x));

  // Verify NPC animation poses (walking, idle, talking, sitting)
  for (const pose of ['walking', 'idle', 'talking', 'sitting'] as const) {
    for (let i = 0; i < 40; i++) {
      animateNpcCharacterRig(rig, 0.033, {
        pose,
        horizontalSpeed: pose === 'walking' ? 1.55 : 0,
        elapsedTime: i * 0.033,
        phaseOffset: 0.4,
        seatHipY: 0.54,
      });
    }
    assert.ok(Number.isFinite(rig.hips.position.y));
    assert.ok(Number.isFinite(rig.leftLegPivot.rotation.x));
    assert.ok(Number.isFinite(rig.leftKneePivot.rotation.x));
    assert.ok(Number.isFinite(rig.rightArmPivot.rotation.x));
    if (pose === 'sitting') {
      assert.ok(rig.hips.position.y < 0.62, `Expected seated hip drop, got ${rig.hips.position.y}`);
      assert.ok(rig.leftLegPivot.rotation.x > 1.2, 'Expected thighs raised forward when sitting');
      assert.ok(rig.leftKneePivot.rotation.x < -1.2, 'Expected shins vertical when sitting');
    }
  }

  rig.dispose();
});

test('all hairstyles, body builds, tops, bottoms, dresses, genders, footwear, and hats build and dispose cleanly', () => {
  for (const hair of HAIR_STYLE_OPTIONS) {
    const rig = buildCharacterRig({
      ...DEFAULT_CHARACTER,
      hairStyle: hair.id,
      hatStyle: 'baseball-cap',
      glassesStyle: 'round',
      hasWatch: true,
      hasNecklace: true,
      hasEarrings: true,
      hasBackpack: true,
    });
    assert.ok(rig.root.children.length > 0, `Hair ${hair.id} should build cleanly`);
    rig.dispose();
  }

  for (const gender of GENDER_OPTIONS) {
    for (const dress of DRESS_STYLE_OPTIONS) {
      const rig = buildCharacterRig({
        ...DEFAULT_CHARACTER,
        gender: gender.id,
        dressStyle: dress.id,
        dressColor: '#1E4C7A',
      });
      rig.root.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(rig.root);
      assert.ok(Math.abs(box.min.y) < 0.015, `Gender ${gender.id} / Dress ${dress.id} grounded`);
      assert.ok(box.max.y > 1.65 && box.max.y < 1.95, `Gender ${gender.id} / Dress ${dress.id} height valid`);
      animateCharacterRig(rig, 0.016, 3.5, false, true, 0, 0.5);
      rig.dispose();
    }
  }

  for (const build of BODY_BUILD_OPTIONS) {
    for (const top of TOP_STYLE_OPTIONS) {
      const rig = buildCharacterRig({
        ...DEFAULT_CHARACTER,
        bodyBuild: build.id,
        topStyle: top.id,
        bottomStyle: BOTTOM_STYLE_OPTIONS[0].id,
        footwearStyle: FOOTWEAR_STYLE_OPTIONS[0].id,
      });
      rig.root.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(rig.root);
      assert.ok(box.max.y > 1.65, `Build ${build.id} / Top ${top.id} height valid`);
      rig.dispose();
    }
  }

  for (const bottom of BOTTOM_STYLE_OPTIONS) {
    for (const shoe of FOOTWEAR_STYLE_OPTIONS) {
      for (const glasses of GLASSES_STYLE_OPTIONS) {
        for (const hat of HAT_STYLE_OPTIONS) {
          const rig = buildCharacterRig({
            ...DEFAULT_CHARACTER,
            bottomStyle: bottom.id,
            footwearStyle: shoe.id,
            glassesStyle: glasses.id,
            hatStyle: hat.id,
          });
          assert.ok(rig.root.children.length > 0);
          rig.dispose();
        }
      }
    }
  }
});
