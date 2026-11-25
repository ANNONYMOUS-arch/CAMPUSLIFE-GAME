import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  createInteriorPlaqueTexture,
  createTerrazzoTileTexture,
} from '../../game/three/textures';
import type { GraphicsQuality } from '../../game/types/game';
import type {
  InteriorDoorSpec,
  InteriorFurnitureSpec,
  InteriorSurfaceSpec,
  InteriorWorld,
} from '../../game/types/interior';

interface InteriorEnvironmentProps {
  interior: InteriorWorld;
  doorStates: Record<string, boolean>;
  graphicsQuality: GraphicsQuality;
  isSoftwareGl: boolean;
}

interface SharedInteriorMaterials {
  terrazzoTex: THREE.CanvasTexture;
  floor: THREE.MeshStandardMaterial;
  ceiling: THREE.MeshStandardMaterial;
  wall: THREE.MeshStandardMaterial;
  trim: THREE.MeshStandardMaterial;
  brass: THREE.MeshStandardMaterial;
  stair: THREE.MeshStandardMaterial;
  railing: THREE.MeshStandardMaterial;
  roomDoor: THREE.MeshStandardMaterial;
  exitDoor: THREE.MeshStandardMaterial;
  wood: THREE.MeshStandardMaterial;
  pewWood: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  stainless: THREE.MeshStandardMaterial;
  cushion: THREE.MeshStandardMaterial;
  whiteboard: THREE.MeshStandardMaterial;
  cork: THREE.MeshStandardMaterial;
  terracotta: THREE.MeshStandardMaterial;
  foliage: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  screenBlue: THREE.MeshStandardMaterial;
  medicalWhite: THREE.MeshStandardMaterial;
  medicalTeal: THREE.MeshStandardMaterial;
  safetyYellow: THREE.MeshStandardMaterial;
  crimson: THREE.MeshStandardMaterial;
  battenGlow: THREE.MeshBasicMaterial;
  bookColors: THREE.MeshStandardMaterial[];
}

function DoorMesh({
  door,
  interiorName,
  isOpen,
  materials,
}: {
  door: InteriorDoorSpec;
  interiorName: string;
  isOpen: boolean;
  materials: SharedInteriorMaterials;
}) {
  const pivotRef = useRef<THREE.Group>(null);
  const { invalidate } = useThree();

  const plaqueTex = useMemo(() => {
    const isExit = door.kind === 'building-exit';
    return createInteriorPlaqueTexture(
      isExit ? 'CAMPUS EXIT' : door.label.toUpperCase(),
      isExit ? 'Press [E] to Step Outside' : door.subtitle ?? interiorName,
      isExit ? '#142620' : '#0D3B2E',
      '#D4A024',
      '#F5F0E6',
      4
    );
  }, [door.kind, door.label, door.subtitle, interiorName]);

  useEffect(() => {
    return () => {
      plaqueTex.dispose();
    };
  }, [plaqueTex]);

  const targetYaw = isOpen ? door.openYaw : door.closedYaw;

  useEffect(() => {
    if (pivotRef.current) {
      pivotRef.current.rotation.y = targetYaw;
    }
    invalidate();
  }, [invalidate]); // initial mount only

  useFrame((_, rawDelta) => {
    const pivot = pivotRef.current;
    if (!pivot) return;
    const diff = targetYaw - pivot.rotation.y;
    if (Math.abs(diff) > 0.003) {
      const dt = Math.min(rawDelta, 0.05);
      pivot.rotation.y += diff * Math.min(1, 12 * dt);
      invalidate();
    } else if (pivot.rotation.y !== targetYaw) {
      pivot.rotation.y = targetYaw;
    }
  });

  const isExit = door.kind === 'building-exit';
  const leafMaterial = isExit ? materials.exitDoor : materials.roomDoor;
  const isAxisZ = door.axis === 'z';
  const centerX = isAxisZ ? door.hingeX : door.hingeX + door.width / 2;
  const centerZ = isAxisZ ? door.hingeZ + door.width / 2 : door.hingeZ;

  return (
    <group>
      {/* Door Frame Jambs & Lintel */}
      {isAxisZ ? (
        <>
          <mesh
            position={[door.hingeX, door.hingeY + door.height / 2, door.hingeZ - 0.04]}
            material={materials.trim}
          >
            <boxGeometry args={[0.28, door.height + 0.06, 0.08]} />
          </mesh>
          <mesh
            position={[door.hingeX, door.hingeY + door.height / 2, door.hingeZ + door.width + 0.04]}
            material={materials.trim}
          >
            <boxGeometry args={[0.28, door.height + 0.06, 0.08]} />
          </mesh>
          <mesh
            position={[door.hingeX, door.hingeY + door.height + 0.04, centerZ]}
            material={materials.trim}
          >
            <boxGeometry args={[0.28, 0.08, door.width + 0.16]} />
          </mesh>
          {/* Plaques on both faces of Z-axis interior doorway */}
          <mesh
            position={[door.hingeX - 0.15, door.hingeY + door.height + 0.28, centerZ]}
            rotation={[0, -Math.PI / 2, 0]}
          >
            <planeGeometry args={[1.28, 0.34]} />
            <meshBasicMaterial map={plaqueTex} />
          </mesh>
          <mesh
            position={[door.hingeX + 0.15, door.hingeY + door.height + 0.28, centerZ]}
            rotation={[0, Math.PI / 2, 0]}
          >
            <planeGeometry args={[1.28, 0.34]} />
            <meshBasicMaterial map={plaqueTex} />
          </mesh>
        </>
      ) : (
        <>
          <mesh
            position={[door.hingeX - 0.04, door.hingeY + door.height / 2, door.hingeZ]}
            material={materials.trim}
          >
            <boxGeometry args={[0.08, door.height + 0.06, 0.28]} />
          </mesh>
          <mesh
            position={[door.hingeX + door.width + 0.04, door.hingeY + door.height / 2, door.hingeZ]}
            material={materials.trim}
          >
            <boxGeometry args={[0.08, door.height + 0.06, 0.28]} />
          </mesh>
          <mesh
            position={[centerX, door.hingeY + door.height + 0.04, door.hingeZ]}
            material={materials.trim}
          >
            <boxGeometry args={[door.width + 0.16, 0.08, 0.28]} />
          </mesh>
          <mesh
            position={[
              centerX,
              door.hingeY + door.height + 0.28,
              door.hingeZ + (isExit ? (door.hingeZ < 0 ? 0.15 : -0.15) : 0.15),
            ]}
            rotation={[0, isExit && door.hingeZ >= 0 ? Math.PI : 0, 0]}
          >
            <planeGeometry args={[1.28, 0.34]} />
            <meshBasicMaterial map={plaqueTex} />
          </mesh>
        </>
      )}

      {/* Hinged Door Leaf */}
      <group ref={pivotRef} position={[door.hingeX, door.hingeY, door.hingeZ]}>
        <mesh
          position={[door.width / 2, door.height / 2, 0]}
          material={leafMaterial}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[door.width, door.height, door.thickness]} />
        </mesh>
        {/* Decorative Recessed Vision Strip on Doors */}
        <mesh
          position={[door.width * 0.5, door.height * 0.62, 0]}
          material={materials.glass}
        >
          <boxGeometry args={[0.26, 0.72, door.thickness + 0.015]} />
        </mesh>
        {/* Brass Lever Handles (Both Sides) */}
        <mesh
          position={[door.width - 0.16, 1.04, door.thickness / 2 + 0.035]}
          material={materials.brass}
        >
          <boxGeometry args={[0.14, 0.035, 0.05]} />
        </mesh>
        <mesh
          position={[door.width - 0.16, 1.04, -door.thickness / 2 - 0.035]}
          material={materials.brass}
        >
          <boxGeometry args={[0.14, 0.035, 0.05]} />
        </mesh>
      </group>
    </group>
  );
}

