import { describe, expect, it } from 'vitest';
import { langFromSearch, urlWithLang } from './lang';

describe('langFromSearch', () => {
  it('reads the lang parameter', () => {
    expect(langFromSearch('?lang=en')).toBe('en');
    expect(langFromSearch('?lang=lt')).toBe('lt');
    expect(langFromSearch('?foo=1&lang=EN')).toBe('en');
  });

  it('falls back to Lithuanian', () => {
    expect(langFromSearch('')).toBe('lt');
    expect(langFromSearch('?lang=de')).toBe('lt');
  });
});

describe('urlWithLang', () => {
  it('sets the parameter and keeps the rest of the URL', () => {
    expect(urlWithLang('https://bitai.ffff.lt/ryskumo-gylis/?x=1#map', 'en')).toBe('/ryskumo-gylis/?x=1&lang=en#map');
    expect(urlWithLang('https://bitai.ffff.lt/ryskumo-gylis/?lang=en', 'lt')).toBe('/ryskumo-gylis/?lang=lt');
  });
});
