import type { Lang } from '../lib/lang';
import type { Strings } from '../lib/i18n';
import { formatNumber, niceStep } from '../lib/numbers';
import { depthOfField, horizontalFov } from '../lib/optics';
import type { Sensor } from '../lib/sensors';
import { COLORS } from '../lib/scene3d';
import type { Scene } from '../lib/types';

export interface MapSensor {
  index: number;
  sensor: Sensor;
  color: string;
}

interface Props {
  sensors: MapSensor[];
  scene: Scene;
  lang: Lang;
  t: Strings;
  /** Title for a small-multiple map. */
  caption?: string;
  compact?: boolean;
}

const W = 1000;
const PAD_L = 28;
const PAD_R = 12;

/** Top-down map: each sensor's field of view as a wedge, its depth of field as a band inside it. */
export default function DofMap({ sensors, scene, lang, t, caption, compact = false }: Props) {
  const H = compact ? 300 : 380;
  const AXIS = H - 34; // space for the distance ruler
  const cy = AXIS / 2;
  const k = (W - PAD_L - PAD_R) / scene.mapSize; // px per metre
  const X = (m: number) => PAD_L + m * k;
  const clipId = `map-clip-${caption ? sensors.map((s) => s.index).join('-') : 'all'}`;
  const tick = niceStep(scene.mapSize / (compact ? 5 : 10));
  const ticks: number[] = [];
  for (let m = 0; m <= scene.mapSize + 1e-9; m += tick) ticks.push(m);
  const subjectR = Math.max((scene.size / 2) * k, 3);

  return (
    <figure className={`dof-map${compact ? ' is-compact' : ''}`}>
      {caption && <figcaption>{caption}</figcaption>}
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={caption ? `${t.mapAria}: ${caption}` : t.mapAria}>
        <defs>
          <clipPath id={clipId}>
            <rect x={0} y={0} width={W} height={AXIS} />
          </clipPath>
          <pattern id={`${clipId}-grid`} width={tick * k} height={tick * k} patternUnits="userSpaceOnUse" x={PAD_L} y={cy}>
            <path d={`M ${tick * k} 0 L 0 0 0 ${tick * k}`} className="map-grid" />
          </pattern>
        </defs>
        <rect x={0} y={0} width={W} height={AXIS} className="map-ground" />
        <rect x={0} y={0} width={W} height={AXIS} fill={`url(#${clipId}-grid)`} />
        <line x1={0} x2={W} y1={cy} y2={cy} className="map-axis" />

        <g clipPath={`url(#${clipId})`}>
          {sensors.map(({ index, sensor, color }) => {
            const cx = X(sensor.position);
            const tan = Math.tan(horizontalFov(sensor.focal, sensor.crop) / 2);
            const end = W + 50;
            const spread = (x: number) => (x - cx) * tan;
            const dof = depthOfField(sensor, scene.focus - sensor.position);
            const nearX = dof ? cx + dof.near * k : 0;
            const farX = dof ? (dof.far === Infinity ? end : Math.min(cx + dof.far * k, end)) : 0;
            return (
              <g key={index} data-testid={`map-sensor-${index}`} style={{ color }}>
                <polygon
                  points={`${cx},${cy} ${end},${cy - spread(end)} ${end},${cy + spread(end)}`}
                  className="map-fov"
                />
                {dof && (
                  <>
                    <polygon
                      points={`${nearX},${cy - spread(nearX)} ${farX},${cy - spread(farX)} ${farX},${cy + spread(farX)} ${nearX},${cy + spread(nearX)}`}
                      className="map-dof"
                    />
                    <line x1={nearX} x2={nearX} y1={cy - spread(nearX)} y2={cy + spread(nearX)} className="map-limit" />
                    {dof.far !== Infinity && (
                      <line x1={farX} x2={farX} y1={cy - spread(farX)} y2={cy + spread(farX)} className="map-limit" />
                    )}
                  </>
                )}
              </g>
            );
          })}
        </g>

        <circle cx={X(scene.focus)} cy={cy} r={subjectR} fill={COLORS.subject} className="map-subject">
          <title>{t.subject}</title>
        </circle>

        {sensors.map(({ index, sensor, color }) => (
          <g key={index} transform={`translate(${X(sensor.position)} ${cy})`} className="map-camera" style={{ color }}>
            <title>
              {t.camera}: {t.sensor(index + 1)}
            </title>
            <rect x={-16} y={-9} width={16} height={18} rx={3} />
            <path d="M 0 -5 L 7 -8 L 7 8 L 0 5 Z" />
          </g>
        ))}

        <g className="map-ruler">
          <line x1={PAD_L} x2={W - PAD_R} y1={AXIS + 8} y2={AXIS + 8} />
          {ticks.map((m) => (
            <g key={m} transform={`translate(${X(m)} ${AXIS + 8})`}>
              <line y1={0} y2={6} />
              <text y={22} textAnchor={m === 0 ? 'start' : 'middle'}>
                {formatNumber(m, lang, 2)}
                {m === 0 ? ` ${t.unitM}` : ''}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </figure>
  );
}
