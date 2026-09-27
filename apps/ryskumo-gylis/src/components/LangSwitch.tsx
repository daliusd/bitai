import { LANGS } from '../lib/lang';
import type { Lang } from '../lib/lang';

interface Props {
  lang: Lang;
  label: string;
  onChange: (lang: Lang) => void;
}

const NAMES: Record<Lang, string> = { lt: 'Lietuvių', en: 'English' };

/** Real links (?lang=…) so the choice can be bookmarked or opened in a new tab. */
export default function LangSwitch({ lang, label, onChange }: Props) {
  return (
    <nav className="lang-switch" aria-label={label}>
      {LANGS.map((l) => (
        <a
          key={l}
          href={`?lang=${l}`}
          hrefLang={l}
          lang={l}
          title={NAMES[l]}
          aria-current={l === lang ? 'true' : undefined}
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            onChange(l);
          }}
        >
          {l.toUpperCase()}
        </a>
      ))}
    </nav>
  );
}
