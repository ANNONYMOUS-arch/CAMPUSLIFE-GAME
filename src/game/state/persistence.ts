import type {
  AcademicProfile,
  BodyBuildId,
  BottomStyleId,
  CharacterAppearance,
  DressStyleId,
  EyeShapeId,
  FaceShapeId,
  FacialDetailId,
  FootwearStyleId,
  GameSettings,
  GenderId,
  GlassesStyleId,
  HairStyleId,
  HatStyleId,
  MouthShapeId,
  NoseShapeId,
  TopStyleId,
} from '../types/game';
import { DEFAULT_ACADEMIC_PROFILE, sanitizeAcademicProfile } from '../world/academicCatalog';

const CHARACTER_STORAGE_KEY = 'campus_life_character_v1';
const ACADEMIC_PROFILE_STORAGE_KEY = 'campus_life_profile_v1';
const SETTINGS_STORAGE_KEY = 'campus_life_settings_v1';

export const GENDER_OPTIONS: ReadonlyArray<{ id: GenderId; label: string }> = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
];

export const SKIN_TONE_PRESETS: ReadonlyArray<{ id: string; label: string; hex: string }> = [
  { id: 'obsidian', label: 'Deep Obsidian', hex: '#3B2116' },
  { id: 'ebony', label: 'Deep Ebony', hex: '#4F2D1D' },
  { id: 'espresso', label: 'Rich Espresso', hex: '#683D27' },
  { id: 'mahogany', label: 'Warm Mahogany', hex: '#824E33' },
  { id: 'chestnut', label: 'Golden Chestnut', hex: '#9A5F3D' },
  { id: 'caramel', label: 'Warm Caramel', hex: '#B4764D' },
  { id: 'honey', label: 'Honey Bronze', hex: '#CA8E62' },
  { id: 'sandstone', label: 'Light Amber', hex: '#DDA77E' },
];

export const BODY_BUILD_OPTIONS: ReadonlyArray<{ id: BodyBuildId; label: string }> = [
  { id: 'slim', label: 'Slim' },
  { id: 'average', label: 'Average' },
  { id: 'athletic', label: 'Athletic' },
  { id: 'curvy', label: 'Curvy' },
  { id: 'broad', label: 'Broad' },
];

export const MALE_BUILD_OPTIONS: ReadonlyArray<{ id: BodyBuildId; label: string }> = [
  { id: 'slim', label: 'Slim' },
  { id: 'average', label: 'Balanced' },
  { id: 'athletic', label: 'Athletic' },
  { id: 'broad', label: 'Broad' },
];

export const FEMALE_BUILD_OPTIONS: ReadonlyArray<{ id: BodyBuildId; label: string }> = [
  { id: 'slim', label: 'Petite' },
  { id: 'average', label: 'Balanced' },
  { id: 'athletic', label: 'Athletic' },
  { id: 'curvy', label: 'Curvy' },
];

export const FACE_SHAPE_OPTIONS: ReadonlyArray<{ id: FaceShapeId; label: string }> = [
  { id: 'oval', label: 'Oval' },
  { id: 'round', label: 'Round' },
  { id: 'square', label: 'Square' },
  { id: 'heart', label: 'Heart' },
];

export const EYE_SHAPE_OPTIONS: ReadonlyArray<{ id: EyeShapeId; label: string }> = [
  { id: 'almond', label: 'Almond' },
  { id: 'round', label: 'Round' },
  { id: 'wide', label: 'Wide' },
  { id: 'relaxed', label: 'Relaxed' },
];

export const NOSE_SHAPE_OPTIONS: ReadonlyArray<{ id: NoseShapeId; label: string }> = [
  { id: 'balanced', label: 'Balanced' },
  { id: 'broad', label: 'Broad' },
  { id: 'aquiline', label: 'Sculpted' },
  { id: 'button', label: 'Soft' },
];

