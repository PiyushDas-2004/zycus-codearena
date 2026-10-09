/**
 * Colour theme. Dark mode exists only inside the exam workspace (the candidate's editor
 * preference, remembered on this device); every other page is always light. The dark palette
 * lives in tokens.css under `:root[data-theme='dark']`.
 */
export type ThemeName = 'light' | 'dark';

const KEY = 'codearena.theme';

export function loadTheme(): ThemeName {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function saveTheme(theme: ThemeName) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* private mode: the choice lasts for this page only */
  }
}

/** Switches the page's colours. Pages other than the workspace never call this with 'dark'. */
export function applyTheme(theme: ThemeName) {
  if (theme === 'dark') document.documentElement.dataset.theme = 'dark';
  else delete document.documentElement.dataset.theme;
}
