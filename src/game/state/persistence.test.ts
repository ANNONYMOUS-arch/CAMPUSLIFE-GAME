import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyGenderPresetDefaults,
  createRandomCharacter,
  DEFAULT_CHARACTER,
  DEFAULT_SETTINGS,
  sanitizeCharacter,
  sanitizeSettings,
  validateCharacterIdentity,
} from './persistence';

test('sanitizeCharacter restores safe defaults for corrupted or invalid fields', () => {
  const clean = sanitizeCharacter({
    gender: 'other',
    studentName: '   ',
    skinTone: 'not-a-hex',
    bodyBuild: 'giant',
    faceShape: 'triangle',
    hairStyle: 'unknown-style',
    dressStyle: 'ballgown-unknown',
    topStyle: 'spacesuit',
    bottomStyle: 'cape',
    footwearStyle: 'rollerblades',
    glassesStyle: 'monocle',
    hatStyle: 'crown',
    hasBackpack: 'yes',
  });

  assert.equal(clean.gender, DEFAULT_CHARACTER.gender);
  assert.equal(clean.studentName, DEFAULT_CHARACTER.studentName);
  assert.equal(clean.skinTone, DEFAULT_CHARACTER.skinTone);
  assert.equal(clean.bodyBuild, DEFAULT_CHARACTER.bodyBuild);
  assert.equal(clean.faceShape, DEFAULT_CHARACTER.faceShape);
  assert.equal(clean.hairStyle, DEFAULT_CHARACTER.hairStyle);
  assert.equal(clean.dressStyle, DEFAULT_CHARACTER.dressStyle);
  assert.equal(clean.topStyle, DEFAULT_CHARACTER.topStyle);
  assert.equal(clean.bottomStyle, DEFAULT_CHARACTER.bottomStyle);
  assert.equal(clean.footwearStyle, DEFAULT_CHARACTER.footwearStyle);
  assert.equal(clean.glassesStyle, DEFAULT_CHARACTER.glassesStyle);
  assert.equal(clean.hatStyle, DEFAULT_CHARACTER.hatStyle);
  assert.equal(clean.hasBackpack, DEFAULT_CHARACTER.hasBackpack);
});

test('sanitizeCharacter migrates Phase 1 legacy hair, glasses, gender, and nickname without overwriting studentName', () => {
  const migratedBraids = sanitizeCharacter({
    studentName: 'Adaeze Nwosu',
    hairStyle: 'braids',
    hasGlasses: true,
  });
  assert.equal(migratedBraids.studentName, 'Adaeze Nwosu');
  assert.equal(migratedBraids.nickname, 'Adaeze');
  assert.equal(migratedBraids.gender, 'female');
  assert.equal(migratedBraids.hairStyle, 'box-braids');
  assert.equal(migratedBraids.glassesStyle, 'rectangular');

  const migratedHijab = sanitizeCharacter({
    studentName: 'Amina Yusuf',
    hairStyle: 'hijab',
    hasGlasses: false,
  });
  assert.equal(migratedHijab.studentName, 'Amina Yusuf');
  assert.equal(migratedHijab.nickname, 'Amina');
  assert.equal(migratedHijab.gender, 'female');
  assert.equal(migratedHijab.hairStyle, 'hijab-classic');
  assert.equal(migratedHijab.glassesStyle, 'none');
});

