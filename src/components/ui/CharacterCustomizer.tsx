import { useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  GraduationCap,
  Maximize2,
  RotateCcw,
  RotateCw,
  Shuffle,
  UserCheck,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  applyGenderPresetDefaults,
  BACKPACK_COLOR_PRESETS,
  BODY_BUILD_OPTIONS,
  BOTTOM_STYLE_OPTIONS,
  createRandomCharacter,
  DEFAULT_CHARACTER,
  DRESS_COLOR_PRESETS,
  DRESS_STYLE_OPTIONS,
  EYE_SHAPE_OPTIONS,
  FACE_SHAPE_OPTIONS,
  FACIAL_DETAIL_OPTIONS,
  FEMALE_BOTTOM_OPTIONS,
  FEMALE_BUILD_OPTIONS,
  FEMALE_FACIAL_DETAIL_OPTIONS,
  FEMALE_HAIR_OPTIONS,
  FEMALE_TOP_OPTIONS,
  FOOTWEAR_STYLE_OPTIONS,
  GENDER_OPTIONS,
  GLASSES_STYLE_OPTIONS,
  HAIR_COLOR_PRESETS,
  HAIR_STYLE_OPTIONS,
  HAT_COLOR_PRESETS,
  HAT_STYLE_OPTIONS,
  MALE_BOTTOM_OPTIONS,
  MALE_BUILD_OPTIONS,
  MALE_FACIAL_DETAIL_OPTIONS,
  MALE_HAIR_OPTIONS,
  MALE_TOP_OPTIONS,
  MOUTH_SHAPE_OPTIONS,
  NOSE_SHAPE_OPTIONS,
  SHIRT_COLOR_PRESETS,
  SHOE_COLOR_PRESETS,
  SKIN_TONE_PRESETS,
  TOP_STYLE_OPTIONS,
  TROUSER_COLOR_PRESETS,
  validateCharacterIdentity,
} from '../../game/state/persistence';
import {
  ACADEMIC_LEVELS,
  getCourseById,
  getCoursesForDepartment,
  getDepartmentById,
  getDepartmentsForFaculty,
  getFacultyById,
  PLACEHOLDER_FACULTIES,
  validateAcademicAdmission,
} from '../../game/world/academicCatalog';
import { soundEngine } from '../../game/audio/soundEffects';
import type {
  AcademicLevel,
  AcademicProfile,
  CharacterAppearance,
  GenderId,
} from '../../game/types/game';
import type { StudioCameraFocus } from '../three/MenuShowcaseScene';

type StudioStageId = 'look' | 'admission' | 'review';
type StudioTabId = 'body' | 'face' | 'hair' | 'outfit' | 'accessories';

interface CharacterCustomizerProps {
  appearance: CharacterAppearance;
  academicProfile: AcademicProfile;
  studioZoom: number;
  studioFocus: StudioCameraFocus;
  isReturnFromPause?: boolean;
  onChange: (next: CharacterAppearance) => void;
  onAcademicChange: (next: AcademicProfile) => void;
  onRotateCharacter: (deltaYaw: number) => void;
  onZoomChange: (nextZoom: number) => void;
  onFocusChange: (focus: StudioCameraFocus) => void;
  onResetView: () => void;
  onBack: () => void;
  onConfirmAdmission: () => void;
}

const STUDIO_STAGES: ReadonlyArray<{ id: StudioStageId; step: string; label: string }> = [
  { id: 'look', step: '1', label: 'Look' },
  { id: 'admission', step: '2', label: 'Admission' },
  { id: 'review', step: '3', label: 'Review' },
];

const STUDIO_TABS: ReadonlyArray<{ id: StudioTabId; label: string; focus: StudioCameraFocus }> = [
  { id: 'body', label: 'Body', focus: 'full' },
  { id: 'face', label: 'Face', focus: 'head' },
  { id: 'hair', label: 'Hair', focus: 'head' },
  { id: 'outfit', label: 'Outfit', focus: 'full' },
  { id: 'accessories', label: 'Gear', focus: 'full' },
];

const LIGHT_SWATCH_HEXES = new Set(['#EAE2D2', '#EAE6DC', '#DED5C3', '#DFD6C5', '#E6DEC9']);

