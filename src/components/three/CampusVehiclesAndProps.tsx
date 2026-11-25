import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * White University Coaster Bus (pure white body, tinted side/front glass, emerald & gold trim).
 * Local origin at ground center (y = 0); front faces +X when rotationY = 0.
 */
function WhiteCoasterBus({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Dark Lower Chassis & Bumpers */}
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.9, 0.34, 2.18]} />
        <meshStandardMaterial color="#23292D" roughness={0.78} metalness={0.22} />
      </mesh>
      {/* Pure White Main Passenger Body */}
      <mesh position={[-0.25, 1.48, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.4, 1.88, 2.24]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.34} metalness={0.08} />
      </mesh>
      {/* Sloped Front Bus Nose & Windshield Fairing */}
      <mesh position={[3.05, 1.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.72, 1.28, 2.18]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.34} metalness={0.08} />
      </mesh>
      <mesh position={[2.95, 1.98, 0]} rotation={[0, 0, -0.22]} castShadow>
        <boxGeometry args={[0.68, 0.64, 2.16]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.34} metalness={0.08} />
      </mesh>
      {/* University Emerald & Gold Waist Trim Stripe */}
      <mesh position={[-0.08, 1.02, 0]}>
        <boxGeometry args={[6.82, 0.16, 2.27]} />
        <meshStandardMaterial color="#0D5C43" roughness={0.45} />
      </mesh>
      <mesh position={[-0.08, 1.13, 0]}>
        <boxGeometry args={[6.82, 0.06, 2.28]} />
        <meshStandardMaterial color="#D4A024" roughness={0.38} metalness={0.35} />
      </mesh>
      {/* Panoramic Tinted Side Windows */}
      {[-1.13, 1.13].map((sz, idx) => (
        <mesh key={idx} position={[-0.2, 1.82, sz]}>
          <boxGeometry args={[5.6, 0.72, 0.03]} />
          <meshStandardMaterial color="#182C38" roughness={0.14} metalness={0.55} />
        </mesh>
      ))}
      {/* Front Windshield */}
      <mesh position={[3.26, 1.86, 0]} rotation={[0, 0, -0.18]}>
        <boxGeometry args={[0.06, 0.78, 1.96]} />
        <meshStandardMaterial color="#182C38" roughness={0.14} metalness={0.55} />
      </mesh>
      {/* Roof AC Pod */}
      <mesh position={[-0.3, 2.52, 0]} castShadow>
        <boxGeometry args={[2.1, 0.2, 1.35]} />
        <meshStandardMaterial color="#E6ECF0" roughness={0.42} />
      </mesh>
      {/* Headlights */}
      {[-0.78, 0.78].map((lz, idx) => (
        <mesh key={idx} position={[3.42, 0.74, lz]}>
          <boxGeometry args={[0.05, 0.2, 0.34]} />
          <meshStandardMaterial color="#FFF7D6" emissive="#F6D87E" emissiveIntensity={0.35} roughness={0.2} />
        </mesh>
      ))}
      {/* 4 Bus Wheels */}
      {[
        [-2.05, -1.04],
        [-2.05, 1.04],
        [2.05, -1.04],
        [2.05, 1.04],
      ].map(([wx, wz], idx) => (
        <mesh key={idx} position={[wx, 0.42, wz]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.28, 14]} />
          <meshStandardMaterial color="#1D2226" roughness={0.86} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Ordinary Staff Car (sedan or compact SUV).
 */
function StaffCar({
  position,
  rotationY = 0,
  color = '#3C5468',
  isSuv = false,
}: {
  position: [number, number, number];
  rotationY?: number;
  color?: string;
  isSuv?: boolean;
}) {
  const cabinLen = isSuv ? 2.45 : 1.95;
  const cabinX = isSuv ? -0.35 : -0.18;
  const bodyH = isSuv ? 0.64 : 0.54;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.15, 0.22, 1.72]} />
        <meshStandardMaterial color="#23282C" roughness={0.78} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.38 + bodyH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.2, bodyH, 1.76]} />
        <meshStandardMaterial color={color} roughness={0.36} metalness={0.28} />
      </mesh>
      <mesh position={[cabinX, 0.38 + bodyH + 0.26, 0]} castShadow receiveShadow>
        <boxGeometry args={[cabinLen, 0.54, 1.54]} />
        <meshStandardMaterial color={color} roughness={0.36} metalness={0.28} />
      </mesh>
      {/* Tinted Cabin Glazing */}
      <mesh position={[cabinX, 0.38 + bodyH + 0.26, 0]}>
        <boxGeometry args={[cabinLen - 0.16, 0.4, 1.58]} />
        <meshStandardMaterial color="#192D38" roughness={0.14} metalness={0.55} />
      </mesh>
      <mesh position={[cabinX + cabinLen / 2 + 0.02, 0.38 + bodyH + 0.23, 0]}>
        <boxGeometry args={[0.05, 0.42, 1.4]} />
        <meshStandardMaterial color="#192D38" roughness={0.14} metalness={0.55} />
      </mesh>
      {[
        [-1.32, -0.82],
        [-1.32, 0.82],
        [1.32, -0.82],
        [1.32, 0.82],
      ].map(([wx, wz], idx) => (
        <mesh key={idx} position={[wx, 0.3, wz]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.22, 12]} />
          <meshStandardMaterial color="#1C2024" roughness={0.86} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * University Grounds Tractor (green/yellow utility tractor with large lugged rear wheels & ROPS canopy).
 */
function CampusTractor({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Heavy Chassis Frame */}
      <mesh position={[0, 0.68, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.3, 0.34, 1.15]} />
        <meshStandardMaterial color="#232B26" roughness={0.68} metalness={0.38} />
      </mesh>
      {/* Engine Hood */}
      <mesh position={[0.72, 1.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.65, 0.72, 0.96]} />
        <meshStandardMaterial color="#1E6B3A" roughness={0.42} metalness={0.2} />
      </mesh>
      {/* Front Grille & Exhaust Stack */}
      <mesh position={[1.56, 1.18, 0]}>
        <boxGeometry args={[0.06, 0.62, 0.86]} />
        <meshStandardMaterial color="#E2AC2B" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0.95, 1.88, -0.32]} castShadow>
        <cylinderGeometry args={[0.06, 0.07, 0.78, 8]} />
        <meshStandardMaterial color="#2E3538" roughness={0.45} metalness={0.6} />
      </mesh>
      {/* Operator Seat & Rollbar Canopy */}
      <mesh position={[-0.72, 1.14, 0]} castShadow>
        <boxGeometry args={[0.62, 0.44, 0.68]} />
        <meshStandardMaterial color="#1F2426" roughness={0.78} />
      </mesh>
      <mesh position={[-1.12, 1.65, -0.58]} castShadow>
        <boxGeometry args={[0.1, 1.4, 0.1]} />
        <meshStandardMaterial color="#252C29" roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[-1.12, 1.65, 0.58]} castShadow>
        <boxGeometry args={[0.1, 1.4, 0.1]} />
        <meshStandardMaterial color="#252C29" roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[-0.78, 2.38, 0]} castShadow>
        <boxGeometry args={[1.38, 0.1, 1.38]} />
        <meshStandardMaterial color="#1E6B3A" roughness={0.48} />
      </mesh>
      {/* Large Rear Wheels (with Yellow Rims) */}
      {[-0.86, 0.86].map((wz, idx) => (
        <group key={`rear-${idx}`} position={[-0.95, 0.76, wz]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.76, 0.76, 0.42, 16]} />
            <meshStandardMaterial color="#1A1E21" roughness={0.88} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.44, 12]} />
            <meshStandardMaterial color="#E2AC2B" roughness={0.42} metalness={0.25} />
          </mesh>
        </group>
      ))}
      {/* Smaller Front Steerable Wheels */}
      {[-0.74, 0.74].map((wz, idx) => (
        <group key={`front-${idx}`} position={[1.15, 0.44, wz]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.44, 0.44, 0.26, 14]} />
            <meshStandardMaterial color="#1A1E21" roughness={0.88} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.24, 0.24, 0.28, 10]} />
            <meshStandardMaterial color="#E2AC2B" roughness={0.42} metalness={0.25} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Campus Emergency Ambulance (white + red medical livery + roof lightbar).
 */
