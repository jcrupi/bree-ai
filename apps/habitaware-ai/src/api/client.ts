import { edenTreaty } from '@elysiajs/eden';
import type { App as APIApp } from '../../../api/src/index';

const url = import.meta.env.VITE_API_URL || '/';
export const api = edenTreaty<APIApp>(url);