function ColorSwatchRow({
  label,
  value,
  presets,
  onSelect,
}: {
  label: string;
  value: string;
  presets: ReadonlyArray<{ label: string; hex: string }>;
  onSelect: (hex: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-[#D5DDD9]">{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((preset) => {
          const selected = value.toLowerCase() === preset.hex.toLowerCase();
          const isLight = LIGHT_SWATCH_HEXES.has(preset.hex.toUpperCase());
          return (
            <button
              key={preset.label}
              type="button"
              title={preset.label}
              aria-label={`Select ${preset.label}`}
              aria-pressed={selected}
              onClick={() => {
                soundEngine.playUiClick();
                onSelect(preset.hex);
              }}
              style={{ backgroundColor: preset.hex }}
              className={`w-8 h-8 rounded-lg border-2 transition-transform cursor-pointer flex items-center justify-center ${
                selected ? 'border-[#D4A024] scale-110' : 'border-white/25 hover:scale-105'
              }`}
            >
              {selected && (
                <Check
                  className={`w-4 h-4 ${isLight ? 'text-[#0B241C]' : 'text-white'}`}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OptionChipGrid<T extends string>({
  label,
  value,
  options,
  columns = 2,
  onSelect,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ id: T; label: string }>;
  columns?: 2 | 3;
  onSelect: (id: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-[#D5DDD9]">{label}</span>
      <div className={`grid gap-1.5 ${columns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {options.map((opt) => {
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                soundEngine.playUiClick();
                onSelect(opt.id);
              }}
              className={`rounded-lg px-2.5 py-2 text-xs font-semibold text-left border transition-colors cursor-pointer truncate ${
                selected
                  ? 'bg-[#D4A024] text-[#0B241C] border-[#D4A024]'
                  : 'bg-[#081C15] text-[#E6ECE9] border-white/12 hover:border-[#D4A024]/50'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-white/10 last:border-b-0">
      <span className="text-xs text-[#B9C8C1] shrink-0">{label}</span>
      <span className="text-xs font-semibold text-[#F5F0E6] text-right truncate">{value}</span>
    </div>
  );
}

export function CharacterCustomizer({
  appearance,
  academicProfile,
  studioZoom,
  studioFocus,
  isReturnFromPause = false,
  onChange,
  onAcademicChange,
  onRotateCharacter,
  onZoomChange,
  onFocusChange,
  onResetView,
  onBack,
  onConfirmAdmission,
}: CharacterCustomizerProps) {
  const [stage, setStage] = useState<StudioStageId>('look');
  const [activeTab, setActiveTab] = useState<StudioTabId>('body');
  const [showAllStyles, setShowAllStyles] = useState(false);
  const [attemptedValidation, setAttemptedValidation] = useState(false);

  const dragPointerIdRef = useRef<number | null>(null);
  const lastDragXRef = useRef(0);

  const isFemale = appearance.gender === 'female';
  const isHijab =
    appearance.hairStyle === 'hijab-classic' || appearance.hairStyle === 'hijab-turban';
  const hasDress = appearance.dressStyle !== 'none';

  const bodyOptions = showAllStyles
    ? BODY_BUILD_OPTIONS
    : isFemale
      ? FEMALE_BUILD_OPTIONS
      : MALE_BUILD_OPTIONS;
  const facialDetailOptions = showAllStyles
    ? FACIAL_DETAIL_OPTIONS
    : isFemale
      ? FEMALE_FACIAL_DETAIL_OPTIONS
      : MALE_FACIAL_DETAIL_OPTIONS;
  const hairOptions = showAllStyles
    ? HAIR_STYLE_OPTIONS
    : isFemale
      ? FEMALE_HAIR_OPTIONS
      : MALE_HAIR_OPTIONS;
  const topOptions = showAllStyles
    ? TOP_STYLE_OPTIONS
    : isFemale
      ? FEMALE_TOP_OPTIONS
      : MALE_TOP_OPTIONS;
  const bottomOptions = showAllStyles
    ? BOTTOM_STYLE_OPTIONS
    : isFemale
      ? FEMALE_BOTTOM_OPTIONS
      : MALE_BOTTOM_OPTIONS;

  const availableDepartments = getDepartmentsForFaculty(academicProfile.facultyId);
  const availableCourses = getCoursesForDepartment(academicProfile.departmentId);

  const identityValidation = validateCharacterIdentity(
    appearance.studentName,
    appearance.nickname
  );
  const admissionValidation = validateAcademicAdmission(academicProfile);
  const readyForCampus = identityValidation.valid && admissionValidation.valid;

  const selectedFaculty = getFacultyById(academicProfile.facultyId);
  const selectedDepartment = getDepartmentById(academicProfile.departmentId);
  const selectedCourse = getCourseById(academicProfile.courseId);

  const hairLabel =
    HAIR_STYLE_OPTIONS.find((h) => h.id === appearance.hairStyle)?.label ?? appearance.hairStyle;
  const dressLabel =
    DRESS_STYLE_OPTIONS.find((d) => d.id === appearance.dressStyle)?.label ?? appearance.dressStyle;
  const topLabel =
    TOP_STYLE_OPTIONS.find((t) => t.id === appearance.topStyle)?.label ?? appearance.topStyle;
  const bottomLabel =
    BOTTOM_STYLE_OPTIONS.find((b) => b.id === appearance.bottomStyle)?.label ??
    appearance.bottomStyle;
  const footwearLabel =
    FOOTWEAR_STYLE_OPTIONS.find((f) => f.id === appearance.footwearStyle)?.label ??
    appearance.footwearStyle;

  const handleGenderSelect = (nextGender: GenderId) => {
    if (nextGender === appearance.gender) return;
    soundEngine.playUiClick();
    onChange(applyGenderPresetDefaults(appearance, nextGender));
  };

  const handleViewportPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragPointerIdRef.current = e.pointerId;
    lastDragXRef.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleViewportPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragPointerIdRef.current !== e.pointerId) return;
    const dx = e.clientX - lastDragXRef.current;
    lastDragXRef.current = e.clientX;
    if (Math.abs(dx) > 0) {
      onRotateCharacter(dx * 0.011);
    }
  };

  const handleViewportPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragPointerIdRef.current === e.pointerId) {
      dragPointerIdRef.current = null;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    }
  };

  const handleViewportWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    const delta = e.deltaY < 0 ? 0.12 : -0.12;
    onZoomChange(Math.max(0.7, Math.min(1.9, Number((studioZoom + delta).toFixed(2)))));
  };

  const handleGoToStage = (nextStage: StudioStageId) => {
    soundEngine.playUiClick();
    if (nextStage === 'review') {
      setAttemptedValidation(true);
    }
    setStage(nextStage);
    if (nextStage !== 'look') {
      onFocusChange('full');
    } else {
      const currentTabFocus = STUDIO_TABS.find((t) => t.id === activeTab)?.focus ?? 'full';
      onFocusChange(currentTabFocus);
    }
  };

  const handleConfirmClick = () => {
    soundEngine.playUiClick();
    setAttemptedValidation(true);
    if (!readyForCampus) {
      setStage('admission');
      return;
    }
    onConfirmAdmission();
  };

  return (
    <div className="fixed inset-0 z-10 flex flex-col-reverse md:flex-row justify-between p-3 md:p-6 gap-3 pointer-events-none">
      {/* Left Studio Drawer (Bottom Drawer on Mobile) */}
      <aside
        aria-label="Character & Admission Studio"
        className="pointer-events-auto w-full md:w-[440px] max-h-[44vh] md:max-h-full rounded-xl bg-[#0B241C]/96 border border-[#D4A024]/35 text-[#F5F0E6] shadow-2xl flex flex-col overflow-hidden shrink-0"
      >
        {/* Studio Header */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/10">
          <div className="min-w-0">
            <h2 className="font-display text-lg md:text-xl font-bold text-[#F5F0E6] truncate">
              Student Studio
            </h2>
            <p className="text-[11px] text-[#B9C8C1] truncate">
              Customize appearance, identity &amp; faculty admission
            </p>
          </div>
          {stage === 'look' && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                title="Randomize character"
                aria-label="Randomize character"
                onClick={() => {
                  soundEngine.playUiClick();
                  onChange(
                    createRandomCharacter(
                      appearance.studentName,
                      appearance.nickname,
                      appearance.gender
                    )
                  );
                }}
                className="inline-flex items-center gap-1 rounded-md bg-[#12372B] px-2.5 py-1.5 text-xs font-semibold text-[#F5F0E6] hover:bg-[#194B3B] transition-colors cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5 text-[#D4A024]" aria-hidden="true" />
                <span className="hidden sm:inline">Random</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  onChange(
                    applyGenderPresetDefaults(
                      {
                        ...DEFAULT_CHARACTER,
                        studentName: appearance.studentName,
                        nickname: appearance.nickname,
                      },
                      appearance.gender
                    )
                  );
                }}
                className="text-xs font-medium text-[#D4A024] hover:text-[#F0C14B] px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* 3-Stage Creation Flow Bar */}
        <nav
          aria-label="Student creation steps"
          className="grid grid-cols-3 gap-1 px-2 py-1.5 bg-[#071812] border-b border-white/10 shrink-0"
        >
          {STUDIO_STAGES.map((item) => {
            const active = stage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? 'step' : undefined}
                onClick={() => handleGoToStage(item.id)}
                className={`rounded-md py-1.5 px-2 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap truncate ${
                  active
                    ? 'bg-[#164A39] text-[#F5F0E6] border border-[#D4A024]/70'
                    : 'text-[#B9C8C1] border border-transparent hover:text-white hover:bg-white/5'
                }`}
              >
                {item.step}. {item.label}
              </button>
            );
          })}
        </nav>

        {/* Stage 1: Look Sub-Tabs + Gender Selector */}
        {stage === 'look' && (
          <>
            <div className="flex items-center justify-between gap-2 px-4 py-2 bg-[#092018] border-b border-white/10 shrink-0">
              <div
                role="group"
                aria-label="Character gender"
                className="inline-flex rounded-lg bg-[#071812] p-0.5 border border-white/12"
              >
                {GENDER_OPTIONS.map((opt) => {
                  const selected = appearance.gender === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => handleGenderSelect(opt.id)}
                      className={`rounded-md px-3 py-1 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                        selected
                          ? 'bg-[#D4A024] text-[#0B241C]'
                          : 'text-[#C7D4CE] hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#C7D4CE] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showAllStyles}
                  onChange={(e) => setShowAllStyles(e.target.checked)}
                  className="accent-[#D4A024] w-3.5 h-3.5 rounded cursor-pointer"
                />
                <span>All styles</span>
              </label>
            </div>

            <div
              role="tablist"
              aria-label="Character customization categories"
              className="grid grid-cols-5 gap-1 bg-[#071812] p-1.5 border-b border-white/10 shrink-0"
            >
              {STUDIO_TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      soundEngine.playUiClick();
                      setActiveTab(tab.id);
                      onFocusChange(tab.focus);
                    }}
                    className={`rounded-md py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#D4A024] text-[#0B241C]'
                        : 'text-[#C7D4CE] hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {stage === 'look' && activeTab === 'body' && (
            <>
              <ColorSwatchRow
                label="Skin Complexion"
                value={appearance.skinTone}
                presets={SKIN_TONE_PRESETS}
                onSelect={(hex) => onChange({ ...appearance, skinTone: hex })}
              />

              <OptionChipGrid
                label={isFemale ? 'Female Body Proportions' : 'Male Body Proportions'}
                value={appearance.bodyBuild}
                options={bodyOptions}
                columns={2}
                onSelect={(bodyBuild) => onChange({ ...appearance, bodyBuild })}
              />
            </>
          )}

          {stage === 'look' && activeTab === 'face' && (
            <>
              <OptionChipGrid
                label={isFemale ? 'Female Face Structure' : 'Male Face Structure'}
                value={appearance.faceShape}
                options={FACE_SHAPE_OPTIONS}
                onSelect={(faceShape) => onChange({ ...appearance, faceShape })}
              />

              <OptionChipGrid
                label="Eye Shape"
                value={appearance.eyeShape}
                options={EYE_SHAPE_OPTIONS}
                onSelect={(eyeShape) => onChange({ ...appearance, eyeShape })}
              />

              <OptionChipGrid
                label="Nose Shape"
                value={appearance.noseShape}
                options={NOSE_SHAPE_OPTIONS}
                onSelect={(noseShape) => onChange({ ...appearance, noseShape })}
              />

              <OptionChipGrid
                label="Mouth Expression"
                value={appearance.mouthShape}
                options={MOUTH_SHAPE_OPTIONS}
                onSelect={(mouthShape) => onChange({ ...appearance, mouthShape })}
              />

              <OptionChipGrid
                label={isFemale ? 'Facial Details' : 'Facial Hair & Details'}
                value={appearance.facialDetail}
                options={facialDetailOptions}
                columns={2}
                onSelect={(facialDetail) => onChange({ ...appearance, facialDetail })}
              />
            </>
          )}

          {stage === 'look' && activeTab === 'hair' && (
            <>
              <OptionChipGrid
                label={
                  isFemale
                    ? 'Braids, Hairstyles, Hijabs & Turbans'
                    : 'Male Haircuts & Braids'
                }
                value={appearance.hairStyle}
                options={hairOptions}
                onSelect={(hairStyle) => onChange({ ...appearance, hairStyle })}
              />

              <ColorSwatchRow
                label={isHijab ? 'Hijab / Turban Color' : 'Hair Color'}
                value={appearance.hairColor}
                presets={HAIR_COLOR_PRESETS}
                onSelect={(hairColor) => onChange({ ...appearance, hairColor })}
              />
            </>
          )}

          {stage === 'look' && activeTab === 'outfit' && (
            <>
              {(isFemale || showAllStyles) && (
                <div className="flex flex-col gap-3 pb-3 border-b border-white/10">
                  <OptionChipGrid
                    label="Dresses & Gowns"
                    value={appearance.dressStyle}
                    options={DRESS_STYLE_OPTIONS}
                    onSelect={(dressStyle) => onChange({ ...appearance, dressStyle })}
                  />

                  {hasDress && (
                    <ColorSwatchRow
                      label="Dress Color"
                      value={appearance.dressColor}
                      presets={DRESS_COLOR_PRESETS}
                      onSelect={(dressColor) => onChange({ ...appearance, dressColor })}
                    />
                  )}
                </div>
              )}

              {(!hasDress || !isFemale || showAllStyles) && (
                <>
                  <OptionChipGrid
                    label={
                      isFemale
                        ? 'Female Tops & Traditional Blouses'
                        : 'Male Shirts, Hoodies & Kaftan'
                    }
                    value={appearance.topStyle}
                    options={topOptions}
                    onSelect={(topStyle) =>
                      onChange({
                        ...appearance,
                        dressStyle: 'none',
                        topStyle,
                      })
                    }
                  />

                  <ColorSwatchRow
                    label="Top Color"
                    value={appearance.shirtColor}
                    presets={SHIRT_COLOR_PRESETS}
                    onSelect={(shirtColor) =>
                      onChange({
                        ...appearance,
                        dressStyle: 'none',
                        shirtColor,
                      })
                    }
                  />

                  <OptionChipGrid
                    label={isFemale ? 'Skirts, Trousers & Shorts' : 'Trousers & Shorts'}
                    value={appearance.bottomStyle}
                    options={bottomOptions}
                    columns={2}
                    onSelect={(bottomStyle) =>
                      onChange({
                        ...appearance,
                        dressStyle: 'none',
                        bottomStyle,
                      })
                    }
                  />

                  <ColorSwatchRow
                    label={appearance.bottomStyle === 'midi-skirt' ? 'Skirt Color' : 'Bottom Color'}
                    value={appearance.trouserColor}
                    presets={TROUSER_COLOR_PRESETS}
                    onSelect={(trouserColor) =>
                      onChange({
                        ...appearance,
                        dressStyle: 'none',
                        trouserColor,
                      })
                    }
                  />
                </>
              )}

              <OptionChipGrid
                label="Footwear"
                value={appearance.footwearStyle}
                options={FOOTWEAR_STYLE_OPTIONS}
                onSelect={(footwearStyle) => onChange({ ...appearance, footwearStyle })}
              />

              <ColorSwatchRow
                label="Footwear Color"
                value={appearance.shoeColor}
                presets={SHOE_COLOR_PRESETS}
                onSelect={(shoeColor) => onChange({ ...appearance, shoeColor })}
              />
            </>
          )}

          {stage === 'look' && activeTab === 'accessories' && (
            <>
              <OptionChipGrid
                label="Eyewear"
                value={appearance.glassesStyle}
                options={GLASSES_STYLE_OPTIONS}
                onSelect={(glassesStyle) => onChange({ ...appearance, glassesStyle })}
              />

              {!isHijab && (
                <>
                  <OptionChipGrid
                    label="Headwear / Caps"
                    value={appearance.hatStyle}
                    options={HAT_STYLE_OPTIONS}
                    onSelect={(hatStyle) => onChange({ ...appearance, hatStyle })}
                  />

                  {appearance.hatStyle !== 'none' && (
                    <ColorSwatchRow
                      label="Cap / Hat Color"
                      value={appearance.hatColor}
                      presets={HAT_COLOR_PRESETS}
                      onSelect={(hatColor) => onChange({ ...appearance, hatColor })}
                    />
                  )}
                </>
              )}

              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-[#D5DDD9]">Personal Details</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    aria-pressed={appearance.hasWatch}
                    onClick={() => {
                      soundEngine.playUiClick();
                      onChange({ ...appearance, hasWatch: !appearance.hasWatch });
                    }}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold border transition-colors cursor-pointer ${
                      appearance.hasWatch
                        ? 'bg-[#164A39] text-[#F5F0E6] border-[#D4A024]'
                        : 'bg-[#081C15] text-[#B9C8C1] border-white/12'
                    }`}
                  >
                    Wristwatch: {appearance.hasWatch ? 'On' : 'Off'}
                  </button>

                  <button
                    type="button"
                    aria-pressed={appearance.hasNecklace}
                    onClick={() => {
                      soundEngine.playUiClick();
                      onChange({ ...appearance, hasNecklace: !appearance.hasNecklace });
                    }}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold border transition-colors cursor-pointer ${
                      appearance.hasNecklace
                        ? 'bg-[#164A39] text-[#F5F0E6] border-[#D4A024]'
                        : 'bg-[#081C15] text-[#B9C8C1] border-white/12'
                    }`}
                  >
                    Necklace: {appearance.hasNecklace ? 'On' : 'Off'}
                  </button>

                  <button
                    type="button"
                    aria-pressed={appearance.hasEarrings}
                    onClick={() => {
                      soundEngine.playUiClick();
                      onChange({ ...appearance, hasEarrings: !appearance.hasEarrings });
                    }}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold border transition-colors cursor-pointer ${
                      appearance.hasEarrings
                        ? 'bg-[#164A39] text-[#F5F0E6] border-[#D4A024]'
                        : 'bg-[#081C15] text-[#B9C8C1] border-white/12'
                    }`}
                  >
                    Earrings: {appearance.hasEarrings ? 'On' : 'Off'}
                  </button>

                  <button
                    type="button"
                    aria-pressed={appearance.hasBackpack}
                    onClick={() => {
                      soundEngine.playUiClick();
                      onChange({ ...appearance, hasBackpack: !appearance.hasBackpack });
                    }}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold border transition-colors cursor-pointer ${
                      appearance.hasBackpack
                        ? 'bg-[#164A39] text-[#F5F0E6] border-[#D4A024]'
                        : 'bg-[#081C15] text-[#B9C8C1] border-white/12'
                    }`}
                  >
                    Backpack: {appearance.hasBackpack ? 'On' : 'Off'}
                  </button>
                </div>
              </div>

              {appearance.hasBackpack && (
                <ColorSwatchRow
                  label="Backpack Color"
                  value={appearance.backpackColor}
                  presets={BACKPACK_COLOR_PRESETS}
                  onSelect={(backpackColor) => onChange({ ...appearance, backpackColor })}
                />
              )}
            </>
          )}

          {stage === 'admission' && (
            <>
              <div className="flex flex-col gap-3 pb-3 border-b border-white/10">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="student-name-input" className="text-xs font-semibold text-[#D5DDD9]">
                    Student Full Name
                  </label>
                  <input
                    id="student-name-input"
                    type="text"
                    maxLength={28}
                    value={appearance.studentName}
                    onChange={(e) => onChange({ ...appearance, studentName: e.target.value })}
                    placeholder="e.g. Tunde Adeyemi"
                    className="w-full rounded-lg bg-[#071812] border border-white/15 px-3 py-2 text-sm text-[#F5F0E6] focus:outline-none focus:border-[#D4A024]"
                  />
                  {attemptedValidation && identityValidation.errors.studentName && (
                    <p className="text-[11px] text-[#F39C6B]" role="alert">
                      {identityValidation.errors.studentName}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="nickname-input" className="text-xs font-semibold text-[#D5DDD9]">
                    Nickname (Campus &amp; Social Display)
                  </label>
                  <input
                    id="nickname-input"
                    type="text"
                    maxLength={16}
                    value={appearance.nickname}
                    onChange={(e) => onChange({ ...appearance, nickname: e.target.value })}
                    placeholder="e.g. TeeJay"
                    className="w-full rounded-lg bg-[#071812] border border-white/15 px-3 py-2 text-sm text-[#F5F0E6] focus:outline-none focus:border-[#D4A024]"
                  />
                  {attemptedValidation && identityValidation.errors.nickname ? (
                    <p className="text-[11px] text-[#F39C6B]" role="alert">
                      {identityValidation.errors.nickname}
                    </p>
                  ) : (
                    <p className="text-[11px] text-[#9EB2AA]">
                      Displayed on your campus HUD, menu greeting, and social interactions.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#D4A024] flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Immediate Academic Admission</span>
                    </h3>
                    <p className="text-[11px] text-[#9EB2AA] mt-0.5">
                      Choose your faculty, department, course, and level (placeholder catalogue).
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="faculty-select" className="text-xs font-semibold text-[#D5DDD9]">
                    Faculty
                  </label>
                  <select
                    id="faculty-select"
                    value={academicProfile.facultyId}
                    onChange={(e) => {
                      soundEngine.playUiClick();
                      onAcademicChange({
                        facultyId: e.target.value,
                        departmentId: '',
                        courseId: '',
                        level: academicProfile.level,
                        admitted: false,
                      });
                    }}
                    className="w-full rounded-lg bg-[#071812] border border-white/15 px-3 py-2 text-sm text-[#F5F0E6] focus:outline-none focus:border-[#D4A024]"
                  >
                    <option value="">-- Select Faculty --</option>
                    {PLACEHOLDER_FACULTIES.map((fac) => (
                      <option key={fac.id} value={fac.id}>
                        {fac.name}
                      </option>
                    ))}
                  </select>
                  {attemptedValidation && admissionValidation.errors.faculty && (
                    <p className="text-[11px] text-[#F39C6B]" role="alert">
                      {admissionValidation.errors.faculty}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="department-select" className="text-xs font-semibold text-[#D5DDD9]">
                    Department
                  </label>
                  <select
                    id="department-select"
                    value={academicProfile.departmentId}
                    disabled={!academicProfile.facultyId}
                    onChange={(e) => {
                      soundEngine.playUiClick();
                      onAcademicChange({
                        ...academicProfile,
                        departmentId: e.target.value,
                        courseId: '',
                        admitted: false,
                      });
                    }}
                    className="w-full rounded-lg bg-[#071812] border border-white/15 px-3 py-2 text-sm text-[#F5F0E6] focus:outline-none focus:border-[#D4A024] disabled:opacity-50"
                  >
                    <option value="">
                      {academicProfile.facultyId ? '-- Select Department --' : '-- Choose Faculty first --'}
                    </option>
                    {availableDepartments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  {attemptedValidation && admissionValidation.errors.department && (
                    <p className="text-[11px] text-[#F39C6B]" role="alert">
                      {admissionValidation.errors.department}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="course-select" className="text-xs font-semibold text-[#D5DDD9]">
                    Course of Study
                  </label>
                  <select
                    id="course-select"
                    value={academicProfile.courseId}
                    disabled={!academicProfile.departmentId}
                    onChange={(e) => {
                      soundEngine.playUiClick();
                      onAcademicChange({
                        ...academicProfile,
                        courseId: e.target.value,
                        admitted: false,
                      });
                    }}
                    className="w-full rounded-lg bg-[#071812] border border-white/15 px-3 py-2 text-sm text-[#F5F0E6] focus:outline-none focus:border-[#D4A024] disabled:opacity-50"
                  >
                    <option value="">
                      {academicProfile.departmentId
                        ? '-- Select Course --'
                        : '-- Choose Department first --'}
                    </option>
                    {availableCourses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.code} · {course.name}
                      </option>
                    ))}
                  </select>
                  {attemptedValidation && admissionValidation.errors.course && (
                    <p className="text-[11px] text-[#F39C6B]" role="alert">
                      {admissionValidation.errors.course}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-[#D5DDD9]">Academic Level</span>
                  <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Academic level">
                    {ACADEMIC_LEVELS.map((lvl) => {
                      const selected = academicProfile.level === lvl.id;
                      return (
                        <button
                          key={lvl.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => {
                            soundEngine.playUiClick();
                            onAcademicChange({
                              ...academicProfile,
                              level: lvl.id as AcademicLevel,
                              admitted: false,
                            });
                          }}
                          className={`rounded-lg py-2 text-xs font-bold border transition-colors cursor-pointer ${
                            selected
                              ? 'bg-[#D4A024] text-[#0B241C] border-[#D4A024]'
                              : 'bg-[#081C15] text-[#E6ECE9] border-white/12 hover:border-[#D4A024]/50'
                          }`}
                        >
                          {lvl.id}L
                        </button>
                      );
                    })}
                  </div>
                  {attemptedValidation && admissionValidation.errors.level && (
                    <p className="text-[11px] text-[#F39C6B]" role="alert">
                      {admissionValidation.errors.level}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {stage === 'review' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#D4A024]" aria-hidden="true" />
                  <h3 className="text-sm font-bold text-[#F5F0E6]">Admission Summary</h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleGoToStage('look')}
                  className="text-xs font-semibold text-[#D4A024] hover:underline cursor-pointer"
                >
                  Edit Look
                </button>
              </div>

              <div className="flex flex-col">
                <SummaryRow
                  label="Gender"
                  value={appearance.gender === 'female' ? 'Female' : 'Male'}
                />
                <SummaryRow
                  label="Student Name"
                  value={appearance.studentName.trim() || 'Not set'}
                />
                <SummaryRow label="Nickname" value={appearance.nickname.trim() || 'Not set'} />
                <SummaryRow label="Hair / Headwear" value={hairLabel} />
                <SummaryRow
                  label="Outfit"
                  value={hasDress ? dressLabel : `${topLabel} & ${bottomLabel}`}
                />
                <SummaryRow label="Footwear" value={footwearLabel} />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                <h3 className="text-sm font-bold text-[#F5F0E6]">Academic Placement</h3>
                <button
                  type="button"
                  onClick={() => handleGoToStage('admission')}
                  className="text-xs font-semibold text-[#D4A024] hover:underline cursor-pointer"
                >
                  Edit Admission
                </button>
              </div>

              <div className="flex flex-col">
                <SummaryRow label="Faculty" value={selectedFaculty?.name ?? 'Not selected'} />
                <SummaryRow label="Department" value={selectedDepartment?.name ?? 'Not selected'} />
                <SummaryRow
                  label="Course"
                  value={selectedCourse ? `${selectedCourse.code} · ${selectedCourse.name}` : 'Not selected'}
                />
                <SummaryRow
                  label="Level"
                  value={academicProfile.level ? `${academicProfile.level} Level` : 'Not selected'}
                />
              </div>

              {!readyForCampus && (
                <p
                  role="alert"
                  className="rounded-lg bg-[#3A1E14] border border-[#E07A5F]/50 px-3 py-2 text-xs text-[#F7C9B6]"
                >
                  Complete your Student Name, Nickname, Faculty, Department, Course, and Level in Step 2 before entering campus.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Navigation & Save Footer */}
        <div className="px-3 sm:px-4 py-3 border-t border-white/10 bg-[#081C15] flex items-center gap-2 shrink-0">
          {stage === 'look' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  onBack();
                }}
                className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#0B241C] px-2.5 sm:px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#F5F0E6] border border-white/15 hover:bg-[#13382B] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                <span>Back</span>
              </button>

              {isReturnFromPause && readyForCampus && (
                <button
                  type="button"
                  onClick={handleConfirmClick}
                  className="rounded-lg bg-[#164A39] px-2.5 sm:px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#F5F0E6] border border-[#D4A024]/45 hover:bg-[#1E5E49] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span className="sm:hidden">Save</span>
                  <span className="hidden sm:inline">Save Look</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleGoToStage('admission')}
                className="flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#D4A024] px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold text-[#0B241C] hover:bg-[#E2B23B] transition-colors cursor-pointer whitespace-nowrap"
              >
                <span className="sm:hidden">Admission</span>
                <span className="hidden sm:inline">Next: Identity &amp; Admission</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" aria-hidden="true" />
              </button>
            </>
          ) : stage === 'admission' ? (
            <>
              <button
                type="button"
                onClick={() => handleGoToStage('look')}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0B241C] px-3.5 py-2.5 text-sm font-semibold text-[#F5F0E6] border border-white/15 hover:bg-[#13382B] transition-colors cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Look</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAttemptedValidation(true);
                  if (readyForCampus) {
                    handleGoToStage('review');
                  } else {
                    soundEngine.playUiClick();
                  }
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#D4A024] px-4 py-2.5 text-sm font-bold text-[#0B241C] hover:bg-[#E2B23B] transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Review Admission</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleGoToStage('admission')}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0B241C] px-3.5 py-2.5 text-sm font-semibold text-[#F5F0E6] border border-white/15 hover:bg-[#13382B] transition-colors cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmClick}
                className="flex-1 rounded-lg bg-[#D4A024] px-4 py-2.5 text-sm font-bold text-[#0B241C] hover:bg-[#E2B23B] transition-colors cursor-pointer whitespace-nowrap"
              >
                Confirm Admission &amp; Enter Campus
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Interactive 3D Preview Area (Drag to rotate, scroll to zoom) + Studio Camera Controls */}
      <div
        onPointerDown={handleViewportPointerDown}
        onPointerMove={handleViewportPointerMove}
        onPointerUp={handleViewportPointerUp}
        onPointerCancel={handleViewportPointerUp}
        onWheel={handleViewportWheel}
        className="pointer-events-auto flex-1 flex flex-col justify-start md:justify-between items-end gap-1.5 min-h-[160px] touch-none select-none cursor-grab active:cursor-grabbing"
      >
        {/* Top-Right Focus Toggle (Full Body vs Head Close-Up) */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 rounded-lg bg-[#0B241C]/92 border border-[#D4A024]/30 p-1 md:p-1.5 shadow-lg cursor-default"
        >
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onFocusChange('full');
            }}
            className={`rounded-md px-2.5 py-1 md:py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              studioFocus === 'full'
                ? 'bg-[#D4A024] text-[#0B241C]'
                : 'text-[#D5DDD9] hover:bg-white/10'
            }`}
          >
            Full Body
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onFocusChange('head');
            }}
            className={`rounded-md px-2.5 py-1 md:py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              studioFocus === 'head'
                ? 'bg-[#D4A024] text-[#0B241C]'
                : 'text-[#D5DDD9] hover:bg-white/10'
            }`}
          >
            Face &amp; Hair
          </button>
        </div>

        {/* Orbit & Zoom Bar (Top-Right under Focus on Mobile, Bottom-Right on Desktop) */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="flex flex-wrap items-center justify-end gap-1 md:gap-1.5 rounded-lg bg-[#0B241C]/92 border border-[#D4A024]/30 p-1 md:p-1.5 shadow-lg cursor-default"
        >
          <button
            type="button"
            aria-label="Rotate character left"
            onClick={() => {
              soundEngine.playUiClick();
              onRotateCharacter(-Math.PI / 4);
            }}
            className="inline-flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-md bg-[#12372B] text-[#F5F0E6] hover:bg-[#1A4D3C] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Rotate character right"
            onClick={() => {
              soundEngine.playUiClick();
              onRotateCharacter(Math.PI / 4);
            }}
            className="inline-flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-md bg-[#12372B] text-[#F5F0E6] hover:bg-[#1A4D3C] transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5 md:w-4 md:h-4" aria-hidden="true" />
          </button>

          <div className="w-px h-5 md:h-6 bg-white/15 mx-0.5" aria-hidden="true" />

          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => {
              soundEngine.playUiClick();
              onZoomChange(Math.max(0.7, Number((studioZoom - 0.2).toFixed(2))));
            }}
            className="inline-flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-md bg-[#12372B] text-[#F5F0E6] hover:bg-[#1A4D3C] transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5 md:w-4 md:h-4" aria-hidden="true" />
          </button>
          <span className="font-mono-tabular text-[11px] text-[#D5DDD9] px-1 min-w-[36px] md:min-w-[40px] text-center">
            {Math.round(studioZoom * 100)}%
          </span>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => {
              soundEngine.playUiClick();
              onZoomChange(Math.min(1.9, Number((studioZoom + 0.2).toFixed(2))));
            }}
            className="inline-flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-md bg-[#12372B] text-[#F5F0E6] hover:bg-[#1A4D3C] transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5 md:w-4 md:h-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            aria-label="Reset camera view"
            title="Reset camera view"
            onClick={() => {
              soundEngine.playUiClick();
              onResetView();
            }}
            className="inline-flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-md bg-[#12372B] text-[#F5F0E6] hover:bg-[#1A4D3C] transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
