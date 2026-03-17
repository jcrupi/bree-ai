/**
 * FlySaaS CRM Types
 * FatCRM core data structures
 */

export interface Contact {
  id: string;
  org_id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  created_at: Date;
  updated_at?: Date;
}

export interface Deal {
  id: string;
  org_id: string;
  contact_id?: string;
  title: string;
  amount?: number;
  stage: DealStage;
  probability?: number;
  expected_close_date?: Date;
  created_at: Date;
  updated_at?: Date;
}

export type DealStage =
  | 'lead'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

export interface Feature {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  code: string;
  enabled: boolean;
  created_at: Date;
  updated_at?: Date;
}

export interface AIGenerationRequest {
  prompt: string;
  context?: Record<string, any>;
}

export interface AIGenerationResponse {
  feature_id: string;
  code: string;
  status: 'deployed' | 'pending' | 'failed';
  error?: string;
}
