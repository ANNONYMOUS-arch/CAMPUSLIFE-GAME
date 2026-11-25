import * as THREE from 'three';
import type {
  BodyBuildId,
  BottomStyleId,
  CharacterAppearance,
  DressStyleId,
  EyeShapeId,
  FaceShapeId,
  FacialDetailId,
  FootwearStyleId,
  GlassesStyleId,
  HairStyleId,
  HatStyleId,
  MouthShapeId,
  NoseShapeId,
  TopStyleId,
} from '../types/game';

export interface CharacterRig {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  hips: THREE.Group;
  torso: THREE.Group;
  headGroup: THREE.Group;
  leftArmPivot: THREE.Group;
  rightArmPivot: THREE.Group;
  leftElbowPivot: THREE.Group;
  rightElbowPivot: THREE.Group;
  leftLegPivot: THREE.Group;
  rightLegPivot: THREE.Group;
  leftKneePivot: THREE.Group;
  rightKneePivot: THREE.Group;
  baseHipY: number;
  gaitPhase: number;
  landingSquash: number;
  dispose: () => void;
}

interface BodyMetrics {
  shoulderHalfW: number;
  chestScaleX: number;
  chestScaleZ: number;
  waistScaleX: number;
  waistScaleZ: number;
  hipScaleX: number;
  hipScaleZ: number;
  limbScale: number;
}

const BODY_METRICS: Record<BodyBuildId, BodyMetrics> = {
  slim: {
    shoulderHalfW: 0.195,
    chestScaleX: 0.90,
    chestScaleZ: 0.90,
    waistScaleX: 0.85,
    waistScaleZ: 0.88,
    hipScaleX: 0.90,
    hipScaleZ: 0.92,
    limbScale: 0.88,
  },
  average: {
    shoulderHalfW: 0.212,
    chestScaleX: 1.0,
    chestScaleZ: 1.0,
    waistScaleX: 1.0,
    waistScaleZ: 1.0,
    hipScaleX: 1.0,
    hipScaleZ: 1.0,
    limbScale: 1.0,
  },
  athletic: {
    shoulderHalfW: 0.232,
    chestScaleX: 1.12,
    chestScaleZ: 1.08,
    waistScaleX: 0.95,
    waistScaleZ: 0.96,
    hipScaleX: 0.98,
    hipScaleZ: 1.0,
    limbScale: 1.08,
  },
  curvy: {
    shoulderHalfW: 0.204,
    chestScaleX: 0.98,
    chestScaleZ: 1.08,
    waistScaleX: 0.86,
    waistScaleZ: 0.92,
    hipScaleX: 1.15,
    hipScaleZ: 1.12,
    limbScale: 1.02,
  },
  broad: {
    shoulderHalfW: 0.240,
    chestScaleX: 1.17,
    chestScaleZ: 1.16,
    waistScaleX: 1.16,
    waistScaleZ: 1.15,
    hipScaleX: 1.12,
    hipScaleZ: 1.12,
    limbScale: 1.12,
  },
};

function shiftHexColor(hex: string, lightnessDelta: number, satDelta = 0): string {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, satDelta, lightnessDelta);
  return `#${c.getHexString()}`;
}

function createAnkaraTexture(baseHex: string): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const accent1 = shiftHexColor(baseHex, 0.22, 0.08);
  const accent2 = '#D4A024';
  const dark = shiftHexColor(baseHex, -0.18, 0.04);

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 128, 128);

  // Geometric Nigerian Ankara diamond & ring motif
  ctx.strokeStyle = accent2;
  ctx.lineWidth = 4;
  for (let y = 0; y <= 128; y += 32) {
    for (let x = 0; x <= 128; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, y - 12);
      ctx.lineTo(x + 12, y);
      ctx.lineTo(x, y + 12);
      ctx.lineTo(x - 12, y);
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = accent1;
      ctx.beginPath();
      ctx.arc(x + 16, y + 16, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = dark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + 16, y + 16, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = accent2;
      ctx.lineWidth = 4;
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.needsUpdate = true;
  return tex;
}

function buildContouredLathe(
  profile: Array<[number, number]>,
  segments: number,
  scaleX: number,
  scaleZ: number
): THREE.LatheGeometry {
  const pts = profile.map(([r, y]) => new THREE.Vector2(r, y));
  const geo = new THREE.LatheGeometry(pts, segments);
  geo.scale(scaleX, 1, scaleZ);
  geo.computeVertexNormals();
  return geo;
}

function buildTorsoGeometry(
  m: BodyMetrics,
  thicknessOffset = 0,
  extendHemDown = 0,
  flaredHem = 0
): THREE.LatheGeometry {
  const o = thicknessOffset;
  const hemClearance = 0.016;
  const profile: Array<[number, number]> = [
    [0.01, -0.05 - extendHemDown],
    [0.155 * m.hipScaleX + o + hemClearance + flaredHem, -0.045 - extendHemDown],
    [0.152 * m.hipScaleX + o + hemClearance + flaredHem * 0.85, 0.02],
    [0.132 * m.waistScaleX + o + 0.01 + flaredHem * 0.35, 0.13],
    [0.145 * m.chestScaleX + o, 0.26],
    [0.158 * m.chestScaleX + o, 0.37],
    [0.132 * m.chestScaleX + o * 0.7, 0.44],
    [0.072 + o * 0.4, 0.48],
    [0.01, 0.485],
  ];
  // Lathe generates circular radius; compress Z to anatomical torso depth ratio
  const zRatio = 0.66 * (m.chestScaleZ / Math.max(0.7, m.chestScaleX));
  const geo = buildContouredLathe(profile, 18, 1.0, zRatio);
  if (extendHemDown > 0) {
    const pos = geo.attributes.position;
    const hemBottomY = -0.045 - extendHemDown;
    const span = Math.max(0.05, 0.13 - hemBottomY);
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y < 0.13) {
        const t = Math.min(1, Math.max(0, (0.13 - y) / span));
        const smooth = t * t * (3 - 2 * t);
        pos.setZ(i, pos.getZ(i) * (1 + 0.30 * smooth));
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }
  return geo;
}

function buildPelvisGeometry(m: BodyMetrics, thicknessOffset = 0): THREE.LatheGeometry {
  const o = thicknessOffset;
  const profile: Array<[number, number]> = [
    [0.01, -0.075],
    [0.138 * m.hipScaleX + o, -0.06],
    [0.148 * m.hipScaleX + o, 0.01],
    [0.126 * m.waistScaleX + o, 0.08],
    [0.01, 0.095],
  ];
  const zRatio = 0.67 * (m.hipScaleZ / Math.max(0.7, m.hipScaleX));
  return buildContouredLathe(profile, 16, 1.0, zRatio);
}

function buildMidiSkirtGeometry(m: BodyMetrics): THREE.LatheGeometry {
  const profile: Array<[number, number]> = [
    [0.14 * m.waistScaleX + 0.012, 0.08],
    [0.16 * m.hipScaleX + 0.016, 0.01],
    [0.188 * m.hipScaleX + 0.018, -0.18],
    [0.212 * m.hipScaleX + 0.022, -0.44],
  ];
  const zRatio = 0.78 * (m.hipScaleZ / Math.max(0.7, m.hipScaleX));
  return buildContouredLathe(profile, 20, 1.0, zRatio);
}

function buildDressSkirtGeometry(
  m: BodyMetrics,
  dressStyle: Exclude<DressStyleId, 'none'>
): THREE.LatheGeometry {
  let profile: Array<[number, number]>;
  let zBoost = 0.24;

  if (dressStyle === 'a-line-dress') {
    profile = [
      [0.128 * m.waistScaleX + 0.008, 0.13],
      [0.144 * m.waistScaleX + 0.012, 0.06],
      [0.168 * m.hipScaleX + 0.016, -0.02],
      [0.198 * m.hipScaleX + 0.020, -0.20],
      [0.232 * m.hipScaleX + 0.024, -0.39],
    ];
    zBoost = 0.24;
  } else if (dressStyle === 'ankara-gown') {
    profile = [
      [0.128 * m.waistScaleX + 0.008, 0.13],
      [0.146 * m.waistScaleX + 0.012, 0.06],
      [0.172 * m.hipScaleX + 0.016, -0.02],
      [0.212 * m.hipScaleX + 0.020, -0.24],
      [0.252 * m.hipScaleX + 0.026, -0.52],
    ];
    zBoost = 0.28;
  } else {
    // wrap-midi-dress
    profile = [
      [0.128 * m.waistScaleX + 0.008, 0.13],
      [0.145 * m.waistScaleX + 0.012, 0.06],
      [0.168 * m.hipScaleX + 0.015, -0.02],
      [0.190 * m.hipScaleX + 0.018, -0.22],
      [0.206 * m.hipScaleX + 0.020, -0.45],
    ];
    zBoost = 0.22;
  }

  const zRatio = 0.72 * (m.hipScaleZ / Math.max(0.7, m.hipScaleX));
  const geo = buildContouredLathe(profile, 24, 1.0, zRatio);
  const pos = geo.attributes.position;
  const bottomY = profile[profile.length - 1][1];
  const span = Math.max(0.08, 0.08 - bottomY);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < 0.08) {
      const t = Math.min(1, Math.max(0, (0.08 - y) / span));
      const smooth = t * t * (3 - 2 * t);
      pos.setZ(i, pos.getZ(i) * (1 + zBoost * smooth));
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function buildHeadAndFace(
  appearance: CharacterAppearance,
  skinMat: THREE.MeshStandardMaterial,
  hairMat: THREE.MeshStandardMaterial,
  darkMat: THREE.MeshStandardMaterial,
  scleraMat: THREE.MeshStandardMaterial,
  lipMat: THREE.MeshStandardMaterial,
  irisMat: THREE.MeshStandardMaterial,
  track: <T extends { dispose: () => void }>(item: T) => T
): THREE.Group {
  const headGroup = new THREE.Group();

  // Neck bridging shoulders to skull
  const neck = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.052, 0.064, 0.115, 14)),
    skinMat
  );
  neck.position.set(0, 0.035, 0.004);
  neck.castShadow = true;
  headGroup.add(neck);

  // Face-shape multipliers
  const faceMods: Record<FaceShapeId, { jawW: number; jawY: number; cheekW: number; craniumY: number }> = {
    oval: { jawW: 0.90, jawY: 0.140, cheekW: 0.98, craniumY: 0.195 },
    round: { jawW: 1.04, jawY: 0.146, cheekW: 1.06, craniumY: 0.192 },
    square: { jawW: 1.05, jawY: 0.138, cheekW: 1.01, craniumY: 0.195 },
    heart: { jawW: 0.80, jawY: 0.136, cheekW: 1.04, craniumY: 0.197 },
  };
  const fm = faceMods[appearance.faceShape];

  // Upper cranium
  const cranium = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.112, 20, 16)),
    skinMat
  );
  cranium.position.set(0, fm.craniumY, 0.004);
  cranium.scale.set(fm.cheekW, 1.05, 1.04);
  cranium.castShadow = true;
  headGroup.add(cranium);

  // Sculpted lower face / jaw / chin
  const jaw = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.095, 18, 14)),
    skinMat
  );
  jaw.position.set(0, fm.jawY, -0.012);
  jaw.scale.set(fm.jawW * 0.92, 0.88, 0.95);
  jaw.castShadow = true;
  headGroup.add(jaw);

  // Ears (left and right)
  const earGeo = track(new THREE.SphereGeometry(0.025, 10, 10));
  const leftEar = new THREE.Mesh(earGeo, skinMat);
  leftEar.position.set(-0.106 * fm.cheekW, 0.178, 0.01);
  leftEar.scale.set(0.45, 1.1, 0.72);
  leftEar.rotation.z = 0.12;
  const rightEar = new THREE.Mesh(earGeo, skinMat);
  rightEar.position.set(0.106 * fm.cheekW, 0.178, 0.01);
  rightEar.scale.set(0.45, 1.1, 0.72);
  rightEar.rotation.z = -0.12;
  headGroup.add(leftEar, rightEar);

  // Eyes (facing -Z)
  const eyeConfigs: Record<EyeShapeId, { sx: number; sy: number; tilt: number; browLift: number }> = {
    almond: { sx: 1.12, sy: 0.82, tilt: 0.09, browLift: 0.024 },
    round: { sx: 1.0, sy: 1.05, tilt: 0.0, browLift: 0.028 },
    wide: { sx: 1.18, sy: 0.96, tilt: 0.04, browLift: 0.027 },
    relaxed: { sx: 1.08, sy: 0.70, tilt: -0.06, browLift: 0.021 },
  };
  const ec = eyeConfigs[appearance.eyeShape];

  const scleraGeo = track(new THREE.SphereGeometry(0.017, 12, 10));
  const irisGeo = track(new THREE.SphereGeometry(0.0105, 10, 8));
  const pupilGeo = track(new THREE.SphereGeometry(0.0058, 8, 8));
  const browGeo = track(new THREE.CapsuleGeometry(0.0042, 0.028, 4, 8));

  for (const side of [-1, 1]) {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(side * 0.042, 0.194, -0.099);
    eyeGroup.rotation.y = side * -0.16;

    const sclera = new THREE.Mesh(scleraGeo, scleraMat);
    sclera.scale.set(ec.sx * 1.15, ec.sy * 0.78, 0.65);

    const iris = new THREE.Mesh(irisGeo, irisMat);
    iris.position.set(0, 0, -0.006);
    iris.scale.set(1.0, 1.0, 0.65);

    const pupil = new THREE.Mesh(pupilGeo, darkMat);
    pupil.position.set(0, 0, -0.0095);
    pupil.scale.set(1.0, 1.0, 0.6);

    const brow = new THREE.Mesh(browGeo, hairMat);
    brow.position.set(0, ec.browLift, -0.011);
    brow.rotation.z = Math.PI / 2 + side * ec.tilt;

    eyeGroup.add(sclera, iris, pupil, brow);
    headGroup.add(eyeGroup);
  }

  // Nose
  const noseConfigs: Record<NoseShapeId, { w: number; h: number; z: number }> = {
    balanced: { w: 1.0, h: 1.0, z: 1.0 },
    broad: { w: 1.28, h: 0.92, z: 0.94 },
    aquiline: { w: 0.84, h: 1.14, z: 1.16 },
    button: { w: 0.92, h: 0.84, z: 0.88 },
  };
  const nc = noseConfigs[appearance.noseShape];

  const noseGroup = new THREE.Group();
  noseGroup.position.set(0, 0.171, -0.106);

  const bridge = new THREE.Mesh(
    track(new THREE.CapsuleGeometry(0.0075 * nc.w, 0.024 * nc.h, 4, 8)),
    skinMat
  );
  bridge.position.set(0, 0.008, -0.003 * nc.z);
  bridge.rotation.x = -0.26;

  const noseTip = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.0135 * nc.w, 10, 8)),
    skinMat
  );
  noseTip.position.set(0, -0.008, -0.011 * nc.z);
  noseTip.scale.set(1.1, 0.85, 0.92);

  noseGroup.add(bridge, noseTip);
  headGroup.add(noseGroup);

  // Mouth / Lips
  const mouthConfigs: Record<MouthShapeId, { w: number; thick: number; curve: number }> = {
    neutral: { w: 1.0, thick: 1.0, curve: 0.0 },
    'warm-smile': { w: 1.14, thick: 0.96, curve: 0.005 },
    'full-lips': { w: 1.05, thick: 1.28, curve: 0.002 },
    calm: { w: 0.88, thick: 0.86, curve: -0.001 },
  };
  const mc = mouthConfigs[appearance.mouthShape];

  const mouthGroup = new THREE.Group();
  mouthGroup.position.set(0, 0.128, -0.102);

  const upperLip = new THREE.Mesh(
    track(new THREE.CapsuleGeometry(0.0052 * mc.thick, 0.024 * mc.w, 4, 8)),
    lipMat
  );
  upperLip.rotation.z = Math.PI / 2;
  upperLip.position.set(0, 0.003, -0.002);

  const lowerLip = new THREE.Mesh(
    track(new THREE.CapsuleGeometry(0.0062 * mc.thick, 0.020 * mc.w, 4, 8)),
    lipMat
  );
  lowerLip.rotation.z = Math.PI / 2;
  lowerLip.position.set(0, -0.004 - mc.curve * 0.4, -0.001);

  if (mc.curve > 0.003) {
    // Subtle upturned smile corners
    const cornerGeo = track(new THREE.SphereGeometry(0.0042, 6, 6));
    const cL = new THREE.Mesh(cornerGeo, lipMat);
    cL.position.set(-0.018 * mc.w, 0.002, 0.002);
    const cR = new THREE.Mesh(cornerGeo, lipMat);
    cR.position.set(0.018 * mc.w, 0.002, 0.002);
    mouthGroup.add(cL, cR);
  }
  mouthGroup.add(upperLip, lowerLip);
  headGroup.add(mouthGroup);

  // Facial details (beard / stubble / freckles)
  buildFacialDetail(appearance.facialDetail, fm.jawW, hairMat, skinMat, headGroup, track);

  return headGroup;
}

