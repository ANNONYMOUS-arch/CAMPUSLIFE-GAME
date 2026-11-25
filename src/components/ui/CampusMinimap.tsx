import { Compass, Map as MapIcon, Minimize2 } from 'lucide-react';
import {
  MINIMAP_BOUNDS,
  MINIMAP_BUILDINGS,
  MINIMAP_HEIGHT,
  MINIMAP_LABELS,
  MINIMAP_ROAD_GEOMETRY,
  MINIMAP_SPORTS_COURTS,
  MINIMAP_WIDTH,
  getMinimapHeadingDegrees,
  projectCampusPoint,
} from '../../game/world/campusMinimap';

interface CampusMinimapProps {
  campusPosX: number;
  campusPosZ: number;
  facingYaw: number;
  worldMode: 'exterior' | 'interior';
  isOpen: boolean;
  onToggleOpen: () => void;
}

export function CampusMinimap({
  campusPosX,
  campusPosZ,
  facingYaw,
  worldMode,
  isOpen,
  onToggleOpen,
}: CampusMinimapProps) {
  const projected = projectCampusPoint(campusPosX, campusPosZ);
  const headingDeg = getMinimapHeadingDegrees(facingYaw);
  const roundedX = Math.round(campusPosX);
  const roundedZ = Math.round(campusPosZ);

  if (!isOpen) {
    return (
      <button
        type="button"
        tabIndex={-1}
        data-testid="campus-minimap-toggle"
        aria-expanded={false}
        aria-label="Show campus mini-map"
        onClick={(e) => {
          e.currentTarget.blur();
          onToggleOpen();
        }}
        className="pointer-events-auto inline-flex items-center gap-1.5 rounded-lg bg-[#0B241C]/90 border border-[#D4A024]/40 px-2.5 h-8 text-xs font-semibold text-[#F5F0E6] hover:bg-[#143D30] transition-colors shadow-lg cursor-pointer"
      >
        <MapIcon className="w-3.5 h-3.5 text-[#D4A024]" aria-hidden="true" />
        <span>Map</span>
        <span className="hidden sm:inline text-[#B9C8C1]">[M]</span>
      </button>
    );
  }

  const fenceY = 114 - MINIMAP_BOUNDS.minZ;
  const clinicX = -44 - MINIMAP_BOUNDS.minX;
  const clinicY = 22.5 - MINIMAP_BOUNDS.minZ;
  const pitchCenterX = -25 - MINIMAP_BOUNDS.minX;
  const pitchCenterY = -147 - MINIMAP_BOUNDS.minZ;

  return (
    <aside
      data-testid="campus-minimap"
      data-player-svg={`${projected.svgX.toFixed(1)},${projected.svgY.toFixed(1)}`}
      data-heading-deg={headingDeg.toFixed(1)}
      aria-label="Campus Mini-Map"
      className="pointer-events-auto w-[112px] sm:w-[164px] rounded-lg bg-[#0B241C]/92 border border-[#D4A024]/40 shadow-xl overflow-hidden select-none"
    >
      {/* Compact Map Header */}
      <div className="flex items-center justify-between gap-1 px-2 py-1 border-b border-[#D4A024]/25 bg-[#081A14]">
        <div className="flex items-center gap-1 min-w-0">
          <Compass className="w-3 h-3 text-[#D4A024] shrink-0" aria-hidden="true" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#F5F0E6] truncate">
            Campus
          </span>
        </div>
        <button
          type="button"
          tabIndex={-1}
          data-testid="campus-minimap-toggle"
          aria-expanded={true}
          aria-label="Collapse campus mini-map"
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleOpen();
          }}
          className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-semibold text-[#C7D4CE] hover:text-[#F5F0E6] hover:bg-white/10 transition-colors cursor-pointer shrink-0"
        >
          <span className="hidden sm:inline">[M]</span>
          <Minimize2 className="w-3 h-3" aria-hidden="true" />
        </button>
      </div>

      {/* True-Scale Top-Down Campus SVG Overlay */}
      <div className="relative p-1.5 pb-1">
        <svg
          viewBox={`0 0 ${MINIMAP_WIDTH} ${MINIMAP_HEIGHT}`}
          className="w-full h-auto block rounded border border-white/10 bg-[#133529]"
          role="img"
          aria-label={`Player at X ${roundedX}, Z ${roundedZ}${worldMode === 'interior' ? ' inside building' : ''}`}
        >
          <defs>
            <radialGradient id="minimap-player-cone" cx="50%" cy="100%" r="100%">
              <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="minimap-player-cone-indoor" cx="50%" cy="100%" r="100%">
              <stop offset="0%" stopColor="#34D399" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Subtle Survey Grid Lines */}
          <g stroke="#F5F0E6" strokeOpacity="0.06" strokeWidth="0.8">
            {[40, 80, 120, 160].map((gx) => (
              <line key={`gx-${gx}`} x1={gx} y1={0} x2={gx} y2={MINIMAP_HEIGHT} />
            ))}
            {[60, 120, 180, 240, 300].map((gy) => (
              <line key={`gy-${gy}`} x1={0} y1={gy} x2={MINIMAP_WIDTH} y2={gy} />
            ))}
          </g>

          {/* Front Perimeter Campus Wall */}
          <line
            x1={0}
            y1={fenceY}
            x2={-15.8 - MINIMAP_BOUNDS.minX}
            y2={fenceY}
            stroke="#A8A29E"
            strokeWidth="1.8"
          />
          <line
            x1={23.4 - MINIMAP_BOUNDS.minX}
            y1={fenceY}
            x2={MINIMAP_WIDTH}
            y2={fenceY}
            stroke="#A8A29E"
            strokeWidth="1.8"
          />

          {/* Campus Road Network */}
          <g>
            {[
              MINIMAP_ROAD_GEOMETRY.mainAvenue,
              MINIMAP_ROAD_GEOMETRY.westArterial,
              MINIMAP_ROAD_GEOMETRY.continuedNorthRoad,
              MINIMAP_ROAD_GEOMETRY.eastArterial,
              MINIMAP_ROAD_GEOMETRY.eastLoopNorth,
              MINIMAP_ROAD_GEOMETRY.forecourtCrossRoad,
              MINIMAP_ROAD_GEOMETRY.northCrossRoad,
              MINIMAP_ROAD_GEOMETRY.adminSpur,
              MINIMAP_ROAD_GEOMETRY.eastHallSpur,
            ].map((road) => (
              <rect
                key={road.id}
                x={road.x}
                y={road.y}
                width={road.width}
                height={road.height}
                fill={road.fill}
              />
            ))}

            <polyline
              points={MINIMAP_ROAD_GEOMETRY.westBendPolyline}
              fill="none"
              stroke="#2B3A35"
              strokeWidth={MINIMAP_ROAD_GEOMETRY.roadStrokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points={MINIMAP_ROAD_GEOMETRY.eastBendPolyline}
              fill="none"
              stroke="#2B3A35"
              strokeWidth={MINIMAP_ROAD_GEOMETRY.secondaryRoadStrokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Northern Cul-de-Sac */}
            <circle
              cx={MINIMAP_ROAD_GEOMETRY.culDeSacCx}
              cy={MINIMAP_ROAD_GEOMETRY.culDeSacCy}
              r={MINIMAP_ROAD_GEOMETRY.culDeSacRadius}
              fill="#2B3A35"
            />

            {/* Flag Roundabout Ring + Center Grass Island */}
            <circle
              cx={MINIMAP_ROAD_GEOMETRY.roundaboutCx}
              cy={MINIMAP_ROAD_GEOMETRY.roundaboutCy}
              r={MINIMAP_ROAD_GEOMETRY.roundaboutRingRadius}
              fill="none"
              stroke="#2B3A35"
              strokeWidth={MINIMAP_ROAD_GEOMETRY.roundaboutRingStrokeWidth}
            />
            <circle
              cx={MINIMAP_ROAD_GEOMETRY.roundaboutCx}
              cy={MINIMAP_ROAD_GEOMETRY.roundaboutCy}
              r={MINIMAP_ROAD_GEOMETRY.roundaboutIslandRadius}
              fill="#2F6849"
              stroke="#D4A024"
              strokeWidth="0.9"
            />
            <circle
              cx={MINIMAP_ROAD_GEOMETRY.roundaboutCx}
              cy={MINIMAP_ROAD_GEOMETRY.roundaboutCy}
              r={2.5}
              fill="#D4A024"
            />

            {/* Avenue Grass Medians */}
            <rect
              x={MINIMAP_ROAD_GEOMETRY.medianSouth.x}
              y={MINIMAP_ROAD_GEOMETRY.medianSouth.y}
              width={MINIMAP_ROAD_GEOMETRY.medianSouth.width}
              height={MINIMAP_ROAD_GEOMETRY.medianSouth.height}
              fill={MINIMAP_ROAD_GEOMETRY.medianSouth.fill}
            />
            <rect
              x={MINIMAP_ROAD_GEOMETRY.medianNorth.x}
              y={MINIMAP_ROAD_GEOMETRY.medianNorth.y}
              width={MINIMAP_ROAD_GEOMETRY.medianNorth.width}
              height={MINIMAP_ROAD_GEOMETRY.medianNorth.height}
              fill={MINIMAP_ROAD_GEOMETRY.medianNorth.fill}
            />
          </g>

          {/* Sports Courts & Football Pitch */}
          <g>
            {MINIMAP_SPORTS_COURTS.map((court) => (
              <rect
                key={court.id}
                x={court.x}
                y={court.y}
                width={court.width}
                height={court.height}
                rx="1.2"
                fill={court.fill}
                stroke={court.stroke}
                strokeWidth="0.9"
                strokeOpacity="0.65"
              />
            ))}
            {/* Football Pitch Center Line & Circle */}
            <line
              x1={-46 - MINIMAP_BOUNDS.minX}
              y1={pitchCenterY}
              x2={-4 - MINIMAP_BOUNDS.minX}
              y2={pitchCenterY}
              stroke="#F5F0E6"
              strokeOpacity="0.45"
              strokeWidth="0.8"
            />
            <circle
              cx={pitchCenterX}
              cy={pitchCenterY}
              r={5.5}
              fill="none"
              stroke="#F5F0E6"
              strokeOpacity="0.45"
              strokeWidth="0.8"
            />
          </g>

          {/* Campus Buildings & Landmarks */}
          <g>
            {MINIMAP_BUILDINGS.map((b) => (
              <rect
                key={b.id}
                x={b.x}
                y={b.y}
                width={b.width}
                height={b.height}
                rx="0.8"
                fill={b.fill}
                stroke={b.stroke}
                strokeWidth={b.stroke ? '0.9' : undefined}
              />
            ))}
            {/* Clinic Red Cross Accent */}
            <line
              x1={clinicX - 2.6}
              y1={clinicY}
              x2={clinicX + 2.6}
              y2={clinicY}
              stroke="#DC2626"
              strokeWidth="1.6"
            />
            <line
              x1={clinicX}
              y1={clinicY - 2.6}
              x2={clinicX}
              y2={clinicY + 2.6}
              stroke="#DC2626"
              strokeWidth="1.6"
            />
          </g>

          {/* Compact Landmark Labels (hidden on narrow mobile to avoid sub-pixel blur) */}
          <g className="hidden sm:block" fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="700" textAnchor="middle">
            {MINIMAP_LABELS.map((lbl) => (
              <text
                key={lbl.id}
                x={lbl.x}
                y={lbl.y}
                fontSize="7.2"
                letterSpacing="0.25"
                fill={lbl.tone === 'gold' ? '#FCD34D' : '#F8FAFC'}
                stroke="#071913"
                strokeWidth="2.0"
                paintOrder="stroke"
              >
                {lbl.text}
              </text>
            ))}
          </g>

          {/* Compass North Badge */}
          <g transform={`translate(${MINIMAP_WIDTH - 14}, 14)`}>
            <circle r="8.5" fill="#081A14" fillOpacity="0.88" stroke="#D4A024" strokeWidth="0.9" />
            <text
              y="3"
              textAnchor="middle"
              fontSize="8.5"
              fontWeight="800"
              fill="#FCD34D"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              N
            </text>
          </g>

          {/* Real-Time Player Marker + Directional Heading */}
          <g transform={`translate(${projected.svgX}, ${projected.svgY})`}>
            {/* Subtle Outer Halo */}
            <circle
              r="11"
              fill={worldMode === 'interior' ? '#34D399' : '#D4A024'}
              fillOpacity="0.22"
            />
            <circle
              r="7.2"
              fill="none"
              stroke={worldMode === 'interior' ? '#34D399' : '#FCD34D'}
              strokeWidth="1.1"
              strokeOpacity="0.8"
            />
            {/* Directional Heading Arrow */}
            <g transform={`rotate(${headingDeg})`}>
              <polygon
                points="0,-16 -6.5,-2 6.5,-2"
                fill={worldMode === 'interior' ? 'url(#minimap-player-cone-indoor)' : 'url(#minimap-player-cone)'}
              />
              <polygon
                points="0,-8.5 5.2,5.5 0,2.8 -5.2,5.5"
                fill={worldMode === 'interior' ? '#34D399' : '#FBBF24'}
                stroke="#071913"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </g>
          </g>
        </svg>
      </div>

      {/* Live Position Footer */}
      <div className="flex items-center justify-between px-1.5 sm:px-2 pb-1.5 text-[9.5px] sm:text-[10px] font-mono-tabular text-[#C7D4CE]">
        <span>
          {roundedX}, {roundedZ}
        </span>
        <span className={worldMode === 'interior' ? 'font-sans font-bold text-[#34D399]' : 'font-sans text-[#D4A024]'}>
          {worldMode === 'interior' ? 'INDOOR' : 'CAMPUS'}
        </span>
      </div>
    </aside>
  );
}
