import type { CSSProperties } from 'react';
import type { Lang } from '../lib/lang';
import type { Strings } from '../lib/i18n';
import type { Sensor } from '../lib/sensors';
import type { Options, Scene } from '../lib/types';
import BlurView from './BlurView';
import Toggle from './Toggle';

interface Props {
  sensors: Sensor[];
  colors: string[];
  scene: Scene;
  options: Options;
  lang: Lang;
  t: Strings;
  onOptions: (patch: Partial<Options>) => void;
}

/** Picks which camera's photo to show, or shows them all side by side. */
export default function BlurViewer({ sensors, colors, scene, options, lang, t, onOptions }: Props) {
  const enabled = sensors.flatMap((sensor, index) => (sensor.enabled ? [{ sensor, index }] : []));
  if (enabled.length === 0) return <p className="empty">{t.noSensors}</p>;

  const selected =
    options.view === 'all' && enabled.length > 1
      ? 'all'
      : (enabled.find((e) => e.index === options.view) ?? enabled[0]).index;
  const shown = selected === 'all' ? enabled : enabled.filter((e) => e.index === selected);

  return (
    <div className="blur-viewer">
      <div className="viewer-bar">
        <div className="tabs" role="radiogroup" aria-label={t.viewTitle}>
          {enabled.map(({ index }) => (
            <label
              key={index}
              className={`tab${selected === index ? ' selected' : ''}`}
              style={{ '--sensor': colors[index] } as CSSProperties}
            >
              <input
                type="radio"
                name="view"
                checked={selected === index}
                onChange={() => onOptions({ view: index })}
              />
              <span className="sensor-dot" aria-hidden="true" />
              {t.sensor(index + 1)}
            </label>
          ))}
          {enabled.length > 1 && (
            <label className={`tab${selected === 'all' ? ' selected' : ''}`}>
              <input type="radio" name="view" checked={selected === 'all'} onChange={() => onOptions({ view: 'all' })} />
              {t.compareAll}
            </label>
          )}
        </div>
        <Toggle label={t.showZone} checked={options.showZone} onChange={(showZone) => onOptions({ showZone })} />
      </div>

      <div className={`blur-grid${selected === 'all' ? ' is-grid' : ''}`}>
        {shown.map(({ sensor, index }) => (
          <BlurView
            key={index}
            index={index}
            sensor={sensor}
            color={colors[index]}
            scene={scene}
            showZone={options.showZone}
            lang={lang}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}
