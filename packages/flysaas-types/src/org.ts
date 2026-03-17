/**
 * FlySaaS Organization Types
 * Core organization and multi-tenancy structures
 */

export interface Organization {
  id: string;
  slug: string;              // e.g., "corp-ai"
  name: string;              // e.g., "Corp AI Inc."
  fly_app_name: string;      // e.g., "flysaas-corp-ai"
  fly_machine_id?: string;
  status: OrganizationStatus;
  created_at: Date;
  updated_at?: Date;
}

export type OrganizationStatus =
  | 'provisioning'
  | 'active'
  | 'suspended'
  | 'deleted';

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: Date;
  updated_at?: Date;
}

export interface OrgMember {
  org_id: string;
  user_id: string;
  role: OrgRole;
  created_at: Date;
}

export type OrgRole =
  | 'owner'
  | 'admin'
  | 'member'
  | 'viewer';

export interface ProvisioningRequest {
  org_slug: string;
  org_name: string;
  region?: string;
  owner_user_id: string;
}

export interface FlyMachine {
  id: string;
  app_name: string;
  state: string;
  region: string;
  created_at: string;
}
