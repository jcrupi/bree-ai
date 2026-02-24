/**
 * Built-in Schemas for AntiMatterDB
 */

import type { Schema, SchemaCollection } from '../types';

/**
 * Organization Schema
 * Defines hierarchical organization structure with super-orgs and nested orgs
 */
export const OrganizationSchema: Schema = {
  id: crypto.randomUUID(),
  name: 'organization',
  version: '1.0.0',
  description: 'Hierarchical organization structure with nested orgs and members',
  createdAt: new Date(),
  collections: {
    orgs: {
      name: 'orgs',
      description: 'Top-level organizations',
      fields: [
        {
          name: 'name',
          type: 'string',
          required: true,
          description: 'Organization name',
        },
        {
          name: 'description',
          type: 'string',
          description: 'Organization description',
        },
        {
          name: 'uuid',
          type: 'string',
          required: true,
          description: 'Unique organization identifier',
        },
        {
          name: 'status',
          type: 'string',
          description: 'Organization status (active, inactive, archived)',
        },
      ],
      subcollections: [
        {
          name: 'members',
          schema: 'member',
          description: 'Organization members',
        },
        {
          name: 'teams',
          schema: 'team',
          description: 'Organization teams',
        },
      ],
    },
  },
};

/**
 * Member Schema
 * Defines user/member structure within organizations
 */
export const MemberSchema: Schema = {
  id: crypto.randomUUID(),
  name: 'member',
  version: '1.0.0',
  description: 'Organization member with role and permission information',
  createdAt: new Date(),
  collections: {
    members: {
      name: 'members',
      description: 'Members of an organization',
      fields: [
        {
          name: 'name',
          type: 'string',
          required: true,
          description: 'Member name',
        },
        {
          name: 'email',
          type: 'string',
          required: true,
          description: 'Member email address',
        },
        {
          name: 'uuid',
          type: 'string',
          required: true,
          description: 'Unique member identifier',
        },
        {
          name: 'role',
          type: 'string',
          required: true,
          description: 'Member role (admin, user, viewer)',
        },
        {
          name: 'isAdmin',
          type: 'boolean',
          description: 'Whether member is an admin',
        },
      ],
    },
  },
};

/**
 * Team Schema
 * Defines team structure within organizations
 */
export const TeamSchema: Schema = {
  id: crypto.randomUUID(),
  name: 'team',
  version: '1.0.0',
  description: 'Organization team with members and lead',
  createdAt: new Date(),
  collections: {
    teams: {
      name: 'teams',
      description: 'Teams within an organization',
      fields: [
        {
          name: 'name',
          type: 'string',
          required: true,
          description: 'Team name',
        },
        {
          name: 'uuid',
          type: 'string',
          required: true,
          description: 'Unique team identifier',
        },
        {
          name: 'description',
          type: 'string',
          description: 'Team description',
        },
        {
          name: 'lead',
          type: 'string',
          description: 'Team lead member uuid',
        },
      ],
      subcollections: [
        {
          name: 'members',
          schema: 'member',
          description: 'Team members',
        },
      ],
    },
  },
};

/**
 * Project Schema
 * Defines project structure with phases and tasks
 */
export const ProjectSchema: Schema = {
  id: crypto.randomUUID(),
  name: 'project',
  version: '1.0.0',
  description: 'Project with phases, features, and tasks',
  createdAt: new Date(),
  collections: {
    projects: {
      name: 'projects',
      description: 'Projects',
      fields: [
        {
          name: 'name',
          type: 'string',
          required: true,
          description: 'Project name',
        },
        {
          name: 'uuid',
          type: 'string',
          required: true,
          description: 'Unique project identifier',
        },
        {
          name: 'status',
          type: 'string',
          description: 'Project status (planning, in-progress, completed, archived)',
        },
      ],
      subcollections: [
        {
          name: 'features',
          schema: 'feature',
          description: 'Project features',
        },
        {
          name: 'tasks',
          schema: 'task',
          description: 'Project tasks',
        },
      ],
    },
  },
};

/**
 * Feature Schema
 */