function buildFacialDetail(
  detail: FacialDetailId,
  jawW: number,
  hairMat: THREE.MeshStandardMaterial,
  skinMat: THREE.MeshStandardMaterial,
  headGroup: THREE.Group,
  track: <T extends { dispose: () => void }>(item: T) => T
): void {
  if (detail === 'none') return;

  if (detail === 'freckles-beauty') {
    const freckleMat = track(
      new THREE.MeshStandardMaterial({
        color: shiftHexColor(`#${skinMat.color.getHexString()}`, -0.16, 0.08),
        roughness: 0.78,
      })
    );
    const dotGeo = track(new THREE.SphereGeometry(0.0032, 6, 6));
    const coords: Array<[number, number, number]> = [
      [-0.048, 0.164, -0.095],
      [-0.056, 0.158, -0.090],
      [-0.042, 0.155, -0.097],
      [0.048, 0.164, -0.095],
      [0.056, 0.158, -0.090],
      [0.042, 0.155, -0.097],
    ];
    for (const [x, y, z] of coords) {
      const d = new THREE.Mesh(dotGeo, freckleMat);
      d.position.set(x, y, z);
      d.scale.set(1, 1, 0.45);
      headGroup.add(d);
    }
    return;
  }

  if (detail === 'light-stubble') {
    const stubbleMat = track(
      new THREE.MeshStandardMaterial({
        color: `#${hairMat.color.getHexString()}`,
        roughness: 0.92,
        transparent: true,
        opacity: 0.34,
      })
    );
    const chinStubble = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.056, 14, 10)),
      stubbleMat
    );
    chinStubble.position.set(0, 0.114, -0.052);
    chinStubble.scale.set(jawW * 1.12, 0.62, 0.88);
    headGroup.add(chinStubble);
    return;
  }

  if (detail === 'beard-goatee') {
    const chin = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.038, 12, 10)),
      hairMat
    );
    chin.position.set(0, 0.102, -0.072);
    chin.scale.set(0.82, 0.78, 0.82);
    const stache = new THREE.Mesh(
      track(new THREE.CapsuleGeometry(0.0055, 0.036, 4, 8)),
      hairMat
    );
    stache.rotation.z = Math.PI / 2;
    stache.position.set(0, 0.141, -0.099);
    headGroup.add(chin, stache);
    return;
  }

  // full-beard: tight jawline & chin beard sitting cleanly below mouth
  const chinBeard = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.086, 16, 12, 0, Math.PI * 2, Math.PI * 0.56, Math.PI * 0.42)),
    hairMat
  );
  chinBeard.position.set(0, 0.134, -0.012);
  chinBeard.scale.set(jawW * 0.94, 0.88, 0.96);
  chinBeard.castShadow = true;

  const stache = new THREE.Mesh(
    track(new THREE.CapsuleGeometry(0.0052, 0.036, 4, 8)),
    hairMat
  );
  stache.rotation.z = Math.PI / 2;
  stache.position.set(0, 0.141, -0.101);
  headGroup.add(chinBeard, stache);
}