export const MOUTH_SHAPE_OPTIONS: ReadonlyArray<{ id: MouthShapeId; label: string }> = [
  { id: 'neutral', label: 'Natural' },
  { id: 'warm-smile', label: 'Warm Smile' },
  { id: 'full-lips', label: 'Full Lips' },
  { id: 'calm', label: 'Subtle' },
];

export const FACIAL_DETAIL_OPTIONS: ReadonlyArray<{ id: FacialDetailId; label: string }> = [
  { id: 'none', label: 'Clean' },
  { id: 'light-stubble', label: 'Light Stubble' },
  { id: 'beard-goatee', label: 'Goatee' },
  { id: 'full-beard', label: 'Full Beard' },
  { id: 'freckles-beauty', label: 'Beauty Mark & Freckles' },
];

export const MALE_FACIAL_DETAIL_OPTIONS: ReadonlyArray<{ id: FacialDetailId; label: string }> = [
  { id: 'none', label: 'Clean Shaven' },
  { id: 'light-stubble', label: 'Light Stubble' },
  { id: 'beard-goatee', label: 'Goatee' },
  { id: 'full-beard', label: 'Full Beard' },
  { id: 'freckles-beauty', label: 'Freckles' },
];

export const FEMALE_FACIAL_DETAIL_OPTIONS: ReadonlyArray<{ id: FacialDetailId; label: string }> = [
  { id: 'none', label: 'Natural' },
  { id: 'freckles-beauty', label: 'Beauty Mark & Freckles' },
];

export const HAIR_STYLE_OPTIONS: ReadonlyArray<{ id: HairStyleId; label: string }> = [
  { id: 'low-fade', label: 'Low Fade' },
  { id: 'high-fade', label: 'High-Top Fade' },
  { id: 'natural-afro', label: 'Natural Afro' },
  { id: 'short-natural', label: 'Short Natural' },
  { id: 'twists', label: 'Two-Strand Twists' },
  { id: 'locs', label: 'Shoulder Locs' },
  { id: 'box-braids', label: 'Box Braids' },
  { id: 'cornrows', label: 'Cornrows' },
  { id: 'afro-puffs', label: 'Afro Puffs' },
  { id: 'hijab-classic', label: 'Classic Hijab' },
  { id: 'hijab-turban', label: 'Turban Wrap' },
  { id: 'side-part', label: 'Side Part' },
];

export const MALE_HAIR_OPTIONS: ReadonlyArray<{ id: HairStyleId; label: string }> = [
  { id: 'low-fade', label: 'Low Fade' },
  { id: 'high-fade', label: 'High-Top Fade' },
  { id: 'short-natural', label: 'Short Natural' },
  { id: 'natural-afro', label: 'Natural Afro' },
  { id: 'twists', label: 'Two-Strand Twists' },
  { id: 'locs', label: 'Shoulder Locs' },
  { id: 'cornrows', label: 'Cornrows' },
  { id: 'side-part', label: 'Side Part' },
];

export const FEMALE_HAIR_OPTIONS: ReadonlyArray<{ id: HairStyleId; label: string }> = [
  { id: 'box-braids', label: 'Box Braids' },
  { id: 'cornrows', label: 'Cornrows' },
  { id: 'afro-puffs', label: 'Afro Puffs' },
  { id: 'natural-afro', label: 'Natural Afro' },
  { id: 'twists', label: 'Two-Strand Twists' },
  { id: 'locs', label: 'Shoulder Locs' },
  { id: 'short-natural', label: 'Tapered Natural' },
  { id: 'side-part', label: 'Side-Part Swoop' },
  { id: 'hijab-classic', label: 'Classic Hijab' },
  { id: 'hijab-turban', label: 'Turban Wrap' },
];

