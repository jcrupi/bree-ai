/**
 * Helper to safely access environment variables.
 *
 * Resolution order:
 *  1. window.__BREE_CONFIG__  — runtime config injected by docker-entrypoint.sh
 *                               (enables `fly secrets set` without a rebuild)
 *  2. import.meta.env         — Vite build-time baked values (local dev)
 *  3. process.env / Bun.env   — server-side (API services)
 */

// Strip the VITE_ prefix to get the config key used in window.__BREE_CONFIG__
const toConfigKey = (key: string): string =>
  key.startsWith('VITE_') ? key.slice(5) : key;

export const safeEnv = (key: string, fallback: string = ''): string => {
  try {
    // 1. Runtime window config (production containers)
    if (typeof window !== 'undefined' && (window as any).__BREE_CONFIG__) {
      const val = (window as any).__BREE_CONFIG__[toConfigKey(key)];
      if (val) return val;
    }

    // 2. Vite build-time env (local dev)
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const val = (import.meta as any).env[key];
      if (val) return val;
    }

    // 3. Node / Bun server-side env
    if (typeof process !== 'undefined' && process.env) {
      const val = process.env[key];
      if (val) return val;
    }
    if (typeof Bun !== 'undefined' && (Bun as any).env) {
      const val = (Bun as any).env[key];
      if (val) return val;
    }
  } catch (e) {
    // fall through to default
  }
  return fallback;
};
