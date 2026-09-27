import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Lang } from '../lib/lang';
import type { Strings } from '../lib/i18n';
import { formatDistance, formatNumber } from '../lib/numbers';
import { ASPECT, depthOfField } from '../lib/optics';
import { renderScene } from '../lib/render3d';
import { buildScene } from '../lib/scene3d';
import type { Sensor } from '../lib/sensors';
import type { Scene } from '../lib/types';

interface Props {
  index: number;
  sensor: Sensor;
  color: string;
  scene: Scene;
  showZone: boolean;
  lang: Lang;
  t: Strings;
}

/** Width of the element in CSS pixels, tracked as it resizes. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** The scene as this camera would photograph it, with physically sized blur. */
export default function BlurView({ index, sensor, color, scene, showZone, lang, t }: Props) {
  const [frameRef, width] = useWidth<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const name = t.sensor(index + 1);
  const distance = scene.focus - sensor.position;
  const dof = depthOfField(sensor, distance);
  const inFront = dof !== undefined;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width || !inFront) return;
    // Render at device resolution, capped so side-by-side views stay quick.
    const px = Math.round(width * Math.min(window.devicePixelRatio || 1, 2));
    const frame = requestAnimationFrame(() => {
      const view = buildScene(
        { ...sensor, focus: scene.focus, size: scene.size, width: px, showZone },
        (m) => `${formatNumber(m, lang, 2)} m`,
      );
      if (view) renderScene(canvas, view);
    });
    return () => cancelAnimationFrame(frame);
  }, [width, sensor, scene.focus, scene.size, showZone, lang, inFront]);

  return (
    <figure className="blur-view" style={{ '--sensor': color } as CSSProperties} data-testid={`blur-view-${index}`}>
      <div className="blur-frame" ref={frameRef} style={{ aspectRatio: `${ASPECT}` }}>
        {dof ? (
          <canvas ref={canvasRef} role="img" aria-label={t.viewAria(name)} />
        ) : (
          <p className="blur-empty">{t.behindCamera}</p>
        )}
      </div>
      <figcaption>
        <span className="blur-name">
          <span className="sensor-dot" aria-hidden="true" />
          {name} · {t.formats[sensor.format]}
        </span>
        <span className="blur-lens">
          {formatNumber(sensor.focal, lang, 1)} mm · f/{formatNumber(sensor.fNumber, lang, 1)}
        </span>
        {dof && (
          <span className="blur-zone">
            {t.sharpZone(
              `${formatDistance(dof.near, lang)} ${t.unitM}`,
              dof.far === Infinity ? '∞' : `${formatDistance(dof.far, lang)} ${t.unitM}`,
            )}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
