import {
  LayoutTemplate,
  PenTool,
  Server,
  MessageSquare,
  Database,
  Shield,
  Scale,
  Terminal,
  LucideIcon } from
'lucide-react';

import { SpecialtyType } from '../types';
export type { SpecialtyType } from '../types';

export interface SpecialtyConfig {
  id: SpecialtyType;
  name: string;
  color: string;
  bgColor: string;
  icon: LucideIcon;
}

export const SPECIALTIES: Record<SpecialtyType, SpecialtyConfig> = {
  ui: {
    id: 'ui',
    name: 'UI',
    color: '#3B82F6', // Blue
    bgColor: '#EFF6FF',
    icon: LayoutTemplate
  },
  ux: {
    id: 'ux',
    name: 'UX',
    color: '#EC4899', // Pink
    bgColor: '#FDF2F8',
    icon: PenTool
  },
  backend: {
    id: 'backend',
    name: 'Backend',
    color: '#10B981', // Emerald
    bgColor: '#ECFDF5',
    icon: Server
  },
  messaging: {
    id: 'messaging',
    name: 'Messaging',
    color: '#F59E0B', // Amber
    bgColor: '#FFFBEB',
    icon: MessageSquare
  },
  database: {
    id: 'database',
    name: 'Database',
    color: '#6366F1', // Indigo
    bgColor: '#EEF2FF',
    icon: Database
  },
  security: {
    id: 'security',
    name: 'Security',
    color: '#EF4444', // Red
    bgColor: '#FEF2F2',
    icon: Shield
  },
  governance: {
    id: 'governance',
    name: 'Governance',
    color: '#64748B', // Slate
    bgColor: '#F8FAFC',
    icon: Scale
  },
  devops: {
    id: 'devops',
    name: 'DevOps',
    color: '#F97316', // Orange
    bgColor: '#FFF7ED',
    icon: Terminal
  }
};