/**
 * Common entity types
 */

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface AuditInfo extends Timestamps {
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string;
}

export interface TenantEntity {
  tenantId: string;
  organizationId?: string;
}

export interface SoftDelete {
  isDeleted: boolean;
  deletedAt?: Date;
}

export interface Versioned {
  version: number;
}

export interface Tagged {
  tags: string[];
}

export interface Metadata {
  metadata: Record<string, any>;
}