export const HAIR_COLOR_PRESETS: ReadonlyArray<{ label: string; hex: string }> = [
  { label: 'Jet Black', hex: '#171516' },
  { label: 'Dark Espresso', hex: '#2F2019' },
  { label: 'Chestnut Brown', hex: '#4F2D1D' },
  { label: 'Auburn Tint', hex: '#6F3420' },
  { label: 'Honey Blonde', hex: '#A47539' },
  { label: 'Emerald Scarf', hex: '#0E543D' },
  { label: 'Burgundy Wine', hex: '#6E1E2B' },
  { label: 'Cream Scarf', hex: '#DED5C3' },
];

export const DRESS_STYLE_OPTIONS: ReadonlyArray<{ id: DressStyleId; label: string }> = [
  { id: 'none', label: 'Top & Bottom' },
  { id: 'a-line-dress', label: 'A-Line Dress' },
  { id: 'ankara-gown', label: 'Ankara Gown' },
  { id: 'wrap-midi-dress', label: 'Wrap Midi Dress' },
];

export const DRESS_COLOR_PRESETS: ReadonlyArray<{ label: string; hex: string }> = [
  { label: 'Campus Emerald', hex: '#0F6B4D' },
  { label: 'Ankara Royal', hex: '#1E4C7A' },
  { label: 'Burgundy Rose', hex: '#7A2438' },
  { label: 'Lagos Gold', hex: '#C98F1E' },
  { label: 'Terracotta', hex: '#A3422E' },
  { label: 'Plum', hex: '#5A2B5F' },
  { label: 'Ivory Cream', hex: '#E6DEC9' },
  { label: 'Obsidian', hex: '#23282D' },
];

export const TOP_STYLE_OPTIONS: ReadonlyArray<{ id: TopStyleId; label: string }> = [
  { id: 'tshirt', label: 'T-Shirt' },
  { id: 'collared-shirt', label: 'Polo / Shirt' },
  { id: 'hoodie', label: 'Hoodie' },
  { id: 'jacket', label: 'Varsity Jacket' },
  { id: 'agbada-kaftan', label: 'Senator Kaftan' },
  { id: 'ankara-top', label: 'Ankara Print' },
];

export const MALE_TOP_OPTIONS: ReadonlyArray<{ id: TopStyleId; label: string }> = [
  { id: 'tshirt', label: 'T-Shirt' },
  { id: 'collared-shirt', label: 'Polo / Shirt' },
  { id: 'hoodie', label: 'Hoodie' },
  { id: 'jacket', label: 'Varsity Jacket' },
  { id: 'agbada-kaftan', label: 'Senator Kaftan' },
  { id: 'ankara-top', label: 'Ankara Shirt' },
];

export const FEMALE_TOP_OPTIONS: ReadonlyArray<{ id: TopStyleId; label: string }> = [
  { id: 'tshirt', label: 'Fitted Tee' },
  { id: 'collared-shirt', label: 'Collared Blouse' },
  { id: 'hoodie', label: 'Campus Hoodie' },
  { id: 'jacket', label: 'Varsity Jacket' },
  { id: 'ankara-top', label: 'Ankara Peplum Top' },
  { id: 'agbada-kaftan', label: 'Modest Kaftan Tunic' },
];

export const BOTTOM_STYLE_OPTIONS: ReadonlyArray<{ id: BottomStyleId; label: string }> = [
  { id: 'chinos', label: 'Chinos' },
  { id: 'jeans', label: 'Denim Jeans' },
  { id: 'joggers', label: 'Joggers' },
  { id: 'shorts', label: 'Shorts' },
  { id: 'midi-skirt', label: 'Midi Skirt' },
];

export const MALE_BOTTOM_OPTIONS: ReadonlyArray<{ id: BottomStyleId; label: string }> = [
  { id: 'chinos', label: 'Chinos' },
  { id: 'jeans', label: 'Denim Jeans' },
  { id: 'joggers', label: 'Joggers' },
  { id: 'shorts', label: 'Shorts' },
];

export const FEMALE_BOTTOM_OPTIONS: ReadonlyArray<{ id: BottomStyleId; label: string }> = [
  { id: 'midi-skirt', label: 'Midi Skirt' },
  { id: 'jeans', label: 'Denim Jeans' },
  { id: 'chinos', label: 'Tailored Trousers' },
  { id: 'joggers', label: 'Joggers' },
  { id: 'shorts', label: 'Shorts' },
];

