/**
 * Helper to safely access environment variables in either Vite or Bun environments
 */
export const safeEnv = (key: string, fallback: string = ''): string => {
  try {
    // Try Vite's import.meta.env
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      return (import.meta as any).env[key] || fallback;
    }
    
    // Try Node/Bun's process.env
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] || fallback;
    }

    // Try Bun.env
    if (typeof Bun !== 'undefined' && (Bun as any).env) {
      return (Bun as any).env[key] || fallback;
    }
  } catch (e) {
    // Fallback to default
  }
  return fallback;
};
