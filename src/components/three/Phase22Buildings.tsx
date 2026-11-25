import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import {
  createCampusSignTexture,
  createInteriorPlaqueTexture,
} from '../../game/three/textures';

const WORKSHOP_BAY_META = [
  { centerZ: -59.4, title: 'CARPENTRY & WOODWORK', sub: 'Workshop 1 · [E] Enter' },
  { centerZ: -66.2, title: 'MECHANICAL WORKSHOP', sub: 'Workshop 2 · [E] Enter' },
  { centerZ: -73.0, title: 'WELDING & FABRICATION', sub: 'Workshop 3 · [E] Enter' },
  { centerZ: -79.8, title: 'ELECTRICAL & ELECTRONICS', sub: 'Workshop 4 · [E] Enter' },
  { centerZ: -86.6, title: 'MACHINE SHOP', sub: 'Workshop 5 · [E] Enter' },
] as const;

function ThresholdMat({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.025, 0]} receiveShadow>
        <boxGeometry args={[2.2, 0.03, 1.35]} />
        <meshStandardMaterial color="#0D3B2E" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.045, 0]}>
        <boxGeometry args={[1.82, 0.015, 0.98]} />
        <meshStandardMaterial color="#D4A024" roughness={0.42} metalness={0.35} />
      </mesh>
    </group>
  );
}