export const FOOTWEAR_STYLE_OPTIONS: ReadonlyArray<{ id: FootwearStyleId; label: string }> = [
  { id: 'sneakers', label: 'Sneakers' },
  { id: 'sandals', label: 'Strapped Sandals' },
  { id: 'slides', label: 'Campus Slides' },
  { id: 'formal-shoes', label: 'Formal Loafers' },
];

export const SHIRT_COLOR_PRESETS: ReadonlyArray<{ label: string; hex: string }> = [
  { label: 'Campus Emerald', hex: '#0F6B4D' },
  { label: 'Lagos Gold', hex: '#D49A22' },
  { label: 'Harmattan Cream', hex: '#EAE2D2' },
  { label: 'Atlantic Blue', hex: '#1F4F82' },
  { label: 'Terracotta', hex: '#A9442E' },
  { label: 'Royal Plum', hex: '#5A2B5F' },
  { label: 'Sky Slate', hex: '#557A95' },
  { label: 'Obsidian', hex: '#23282D' },
];

export const TROUSER_COLOR_PRESETS: ReadonlyArray<{ label: string; hex: string }> = [
  { label: 'Charcoal', hex: '#22262B' },
  { label: 'Campus Navy', hex: '#1B2A44' },
  { label: 'Savannah Khaki', hex: '#A68D68' },
  { label: 'Indigo Denim', hex: '#2D456B' },
  { label: 'Forest Olive', hex: '#394B38' },
  { label: 'Warm Espresso', hex: '#4B3629' },
];

export const SHOE_COLOR_PRESETS: ReadonlyArray<{ label: string; hex: string }> = [
  { label: 'Chalk White', hex: '#EAE6DC' },
  { label: 'Jet Black', hex: '#1D2024' },
  { label: 'Saddle Tan', hex: '#8A5634' },
  { label: 'Campus Green', hex: '#12543D' },
  { label: 'Crimson', hex: '#8F2929' },
  { label: 'Navy Blue', hex: '#1E3354' },
];

export const GLASSES_STYLE_OPTIONS: ReadonlyArray<{ id: GlassesStyleId; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'round', label: 'Round Wire' },
  { id: 'rectangular', label: 'Classic Frame' },
  { id: 'sunglasses', label: 'Sunglasses' },
];

export const HAT_STYLE_OPTIONS: ReadonlyArray<{ id: HatStyleId; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'baseball-cap', label: 'Face Cap' },
  { id: 'beanie', label: 'Knit Beanie' },
  { id: 'bucket-hat', label: 'Bucket Hat' },
];

export const HAT_COLOR_PRESETS: ReadonlyArray<{ label: string; hex: string }> = [
  { label: 'Campus Green', hex: '#0E4F3A' },
  { label: 'Obsidian', hex: '#1E2226' },
  { label: 'Gold Ochre', hex: '#C68F21' },
  { label: 'Cream Stone', hex: '#DFD6C5' },
  { label: 'Rust Clay', hex: '#9A3D28' },
  { label: 'Navy', hex: '#1D3354' },
];

export const BACKPACK_COLOR_PRESETS: ReadonlyArray<{ label: string; hex: string }> = [
  { label: 'Slate Navy', hex: '#2E3A47' },
  { label: 'Campus Emerald', hex: '#104D39' },
  { label: 'Terracotta', hex: '#963C29' },
  { label: 'Sand Khaki', hex: '#8E795B' },
  { label: 'Charcoal', hex: '#202429' },
  { label: 'Amber Gold', hex: '#B9821E' },
];

