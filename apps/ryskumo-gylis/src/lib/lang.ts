import { useEffect, useState } from 'react';

export type Lang = 'lt' | 'en';
export const LANGS: Lang[] = ['lt', 'en'];
/** The site is Lithuanian first; English is one `?lang=en` away. */
export const DEFAULT_LANG: Lang = 'lt';

/** Reads `?lang=` from a query string. Unknown or missing values give the default language. */
export function langFromSearch(search: string): Lang {
  const value = new URLSearchParams(search).get('lang')?.trim().toLowerCase();
  return LANGS.find((l) => l === value) ?? DEFAULT_LANG;
}

/** The current URL with `?lang=` set, keeping other query parameters and the hash. */
export function urlWithLang(href: string, lang: Lang): string {
  const url = new URL(href);
  url.searchParams.set('lang', lang);
  return url.pathname + url.search + url.hash;
}

/** The page language, kept in sync with the address bar so links can be shared. */
export function useLang() {
  const [lang, setLangState] = useState<Lang>(() => langFromSearch(window.location.search));

  useEffect(() => {
    const onPop = () => setLangState(langFromSearch(window.location.search));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next: Lang) => {
    window.history.pushState(null, '', urlWithLang(window.location.href, next));
    setLangState(next);
  };

  return [lang, setLang] as const;
}