function buildHairMeshGroup(
  hairStyle: HairStyleId,
  hairMat: THREE.MeshStandardMaterial,
  compressCrownForHat: boolean,
  track: <T extends { dispose: () => void }>(item: T) => T
): THREE.Group {
  const group = new THREE.Group();
  // Head cranium center is at y = 0.195 inside headGroup
  const craniumY = 0.195;
  const crownScaleY = compressCrownForHat ? 0.82 : 1.0;

  if (hairStyle === 'low-fade') {
    const scalp = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.114, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.45)),
      hairMat
    );
    scalp.position.set(0, craniumY + 0.008, 0.008);
    scalp.rotation.x = 0.24;
    scalp.scale.set(0.99, 1.02 * crownScaleY, 1.03);
    scalp.castShadow = true;
    group.add(scalp);
  } else if (hairStyle === 'high-fade') {
    const base = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.114, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.43)),
      hairMat
    );
    base.position.set(0, craniumY + 0.01, 0.008);
    base.rotation.x = 0.22;
    base.scale.set(0.98, 1.02, 1.03);

    const flatTop = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.096, 0.102, compressCrownForHat ? 0.045 : 0.088, 16)),
      hairMat
    );
    flatTop.position.set(0, craniumY + (compressCrownForHat ? 0.078 : 0.114), 0.006);
    flatTop.scale.set(0.98, 1, 1.03);
    flatTop.castShadow = true;
    group.add(base, flatTop);
  } else if (hairStyle === 'natural-afro') {
    const afroMain = new THREE.Mesh(
      track(new THREE.SphereGeometry(compressCrownForHat ? 0.126 : 0.164, 18, 14)),
      hairMat
    );
    afroMain.position.set(0, craniumY + (compressCrownForHat ? 0.032 : 0.052), 0.036);
    afroMain.scale.set(1.06, 0.96, 1.02);
    afroMain.castShadow = true;

    const afroBack = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.125, 14, 12)),
      hairMat
    );
    afroBack.position.set(0, craniumY - 0.012, 0.078);
    group.add(afroMain, afroBack);
  } else if (hairStyle === 'short-natural') {
    const cap = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.119, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.48)),
      hairMat
    );
    cap.position.set(0, craniumY + 0.009, 0.010);
    cap.rotation.x = 0.24;
    cap.scale.set(1.01, 1.03 * crownScaleY, 1.04);
    cap.castShadow = true;
    group.add(cap);
  } else if (hairStyle === 'twists') {
    const scalp = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.114, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.45)),
      hairMat
    );
    scalp.position.set(0, craniumY + 0.008, 0.009);
    scalp.rotation.x = 0.24;
    scalp.scale.set(0.99, 1.03, 1.04);
    group.add(scalp);

    const twistGeo = track(new THREE.CapsuleGeometry(0.013, 0.068, 4, 8));
    const count = 14;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const isFront = Math.cos(a) < -0.3;
      const twist = new THREE.Mesh(twistGeo, hairMat);
      const radius = isFront ? 0.102 : 0.114;
      const yOff = isFront ? 0.088 : 0.042;
      twist.position.set(
        Math.sin(a) * radius,
        craniumY + yOff,
        Math.cos(a) * radius + 0.014
      );
      twist.rotation.x = Math.cos(a) * -0.45;
      twist.rotation.z = Math.sin(a) * -0.45;
      twist.castShadow = true;
      group.add(twist);
    }
  } else if (hairStyle === 'locs') {
    const crown = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.116, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.46)),
      hairMat
    );
    crown.position.set(0, craniumY + 0.01, 0.010);
    crown.rotation.x = 0.24;
    crown.scale.set(1.01, 1.04 * crownScaleY, 1.05);
    group.add(crown);

    const locGeo = track(new THREE.CapsuleGeometry(0.013, 0.21, 4, 8));
    const angles = [-2.35, -1.95, -1.55, -1.2, 1.2, 1.55, 1.95, 2.35, 2.7, -2.7, 3.14, 0.78, -0.78];
    for (const a of angles) {
      const loc = new THREE.Mesh(locGeo, hairMat);
      const r = 0.118;
      loc.position.set(Math.sin(a) * r, craniumY - 0.085, Math.cos(a) * -r + 0.022);
      loc.rotation.z = Math.sin(a) * -0.1;
      loc.rotation.x = Math.cos(a) < 0 ? -0.06 : 0.14;
      loc.castShadow = true;
      group.add(loc);
    }
  } else if (hairStyle === 'box-braids') {
    const crown = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.116, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.46)),
      hairMat
    );
    crown.position.set(0, craniumY + 0.008, 0.010);
    crown.rotation.x = 0.24;
    crown.scale.set(1.0, 1.03 * crownScaleY, 1.04);
    group.add(crown);

    const braidGeo = track(new THREE.CapsuleGeometry(0.011, 0.24, 4, 7));
    const beadGeo = track(new THREE.CylinderGeometry(0.013, 0.013, 0.016, 8));
    const beadMat = track(
      new THREE.MeshStandardMaterial({ color: '#D4A024', roughness: 0.35, metalness: 0.65 })
    );
    const angles = [
      -2.75, -2.35, -1.95, -1.55, -1.2, -0.88,
      0.88, 1.2, 1.55, 1.95, 2.35, 2.75, 3.14,
    ];
    for (let i = 0; i < angles.length; i++) {
      const a = angles[i];
      const braid = new THREE.Mesh(braidGeo, hairMat);
      const r = 0.116;
      const bx = Math.sin(a) * r;
      const bz = Math.cos(a) * -r + 0.022;
      braid.position.set(bx, craniumY - 0.10, bz);
      braid.rotation.z = Math.sin(a) * -0.08;
      braid.rotation.x = 0.11;
      braid.castShadow = true;
      group.add(braid);

      if (i % 2 === 0) {
        const bead = new THREE.Mesh(beadGeo, beadMat);
        bead.position.set(bx * 1.03, craniumY - 0.215, bz + 0.018);
        group.add(bead);
      }
    }
  } else if (hairStyle === 'cornrows') {
    const base = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.113, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.46)),
      hairMat
    );
    base.position.set(0, craniumY + 0.006, 0.009);
    base.rotation.x = 0.24;
    base.scale.set(0.985, 1.03, 1.04);
    group.add(base);

    const rowGeo = track(new THREE.TorusGeometry(0.114, 0.010, 7, 16, Math.PI * 0.85));
    for (let i = -3; i <= 3; i++) {
      const row = new THREE.Mesh(rowGeo, hairMat);
      row.position.set(i * 0.025, craniumY + 0.008, 0.012);
      row.rotation.y = Math.PI / 2;
      row.rotation.z = i * 0.11 + 0.18;
      row.scale.set(1.02, 1.02, 0.95);
      row.castShadow = true;
      group.add(row);
    }

    const bun = new THREE.Mesh(track(new THREE.SphereGeometry(0.052, 12, 10)), hairMat);
    bun.position.set(0, craniumY - 0.045, 0.118);
    group.add(bun);
  } else if (hairStyle === 'afro-puffs') {
    const base = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.114, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.46)),
      hairMat
    );
    base.position.set(0, craniumY + 0.008, 0.010);
    base.rotation.x = 0.24;
    base.scale.set(0.99, 1.03, 1.04);
    group.add(base);

    const puffGeo = track(new THREE.SphereGeometry(compressCrownForHat ? 0.058 : 0.084, 14, 12));
    const puffL = new THREE.Mesh(puffGeo, hairMat);
    puffL.position.set(-0.095, craniumY + (compressCrownForHat ? 0.065 : 0.095), 0.025);
    puffL.castShadow = true;
    const puffR = new THREE.Mesh(puffGeo, hairMat);
    puffR.position.set(0.095, craniumY + (compressCrownForHat ? 0.065 : 0.095), 0.025);
    puffR.castShadow = true;
    group.add(puffL, puffR);
  } else if (hairStyle === 'hijab-classic') {
    // Open face-framing hijab wrap: back hood + face-framing collar + chest drape (never covers eyes/face!)
    const backHood = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.125, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.56)),
      hairMat
    );
    backHood.position.set(0, craniumY + 0.002, 0.018);
    backHood.rotation.x = 0.52;
    backHood.scale.set(1.03, 1.06, 1.06);
    backHood.castShadow = true;

    const faceRim = new THREE.Mesh(
      track(new THREE.TorusGeometry(0.098, 0.026, 10, 22)),
      hairMat
    );
    faceRim.position.set(0, craniumY - 0.012, -0.052);
    faceRim.scale.set(0.96, 1.15, 0.85);
    faceRim.castShadow = true;

    const neckWrap = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.092, 0.142, 0.15, 16)),
      hairMat
    );
    neckWrap.position.set(0, 0.055, 0.014);
    neckWrap.scale.set(1.06, 1.0, 0.88);
    neckWrap.castShadow = true;

    const frontDrape = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.126, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52)),
      hairMat
    );
    frontDrape.position.set(0, -0.02, -0.015);
    frontDrape.scale.set(1.14, 0.86, 0.68);
    frontDrape.rotation.x = Math.PI;
    group.add(backHood, faceRim, neckWrap, frontDrape);
  } else if (hairStyle === 'hijab-turban') {
    const wrapBase = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.122, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.50)),
      hairMat
    );
    wrapBase.position.set(0, craniumY + 0.014, 0.014);
    wrapBase.rotation.x = 0.28;
    wrapBase.scale.set(1.03, 1.06, 1.05);
    wrapBase.castShadow = true;

    const band1 = new THREE.Mesh(track(new THREE.TorusGeometry(0.114, 0.022, 10, 20)), hairMat);
    band1.position.set(0, craniumY + 0.062, 0.010);
    band1.rotation.x = Math.PI / 2 - 0.26;
    band1.rotation.y = 0.14;

    const knot = new THREE.Mesh(track(new THREE.SphereGeometry(0.036, 10, 10)), hairMat);
    knot.position.set(0, craniumY + 0.088, -0.088);
    knot.scale.set(1.25, 0.82, 0.78);
    group.add(wrapBase, band1, knot);
  } else {
    // side-part
    const crown = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.118, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.46)),
      hairMat
    );
    crown.position.set(0.005, craniumY + 0.012, 0.010);
    crown.rotation.x = 0.24;
    crown.scale.set(1.01, 1.05 * crownScaleY, 1.05);
    crown.castShadow = true;

    const wave = new THREE.Mesh(track(new THREE.CapsuleGeometry(0.024, 0.10, 6, 10)), hairMat);
    wave.position.set(0.03, craniumY + (compressCrownForHat ? 0.06 : 0.092), -0.035);
    wave.rotation.z = Math.PI / 2 - 0.18;
    wave.rotation.y = 0.25;
    group.add(crown, wave);
  }

  return group;
}

