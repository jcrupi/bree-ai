/**
 * Shared TypeScript types for BREE AI monorepo
 */

// Common API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Common Entity Types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseEntity {
  email: string;
  name?: string;
  role: UserRole;
}

export enum UserRole {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest'
}

// Common Status Types
export type Status = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface Task extends BaseEntity {
  title: string;
  description?: string;
  status: Status;
  assigneeId?: string;
  dueDate?: Date;
}

// NATS Message Types
export interface NatsMessage<T = any> {
  subject: string;
  data: T;
  timestamp: number;
  correlationId?: string;
}

// Math AI Types
export interface MathVariable {
  name: string;
  value: number;
  unit?: string;
}

export interface CalculationResult {
  result: number;
  variables: Record<string, number>;
  steps?: string[];
}

// Utility Types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Export all types
export * from './api';
export * from './entities';