export const FeatureSchema: Schema = {
  id: crypto.randomUUID(),
  name: 'feature',
  version: '1.0.0',
  description: 'Feature with tasks and specifications',
  createdAt: new Date(),
  collections: {
    features: {
      name: 'features',
      description: 'Project features',
      fields: [
        {
          name: 'name',
          type: 'string',
          required: true,
          description: 'Feature name',
        },
        {
          name: 'uuid',
          type: 'string',
          required: true,
          description: 'Unique feature identifier',
        },
        {
          name: 'status',
          type: 'string',
          description: 'Feature status (planned, in-progress, completed)',
        },
      ],
      subcollections: [
        {
          name: 'tasks',
          schema: 'task',
          description: 'Feature tasks',
        },
      ],
    },
  },
};

/**
 * Task Schema
 */
export const TaskSchema: Schema = {
  id: crypto.randomUUID(),
  name: 'task',
  version: '1.0.0',
  description: 'Individual task with status and assignee',
  createdAt: new Date(),
  collections: {
    tasks: {
      name: 'tasks',
      description: 'Tasks',
      fields: [
        {
          name: 'name',
          type: 'string',
          required: true,
          description: 'Task name',
        },
        {
          name: 'uuid',
          type: 'string',
          required: true,
          description: 'Unique task identifier',
        },
        {
          name: 'status',
          type: 'string',
          description: 'Task status (todo, in-progress, done)',
        },
        {
          name: 'assignee',
          type: 'string',
          description: 'Assigned member uuid',
        },
      ],
    },
  },
};

/**
 * Document Schema
 * Defines hierarchical document structure
 */
export const DocumentSchema: Schema = {
  id: crypto.randomUUID(),
  name: 'document',
  version: '1.0.0',
  description: 'Hierarchical document management',
  createdAt: new Date(),
  collections: {
    documents: {
      name: 'documents',
      description: 'Documents and folders',
      fields: [
        {
          name: 'name',
          type: 'string',
          required: true,
          description: 'Document name',
        },
        {
          name: 'uuid',
          type: 'string',
          required: true,
          description: 'Unique document identifier',
        },
        {
          name: 'type',
          type: 'string',
          description: 'Document type (document, folder, template)',
        },
      ],
      subcollections: [
        {
          name: 'subdocuments',
          schema: 'document',
          description: 'Nested documents',
        },
      ],
    },
  },
};

/**
 * User Schema
 * Defines user structure within organizations
 * Users are stored in org-specific folders: org-name-[[org-uuid]]/users/user-email-[[user-uuid]].md
 */
export const UserSchema: Schema = {
  id: crypto.randomUUID(),
  name: 'user',
  version: '1.0.0',
  description: 'Organization user with profile, permissions, and metadata',
  createdAt: new Date(),
  collections: {
    users: {
      name: 'users',
      description: 'Users within an organization',
      fields: [
        {
          name: 'email',
          type: 'string',
          required: true,
          description: 'User email address (used as identifier in filename)',
        },
        {
          name: 'uuid',
          type: 'string',
          required: true,
          description: 'Unique user identifier',
        },
        {
          name: 'name',
          type: 'string',
          required: true,
          description: 'User full name',
        },
        {
          name: 'role',
          type: 'string',
          required: true,
          description: 'User role (admin, member, viewer)',
        },
        {
          name: 'status',
          type: 'string',
          description: 'User status (active, inactive, suspended)',
        },
        {
          name: 'department',
          type: 'string',
          description: 'User department or team',
        },
        {
          name: 'title',
          type: 'string',
          description: 'User job title',
        },
        {
          name: 'avatar',
          type: 'string',
          description: 'User avatar URL or image path',
        },
        {
          name: 'bio',
          type: 'string',
          description: 'User bio or profile description',
        },
        {
          name: 'joinedAt',
          type: 'string',
          description: 'Date when user joined organization',
        },
      ],
    },
  },
};

/**
 * Map of all built-in schemas
 */
export const BUILTIN_SCHEMAS: Record<string, Schema> = {
  organization: OrganizationSchema,
  member: MemberSchema,
  team: TeamSchema,
  project: ProjectSchema,
  feature: FeatureSchema,
  task: TaskSchema,
  document: DocumentSchema,
  user: UserSchema,
};

/**
 * Get a built-in schema by name
 */
export function getBuiltinSchema(schemaName: string): Schema | undefined {
  return BUILTIN_SCHEMAS[schemaName.toLowerCase()];
}

/**
 * List all available built-in schemas
 */
export function listBuiltinSchemas(): string[] {
  return Object.keys(BUILTIN_SCHEMAS);
}