export function Phase22Buildings() {
  const { gl } = useThree();

  const textures = useMemo(() => {
    const maxAniso = Math.min(8, gl.capabilities.getMaxAnisotropy() || 4);
    return {
      acadSign: createCampusSignTexture(
        'ACADEMIC BUILDING',
        '4 FLOORS · OPEN COURTYARD · MEDICAL, ENGINEERING & MASS COMM',
        '#14362B',
        '#D4A024',
        '#F5F0E6',
        maxAniso
      ),
      acadRearSign: createInteriorPlaqueTexture(
        'WORKSHOP REAR PASSAGE',
        'Direct Access to Rear Staircase & Toilets · [E] Enter',
        '#14362B',
        '#D4A024',
        '#F5F0E6',
        maxAniso
      ),
      junkYardSign: createInteriorPlaqueTexture(
        'MAINTENANCE & JUNK YARD',
        'Power Generator · Service Truck · Scrap Metal',
        '#5E3219',
        '#F1C14B',
        '#FFF8EC',
        maxAniso
      ),
      adminSign: createCampusSignTexture(
        'ADMINISTRATIVE BLOCK',
        '3 STOREYS · REGISTRY, BURSARY & EXECUTIVE OFFICES',
        '#2C343C',
        '#D4A024',
        '#F5F0E6',
        maxAniso
      ),
      clinicSign: createCampusSignTexture(
        'CAMPUS CLINIC',
        'MEDICAL RECEPTION · CONSULTATION & AMBULANCE BAY',
        '#0F5B46',
        '#F5F0E6',
        '#FFFFFF',
        maxAniso
      ),
      cafSign: createCampusSignTexture(
        'CAFETERIA & FELLOWSHIP HALL',
        'GROUND: DINING & BUKA · UPPER: FELLOWSHIP HALL',
        '#7A2E1E',
        '#F1C14B',
        '#FFF8EC',
        maxAniso
      ),
      ambulanceBaySign: createInteriorPlaqueTexture(
        'AMBULANCE PARKING ONLY',
        'Keep Emergency Access Clear',
        '#7A1C1C',
        '#F5F0E6',
        '#FFFFFF',
        maxAniso
      ),
      workshopSigns: WORKSHOP_BAY_META.map((w) =>
        createInteriorPlaqueTexture(w.title, w.sub, '#15332A', '#D4A024', '#F5F0E6', maxAniso)
      ),
    };
  }, [gl]);

  useEffect(() => {
    return () => {
      textures.acadSign.dispose();
      textures.acadRearSign.dispose();
      textures.junkYardSign.dispose();
      textures.adminSign.dispose();
      textures.clinicSign.dispose();
      textures.cafSign.dispose();
      textures.ambulanceBaySign.dispose();
      for (const tex of textures.workshopSigns) {
        tex.dispose();
      }
    };
  }, [textures]);

  return (
    <group>
      {/* =================================================================== */}
      {/* 1. FOUR-STOREY CREAM ACADEMIC BUILDING WITH OPEN COURTYARD          */}
      {/*    Outer footprint: X: -34.0..+34.0, Z: -90.0..-34.0 (68m x 56m)   */}
      {/*    Central Open Courtyard Void: X: -11.5..+11.5, Z: -71.0..-54.0   */}
      {/*    East Open Lightwells: X: 16.5..19.0, Z: -71..-64 & Z: -62..-55  */}
      {/* =================================================================== */}
      <group>
        {/* Courtyard & East Lightwell Ground Floor Slabs */}
        <mesh position={[0.0, 0.04, -62.5]} receiveShadow>
          <boxGeometry args={[23.2, 0.06, 17.2]} />
          <meshStandardMaterial color="#D8CEBE" roughness={0.86} />
        </mesh>
        <mesh position={[17.75, 0.04, -63.0]} receiveShadow>
          <boxGeometry args={[2.6, 0.06, 16.4]} />
          <meshStandardMaterial color="#D8CEBE" roughness={0.86} />
        </mesh>

        {/* West Wing (X: -34.0..-11.5, Z: -90.0..-34.0) */}
        <mesh position={[-22.75, 6.4, -62.0]} castShadow receiveShadow>
          <boxGeometry args={[22.5, 12.8, 56.0]} />
          <meshStandardMaterial color="#EDE5D7" roughness={0.82} />
        </mesh>
        <mesh position={[-22.75, 13.05, -62.0]} castShadow>
          <boxGeometry args={[23.1, 0.52, 56.6]} />
          <meshStandardMaterial color="#0D3B2E" roughness={0.58} />
        </mesh>

        {/* East Wing — Inner Gallery Strip (X: 11.5..16.5, Z: -90.0..-34.0) */}
        <mesh position={[14.0, 6.4, -62.0]} castShadow receiveShadow>
          <boxGeometry args={[5.0, 12.8, 56.0]} />
          <meshStandardMaterial color="#EDE5D7" roughness={0.82} />
        </mesh>
        <mesh position={[14.0, 13.05, -62.0]} castShadow>
          <boxGeometry args={[5.0, 0.52, 56.6]} />
          <meshStandardMaterial color="#0D3B2E" roughness={0.58} />
        </mesh>

        {/* East Wing — Lightwell Column (X: 16.5..19.0) keeping Z: -71..-64 & Z: -62..-55 open to sky */}
        <mesh position={[17.75, 6.4, -80.5]} castShadow receiveShadow>
          <boxGeometry args={[2.5, 12.8, 19.0]} />
          <meshStandardMaterial color="#EDE5D7" roughness={0.82} />
        </mesh>
        <mesh position={[17.75, 13.05, -80.5]} castShadow>
          <boxGeometry args={[2.5, 0.52, 19.4]} />
          <meshStandardMaterial color="#0D3B2E" roughness={0.58} />
        </mesh>
        <mesh position={[17.75, 6.4, -63.0]} castShadow receiveShadow>
          <boxGeometry args={[2.5, 12.8, 2.0]} />
          <meshStandardMaterial color="#EDE5D7" roughness={0.82} />
        </mesh>
        <mesh position={[17.75, 13.05, -63.0]} castShadow>
          <boxGeometry args={[2.5, 0.52, 2.0]} />
          <meshStandardMaterial color="#0D3B2E" roughness={0.58} />
        </mesh>
        <mesh position={[17.75, 6.4, -44.5]} castShadow receiveShadow>
          <boxGeometry args={[2.5, 12.8, 21.0]} />
          <meshStandardMaterial color="#EDE5D7" roughness={0.82} />
        </mesh>
        <mesh position={[17.75, 13.05, -44.5]} castShadow>
          <boxGeometry args={[2.5, 0.52, 21.4]} />
          <meshStandardMaterial color="#0D3B2E" roughness={0.58} />
        </mesh>

        {/* East Wing — Outer Labs & Classrooms Strip (X: 19.0..34.0, Z: -90.0..-34.0) */}
        <mesh position={[26.5, 6.4, -62.0]} castShadow receiveShadow>
          <boxGeometry args={[15.0, 12.8, 56.0]} />
          <meshStandardMaterial color="#EDE5D7" roughness={0.82} />
        </mesh>
        <mesh position={[26.5, 13.05, -62.0]} castShadow>
          <boxGeometry args={[15.6, 0.52, 56.6]} />
          <meshStandardMaterial color="#0D3B2E" roughness={0.58} />
        </mesh>

        {/* North Wing (X: -11.5..+11.5, Z: -90.0..-71.0) */}
        <mesh position={[0.0, 6.4, -80.5]} castShadow receiveShadow>
          <boxGeometry args={[23.0, 12.8, 19.0]} />
          <meshStandardMaterial color="#EDE5D7" roughness={0.82} />
        </mesh>
        <mesh position={[0.0, 13.05, -80.5]} castShadow>
          <boxGeometry args={[23.2, 0.52, 19.6]} />
          <meshStandardMaterial color="#0D3B2E" roughness={0.58} />
        </mesh>

        {/* South Wing (X: -11.5..+11.5, Z: -54.0..-34.0) */}
        <mesh position={[0.0, 6.4, -44.0]} castShadow receiveShadow>
          <boxGeometry args={[23.0, 12.8, 20.0]} />
          <meshStandardMaterial color="#EDE5D7" roughness={0.82} />
        </mesh>
        <mesh position={[0.0, 13.05, -44.0]} castShadow>
          <boxGeometry args={[23.2, 0.52, 20.6]} />
          <meshStandardMaterial color="#0D3B2E" roughness={0.58} />
        </mesh>

        {/* 4-Storey Slab Bands on South (+Z), North (-Z), East (+X) & West (-X) Facades */}
        {[3.2, 6.4, 9.6, 12.6].map((ly) => (
          <group key={`acad-band-${ly}`}>
            <mesh position={[0.0, ly, -33.88]} castShadow>
              <boxGeometry args={[68.2, 0.24, 0.28]} />
              <meshStandardMaterial color="#D4CCBE" roughness={0.8} />
            </mesh>
            <mesh position={[0.0, ly, -90.12]} castShadow>
              <boxGeometry args={[68.2, 0.24, 0.28]} />
              <meshStandardMaterial color="#D4CCBE" roughness={0.8} />
            </mesh>
            <mesh position={[-34.12, ly, -62.0]} castShadow>
              <boxGeometry args={[0.28, 0.24, 56.2]} />
              <meshStandardMaterial color="#D4CCBE" roughness={0.8} />
            </mesh>
            <mesh position={[34.12, ly, -62.0]} castShadow>
              <boxGeometry args={[0.28, 0.24, 56.2]} />
              <meshStandardMaterial color="#D4CCBE" roughness={0.8} />
            </mesh>
          </group>
        ))}

        {/* Architectural South Pilasters Flanking Entrance */}
        {[-11.5, -5.2, 5.2, 11.5].map((px) => (
          <mesh key={`acad-pil-${px}`} position={[px, 6.4, -33.9]} castShadow>
            <boxGeometry args={[0.7, 12.8, 0.34]} />
            <meshStandardMaterial color="#DDD4C3" roughness={0.8} />
          </mesh>
        ))}

        {/* Glazed Horizontal Window Tiers */}
        {[4.8, 8.0, 11.2].map((wy) => (
          <group key={`acad-win-${wy}`}>
            <mesh position={[0.0, wy, -33.96]}>
              <planeGeometry args={[61.0, 1.5]} />
              <meshStandardMaterial color="#274754" roughness={0.18} metalness={0.55} />
            </mesh>
            <mesh position={[0.0, wy, -90.04]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[58.0, 1.5]} />
              <meshStandardMaterial color="#274754" roughness={0.18} metalness={0.55} />
            </mesh>
            <mesh position={[34.04, wy, -62.0]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[48.0, 1.5]} />
              <meshStandardMaterial color="#274754" roughness={0.18} metalness={0.55} />
            </mesh>
            <mesh position={[-34.04, wy, -62.0]} rotation={[0, -Math.PI / 2, 0]}>
              <planeGeometry args={[48.0, 1.5]} />
              <meshStandardMaterial color="#274754" roughness={0.18} metalness={0.55} />
            </mesh>
          </group>
        ))}

        {/* Ground-Floor Window Strips */}
        <mesh position={[-22.0, 1.65, -33.96]}>
          <planeGeometry args={[18.0, 1.42]} />
          <meshStandardMaterial color="#274754" roughness={0.18} metalness={0.55} />
        </mesh>
        <mesh position={[22.0, 1.65, -33.96]}>
          <planeGeometry args={[18.0, 1.42]} />
          <meshStandardMaterial color="#274754" roughness={0.18} metalness={0.55} />
        </mesh>
        <mesh position={[34.04, 1.65, -62.0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[46.0, 1.42]} />
          <meshStandardMaterial color="#274754" roughness={0.18} metalness={0.55} />
        </mesh>
        <mesh position={[-34.04, 1.65, -45.0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[16.0, 1.42]} />
          <meshStandardMaterial color="#274754" roughness={0.18} metalness={0.55} />
        </mesh>

        {/* West Road-Facing Academic Signage (clear above single-storey workshops) */}
        <mesh position={[-34.1, 8.2, -45.0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[11.0, 1.45]} />
          <meshStandardMaterial map={textures.acadSign} color="#ffffff" roughness={0.45} />
        </mesh>

        {/* South Main Entrance Canopy, Glass Double Doors & Signage (world X = 0.0, Z = -34.0) */}
        <mesh position={[0.0, 3.1, -32.9]} castShadow>
          <boxGeometry args={[6.4, 0.38, 2.4]} />
          <meshStandardMaterial color="#0D3B2E" roughness={0.58} />
        </mesh>
        {[-2.8, 2.8].map((cx) => (
          <mesh key={`acad-canopy-col-${cx}`} position={[cx, 1.55, -32.0]} castShadow>
            <boxGeometry args={[0.32, 3.1, 0.32]} />
            <meshStandardMaterial color="#DDD4C3" roughness={0.8} />
          </mesh>
        ))}
        <mesh position={[0.0, 1.38, -33.96]}>
          <boxGeometry args={[2.6, 2.76, 0.1]} />
          <meshStandardMaterial color="#1E3B46" roughness={0.15} metalness={0.45} />
        </mesh>
        <mesh position={[0.0, 3.85, -33.5]}>
          <planeGeometry args={[10.8, 0.92]} />
          <meshStandardMaterial map={textures.acadSign} color="#ffffff" roughness={0.45} />
        </mesh>
        <mesh position={[0.0, 0.025, -32.8]} receiveShadow>
          <boxGeometry args={[7.4, 0.03, 3.0]} />
          <meshStandardMaterial color="#CFC6B8" roughness={0.86} />
        </mesh>
        <ThresholdMat position={[0.0, 0.02, -32.4]} />
      </group>

      {/* =================================================================== */}
      {/* 2. FIVE SINGLE-STOREY ENGINEERING WORKSHOPS                         */}
      {/*    Attached along Academic West Rear Wall (X: -46..-34, Z: -90..-56) */}
      {/*    Hidden from front plaza; clearly visible on West Workshop side! */}
      {/* =================================================================== */}
      <group>
        {/* Continuous Paved West Workshop Apron (X: -55.5..-46.0, Z: -90.2..-55.8) */}
        <mesh position={[-50.75, 0.025, -73.0]} receiveShadow>
          <boxGeometry args={[9.5, 0.03, 34.4]} />
          <meshStandardMaterial color="#C8BFB2" roughness={0.86} />
        </mesh>

        {WORKSHOP_BAY_META.map((bay, idx) => (
          <group key={bay.title} position={[-40.0, 0, bay.centerZ]}>
            {/* Single-Storey Workshop Bay (12.0 wide x 4.4 high x 6.76 deep) */}
            <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
              <boxGeometry args={[12.0, 4.4, 6.76]} />
              <meshStandardMaterial color={idx % 2 === 0 ? '#E6DDD0' : '#DFD5C5'} roughness={0.84} />
            </mesh>
            {/* Industrial Fascia Roof Trim (single-storey 4.6m) */}
            <mesh position={[0, 4.58, 0]} castShadow>
              <boxGeometry args={[12.3, 0.42, 6.82]} />
              <meshStandardMaterial color="#1B3C32" roughness={0.55} metalness={0.15} />
            </mesh>
            {/* Bay Divider Pilaster */}
            <mesh position={[-6.02, 2.2, 3.38]}>
              <boxGeometry args={[0.16, 4.4, 0.16]} />
              <meshStandardMaterial color="#0D3B2E" roughness={0.6} />
            </mesh>
            {/* West-Facing Workshop Door & Signage */}
            <mesh position={[-6.02, 1.35, 0]}>
              <boxGeometry args={[0.08, 2.7, 1.9]} />
              <meshStandardMaterial color="#313A3F" roughness={0.45} metalness={0.4} />
            </mesh>
            <mesh position={[-6.05, 3.35, 0]} rotation={[0, -Math.PI / 2, 0]}>
              <planeGeometry args={[4.6, 0.96]} />
              <meshStandardMaterial map={textures.workshopSigns[idx]} color="#ffffff" roughness={0.42} />
            </mesh>
            <ThresholdMat position={[-7.3, 0.02, 0]} rotationY={Math.PI / 2} />
          </group>
        ))}
      </group>

      {/* =================================================================== */}
      {/* 2B. COVERED WORKSHOP-TO-REAR PASSAGE                                */}
      {/*     Walkway X: -50.5..-18.0, Z: -94.0..-90.0                        */}
      {/*     Direct access to Academic Rear Door at (-21.0, 0, -90.0)        */}
      {/* =================================================================== */}
      <group>
        <mesh position={[-34.25, 0.025, -92.0]} receiveShadow>
          <boxGeometry args={[32.5, 0.04, 4.0]} />
          <meshStandardMaterial color="#CEC6B8" roughness={0.86} />
        </mesh>
        <mesh position={[-34.25, 3.22, -92.0]} castShadow>
          <boxGeometry args={[32.5, 0.22, 4.1]} />
          <meshStandardMaterial color="#0D3B2E" roughness={0.58} />
        </mesh>
        <mesh position={[-34.25, 3.06, -92.0]}>
          <boxGeometry args={[32.1, 0.12, 3.7]} />
          <meshStandardMaterial color="#EFE7DA" roughness={0.8} />
        </mesh>
        {[-50.0, -45.5, -41.0, -36.5, -32.0, -27.5, -23.0, -18.5].map((cx) => (
          <mesh key={`pass-col-${cx}`} position={[cx, 1.6, -93.8]} castShadow>
            <boxGeometry args={[0.24, 3.2, 0.24]} />
            <meshStandardMaterial color="#DFD5C5" roughness={0.8} />
          </mesh>
        ))}
        <mesh position={[-34.1, 0.48, -93.8]} castShadow>
          <boxGeometry args={[32.0, 0.96, 0.18]} />
          <meshStandardMaterial color="#E6DDD0" roughness={0.82} />
        </mesh>
        <mesh position={[-34.1, 1.0, -93.8]}>
          <boxGeometry args={[32.2, 0.08, 0.24]} />
          <meshStandardMaterial color="#0D3B2E" roughness={0.58} />
        </mesh>
        {/* Rear Academic Passage Entrance Doors & Signage (world X = -21.0, Z = -90.0) */}
        <mesh position={[-21.0, 1.2, -90.04]}>
          <boxGeometry args={[1.8, 2.4, 0.1]} />
          <meshStandardMaterial color="#1E3B46" roughness={0.15} metalness={0.45} />
        </mesh>
        <mesh position={[-21.0, 2.7, -90.08]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[3.4, 0.58]} />
          <meshStandardMaterial map={textures.acadRearSign} color="#ffffff" roughness={0.42} />
        </mesh>
        <ThresholdMat position={[-21.0, 0.02, -90.8]} />
      </group>

      {/* =================================================================== */}
      {/* 2C. REAR WORKSHOP JUNK AREA PAD (X: -57..-23, Z: -110..-94.8)       */}
      {/*     Compacted laterite/gravel yard + service apron to Cross-Road    */}
      {/* =================================================================== */}
      <group>
        <mesh position={[-40.0, 0.02, -102.4]} receiveShadow>
          <boxGeometry args={[34.0, 0.03, 15.2]} />
          <meshStandardMaterial color="#8A7D6B" roughness={0.94} />
        </mesh>
        {/* Yard Service Driveway North to Cross-Road (Z = -117) */}
        <mesh position={[-51.0, 0.022, -112.4]} receiveShadow>
          <boxGeometry args={[8.0, 0.03, 6.8]} />
          <meshStandardMaterial color="#7C7163" roughness={0.92} />
        </mesh>
        {/* Junk Yard Signpost */}
        <mesh position={[-55.2, 1.2, -109.6]} castShadow>
          <cylinderGeometry args={[0.06, 0.07, 2.4, 8]} />
          <meshStandardMaterial color="#2A322E" roughness={0.5} metalness={0.6} />
        </mesh>
        <mesh position={[-55.2, 2.1, -109.65]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[2.5, 0.72]} />
          <meshStandardMaterial map={textures.junkYardSign} color="#ffffff" roughness={0.45} />
        </mesh>
      </group>

      {/* =================================================================== */}
      {/* 3. CAMPUS CLINIC (-44.0, 0, 22.5) & AMBULANCE BAY (-46.8, 0, 13.9)  */}
      {/*    Entrance faces North (-Z) toward West Arterial (Z = 6)           */}
      {/* =================================================================== */}
      <group>
        <group position={[-44.0, 0, 22.5]}>
          <mesh position={[0, 1.9, 0]} castShadow receiveShadow>
            <boxGeometry args={[16.0, 3.8, 10.0]} />
            <meshStandardMaterial color="#F2EFE8" roughness={0.82} />
          </mesh>
          <mesh position={[0, 3.98, 0]} castShadow>
            <boxGeometry args={[16.8, 0.44, 10.8]} />
            <meshStandardMaterial color="#0F6B52" roughness={0.55} />
          </mesh>
          {/* Medical Red Cross Accent on North (-Z) Facade */}
          <group position={[-4.5, 2.75, -5.05]}>
            <mesh>
              <boxGeometry args={[0.92, 0.28, 0.06]} />
              <meshStandardMaterial color="#C62828" roughness={0.4} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.28, 0.92, 0.06]} />
              <meshStandardMaterial color="#C62828" roughness={0.4} />
            </mesh>
          </group>
          {/* North (-Z) Entrance Canopy & Doors at local x = +4.5 -> world (-39.5, 17.5) */}
          <mesh position={[4.5, 2.65, -5.65]} castShadow>
            <boxGeometry args={[3.8, 0.28, 1.6]} />
            <meshStandardMaterial color="#0F6B52" roughness={0.55} />
          </mesh>
          <mesh position={[4.5, 1.25, -5.02]}>
            <boxGeometry args={[2.1, 2.5, 0.08]} />
            <meshStandardMaterial color="#274754" roughness={0.15} metalness={0.45} />
          </mesh>
          <mesh position={[1.2, 3.32, -5.08]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[6.8, 1.0]} />
            <meshStandardMaterial map={textures.clinicSign} color="#ffffff" roughness={0.45} />
          </mesh>
          <mesh position={[4.5, 0.025, -5.9]} receiveShadow>
            <boxGeometry args={[4.4, 0.03, 2.4]} />
            <meshStandardMaterial color="#CFC6B8" roughness={0.86} />
          </mesh>
          <ThresholdMat position={[4.5, 0.02, -6.2]} />
        </group>

        {/* Dedicated Ambulance Parking Bay (-46.8, 0.025, 13.9) with direct exit to West Arterial Z=6 */}
        <group position={[-46.8, 0.025, 13.9]}>
          <mesh receiveShadow>
            <boxGeometry args={[6.4, 0.03, 6.4]} />
            <meshStandardMaterial color="#4B5258" roughness={0.88} />
          </mesh>
          <mesh position={[-2.9, 0.022, 0]}>
            <boxGeometry args={[0.16, 0.01, 5.8]} />
            <meshStandardMaterial color="#E5B43B" roughness={0.5} />
          </mesh>
          <mesh position={[2.9, 0.022, 0]}>
            <boxGeometry args={[0.16, 0.01, 5.8]} />
            <meshStandardMaterial color="#E5B43B" roughness={0.5} />
          </mesh>
          <mesh position={[-2.5, 1.1, 2.6]} castShadow>
            <cylinderGeometry args={[0.06, 0.07, 2.2, 8]} />
            <meshStandardMaterial color="#2C3532" roughness={0.45} metalness={0.55} />
          </mesh>
          <mesh position={[-2.5, 1.95, 2.54]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[1.6, 0.5]} />
            <meshStandardMaterial map={textures.ambulanceBaySign} color="#ffffff" roughness={0.45} />
          </mesh>
        </group>
      </group>

      {/* =================================================================== */}
      {/* 4. THREE-STOREY ADMINISTRATIVE BLOCK (-54.0, 0, 43.0)               */}
      {/*    Set well back behind paved Bus & Staff Forecourt; Faces +X       */}
      {/* =================================================================== */}
      <group position={[-54.0, 0, 43.0]}>
        <mesh position={[0, 4.95, 0]} castShadow receiveShadow>
          <boxGeometry args={[20.0, 9.9, 18.0]} />
          <meshStandardMaterial color="#8D949B" roughness={0.8} />
        </mesh>
        <mesh position={[0, 10.14, 0]} castShadow>
          <boxGeometry args={[20.6, 0.48, 18.6]} />
          <meshStandardMaterial color="#3A434B" roughness={0.58} metalness={0.2} />
        </mesh>
        <mesh position={[10.04, 4.95, -6.8]}>
          <boxGeometry args={[0.24, 9.9, 1.3]} />
          <meshStandardMaterial color="#5E666E" roughness={0.75} />
        </mesh>
        <mesh position={[10.04, 4.95, 6.8]}>
          <boxGeometry args={[0.24, 9.9, 1.3]} />
          <meshStandardMaterial color="#5E666E" roughness={0.75} />
        </mesh>
        {[3.2, 6.4, 9.4].map((ly) => (
          <mesh key={`adm-louver-${ly}`} position={[10.12, ly, 0]} castShadow>
            <boxGeometry args={[0.32, 0.24, 14.8]} />
            <meshStandardMaterial color="#515860" roughness={0.72} />
          </mesh>
        ))}
        {[4.8, 7.9].map((wy) => (
          <mesh key={`adm-win-${wy}`} position={[10.03, wy, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[11.2, 1.6]} />
            <meshStandardMaterial color="#233F4B" roughness={0.18} metalness={0.55} />
          </mesh>
        ))}
        {/* East Entrance Canopy & Double Doors at world X = -44.0, Z = 43.0 */}
        <mesh position={[10.8, 2.75, 0]} castShadow>
          <boxGeometry args={[1.8, 0.3, 4.4]} />
          <meshStandardMaterial color="#3A434B" roughness={0.55} />
        </mesh>
        <mesh position={[10.02, 1.3, 0]}>
          <boxGeometry args={[0.08, 2.6, 2.4]} />
          <meshStandardMaterial color="#223B46" roughness={0.16} metalness={0.48} />
        </mesh>
        <mesh position={[10.08, 3.55, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[8.4, 1.15]} />
          <meshStandardMaterial map={textures.adminSign} color="#ffffff" roughness={0.45} />
        </mesh>
        <mesh position={[11.2, 0.025, 0]} receiveShadow>
          <boxGeometry args={[2.8, 0.03, 5.4]} />
          <meshStandardMaterial color="#CFC6B8" roughness={0.86} />
        </mesh>
        <ThresholdMat position={[11.5, 0.02, 0]} rotationY={Math.PI / 2} />
      </group>

      {/* =================================================================== */}
      {/* 5. CAFETERIA & FELLOWSHIP HALL (-84.0, 0, -47.0) & BUKA KIOSK       */}
      {/*    West side of Continued Northern Road, before Volleyball & Muster */}
      {/* =================================================================== */}
      <group>
        <group position={[-84.0, 0, -47.0]}>
          <mesh position={[0, 3.1, 0]} castShadow receiveShadow>
            <boxGeometry args={[20.0, 6.2, 18.0]} />
            <meshStandardMaterial color="#EFE7DA" roughness={0.82} />
          </mesh>
          <mesh position={[0, 6.45, 0]} castShadow>
            <boxGeometry args={[21.4, 0.65, 19.4]} />
            <meshStandardMaterial color="#8A3422" roughness={0.68} />
          </mesh>
          <mesh position={[10.03, 4.7, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[13.0, 1.55]} />
            <meshStandardMaterial color="#24434E" roughness={0.18} metalness={0.5} />
          </mesh>
          <mesh position={[0, 4.7, 9.03]}>
            <planeGeometry args={[14.8, 1.55]} />
            <meshStandardMaterial color="#24434E" roughness={0.18} metalness={0.5} />
          </mesh>
          <mesh position={[0, 1.85, 9.03]}>
            <planeGeometry args={[14.0, 1.45]} />
            <meshStandardMaterial color="#24434E" roughness={0.18} metalness={0.5} />
          </mesh>
          <mesh position={[0, 2.86, 0]}>
            <boxGeometry args={[20.16, 0.18, 18.16]} />
            <meshStandardMaterial color="#9E4731" roughness={0.72} />
          </mesh>
          {/* East (+X) Entrance Canopy, Doors & Signage */}
          <mesh position={[10.8, 2.66, 0]} castShadow>
            <boxGeometry args={[1.8, 0.28, 4.8]} />
            <meshStandardMaterial color="#8A3422" roughness={0.62} />
          </mesh>
          <mesh position={[10.02, 1.25, 0]}>
            <boxGeometry args={[0.1, 2.5, 2.4]} />
            <meshStandardMaterial color="#24434E" roughness={0.16} metalness={0.45} />
          </mesh>
          <mesh position={[10.12, 3.45, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[8.4, 1.0]} />
            <meshStandardMaterial map={textures.cafSign} color="#ffffff" roughness={0.45} />
          </mesh>
          <mesh position={[11.2, 0.025, 0]} receiveShadow>
            <boxGeometry args={[2.8, 0.03, 5.4]} />
            <meshStandardMaterial color="#CFC6B8" roughness={0.86} />
          </mesh>
          <ThresholdMat position={[11.5, 0.02, 0]} rotationY={Math.PI / 2} />
        </group>

        {/* Campus Buka / Canteen Kiosk beside Cafeteria (-77.0, 0, -31.0) */}
        <group position={[-77.0, 0, -31.0]}>
          <mesh position={[0, 1.45, 0]} castShadow receiveShadow>
            <boxGeometry args={[6.0, 2.9, 6.0]} />
            <meshStandardMaterial color="#E5A933" roughness={0.72} />
          </mesh>
          <mesh position={[0, 3.1, 0]} castShadow>
            <boxGeometry args={[6.8, 0.4, 6.8]} />
            <meshStandardMaterial color="#0D3B2E" roughness={0.6} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
