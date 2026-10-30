import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

// La clave se repite en el script de index.html, que aplica el tema antes de pintar.
const STORAGE_KEY = 'theme';

const listeners = new Set<() => void>();

function getTheme(): Theme {
  return document.documentElement.dataset.theme as Theme;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  const color = getComputedStyle(root).getPropertyValue('--color-background').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
  listeners.forEach((listener) => listener());
}

// Mientras el usuario no elija un tema, la app sigue al dispositivo.
export function initTheme() {
  applyTheme(getTheme());
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
    if (!localStorage.getItem(STORAGE_KEY)) applyTheme(event.matches ? 'dark' : 'light');
  });
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme);
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  };
  return { theme, toggleTheme };
}