function buildHatMesh(
  hatStyle: HatStyleId,
  hatColor: string,
  track: <T extends { dispose: () => void }>(item: T) => T
): THREE.Group {
  const group = new THREE.Group();
  if (hatStyle === 'none') return group;

  const hatMat = track(
    new THREE.MeshStandardMaterial({
      color: hatColor,
      roughness: 0.72,
      metalness: 0.04,
    })
  );

  const craniumY = 0.195;

  if (hatStyle === 'baseball-cap') {
    const dome = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.125, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52)),
      hatMat
    );
    dome.position.set(0, craniumY + 0.028, 0.004);
    dome.scale.set(1.01, 0.96, 1.06);
    dome.castShadow = true;

    // Curved front visor (-Z)
    const brim = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.118, 0.126, 0.012, 16, 1, false, Math.PI * 0.68, Math.PI * 0.64)),
      hatMat
    );
    brim.position.set(0, craniumY + 0.036, -0.055);
    brim.rotation.x = 0.14;
    brim.castShadow = true;
    group.add(dome, brim);
  } else if (hatStyle === 'beanie') {
    const knit = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.127, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.56)),
      hatMat
    );
    knit.position.set(0, craniumY + 0.032, 0.008);
    knit.scale.set(1.02, 1.15, 1.08);
    knit.castShadow = true;

    const cuff = new THREE.Mesh(track(new THREE.TorusGeometry(0.122, 0.018, 8, 20)), hatMat);
    cuff.position.set(0, craniumY + 0.036, 0.005);
    cuff.rotation.x = Math.PI / 2 - 0.12;
    cuff.scale.set(1.0, 1.07, 1.0);
    group.add(knit, cuff);
  } else if (hatStyle === 'bucket-hat') {
    const crown = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.114, 0.125, 0.095, 18)),
      hatMat
    );
    crown.position.set(0, craniumY + 0.072, 0.005);
    crown.scale.set(1.0, 1.0, 1.05);
    crown.castShadow = true;

    const brim = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.125, 0.185, 0.042, 20, 1, true)),
      track(
        new THREE.MeshStandardMaterial({
          color: hatColor,
          roughness: 0.74,
          side: THREE.DoubleSide,
        })
      )
    );
    brim.position.set(0, craniumY + 0.025, 0.005);
    brim.scale.set(1.0, 1.0, 1.06);
    brim.castShadow = true;
    group.add(crown, brim);
  }

  return group;
}

function buildGlassesMesh(
  style: GlassesStyleId,
  track: <T extends { dispose: () => void }>(item: T) => T
): THREE.Group {
  const group = new THREE.Group();
  if (style === 'none') return group;

  const isSunglasses = style === 'sunglasses';
  const frameMat = track(
    new THREE.MeshStandardMaterial({
      color: style === 'round' ? '#B9923B' : '#1E2226',
      roughness: 0.25,
      metalness: style === 'round' ? 0.75 : 0.3,
    })
  );
  const lensMat = track(
    new THREE.MeshStandardMaterial({
      color: isSunglasses ? '#11161B' : '#CFE6F0',
      roughness: 0.1,
      metalness: isSunglasses ? 0.45 : 0.1,
      transparent: true,
      opacity: isSunglasses ? 0.92 : 0.28,
    })
  );

  const eyeY = 0.194;
  const zFront = -0.118;

  for (const side of [-1, 1]) {
    if (style === 'round') {
      const rim = new THREE.Mesh(track(new THREE.TorusGeometry(0.023, 0.0032, 8, 18)), frameMat);
      rim.position.set(side * 0.043, eyeY, zFront);
      rim.rotation.y = side * -0.12;
      group.add(rim);
    } else {
      const rim = new THREE.Mesh(track(new THREE.BoxGeometry(0.052, 0.036, 0.006)), frameMat);
      rim.position.set(side * 0.044, eyeY, zFront);
      rim.rotation.y = side * -0.12;
      const lens = new THREE.Mesh(track(new THREE.BoxGeometry(0.045, 0.029, 0.008)), lensMat);
      lens.position.set(side * 0.044, eyeY, zFront);
      lens.rotation.y = side * -0.12;
      group.add(rim, lens);
    }

    // Temple arm reaching back smoothly to ear
    const temple = new THREE.Mesh(track(new THREE.BoxGeometry(0.004, 0.005, 0.125)), frameMat);
    temple.position.set(side * 0.078, eyeY + 0.004, -0.056);
    temple.rotation.y = side * -0.18;
    group.add(temple);
  }

  const bridge = new THREE.Mesh(track(new THREE.BoxGeometry(0.028, 0.0045, 0.005)), frameMat);
  bridge.position.set(0, eyeY + 0.004, zFront);
  group.add(bridge);

  return group;
}

function buildFootMesh(
  footwearStyle: FootwearStyleId,
  shoeMat: THREE.MeshStandardMaterial,
  soleMat: THREE.MeshStandardMaterial,
  skinMat: THREE.MeshStandardMaterial,
  track: <T extends { dispose: () => void }>(item: T) => T
): THREE.Group {
  const foot = new THREE.Group();

  // Sole sits cleanly from y = 0.00 to y = 0.024
  const sole = new THREE.Mesh(track(new THREE.BoxGeometry(0.088, 0.024, 0.215)), soleMat);
  sole.position.set(0, 0.012, -0.038);
  sole.castShadow = true;
  foot.add(sole);

  // Rounded toe tip of sole
  const toeSole = new THREE.Mesh(track(new THREE.CylinderGeometry(0.044, 0.044, 0.024, 12)), soleMat);
  toeSole.position.set(0, 0.012, -0.145);
  foot.add(toeSole);

  if (footwearStyle === 'sneakers' || footwearStyle === 'formal-shoes') {
    const upperMat =
      footwearStyle === 'formal-shoes'
        ? track(
            new THREE.MeshStandardMaterial({
              color: `#${shoeMat.color.getHexString()}`,
              roughness: 0.28,
              metalness: 0.12,
            })
          )
        : shoeMat;

    const heelCap = new THREE.Mesh(track(new THREE.CylinderGeometry(0.044, 0.045, 0.056, 12)), upperMat);
    heelCap.position.set(0, 0.046, 0.024);
    heelCap.castShadow = true;

    const vamp = new THREE.Mesh(track(new THREE.BoxGeometry(0.084, 0.046, 0.14)), upperMat);
    vamp.position.set(0, 0.042, -0.042);
    vamp.castShadow = true;

    const toeCap = new THREE.Mesh(track(new THREE.SphereGeometry(0.043, 12, 10)), upperMat);
    toeCap.position.set(0, 0.036, -0.126);
    toeCap.scale.set(1.0, 0.68, 1.25);
    toeCap.castShadow = true;
    foot.add(heelCap, vamp, toeCap);
  } else {
    // Exposed anatomical skin foot + sandals or slides straps
    const bareFoot = new THREE.Mesh(track(new THREE.BoxGeometry(0.078, 0.034, 0.165)), skinMat);
    bareFoot.position.set(0, 0.036, -0.04);
    const bareToe = new THREE.Mesh(track(new THREE.SphereGeometry(0.039, 10, 8)), skinMat);
    bareToe.position.set(0, 0.031, -0.13);
    bareToe.scale.set(1.0, 0.6, 1.1);
    foot.add(bareFoot, bareToe);

    if (footwearStyle === 'slides') {
      const band = new THREE.Mesh(track(new THREE.CylinderGeometry(0.046, 0.046, 0.058, 12, 1, false, -Math.PI * 0.55, Math.PI * 1.1)), shoeMat);
      band.position.set(0, 0.034, -0.068);
      band.rotation.x = Math.PI / 2;
      band.scale.set(1.0, 1.0, 0.85);
      band.castShadow = true;
      foot.add(band);
    } else {
      // Strapped sandals
      const frontStrap = new THREE.Mesh(track(new THREE.TorusGeometry(0.043, 0.008, 6, 14, Math.PI)), shoeMat);
      frontStrap.position.set(0, 0.03, -0.088);
      frontStrap.rotation.z = 0;
      const ankleStrap = new THREE.Mesh(track(new THREE.TorusGeometry(0.046, 0.008, 6, 14)), shoeMat);
      ankleStrap.position.set(0, 0.068, 0.005);
      ankleStrap.rotation.x = Math.PI / 2;
      foot.add(frontStrap, ankleStrap);
    }
  }

  return foot;
}