export const DEFAULT_CHARACTER: CharacterAppearance = {
  gender: 'male',
  studentName: 'Tunde Adeyemi',
  nickname: 'Tunde',
  skinTone: SKIN_TONE_PRESETS[2].hex,
  bodyBuild: 'average',
  faceShape: 'oval',
  eyeShape: 'almond',
  noseShape: 'balanced',
  mouthShape: 'warm-smile',
  facialDetail: 'none',
  hairStyle: 'low-fade',
  hairColor: HAIR_COLOR_PRESETS[0].hex,
  dressStyle: 'none',
  dressColor: DRESS_COLOR_PRESETS[1].hex,
  topStyle: 'collared-shirt',
  shirtColor: SHIRT_COLOR_PRESETS[0].hex,
  bottomStyle: 'chinos',
  trouserColor: TROUSER_COLOR_PRESETS[0].hex,
  footwearStyle: 'sneakers',
  shoeColor: SHOE_COLOR_PRESETS[0].hex,
  glassesStyle: 'none',
  hatStyle: 'none',
  hatColor: HAT_COLOR_PRESETS[0].hex,
  hasWatch: true,
  hasNecklace: false,
  hasEarrings: false,
  hasBackpack: true,
  backpackColor: BACKPACK_COLOR_PRESETS[0].hex,
};

export const DEFAULT_SETTINGS: GameSettings = {
  graphicsQuality: 'auto',
  cameraSensitivity: 1.0,
  invertY: false,
  controlScheme: 'auto',
  soundEnabled: true,
};

export interface IdentityValidationErrors {
  studentName?: string;
  nickname?: string;
}

export function validateCharacterIdentity(
  studentName: string,
  nickname: string
): { valid: boolean; errors: IdentityValidationErrors } {
  const errors: IdentityValidationErrors = {};
  const cleanName = studentName.trim();
  const cleanNick = nickname.trim();

  if (cleanName.length < 2) {
    errors.studentName = 'Enter a student name (at least 2 characters).';
  } else if (cleanName.length > 28) {
    errors.studentName = 'Student name must be 28 characters or fewer.';
  }

  if (cleanNick.length < 2) {
    errors.nickname = 'Enter a nickname (at least 2 characters).';
  } else if (cleanNick.length > 16) {
    errors.nickname = 'Nickname must be 16 characters or fewer.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function applyGenderPresetDefaults(
  current: CharacterAppearance,
  nextGender: GenderId
): CharacterAppearance {
  if (current.gender === nextGender) return current;

  if (nextGender === 'female') {
    const validFemaleHair = FEMALE_HAIR_OPTIONS.some((h) => h.id === current.hairStyle);
    const validFemaleBuild = FEMALE_BUILD_OPTIONS.some((b) => b.id === current.bodyBuild);
    const isMaleFacialHair =
      current.facialDetail === 'light-stubble' ||
      current.facialDetail === 'beard-goatee' ||
      current.facialDetail === 'full-beard';

    return {
      ...current,
      gender: 'female',
      bodyBuild: validFemaleBuild ? current.bodyBuild : 'average',
      facialDetail: isMaleFacialHair ? 'none' : current.facialDetail,
      hairStyle: validFemaleHair ? current.hairStyle : 'box-braids',
      hasEarrings: true,
    };
  }

  const validMaleHair = MALE_HAIR_OPTIONS.some((h) => h.id === current.hairStyle);
  const validMaleBuild = MALE_BUILD_OPTIONS.some((b) => b.id === current.bodyBuild);
  return {
    ...current,
    gender: 'male',
    bodyBuild: validMaleBuild ? current.bodyBuild : 'average',
    hairStyle: validMaleHair ? current.hairStyle : 'low-fade',
    dressStyle: 'none',
    bottomStyle: current.bottomStyle === 'midi-skirt' ? 'chinos' : current.bottomStyle,
    hasEarrings: false,
  };
}

function sanitizeHex(value: unknown, fallback: string): string {
  if (typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value)) {
    return value;
  }
  return fallback;
}

