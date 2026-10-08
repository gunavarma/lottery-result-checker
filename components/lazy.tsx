import React, { useEffect, useState } from 'react';

type LoadedComponent = React.ComponentType<any>;

/**
 * Client-only lazy loader for a module that must never be server-rendered.
 *
 * Astro's `client:only` covers the page-level case; this covers the one Astro
 * cannot express — a lazy boundary *nested inside* an island. The camera-based
 * QR scanner is the reason it exists: it touches `navigator.mediaDevices` at
 * import time, so it must not merely load later but must never render during
 * SSR. Returning `null` until the effect runs is what guarantees that.
 *
 * The loader may resolve either to the component (`() => import('x').then((m) =>
 * m.Thing)`) or to a module namespace object, in which case its default export
 * or first function export is used.
 */
export function lazy(loader: () => Promise<any>): LoadedComponent {
  function Lazy(props: Record<string, unknown>) {
    const [Loaded, setLoaded] = useState<LoadedComponent | null>(null);

    useEffect(() => {
      let cancelled = false;

      loader()
        .then((mod) => {
          if (cancelled) return;
          const resolved = resolveComponent(mod);
          if (resolved) setLoaded(() => resolved);
        })
        .catch((error) => {
          console.error('[lazy] Failed to load the lazily imported module:', error);
        });

      return () => {
        cancelled = true;
      };
      // `loader` is a module-level constant at every call site, so it is stable
      // and intentionally not a dependency.
    }, []);

    if (!Loaded) return null;
    return <Loaded {...props} />;
  }

  return Lazy;
}

function resolveComponent(mod: any): LoadedComponent | null {
  if (!mod) return null;
  if (typeof mod === 'function') return mod;
  if (typeof mod.default === 'function') return mod.default;

  for (const value of Object.values(mod)) {
    if (typeof value === 'function') return value as LoadedComponent;
  }
  return null;
}

export default lazy;
