import { useEffect, useState } from 'react';

/**
 * Tiny hash-based router. Avoids adding react-router-dom while still letting
 * us share URLs to /privacy, /terms, /admin.
 */

export function getRoute(): string {
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw || raw === '/') return '/';
  return raw.startsWith('/') ? raw : `/${raw}`;
}

export function useRoute(): string {
  const [route, setRoute] = useState<string>(() => getRoute());
  useEffect(() => {
    const handler = () => setRoute(getRoute());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  return route;
}

export function navigate(path: string): void {
  const target = path.startsWith('/') ? path : `/${path}`;
  if (window.location.hash === `#${target}`) return;
  window.location.hash = target;
}