export function buildCharacterRig(appearance: CharacterAppearance): CharacterRig {
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  const baseM = BODY_METRICS[appearance.bodyBuild] ?? BODY_METRICS.average;
  const m: BodyMetrics =
    appearance.gender === 'female'
      ? {
          shoulderHalfW: baseM.shoulderHalfW * 0.94,
          chestScaleX: baseM.chestScaleX * 0.96,
          chestScaleZ: baseM.chestScaleZ * 1.01,
          waistScaleX: baseM.waistScaleX * 0.91,
          waistScaleZ: baseM.waistScaleZ * 0.94,
          hipScaleX: baseM.hipScaleX * 1.07,
          hipScaleZ: baseM.hipScaleZ * 1.04,
          limbScale: baseM.limbScale * 0.95,
        }
      : baseM;

  const hasDress = appearance.dressStyle !== 'none';

  const skinMat = track(
    new THREE.MeshStandardMaterial({
      color: appearance.skinTone,
      roughness: 0.64,
      metalness: 0.02,
    })
  );
  const baseSkin = new THREE.Color(appearance.skinTone);
  const lipColor = baseSkin.clone().lerp(new THREE.Color('#7B3E3B'), 0.52).offsetHSL(0, 0.04, -0.04);
  const lipMat = track(
    new THREE.MeshStandardMaterial({
      color: lipColor,
      roughness: 0.48,
      metalness: 0.02,
    })
  );
  const scleraMat = track(
    new THREE.MeshStandardMaterial({ color: '#F6F4EF', roughness: 0.35, metalness: 0.0 })
  );
  const irisMat = track(
    new THREE.MeshStandardMaterial({ color: '#2B1B12', roughness: 0.22, metalness: 0.05 })
  );
  const darkMat = track(
    new THREE.MeshStandardMaterial({ color: '#111417', roughness: 0.25, metalness: 0.1 })
  );

  const rawAnkaraTex =
    !hasDress && appearance.topStyle === 'ankara-top'
      ? createAnkaraTexture(appearance.shirtColor)
      : null;
  const ankaraTex = rawAnkaraTex ? track(rawAnkaraTex) : null;

  const rawDressAnkaraTex =
    appearance.dressStyle === 'ankara-gown'
      ? createAnkaraTexture(appearance.dressColor)
      : null;
  const dressAnkaraTex = rawDressAnkaraTex ? track(rawDressAnkaraTex) : null;

  const shirtMat = track(
    new THREE.MeshStandardMaterial({
      color: ankaraTex ? '#FFFFFF' : appearance.shirtColor,
      map: ankaraTex,
      roughness: 0.76,
      metalness: 0.03,
    })
  );
  const dressMat = track(
    new THREE.MeshStandardMaterial({
      color: dressAnkaraTex ? '#FFFFFF' : appearance.dressColor,
      map: dressAnkaraTex,
      roughness: 0.74,
      metalness: 0.03,
      side: THREE.DoubleSide,
    })
  );
  const dressSolidMat = track(
    new THREE.MeshStandardMaterial({
      color: appearance.dressColor,
      roughness: 0.74,
      metalness: 0.03,
    })
  );
  const dressTrimMat = track(
    new THREE.MeshStandardMaterial({
      color:
        appearance.dressStyle === 'ankara-gown'
          ? '#D4A024'
          : shiftHexColor(appearance.dressColor, -0.14),
      roughness: 0.44,
      metalness: appearance.dressStyle === 'ankara-gown' ? 0.45 : 0.04,
    })
  );
  const innerTeeMat = track(
    new THREE.MeshStandardMaterial({
      color: '#F3EEE3',
      roughness: 0.78,
      metalness: 0.02,
    })
  );
  const accentTrimMat = track(
    new THREE.MeshStandardMaterial({
      color: '#D4A024',
      roughness: 0.42,
      metalness: 0.45,
    })
  );
  const trouserMat = track(
    new THREE.MeshStandardMaterial({
      color: appearance.trouserColor,
      roughness: appearance.bottomStyle === 'jeans' ? 0.88 : 0.80,
      metalness: 0.03,
    })
  );
  const shoeMat = track(
    new THREE.MeshStandardMaterial({
      color: appearance.shoeColor,
      roughness: 0.52,
      metalness: 0.06,
    })
  );
  const soleMat = track(
    new THREE.MeshStandardMaterial({
      color: appearance.footwearStyle === 'formal-shoes' ? '#1E1D1B' : '#EAE6DD',
      roughness: 0.65,
      metalness: 0.02,
    })
  );
  const hairMat = track(
    new THREE.MeshStandardMaterial({
      color: appearance.hairColor,
      roughness:
        appearance.hairStyle === 'hijab-classic' || appearance.hairStyle === 'hijab-turban'
          ? 0.74
          : 0.88,
      metalness: 0.02,
    })
  );
  const backpackMat = track(
    new THREE.MeshStandardMaterial({
      color: appearance.backpackColor,
      roughness: 0.68,
      metalness: 0.06,
    })
  );
  const goldMat = track(
    new THREE.MeshStandardMaterial({
      color: '#D4A024',
      roughness: 0.25,
      metalness: 0.82,
    })
  );

  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  const baseHipY = 0.88;
  const hips = new THREE.Group();
  hips.position.set(0, baseHipY, 0);
  bodyPivot.add(hips);

  // Pelvis / Bottom garment hip wrap
  const pelvisGeo = track(buildPelvisGeometry(m, 0.005));
  const pelvisMesh = new THREE.Mesh(pelvisGeo, hasDress ? dressMat : trouserMat);
  pelvisMesh.castShadow = true;
  hips.add(pelvisMesh);

  if (hasDress && appearance.dressStyle !== 'none') {
    const dressSkirtMesh = new THREE.Mesh(
      track(buildDressSkirtGeometry(m, appearance.dressStyle)),
      dressMat
    );
    dressSkirtMesh.castShadow = true;
    hips.add(dressSkirtMesh);
  } else if (appearance.bottomStyle === 'midi-skirt') {
    const skirtMat = track(
      new THREE.MeshStandardMaterial({
        color: appearance.trouserColor,
        roughness: 0.82,
        metalness: 0.03,
        side: THREE.DoubleSide,
      })
    );
    const skirtMesh = new THREE.Mesh(track(buildMidiSkirtGeometry(m)), skirtMat);
    skirtMesh.castShadow = true;
    hips.add(skirtMesh);
  }

  // Torso group mounted on hips
  const torso = new THREE.Group();
  torso.position.set(0, 0.06, 0);
  hips.add(torso);

  const topStyle: TopStyleId = appearance.topStyle;
  if (hasDress) {
    const bodiceMesh = new THREE.Mesh(track(buildTorsoGeometry(m, 0.007)), dressMat);
    bodiceMesh.castShadow = true;
    torso.add(bodiceMesh);

    // Waist belt / sash integrating bodice and skirt smoothly
    const waistBelt = new THREE.Mesh(
      track(new THREE.TorusGeometry(0.140 * m.waistScaleX + 0.014, 0.015, 8, 24)),
      dressTrimMat
    );
    waistBelt.position.set(0, 0.11, 0);
    waistBelt.rotation.x = Math.PI / 2;
    waistBelt.scale.set(1.0, 0.72 * (m.chestScaleZ / Math.max(0.7, m.chestScaleX)), 1.0);
    torso.add(waistBelt);

    if (appearance.dressStyle === 'ankara-gown') {
      const collarPipe = new THREE.Mesh(
        track(new THREE.TorusGeometry(0.068, 0.011, 8, 16)),
        accentTrimMat
      );
      collarPipe.position.set(0, 0.47, 0.002);
      collarPipe.rotation.x = Math.PI / 2 + 0.12;
      torso.add(collarPipe);
    } else if (appearance.dressStyle === 'wrap-midi-dress') {
      const wrapSash = new THREE.Mesh(
        track(new THREE.BoxGeometry(0.032, 0.34, 0.016)),
        dressTrimMat
      );
      wrapSash.position.set(0, 0.27, -0.104 * m.chestScaleZ);
      wrapSash.rotation.z = 0.34;
      torso.add(wrapSash);
    } else {
      // a-line-dress scoop neckline piping
      const scoopTrim = new THREE.Mesh(
        track(new THREE.TorusGeometry(0.070, 0.009, 8, 16)),
        dressTrimMat
      );
      scoopTrim.position.set(0, 0.468, -0.004);
      scoopTrim.rotation.x = Math.PI / 2 + 0.2;
      torso.add(scoopTrim);
    }
  } else {
    const extendHem = topStyle === 'agbada-kaftan' ? 0.24 : topStyle === 'ankara-top' ? 0.12 : 0;
    const flareHem = topStyle === 'agbada-kaftan' ? 0.046 : topStyle === 'ankara-top' ? 0.024 : 0;

    if (topStyle === 'jacket') {
      // Inner white t-shirt + open varsity/bomber jacket panels around it
      const innerChest = new THREE.Mesh(track(buildTorsoGeometry(m, 0.004)), innerTeeMat);
      innerChest.castShadow = true;
      torso.add(innerChest);

      const outerJacket = new THREE.Mesh(
        track(
          new THREE.CylinderGeometry(
            0.145 * m.chestScaleX,
            0.148 * m.hipScaleX,
            0.46,
            18,
            1,
            false,
            Math.PI * 0.14,
            Math.PI * 1.72
          )
        ),
        shirtMat
      );
      outerJacket.position.set(0, 0.21, 0.004);
      outerJacket.rotation.y = Math.PI;
      outerJacket.scale.set(1.04, 1.0, 0.68 * (m.chestScaleZ / Math.max(0.7, m.chestScaleX)));
      outerJacket.castShadow = true;
      torso.add(outerJacket);
    } else {
      const chestMesh = new THREE.Mesh(
        track(buildTorsoGeometry(m, 0.007, extendHem, flareHem)),
        shirtMat
      );
      chestMesh.castShadow = true;
      torso.add(chestMesh);
    }

    // Top-specific details (collars, hood, pockets, senator placket)
    if (topStyle === 'collared-shirt') {
      const collarRing = new THREE.Mesh(
        track(new THREE.TorusGeometry(0.068, 0.014, 8, 16)),
        innerTeeMat
      );
      collarRing.position.set(0, 0.472, 0.004);
      collarRing.rotation.x = Math.PI / 2 + 0.14;
      torso.add(collarRing);
    } else if (topStyle === 'hoodie') {
      const restingHood = new THREE.Mesh(
        track(new THREE.TorusGeometry(0.088, 0.032, 10, 18, Math.PI * 1.35)),
        shirtMat
      );
      restingHood.position.set(0, 0.445, 0.032);
      restingHood.rotation.x = Math.PI / 2 - 0.35;
      restingHood.rotation.z = -Math.PI * 0.18;
      torso.add(restingHood);

      const pocket = new THREE.Mesh(
        track(new THREE.BoxGeometry(0.17 * m.waistScaleX, 0.11, 0.028)),
        shirtMat
      );
      pocket.position.set(0, 0.11, -0.092 * m.waistScaleZ);
      torso.add(pocket);
    } else if (topStyle === 'agbada-kaftan') {
      const standCollar = new THREE.Mesh(
        track(new THREE.CylinderGeometry(0.068, 0.074, 0.042, 14)),
        shirtMat
      );
      standCollar.position.set(0, 0.485, 0.004);
      const placket = new THREE.Mesh(
        track(new THREE.BoxGeometry(0.028, 0.24, 0.016)),
        accentTrimMat
      );
      placket.position.set(0, 0.32, -0.106 * m.chestScaleZ);
      torso.add(standCollar, placket);
    } else if (topStyle === 'ankara-top') {
      const neckPipe = new THREE.Mesh(
        track(new THREE.TorusGeometry(0.068, 0.01, 8, 16)),
        accentTrimMat
      );
      neckPipe.position.set(0, 0.47, 0.002);
      neckPipe.rotation.x = Math.PI / 2 + 0.12;
      torso.add(neckPipe);
    }
  }

  // Necklace (if enabled and not covered by classic hijab drape)
  const isClassicHijab = appearance.hairStyle === 'hijab-classic';
  if (appearance.hasNecklace && !isClassicHijab) {
    const chain = new THREE.Mesh(
      track(new THREE.TorusGeometry(0.072, 0.0045, 8, 20)),
      goldMat
    );
    chain.position.set(0, 0.472, -0.008);
    chain.rotation.x = Math.PI / 2 + 0.32;
    const pendant = new THREE.Mesh(
      track(new THREE.OctahedronGeometry(0.011, 0)),
      goldMat
    );
    pendant.position.set(0, 0.435, -0.078);
    torso.add(chain, pendant);
  }

  // Optional Backpack with shoulder straps hugging torso
  if (appearance.hasBackpack) {
    const backZ = 0.105 * m.chestScaleZ + 0.065;
    const packMain = new THREE.Mesh(
      track(new THREE.CapsuleGeometry(0.115, 0.17, 6, 12)),
      backpackMat
    );
    packMain.position.set(0, 0.25, backZ);
    packMain.scale.set(1.12, 1.0, 0.62);
    packMain.castShadow = true;

    const packPocket = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.18, 0.13, 0.055)),
      track(
        new THREE.MeshStandardMaterial({
          color: shiftHexColor(appearance.backpackColor, -0.08),
          roughness: 0.7,
        })
      )
    );
    packPocket.position.set(0, 0.175, backZ + 0.062);
    packPocket.castShadow = true;

    // Fitted front shoulder straps wrapping smoothly over chest shoulders
    for (const side of [-1, 1]) {
      const strap = new THREE.Mesh(
        track(new THREE.TorusGeometry(0.112 * m.chestScaleZ, 0.011, 6, 14, Math.PI * 1.15)),
        darkMat
      );
      strap.position.set(side * 0.102 * m.chestScaleX, 0.295, 0.025);
      strap.rotation.y = Math.PI / 2;
      strap.rotation.z = -0.32;
      strap.scale.set(0.76, 1.16, 0.92);
      torso.add(strap);
    }
    torso.add(packMain, packPocket);
  }

  // Head Group
  const headGroup = buildHeadAndFace(
    appearance,
    skinMat,
    hairMat,
    darkMat,
    scleraMat,
    lipMat,
    irisMat,
    track
  );
  headGroup.position.set(0, 0.48, 0);
  torso.add(headGroup);

  // Earrings (fitted to earlobes, omitted if classic hijab covers ears)
  if (appearance.hasEarrings && !isClassicHijab) {
    const hoopGeo = track(new THREE.TorusGeometry(0.012, 0.0028, 6, 12));
    for (const side of [-1, 1]) {
      const hoop = new THREE.Mesh(hoopGeo, goldMat);
      hoop.position.set(side * 0.109, 0.153, 0.008);
      hoop.rotation.y = Math.PI / 2;
      headGroup.add(hoop);
    }
  }

  // Hair & Compatible Hat
  const isHijab =
    appearance.hairStyle === 'hijab-classic' || appearance.hairStyle === 'hijab-turban';
  const showHat = appearance.hatStyle !== 'none' && !isHijab;
  const hairGroup = buildHairMeshGroup(appearance.hairStyle, hairMat, showHat, track);
  headGroup.add(hairGroup);

  if (showHat) {
    const hatGroup = buildHatMesh(appearance.hatStyle, appearance.hatColor, track);
    headGroup.add(hatGroup);
  }

  const glassesGroup = buildGlassesMesh(appearance.glassesStyle, track);
  headGroup.add(glassesGroup);

  // Arms with rounded shoulder deltoids, elbow joints & sculpted hands
  const longSleeves =
    !hasDress &&
    (topStyle === 'hoodie' || topStyle === 'jacket' || topStyle === 'agbada-kaftan');
  const threeQuarterSleeves = hasDress && appearance.dressStyle === 'wrap-midi-dress';
  const puffSleeves = hasDress && appearance.dressStyle === 'ankara-gown';

  const sleeveMat = hasDress
    ? dressSolidMat
    : topStyle === 'jacket'
      ? track(
          new THREE.MeshStandardMaterial({
            color: shiftHexColor(appearance.shirtColor, 0.12),
            roughness: 0.74,
          })
        )
      : topStyle === 'ankara-top'
        ? track(
            new THREE.MeshStandardMaterial({
              color: appearance.shirtColor,
              roughness: 0.76,
              metalness: 0.03,
            })
          )
        : shirtMat;

  const rArm = 0.042 * m.limbScale;
  const rForearm = 0.034 * m.limbScale;
  const rWrist = 0.027 * m.limbScale;
  const shoulderCapGeo = track(
    new THREE.SphereGeometry(
      puffSleeves ? rArm * 1.24 : longSleeves || threeQuarterSleeves ? rArm * 1.06 : rArm * 1.02,
      12,
      10
    )
  );
  const upperArmGeo = track(new THREE.CylinderGeometry(rArm, rForearm * 1.04, 0.23, 12));
  const sleeveShortGeo = track(
    new THREE.CylinderGeometry(
      rArm * (puffSleeves ? 1.22 : 1.14),
      rArm * (puffSleeves ? 1.16 : 1.10),
      puffSleeves ? 0.12 : 0.145,
      12
    )
  );
  const sleeveLongGeo = track(new THREE.CylinderGeometry(rArm * 1.12, rForearm * 1.14, 0.23, 12));
  const elbowCapGeo = track(new THREE.SphereGeometry(rForearm * 0.98, 10, 8));
  const forearmGeo = track(new THREE.CylinderGeometry(rForearm * 1.0, rWrist, 0.22, 12));
  const forearmSleeveGeo = track(new THREE.CylinderGeometry(rForearm * 1.12, rWrist * 1.18, 0.21, 12));
  const forearmThreeQuarterGeo = track(
    new THREE.CylinderGeometry(rForearm * 1.12, rForearm * 0.98, 0.11, 12)
  );
  const palmGeo = track(new THREE.SphereGeometry(rWrist * 1.15, 10, 8));
  const fingersGeo = track(new THREE.CapsuleGeometry(rWrist * 0.72, 0.036, 4, 8));
  const thumbGeo = track(new THREE.CapsuleGeometry(rWrist * 0.44, 0.024, 4, 6));

  const createArm = (side: -1 | 1) => {
    const armPivot = new THREE.Group();
    armPivot.position.set(side * (m.shoulderHalfW - 0.032), 0.375, 0);
    armPivot.rotation.z = side * 0.055;

    const shoulderCap = new THREE.Mesh(
      shoulderCapGeo,
      hasDress || topStyle === 'tshirt' || topStyle === 'collared-shirt'
        ? sleeveMat
        : sleeveMat
    );
    shoulderCap.scale.set(0.88, 0.78, 0.88);
    shoulderCap.castShadow = true;
    armPivot.add(shoulderCap);

    const upperArm = new THREE.Mesh(upperArmGeo, skinMat);
    upperArm.position.set(0, -0.115, 0);
    upperArm.castShadow = true;
    armPivot.add(upperArm);

    const fullUpperSleeve = longSleeves || threeQuarterSleeves;
    const upperSleeve = new THREE.Mesh(
      fullUpperSleeve ? sleeveLongGeo : sleeveShortGeo,
      sleeveMat
    );
    upperSleeve.position.set(0, fullUpperSleeve ? -0.11 : -0.072, 0);
    upperSleeve.castShadow = true;
    armPivot.add(upperSleeve);

    const elbowPivot = new THREE.Group();
    elbowPivot.position.set(0, -0.23, 0);
    armPivot.add(elbowPivot);

    const elbowCap = new THREE.Mesh(elbowCapGeo, fullUpperSleeve ? sleeveMat : skinMat);
    elbowCap.castShadow = true;
    elbowPivot.add(elbowCap);

    const forearm = new THREE.Mesh(
      longSleeves ? forearmSleeveGeo : forearmGeo,
      longSleeves ? sleeveMat : skinMat
    );
    forearm.position.set(0, -0.11, 0);
    forearm.castShadow = true;
    elbowPivot.add(forearm);

    if (threeQuarterSleeves) {
      const sleeveCuff = new THREE.Mesh(forearmThreeQuarterGeo, sleeveMat);
      sleeveCuff.position.set(0, -0.052, 0);
      sleeveCuff.castShadow = true;
      elbowPivot.add(sleeveCuff);
    }

    // Optional Wristwatch on left wrist (side === -1)
    if (appearance.hasWatch && side === -1) {
      const watchStrap = new THREE.Mesh(
        track(new THREE.TorusGeometry(rWrist * 1.12, 0.006, 6, 12)),
        darkMat
      );
      watchStrap.position.set(0, -0.185, 0);
      watchStrap.rotation.x = Math.PI / 2;
      const watchDial = new THREE.Mesh(
        track(new THREE.CylinderGeometry(0.013, 0.013, 0.008, 10)),
        goldMat
      );
      watchDial.position.set(-rWrist * 1.14, -0.185, 0);
      watchDial.rotation.z = Math.PI / 2;
      elbowPivot.add(watchStrap, watchDial);
    }

    // Sculpted Hand (Palm + Fingers + Thumb)
    const handGroup = new THREE.Group();
    handGroup.position.set(0, -0.228, 0);

    const palm = new THREE.Mesh(palmGeo, skinMat);
    palm.scale.set(0.72, 1.05, 0.96);
    palm.castShadow = true;

    const fingers = new THREE.Mesh(fingersGeo, skinMat);
    fingers.position.set(0, -0.036, -0.004);
    fingers.scale.set(0.76, 1.0, 1.15);

    const thumb = new THREE.Mesh(thumbGeo, skinMat);
    thumb.position.set(side * -0.015, -0.01, -0.023);
    thumb.rotation.x = -0.35;

    handGroup.add(palm, fingers, thumb);
    elbowPivot.add(handGroup);

    torso.add(armPivot);
    return { armPivot, elbowPivot };
  };

  const leftArm = createArm(-1);
  const rightArm = createArm(1);

  // Legs with smooth hip/knee/ankle transitions & tailored bottoms + footwear
  const bottomStyle: BottomStyleId = appearance.bottomStyle;
  const fullTrousers =
    !hasDress &&
    (bottomStyle === 'chinos' || bottomStyle === 'jeans' || bottomStyle === 'joggers');
  const showShortsOnThigh = !hasDress && bottomStyle === 'shorts';
  const rThigh = 0.068 * m.limbScale;
  const rKnee = 0.050 * m.limbScale;
  const rAnkle = 0.035 * m.limbScale;

  const hipBallGeo = track(new THREE.SphereGeometry(rThigh * 0.98, 12, 10));
  const thighSkinGeo = track(new THREE.CylinderGeometry(rThigh * 0.96, rKnee * 1.0, 0.40, 14));
  const thighPantsGeo = track(new THREE.CylinderGeometry(rThigh * 1.08, rKnee * 1.14, 0.40, 14));
  const shortsGeo = track(new THREE.CylinderGeometry(rThigh * 1.10, rThigh * 0.98, 0.25, 14));
  const kneeCapGeo = track(new THREE.SphereGeometry(rKnee * 0.98, 12, 10));
  const kneePantsGeo = track(new THREE.SphereGeometry(rKnee * 1.12, 12, 10));
  const shinSkinGeo = track(new THREE.CylinderGeometry(rKnee * 1.0, rAnkle, 0.43, 14));
  const shinPantsGeo = track(new THREE.CylinderGeometry(rKnee * 1.14, rAnkle * 1.32, 0.40, 14));
  const joggerCuffGeo = track(new THREE.TorusGeometry(rAnkle * 1.24, 0.011, 6, 12));

  const createLeg = (side: -1 | 1) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(side * (0.090 * m.hipScaleX), -0.02, 0);

    const useThighCloth = fullTrousers || showShortsOnThigh;
    const hipBall = new THREE.Mesh(hipBallGeo, useThighCloth ? trouserMat : skinMat);
    legPivot.add(hipBall);

    const thigh = new THREE.Mesh(
      fullTrousers ? thighPantsGeo : thighSkinGeo,
      fullTrousers ? trouserMat : skinMat
    );
    thigh.position.set(0, -0.20, 0);
    thigh.castShadow = true;
    legPivot.add(thigh);

    if (showShortsOnThigh) {
      const shortsSleeve = new THREE.Mesh(shortsGeo, trouserMat);
      shortsSleeve.position.set(0, -0.12, 0);
      shortsSleeve.castShadow = true;
      legPivot.add(shortsSleeve);
    }

    const kneePivot = new THREE.Group();
    kneePivot.position.set(0, -0.40, 0);
    legPivot.add(kneePivot);

    const kneeBall = new THREE.Mesh(
      fullTrousers ? kneePantsGeo : kneeCapGeo,
      fullTrousers ? trouserMat : skinMat
    );
    kneeBall.castShadow = true;
    kneePivot.add(kneeBall);

    // Lower leg extends down to -0.43 inside kneePivot (world y = +0.03, seated cleanly inside shoe/sandal)
    const shin = new THREE.Mesh(
      fullTrousers ? shinPantsGeo : shinSkinGeo,
      fullTrousers ? trouserMat : skinMat
    );
    shin.position.set(0, fullTrousers ? -0.20 : -0.215, 0);
    shin.castShadow = true;
    kneePivot.add(shin);

    if (fullTrousers) {
      // Bare ankle bridge in case low-cut footwear exposes ankle skin
      const ankleSkin = new THREE.Mesh(
        track(new THREE.CylinderGeometry(rAnkle * 1.05, rAnkle * 0.98, 0.06, 10)),
        skinMat
      );
      ankleSkin.position.set(0, -0.41, 0);
      kneePivot.add(ankleSkin);
    }

    if (!hasDress && bottomStyle === 'joggers') {
      const cuff = new THREE.Mesh(joggerCuffGeo, trouserMat);
      cuff.position.set(0, -0.39, 0);
      cuff.rotation.x = Math.PI / 2;
      kneePivot.add(cuff);
    }

    // Footwear grounded cleanly at y = -0.46 relative to knee (world y = 0.00)
    const footMesh = buildFootMesh(
      appearance.footwearStyle,
      shoeMat,
      soleMat,
      skinMat,
      track
    );
    footMesh.position.set(0, -0.46, 0);
    kneePivot.add(footMesh);

    hips.add(legPivot);
    return { legPivot, kneePivot };
  };

  const leftLeg = createLeg(-1);
  const rightLeg = createLeg(1);

  return {
    root,
    bodyPivot,
    hips,
    torso,
    headGroup,
    leftArmPivot: leftArm.armPivot,
    rightArmPivot: rightArm.armPivot,
    leftElbowPivot: leftArm.elbowPivot,
    rightElbowPivot: rightArm.elbowPivot,
    leftLegPivot: leftLeg.legPivot,
    rightLegPivot: rightLeg.legPivot,
    leftKneePivot: leftLeg.kneePivot,
    rightKneePivot: rightLeg.kneePivot,
    baseHipY,
    gaitPhase: 0,
    landingSquash: 0,
    dispose: () => {
      for (const d of disposables) {
        d.dispose();
      }
    },
  };
}

