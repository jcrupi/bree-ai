export const API_BASE = import.meta.env.VITE_API_URL || 'https://bree-api.fly.dev';

export function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('bree_jwt');
  return token
    ? { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}