function sanitizeEnum<T extends string>(
  value: unknown,
  validList: ReadonlyArray<{ id: T }>,
  fallback: T
): T {
  if (typeof value === 'string') {
    for (const item of validList) {
      if (item.id === value) return value as T;
    }
  }
  return fallback;
}

function deriveFallbackNickname(studentName: string): string {
  const firstToken = studentName.trim().split(/\s+/)[0] || '';
  if (firstToken.length >= 2) {
    return firstToken.slice(0, 16);
  }
  return DEFAULT_CHARACTER.nickname;
}

export function sanitizeCharacter(raw: unknown): CharacterAppearance {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_CHARACTER };
  }
  const obj = raw as Record<string, unknown>;
  const studentName =
    typeof obj.studentName === 'string' && obj.studentName.trim().length > 0
      ? obj.studentName.trim().slice(0, 28)
      : DEFAULT_CHARACTER.studentName;

  const nickname =
    typeof obj.nickname === 'string' && obj.nickname.trim().length > 0
      ? obj.nickname.trim().slice(0, 16)
      : obj.nickname === ''
        ? ''
        : deriveFallbackNickname(studentName);

  // Backward-compatible migrations from Phase 1 / Phase 1.1 schema
  let rawHair = obj.hairStyle;
  if (rawHair === 'braids') rawHair = 'box-braids';
  if (rawHair === 'hijab') rawHair = 'hijab-classic';

  let rawGlasses = obj.glassesStyle;
  if (rawGlasses === undefined && typeof obj.hasGlasses === 'boolean') {
    rawGlasses = obj.hasGlasses ? 'rectangular' : 'none';
  }

  const hairStyle = sanitizeEnum(rawHair, HAIR_STYLE_OPTIONS, DEFAULT_CHARACTER.hairStyle);
  const bottomStyle = sanitizeEnum(obj.bottomStyle, BOTTOM_STYLE_OPTIONS, DEFAULT_CHARACTER.bottomStyle);
  const dressStyle = sanitizeEnum(obj.dressStyle, DRESS_STYLE_OPTIONS, DEFAULT_CHARACTER.dressStyle);

  let gender: GenderId = DEFAULT_CHARACTER.gender;
  if (obj.gender === 'male' || obj.gender === 'female') {
    gender = obj.gender;
  } else if (
    hairStyle === 'hijab-classic' ||
    hairStyle === 'hijab-turban' ||
    hairStyle === 'afro-puffs' ||
    hairStyle === 'box-braids' ||
    bottomStyle === 'midi-skirt' ||
    dressStyle !== 'none'
  ) {
    gender = 'female';
  }

  return {
    gender,
    studentName,
    nickname,
    skinTone: sanitizeHex(obj.skinTone, DEFAULT_CHARACTER.skinTone),
    bodyBuild: sanitizeEnum(obj.bodyBuild, BODY_BUILD_OPTIONS, DEFAULT_CHARACTER.bodyBuild),
    faceShape: sanitizeEnum(obj.faceShape, FACE_SHAPE_OPTIONS, DEFAULT_CHARACTER.faceShape),
    eyeShape: sanitizeEnum(obj.eyeShape, EYE_SHAPE_OPTIONS, DEFAULT_CHARACTER.eyeShape),
    noseShape: sanitizeEnum(obj.noseShape, NOSE_SHAPE_OPTIONS, DEFAULT_CHARACTER.noseShape),
    mouthShape: sanitizeEnum(obj.mouthShape, MOUTH_SHAPE_OPTIONS, DEFAULT_CHARACTER.mouthShape),
    facialDetail: sanitizeEnum(obj.facialDetail, FACIAL_DETAIL_OPTIONS, DEFAULT_CHARACTER.facialDetail),
    hairStyle,
    hairColor: sanitizeHex(obj.hairColor, DEFAULT_CHARACTER.hairColor),
    dressStyle,
    dressColor: sanitizeHex(obj.dressColor, DEFAULT_CHARACTER.dressColor),
    topStyle: sanitizeEnum(obj.topStyle, TOP_STYLE_OPTIONS, DEFAULT_CHARACTER.topStyle),
    shirtColor: sanitizeHex(obj.shirtColor, DEFAULT_CHARACTER.shirtColor),
    bottomStyle,
    trouserColor: sanitizeHex(obj.trouserColor, DEFAULT_CHARACTER.trouserColor),
    footwearStyle: sanitizeEnum(obj.footwearStyle, FOOTWEAR_STYLE_OPTIONS, DEFAULT_CHARACTER.footwearStyle),
    shoeColor: sanitizeHex(obj.shoeColor, DEFAULT_CHARACTER.shoeColor),
    glassesStyle: sanitizeEnum(rawGlasses, GLASSES_STYLE_OPTIONS, DEFAULT_CHARACTER.glassesStyle),
    hatStyle: sanitizeEnum(obj.hatStyle, HAT_STYLE_OPTIONS, DEFAULT_CHARACTER.hatStyle),
    hatColor: sanitizeHex(obj.hatColor, DEFAULT_CHARACTER.hatColor),
    hasWatch: typeof obj.hasWatch === 'boolean' ? obj.hasWatch : DEFAULT_CHARACTER.hasWatch,
    hasNecklace: typeof obj.hasNecklace === 'boolean' ? obj.hasNecklace : DEFAULT_CHARACTER.hasNecklace,
    hasEarrings: typeof obj.hasEarrings === 'boolean' ? obj.hasEarrings : DEFAULT_CHARACTER.hasEarrings,
    hasBackpack: typeof obj.hasBackpack === 'boolean' ? obj.hasBackpack : DEFAULT_CHARACTER.hasBackpack,
    backpackColor: sanitizeHex(obj.backpackColor, DEFAULT_CHARACTER.backpackColor),
  };
}

