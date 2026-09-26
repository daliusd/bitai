import type { ReactNode } from 'react';
import type { Effect } from '../lib/interventions';
import type { Source } from '../lib/sources';
import { formatDelta } from '../lib/units';

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
  control: ReactNode;
  children: ReactNode;
  sources: Source[];
  limitations: string[];
}

export function EffectLine({ effect }: { effect: Effect }) {
  const parts = [
    ['sistolinis', formatDelta(effect.sys, 1)],
    ['diastolinis', formatDelta(effect.dia, 1)],
  ]
    .filter(([, text]) => /^[+−]/.test(text))
    .map(([name, text]) => `${name} ${text} mmHg`);
  return (
    <p className="effect" data-testid="effect">
      {parts.length === 0
        ? 'Pasirinkite pokytį, kad pamatytumėte numatomą poveikį.'
        : `Numatomas poveikis: ${parts.join(', ')}`}
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
      <EffectLine effect={props.effect} />
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
