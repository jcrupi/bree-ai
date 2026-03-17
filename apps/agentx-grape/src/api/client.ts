import { edenTreaty } from '@elysiajs/eden';
import type { App } from '../../../api/src/index';

const url = import.meta.env.VITE_API_URL || '/';
export const api = edenTreaty<App>(url);
