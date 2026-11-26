import { useCallback, useEffect, useState } from 'react';

// One font list per script. Each list holds the 5 most-used Google Fonts for
// that script; `defaultFont: null` means the site's system stack (no webfont
// is loaded, so the page looks exactly as before until the user picks one).
export const SCRIPT_GROUPS = {
  latin: {
    label: 'Latin',
    rtl: false,
    fallback: 'ui-sans-serif, system-ui, sans-serif',
    defaultFont: null,
    fonts: ['Inter', 'Roboto', 'Open Sans', 'Lora', 'Merriweather'],
  },
  arabic: {
    label: 'Arabic',
    rtl: true,
    fallback: 'serif',
    defaultFont: 'Noto Nastaliq Urdu',
    fonts: ['Noto Nastaliq Urdu', 'Noto Naskh Arabic', 'Gulzar', 'Amiri', 'Almarai'],
  },
  devanagari: {
    label: 'Devanagari',
    rtl: false,
    fallback: 'sans-serif',
    defaultFont: 'Noto Sans Devanagari',
    fonts: ['Noto Sans Devanagari', 'Tiro Devanagari Hindi', 'Rozha One', 'Yatra One', 'Baloo 2'],
  },
  bengali: {
    label: 'Bengali',
    rtl: false,
    fallback: 'sans-serif',
    defaultFont: 'Noto Sans Bengali',
    fonts: ['Noto Sans Bengali', 'Noto Serif Bengali', 'Baloo Da 2', 'Hind Siliguri', 'Anek Bangla'],
  },
  cyrillic: {
    label: 'Cyrillic',
    rtl: false,
    fallback: 'ui-sans-serif, system-ui, sans-serif',
    defaultFont: null,
    // The five Latin fonts all ship Cyrillic subsets, so they cover Russian.
    fonts: ['Inter', 'Roboto', 'Open Sans', 'Lora', 'Merriweather'],
  },
  chinese: {
    label: 'Chinese',
    rtl: false,
    fallback: 'sans-serif',
    defaultFont: 'Noto Sans SC',
    fonts: ['Noto Sans SC', 'Noto Serif SC', 'ZCOOL XiaoWei', 'Ma Shan Zheng', 'Zhi Mang Xing'],
  },
  japanese: {
    label: 'Japanese',
    rtl: false,
    fallback: 'sans-serif',
    defaultFont: 'Noto Sans JP',
    fonts: ['Noto Sans JP', 'Noto Serif JP', 'Zen Kaku Gothic New', 'Shippori Mincho', 'Kosugi Maru'],
  },
  korean: {
    label: 'Korean',
    rtl: false,
    fallback: 'sans-serif',
    defaultFont: 'Noto Sans KR',
    fonts: ['Noto Sans KR', 'Noto Serif KR', 'Gowun Dodum', 'Gowun Batang', 'Black Han Sans'],
  },
};

// Generation languages (Generator.jsx) + blog post `language` frontmatter.
export const LANGUAGE_SCRIPT = {
  english_us: 'latin', english_uk: 'latin',
  roman_urdu_karachi: 'latin', roman_urdu_lahore: 'latin',
  arabic_msa: 'arabic', arabic_gulf: 'arabic', persian: 'arabic',
  spanish_latam: 'latin', spanish_spain: 'latin', french: 'latin',
  german: 'latin', portuguese_brazil: 'latin', italian: 'latin',
  dutch: 'latin', turkish: 'latin', indonesian: 'latin', swahili: 'latin',
  russian: 'cyrillic',
  hindi: 'devanagari', bengali: 'bengali',
  chinese_simplified: 'chinese', japanese: 'japanese', korean: 'korean',
  english: 'latin', 'roman-urdu': 'latin', urdu: 'arabic',
};

export const scriptOf = (language) => LANGUAGE_SCRIPT[language] || 'latin';
export const groupOf = (script) => SCRIPT_GROUPS[script] || SCRIPT_GROUPS.latin;

const storageKey = (script) => `penlix-font-${script}`;

export function getFontChoice(script) {
  try {
    const saved = localStorage.getItem(storageKey(script));
    return saved && groupOf(script).fonts.includes(saved) ? saved : null;
  } catch {
    return null;
  }
}

export function resolveFont(script) {
  return getFontChoice(script) || groupOf(script).defaultFont;
}

export function fontStack(script, family) {
  const group = groupOf(script);
  return family ? `'${family}', ${group.fallback}` : group.fallback;
}

export function googleFontsUrl(family) {
  return `https://fonts.googleapis.com/css2?family=${family.split(' ').join('+')}&display=swap`;
}

// Loads a font on demand — only the chosen/default font is ever fetched,
// never the whole list.
const loadedFonts = new Set();
export function ensureFontLoaded(family) {
  if (!family || loadedFonts.has(family) || typeof document === 'undefined') return;
  loadedFonts.add(family);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = googleFontsUrl(family);
  document.head.appendChild(link);
}

// Content font for one script: persisted choice, on-demand loading, and the
// CSS values (stack, direction, line height) a reader needs. RTL scripts
// (Urdu, Arabic, Persian) get a taller line height — Nastaliq needs it.
export function useContentFont(script) {
  const group = groupOf(script);
  const [font, setFontState] = useState(() => resolveFont(script));
  useEffect(() => { setFontState(resolveFont(script)); }, [script]);
  useEffect(() => { ensureFontLoaded(font); }, [font]);
  const setFont = useCallback((name) => {
    try { localStorage.setItem(storageKey(script), name || ''); } catch {}
    setFontState(name || group.defaultFont);
  }, [script, group.defaultFont]);
  return {
    font, setFont,
    fonts: group.fonts,
    stack: fontStack(script, font),
    dir: group.rtl ? 'rtl' : 'ltr',
    lineHeight: group.rtl ? 2 : undefined,
  };
}
