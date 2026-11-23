import { formatCoordinates } from '../../utils/formatters';

interface WorldPinMapProps {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  country: string | null;
}

// Simplified equirectangular continent paths in 720x360 viewBox (lon -180..180 -> 0..720, lat 90..-90 -> 0..360)
const CONTINENT_PATHS = [
  // North America
  'M 64 56 L 140 42 L 218 52 L 245 78 L 222 104 L 204 128 L 176 154 L 160 170 L 146 164 L 130 142 L 106 116 L 84 90 Z',
  // Greenland
  'M 232 24 L 288 18 L 298 44 L 258 62 L 236 48 Z',
  // South America
  'M 182 178 L 228 184 L 266 212 L 256 254 L 224 304 L 206 322 L 196 292 L 188 232 L 176 198 Z',
  // Europe
  'M 332 58 L 382 46 L 424 54 L 418 90 L 384 102 L 348 98 L 328 84 Z',
  // Africa
  'M 334 114 L 392 110 L 434 134 L 444 176 L 418 232 L 392 268 L 372 252 L 358 192 L 326 162 L 324 132 Z',
  // Asia
  'M 424 46 L 548 38 L 642 54 L 664 88 L 626 122 L 584 152 L 546 162 L 512 152 L 478 136 L 434 126 L 418 94 Z',
  // SE Asia / Indonesia
  'M 556 174 L 614 176 L 630 194 L 566 196 Z',
  // Australia
  'M 578 220 L 642 216 L 656 254 L 622 276 L 580 262 Z',
];

export function WorldPinMap({
  latitude,
  longitude,
  city,
  country,
}: WorldPinMapProps) {
  const hasCoords = latitude !== null && longitude !== null;
  const x = hasCoords ? ((longitude + 180) / 360) * 720 : 360;
  const y = hasCoords ? ((90 - latitude) / 180) * 360 : 180;

  return (
    <div className="border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
      <div className="relative aspect-[2/1] w-full">
        <svg
          viewBox="0 0 720 360"
          role="img"
          aria-label={
            hasCoords
              ? `Map pin near ${city || country || 'coordinates'} at ${formatCoordinates(latitude, longitude)}`
              : 'World coordinate map without public location pin'
          }
          className="w-full h-full block"
        >
          <rect width="720" height="360" fill="#f8fafc" />

          {/* Graticule grid lines */}
          {[90, 180, 270].map((gy) => (
            <line
              key={`lat-${gy}`}
              x1={0}
              y1={gy}
              x2={720}
              y2={gy}
              stroke="#e2e8f0"
              strokeWidth={1}
              strokeDasharray={gy === 180 ? undefined : '4 4'}
            />
          ))}
          {[120, 240, 360, 480, 600].map((gx) => (
            <line
              key={`lon-${gx}`}
              x1={gx}
              y1={0}
              x2={gx}
              y2={360}
              stroke="#e2e8f0"
              strokeWidth={1}
              strokeDasharray={gx === 360 ? undefined : '4 4'}
            />
          ))}

          {/* Continents */}
          <g fill="#e2e8f0" stroke="#cbd5e1" strokeWidth={1}>
            {CONTINENT_PATHS.map((d, idx) => (
              <path key={idx} d={d} />
            ))}
          </g>

          {/* Coordinate Crosshair & Pin */}
          {hasCoords && (
            <g>
              <line
                x1={x}
                y1={0}
                x2={x}
                y2={360}
                stroke="#1e40af"
                strokeOpacity={0.22}
                strokeWidth={1}
              />
              <line
                x1={0}
                y1={y}
                x2={720}
                y2={y}
                stroke="#1e40af"
                strokeOpacity={0.22}
                strokeWidth={1}
              />
              <circle cx={x} cy={y} r={14} fill="#1e40af" fillOpacity={0.14} />
              <circle cx={x} cy={y} r={5.5} fill="#1e40af" stroke="#ffffff" strokeWidth={2} />
            </g>
          )}
        </svg>
      </div>

      <div className="px-4 py-2.5 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <span className="font-mono tabular-nums text-slate-900">
          {formatCoordinates(latitude, longitude)}
        </span>
        <span>
          {hasCoords
            ? [city, country].filter(Boolean).join(', ') || 'Approximate IP Geolocation'
            : 'No public coordinates'}
        </span>
      </div>
    </div>
  );
}