function pickRandom<T>(items: ReadonlyArray<T>): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function createRandomCharacter(
  studentName: string,
  nickname?: string,
  gender: GenderId = 'male'
): CharacterAppearance {
  const hairPool = gender === 'female' ? FEMALE_HAIR_OPTIONS : MALE_HAIR_OPTIONS;
  const buildPool = gender === 'female' ? FEMALE_BUILD_OPTIONS : MALE_BUILD_OPTIONS;
  const facialPool = gender === 'female' ? FEMALE_FACIAL_DETAIL_OPTIONS : MALE_FACIAL_DETAIL_OPTIONS;
  const topPool = gender === 'female' ? FEMALE_TOP_OPTIONS : MALE_TOP_OPTIONS;
  const bottomPool = gender === 'female' ? FEMALE_BOTTOM_OPTIONS : MALE_BOTTOM_OPTIONS;

  const hairStyle = pickRandom(hairPool).id;
  const isHijab = hairStyle === 'hijab-classic' || hairStyle === 'hijab-turban';
  const dressChoices = DRESS_STYLE_OPTIONS.filter((d) => d.id !== 'none');
  const dressStyle: DressStyleId =
    gender === 'female' && Math.random() < 0.45 ? pickRandom(dressChoices).id : 'none';

  const cleanName = studentName.trim().slice(0, 28) || DEFAULT_CHARACTER.studentName;
  const cleanNick =
    typeof nickname === 'string' && nickname.trim().length > 0
      ? nickname.trim().slice(0, 16)
      : deriveFallbackNickname(cleanName);

  return {
    gender,
    studentName: cleanName,
    nickname: cleanNick,
    skinTone: pickRandom(SKIN_TONE_PRESETS).hex,
    bodyBuild: pickRandom(buildPool).id,
    faceShape: pickRandom(FACE_SHAPE_OPTIONS).id,
    eyeShape: pickRandom(EYE_SHAPE_OPTIONS).id,
    noseShape: pickRandom(NOSE_SHAPE_OPTIONS).id,
    mouthShape: pickRandom(MOUTH_SHAPE_OPTIONS).id,
    facialDetail: pickRandom(facialPool).id,
    hairStyle,
    hairColor: pickRandom(HAIR_COLOR_PRESETS).hex,
    dressStyle,
    dressColor: pickRandom(DRESS_COLOR_PRESETS).hex,
    topStyle: pickRandom(topPool).id,
    shirtColor: pickRandom(SHIRT_COLOR_PRESETS).hex,
    bottomStyle: pickRandom(bottomPool).id,
    trouserColor: pickRandom(TROUSER_COLOR_PRESETS).hex,
    footwearStyle: pickRandom(FOOTWEAR_STYLE_OPTIONS).id,
    shoeColor: pickRandom(SHOE_COLOR_PRESETS).hex,
    glassesStyle: Math.random() < 0.35 ? pickRandom(GLASSES_STYLE_OPTIONS).id : 'none',
    hatStyle: !isHijab && Math.random() < 0.25 ? pickRandom(HAT_STYLE_OPTIONS.filter((h) => h.id !== 'none')).id : 'none',
    hatColor: pickRandom(HAT_COLOR_PRESETS).hex,
    hasWatch: Math.random() < 0.6,
    hasNecklace: Math.random() < 0.4,
    hasEarrings: gender === 'female' ? Math.random() < 0.65 : Math.random() < 0.15,
    hasBackpack: Math.random() < 0.75,
    backpackColor: pickRandom(BACKPACK_COLOR_PRESETS).hex,
  };
}

