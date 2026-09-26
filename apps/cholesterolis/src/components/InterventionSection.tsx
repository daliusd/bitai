import type { ReactNode } from 'react';
import type { Effect } from '../lib/interventions';
import { resolveEffect } from '../lib/interventions';
import type { Lipids, Marker, Unit } from '../lib/types';
import type { Source } from '../lib/sources';
import { MARKER_SHORT } from '../lib/reference';
import { formatDelta, formatNumber, unitLabel } from '../lib/units';

export type Certainty = 'high' | 'medium' | 'low';

const CERTAINTY_LABELS: Record<Certainty, string> = {
  high: 'Įrodymai stiprūs',
  medium: 'Įrodymai vidutiniai',
  low: 'Įrodymai silpni',
};

interface Props {
  id: string;
  title: string;
  certainty: Certainty;
  effect: Effect;
  unit: Unit;
  base?: Lipids;
  control: ReactNode;
  children: ReactNode;
  sources: Source[];
  limitations: string[];
}

export function effectParts(effect: Effect, unit: Unit, base?: Lipids): string[] {
  const u = unitLabel(unit);
  const parts: string[] = [];
  // Without a known baseline, relative changes can only be shown as percentages.
  const ldlRelative = effect.ldlPct !== undefined && !base;
  const tgRelative = effect.tgPct !== undefined && !base;
  if (ldlRelative) parts.push(`MTL −${formatNumber(Math.abs(effect.ldlPct!) * 100, 0)} %`);
  if (tgRelative) parts.push(`TG −${formatNumber(Math.abs(effect.tgPct!) * 100, 0)} %`);

  const r = resolveEffect(effect, base ?? { ldl: 0, tg: 0 });
  for (const m of ['tc', 'ldl', 'hdl', 'tg'] as Marker[]) {
    if ((ldlRelative || tgRelative) && m === 'tc') continue;
    if ((ldlRelative && m === 'ldl') || (tgRelative && m === 'tg')) continue;
    const text = formatDelta(m, r[m], unit);
    if (/^[+−]/.test(text)) parts.push(`${MARKER_SHORT[m]} ${text} ${u}`);
  }
  return parts;
}

export function EffectLine({ effect, unit, base }: { effect: Effect; unit: Unit; base?: Lipids }) {
  const parts = effectParts(effect, unit, base);
  return (
    <p className="effect" data-testid="effect">
      {parts.length === 0 ? 'Pasirinkite pokytį, kad pamatytumėte numatomą poveikį.' : `Numatomas poveikis: ${parts.join(', ')}`}
    </p>
  );
}

export function SourceList({ sources }: { sources: Source[] }) {
  return (
    <ul className="sources">
      {sources.map((s) => (
        <li key={s.url}>
          <a href={s.url} target="_blank" rel="noopener noreferrer">
            {s.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function InterventionSection(props: Props) {
  const headingId = `lever-${props.id}`;
  return (
    <section className="lever" aria-labelledby={headingId}>
      <header className="lever-head">
        <h3 id={headingId}>{props.title}</h3>
        <span className={`certainty certainty-${props.certainty}`}>{CERTAINTY_LABELS[props.certainty]}</span>
      </header>
      <div className="lever-control">{props.control}</div>
      <EffectLine effect={props.effect} unit={props.unit} base={props.base} />
      <div className="lever-body">{props.children}</div>
      <details>
        <summary>Ribojimai ir rizikos</summary>
        <ul>
          {props.limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </details>
      <details>
        <summary>Moksliniai šaltiniai</summary>
        <SourceList sources={props.sources} />
      </details>
    </section>
  );
}