test('sanitizeCharacter preserves all valid expanded customization, gender, nickname, and dress values', () => {
  const custom = sanitizeCharacter({
    gender: 'female',
    studentName: 'Chidinma Okafor',
    nickname: 'ChiChi',
    skinTone: '#4F2D1D',
    bodyBuild: 'curvy',
    faceShape: 'heart',
    eyeShape: 'almond',
    noseShape: 'aquiline',
    mouthShape: 'warm-smile',
    facialDetail: 'freckles-beauty',
    hairStyle: 'box-braids',
    hairColor: '#171516',
    dressStyle: 'ankara-gown',
    dressColor: '#1E4C7A',
    topStyle: 'ankara-top',
    shirtColor: '#D49A22',
    bottomStyle: 'midi-skirt',
    trouserColor: '#1B2A44',
    footwearStyle: 'sandals',
    shoeColor: '#8A5634',
    glassesStyle: 'sunglasses',
    hatStyle: 'bucket-hat',
    hatColor: '#0E4F3A',
    hasWatch: false,
    hasNecklace: true,
    hasEarrings: true,
    hasBackpack: false,
    backpackColor: '#2E3A47',
  });

  assert.equal(custom.gender, 'female');
  assert.equal(custom.studentName, 'Chidinma Okafor');
  assert.equal(custom.nickname, 'ChiChi');
  assert.equal(custom.bodyBuild, 'curvy');
  assert.equal(custom.dressStyle, 'ankara-gown');
  assert.equal(custom.dressColor, '#1E4C7A');
  assert.equal(custom.hairStyle, 'box-braids');
  assert.equal(custom.bottomStyle, 'midi-skirt');
  assert.equal(custom.footwearStyle, 'sandals');
  assert.equal(custom.glassesStyle, 'sunglasses');
  assert.equal(custom.hatStyle, 'bucket-hat');
  assert.equal(custom.hasWatch, false);
  assert.equal(custom.hasNecklace, true);
  assert.equal(custom.hasEarrings, true);
  assert.equal(custom.hasBackpack, false);
});

test('applyGenderPresetDefaults updates gender-specific defaults cleanly without wiping shared identity', () => {
  const switchedFemale = applyGenderPresetDefaults(DEFAULT_CHARACTER, 'female');
  assert.equal(switchedFemale.gender, 'female');
  assert.equal(switchedFemale.studentName, DEFAULT_CHARACTER.studentName);
  assert.equal(switchedFemale.nickname, DEFAULT_CHARACTER.nickname);
  assert.equal(switchedFemale.hairStyle, 'box-braids');

  const dressedFemale = {
    ...switchedFemale,
    dressStyle: 'a-line-dress' as const,
  };
  const switchedBackMale = applyGenderPresetDefaults(dressedFemale, 'male');
  assert.equal(switchedBackMale.gender, 'male');
  assert.equal(switchedBackMale.dressStyle, 'none');
  assert.equal(switchedBackMale.hairStyle, 'low-fade');
});

test('validateCharacterIdentity enforces independent student name and nickname bounds', () => {
  assert.equal(validateCharacterIdentity('Tunde Adeyemi', 'TeeJay').valid, true);

  const missingNick = validateCharacterIdentity('Tunde Adeyemi', ' ');
  assert.equal(missingNick.valid, false);
  assert.ok(missingNick.errors.nickname);
  assert.equal(missingNick.errors.studentName, undefined);

  const missingName = validateCharacterIdentity('A', 'Ace');
  assert.equal(missingName.valid, false);
  assert.ok(missingName.errors.studentName);
});

test('createRandomCharacter produces valid sanitized characters preserving student name, nickname, and gender', () => {
  const randomFemale = createRandomCharacter('Amaka Bello', 'Mimi', 'female');
  assert.equal(randomFemale.studentName, 'Amaka Bello');
  assert.equal(randomFemale.nickname, 'Mimi');
  assert.equal(randomFemale.gender, 'female');
  assert.deepEqual(sanitizeCharacter(randomFemale), randomFemale);

  const randomMale = createRandomCharacter('Ibrahim Musa', 'Ibro', 'male');
  assert.equal(randomMale.gender, 'male');
  assert.equal(randomMale.dressStyle, 'none');
  assert.deepEqual(sanitizeCharacter(randomMale), randomMale);
});

test('sanitizeSettings clamps sensitivity and enforces valid enums', () => {
  const clean = sanitizeSettings({
    graphicsQuality: 'ultra',
    cameraSensitivity: 99,
    controlScheme: 'touch',
    invertY: true,
    soundEnabled: false,
  });

  assert.equal(clean.graphicsQuality, DEFAULT_SETTINGS.graphicsQuality);
  assert.equal(clean.cameraSensitivity, 2.0);
  assert.equal(clean.controlScheme, 'touch');
  assert.equal(clean.invertY, true);
  assert.equal(clean.soundEnabled, false);
});
