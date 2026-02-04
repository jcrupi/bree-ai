import { Database } from 'bun:sqlite';
import { join } from 'path';

// Initialize SQLite database
const dbPath = process.env.DB_PATH || join(process.cwd(), 'bree.db');
export const db = new Database(dbPath);

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON;');

/**
 * Initialize database schema
 */
export function initializeDatabase() {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );
  `);

  // Organizations table
  db.run(`
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // User roles table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      organization_id INTEGER,
      role TEXT NOT NULL CHECK(role IN ('super_org', 'org', 'admin', 'member')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );
  `);

  console.log('✅ Database schema initialized');
}

// User type
export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

// Organization type
export interface Organization {
  id: number;
  slug: string;
  name: string;
  created_at: string;
}

// User role type
export interface UserRole {
  id: number;
  user_id: number;
  organization_id: number | null;
  role: 'super_org' | 'org' | 'admin' | 'member';
  created_at: string;
}

/**
 * Helper to get last insert ID
 */
function getLastInsertId(): number {
  const result = db.query('SELECT last_insert_rowid() as id').get() as { id: number };
  return result.id;
}

/**
 * User database operations
 */
export const userDb = {
  create: (email: string, passwordHash: string, name: string): User => {
    db.query(`
      INSERT INTO users (email, password_hash, name)
      VALUES ($email, $password, $name)
    `).run({ $email: email, $password: passwordHash, $name: name });
    
    return userDb.findById(getLastInsertId())!;
  },

  findByEmail: (email: string): User | undefined => {
    return db.query('SELECT * FROM users WHERE email = $email').get({ $email: email }) as User | undefined;
  },

  findById: (id: number): User | undefined => {
    return db.query('SELECT * FROM users WHERE id = $id').get({ $id: id }) as User | undefined;
  },

  updateLastLogin: (id: number): void => {
    db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $id').run({ $id: id });
  },

  findAll: (): User[] => {
    return db.query('SELECT * FROM users ORDER BY created_at DESC').all() as User[];
  }
};

/**
 * Organization database operations
 */
export const organizationDb = {
  create: (slug: string, name: string): Organization => {
    db.query(`
      INSERT INTO organizations (slug, name)
      VALUES ($slug, $name)
    `).run({ $slug: slug, $name: name });
    
    return organizationDb.findById(getLastInsertId())!;
  },

  findBySlug: (slug: string): Organization | undefined => {
    return db.query('SELECT * FROM organizations WHERE slug = $slug').get({ $slug: slug }) as Organization | undefined;
  },

  findById: (id: number): Organization | undefined => {
    return db.query('SELECT * FROM organizations WHERE id = $id').get({ $id: id }) as Organization | undefined;
  },

  findAll: (): Organization[] => {
    return db.query('SELECT * FROM organizations ORDER BY name').all() as Organization[];
  }
};

/**
 * User role database operations
 */
export const roleDb = {
  assign: (userId: number, role: string, organizationId?: number): UserRole => {
    db.query(`
      INSERT INTO user_roles (user_id, role, organization_id)
      VALUES ($userId, $role, $orgId)
    `).run({ $userId: userId, $role: role, $orgId: organizationId || null });
    
    return roleDb.findById(getLastInsertId())!;
  },

  findById: (id: number): UserRole | undefined => {
    return db.query('SELECT * FROM user_roles WHERE id = $id').get({ $id: id }) as UserRole | undefined;
  },

  findByUserId: (userId: number): UserRole[] => {
    return db.query('SELECT * FROM user_roles WHERE user_id = $userId').all({ $userId: userId }) as UserRole[];
  },

  findByUserIdWithOrgs: (userId: number) => {
    return db.query(`
      SELECT 
        ur.*,
        o.slug as org_slug,
        o.name as org_name
      FROM user_roles ur
      LEFT JOIN organizations o ON ur.organization_id = o.id
      WHERE ur.user_id = $userId
    `).all({ $userId: userId });
  },

  hasRole: (userId: number, role: string, organizationId?: number): boolean => {
    const query = organizationId
      ? 'SELECT 1 FROM user_roles WHERE user_id = $userId AND role = $role AND organization_id = $orgId'
      : 'SELECT 1 FROM user_roles WHERE user_id = $userId AND role = $role';
    
    const params = organizationId
      ? { $userId: userId, $role: role, $orgId: organizationId }
      : { $userId: userId, $role: role };
      
    const result = db.query(query).get(params as any);
    return !!result;
  }
};

// Initialize database on import
initializeDatabase();