export function animateCharacterRig(
  rig: CharacterRig,
  dt: number,
  horizontalSpeed: number,
  isSprinting: boolean,
  grounded: boolean,
  verticalVel: number,
  elapsedTime: number
): void {
  const clampDt = Math.min(dt, 0.05);

  rig.landingSquash = THREE.MathUtils.damp(rig.landingSquash, 0, 12, clampDt);

  if (!grounded) {
    // Airborne jump pose with natural knee & elbow tuck
    const airSwing = THREE.MathUtils.clamp(verticalVel * 0.06, -0.45, 0.45);
    rig.leftLegPivot.rotation.x = THREE.MathUtils.damp(rig.leftLegPivot.rotation.x, 0.42 - airSwing, 10, clampDt);
    rig.rightLegPivot.rotation.x = THREE.MathUtils.damp(rig.rightLegPivot.rotation.x, -0.25 + airSwing, 10, clampDt);
    rig.leftKneePivot.rotation.x = THREE.MathUtils.damp(rig.leftKneePivot.rotation.x, -0.58, 10, clampDt);
    rig.rightKneePivot.rotation.x = THREE.MathUtils.damp(rig.rightKneePivot.rotation.x, -0.22, 10, clampDt);
    rig.leftArmPivot.rotation.x = THREE.MathUtils.damp(rig.leftArmPivot.rotation.x, -0.55, 10, clampDt);
    rig.rightArmPivot.rotation.x = THREE.MathUtils.damp(rig.rightArmPivot.rotation.x, -0.55, 10, clampDt);
    rig.leftElbowPivot.rotation.x = THREE.MathUtils.damp(rig.leftElbowPivot.rotation.x, 0.52, 10, clampDt);
    rig.rightElbowPivot.rotation.x = THREE.MathUtils.damp(rig.rightElbowPivot.rotation.x, 0.52, 10, clampDt);
    rig.hips.position.y = THREE.MathUtils.damp(rig.hips.position.y, rig.baseHipY, 12, clampDt);
    rig.torso.rotation.x = THREE.MathUtils.damp(rig.torso.rotation.x, 0.08, 8, clampDt);
  } else if (horizontalSpeed > 0.25) {
    // Natural articulated walk/sprint gait with elbow and knee flexion
    const strideFreq = isSprinting ? 2.1 : 1.75;
    rig.gaitPhase += horizontalSpeed * strideFreq * clampDt;

    const swingAmp = isSprinting ? 0.80 : 0.54;
    const swing = Math.sin(rig.gaitPhase) * swingAmp;
    const bounce = Math.abs(Math.cos(rig.gaitPhase)) * (isSprinting ? 0.06 : 0.032);

    // Knee bends backward (negative X rotation since forward is -Z) during swing back/lift
    const leftKneeBend = -Math.max(0.06, -Math.cos(rig.gaitPhase) * (isSprinting ? 0.85 : 0.52));
    const rightKneeBend = -Math.max(0.06, Math.cos(rig.gaitPhase) * (isSprinting ? 0.85 : 0.52));

    // Forearms flex forward (+X rotation toward -Z) naturally
    const elbowBase = isSprinting ? 0.92 : 0.34;
    const leftElbowBend = elbowBase + Math.max(0, -Math.sin(rig.gaitPhase)) * 0.35;
    const rightElbowBend = elbowBase + Math.max(0, Math.sin(rig.gaitPhase)) * 0.35;

    rig.leftLegPivot.rotation.x = swing;
    rig.rightLegPivot.rotation.x = -swing;
    rig.leftKneePivot.rotation.x = leftKneeBend;
    rig.rightKneePivot.rotation.x = rightKneeBend;

    rig.leftArmPivot.rotation.x = -swing * 0.82;
    rig.rightArmPivot.rotation.x = swing * 0.82;
    rig.leftElbowPivot.rotation.x = leftElbowBend;
    rig.rightElbowPivot.rotation.x = rightElbowBend;

    rig.hips.position.y = rig.baseHipY + bounce;
    rig.torso.rotation.x = THREE.MathUtils.damp(
      rig.torso.rotation.x,
      isSprinting ? 0.16 : 0.06,
      10,
      clampDt
    );
    rig.torso.rotation.y = Math.sin(rig.gaitPhase) * (isSprinting ? 0.08 : 0.045);
  } else {
    // Relaxed anatomical idle stance & breathing
    const breath = Math.sin(elapsedTime * 2.1);
    rig.leftLegPivot.rotation.x = THREE.MathUtils.damp(rig.leftLegPivot.rotation.x, 0, 10, clampDt);
    rig.rightLegPivot.rotation.x = THREE.MathUtils.damp(rig.rightLegPivot.rotation.x, 0, 10, clampDt);
    rig.leftKneePivot.rotation.x = THREE.MathUtils.damp(rig.leftKneePivot.rotation.x, -0.04, 10, clampDt);
    rig.rightKneePivot.rotation.x = THREE.MathUtils.damp(rig.rightKneePivot.rotation.x, -0.04, 10, clampDt);
    rig.leftArmPivot.rotation.x = THREE.MathUtils.damp(rig.leftArmPivot.rotation.x, 0.03 * breath, 10, clampDt);
    rig.rightArmPivot.rotation.x = THREE.MathUtils.damp(rig.rightArmPivot.rotation.x, -0.03 * breath, 10, clampDt);
    rig.leftElbowPivot.rotation.x = THREE.MathUtils.damp(rig.leftElbowPivot.rotation.x, 0.14, 10, clampDt);
    rig.rightElbowPivot.rotation.x = THREE.MathUtils.damp(rig.rightElbowPivot.rotation.x, 0.14, 10, clampDt);
    rig.hips.position.y = THREE.MathUtils.damp(rig.hips.position.y, rig.baseHipY + breath * 0.01, 8, clampDt);
    rig.torso.rotation.x = THREE.MathUtils.damp(rig.torso.rotation.x, 0, 10, clampDt);
    rig.torso.rotation.y = THREE.MathUtils.damp(rig.torso.rotation.y, 0, 10, clampDt);
    rig.headGroup.rotation.y = Math.sin(elapsedTime * 0.8) * 0.04;
  }

  // Apply subtle landing squash / takeoff stretch
  const scaleY = 1 - rig.landingSquash * 0.15 + (!grounded && verticalVel > 2 ? 0.055 : 0);
  const scaleXZ = 1 / Math.sqrt(Math.max(0.75, scaleY));
  rig.bodyPivot.scale.set(scaleXZ, scaleY, scaleXZ);
}