export function sanitizeSettings(raw: unknown): GameSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_SETTINGS };
  }
  const obj = raw as Record<string, unknown>;
  const quality =
    obj.graphicsQuality === 'auto' ||
    obj.graphicsQuality === 'low' ||
    obj.graphicsQuality === 'medium' ||
    obj.graphicsQuality === 'high'
      ? obj.graphicsQuality
      : DEFAULT_SETTINGS.graphicsQuality;

  const scheme =
    obj.controlScheme === 'auto' || obj.controlScheme === 'desktop' || obj.controlScheme === 'touch'
      ? obj.controlScheme
      : DEFAULT_SETTINGS.controlScheme;

  const sensitivity =
    typeof obj.cameraSensitivity === 'number' && Number.isFinite(obj.cameraSensitivity)
      ? Math.min(2.0, Math.max(0.4, obj.cameraSensitivity))
      : DEFAULT_SETTINGS.cameraSensitivity;

  return {
    graphicsQuality: quality,
    cameraSensitivity: sensitivity,
    invertY: typeof obj.invertY === 'boolean' ? obj.invertY : DEFAULT_SETTINGS.invertY,
    controlScheme: scheme,
    soundEnabled: typeof obj.soundEnabled === 'boolean' ? obj.soundEnabled : DEFAULT_SETTINGS.soundEnabled,
  };
}

export function loadCharacter(): CharacterAppearance {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_CHARACTER };
  }
  try {
    const raw = window.localStorage.getItem(CHARACTER_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CHARACTER };
    return sanitizeCharacter(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_CHARACTER };
  }
}

export function saveCharacter(appearance: CharacterAppearance): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(CHARACTER_STORAGE_KEY, JSON.stringify(sanitizeCharacter(appearance)));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadAcademicProfile(): AcademicProfile {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_ACADEMIC_PROFILE };
  }
  try {
    const raw = window.localStorage.getItem(ACADEMIC_PROFILE_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_ACADEMIC_PROFILE };
    return sanitizeAcademicProfile(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_ACADEMIC_PROFILE };
  }
}

export function saveAcademicProfile(profile: AcademicProfile): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(
      ACADEMIC_PROFILE_STORAGE_KEY,
      JSON.stringify(sanitizeAcademicProfile(profile))
    );
  } catch {
    // Ignore storage quota errors
  }
}

export function loadSettings(): GameSettings {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_SETTINGS };
  }
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return sanitizeSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: GameSettings): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(sanitizeSettings(settings)));
  } catch {
    // Ignore storage quota errors
  }
}
