import { useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  createAsphaltRoadTexture,
  createCampusSignTexture,
  createDirectionSignTexture,
  createGrassLateriteTexture,
  createInterlockingPaverTexture,
  createPlainAsphaltTexture,
} from '../../game/three/textures';
import { CAMPUS_STREETLIGHTS, CAMPUS_TREES } from '../../game/world/campusData';
import {
  CONTINUED_ROAD_CENTER_X,
  CUL_DE_SAC_CENTER,
  CUL_DE_SAC_RADIUS,
  DUAL_EAST_CARRIAGEWAY_X,
  DUAL_LANE_WIDTH,
  DUAL_ROAD_OUTER_HALF_WIDTH,
  DUAL_WEST_CARRIAGEWAY_X,
  EAST_LOOP_ROAD_X,
  KERB_WIDTH,
  NORTH_CROSS_ROAD_Z,
  ROUNDABOUT_CENTER,
  ROUNDABOUT_INNER_RADIUS,
  ROUNDABOUT_OUTER_RADIUS,
  SECONDARY_ROAD_HALF_WIDTH,
  SECONDARY_ROAD_WIDTH,
  SIDEWALK_WIDTH,
  type RoadSample,
  sampleEastBendCenterline,
  sampleLeftBendCenterline,
} from '../../game/world/campusRoad';
import { CampusVehiclesAndProps } from './CampusVehiclesAndProps';
import { Phase22Buildings } from './Phase22Buildings';

const PALM_TREES = CAMPUS_TREES.filter((t) => t.kind === 'palm');
const SHADE_TREES = CAMPUS_TREES.filter((t) => t.kind === 'shade');
const FRONDS_PER_PALM = 7;

function buildCurvedOffsetRibbonGeometry(
  samples: RoadSample[],
  innerOffset: number,
  outerOffset: number,
  y: number,
  vScale: number
): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const ax = s.x + s.nx * innerOffset;
    const az = s.z + s.nz * innerOffset;
    const bx = s.x + s.nx * outerOffset;
    const bz = s.z + s.nz * outerOffset;

    positions.push(ax, y, az, bx, y, bz);
    normals.push(0, 1, 0, 0, 1, 0);
    uvs.push(0, s.s * vScale, 1, s.s * vScale);

    if (i < samples.length - 1) {
      const base = i * 2;
      indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeBoundingSphere();
  return geo;
}

function buildCurvedKerbGeometry(
  samples: RoadSample[],
  innerOffset: number,
  outerOffset: number,
  bottomY: number,
  topY: number
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const lo = Math.min(innerOffset, outerOffset);
    const hi = Math.max(innerOffset, outerOffset);
    const ax = s.x + s.nx * lo;
    const az = s.z + s.nz * lo;
    const bx = s.x + s.nx * hi;
    const bz = s.z + s.nz * hi;

    positions.push(
      ax, bottomY, az,
      ax, topY, az,
      bx, topY, bz,
      bx, bottomY, bz
    );

    if (i < samples.length - 1) {
      const a = i * 4;
      const b = (i + 1) * 4;
      indices.push(a + 0, a + 1, b + 0, a + 1, b + 1, b + 0);
      indices.push(a + 1, a + 2, b + 1, a + 2, b + 2, b + 1);
      indices.push(a + 2, a + 3, b + 2, a + 3, b + 3, b + 2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

function buildCurveBundle(samples: RoadSample[], halfW: number) {
  return {
    asphaltGeo: buildCurvedOffsetRibbonGeometry(samples, -halfW, halfW, 0.0425, 1 / 6.86),
    leftSidewalkGeo: buildCurvedOffsetRibbonGeometry(
      samples,
      -(halfW + SIDEWALK_WIDTH),
      -(halfW + KERB_WIDTH),
      0.052,
      1 / 6.86
    ),
    rightSidewalkGeo: buildCurvedOffsetRibbonGeometry(
      samples,
      halfW + KERB_WIDTH,
      halfW + SIDEWALK_WIDTH,
      0.052,
      1 / 6.86
    ),
    leftKerbGeo: buildCurvedKerbGeometry(samples, -(halfW + KERB_WIDTH), -halfW, 0.032, 0.082),
    rightKerbGeo: buildCurvedKerbGeometry(samples, halfW, halfW + KERB_WIDTH, 0.032, 0.082),
  };
}

function InstancedFoliageAndLights() {
  const palmTrunkRef = useRef<THREE.InstancedMesh>(null);
  const palmHeartRef = useRef<THREE.InstancedMesh>(null);
  const palmFrondRef = useRef<THREE.InstancedMesh>(null);
  const shadeTrunkRef = useRef<THREE.InstancedMesh>(null);
  const shadeCanopyLowerRef = useRef<THREE.InstancedMesh>(null);
  const shadeCanopyUpperRef = useRef<THREE.InstancedMesh>(null);
  const poleRef = useRef<THREE.InstancedMesh>(null);
  const lampHeadRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    PALM_TREES.forEach((tree, i) => {
      const h = 7.4 * tree.scale;
      dummy.position.set(tree.x, h * 0.5, tree.z);
      dummy.rotation.set(0.02 * Math.sin(tree.rotationY), tree.rotationY, 0.02 * Math.cos(tree.rotationY));
      dummy.scale.set(tree.scale, tree.scale, tree.scale);
      dummy.updateMatrix();
      palmTrunkRef.current?.setMatrixAt(i, dummy.matrix);

      dummy.position.set(tree.x, h + 0.15 * tree.scale, tree.z);
      dummy.rotation.set(0, tree.rotationY, 0);
      dummy.scale.set(tree.scale * 0.55, tree.scale * 0.45, tree.scale * 0.55);
      dummy.updateMatrix();
      palmHeartRef.current?.setMatrixAt(i, dummy.matrix);

      for (let f = 0; f < FRONDS_PER_PALM; f++) {
        const frondAngle = tree.rotationY + (f / FRONDS_PER_PALM) * Math.PI * 2;
        const reach = 1.65 * tree.scale;
        dummy.position.set(
          tree.x + Math.sin(frondAngle) * reach,
          h + 0.12 * tree.scale,
          tree.z + Math.cos(frondAngle) * reach
        );
        dummy.rotation.set(0, frondAngle, 0);
        dummy.rotateX(0.32);
        dummy.scale.set(tree.scale * 0.65, tree.scale * 0.18, tree.scale * 1.75);
        dummy.updateMatrix();
        const frondIdx = i * FRONDS_PER_PALM + f;
        palmFrondRef.current?.setMatrixAt(frondIdx, dummy.matrix);

        color.setHex(f % 2 === 0 ? 0x2c6e37 : 0x3b8244);
        palmFrondRef.current?.setColorAt(frondIdx, color);
      }
    });

    if (palmTrunkRef.current) {
      palmTrunkRef.current.instanceMatrix.needsUpdate = true;
      palmTrunkRef.current.computeBoundingSphere();
    }
    if (palmHeartRef.current) {
      palmHeartRef.current.instanceMatrix.needsUpdate = true;
      palmHeartRef.current.computeBoundingSphere();
    }
    if (palmFrondRef.current) {
      palmFrondRef.current.instanceMatrix.needsUpdate = true;
      if (palmFrondRef.current.instanceColor) palmFrondRef.current.instanceColor.needsUpdate = true;
      palmFrondRef.current.computeBoundingSphere();
    }

    SHADE_TREES.forEach((tree, i) => {
      const trunkH = 3.2 * tree.scale;
      dummy.position.set(tree.x, trunkH * 0.5, tree.z);
      dummy.rotation.set(0, tree.rotationY, 0);
      dummy.scale.set(tree.scale, tree.scale, tree.scale);
      dummy.updateMatrix();
      shadeTrunkRef.current?.setMatrixAt(i, dummy.matrix);

      dummy.position.set(tree.x, trunkH + 1.3 * tree.scale, tree.z);
      dummy.rotation.set(0.1, tree.rotationY, 0.05);
      dummy.scale.set(tree.scale * 1.25, tree.scale * 0.78, tree.scale * 1.25);
      dummy.updateMatrix();
      shadeCanopyLowerRef.current?.setMatrixAt(i, dummy.matrix);

      dummy.position.set(tree.x + 0.4 * tree.scale, trunkH + 2.3 * tree.scale, tree.z - 0.3 * tree.scale);
      dummy.rotation.set(-0.08, tree.rotationY + 0.7, 0);
      dummy.scale.set(tree.scale * 0.9, tree.scale * 0.68, tree.scale * 0.9);
      dummy.updateMatrix();
      shadeCanopyUpperRef.current?.setMatrixAt(i, dummy.matrix);

      color.setHex(i % 3 === 0 ? 0x2d6634 : i % 3 === 1 ? 0x3b783e : 0x458546);
      shadeCanopyLowerRef.current?.setColorAt(i, color);
      shadeCanopyUpperRef.current?.setColorAt(i, color.clone().offsetHSL(0.01, 0, 0.05));
    });

    [shadeTrunkRef, shadeCanopyLowerRef, shadeCanopyUpperRef].forEach((ref) => {
      if (ref.current) {
        ref.current.instanceMatrix.needsUpdate = true;
        if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
        ref.current.computeBoundingSphere();
      }
    });

    CAMPUS_STREETLIGHTS.forEach((light, i) => {
      dummy.position.set(light.x, 2.75, light.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      poleRef.current?.setMatrixAt(i, dummy.matrix);

      const armOffset = light.armDirX * 0.65;
      dummy.position.set(light.x + armOffset, 5.45, light.z);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      lampHeadRef.current?.setMatrixAt(i, dummy.matrix);
    });

    if (poleRef.current) {
      poleRef.current.instanceMatrix.needsUpdate = true;
      poleRef.current.computeBoundingSphere();
    }
    if (lampHeadRef.current) {
      lampHeadRef.current.instanceMatrix.needsUpdate = true;
      lampHeadRef.current.computeBoundingSphere();
    }
  }, []);

  return (
    <group>
      <instancedMesh ref={palmTrunkRef} args={[undefined, undefined, PALM_TREES.length]} castShadow receiveShadow>
        <cylinderGeometry args={[0.17, 0.28, 7.4, 8]} />
        <meshStandardMaterial color="#8A7968" roughness={0.9} metalness={0.02} />
      </instancedMesh>
      <instancedMesh ref={palmHeartRef} args={[undefined, undefined, PALM_TREES.length]} castShadow>
        <dodecahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial color="#347039" roughness={0.82} metalness={0.02} />
      </instancedMesh>
      <instancedMesh
        ref={palmFrondRef}
        args={[undefined, undefined, PALM_TREES.length * FRONDS_PER_PALM]}
        castShadow
      >
        <boxGeometry args={[0.85, 0.25, 2.1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} metalness={0.02} />
      </instancedMesh>

      <instancedMesh ref={shadeTrunkRef} args={[undefined, undefined, SHADE_TREES.length]} castShadow receiveShadow>
        <cylinderGeometry args={[0.28, 0.44, 3.2, 8]} />
        <meshStandardMaterial color="#684D38" roughness={0.92} metalness={0.02} />
      </instancedMesh>
      <instancedMesh ref={shadeCanopyLowerRef} args={[undefined, undefined, SHADE_TREES.length]} castShadow receiveShadow>
        <icosahedronGeometry args={[2.35, 0]} />
        <meshStandardMaterial color="#ffffff" roughness={0.84} metalness={0.02} />
      </instancedMesh>
      <instancedMesh ref={shadeCanopyUpperRef} args={[undefined, undefined, SHADE_TREES.length]} castShadow>
        <icosahedronGeometry args={[1.95, 0]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} metalness={0.02} />
      </instancedMesh>

      <instancedMesh ref={poleRef} args={[undefined, undefined, CAMPUS_STREETLIGHTS.length]} castShadow>
        <cylinderGeometry args={[0.07, 0.11, 5.5, 8]} />
        <meshStandardMaterial color="#2C3532" roughness={0.4} metalness={0.7} />
      </instancedMesh>
      <instancedMesh ref={lampHeadRef} args={[undefined, undefined, CAMPUS_STREETLIGHTS.length]}>
        <boxGeometry args={[0.85, 0.14, 0.36]} />
        <meshStandardMaterial
          color="#FFF3D1"
          emissive="#F6B94E"
          emissiveIntensity={0.45}
          roughness={0.3}
          metalness={0.2}
        />
      </instancedMesh>
    </group>
  );
}

function QuadBench({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.44, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.1, 0.65]} />
        <meshStandardMaterial color="#7C4E32" roughness={0.78} metalness={0.04} />
      </mesh>
      <mesh position={[0, 0.72, 0.25]} castShadow>
        <boxGeometry args={[2.2, 0.36, 0.08]} />
        <meshStandardMaterial color="#0F523D" roughness={0.68} metalness={0.08} />
      </mesh>
      <mesh position={[-0.85, 0.22, 0]} castShadow>
        <boxGeometry args={[0.16, 0.44, 0.56]} />
        <meshStandardMaterial color="#C8BFB2" roughness={0.85} metalness={0.02} />
      </mesh>
      <mesh position={[0.85, 0.22, 0]} castShadow>
        <boxGeometry args={[0.16, 0.44, 0.56]} />
        <meshStandardMaterial color="#C8BFB2" roughness={0.85} metalness={0.02} />
      </mesh>
    </group>
  );
}

function BasketballHoop({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 1.75, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.12, 3.5, 10]} />
        <meshStandardMaterial color="#252E2A" roughness={0.45} metalness={0.65} />
      </mesh>
      <mesh position={[0, 3.32, 0.42]} castShadow>
        <boxGeometry args={[0.14, 0.14, 0.9]} />
        <meshStandardMaterial color="#252E2A" roughness={0.45} metalness={0.65} />
      </mesh>
      <mesh position={[0, 3.35, 0.88]} castShadow>
        <boxGeometry args={[1.7, 1.1, 0.08]} />
        <meshStandardMaterial color="#F5F7F8" roughness={0.25} metalness={0.08} />
      </mesh>
      <mesh position={[0, 3.25, 0.93]}>
        <boxGeometry args={[0.62, 0.48, 0.02]} />
        <meshStandardMaterial color="#C62828" roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.98, 1.18]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.24, 0.028, 8, 18]} />
        <meshStandardMaterial color="#E0531C" roughness={0.4} metalness={0.35} />
      </mesh>
    </group>
  );
}