function WallSignMesh({
  item,
  materials,
}: {
  item: InteriorFurnitureSpec;
  materials: SharedInteriorMaterials;
}) {
  const isConstruction = item.variant === 'construction';
  const tex = useMemo(() => {
    return createInteriorPlaqueTexture(
      item.label ?? 'CAMPUS DIRECTORY',
      item.subtitle ?? '',
      isConstruction ? '#3B2608' : '#0D3B2E',
      isConstruction ? '#F59E0B' : '#D4A024',
      '#F5F0E6',
      4
    );
  }, [item.label, item.subtitle, isConstruction]);

  useEffect(() => {
    return () => {
      tex.dispose();
    };
  }, [tex]);

  return (
    <group position={[item.x, item.y, item.z]} rotation={[0, item.rotationY, 0]}>
      <mesh material={isConstruction ? materials.safetyYellow : materials.trim}>
        <boxGeometry args={[2.28, 0.64, 0.04]} />
      </mesh>
      <mesh position={[0, 0, 0.024]}>
        <planeGeometry args={[2.16, 0.54]} />
        <meshBasicMaterial map={tex} />
      </mesh>
    </group>
  );
}

function WorkshopMachineMesh({
  item,
  materials,
}: {
  item: InteriorFurnitureSpec;
  materials: SharedInteriorMaterials;
}) {
  const variant = item.variant ?? 'cnc-lathe';
  return (
    <group position={[item.x, item.y, item.z]} rotation={[0, item.rotationY, 0]}>
      {/* Base Machine Plinth */}
      <mesh position={[0, 0.42, 0]} material={materials.metal} castShadow receiveShadow>
        <boxGeometry args={[1.9, 0.84, 1.0]} />
      </mesh>
      <mesh position={[0, 0.87, 0]} material={materials.stainless}>
        <boxGeometry args={[1.98, 0.06, 1.06]} />
      </mesh>

      {variant === 'wood-lathe' && (
        <>
          <mesh position={[-0.55, 1.08, 0]} material={materials.trim} castShadow>
            <boxGeometry args={[0.42, 0.36, 0.46]} />
          </mesh>
          <mesh position={[0.15, 1.02, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.wood}>
            <cylinderGeometry args={[0.08, 0.08, 0.85, 10]} />
          </mesh>
          <mesh position={[0.25, 0.94, 0.38]} material={materials.safetyYellow}>
            <boxGeometry args={[1.1, 0.14, 0.06]} />
          </mesh>
        </>
      )}

      {variant === 'engine-rig' && (
        <>
          <mesh position={[-0.2, 1.15, 0]} material={materials.trim} castShadow>
            <boxGeometry args={[0.85, 0.52, 0.58]} />
          </mesh>
          <mesh position={[0.55, 1.25, 0]} material={materials.stainless}>
            <boxGeometry args={[0.46, 0.68, 0.52]} />
          </mesh>
          <mesh position={[0.55, 1.4, 0.27]} material={materials.brass}>
            <boxGeometry args={[0.3, 0.24, 0.04]} />
          </mesh>
        </>
      )}

      {variant === 'welding-unit' && (
        <>
          <mesh position={[-0.3, 1.16, 0]} material={materials.safetyYellow} castShadow>
            <boxGeometry args={[0.82, 0.56, 0.68]} />
          </mesh>
          <mesh position={[0.48, 1.38, -0.15]} material={materials.crimson} castShadow>
            <cylinderGeometry args={[0.14, 0.14, 1.02, 12]} />
          </mesh>
          <mesh position={[0.76, 1.38, -0.15]} material={materials.trim} castShadow>
            <cylinderGeometry args={[0.14, 0.14, 1.02, 12]} />
          </mesh>
        </>
      )}

      {variant === 'test-bench' && (
        <>
          <mesh position={[0, 1.24, -0.22]} material={materials.metal} castShadow>
            <boxGeometry args={[1.76, 0.68, 0.38]} />
          </mesh>
          <mesh position={[-0.45, 1.28, -0.02]} material={materials.screenBlue}>
            <boxGeometry args={[0.48, 0.34, 0.03]} />
          </mesh>
          <mesh position={[0.35, 1.28, -0.02]} material={materials.screenBlue}>
            <boxGeometry args={[0.48, 0.34, 0.03]} />
          </mesh>
          <mesh position={[0, 1.62, -0.22]} material={materials.safetyYellow}>
            <boxGeometry args={[1.76, 0.06, 0.4]} />
          </mesh>
        </>
      )}

      {variant === 'cnc-lathe' && (
        <>
          <mesh position={[-0.56, 1.18, 0]} material={materials.trim} castShadow>
            <boxGeometry args={[0.56, 0.56, 0.72]} />
          </mesh>
          <mesh position={[0.25, 1.08, 0]} material={materials.safetyYellow}>
            <boxGeometry args={[0.92, 0.36, 0.56]} />
          </mesh>
          <mesh position={[0.25, 1.28, 0.12]} material={materials.glass}>
            <boxGeometry args={[0.72, 0.24, 0.32]} />
          </mesh>
        </>
      )}
    </group>
  );
}

function FurnitureMesh({
  item,
  materials,
}: {
  item: InteriorFurnitureSpec;
  materials: SharedInteriorMaterials;
}) {
  switch (item.kind) {
    case 'desk':
      return (
        <group position={[item.x, item.y, item.z]} rotation={[0, item.rotationY, 0]}>
          <mesh position={[0, 0.74, 0]} material={materials.wood} castShadow receiveShadow>
            <boxGeometry args={[1.7, 0.06, 0.8]} />
          </mesh>
          <mesh position={[-0.75, 0.36, -0.32]} material={materials.metal}>
            <boxGeometry args={[0.06, 0.72, 0.06]} />
          </mesh>
          <mesh position={[0.75, 0.36, -0.32]} material={materials.metal}>
            <boxGeometry args={[0.06, 0.72, 0.06]} />
          </mesh>
          <mesh position={[-0.75, 0.36, 0.32]} material={materials.metal}>
            <boxGeometry args={[0.06, 0.72, 0.06]} />
          </mesh>
          <mesh position={[0.75, 0.36, 0.32]} material={materials.metal}>
            <boxGeometry args={[0.06, 0.72, 0.06]} />
          </mesh>
        </group>
      );
    case 'computer-station':
      return (
        <group position={[item.x, item.y, item.z]} rotation={[0, item.rotationY, 0]}>
          <mesh position={[0, 0.74, 0]} material={materials.wood} castShadow receiveShadow>
            <boxGeometry args={[1.64, 0.06, 0.8]} />
          </mesh>
          {[
            [-0.72, -0.32],
            [0.72, -0.32],
            [-0.72, 0.32],
            [0.72, 0.32],
          ].map(([lx, lz], idx) => (
            <mesh key={idx} position={[lx, 0.36, lz]} material={materials.metal}>
              <boxGeometry args={[0.06, 0.72, 0.06]} />
            </mesh>
          ))}
          {/* Monitor Stand & Display */}
          <mesh position={[-0.08, 0.84, -0.18]} material={materials.metal}>
            <boxGeometry args={[0.08, 0.16, 0.08]} />
          </mesh>
          <mesh position={[-0.08, 1.08, -0.16]} material={materials.metal}>
            <boxGeometry args={[0.68, 0.42, 0.04]} />
          </mesh>
          <mesh position={[-0.08, 1.08, -0.135]} material={materials.screenBlue}>
            <boxGeometry args={[0.62, 0.35, 0.015]} />
          </mesh>
          {/* Keyboard & CPU Tower */}
          <mesh position={[-0.08, 0.785, 0.12]} material={materials.metal}>
            <boxGeometry args={[0.42, 0.02, 0.16]} />
          </mesh>
          <mesh position={[0.56, 0.96, -0.1]} material={materials.metal}>
            <boxGeometry args={[0.2, 0.4, 0.38]} />
          </mesh>
        </group>
      );
    case 'chair':
      return (
        <group position={[item.x, item.y, item.z]} rotation={[0, item.rotationY, 0]}>
          <mesh position={[0, 0.45, 0]} material={materials.cushion} castShadow>
            <boxGeometry args={[0.46, 0.06, 0.44]} />
          </mesh>
          <mesh position={[0, 0.72, -0.19]} material={materials.cushion} castShadow>
            <boxGeometry args={[0.44, 0.48, 0.06]} />
          </mesh>
          <mesh position={[-0.19, 0.22, -0.18]} material={materials.metal}>
            <boxGeometry args={[0.04, 0.44, 0.04]} />
          </mesh>
          <mesh position={[0.19, 0.22, -0.18]} material={materials.metal}>
            <boxGeometry args={[0.04, 0.44, 0.04]} />
          </mesh>
          <mesh position={[-0.19, 0.22, 0.18]} material={materials.metal}>
            <boxGeometry args={[0.04, 0.44, 0.04]} />
          </mesh>
          <mesh position={[0.19, 0.22, 0.18]} material={materials.metal}>
            <boxGeometry args={[0.04, 0.44, 0.04]} />
          </mesh>
        </group>
      );
    case 'sofa-bench':
      return (
        <group position={[item.x, item.y, item.z]} rotation={[0, item.rotationY, 0]}>
          <mesh position={[0, 0.22, 0]} material={materials.wood} castShadow receiveShadow>
            <boxGeometry args={[2.06, 0.24, 0.78]} />
          </mesh>
          <mesh position={[0, 0.4, 0.03]} material={materials.cushion} castShadow>
            <boxGeometry args={[1.86, 0.16, 0.68]} />
          </mesh>
          <mesh position={[0, 0.66, -0.28]} material={materials.cushion} castShadow>
            <boxGeometry args={[1.88, 0.44, 0.16]} />
          </mesh>
          <mesh position={[-0.96, 0.48, 0]} material={materials.cushion}>
            <boxGeometry args={[0.14, 0.36, 0.74]} />
          </mesh>
          <mesh position={[0.96, 0.48, 0]} material={materials.cushion}>
            <boxGeometry args={[0.14, 0.36, 0.74]} />
          </mesh>
        </group>
      );
    case 'reception-counter':
      return (
        <group position={[item.x, item.y, item.z]} rotation={[0, item.rotationY, 0]}>
          <mesh position={[0, 0.48, 0]} material={materials.trim} castShadow receiveShadow>
            <boxGeometry args={[2.6, 0.96, 0.82]} />
          </mesh>
          <mesh position={[0, 0.98, 0]} material={materials.wood}>
            <boxGeometry args={[2.68, 0.06, 0.88]} />
          </mesh>
          <mesh position={[0, 1.08, 0.22]} material={materials.brass}>
            <boxGeometry args={[2.68, 0.14, 0.34]} />
          </mesh>
          <mesh position={[0, 0.54, 0.42]} material={materials.brass}>
            <boxGeometry args={[2.1, 0.08, 0.03]} />
          </mesh>
        </group>
      );
    case 'medical-bed':
      return (
        <group position={[item.x, item.y, item.z]} rotation={[0, item.rotationY, 0]}>
          <mesh position={[0, 0.34, 0]} material={materials.stainless} castShadow>
            <boxGeometry args={[0.88, 0.1, 1.94]} />
          </mesh>
          {[
            [-0.38, -0.88],
            [0.38, -0.88],
            [-0.38, 0.88],
            [0.38, 0.88],
          ].map(([lx, lz], idx) => (
            <mesh key={idx} position={[lx, 0.18, lz]} material={materials.stainless}>
              <cylinderGeometry args={[0.03, 0.03, 0.36, 8]} />
            </mesh>
          ))}
          <mesh position={[0, 0.46, 0]} material={materials.medicalWhite} castShadow receiveShadow>
            <boxGeometry args={[0.84, 0.16, 1.88]} />
          </mesh>
          <mesh position={[0, 0.56, -0.66]} material={materials.medicalWhite}>
            <boxGeometry args={[0.62, 0.1, 0.36]} />
          </mesh>
          <mesh position={[0, 0.52, 0.38]} material={materials.medicalTeal}>
            <boxGeometry args={[0.86, 0.08, 0.96]} />
          </mesh>
          <mesh position={[0, 0.62, -0.94]} material={materials.stainless}>
            <boxGeometry args={[0.88, 0.48, 0.05]} />
          </mesh>
        </group>
      );
    case 'dining-table':
      return (
        <group position={[item.x, item.y, item.z]} rotation={[0, item.rotationY, 0]}>
          <mesh position={[0, 0.74, 0]} material={materials.wood} castShadow receiveShadow>
            <boxGeometry args={[1.8, 0.06, 0.96]} />
          </mesh>
          <mesh position={[-0.65, 0.36, 0]} material={materials.metal}>
            <boxGeometry args={[0.08, 0.72, 0.62]} />
          </mesh>
          <mesh position={[0.65, 0.36, 0]} material={materials.metal}>
            <boxGeometry args={[0.08, 0.72, 0.62]} />
          </mesh>
          {/* 4 Café Chairs on North & South Sides */}
          {[-0.48, 0.48].map((cx, i) => (
            <group key={`n-${i}`} position={[cx, 0, -0.66]}>
              <mesh position={[0, 0.44, 0]} material={materials.cushion}>
                <boxGeometry args={[0.42, 0.05, 0.42]} />
              </mesh>
              <mesh position={[0, 0.68, -0.18]} material={materials.cushion}>
                <boxGeometry args={[0.4, 0.42, 0.05]} />
              </mesh>
            </group>
          ))}
          {[-0.48, 0.48].map((cx, i) => (
            <group key={`s-${i}`} position={[cx, 0, 0.66]}>
              <mesh position={[0, 0.44, 0]} material={materials.cushion}>
                <boxGeometry args={[0.42, 0.05, 0.42]} />
              </mesh>
              <mesh position={[0, 0.68, 0.18]} material={materials.cushion}>
                <boxGeometry args={[0.4, 0.42, 0.05]} />
              </mesh>
            </group>
          ))}
        </group>
      );
    case 'kitchen-counter':
      return (
        <group position={[item.x, item.y, item.z]} rotation={[0, item.rotationY, 0]}>
          <mesh position={[0, 0.45, 0]} material={materials.trim} castShadow receiveShadow>
            <boxGeometry args={[2.8, 0.9, 0.84]} />
          </mesh>
          <mesh position={[0, 0.93, 0]} material={materials.stainless}>
            <boxGeometry args={[2.88, 0.06, 0.9]} />
          </mesh>
          {/* Food Warming Trays & Sneeze Guard */}
          {[-0.85, 0, 0.85].map((tx, i) => (
            <mesh key={i} position={[tx, 0.98, 0]} material={materials.brass}>
              <boxGeometry args={[0.62, 0.06, 0.48]} />
            </mesh>
          ))}
          <mesh position={[0, 1.24, 0.25]} material={materials.glass}>
            <boxGeometry args={[2.76, 0.5, 0.04]} />
          </mesh>
        </group>
      );
    case 'fellowship-pew':
      return (
        <group position={[item.x, item.y, item.z]} rotation={[0, item.rotationY, 0]}>
          <mesh position={[0, 0.44, 0]} material={materials.pewWood} castShadow receiveShadow>
            <boxGeometry args={[3.4, 0.08, 0.52]} />
          </mesh>
          <mesh position={[0, 0.49, 0]} material={materials.cushion}>
            <boxGeometry args={[3.26, 0.04, 0.44]} />
          </mesh>
          <mesh position={[0, 0.72, 0.22]} material={materials.pewWood} castShadow>
            <boxGeometry args={[3.4, 0.46, 0.08]} />
          </mesh>
          {[-1.56, 0, 1.56].map((px, i) => (
            <mesh key={i} position={[px, 0.22, 0]} material={materials.pewWood}>
              <boxGeometry args={[0.1, 0.44, 0.48]} />
            </mesh>
          ))}
        </group>
      );
    case 'workbench':
      return (
        <group position={[item.x, item.y, item.z]} rotation={[0, item.rotationY, 0]}>
          <mesh position={[0, 0.84, 0]} material={materials.wood} castShadow receiveShadow>
            <boxGeometry args={[2.3, 0.09, 0.9]} />
          </mesh>
          <mesh position={[0, 0.28, 0]} material={materials.metal}>
            <boxGeometry args={[2.1, 0.05, 0.72]} />
          </mesh>
          {[
            [-1.04, -0.36],
            [1.04, -0.36],
            [-1.04, 0.36],
            [1.04, 0.36],
          ].map(([lx, lz], i) => (
            <mesh key={i} position={[lx, 0.41, lz]} material={materials.metal}>
              <boxGeometry args={[0.08, 0.82, 0.08]} />
            </mesh>
          ))}
          {/* Bench Vise Prop */}
          <mesh position={[-0.78, 0.92, 0.42]} material={materials.trim}>
            <boxGeometry args={[0.24, 0.14, 0.16]} />
          </mesh>
        </group>
      );
    case 'workshop-machine':
      return <WorkshopMachineMesh item={item} materials={materials} />;
    case 'storage-rack':
      return (
        <group position={[item.x, item.y, item.z]} rotation={[0, item.rotationY, 0]}>
          {[
            [-0.86, -0.24],
            [0.86, -0.24],
            [-0.86, 0.24],
            [0.86, 0.24],
          ].map(([lx, lz], i) => (
            <mesh key={i} position={[lx, 0.96, lz]} material={materials.metal}>
              <boxGeometry args={[0.06, 1.92, 0.06]} />
            </mesh>
          ))}
          {[0.25, 0.8, 1.35, 1.88].map((sy, idx) => (
            <group key={sy} position={[0, sy, 0]}>
              <mesh material={materials.stainless} castShadow receiveShadow>
                <boxGeometry args={[1.82, 0.05, 0.54]} />
              </mesh>
              {idx < 3 && (
                <>
                  <mesh position={[-0.44, 0.18, 0]} material={materials.wood}>
                    <boxGeometry args={[0.52, 0.28, 0.38]} />
                  </mesh>
                  <mesh
                    position={[0.42, 0.16, 0]}
                    material={idx % 2 === 0 ? materials.trim : materials.crimson}
                  >
                    <boxGeometry args={[0.46, 0.24, 0.36]} />
                  </mesh>
                </>
              )}
            </group>
          ))}
        </group>
      );
    case 'wall-sign':
      return <WallSignMesh item={item} materials={materials} />;
    case 'lectern':
      return (
        <group position={[item.x, item.y, item.z]} rotation={[0, item.rotationY, 0]}>
          <mesh position={[0, 0.54, 0]} material={materials.wood} castShadow>
            <boxGeometry args={[0.76, 1.04, 0.52]} />
          </mesh>
          <mesh position={[0, 0.58, 0.27]} material={materials.trim}>
            <boxGeometry args={[0.6, 0.76, 0.03]} />
          </mesh>
          <mesh position={[0, 1.08, 0]} rotation={[0.15, 0, 0]} material={materials.brass}>
            <boxGeometry args={[0.84, 0.05, 0.58]} />
          </mesh>
        </group>
      );
    case 'whiteboard':
      return (
        <group position={[item.x, item.y, item.z]} rotation={[0, item.rotationY, 0]}>
          <mesh material={materials.metal}>
            <boxGeometry args={[3.2, 1.35, 0.05]} />
          </mesh>
          <mesh position={[0, 0, 0.03]} material={materials.whiteboard}>
            <boxGeometry args={[3.04, 1.2, 0.02]} />
          </mesh>
          <mesh position={[0, -0.66, 0.08]} material={materials.brass}>
            <boxGeometry args={[1.6, 0.04, 0.1]} />
          </mesh>
        </group>
      );
    case 'bookshelf':
      return (
        <group position={[item.x, item.y, item.z]} rotation={[0, item.rotationY, 0]}>
          <mesh position={[0, 1.0, 0]} material={materials.wood} castShadow receiveShadow>
            <boxGeometry args={[1.76, 2.0, 0.48]} />
          </mesh>
          {[0.42, 0.96, 1.48].map((shelfY, idx) => (
            <mesh
              key={shelfY}
              position={[0, shelfY, 0.06]}
              material={materials.bookColors[idx % materials.bookColors.length]}
            >
              <boxGeometry args={[1.54, 0.26, 0.36]} />
            </mesh>
          ))}
        </group>
      );
    case 'bench':
      return (
        <group position={[item.x, item.y, item.z]} rotation={[0, item.rotationY, 0]}>
          <mesh position={[0, 0.44, 0]} material={materials.wood} castShadow>
            <boxGeometry args={[2.1, 0.08, 0.56]} />
          </mesh>
          <mesh position={[-0.86, 0.22, 0]} material={materials.metal}>
            <boxGeometry args={[0.1, 0.44, 0.48]} />
          </mesh>
          <mesh position={[0.86, 0.22, 0]} material={materials.metal}>
            <boxGeometry args={[0.1, 0.44, 0.48]} />
          </mesh>
        </group>
      );
    case 'noticeboard':
      return (
        <group position={[item.x, item.y, item.z]} rotation={[0, item.rotationY, 0]}>
          <mesh material={materials.trim}>
            <boxGeometry args={[2.2, 1.15, 0.06]} />
          </mesh>
          <mesh position={[0, 0, 0.035]} material={materials.cork}>
            <boxGeometry args={[2.02, 0.98, 0.02]} />
          </mesh>
          <mesh position={[-0.52, 0.12, 0.055]} material={materials.whiteboard}>
            <boxGeometry args={[0.42, 0.52, 0.01]} />
          </mesh>
          <mesh position={[0.05, 0.05, 0.055]} material={materials.whiteboard}>
            <boxGeometry args={[0.46, 0.46, 0.01]} />
          </mesh>
          <mesh position={[0.6, -0.05, 0.055]} material={materials.brass}>
            <boxGeometry args={[0.38, 0.44, 0.01]} />
          </mesh>
        </group>
      );
    case 'potted-plant':
      return (
        <group position={[item.x, item.y, item.z]} rotation={[0, item.rotationY, 0]}>
          <mesh position={[0, 0.22, 0]} material={materials.terracotta} castShadow>
            <cylinderGeometry args={[0.24, 0.18, 0.44, 12]} />
          </mesh>
          <mesh position={[0, 0.62, 0]} material={materials.foliage} castShadow>
            <dodecahedronGeometry args={[0.36, 0]} />
          </mesh>
          <mesh position={[0.14, 0.78, 0.1]} material={materials.foliage}>
            <dodecahedronGeometry args={[0.22, 0]} />
          </mesh>
        </group>
      );
    case 'toilet-cubicle':
      return (
        <group position={[item.x, item.y, item.z]} rotation={[0, item.rotationY, 0]}>
          {/* Stall Privacy Side Walls & Rear Panel */}
          <mesh position={[-0.56, 0.96, 0]} material={materials.trim} castShadow>
            <boxGeometry args={[0.06, 1.92, 1.24]} />
          </mesh>
          <mesh position={[0.56, 0.96, 0]} material={materials.trim} castShadow>
            <boxGeometry args={[0.06, 1.92, 1.24]} />
          </mesh>
          <mesh position={[0, 0.96, -0.58]} material={materials.wall}>
            <boxGeometry args={[1.08, 1.92, 0.06]} />
          </mesh>
          {/* Porcelain Cistern & Pedestal Bowl */}
          <mesh position={[0, 0.72, -0.44]} material={materials.medicalWhite} castShadow>
            <boxGeometry args={[0.46, 0.44, 0.22]} />
          </mesh>
          <mesh position={[0, 0.22, -0.06]} material={materials.medicalWhite} castShadow>
            <cylinderGeometry args={[0.2, 0.16, 0.44, 12]} />
          </mesh>
          <mesh position={[0, 0.45, -0.04]} material={materials.medicalWhite}>
            <cylinderGeometry args={[0.22, 0.22, 0.05, 12]} />
          </mesh>
        </group>
      );
    case 'wash-basin':
      return (
        <group position={[item.x, item.y, item.z]} rotation={[0, item.rotationY, 0]}>
          {/* Vanity Cabinet & Ceramic Top */}
          <mesh position={[0, 0.42, 0]} material={materials.trim} castShadow receiveShadow>
            <boxGeometry args={[1.64, 0.84, 0.56]} />
          </mesh>
          <mesh position={[0, 0.87, 0]} material={materials.medicalWhite}>
            <boxGeometry args={[1.7, 0.06, 0.6]} />
          </mesh>
          {/* Twin Sink Basins & Chrome Faucets */}
          {[-0.44, 0.44].map((sx) => (
            <group key={sx} position={[sx, 0.91, 0]}>
              <mesh material={materials.stainless}>
                <boxGeometry args={[0.46, 0.04, 0.36]} />
              </mesh>
              <mesh position={[0, 0.09, -0.2]} material={materials.stainless}>
                <boxGeometry args={[0.06, 0.16, 0.08]} />
              </mesh>
            </group>
          ))}
          {/* Mirror Panel */}
          <mesh position={[0, 1.48, -0.24]} material={materials.glass}>
            <boxGeometry args={[1.52, 0.74, 0.04]} />
          </mesh>
        </group>
      );
    case 'construction-barrier':
      return (
        <group position={[item.x, item.y, item.z]} rotation={[0, item.rotationY, 0]}>
          {/* Yellow/Black Hazard Sawhorse Barricade */}
          <mesh position={[0, 0.86, 0]} material={materials.safetyYellow} castShadow>
            <boxGeometry args={[2.1, 0.24, 0.1]} />
          </mesh>
          <mesh position={[-0.6, 0.86, 0.055]} material={materials.metal}>
            <boxGeometry args={[0.26, 0.24, 0.02]} />
          </mesh>
          <mesh position={[0.0, 0.86, 0.055]} material={materials.metal}>
            <boxGeometry args={[0.26, 0.24, 0.02]} />
          </mesh>
          <mesh position={[0.6, 0.86, 0.055]} material={materials.metal}>
            <boxGeometry args={[0.26, 0.24, 0.02]} />
          </mesh>
          <mesh position={[-0.86, 0.44, 0]} material={materials.metal}>
            <boxGeometry args={[0.08, 0.88, 0.46]} />
          </mesh>
          <mesh position={[0.86, 0.44, 0]} material={materials.metal}>
            <boxGeometry args={[0.08, 0.88, 0.46]} />
          </mesh>
          {/* Safety Cones & Stacked Construction Timber */}
          {[-1.25, 1.25].map((cx, i) => (
            <group key={i} position={[cx, 0, 0.28]}>
              <mesh position={[0, 0.03, 0]} material={materials.metal}>
                <boxGeometry args={[0.32, 0.06, 0.32]} />
              </mesh>
              <mesh position={[0, 0.28, 0]} material={materials.crimson} castShadow>
                <coneGeometry args={[0.14, 0.48, 10]} />
              </mesh>
              <mesh position={[0, 0.32, 0]} material={materials.safetyYellow}>
                <cylinderGeometry args={[0.075, 0.105, 0.1, 10]} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 0.16, -0.35]} material={materials.wood} castShadow>
            <boxGeometry args={[1.5, 0.32, 0.42]} />
          </mesh>
        </group>
      );
    case 'student-desk-set':
      return (
        <group position={[item.x, item.y, item.z]} rotation={[0, item.rotationY, 0]}>
          {/* Desk Tabletop & Book Shelf */}
          <mesh position={[0, 0.74, -0.18]} material={materials.wood} castShadow receiveShadow>
            <boxGeometry args={[1.32, 0.05, 0.54]} />
          </mesh>
          <mesh position={[0, 0.58, -0.18]} material={materials.metal}>
            <boxGeometry args={[1.22, 0.03, 0.44]} />
          </mesh>
          {[-0.58, 0.58].map((lx) => (
            <group key={lx}>
              <mesh position={[lx, 0.36, -0.4]} material={materials.metal}>
                <boxGeometry args={[0.045, 0.72, 0.045]} />
              </mesh>
              <mesh position={[lx, 0.36, 0.04]} material={materials.metal}>
                <boxGeometry args={[0.045, 0.72, 0.045]} />
              </mesh>
            </group>
          ))}
          {/* Attached Classroom Chairs (2 per bench) */}
          {[-0.34, 0.34].map((cx) => (
            <group key={cx} position={[cx, 0, 0.32]}>
              <mesh position={[0, 0.44, 0]} material={materials.cushion} castShadow>
                <boxGeometry args={[0.42, 0.05, 0.4]} />
              </mesh>
              <mesh position={[0, 0.68, 0.17]} material={materials.cushion} castShadow>
                <boxGeometry args={[0.4, 0.4, 0.05]} />
              </mesh>
              <mesh position={[0, 0.22, 0]} material={materials.metal}>
                <boxGeometry args={[0.36, 0.44, 0.05]} />
              </mesh>
            </group>
          ))}
        </group>
      );
    case 'chemistry-bench':
      return (
        <group position={[item.x, item.y, item.z]} rotation={[0, item.rotationY, 0]}>
          {/* Dark Acid-Resistant Chemical Top & Base Cabinets */}
          <mesh position={[0, 0.44, 0]} material={materials.trim} castShadow receiveShadow>
            <boxGeometry args={[2.38, 0.88, 1.02]} />
          </mesh>
          <mesh position={[0, 0.91, 0]} material={materials.metal} castShadow>
            <boxGeometry args={[2.46, 0.06, 1.1]} />
          </mesh>
          {/* Central Reagent Rack */}
          <mesh position={[0, 1.24, 0]} material={materials.stainless}>
            <boxGeometry args={[2.1, 0.05, 0.26]} />
          </mesh>
          <mesh position={[-0.95, 1.08, 0]} material={materials.metal}>
            <boxGeometry args={[0.06, 0.32, 0.16]} />
          </mesh>
          <mesh position={[0.95, 1.08, 0]} material={materials.metal}>
            <boxGeometry args={[0.06, 0.32, 0.16]} />
          </mesh>
          {/* Twin Stainless Lab Sinks & Gooseneck Faucets */}
          {[-0.65, 0.65].map((sx) => (
            <group key={sx} position={[sx, 0.95, -0.32]}>
              <mesh material={materials.stainless}>
                <boxGeometry args={[0.42, 0.04, 0.32]} />
              </mesh>
              <mesh position={[0, 0.14, 0.12]} material={materials.brass}>
                <cylinderGeometry args={[0.025, 0.025, 0.26, 8]} />
              </mesh>
            </group>
          ))}
          {/* Colored Reagent Flasks & Glassware */}
          <mesh position={[-0.4, 1.38, 0]} material={materials.screenBlue}>
            <cylinderGeometry args={[0.06, 0.09, 0.22, 10]} />
          </mesh>
          <mesh position={[0.0, 1.38, 0]} material={materials.crimson}>
            <cylinderGeometry args={[0.05, 0.08, 0.2, 10]} />
          </mesh>
          <mesh position={[0.4, 1.38, 0]} material={materials.safetyYellow}>
            <cylinderGeometry args={[0.06, 0.09, 0.22, 10]} />
          </mesh>
        </group>
      );
    case 'physics-bench':
      return (
        <group position={[item.x, item.y, item.z]} rotation={[0, item.rotationY, 0]}>
          <mesh position={[0, 0.84, 0]} material={materials.wood} castShadow receiveShadow>
            <boxGeometry args={[2.3, 0.08, 0.98]} />
          </mesh>
          {[
            [-1.04, -0.38],
            [1.04, -0.38],
            [-1.04, 0.38],
            [1.04, 0.38],
          ].map(([lx, lz], i) => (
            <mesh key={i} position={[lx, 0.41, lz]} material={materials.metal}>
              <boxGeometry args={[0.08, 0.82, 0.08]} />
            </mesh>
          ))}
          {/* Optical Rail & Lens Carriages */}
          <mesh position={[-0.3, 0.92, 0.16]} material={materials.stainless}>
            <boxGeometry args={[1.35, 0.06, 0.12]} />
          </mesh>
          {[-0.65, -0.15, 0.25].map((ox) => (
            <mesh key={ox} position={[ox, 1.05, 0.16]} material={materials.glass}>
              <cylinderGeometry args={[0.08, 0.08, 0.03, 12]} />
            </mesh>
          ))}
          {/* Bench Power Supply & Oscilloscope Rig */}
          <mesh position={[0.68, 1.04, -0.2]} material={materials.metal} castShadow>
            <boxGeometry args={[0.52, 0.32, 0.34]} />
          </mesh>
          <mesh position={[0.68, 1.06, -0.02]} material={materials.screenBlue}>
            <boxGeometry args={[0.36, 0.2, 0.02]} />
          </mesh>
        </group>
      );
    case 'nursing-trolley':
      return (
        <group position={[item.x, item.y, item.z]} rotation={[0, item.rotationY, 0]}>
          <mesh position={[0, 0.44, 0]} material={materials.stainless} castShadow>
            <boxGeometry args={[0.78, 0.04, 0.5]} />
          </mesh>
          <mesh position={[0, 0.86, 0]} material={materials.stainless} castShadow>
            <boxGeometry args={[0.78, 0.04, 0.5]} />
          </mesh>
          {[
            [-0.36, -0.22],
            [0.36, -0.22],
            [-0.36, 0.22],
            [0.36, 0.22],
          ].map(([lx, lz], i) => (
            <mesh key={i} position={[lx, 0.44, lz]} material={materials.stainless}>
              <cylinderGeometry args={[0.02, 0.02, 0.88, 8]} />
            </mesh>
          ))}
          {/* Sterile Tray & Medical Kit */}
          <mesh position={[-0.14, 0.94, 0]} material={materials.medicalWhite}>
            <boxGeometry args={[0.32, 0.12, 0.24]} />
          </mesh>
          <mesh position={[0.2, 0.94, 0]} material={materials.medicalTeal}>
            <boxGeometry args={[0.24, 0.14, 0.22]} />
          </mesh>
        </group>
      );
    case 'nursing-mannequin':
      return (
        <group position={[item.x, item.y, item.z]} rotation={[0, item.rotationY, 0]}>
          {/* Clinical Examination Plinth */}
          <mesh position={[0, 0.34, 0]} material={materials.stainless} castShadow>
            <boxGeometry args={[0.84, 0.08, 1.88]} />
          </mesh>
          {[
            [-0.36, -0.82],
            [0.36, -0.82],
            [-0.36, 0.82],
            [0.36, 0.82],
          ].map(([lx, lz], idx) => (
            <mesh key={idx} position={[lx, 0.17, lz]} material={materials.stainless}>
              <cylinderGeometry args={[0.028, 0.028, 0.34, 8]} />
            </mesh>
          ))}
          <mesh position={[0, 0.44, 0]} material={materials.medicalWhite} castShadow>
            <boxGeometry args={[0.8, 0.14, 1.82]} />
          </mesh>
          {/* Anatomical Training Mannequin (Head, Torso, Pelvis, Limbs & Medical Gown) */}
          <mesh position={[0, 0.62, -0.58]} material={materials.stair} castShadow>
            <sphereGeometry args={[0.13, 12, 10]} />
          </mesh>
          <mesh position={[0, 0.6, -0.44]} material={materials.stair}>
            <cylinderGeometry args={[0.055, 0.06, 0.12, 8]} />
          </mesh>
          <mesh position={[0, 0.6, -0.14]} material={materials.medicalTeal} castShadow>
            <boxGeometry args={[0.38, 0.18, 0.54]} />
          </mesh>
          <mesh position={[-0.24, 0.56, -0.12]} material={materials.stair}>
            <boxGeometry args={[0.09, 0.09, 0.48]} />
          </mesh>
          <mesh position={[0.24, 0.56, -0.12]} material={materials.stair}>
            <boxGeometry args={[0.09, 0.09, 0.48]} />
          </mesh>
          <mesh position={[-0.1, 0.56, 0.44]} material={materials.medicalWhite}>
            <boxGeometry args={[0.14, 0.12, 0.64]} />
          </mesh>
          <mesh position={[0.1, 0.56, 0.44]} material={materials.medicalWhite}>
            <boxGeometry args={[0.14, 0.12, 0.64]} />
          </mesh>
          {/* IV Drip Stand & Vital Signs Monitor beside Head of Bed */}
          <mesh position={[0.56, 0.88, -0.62]} material={materials.stainless}>
            <cylinderGeometry args={[0.02, 0.02, 1.76, 8]} />
          </mesh>
          <mesh position={[0.56, 0.03, -0.62]} material={materials.metal}>
            <cylinderGeometry args={[0.2, 0.2, 0.05, 10]} />
          </mesh>
          <mesh position={[0.48, 1.56, -0.62]} material={materials.glass}>
            <boxGeometry args={[0.12, 0.22, 0.08]} />
          </mesh>
          <mesh position={[-0.58, 1.06, -0.58]} material={materials.metal}>
            <boxGeometry args={[0.32, 0.26, 0.14]} />
          </mesh>
          <mesh position={[-0.58, 1.06, -0.5]} material={materials.screenBlue}>
            <boxGeometry args={[0.26, 0.18, 0.02]} />
          </mesh>
        </group>
      );
  }
}

function CourtyardSkyDome() {
  const skyMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color('#69B0DF') },
        bottomColor: { value: new THREE.Color('#CBE5F4') },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec3 vWorldPos;
        void main() {
          float h = clamp(normalize(vWorldPos).y, 0.0, 1.0);
          gl_FragColor = vec4(mix(bottomColor, topColor, pow(h, 0.55)), 1.0);
        }
      `,
    });
  }, []);

  useEffect(() => {
    return () => {
      skyMat.dispose();
    };
  }, [skyMat]);

  return (
    <group>
      <color attach="background" args={['#9BC8E4']} />
      <mesh position={[0, 6, 0]} material={skyMat} renderOrder={-10}>
        <sphereGeometry args={[150, 20, 14]} />
      </mesh>
    </group>
  );
}

interface BurglaryBarTransform {
  x: number;
  y: number;
  z: number;
  height: number;
  thickX: number;
  thickZ: number;
}

function BatchedBurglaryBars({
  bars,
  material,
}: {
  bars: BurglaryBarTransform[];
  material: THREE.Material;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || bars.length === 0) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < bars.length; i++) {
      const b = bars[i];
      dummy.position.set(b.x, b.y, b.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(b.thickX, b.height, b.thickZ);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [bars]);

  if (bars.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, bars.length]} material={material}>
      <boxGeometry args={[1, 1, 1]} />
    </instancedMesh>
  );
}

export function InteriorEnvironment({
  interior,
  doorStates,
  graphicsQuality,
  isSoftwareGl,
}: InteriorEnvironmentProps) {
  const { gl } = useThree();

  const materials = useMemo<SharedInteriorMaterials>(() => {
    const maxAniso = Math.min(4, gl.capabilities.getMaxAnisotropy?.() || 2);
    const terrazzoTex = createTerrazzoTileTexture(maxAniso);

    return {
      terrazzoTex,
      floor: new THREE.MeshStandardMaterial({
        map: terrazzoTex,
        roughness: 0.62,
        metalness: 0.04,
      }),
      ceiling: new THREE.MeshStandardMaterial({
        color: '#EAE6DD',
        roughness: 0.92,
      }),
      wall: new THREE.MeshStandardMaterial({
        color: '#F3ECE0',
        roughness: 0.86,
      }),
      trim: new THREE.MeshStandardMaterial({
        color: '#0D3B2E',
        roughness: 0.6,
      }),
      brass: new THREE.MeshStandardMaterial({
        color: '#D4A024',
        metalness: 0.55,
        roughness: 0.35,
      }),
      stair: new THREE.MeshStandardMaterial({
        color: '#D5CBB8',
        roughness: 0.72,
      }),
      railing: new THREE.MeshStandardMaterial({
        color: '#19352B',
        metalness: 0.42,
        roughness: 0.45,
      }),
      roomDoor: new THREE.MeshStandardMaterial({
        color: '#633822',
        roughness: 0.52,
      }),
      exitDoor: new THREE.MeshStandardMaterial({
        color: '#0D3B2E',
        roughness: 0.46,
      }),
      wood: new THREE.MeshStandardMaterial({
        color: '#7B4C2B',
        roughness: 0.58,
      }),
      pewWood: new THREE.MeshStandardMaterial({
        color: '#6B3E22',
        roughness: 0.54,
      }),
      metal: new THREE.MeshStandardMaterial({
        color: '#2B3135',
        metalness: 0.45,
        roughness: 0.5,
      }),
      stainless: new THREE.MeshStandardMaterial({
        color: '#B2BBC2',
        metalness: 0.62,
        roughness: 0.32,
      }),
      cushion: new THREE.MeshStandardMaterial({
        color: '#154738',
        roughness: 0.78,
      }),
      whiteboard: new THREE.MeshStandardMaterial({
        color: '#F8F9FA',
        roughness: 0.32,
      }),
      cork: new THREE.MeshStandardMaterial({
        color: '#B88454',
        roughness: 0.9,
      }),
      terracotta: new THREE.MeshStandardMaterial({
        color: '#B55B3B',
        roughness: 0.8,
      }),
      foliage: new THREE.MeshStandardMaterial({
        color: '#2D6B3C',
        roughness: 0.82,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: '#B8DCF0',
        emissive: '#78B9DC',
        emissiveIntensity: 0.28,
        roughness: 0.14,
        metalness: 0.1,
      }),
      screenBlue: new THREE.MeshStandardMaterial({
        color: '#1A4E7A',
        emissive: '#2979B8',
        emissiveIntensity: 0.36,
        roughness: 0.22,
      }),
      medicalWhite: new THREE.MeshStandardMaterial({
        color: '#F1F5F8',
        roughness: 0.36,
      }),
      medicalTeal: new THREE.MeshStandardMaterial({
        color: '#197569',
        roughness: 0.66,
      }),
      safetyYellow: new THREE.MeshStandardMaterial({
        color: '#E2AC2B',
        roughness: 0.46,
      }),
      crimson: new THREE.MeshStandardMaterial({
        color: '#A62B2B',
        roughness: 0.54,
      }),
      battenGlow: new THREE.MeshBasicMaterial({
        color: '#FFFDF5',
      }),
      bookColors: [
        new THREE.MeshStandardMaterial({ color: '#0D3B2E', roughness: 0.7 }),
        new THREE.MeshStandardMaterial({ color: '#8C2D2D', roughness: 0.7 }),
        new THREE.MeshStandardMaterial({ color: '#1F497D', roughness: 0.7 }),
      ],
    };
  }, [gl]);

  useEffect(() => {
    return () => {
      materials.terrazzoTex.dispose();
      materials.floor.dispose();
      materials.ceiling.dispose();
      materials.wall.dispose();
      materials.trim.dispose();
      materials.brass.dispose();
      materials.stair.dispose();
      materials.railing.dispose();
      materials.roomDoor.dispose();
      materials.exitDoor.dispose();
      materials.wood.dispose();
      materials.pewWood.dispose();
      materials.metal.dispose();
      materials.stainless.dispose();
      materials.cushion.dispose();
      materials.whiteboard.dispose();
      materials.cork.dispose();
      materials.terracotta.dispose();
      materials.foliage.dispose();
      materials.glass.dispose();
      materials.screenBlue.dispose();
      materials.medicalWhite.dispose();
      materials.medicalTeal.dispose();
      materials.safetyYellow.dispose();
      materials.crimson.dispose();
      materials.battenGlow.dispose();
      for (const m of materials.bookColors) {
        m.dispose();
      }
    };
  }, [materials]);

  const customSurfaceMaterials = useMemo(() => {
    const map = new Map<string, THREE.MeshStandardMaterial>();
    for (const surface of interior.surfaces) {
      if (surface.color && !map.has(surface.color)) {
        map.set(
          surface.color,
          new THREE.MeshStandardMaterial({
            color: surface.color,
            roughness: 0.9,
          })
        );
      }
    }
    return map;
  }, [interior.surfaces]);

  useEffect(() => {
    return () => {
      for (const m of customSurfaceMaterials.values()) {
        m.dispose();
      }
    };
  }, [customSurfaceMaterials]);

  const pointLightsEnabled = graphicsQuality !== 'low' && !isSoftwareGl;
  const centerX = (interior.bounds.minX + interior.bounds.maxX) / 2;

  const { solidSurfaces, burglaryRailings, burglaryBars } = useMemo(() => {
    const solids: InteriorSurfaceSpec[] = [];
    const rails: InteriorSurfaceSpec[] = [];
    const bars: BurglaryBarTransform[] = [];

    for (const surface of interior.surfaces) {
      if (surface.role === 'railing' && surface.railingStyle === 'burglary') {
        rails.push(surface);
        const alongX = surface.width >= surface.depth;
        const length = alongX ? surface.width : surface.depth;
        const barSpan = Math.max(0.4, length - 0.16);
        const barCount = Math.max(2, Math.floor(barSpan / 0.26) + 1);
        const step = barCount > 1 ? barSpan / (barCount - 1) : 0;
        const startOffset = -barSpan / 2;
        const barH = surface.height - 0.1;

        for (let i = 0; i < barCount; i++) {
          const offset = startOffset + i * step;
          const isPost = i === 0 || i === barCount - 1 || i % 8 === 0;
          const t = isPost ? 0.048 : 0.022;
          bars.push({
            x: alongX ? surface.x + offset : surface.x,
            y: surface.y,
            z: alongX ? surface.z : surface.z + offset,
            height: isPost ? surface.height - 0.02 : barH,
            thickX: t,
            thickZ: t,
          });
        }
      } else {
        solids.push(surface);
      }
    }

    return { solidSurfaces: solids, burglaryRailings: rails, burglaryBars: bars };
  }, [interior.surfaces]);

  return (
    <group name={`interior-${interior.id}`}>
      {/* Open-to-sky courtyard sky dome or gentle indoor ambient fill */}
      {interior.hasOpenCourtyard && <CourtyardSkyDome />}
      <ambientLight intensity={interior.hasOpenCourtyard ? 0.56 : 0.44} color="#FFF9EE" />

      {/* Architectural Floors, Ceilings, Walls & Trim */}
      {solidSurfaces.map((surface) => {
        const customMat = surface.color ? customSurfaceMaterials.get(surface.color) : undefined;
        const mat =
          customMat ??
          (surface.role === 'floor'
            ? materials.floor
            : surface.role === 'ceiling'
              ? materials.ceiling
              : surface.role === 'trim'
                ? materials.trim
                : surface.role === 'railing'
                  ? materials.railing
                  : materials.wall);

        return (
          <group
            key={surface.id}
            position={[surface.x, surface.y, surface.z]}
            rotation={[0, surface.rotationY ?? 0, 0]}
          >
            <mesh
              material={mat}
              receiveShadow={surface.role === 'floor' || surface.role === 'wall'}
              castShadow={surface.role === 'wall'}
            >
              <boxGeometry args={[surface.width, surface.height, surface.depth]} />
            </mesh>
            {surface.role === 'floor' && surface.y > 0.5 && (
              <mesh
                position={[0, -surface.height / 2 - 0.01, 0]}
                material={materials.ceiling}
              >
                <boxGeometry args={[surface.width, 0.02, surface.depth]} />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Open Waist-Height Metal Burglary Railings overlooking the Central Courtyard */}
      {burglaryRailings.map((rail) => {
        const alongX = rail.width >= rail.depth;
        const rx = alongX ? rail.width : 0.065;
        const rz = alongX ? 0.065 : rail.depth;
        const midRx = alongX ? rail.width : 0.04;
        const midRz = alongX ? 0.04 : rail.depth;
        return (
          <group key={rail.id}>
            {/* Top handrail bar */}
            <mesh position={[rail.x, rail.y + rail.height / 2 - 0.03, rail.z]} material={materials.railing}>
              <boxGeometry args={[rx, 0.055, rz]} />
            </mesh>
            {/* Mid horizontal security tie-bar */}
            <mesh position={[rail.x, rail.y - 0.04, rail.z]} material={materials.railing}>
              <boxGeometry args={[midRx, 0.032, midRz]} />
            </mesh>
            {/* Bottom base rail */}
            <mesh position={[rail.x, rail.y - rail.height / 2 + 0.05, rail.z]} material={materials.railing}>
              <boxGeometry args={[rx, 0.045, rz]} />
            </mesh>
          </group>
        );
      })}
      <BatchedBurglaryBars bars={burglaryBars} material={materials.railing} />

      {/* Emerald Skirting Baseboard Trim along perimeter walls */}
      <mesh
        position={[centerX, 0.09, interior.bounds.minZ + 0.02]}
        material={materials.trim}
      >
        <boxGeometry
          args={[interior.bounds.maxX - interior.bounds.minX, 0.18, 0.04]}
        />
      </mesh>

      {/* Windows */}
      {interior.windows.map((win) => (
        <group key={win.id} position={[win.x, win.y, win.z]} rotation={[0, win.rotationY, 0]}>
          <mesh material={materials.trim}>
            <boxGeometry args={[win.width + 0.16, win.height + 0.16, 0.08]} />
          </mesh>
          <mesh position={[0, 0, 0.02]} material={materials.glass}>
            <boxGeometry args={[win.width, win.height, 0.04]} />
          </mesh>
          <mesh position={[0, 0, 0.05]} material={materials.trim}>
            <boxGeometry args={[0.06, win.height, 0.03]} />
          </mesh>
          <mesh position={[0, 0, 0.05]} material={materials.trim}>
            <boxGeometry args={[win.width, 0.06, 0.03]} />
          </mesh>
        </group>
      ))}

      {/* Staircases & Stairwell Railings */}
      {interior.stairs.map((stair) => (
        <group key={stair.id}>
          {stair.treads.map((tread, idx) => (
            <mesh
              key={`${stair.id}-tread-${idx}`}
              position={[tread.x, tread.y, tread.z]}
              rotation={[0, tread.rotationY ?? 0, 0]}
              material={materials.stair}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[tread.width, tread.height, tread.depth]} />
            </mesh>
          ))}
          {stair.railings.map((rail) => (
            <group
              key={rail.id}
              position={[rail.x, rail.y, rail.z]}
              rotation={[0, rail.rotationY ?? 0, 0]}
            >
              {rail.role === 'railing' ? (
                <>
                  {/* Top brass handrail cap */}
                  <mesh position={[0, rail.height / 2 - 0.04, 0]} material={materials.brass}>
                    <boxGeometry args={[rail.width + 0.04, 0.06, rail.depth]} />
                  </mesh>
                  {/* Balustrade panel */}
                  <mesh position={[0, -0.04, 0]} material={materials.railing} castShadow>
                    <boxGeometry args={[rail.width, rail.height - 0.08, rail.depth]} />
                  </mesh>
                </>
              ) : (
                <mesh material={materials.wall} castShadow receiveShadow>
                  <boxGeometry args={[rail.width, rail.height, rail.depth]} />
                </mesh>
              )}
            </group>
          ))}
        </group>
      ))}

      {/* Hinged Interactive Doors */}
      {interior.doors.map((door) => (
        <DoorMesh
          key={door.id}
          door={door}
          interiorName={interior.name}
          isOpen={doorStates[door.id] ?? door.defaultOpen}
          materials={materials}
        />
      ))}

      {/* Reusable Classroom / Office / Lab / Clinic / Workshop Furniture */}
      {interior.furniture.map((item) => (
        <FurnitureMesh key={item.id} item={item} materials={materials} />
      ))}

      {/* Ceiling LED Battens & Budgeted Hardware Point Lights */}
      {interior.lights.map((light) => (
        <group key={light.id} position={[light.x, light.y, light.z]}>
          <mesh position={[0, 0.14, 0]} material={materials.metal}>
            <boxGeometry args={[1.4, 0.06, 0.24]} />
          </mesh>
          <mesh position={[0, 0.1, 0]} material={materials.battenGlow}>
            <boxGeometry args={[1.32, 0.04, 0.18]} />
          </mesh>
          {pointLightsEnabled && light.castPointLight !== false && (
            <pointLight
              color={light.color}
              intensity={light.intensity * 1.4}
              distance={light.distance}
              decay={1.4}
            />
          )}
        </group>
      ))}
    </group>
  );
}