export interface NpcRigAnimationInput {
  pose: 'idle' | 'walking' | 'sitting' | 'talking';
  horizontalSpeed: number;
  elapsedTime: number;
  phaseOffset?: number;
  seatHipY?: number;
}

export function animateNpcCharacterRig(
  rig: CharacterRig,
  dt: number,
  input: NpcRigAnimationInput
): void {
  const clampDt = Math.min(Math.max(dt, 0.001), 0.05);
  const phase = input.elapsedTime + (input.phaseOffset ?? 0);

  if (input.pose === 'walking') {
    const speed = Math.max(0.85, input.horizontalSpeed);
    rig.gaitPhase += speed * 1.75 * clampDt;

    const swing = Math.sin(rig.gaitPhase) * 0.50;
    const bounce = Math.abs(Math.cos(rig.gaitPhase)) * 0.026;
    const leftKneeBend = -Math.max(0.06, -Math.cos(rig.gaitPhase) * 0.48);
    const rightKneeBend = -Math.max(0.06, Math.cos(rig.gaitPhase) * 0.48);
    const leftElbowBend = 0.30 + Math.max(0, -Math.sin(rig.gaitPhase)) * 0.32;
    const rightElbowBend = 0.30 + Math.max(0, Math.sin(rig.gaitPhase)) * 0.32;

    rig.leftLegPivot.rotation.x = THREE.MathUtils.damp(rig.leftLegPivot.rotation.x, swing, 16, clampDt);
    rig.rightLegPivot.rotation.x = THREE.MathUtils.damp(rig.rightLegPivot.rotation.x, -swing, 16, clampDt);
    rig.leftKneePivot.rotation.x = THREE.MathUtils.damp(rig.leftKneePivot.rotation.x, leftKneeBend, 16, clampDt);
    rig.rightKneePivot.rotation.x = THREE.MathUtils.damp(rig.rightKneePivot.rotation.x, rightKneeBend, 16, clampDt);

    rig.leftArmPivot.rotation.x = THREE.MathUtils.damp(rig.leftArmPivot.rotation.x, -swing * 0.80, 16, clampDt);
    rig.rightArmPivot.rotation.x = THREE.MathUtils.damp(rig.rightArmPivot.rotation.x, swing * 0.80, 16, clampDt);
    rig.leftElbowPivot.rotation.x = THREE.MathUtils.damp(rig.leftElbowPivot.rotation.x, leftElbowBend, 16, clampDt);
    rig.rightElbowPivot.rotation.x = THREE.MathUtils.damp(rig.rightElbowPivot.rotation.x, rightElbowBend, 16, clampDt);

    rig.hips.position.y = THREE.MathUtils.damp(rig.hips.position.y, rig.baseHipY + bounce, 14, clampDt);
    rig.hips.position.z = THREE.MathUtils.damp(rig.hips.position.z, 0, 14, clampDt);
    rig.torso.rotation.x = THREE.MathUtils.damp(rig.torso.rotation.x, 0.05, 10, clampDt);
    rig.torso.rotation.y = THREE.MathUtils.damp(
      rig.torso.rotation.y,
      Math.sin(rig.gaitPhase) * 0.04,
      12,
      clampDt
    );
    rig.headGroup.rotation.y = THREE.MathUtils.damp(rig.headGroup.rotation.y, 0, 8, clampDt);
    rig.headGroup.rotation.x = THREE.MathUtils.damp(rig.headGroup.rotation.x, 0, 8, clampDt);
  } else if (input.pose === 'sitting') {
    const targetHipY = THREE.MathUtils.clamp(input.seatHipY ?? 0.545, 0.38, 0.72);
    const breath = Math.sin(phase * 1.8);

    rig.hips.position.y = THREE.MathUtils.damp(rig.hips.position.y, targetHipY, 16, clampDt);
    rig.hips.position.z = THREE.MathUtils.damp(rig.hips.position.z, -0.02, 14, clampDt);
    rig.leftLegPivot.rotation.x = THREE.MathUtils.damp(rig.leftLegPivot.rotation.x, 1.46, 16, clampDt);
    rig.rightLegPivot.rotation.x = THREE.MathUtils.damp(rig.rightLegPivot.rotation.x, 1.46, 16, clampDt);
    rig.leftKneePivot.rotation.x = THREE.MathUtils.damp(rig.leftKneePivot.rotation.x, -1.46, 16, clampDt);
    rig.rightKneePivot.rotation.x = THREE.MathUtils.damp(rig.rightKneePivot.rotation.x, -1.46, 16, clampDt);

    rig.leftArmPivot.rotation.x = THREE.MathUtils.damp(
      rig.leftArmPivot.rotation.x,
      0.40 + breath * 0.02,
      10,
      clampDt
    );
    rig.rightArmPivot.rotation.x = THREE.MathUtils.damp(
      rig.rightArmPivot.rotation.x,
      0.40 - breath * 0.02,
      10,
      clampDt
    );
    rig.leftElbowPivot.rotation.x = THREE.MathUtils.damp(rig.leftElbowPivot.rotation.x, 0.94, 10, clampDt);
    rig.rightElbowPivot.rotation.x = THREE.MathUtils.damp(rig.rightElbowPivot.rotation.x, 0.94, 10, clampDt);

    rig.torso.rotation.x = THREE.MathUtils.damp(rig.torso.rotation.x, -0.04, 10, clampDt);
    rig.torso.rotation.y = THREE.MathUtils.damp(rig.torso.rotation.y, 0, 10, clampDt);
    rig.headGroup.rotation.y = THREE.MathUtils.damp(
      rig.headGroup.rotation.y,
      Math.sin(phase * 0.65) * 0.14,
      6,
      clampDt
    );
    rig.headGroup.rotation.x = THREE.MathUtils.damp(
      rig.headGroup.rotation.x,
      Math.sin(phase * 0.42) * 0.04,
      6,
      clampDt
    );
  } else if (input.pose === 'talking') {
    const breath = Math.sin(phase * 2.0);
    const g1 = Math.sin(phase * 2.35);
    const g2 = Math.cos(phase * 1.85);

    rig.leftLegPivot.rotation.x = THREE.MathUtils.damp(rig.leftLegPivot.rotation.x, 0.02, 10, clampDt);
    rig.rightLegPivot.rotation.x = THREE.MathUtils.damp(rig.rightLegPivot.rotation.x, -0.02, 10, clampDt);
    rig.leftKneePivot.rotation.x = THREE.MathUtils.damp(rig.leftKneePivot.rotation.x, -0.04, 10, clampDt);
    rig.rightKneePivot.rotation.x = THREE.MathUtils.damp(rig.rightKneePivot.rotation.x, -0.04, 10, clampDt);

    rig.leftArmPivot.rotation.x = THREE.MathUtils.damp(
      rig.leftArmPivot.rotation.x,
      0.24 + g1 * 0.16,
      8,
      clampDt
    );
    rig.rightArmPivot.rotation.x = THREE.MathUtils.damp(
      rig.rightArmPivot.rotation.x,
      0.28 + g2 * 0.18,
      8,
      clampDt
    );
    rig.leftElbowPivot.rotation.x = THREE.MathUtils.damp(
      rig.leftElbowPivot.rotation.x,
      0.72 + Math.max(0, g1) * 0.34,
      8,
      clampDt
    );
    rig.rightElbowPivot.rotation.x = THREE.MathUtils.damp(
      rig.rightElbowPivot.rotation.x,
      0.76 + Math.max(0, -g2) * 0.34,
      8,
      clampDt
    );

    rig.hips.position.y = THREE.MathUtils.damp(rig.hips.position.y, rig.baseHipY + breath * 0.008, 10, clampDt);
    rig.hips.position.z = THREE.MathUtils.damp(rig.hips.position.z, 0, 12, clampDt);
    rig.torso.rotation.x = THREE.MathUtils.damp(rig.torso.rotation.x, 0.02, 8, clampDt);
    rig.torso.rotation.y = THREE.MathUtils.damp(
      rig.torso.rotation.y,
      Math.sin(phase * 1.1) * 0.07,
      6,
      clampDt
    );
    rig.headGroup.rotation.y = THREE.MathUtils.damp(
      rig.headGroup.rotation.y,
      Math.sin(phase * 1.35) * 0.11,
      7,
      clampDt
    );
    rig.headGroup.rotation.x = THREE.MathUtils.damp(
      rig.headGroup.rotation.x,
      Math.sin(phase * 2.6) * 0.06,
      7,
      clampDt
    );
  } else {
    // Relaxed standing idle / waiting pose
    const breath = Math.sin(phase * 2.0);
    rig.leftLegPivot.rotation.x = THREE.MathUtils.damp(rig.leftLegPivot.rotation.x, 0, 10, clampDt);
    rig.rightLegPivot.rotation.x = THREE.MathUtils.damp(rig.rightLegPivot.rotation.x, 0, 10, clampDt);
    rig.leftKneePivot.rotation.x = THREE.MathUtils.damp(rig.leftKneePivot.rotation.x, -0.04, 10, clampDt);
    rig.rightKneePivot.rotation.x = THREE.MathUtils.damp(rig.rightKneePivot.rotation.x, -0.04, 10, clampDt);
    rig.leftArmPivot.rotation.x = THREE.MathUtils.damp(rig.leftArmPivot.rotation.x, 0.03 * breath, 10, clampDt);
    rig.rightArmPivot.rotation.x = THREE.MathUtils.damp(rig.rightArmPivot.rotation.x, -0.03 * breath, 10, clampDt);
    rig.leftElbowPivot.rotation.x = THREE.MathUtils.damp(rig.leftElbowPivot.rotation.x, 0.14, 10, clampDt);
    rig.rightElbowPivot.rotation.x = THREE.MathUtils.damp(rig.rightElbowPivot.rotation.x, 0.14, 10, clampDt);
    rig.hips.position.y = THREE.MathUtils.damp(rig.hips.position.y, rig.baseHipY + breath * 0.009, 10, clampDt);
    rig.hips.position.z = THREE.MathUtils.damp(rig.hips.position.z, 0, 12, clampDt);
    rig.torso.rotation.x = THREE.MathUtils.damp(rig.torso.rotation.x, 0, 10, clampDt);
    rig.torso.rotation.y = THREE.MathUtils.damp(rig.torso.rotation.y, 0, 10, clampDt);
    rig.headGroup.rotation.y = THREE.MathUtils.damp(
      rig.headGroup.rotation.y,
      Math.sin(phase * 0.7) * 0.12,
      6,
      clampDt
    );
    rig.headGroup.rotation.x = THREE.MathUtils.damp(rig.headGroup.rotation.x, 0, 8, clampDt);
  }

  rig.bodyPivot.scale.set(1, 1, 1);
}