function FootballGoal({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[-3.65, 1.22, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 2.44, 10]} />
        <meshStandardMaterial color="#F5F5F5" roughness={0.35} metalness={0.2} />
      </mesh>
      <mesh position={[3.65, 1.22, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 2.44, 10]} />
        <meshStandardMaterial color="#F5F5F5" roughness={0.35} metalness={0.2} />
      </mesh>
      <mesh position={[0, 2.44, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 7.44, 10]} />
        <meshStandardMaterial color="#F5F5F5" roughness={0.35} metalness={0.2} />
      </mesh>
      <mesh position={[-3.65, 1.15, -1.25]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 2.3, 8]} />
        <meshStandardMaterial color="#DCE3E0" roughness={0.45} />
      </mesh>
      <mesh position={[3.65, 1.15, -1.25]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 2.3, 8]} />
        <meshStandardMaterial color="#DCE3E0" roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.22, -0.62]}>
        <boxGeometry args={[7.2, 2.35, 1.2]} />
        <meshStandardMaterial color="#F2F6F4" wireframe transparent opacity={0.42} />
      </mesh>
    </group>
  );
}

export function CampusEnvironment() {
  const { gl } = useThree();

  const textures = useMemo(() => {
    const maxAniso = Math.min(8, gl.capabilities.getMaxAnisotropy() || 4);
    const grass = createGrassLateriteTexture(maxAniso);
    grass.repeat.set(64, 64);

    return {
      grass,
      asphaltCarriageway: createAsphaltRoadTexture(maxAniso, 16.0),
      asphaltCurved: createAsphaltRoadTexture(maxAniso, 1.0),
      asphaltContinued: createAsphaltRoadTexture(maxAniso, 22.0),
      asphaltEastLoop: createAsphaltRoadTexture(maxAniso, 15.0),
      asphaltCrossRoad: createAsphaltRoadTexture(maxAniso, 16.0),
      asphaltArterial: createAsphaltRoadTexture(maxAniso, 4.5),
      asphaltSpur: createAsphaltRoadTexture(maxAniso, 5.5),
      plainAsphalt: createPlainAsphaltTexture(maxAniso),
      paver: createInterlockingPaverTexture(maxAniso),
      gateSign: createCampusSignTexture(
        'UNIVERSITY CAMPUS',
        'MAIN ENTRANCE · ACADEMIC & RESIDENTIAL GROUNDS',
        '#0D3B2E',
        '#D4A024',
        '#F5F0E6',
        maxAniso
      ),
      pedestrianGateSign: createCampusSignTexture(
        'PEDESTRIAN GATE',
        'WALKWAY -> CAMPUS SECURITY BUILDING',
        '#14362B',
        '#D4A024',
        '#F5F0E6',
        maxAniso
      ),
      securitySign: createCampusSignTexture(
        'CAMPUS SECURITY',
        'GROUND & FIRST FLOOR · GATE CONTROL',
        '#142B24',
        '#D4A024',
        '#F5F0E6',
        maxAniso
      ),
      hallSign: createCampusSignTexture(
        'UNIVERSITY HALL',
        '2 STOREYS · AUDITORIUM & GALLERY · [E] ENTER',
        '#18362D',
        '#E2AC33',
        '#F5F0E6',
        maxAniso
      ),
      musterSign: createCampusSignTexture(
        'CAMPUS MUSTER POINT',
        'EMERGENCY ASSEMBLY SQUARE & VOLLEYBALL COURT',
        '#7A2E1E',
        '#F1C14B',
        '#FFF8EC',
        maxAniso
      ),
      hostel100Sign: createCampusSignTexture(
        '100-LEVEL HOSTEL',
        'FEMALE WING & MALE 100-LEVEL RESIDENCE',
        '#0F4A39',
        '#D4A024',
        '#F5F0E6',
        maxAniso
      ),
      hostelMaleSeniorSign: createCampusSignTexture(
        'MALE HOSTEL · 200-500 LEVEL',
        'SENIOR UNDERGRADUATE HALL OF RESIDENCE',
        '#0D3B2E',
        '#D4A024',
        '#F5F0E6',
        maxAniso
      ),
      dirSign: createDirectionSignTexture(maxAniso),
    };
  }, [gl]);

  const westCurveGeos = useMemo(
    () => buildCurveBundle(sampleLeftBendCenterline(56), SECONDARY_ROAD_HALF_WIDTH),
    []
  );
  const eastCurveGeos = useMemo(
    () => buildCurveBundle(sampleEastBendCenterline(48), SECONDARY_ROAD_HALF_WIDTH),
    []
  );

  useEffect(() => {
    return () => {
      Object.values(textures).forEach((tex) => tex.dispose());
    };
  }, [textures]);

  useEffect(() => {
    return () => {
      [westCurveGeos, eastCurveGeos].forEach((bundle) => {
        bundle.asphaltGeo.dispose();
        bundle.leftSidewalkGeo.dispose();
        bundle.rightSidewalkGeo.dispose();
        bundle.leftKerbGeo.dispose();
        bundle.rightKerbGeo.dispose();
      });
    };
  }, [westCurveGeos, eastCurveGeos]);

  return (
    <group>
      {/* Horizon backdrop sky & expanded fog */}
      <color attach="background" args={['#B9D5E6']} />
      <fog attach="fog" args={['#C6D8DF', 160, 460]} />

      {/* Ground Plane (Spacious Grass & Laterite Campus Turf) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -35]} receiveShadow>
        <planeGeometry args={[760, 760]} />
        <meshStandardMaterial map={textures.grass} color="#ffffff" roughness={0.94} metalness={0.0} />
      </mesh>

      {/* Distant Rolling Perimeter Hills (outside expanded campus bounds) */}
      <group position={[0, -0.5, 0]}>
        <mesh position={[-10, 2.8, -290]}>
          <cylinderGeometry args={[95, 130, 8.5, 18]} />
          <meshStandardMaterial color="#4D6E48" roughness={0.95} />
        </mesh>
        <mesh position={[-250, 2.4, -35]}>
          <cylinderGeometry args={[90, 125, 7.0, 16]} />
          <meshStandardMaterial color="#55754C" roughness={0.95} />
        </mesh>
        <mesh position={[240, 2.4, -35]}>
          <cylinderGeometry args={[90, 125, 7.2, 16]} />
          <meshStandardMaterial color="#4C6B46" roughness={0.95} />
        </mesh>
      </group>

      {/* ===================================================================== */}
      {/* 1. INTERLOCKING PAVER PLAZAS & APPROACH FORECOURTS                    */}
      {/* ===================================================================== */}
      {/* Main Gate Outer Plaza + Pedestrian Approach */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2, 0.02, 122]} receiveShadow>
        <planeGeometry args={[52, 20]} />
        <meshStandardMaterial map={textures.paver} color="#ffffff" roughness={0.86} />
      </mesh>
      {/* Direct Paver Walkway from Pedestrian Gate & Raised Platform (18.5, 110) directly to Security Building (22, 95) & University Hall */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[21.5, 0.024, 102.5]} receiveShadow>
        <planeGeometry args={[12.5, 16.0]} />
        <meshStandardMaterial map={textures.paver} color="#ffffff" roughness={0.86} />
      </mesh>
      {/* Security & University Hall Plaza */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[42, 0.02, 94]} receiveShadow>
        <planeGeometry args={[54, 28]} />
        <meshStandardMaterial map={textures.paver} color="#ffffff" roughness={0.86} />
      </mesh>
      {/* Entrance Right-Side Grounds Tractor & Utility Container Bay Pad (X: 16.5..29.5, Z: 58.0..73.5) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[23.0, 0.032, 65.75]} receiveShadow>
        <planeGeometry args={[13.0, 15.5]} />
        <meshStandardMaterial map={textures.plainAsphalt} color="#ffffff" roughness={0.88} />
      </mesh>
      {/* Academic Building Forecourt Plaza (Z = -34..-10.5, directly North of Roundabout) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.0, 0.02, -22.25]} receiveShadow>
        <planeGeometry args={[72, 23.5]} />
        <meshStandardMaterial map={textures.paver} color="#ffffff" roughness={0.86} />
      </mesh>
      {/* Academic Drop-Off Asphalt Strip & Turnaround Arc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.0, 0.041, -15.5]} receiveShadow>
        <planeGeometry args={[18.8, 10.5]} />
        <meshStandardMaterial map={textures.plainAsphalt} color="#ffffff" roughness={0.84} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.0, 0.041, -20.5]} receiveShadow>
        <circleGeometry args={[9.4, 28, 0, Math.PI]} />
        <meshStandardMaterial map={textures.plainAsphalt} color="#ffffff" roughness={0.84} />
      </mesh>

      {/* Academic Faculty Parking Court (X: 35.5..53.5, Z: -32..-10) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[44.5, 0.036, -21.0]} receiveShadow>
        <planeGeometry args={[18.0, 22.0]} />
        <meshStandardMaterial map={textures.plainAsphalt} color="#ffffff" roughness={0.86} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[53.8, 0.036, -21.0]} receiveShadow>
        <planeGeometry args={[8.5, 8.4]} />
        <meshStandardMaterial map={textures.plainAsphalt} color="#ffffff" roughness={0.86} />
      </mesh>

      {/* Administrative Block Bus & Staff Parking Forecourt (X: -44..-16, Z: 28..58) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-29.5, 0.036, 43.0]} receiveShadow>
        <planeGeometry args={[27.0, 30.0]} />
        <meshStandardMaterial map={textures.plainAsphalt} color="#ffffff" roughness={0.86} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-42.2, 0.025, 43.0]} receiveShadow>
        <planeGeometry args={[3.6, 22.0]} />
        <meshStandardMaterial map={textures.paver} color="#ffffff" roughness={0.86} />
      </mesh>

      {/* Clinic Front & Ambulance Driveway Apron */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-43.5, 0.035, 13.8]} receiveShadow>
        <planeGeometry args={[17.0, 8.5]} />
        <meshStandardMaterial map={textures.plainAsphalt} color="#ffffff" roughness={0.86} />
      </mesh>

      {/* Cafeteria & Buka Paver Forecourt + Driveway */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-71.2, 0.024, -42.0]} receiveShadow>
        <planeGeometry args={[6.4, 28.0]} />
        <meshStandardMaterial map={textures.paver} color="#ffffff" roughness={0.86} />
      </mesh>

      {/* Workshop Access Drive from Continued Northern Road (-64) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-55.8, 0.036, -61.0]} receiveShadow>
        <planeGeometry args={[8.4, 8.0]} />
        <meshStandardMaterial map={textures.plainAsphalt} color="#ffffff" roughness={0.86} />
      </mesh>

      {/* ===================================================================== */}
      {/* 2. DUAL CARRIAGEWAY MAIN ENTRANCE AVENUE (Z: 22.5..134)              */}
      {/*    Two 7.8m Carriageways (-5.7 & +5.7) + 3.6m Grass Median           */}
      {/* ===================================================================== */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[DUAL_WEST_CARRIAGEWAY_X, 0.0425, 78.25]}
        receiveShadow
      >
        <planeGeometry args={[DUAL_LANE_WIDTH, 111.5]} />
        <meshStandardMaterial map={textures.asphaltCarriageway} color="#ffffff" roughness={0.84} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[DUAL_EAST_CARRIAGEWAY_X, 0.0425, 78.25]}
        receiveShadow
      >
        <planeGeometry args={[DUAL_LANE_WIDTH, 111.5]} />
        <meshStandardMaterial map={textures.asphaltCarriageway} color="#ffffff" roughness={0.84} />
      </mesh>

      {/* Clear Paved Entrance Throat between Gate (Z=114) and Delayed Median Start (Z=96) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.042, 112.0]} receiveShadow>
        <planeGeometry args={[3.6, 32.0]} />
        <meshStandardMaterial map={textures.plainAsphalt} color="#ffffff" roughness={0.84} />
      </mesh>

      {/* Delayed Central Landscaped Grass Median (South Z:68.5..96.0, Crosswalk Z:64..68, North Z:24.5..63.5) */}
      {[
        { z: 82.25, len: 27.5, shrubs: [-9.0, -2.5, 4.5, 10.5] },
        { z: 44.0, len: 39.0, shrubs: [-14.0, -5.0, 4.5, 13.5] },
      ].map((seg, idx) => (
        <group key={`median-seg-${idx}`} position={[0, 0, seg.z]}>
          <mesh position={[0, 0.065, 0]} receiveShadow>
            <boxGeometry args={[3.32, 0.08, seg.len]} />
            <meshStandardMaterial color="#3E6E3B" roughness={0.92} />
          </mesh>
          <mesh position={[-1.72, 0.06, 0]} receiveShadow>
            <boxGeometry args={[KERB_WIDTH, 0.11, seg.len + 0.24]} />
            <meshStandardMaterial color="#B5ABA0" roughness={0.82} />
          </mesh>
          <mesh position={[1.72, 0.06, 0]} receiveShadow>
            <boxGeometry args={[KERB_WIDTH, 0.11, seg.len + 0.24]} />
            <meshStandardMaterial color="#B5ABA0" roughness={0.82} />
          </mesh>
          {/* End-cap Rounded Median Curbs */}
          <mesh position={[0, 0.06, seg.len / 2 + 0.12]} receiveShadow>
            <boxGeometry args={[3.68, 0.11, 0.24]} />
            <meshStandardMaterial color="#B5ABA0" roughness={0.82} />
          </mesh>
          <mesh position={[0, 0.06, -seg.len / 2 - 0.12]} receiveShadow>
            <boxGeometry args={[3.68, 0.11, 0.24]} />
            <meshStandardMaterial color="#B5ABA0" roughness={0.82} />
          </mesh>
          {/* Ornamental Hedge Strips & Flowering Shrubs */}
          <mesh position={[0, 0.18, 0]} receiveShadow castShadow>
            <boxGeometry args={[0.92, 0.22, seg.len - 2.2]} />
            <meshStandardMaterial color="#2C5E31" roughness={0.88} />
          </mesh>
          {seg.shrubs.map((sz, sIdx) => (
            <group key={sIdx} position={[0, 0.28, sz]}>
              <mesh castShadow>
                <dodecahedronGeometry args={[0.42, 0]} />
                <meshStandardMaterial color={sIdx % 2 === 0 ? '#3A7B3E' : '#2D6634'} roughness={0.84} />
              </mesh>
              <mesh position={[0, 0.2, 0]}>
                <dodecahedronGeometry args={[0.2, 0]} />
                <meshStandardMaterial color={sIdx % 2 === 0 ? '#D96B27' : '#E2AC2B'} roughness={0.7} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      {/* Median Crosswalk Asphalt & Zebra Stripes (Z = 66) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.042, 66]} receiveShadow>
        <planeGeometry args={[3.6, 4.0]} />
        <meshStandardMaterial map={textures.plainAsphalt} color="#ffffff" roughness={0.85} />
      </mesh>
      {[-8.0, -6.2, -4.4, -2.6, 2.6, 4.4, 6.2, 8.0].map((zx) => (
        <mesh key={`zebra-${zx}`} rotation={[-Math.PI / 2, 0, 0]} position={[zx, 0.046, 66]}>
          <planeGeometry args={[0.9, 2.8]} />
          <meshStandardMaterial color="#EAE6DC" roughness={0.55} />
        </mesh>
      ))}

      {/* Dual Carriageway Outer Kerbs, Drainage Channels & Sidewalks */}
      {[-1, 1].map((side) => {
        const kerbX = side * (DUAL_ROAD_OUTER_HALF_WIDTH + KERB_WIDTH / 2);
        const drainX = side * (DUAL_ROAD_OUTER_HALF_WIDTH + KERB_WIDTH + 0.2);
        const swX = side * (DUAL_ROAD_OUTER_HALF_WIDTH + KERB_WIDTH + 0.4 + SIDEWALK_WIDTH / 2);
        return (
          <group key={`dual-edge-${side}`}>
            {/* North of gate (Z: 22.5..112.5) */}
            <mesh position={[kerbX, 0.044, 67.5]} receiveShadow>
              <boxGeometry args={[KERB_WIDTH, 0.076, 90.0]} />
              <meshStandardMaterial color="#B5ABA0" roughness={0.82} />
            </mesh>
            <mesh position={[drainX, 0.015, 67.5]} receiveShadow>
              <boxGeometry args={[0.4, 0.02, 90.0]} />
              <meshStandardMaterial color="#595E60" roughness={0.9} />
            </mesh>
            <mesh position={[swX, 0.028, 67.5]} receiveShadow>
              <boxGeometry args={[SIDEWALK_WIDTH, 0.056, 90.0]} />
              <meshStandardMaterial color="#CEC4B6" roughness={0.88} />
            </mesh>
            {/* South of gate (Z: 115.5..134) */}
            <mesh position={[kerbX, 0.044, 124.75]} receiveShadow>
              <boxGeometry args={[KERB_WIDTH, 0.076, 18.5]} />
              <meshStandardMaterial color="#B5ABA0" roughness={0.82} />
            </mesh>
            <mesh position={[swX, 0.028, 124.75]} receiveShadow>
              <boxGeometry args={[SIDEWALK_WIDTH, 0.056, 18.5]} />
              <meshStandardMaterial color="#CEC4B6" roughness={0.88} />
            </mesh>
          </group>
        );
      })}

      {/* ===================================================================== */}
      {/* 3. FLAG ROUNDABOUT (0, 6) DIRECTLY IN FRONT OF ACADEMIC BUILDING      */}
      {/* ===================================================================== */}
      {[
        { thetaStart: 0.28, thetaLength: 0.64 },
        { thetaStart: 2.22, thetaLength: 0.64 },
        { thetaStart: 3.42, thetaLength: 0.67 },
        { thetaStart: 5.33, thetaLength: 0.67 },
      ].map((arc, idx) => (
        <group key={`rb-outer-arc-${idx}`}>
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[ROUNDABOUT_CENTER.x, 0.032, ROUNDABOUT_CENTER.z]}
            receiveShadow
          >
            <ringGeometry
              args={[ROUNDABOUT_OUTER_RADIUS, ROUNDABOUT_OUTER_RADIUS + 2.4, 24, 1, arc.thetaStart, arc.thetaLength]}
            />
            <meshStandardMaterial color="#CEC4B6" roughness={0.88} />
          </mesh>
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[ROUNDABOUT_CENTER.x, 0.046, ROUNDABOUT_CENTER.z]}
            receiveShadow
          >
            <ringGeometry
              args={[
                ROUNDABOUT_OUTER_RADIUS - 0.02,
                ROUNDABOUT_OUTER_RADIUS + KERB_WIDTH,
                24,
                1,
                arc.thetaStart,
                arc.thetaLength,
              ]}
            />
            <meshStandardMaterial color="#B5ABA0" roughness={0.82} />
          </mesh>
        </group>
      ))}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[ROUNDABOUT_CENTER.x, 0.041, ROUNDABOUT_CENTER.z]}
        receiveShadow
      >
        <ringGeometry args={[ROUNDABOUT_INNER_RADIUS, ROUNDABOUT_OUTER_RADIUS, 56]} />
        <meshStandardMaterial map={textures.plainAsphalt} color="#ffffff" roughness={0.84} />
      </mesh>
      {/* Yellow Roundabout Ring Guides */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ROUNDABOUT_CENTER.x, 0.0435, ROUNDABOUT_CENTER.z]}>
        <ringGeometry args={[11.65, 11.82, 48]} />
        <meshStandardMaterial color="#E5B43B" roughness={0.55} />
      </mesh>

      {/* ===================================================================== */}
      {/* 4. INTERCONNECTED SECONDARY ROAD NETWORK                              */}
      {/*    West Arterial -> Curve -> Continued North Road -> Cul-de-sac       */}
      {/*    East Arterial -> Curve -> East Loop Road + North Cross-Road        */}
      {/*    Admin Access Drive + East Hall Spur                               */}
      {/* ===================================================================== */}
      {/* West Arterial (Z = 6, X: -48..-16.5) */}
      <mesh
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        position={[-32.25, 0.0425, 6.0]}
        receiveShadow
      >
        <planeGeometry args={[SECONDARY_ROAD_WIDTH, 31.5]} />
        <meshStandardMaterial map={textures.asphaltArterial} color="#ffffff" roughness={0.84} />
      </mesh>
      {[6 - (SECONDARY_ROAD_HALF_WIDTH + SIDEWALK_WIDTH / 2), 6 + (SECONDARY_ROAD_HALF_WIDTH + SIDEWALK_WIDTH / 2)].map(
        (sz, idx) => (
          <mesh key={`wart-sw-${idx}`} position={[-32.25, 0.028, sz]} receiveShadow>
            <boxGeometry args={[31.5, 0.056, SIDEWALK_WIDTH]} />
            <meshStandardMaterial color="#CEC4B6" roughness={0.88} />
          </mesh>
        )
      )}

      {/* Smooth West Curve (-48, 6) -> (-64, -10) */}
      <mesh geometry={westCurveGeos.leftSidewalkGeo} receiveShadow>
        <meshStandardMaterial color="#CEC4B6" roughness={0.88} />
      </mesh>
      <mesh geometry={westCurveGeos.rightSidewalkGeo} receiveShadow>
        <meshStandardMaterial color="#CEC4B6" roughness={0.88} />
      </mesh>
      <mesh geometry={westCurveGeos.leftKerbGeo} receiveShadow>
        <meshStandardMaterial color="#B5ABA0" roughness={0.82} />
      </mesh>
      <mesh geometry={westCurveGeos.rightKerbGeo} receiveShadow>
        <meshStandardMaterial color="#B5ABA0" roughness={0.82} />
      </mesh>
      <mesh geometry={westCurveGeos.asphaltGeo} receiveShadow>
        <meshStandardMaterial map={textures.asphaltCurved} color="#ffffff" roughness={0.84} />
      </mesh>

      {/* Continued Northern Road (X = -64, Z: -176..-10) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[CONTINUED_ROAD_CENTER_X, 0.0425, -93.0]}
        receiveShadow
      >
        <planeGeometry args={[SECONDARY_ROAD_WIDTH, 166.0]} />
        <meshStandardMaterial map={textures.asphaltContinued} color="#ffffff" roughness={0.84} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={`cont-edge-${side}`}>
          <mesh
            position={[
              CONTINUED_ROAD_CENTER_X + side * (SECONDARY_ROAD_HALF_WIDTH + KERB_WIDTH / 2),
              0.044,
              -93.0,
            ]}
            receiveShadow
          >
            <boxGeometry args={[KERB_WIDTH, 0.076, 165.4]} />
            <meshStandardMaterial color="#B5ABA0" roughness={0.82} />
          </mesh>
          <mesh
            position={[
              CONTINUED_ROAD_CENTER_X + side * (SECONDARY_ROAD_HALF_WIDTH + KERB_WIDTH + SIDEWALK_WIDTH / 2),
              0.028,
              -93.0,
            ]}
            receiveShadow
          >
            <boxGeometry args={[SIDEWALK_WIDTH, 0.056, 165.4]} />
            <meshStandardMaterial color="#CEC4B6" roughness={0.88} />
          </mesh>
        </group>
      ))}

      {/* Terminal Cul-de-sac (-64, -176) facing Senior Male Hostel */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[CUL_DE_SAC_CENTER.x, 0.032, CUL_DE_SAC_CENTER.z]}
        receiveShadow
      >
        <ringGeometry args={[CUL_DE_SAC_RADIUS, CUL_DE_SAC_RADIUS + 2.2, 40]} />
        <meshStandardMaterial color="#CEC4B6" roughness={0.88} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[CUL_DE_SAC_CENTER.x, 0.041, CUL_DE_SAC_CENTER.z]}
        receiveShadow
      >
        <circleGeometry args={[CUL_DE_SAC_RADIUS, 40]} />
        <meshStandardMaterial map={textures.plainAsphalt} color="#ffffff" roughness={0.84} />
      </mesh>

      {/* East Arterial (Z = 6, X: 16.5..42) */}
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[29.25, 0.0425, 6.0]} receiveShadow>
        <planeGeometry args={[SECONDARY_ROAD_WIDTH, 25.5]} />
        <meshStandardMaterial map={textures.asphaltArterial} color="#ffffff" roughness={0.84} />
      </mesh>

      {/* Smooth East Curve (42, 6) -> (58, -10) */}
      <mesh geometry={eastCurveGeos.leftSidewalkGeo} receiveShadow>
        <meshStandardMaterial color="#CEC4B6" roughness={0.88} />
      </mesh>
      <mesh geometry={eastCurveGeos.rightSidewalkGeo} receiveShadow>
        <meshStandardMaterial color="#CEC4B6" roughness={0.88} />
      </mesh>
      <mesh geometry={eastCurveGeos.leftKerbGeo} receiveShadow>
        <meshStandardMaterial color="#B5ABA0" roughness={0.82} />
      </mesh>
      <mesh geometry={eastCurveGeos.rightKerbGeo} receiveShadow>
        <meshStandardMaterial color="#B5ABA0" roughness={0.82} />
      </mesh>
      <mesh geometry={eastCurveGeos.asphaltGeo} receiveShadow>
        <meshStandardMaterial map={textures.asphaltCurved} color="#ffffff" roughness={0.84} />
      </mesh>

      {/* East Campus Loop Road (X = 58, Z: -117..-10) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[EAST_LOOP_ROAD_X, 0.0425, -63.5]}
        receiveShadow
      >
        <planeGeometry args={[SECONDARY_ROAD_WIDTH, 107.0]} />
        <meshStandardMaterial map={textures.asphaltEastLoop} color="#ffffff" roughness={0.84} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={`eastloop-sw-${side}`}
          position={[
            EAST_LOOP_ROAD_X + side * (SECONDARY_ROAD_HALF_WIDTH + KERB_WIDTH + SIDEWALK_WIDTH / 2),
            0.028,
            -63.5,
          ]}
          receiveShadow
        >
          <boxGeometry args={[SIDEWALK_WIDTH, 0.056, 107.0]} />
          <meshStandardMaterial color="#CEC4B6" roughness={0.88} />
        </mesh>
      ))}

      {/* North Cross-Road (Z = -117, X: -64..+58) */}
      <mesh
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        position={[-3.0, 0.0426, NORTH_CROSS_ROAD_Z]}
        receiveShadow
      >
        <planeGeometry args={[SECONDARY_ROAD_WIDTH, 122.0]} />
        <meshStandardMaterial map={textures.asphaltCrossRoad} color="#ffffff" roughness={0.84} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={`cross-sw-${side}`}
          position={[-3.0, 0.028, NORTH_CROSS_ROAD_Z + side * (SECONDARY_ROAD_HALF_WIDTH + SIDEWALK_WIDTH / 2)]}
          receiveShadow
        >
          <boxGeometry args={[114.0, 0.056, SIDEWALK_WIDTH]} />
          <meshStandardMaterial color="#CEC4B6" roughness={0.88} />
        </mesh>
      ))}

      {/* Admin Access Drive (Z = 43, X: -18..-9.6) */}
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[-13.8, 0.042, 43.0]} receiveShadow>
        <planeGeometry args={[7.4, 8.6]} />
        <meshStandardMaterial map={textures.plainAsphalt} color="#ffffff" roughness={0.84} />
      </mesh>

      {/* East Hall Spur (Z = 81, X: 9.6..54.0) */}
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[31.8, 0.042, 81.0]} receiveShadow>
        <planeGeometry args={[7.6, 44.4]} />
        <meshStandardMaterial map={textures.asphaltSpur} color="#ffffff" roughness={0.84} />
      </mesh>

      {/* ===================================================================== */}
      {/* 5. ARCHED MAIN GATE (Z = 114), OPEN IRON GATES & PEDESTRIAN GATE      */}
      {/* ===================================================================== */}
      <group position={[0, 0, 114]}>
        {/* Main Piers: West (-14.2), Center (0), East (+14.2) */}
        {[-14.2, 0, 14.2].map((px, idx) => (
          <group key={idx} position={[px, 0, 0]}>
            <mesh position={[0, 3.8, 0]} castShadow receiveShadow>
              <boxGeometry args={[px === 0 ? 2.2 : 3.2, 7.6, 2.8]} />
              <meshStandardMaterial color="#E6DDD0" roughness={0.82} />
            </mesh>
            <mesh position={[0, 3.8, 0]} castShadow>
              <boxGeometry args={[px === 0 ? 2.35 : 3.36, 5.4, 1.15]} />
              <meshStandardMaterial color="#A3482E" roughness={0.72} />
            </mesh>
            <mesh position={[0, 7.75, 0]} castShadow>
              <boxGeometry args={[px === 0 ? 2.5 : 3.5, 0.45, 3.1]} />
              <meshStandardMaterial color="#0D3B2E" roughness={0.6} />
            </mesh>
          </group>
        ))}

        {/* Curved Architectural Arch Span Across Main Entrance (-15.8..+15.8) */}
        <group>
          {Array.from({ length: 17 }, (_, i) => {
            const t = i / 16;
            const angle = Math.PI * (1 - t);
            const rx = Math.cos(angle) * 14.2;
            const ry = 7.7 + Math.sin(angle) * 2.5;
            const slope = Math.atan2(Math.cos(angle) * 2.5, Math.sin(angle) * 14.2);
            return (
              <group key={`arch-seg-${i}`} position={[rx, ry, 0]} rotation={[0, 0, slope]}>
                <mesh castShadow receiveShadow>
                  <boxGeometry args={[2.25, 0.92, 3.1]} />
                  <meshStandardMaterial color="#0D3B2E" roughness={0.56} metalness={0.12} />
                </mesh>
                <mesh position={[0, 0.52, 0]}>
                  <boxGeometry args={[2.28, 0.18, 3.25]} />
                  <meshStandardMaterial color="#D4A024" roughness={0.35} metalness={0.62} />
                </mesh>
              </group>
            );
          })}
          {/* Arch Crown Keystone & Campus Nameplate */}
          <mesh position={[0, 10.25, 0]} castShadow>
            <boxGeometry args={[14.8, 1.35, 3.3]} />
            <meshStandardMaterial color="#0D3B2E" roughness={0.55} />
          </mesh>
          <mesh position={[0, 10.25, 1.68]}>
            <planeGeometry args={[13.6, 1.15]} />
            <meshStandardMaterial map={textures.gateSign} color="#ffffff" roughness={0.45} />
          </mesh>
          <mesh position={[0, 10.25, -1.68]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[13.6, 1.15]} />
            <meshStandardMaterial map={textures.gateSign} color="#ffffff" roughness={0.45} />
          </mesh>
        </group>

        {/* Standing-Open Wrought-Iron Barred Gate Doors (Folded Inward Against Main Piers) */}
        {[-12.35, 12.35].map((gx, gIdx) => (
          <group key={`open-gate-${gIdx}`} position={[gx, 0, -1.7]}>
            <mesh position={[0, 0.25, 0]} castShadow>
              <boxGeometry args={[0.14, 0.2, 2.9]} />
              <meshStandardMaterial color="#1D2622" roughness={0.45} metalness={0.68} />
            </mesh>
            <mesh position={[0, 1.65, 0]} castShadow>
              <boxGeometry args={[0.12, 0.14, 2.9]} />
              <meshStandardMaterial color="#1D2622" roughness={0.45} metalness={0.68} />
            </mesh>
            <mesh position={[0, 3.05, 0]} castShadow>
              <boxGeometry args={[0.14, 0.18, 2.9]} />
              <meshStandardMaterial color="#1D2622" roughness={0.45} metalness={0.68} />
            </mesh>
            {[-1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2].map((bz, bIdx) => (
              <group key={bIdx} position={[0, 1.68, bz]}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.032, 0.032, 2.9, 6]} />
                  <meshStandardMaterial color="#252F2B" roughness={0.42} metalness={0.72} />
                </mesh>
                <mesh position={[0, 1.54, 0]}>
                  <coneGeometry args={[0.055, 0.22, 6]} />
                  <meshStandardMaterial color="#D4A024" roughness={0.35} metalness={0.65} />
                </mesh>
              </group>
            ))}
          </group>
        ))}

        {/* Separate Pedestrian Gate (X: +15.8..+21.0) & East Pedestrian Pier (+22.2) */}
        <group position={[22.2, 0, 0]}>
          <mesh position={[0, 2.8, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.4, 5.6, 2.4]} />
            <meshStandardMaterial color="#E6DDD0" roughness={0.82} />
          </mesh>
          <mesh position={[0, 2.8, 0]}>
            <boxGeometry args={[2.54, 3.6, 0.95]} />
            <meshStandardMaterial color="#A3482E" roughness={0.72} />
          </mesh>
          <mesh position={[0, 5.75, 0]} castShadow>
            <boxGeometry args={[2.7, 0.36, 2.7]} />
            <meshStandardMaterial color="#0D3B2E" roughness={0.6} />
          </mesh>
        </group>

        {/* Pedestrian Gate Curved Archway + Open Pedestrian Iron Door */}
        {Array.from({ length: 7 }, (_, i) => {
          const t = i / 6;
          const angle = Math.PI * (1 - t);
          const px = 18.4 + Math.cos(angle) * 2.8;
          const py = 5.15 + Math.sin(angle) * 0.95;
          const slope = Math.atan2(Math.cos(angle) * 0.95, Math.sin(angle) * 2.8);
          return (
            <mesh key={`ped-arch-${i}`} position={[px, py, 0]} rotation={[0, 0, slope]} castShadow>
              <boxGeometry args={[1.05, 0.56, 2.0]} />
              <meshStandardMaterial color="#0D3B2E" roughness={0.56} />
            </mesh>
          );
        })}
        <mesh position={[18.4, 6.25, 0]} castShadow>
          <boxGeometry args={[5.4, 0.78, 2.15]} />
          <meshStandardMaterial color="#0D3B2E" roughness={0.56} />
        </mesh>
        <mesh position={[18.4, 6.25, 1.1]}>
          <planeGeometry args={[4.8, 0.66]} />
          <meshStandardMaterial map={textures.pedestrianGateSign} color="#ffffff" roughness={0.45} />
        </mesh>
        {/* Open Pedestrian Iron Gate Folded Beside Pedestrian Pier */}
        <group position={[20.8, 0, -1.1]}>
          {[0.3, 1.4, 2.4].map((ry) => (
            <mesh key={ry} position={[0, ry, 0]}>
              <boxGeometry args={[0.1, 0.1, 1.8]} />
              <meshStandardMaterial color="#1D2622" roughness={0.45} metalness={0.7} />
            </mesh>
          ))}
          {[-0.7, -0.35, 0, 0.35, 0.7].map((pz) => (
            <mesh key={pz} position={[0, 1.35, pz]}>
              <cylinderGeometry args={[0.025, 0.025, 2.2, 6]} />
              <meshStandardMaterial color="#252F2B" roughness={0.42} metalness={0.72} />
            </mesh>
          ))}
        </group>

        {/* Raised Pedestrian Gate Platform & Elevated Security Balcony Deck (X: +15.8..+24.8) */}
        <mesh position={[20.3, 0.13, 0]} receiveShadow>
          <boxGeometry args={[9.0, 0.26, 9.0]} />
          <meshStandardMaterial color="#CFC6B8" roughness={0.86} />
        </mesh>
        <mesh position={[20.3, 0.065, 4.9]} receiveShadow>
          <boxGeometry args={[9.0, 0.13, 0.85]} />
          <meshStandardMaterial color="#B5ABA0" roughness={0.84} />
        </mesh>
        <mesh position={[20.3, 0.065, -4.9]} receiveShadow>
          <boxGeometry args={[9.0, 0.13, 0.85]} />
          <meshStandardMaterial color="#B5ABA0" roughness={0.84} />
        </mesh>
        {/* Elevated Guard Balcony Platform attached behind East Pedestrian Pier */}
        <group position={[23.6, 0, -2.45]}>
          <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.4, 2.3, 3.8]} />
            <meshStandardMaterial color="#EAE2D4" roughness={0.82} />
          </mesh>
          <mesh position={[0, 2.42, 0]} castShadow>
            <boxGeometry args={[3.7, 0.22, 4.1]} />
            <meshStandardMaterial color="#0D3B2E" roughness={0.58} />
          </mesh>
          <mesh position={[-1.65, 2.95, 0]} castShadow>
            <boxGeometry args={[0.12, 0.88, 3.8]} />
            <meshStandardMaterial color="#19352B" roughness={0.45} metalness={0.5} />
          </mesh>
          <mesh position={[0, 3.95, 0]} castShadow>
            <boxGeometry args={[3.9, 0.2, 4.3]} />
            <meshStandardMaterial color="#0D3B2E" roughness={0.56} />
          </mesh>
        </group>

        {/* Perimeter Fence Wings */}
        <mesh position={[-80.4, 1.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[129.2, 2.5, 0.6]} />
          <meshStandardMaterial color="#DCD3C4" roughness={0.86} />
        </mesh>
        <mesh position={[79.2, 1.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[111.6, 2.5, 0.6]} />
          <meshStandardMaterial color="#DCD3C4" roughness={0.86} />
        </mesh>
      </group>

      {/* ===================================================================== */}
      {/* 6. SECURITY BUILDING (28, 0, 95) & UNIVERSITY HALL (54, 0, 95)        */}
      {/* ===================================================================== */}
      <group position={[28.0, 0, 95.0]}>
        <mesh position={[0, 3.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[12.0, 6.8, 10.0]} />
          <meshStandardMaterial color="#EAE2D4" roughness={0.82} />
        </mesh>
        <mesh position={[0, 6.98, 0]} castShadow>
          <boxGeometry args={[12.8, 0.48, 10.8]} />
          <meshStandardMaterial color="#0D3B2E" roughness={0.58} />
        </mesh>
        <mesh position={[0, 3.4, 0]}>
          <boxGeometry args={[12.2, 0.25, 10.2]} />
          <meshStandardMaterial color="#A3482E" roughness={0.72} />
        </mesh>
        <mesh position={[-6.03, 5.1, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[6.8, 1.45]} />
          <meshStandardMaterial color="#274754" roughness={0.15} metalness={0.45} />
        </mesh>
        <mesh position={[0, 5.1, 5.03]}>
          <planeGeometry args={[7.6, 1.45]} />
          <meshStandardMaterial color="#274754" roughness={0.15} metalness={0.45} />
        </mesh>
        <mesh position={[-6.6, 2.75, 0]} castShadow>
          <boxGeometry args={[1.6, 0.28, 3.6]} />
          <meshStandardMaterial color="#0D3B2E" roughness={0.6} />
        </mesh>
        <mesh position={[-6.02, 1.25, 0]}>
          <boxGeometry args={[0.08, 2.5, 2.0]} />
          <meshStandardMaterial color="#1E3B46" roughness={0.16} metalness={0.45} />
        </mesh>
        <mesh position={[-6.08, 3.4, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[6.4, 0.96]} />
          <meshStandardMaterial map={textures.securitySign} color="#ffffff" roughness={0.45} />
        </mesh>
      </group>

      <group position={[54.0, 0, 95.0]}>
        <mesh position={[0, 3.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[24.0, 7.0, 14.0]} />
          <meshStandardMaterial color="#ECE4D6" roughness={0.82} />
        </mesh>
        <mesh position={[0, 7.22, 0]} castShadow>
          <boxGeometry args={[25.0, 0.55, 15.0]} />
          <meshStandardMaterial color="#0D3B2E" roughness={0.56} />
        </mesh>
        <mesh position={[0, 3.55, 0]}>
          <boxGeometry args={[24.2, 0.26, 14.2]} />
          <meshStandardMaterial color="#9E4731" roughness={0.74} />
        </mesh>
        {[-9.6, -3.6, 3.6, 9.6].map((cx) => (
          <mesh key={`hall-col-${cx}`} position={[cx, 3.5, 7.18]} castShadow>
            <boxGeometry args={[0.62, 7.0, 0.5]} />
            <meshStandardMaterial color="#DFD5C5" roughness={0.82} />
          </mesh>
        ))}
        {/* South Entrance Porch Canopy & Threshold Mat (world X=54, Z=103) */}
        <mesh position={[0, 2.85, 7.85]} castShadow>
          <boxGeometry args={[5.8, 0.34, 2.0]} />
          <meshStandardMaterial color="#0D3B2E" roughness={0.58} />
        </mesh>
        {[-2.5, 2.5].map((cx) => (
          <mesh key={`hall-porch-col-${cx}`} position={[cx, 1.42, 8.65]} castShadow>
            <boxGeometry args={[0.28, 2.84, 0.28]} />
            <meshStandardMaterial color="#DDD4C3" roughness={0.8} />
          </mesh>
        ))}
        <mesh position={[0, 0.025, 8.2]} receiveShadow>
          <boxGeometry args={[2.2, 0.03, 1.35]} />
          <meshStandardMaterial color="#0D3B2E" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.045, 8.2]}>
          <boxGeometry args={[1.82, 0.015, 0.98]} />
          <meshStandardMaterial color="#D4A024" roughness={0.42} metalness={0.35} />
        </mesh>
        <mesh position={[0, 5.2, 7.03]}>
          <planeGeometry args={[17.6, 1.55]} />
          <meshStandardMaterial color="#274754" roughness={0.18} metalness={0.5} />
        </mesh>
        <mesh position={[0, 1.35, 7.03]}>
          <boxGeometry args={[3.4, 2.7, 0.1]} />
          <meshStandardMaterial color="#1E3B46" roughness={0.16} metalness={0.45} />
        </mesh>
        <mesh position={[0, 3.6, 7.24]}>
          <planeGeometry args={[10.4, 1.15]} />
          <meshStandardMaterial map={textures.hallSign} color="#ffffff" roughness={0.45} />
        </mesh>
      </group>

      {/* ===================================================================== */}
      {/* 7. BASKETBALL ARENA (-44.0, 0, 82.0) — SET BACK WITH WIDE OPEN LAWN   */}
      {/* ===================================================================== */}
      <group position={[-44.0, 0, 82.0]}>
        <mesh position={[0, 0.02, 0]} receiveShadow>
          <boxGeometry args={[28.0, 0.04, 26.0]} />
          <meshStandardMaterial color="#C8BFB2" roughness={0.86} />
        </mesh>
        <mesh position={[0, 0.042, 0]} receiveShadow>
          <boxGeometry args={[20.0, 0.015, 20.0]} />
          <meshStandardMaterial color="#2D6A4F" roughness={0.78} />
        </mesh>
        <mesh position={[0, 0.052, -7.2]}>
          <boxGeometry args={[5.4, 0.008, 4.6]} />
          <meshStandardMaterial color="#B5492E" roughness={0.75} />
        </mesh>
        <mesh position={[0, 0.052, 7.2]}>
          <boxGeometry args={[5.4, 0.008, 4.6]} />
          <meshStandardMaterial color="#B5492E" roughness={0.75} />
        </mesh>
        <mesh position={[0, 0.055, 0]}>
          <boxGeometry args={[19.6, 0.006, 0.14]} />
          <meshStandardMaterial color="#F5F5F5" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.055, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.9, 2.06, 28]} />
          <meshStandardMaterial color="#F5F5F5" roughness={0.5} />
        </mesh>
        <BasketballHoop position={[0, 0, -9.3]} rotationY={0} />
        <BasketballHoop position={[0, 0, 9.3]} rotationY={Math.PI} />
      </group>
      <QuadBench position={[-56.55, 0, 77.8]} rotationY={Math.PI / 2} />
      <QuadBench position={[-56.55, 0, 86.2]} rotationY={Math.PI / 2} />

      {/* ===================================================================== */}
      {/* 8. FLAG ROUNDABOUT MONUMENT & 3 CEREMONIAL FLAGPOLES (0, 0, 6)        */}
      {/* ===================================================================== */}
      <group position={[ROUNDABOUT_CENTER.x, 0, ROUNDABOUT_CENTER.z]}>
        <mesh position={[0, 0.14, 0]} receiveShadow>
          <cylinderGeometry args={[ROUNDABOUT_INNER_RADIUS, ROUNDABOUT_INNER_RADIUS + 0.18, 0.28, 40]} />
          <meshStandardMaterial color="#C8BFB2" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.3, 0]} receiveShadow>
          <cylinderGeometry args={[5.6, 5.6, 0.08, 40]} />
          <meshStandardMaterial color="#3D6B3B" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[2.3, 2.65, 0.7, 20]} />
          <meshStandardMaterial color="#EDE5D7" roughness={0.78} />
        </mesh>
        <mesh position={[0, 1.08, 0]} castShadow>
          <cylinderGeometry args={[1.95, 1.95, 0.18, 20]} />
          <meshStandardMaterial color="#0D3B2E" roughness={0.6} />
        </mesh>

        {/* Center Main University Flagpole */}
        <mesh position={[0, 4.5, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.1, 7.0, 10]} />
          <meshStandardMaterial color="#E6ECEA" roughness={0.32} metalness={0.72} />
        </mesh>
        <mesh position={[0, 8.05, 0]} castShadow>
          <sphereGeometry args={[0.15, 10, 10]} />
          <meshStandardMaterial color="#D4A024" roughness={0.28} metalness={0.8} />
        </mesh>
        <mesh position={[0.78, 7.35, 0]} castShadow>
          <boxGeometry args={[1.5, 0.88, 0.05]} />
          <meshStandardMaterial color="#0D5C43" roughness={0.65} />
        </mesh>
        <mesh position={[0.78, 7.35, 0.035]}>
          <boxGeometry args={[0.58, 0.44, 0.02]} />
          <meshStandardMaterial color="#D4A024" roughness={0.5} />
        </mesh>

        {/* Left Flanking National Flag (Green-White-Green) */}
        <group position={[-1.45, 0, 0.35]}>
          <mesh position={[0, 3.8, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.075, 5.6, 10]} />
            <meshStandardMaterial color="#E6ECEA" roughness={0.32} metalness={0.72} />
          </mesh>
          <mesh position={[0, 6.65, 0]}>
            <sphereGeometry args={[0.11, 8, 8]} />
            <meshStandardMaterial color="#D4A024" roughness={0.28} metalness={0.8} />
          </mesh>
          <mesh position={[0.24, 6.1, 0]}>
            <boxGeometry args={[0.42, 0.72, 0.04]} />
            <meshStandardMaterial color="#008751" roughness={0.65} />
          </mesh>
          <mesh position={[0.66, 6.1, 0]}>
            <boxGeometry args={[0.42, 0.72, 0.04]} />
            <meshStandardMaterial color="#F7F7F7" roughness={0.65} />
          </mesh>
          <mesh position={[1.08, 6.1, 0]}>
            <boxGeometry args={[0.42, 0.72, 0.04]} />
            <meshStandardMaterial color="#008751" roughness={0.65} />
          </mesh>
        </group>

        {/* Right Flanking Ceremonial Flag */}
        <group position={[1.45, 0, 0.35]}>
          <mesh position={[0, 3.8, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.075, 5.6, 10]} />
            <meshStandardMaterial color="#E6ECEA" roughness={0.32} metalness={0.72} />
          </mesh>
          <mesh position={[0, 6.65, 0]}>
            <sphereGeometry args={[0.11, 8, 8]} />
            <meshStandardMaterial color="#D4A024" roughness={0.28} metalness={0.8} />
          </mesh>
          <mesh position={[0.64, 6.1, 0]}>
            <boxGeometry args={[1.22, 0.72, 0.04]} />
            <meshStandardMaterial color="#9E4731" roughness={0.65} />
          </mesh>
          <mesh position={[0.64, 6.1, 0.03]}>
            <boxGeometry args={[1.22, 0.24, 0.02]} />
            <meshStandardMaterial color="#D4A024" roughness={0.45} />
          </mesh>
        </group>
      </group>

      {/* ===================================================================== */}
      {/* 9. VOLLEYBALL COURT & MUSTER POINT (-87.0, 0, -76.0) — AFTER CAFETERIA */}
      {/* ===================================================================== */}
      <group position={[-87.0, 0, -76.0]}>
        <mesh position={[0, 0.02, 0]} receiveShadow>
          <boxGeometry args={[26.0, 0.04, 24.0]} />
          <meshStandardMaterial color="#CFC6B8" roughness={0.86} />
        </mesh>
        <mesh position={[0, 0.045, 0]} receiveShadow>
          <boxGeometry args={[18.0, 0.015, 9.0]} />
          <meshStandardMaterial color="#B85233" roughness={0.76} />
        </mesh>
        <mesh position={[0, 0.056, 0]}>
          <boxGeometry args={[0.14, 0.006, 8.8]} />
          <meshStandardMaterial color="#F5F5F5" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.056, 4.35]}>
          <boxGeometry args={[17.8, 0.006, 0.14]} />
          <meshStandardMaterial color="#F5F5F5" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.056, -4.35]}>
          <boxGeometry args={[17.8, 0.006, 0.14]} />
          <meshStandardMaterial color="#F5F5F5" roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.25, -4.1]} castShadow>
          <cylinderGeometry args={[0.06, 0.07, 2.5, 8]} />
          <meshStandardMaterial color="#EAEAEA" roughness={0.4} metalness={0.35} />
        </mesh>
        <mesh position={[0, 1.25, 4.1]} castShadow>
          <cylinderGeometry args={[0.06, 0.07, 2.5, 8]} />
          <meshStandardMaterial color="#EAEAEA" roughness={0.4} metalness={0.35} />
        </mesh>
        <mesh position={[0, 1.95, 0]}>
          <boxGeometry args={[0.05, 0.85, 8.2]} />
          <meshStandardMaterial color="#F2F4F3" wireframe transparent opacity={0.65} />
        </mesh>
        <mesh position={[0, 2.38, 0]}>
          <boxGeometry args={[0.07, 0.08, 8.3]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
        </mesh>

        {/* Muster Point Assembly Signboard Gantry at local (9.2, 0, 9.7) -> world (-77.8, 0, -66.3) */}
        <group position={[9.2, 0, 9.7]}>
          <mesh position={[-1.1, 1.4, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.08, 2.8, 8]} />
            <meshStandardMaterial color="#252E2A" roughness={0.45} metalness={0.6} />
          </mesh>
          <mesh position={[1.1, 1.4, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.08, 2.8, 8]} />
            <meshStandardMaterial color="#252E2A" roughness={0.45} metalness={0.6} />
          </mesh>
          <mesh position={[0, 2.25, 0]} castShadow>
            <boxGeometry args={[3.4, 1.15, 0.14]} />
            <meshStandardMaterial color="#7A2E1E" roughness={0.6} />
          </mesh>
          <mesh position={[0, 2.25, 0.08]}>
            <planeGeometry args={[3.2, 1.0]} />
            <meshStandardMaterial map={textures.musterSign} color="#ffffff" roughness={0.45} />
          </mesh>
        </group>
      </group>

      {/* ===================================================================== */}
      {/* 10. FEMALE & MALE 100-LEVEL HOSTEL (-91.0, 0, -140.0)                 */}
      {/* ===================================================================== */}
      <group position={[-91.0, 0, -140.0]}>
        <mesh position={[18.8, 0.022, 0]} receiveShadow>
          <boxGeometry args={[7.8, 0.03, 18.0]} />
          <meshStandardMaterial color="#CFC6B8" roughness={0.86} />
        </mesh>
        <mesh position={[0, 3.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[30.0, 7.2, 32.0]} />
          <meshStandardMaterial color="#EDE5D7" roughness={0.82} />
        </mesh>
        <mesh position={[0, 7.42, 0]} castShadow>
          <boxGeometry args={[31.4, 0.52, 33.4]} />
          <meshStandardMaterial color="#0D3B2E" roughness={0.58} />
        </mesh>
        <mesh position={[0, 3.65, 0]}>
          <boxGeometry args={[30.24, 0.24, 32.24]} />
          <meshStandardMaterial color="#9E4731" roughness={0.74} />
        </mesh>
        <mesh position={[15.03, 5.3, -8.5]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[10.5, 1.5]} />
          <meshStandardMaterial color="#274754" roughness={0.18} metalness={0.5} />
        </mesh>
        <mesh position={[15.03, 5.3, 8.5]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[10.5, 1.5]} />
          <meshStandardMaterial color="#274754" roughness={0.18} metalness={0.5} />
        </mesh>
        <mesh position={[15.03, 1.9, -8.5]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[10.5, 1.5]} />
          <meshStandardMaterial color="#274754" roughness={0.18} metalness={0.5} />
        </mesh>
        <mesh position={[15.03, 1.9, 8.5]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[10.5, 1.5]} />
          <meshStandardMaterial color="#274754" roughness={0.18} metalness={0.5} />
        </mesh>
        <mesh position={[15.7, 2.8, 0]} castShadow>
          <boxGeometry args={[1.8, 0.3, 5.0]} />
          <meshStandardMaterial color="#0D3B2E" roughness={0.58} />
        </mesh>
        <mesh position={[15.02, 1.35, 0]}>
          <boxGeometry args={[0.1, 2.7, 2.6]} />
          <meshStandardMaterial color="#1E3B46" roughness={0.16} metalness={0.45} />
        </mesh>
        <mesh position={[15.08, 3.9, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[11.6, 1.25]} />
          <meshStandardMaterial map={textures.hostel100Sign} color="#ffffff" roughness={0.45} />
        </mesh>
      </group>

      {/* ===================================================================== */}
      {/* 11. UNIVERSITY FOOTBALL FIELD (-25.0, 0, -147.0)                      */}
      {/* ===================================================================== */}
      <group position={[-25.0, 0, -147.0]}>
        <mesh position={[0, 0.018, 0]} receiveShadow>
          <boxGeometry args={[46.0, 0.02, 46.0]} />
          <meshStandardMaterial color="#346E36" roughness={0.92} />
        </mesh>
        {[-16, -8, 0, 8, 16].map((sz, idx) => (
          <mesh key={`pitch-stripe-${idx}`} position={[0, 0.025, sz]} receiveShadow>
            <boxGeometry args={[42.0, 0.01, 4.0]} />
            <meshStandardMaterial color="#3F7E40" roughness={0.9} />
          </mesh>
        ))}
        <mesh position={[0, 0.036, 0]}>
          <boxGeometry args={[42.0, 0.008, 0.18]} />
          <meshStandardMaterial color="#F7F7F7" roughness={0.5} />
        </mesh>
        <mesh position={[-21.0, 0.036, 0]}>
          <boxGeometry args={[0.18, 0.008, 43.2]} />
          <meshStandardMaterial color="#F7F7F7" roughness={0.5} />
        </mesh>
        <mesh position={[21.0, 0.036, 0]}>
          <boxGeometry args={[0.18, 0.008, 43.2]} />
          <meshStandardMaterial color="#F7F7F7" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.036, -21.6]}>
          <boxGeometry args={[42.0, 0.008, 0.18]} />
          <meshStandardMaterial color="#F7F7F7" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.036, 21.6]}>
          <boxGeometry args={[42.0, 0.008, 0.18]} />
          <meshStandardMaterial color="#F7F7F7" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.038, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.4, 4.65, 32]} />
          <meshStandardMaterial color="#F7F7F7" roughness={0.5} />
        </mesh>
        <FootballGoal position={[0, 0, -21.6]} rotationY={0} />
        <FootballGoal position={[0, 0, 21.6]} rotationY={Math.PI} />

        {/* West Touchline Covered Bleachers (world X: -51.4..-48.8, Z: -156..-138) */}
        <group position={[-25.1, 0, 0]}>
          <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.2, 0.7, 18.0]} />
            <meshStandardMaterial color="#C8BFB2" roughness={0.85} />
          </mesh>
          <mesh position={[-0.4, 0.9, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 0.45, 18.0]} />
            <meshStandardMaterial color="#0D3B2E" roughness={0.65} />
          </mesh>
          <mesh position={[0, 2.35, 0]} castShadow>
            <boxGeometry args={[2.5, 0.16, 18.4]} />
            <meshStandardMaterial color="#0D3B2E" roughness={0.55} />
          </mesh>
        </group>
      </group>

      {/* ===================================================================== */}
      {/* 12. MALE 200-500-LEVEL HOSTEL (-64.0, 0, -197.0) — END OF ROAD        */}
      {/* ===================================================================== */}
      <group position={[-64.0, 0, -197.0]}>
        <mesh position={[0, 0.022, 11.2]} receiveShadow>
          <boxGeometry args={[26.0, 0.03, 5.2]} />
          <meshStandardMaterial color="#CFC6B8" roughness={0.86} />
        </mesh>
        <mesh position={[0, 5.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[48.0, 10.2, 18.0]} />
          <meshStandardMaterial color="#EDE5D7" roughness={0.82} />
        </mesh>
        <mesh position={[0, 10.45, 0]} castShadow>
          <boxGeometry args={[49.4, 0.55, 19.4]} />
          <meshStandardMaterial color="#0D3B2E" roughness={0.56} />
        </mesh>
        {[3.3, 6.6, 9.7].map((ly) => (
          <mesh key={`mh-louver-${ly}`} position={[0, ly, 9.12]} castShadow>
            <boxGeometry args={[45.6, 0.25, 0.34]} />
            <meshStandardMaterial color="#D4CCBE" roughness={0.8} />
          </mesh>
        ))}
        {[4.9, 8.2].map((wy) => (
          <mesh key={`mh-win-${wy}`} position={[0, wy, 9.03]}>
            <planeGeometry args={[38.0, 1.55]} />
            <meshStandardMaterial color="#274754" roughness={0.18} metalness={0.52} />
          </mesh>
        ))}
        <mesh position={[0, 2.95, 9.8]} castShadow>
          <boxGeometry args={[6.4, 0.35, 2.0]} />
          <meshStandardMaterial color="#0D3B2E" roughness={0.58} />
        </mesh>
        <mesh position={[0, 1.38, 9.04]}>
          <boxGeometry args={[3.0, 2.76, 0.1]} />
          <meshStandardMaterial color="#1E3B46" roughness={0.16} metalness={0.45} />
        </mesh>
        <mesh position={[0, 4.0, 9.18]}>
          <planeGeometry args={[14.5, 1.4]} />
          <meshStandardMaterial map={textures.hostelMaleSeniorSign} color="#ffffff" roughness={0.45} />
        </mesh>
      </group>

      {/* ===================================================================== */}
      {/* 13. DIRECTIONAL SIGNPOST & CAMPUS BENCHES                             */}
      {/* ===================================================================== */}
      <group position={[11.9, 0, 55.0]}>
        <mesh position={[-0.7, 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.08, 3.0, 8]} />
          <meshStandardMaterial color="#252E2A" roughness={0.45} metalness={0.6} />
        </mesh>
        <mesh position={[0.7, 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.08, 3.0, 8]} />
          <meshStandardMaterial color="#252E2A" roughness={0.45} metalness={0.6} />
        </mesh>
        <mesh position={[0, 2.25, 0]} castShadow>
          <boxGeometry args={[2.1, 1.5, 0.14]} />
          <meshStandardMaterial color="#0D3B2E" roughness={0.6} />
        </mesh>
        <mesh position={[0, 2.25, 0.08]}>
          <planeGeometry args={[1.95, 1.38]} />
          <meshStandardMaterial map={textures.dirSign} color="#ffffff" roughness={0.45} />
        </mesh>
      </group>

      <QuadBench position={[-11.7, 0, 57.7]} rotationY={Math.PI / 2} />
      <QuadBench position={[11.7, 0, 35.7]} rotationY={-Math.PI / 2} />
      <QuadBench position={[11.7, 0, 71.7]} rotationY={-Math.PI / 2} />
      <QuadBench position={[-19.3, 0, -26.9]} />
      <QuadBench position={[19.3, 0, -26.9]} />

      <CampusVehiclesAndProps />
      <Phase22Buildings />
      <InstancedFoliageAndLights />
    </group>
  );
}
