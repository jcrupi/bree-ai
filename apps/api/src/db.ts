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

  // Contacts table for Village Vine invites
  db.run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_number TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Bubbles table
  db.run(`
    CREATE TABLE IF NOT EXISTS bubbles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_id TEXT NOT NULL,
      text TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      instructions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ Database schema initialized');
}


// Bubble type
export interface Bubble {
  id: number;
  brand_id: string;
  text: string;
  active: boolean;
  instructions: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Bubble database operations
 */
export const bubbleDb = {
  create: (brandId: string, text: string, instructions?: string): Bubble => {
    db.query(`
      INSERT INTO bubbles (brand_id, text, instructions)
      VALUES ($brandId, $text, $instructions)
    `).run({ $brandId: brandId, $text: text, $instructions: instructions || null });
    
    return bubbleDb.findById(getLastInsertId())!;
  },

  update: (id: number, data: Partial<Pick<Bubble, 'text' | 'active' | 'instructions'>>): void => {
    const sets: string[] = [];
    const params: any = { $id: id };
    
    if (data.text !== undefined) {
      sets.push('text = $text');
      params.$text = data.text;
    }
    if (data.active !== undefined) {
      sets.push('active = $active');
      params.$active = data.active ? 1 : 0;
    }
    if (data.instructions !== undefined) {
      sets.push('instructions = $instructions');
      params.$instructions = data.instructions;
    }
    
    if (sets.length === 0) return;
    
    sets.push('updated_at = CURRENT_TIMESTAMP');
    
    db.query(`
      UPDATE bubbles SET ${sets.join(', ')} WHERE id = $id
    `).run(params);
  },

  findAllByBrand: (brandId: string): Bubble[] => {
    const results = db.query('SELECT * FROM bubbles WHERE brand_id = $brandId ORDER BY created_at DESC').all({ $brandId: brandId }) as any[];
    return results.map(r => ({
      ...r,
      active: !!r.active
    }));
  },

  findById: (id: number): Bubble | undefined => {
    const r = db.query('SELECT * FROM bubbles WHERE id = $id').get({ $id: id }) as any;
    if (!r) return undefined;
    return {
      ...r,
      active: !!r.active
    };
  },

  delete: (id: number): void => {
    db.query('DELETE FROM bubbles WHERE id = $id').run({ $id: id });
  }
};

/**
 * Contact database operations
 */
export const contactDb = {
  upsert: (phoneNumber: string, name: string) => {
    db.query(`
      INSERT INTO contacts (phone_number, name, updated_at)
      VALUES ($phoneNumber, $name, CURRENT_TIMESTAMP)
      ON CONFLICT(phone_number) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = CURRENT_TIMESTAMP
    `).run({ $phoneNumber: phoneNumber, $name: name });
  },

  findByPhone: (phoneNumber: string) => {
    return db.query('SELECT * FROM contacts WHERE phone_number = $phoneNumber').get({ $phoneNumber: phoneNumber }) as { phone_number: string, name: string } | undefined;
  },

  findAll: () => {
    return db.query('SELECT * FROM contacts ORDER BY updated_at DESC').all() as { phone_number: string, name: string }[];
  }
};


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
