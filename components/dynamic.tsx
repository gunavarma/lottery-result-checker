'use client';

import React, { useEffect, useState } from 'react';

type LoadedComponent = React.ComponentType<any>;

/**
 * Client-only lazy loader, replacing `next/dynamic`.
 *
 * Astro has its own answer for *page-level* lazy boundaries — `client:only` on
 * an island — and the root chrome uses that. This shim exists for the case Astro
 * cannot express: a lazy boundary *nested inside* an island, where the module
 * must not merely load later but must never be rendered during SSR.
 *
 * `TicketChecker` uses it for the camera-based QR scanner, which touches
 * `navigator.mediaDevices` at import/render time and would therefore throw if
 * Astro server-rendered it. Returning `null` until the effect runs reproduces
 * `next/dynamic`'s `{ ssr: false }` contract exactly.
 *
 * The loader may resolve either to a module whose named export is the component
 * (`() => import('x').then((m) => m.Thing)`) or to a module namespace object, in
 * which case the first function export is used — that covers both shapes used
 * across the app.
 */
export interface DynamicOptions {
  /** Retained for API compatibility. This shim is always client-only. */
  ssr?: boolean;
  /** Named export to use when the loader resolves to a module namespace. */
  name?: string;
}

export function dynamic(
  loader: () => Promise<any>,
  options: DynamicOptions = {}
): LoadedComponent {
  function Dynamic(props: Record<string, unknown>) {
    const [Loaded, setLoaded] = useState<LoadedComponent | null>(null);

    useEffect(() => {
      let cancelled = false;

      loader()
        .then((mod) => {
          if (cancelled) return;
          const resolved = resolveComponent(mod, options.name);
          if (resolved) setLoaded(() => resolved);
        })
        .catch((error) => {
          console.error('[dynamic] Failed to load the lazily imported module:', error);
        });

      return () => {
        cancelled = true;
      };
      // `loader` and `options.name` are module-level constants at every call site.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!Loaded) return null;
    return <Loaded {...props} />;
  }

  return Dynamic;
}

function resolveComponent(mod: any, name?: string): LoadedComponent | null {
  if (!mod) return null;
  if (typeof mod === 'function') return mod;
  if (name && typeof mod[name] === 'function') return mod[name];
  if (typeof mod.default === 'function') return mod.default;

  for (const value of Object.values(mod)) {
    if (typeof value === 'function') return value as LoadedComponent;
  }
  return null;
}

export default dynamic;