function CampusAmbulance({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.8, 0.35, 2.05]} />
        <meshStandardMaterial color="#252B30" roughness={0.75} metalness={0.25} />
      </mesh>
      <mesh position={[0.75, 1.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 1.55, 2.08]} />
        <meshStandardMaterial color="#F4F6F8" roughness={0.38} metalness={0.08} />
      </mesh>
      <mesh position={[0.75, 1.15, 0]}>
        <boxGeometry args={[3.24, 0.24, 2.11]} />
        <meshStandardMaterial color="#C62828" roughness={0.45} />
      </mesh>
      {[-1.07, 1.07].map((sz, idx) => (
        <group key={idx} position={[0.75, 1.62, sz]}>
          <mesh>
            <boxGeometry args={[0.56, 0.16, 0.03]} />
            <meshStandardMaterial color="#C62828" roughness={0.4} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.16, 0.56, 0.03]} />
            <meshStandardMaterial color="#C62828" roughness={0.4} />
          </mesh>
        </group>
      ))}
      <mesh position={[-1.45, 1.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.55, 1.15, 1.98]} />
        <meshStandardMaterial color="#F4F6F8" roughness={0.36} metalness={0.1} />
      </mesh>
      <mesh position={[-2.23, 1.3, 0]}>
        <boxGeometry args={[0.04, 0.58, 1.72]} />
        <meshStandardMaterial color="#1E3947" roughness={0.14} metalness={0.55} />
      </mesh>
      <mesh position={[-1.1, 1.82, -0.35]}>
        <boxGeometry args={[0.28, 0.16, 0.58]} />
        <meshStandardMaterial color="#D92D20" emissive="#B42318" emissiveIntensity={0.5} roughness={0.2} />
      </mesh>
      <mesh position={[-1.1, 1.82, 0.35]}>
        <boxGeometry args={[0.28, 0.16, 0.58]} />
        <meshStandardMaterial color="#1570EF" emissive="#175CD3" emissiveIntensity={0.5} roughness={0.2} />
      </mesh>
      {[
        [-1.55, -0.98],
        [-1.55, 0.98],
        [1.45, -0.98],
        [1.45, 0.98],
      ].map(([wx, wz], idx) => (
        <mesh key={idx} position={[wx, 0.36, wz]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.36, 0.36, 0.26, 14]} />
          <meshStandardMaterial color="#1E2226" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Yellow Industrial Maintenance Truck in the Rear Workshop Junk Area (visually distinct from White Coaster Buses).
 */
function YellowTruck({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Chassis */}
      <mesh position={[0, 0.52, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.0, 0.34, 2.15]} />
        <meshStandardMaterial color="#252A2E" roughness={0.78} metalness={0.35} />
      </mesh>
      {/* Bright Industrial Yellow Cab */}
      <mesh position={[2.0, 1.48, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.85, 1.65, 2.22]} />
        <meshStandardMaterial color="#E6A817" roughness={0.44} metalness={0.18} />
      </mesh>
      <mesh position={[2.93, 1.72, 0]}>
        <boxGeometry args={[0.05, 0.68, 1.94]} />
        <meshStandardMaterial color="#1E3540" roughness={0.15} metalness={0.5} />
      </mesh>
      {/* Flatbed & Yellow/Steel Dump Bed */}
      <mesh position={[-1.05, 1.24, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.9, 1.05, 2.28]} />
        <meshStandardMaterial color="#D99B16" roughness={0.56} metalness={0.22} />
      </mesh>
      {/* Top Bed Rim */}
      <mesh position={[-1.05, 1.8, 0]}>
        <boxGeometry args={[3.96, 0.1, 2.34]} />
        <meshStandardMaterial color="#4A5258" roughness={0.62} metalness={0.45} />
      </mesh>
      {[
        [-1.95, -1.06],
        [-1.95, 1.06],
        [1.95, -1.06],
        [1.95, 1.06],
      ].map(([wx, wz], idx) => (
        <mesh key={idx} position={[wx, 0.46, wz]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.46, 0.46, 0.3, 14]} />
          <meshStandardMaterial color="#1B1F22" roughness={0.88} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Corrugated Steel Shipping Container (supports distinct industrial blue & grounds utility colors).
 */
function ShippingContainer({
  position,
  rotationY = 0,
  variant = 'blue',
}: {
  position: [number, number, number];
  rotationY?: number;
  variant?: 'blue' | 'utility';
}) {
  const ribs = useMemo(() => [-2.4, -1.6, -0.8, 0, 0.8, 1.6, 2.4], []);
  const palette =
    variant === 'blue'
      ? { body: '#1F5C8B', rib: '#164366', roof: '#2A6FA3' }
      : { body: '#586655', rib: '#424E40', roof: '#697865' };
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 1.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.0, 2.58, 2.48]} />
        <meshStandardMaterial color={palette.body} roughness={0.6} metalness={0.38} />
      </mesh>
      {ribs.map((rx) => (
        <mesh key={rx} position={[rx, 1.3, 0]} castShadow>
          <boxGeometry args={[0.16, 2.52, 2.56]} />
          <meshStandardMaterial color={palette.rib} roughness={0.56} metalness={0.42} />
        </mesh>
      ))}
      <mesh position={[0, 2.6, 0]}>
        <boxGeometry args={[6.06, 0.08, 2.54]} />
        <meshStandardMaterial color={palette.roof} roughness={0.62} metalness={0.35} />
      </mesh>
    </group>
  );
}

/**
 * Large Campus Industrial Power Generator Plant (twin acoustic enclosure, radiator grille, switchgear & day tank).
 */
function IndustrialGenerator({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Heavy Steel Concrete Skid Plinth */}
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.2, 0.44, 3.05]} />
        <meshStandardMaterial color="#21262B" roughness={0.72} metalness={0.48} />
      </mesh>
      {/* Main Acoustic Engine Housing */}
      <mesh position={[-0.25, 1.54, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.2, 2.2, 2.65]} />
        <meshStandardMaterial color="#D48B22" roughness={0.46} metalness={0.3} />
      </mesh>
      {/* Acoustic Louvered Side Access Doors */}
      {[-1.55, 0.0, 1.35].map((lx, idx) => (
        <mesh key={idx} position={[lx, 1.48, 1.34]}>
          <boxGeometry args={[1.1, 1.55, 0.04]} />
          <meshStandardMaterial color="#A86A14" roughness={0.52} metalness={0.35} />
        </mesh>
      ))}
      {/* Front Heavy Radiator Grille */}
      <mesh position={[2.38, 1.52, 0]}>
        <boxGeometry args={[0.1, 1.82, 2.18]} />
        <meshStandardMaterial color="#272E33" roughness={0.55} metalness={0.68} />
      </mesh>
      {/* Side Control & Breaker Switchgear Cabinet */}
      <mesh position={[2.68, 1.36, 0.05]} castShadow>
        <boxGeometry args={[0.56, 1.65, 1.95]} />
        <meshStandardMaterial color="#31393E" roughness={0.42} metalness={0.52} />
      </mesh>
      <mesh position={[2.97, 1.56, 0.45]}>
        <boxGeometry args={[0.04, 0.56, 0.62]} />
        <meshStandardMaterial color="#182A36" roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Overhead Twin Exhaust Silencers & Stacks */}
      {[-0.45, 0.45].map((ez, idx) => (
        <group key={idx} position={[0, 0, ez]}>
          <mesh position={[-0.2, 2.86, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.24, 0.24, 2.2, 14]} />
            <meshStandardMaterial color="#586168" roughness={0.42} metalness={0.75} />
          </mesh>
          <mesh position={[-1.05, 3.36, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.1, 0.96, 10]} />
            <meshStandardMaterial color="#42494F" roughness={0.45} metalness={0.75} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Varied Scrap Metal Pile (rusted steel I-beams, galvanized corrugated sheets, copper tubing, aluminium scrap & steel drums).
 */
function ScrapMetalCluster({
  position,
  rotationY = 0,
  variant = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
  variant?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Rusted Steel I-Beams */}
      <mesh position={[-0.4, 0.14, 0.2]} rotation={[0.06, 0.42, 0.08]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.22, 0.22]} />
        <meshStandardMaterial color="#7B412A" roughness={0.86} metalness={0.42} />
      </mesh>
      <mesh position={[0.2, 0.3, -0.35]} rotation={[-0.08, -0.36, 0.14]} castShadow>
        <boxGeometry args={[2.1, 0.18, 0.2]} />
        <meshStandardMaterial color="#6B3722" roughness={0.88} metalness={0.4} />
      </mesh>
      {/* Galvanized Corrugated Zinc Sheets */}
      <mesh position={[0.35, 0.42, 0.25]} rotation={[0.24, 0.72, -0.18]} castShadow>
        <boxGeometry args={[1.65, 0.05, 1.05]} />
        <meshStandardMaterial color="#9BA6AE" roughness={0.44} metalness={0.76} />
      </mesh>
      {/* Aluminium Bars & Copper/Brass Coils */}
      <mesh position={[-0.65, 0.36, -0.45]} rotation={[0.12, 0.2, 0.22]} castShadow>
        <boxGeometry args={[1.25, 0.16, 0.32]} />
        <meshStandardMaterial color="#C8D1D8" roughness={0.32} metalness={0.88} />
      </mesh>
      <mesh position={[0.75, 0.24, -0.4]} rotation={[Math.PI / 2 - 0.25, 0, 0.3]} castShadow>
        <torusGeometry args={[0.28, 0.07, 8, 16]} />
        <meshStandardMaterial color="#B56537" roughness={0.38} metalness={0.84} />
      </mesh>
      {/* Steel Scrap Drum */}
      <mesh
        position={[variant % 2 === 0 ? -0.9 : 0.9, 0.44, 0.45]}
        rotation={[variant % 2 === 0 ? 0.12 : Math.PI / 2 - 0.08, 0.4, 0.1]}
        castShadow
      >
        <cylinderGeometry args={[0.32, 0.32, 0.86, 12]} />
        <meshStandardMaterial color={variant % 2 === 0 ? '#3E5B6B' : '#8A4829'} roughness={0.62} metalness={0.55} />
      </mesh>
    </group>
  );
}

/**
 * Painted Parking Stall Markings Helper
 */
function ParkingBayLines({
  x,
  z,
  count,
  spacingZ,
  bayWidth = 4.8,
  bayDepth = 2.8,
}: {
  x: number;
  z: number;
  count: number;
  spacingZ: number;
  bayWidth?: number;
  bayDepth?: number;
}) {
  return (
    <group>
      {Array.from({ length: count + 1 }, (_, i) => {
        const lineZ = z - ((count - 1) * spacingZ) / 2 - bayDepth / 2 + i * spacingZ;
        return (
          <mesh key={i} position={[x, 0.048, lineZ]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[bayWidth, 0.12]} />
            <meshStandardMaterial color="#F2F4F3" roughness={0.55} />
          </mesh>
        );
      })}
    </group>
  );
}

export function CampusVehiclesAndProps() {
  return (
    <group>
      {/* Admin Block Forecourt: Painted Stalls, TWO WHITE Coaster Buses Side-by-Side & Staff Cars */}
      <ParkingBayLines x={-32.5} z={36.0} count={2} spacingZ={4.0} bayWidth={7.8} bayDepth={3.6} />
      <WhiteCoasterBus position={[-32.5, 0.04, 34.0]} rotationY={0} />
      <WhiteCoasterBus position={[-32.5, 0.04, 38.0]} rotationY={0} />

      <ParkingBayLines x={-23.0} z={51.5} count={3} spacingZ={3.5} bayWidth={4.8} bayDepth={3.0} />
      <StaffCar position={[-23.0, 0.04, 48.0]} rotationY={Math.PI} color="#3B5366" />
      <StaffCar position={[-23.0, 0.04, 51.5]} rotationY={Math.PI} color="#D8DFE3" isSuv />
      <StaffCar position={[-23.0, 0.04, 55.0]} rotationY={Math.PI} color="#5E2D2C" />
      <StaffCar position={[-32.5, 0.04, 52.0]} rotationY={0} color="#263A32" isSuv />

      {/* Clinic Ambulance Bay (clear pull-out toward West Arterial Road Z=6) */}
      <CampusAmbulance position={[-46.8, 0.04, 13.9]} rotationY={-Math.PI / 2} />

      {/* Entrance Approach Right Side (+X): Tractor + Grounds Utility Container #1 near Benches */}
      <CampusTractor position={[21.5, 0.04, 68.4]} rotationY={-0.35} />
      <ShippingContainer position={[24.5, 0.04, 63.2]} rotationY={0.05} variant="utility" />

      {/* Academic East Staff Parking Court (4 staff cars only) */}
      <ParkingBayLines x={38.5} z={-20.5} count={4} spacingZ={4.0} bayWidth={4.8} bayDepth={3.2} />
      <StaffCar position={[38.5, 0.04, -14.5]} rotationY={0} color="#2A3E4C" isSuv />
      <StaffCar position={[38.5, 0.04, -18.5]} rotationY={0} color="#C4C9CE" />
      <StaffCar position={[38.5, 0.04, -22.5]} rotationY={0} color="#3F483B" />
      <StaffCar position={[38.5, 0.04, -26.5]} rotationY={0} color="#76352B" isSuv />

      {/* Blue Shipping Container #2 near Last (5th) Engineering Workshop Entrance (-47.3, -86.6) */}
      <ShippingContainer position={[-53.5, 0.04, -85.0]} rotationY={Math.PI / 2} variant="blue" />

      {/* Rear Workshop Junk Area (Large Power Generator + Yellow Truck + Scrap Metal Piles) */}
      <IndustrialGenerator position={[-49.5, 0.04, -101.8]} rotationY={0.14} />
      <YellowTruck position={[-40.2, 0.04, -102.2]} rotationY={-0.1} />
      <ScrapMetalCluster position={[-51.5, 0.04, -106.5]} rotationY={0.5} variant={0} />
      <ScrapMetalCluster position={[-47.5, 0.04, -97.2]} rotationY={2.1} variant={1} />
      <ScrapMetalCluster position={[-36.5, 0.04, -106.5]} rotationY={1.1} variant={2} />
      <ScrapMetalCluster position={[-36.5, 0.04, -97.8]} rotationY={3.4} variant={3} />
      <ScrapMetalCluster position={[-31.5, 0.04, -102.0]} rotationY={0.8} variant={0} />
    </group>
  );
}
