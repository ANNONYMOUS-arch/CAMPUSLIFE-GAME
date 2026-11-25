import { useEffect, useMemo } from 'react';
import { createInteriorPlaqueTexture } from '../../game/three/textures';
import { DEV_DEMO_ENTRY_PORTAL } from '../../game/world/interiorRegistry';

/**
 * Isolated development-only entry arch placed on the campus entrance plaza
 * so developers can test the Phase 2.1 Building Interiors Framework without
 * modifying or attaching to any unconfirmed campus buildings.
 */
export function DevPortalMarker() {
  const signTex = useMemo(
    () =>
      createInteriorPlaqueTexture(
        'DEMO INTERIOR ARCH',
        'Dev Testing · Press [E] to Enter',
        '#0D3B2E',
        '#D4A024',
        '#F5F0E6',
        4
      ),
    []
  );

  useEffect(() => {
    return () => {
      signTex.dispose();
    };
  }, [signTex]);

  return (
    <group
      name="dev-demo-interior-portal"
      position={[DEV_DEMO_ENTRY_PORTAL.x, DEV_DEMO_ENTRY_PORTAL.y, DEV_DEMO_ENTRY_PORTAL.z]}
    >
      {/* Threshold Base Pad */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[2.8, 0.06, 2.2]} />
        <meshStandardMaterial color="#19352B" roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.065, 0]}>
        <boxGeometry args={[2.2, 0.015, 1.6]} />
        <meshStandardMaterial color="#D4A024" roughness={0.4} metalness={0.35} />
      </mesh>

      {/* Left & Right Pillars */}
      <mesh position={[-1.25, 1.45, 0]} castShadow>
        <boxGeometry args={[0.24, 2.9, 0.28]} />
        <meshStandardMaterial color="#0D3B2E" roughness={0.6} />
      </mesh>
      <mesh position={[1.25, 1.45, 0]} castShadow>
        <boxGeometry args={[0.24, 2.9, 0.28]} />
        <meshStandardMaterial color="#0D3B2E" roughness={0.6} />
      </mesh>

      {/* Header Beam */}
      <mesh position={[0, 2.95, 0]} castShadow>
        <boxGeometry args={[2.9, 0.48, 0.34]} />
        <meshStandardMaterial color="#0D3B2E" roughness={0.6} />
      </mesh>
      <mesh position={[0, 3.21, 0]}>
        <boxGeometry args={[2.98, 0.07, 0.38]} />
        <meshStandardMaterial color="#D4A024" metalness={0.5} roughness={0.35} />
      </mesh>

      {/* Front & Back Signs */}
      <mesh position={[0, 2.95, 0.18]}>
        <planeGeometry args={[2.55, 0.4]} />
        <meshBasicMaterial map={signTex} />
      </mesh>
      <mesh position={[0, 2.95, -0.18]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[2.55, 0.4]} />
        <meshBasicMaterial map={signTex} />
      </mesh>
    </group>
  );
}
