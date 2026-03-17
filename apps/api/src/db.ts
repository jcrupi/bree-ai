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
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );
  `);
  // Migration guard: add status column if it doesn't exist (for existing DBs)
  try { db.run("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'"); } catch (_) {}

  // Assessments table
  db.run(`
    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      position_id TEXT NOT NULL,
      candidate_email TEXT NOT NULL,
      candidate_name TEXT,
      status TEXT DEFAULT 'in_progress',
      started_at DATETIME,
      completed_at DATETIME,
      overall_score INTEGER,
      technical_score INTEGER,
      cultural_score INTEGER,
      experience_score INTEGER,
      market_score INTEGER,
      conversation_data TEXT, -- JSON
      feedback_data TEXT, -- JSON
      resume_file_path TEXT,
      resume_parsed_data TEXT, -- JSON
      resume_uploaded_at DATETIME,
      recruiter_status TEXT, -- reviewing, advanced, rejected
      recruiter_notes TEXT,
      duration_seconds INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE
    );
  `);

  // Messages table
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      phase TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
    );
  `);

  // Candidate notes table
  db.run(`
    CREATE TABLE IF NOT EXISTS candidate_notes (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL,
      user_id INTEGER,
      user_name TEXT,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Organizations table (parent_id = null for Super Org BreeAI, set for child orgs)
  db.run(`
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      parent_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES organizations(id) ON DELETE SET NULL
    );
  `);
  try {
    db.run('ALTER TABLE organizations ADD COLUMN parent_id INTEGER REFERENCES organizations(id)');
  } catch (_) {}

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

  // Positions table
  db.run(`
    CREATE TABLE IF NOT EXISTS positions (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      requirements TEXT, -- JSON
      status TEXT DEFAULT 'active',
      created_by INTEGER,
      assessment_link TEXT,
      scoring_weights TEXT, -- JSON
      jd_original TEXT,
      jd_parsed TEXT, -- JSON
      culture_data TEXT, -- JSON
      questions TEXT, -- JSON
      branding TEXT, -- JSON
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
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
  parent_id?: number | null;
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
  },

  update: (id: number, data: { name?: string; password_hash?: string; status?: string; updated_at?: string }): User | undefined => {
    const sets: string[] = [];
    const params: any = { $id: id };

    if (data.name !== undefined) { sets.push('name = $name'); params.$name = data.name; }
    if (data.password_hash !== undefined) { sets.push('password_hash = $ph'); params.$ph = data.password_hash; }
    if (data.status !== undefined) { sets.push('status = $status'); params.$status = data.status; }
    sets.push('updated_at = CURRENT_TIMESTAMP');

    if (sets.length === 1) return userDb.findById(id); // only timestamp
    db.query(`UPDATE users SET ${sets.join(', ')} WHERE id = $id`).run(params);
    return userDb.findById(id);
  },

  deactivate: (id: number): void => {
    db.query('UPDATE users SET status = $status, updated_at = CURRENT_TIMESTAMP WHERE id = $id')
      .run({ $id: id, $status: 'inactive' });
  }
};

/**
 * Organization database operations
 */
export const organizationDb = {
  create: (slug: string, name: string, parentId?: number): Organization => {
    db.query(`
      INSERT INTO organizations (slug, name, parent_id)
      VALUES ($slug, $name, $parentId)
    `).run({ $slug: slug, $name: name, $parentId: parentId ?? null });
    
    return organizationDb.findById(getLastInsertId())!;
  },

  findBySlug: (slug: string): Organization | undefined => {
    return db.query('SELECT * FROM organizations WHERE slug = $slug').get({ $slug: slug }) as Organization | undefined;
  },

  findById: (id: number): Organization | undefined => {
    return db.query('SELECT * FROM organizations WHERE id = $id').get({ $id: id }) as Organization | undefined;
  },

  findAll: (): Organization[] => {
    return db.query('SELECT * FROM organizations ORDER BY COALESCE(parent_id, 0), name').all() as Organization[];
  },

  findWithChildren: (): (Organization & { children?: Organization[] })[] => {
    const all = db.query('SELECT * FROM organizations ORDER BY name').all() as Organization[];
    const byId = new Map(all.map((o) => [o.id, { ...o, children: [] as Organization[] }]));
    const roots: (Organization & { children?: Organization[] })[] = [];
    for (const o of all) {
      const node = byId.get(o.id)!;
      const parentId = (o as any).parent_id;
      if (!parentId) {
        roots.push(node);
      } else {
        const parent = byId.get(parentId);
        if (parent?.children) parent.children.push(node);
        else roots.push(node);
      }
    }
    return roots;
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

/**
 * Position database operations
 */
export const positionDb = {
  create: (data: any): any => {
    db.query(`
      INSERT INTO positions (
        id, company_id, title, description, requirements, status, 
        created_by, assessment_link, scoring_weights, jd_original,
        jd_parsed, culture_data, questions, branding, created_at, updated_at
      )
      VALUES (
        $id, $company_id, $title, $description, $requirements, $status,
        $created_by, $assessment_link, $scoring_weights, $jd_original,
        $jd_parsed, $culture_data, $questions, $branding, $created_at, $updated_at
      )
    `).run({
      $id: data.id,
      $company_id: data.company_id,
      $title: data.title,
      $description: data.description || null,
      $requirements: data.requirements ? JSON.stringify(data.requirements) : null,
      $status: data.status || 'active',
      $created_by: data.created_by || null,
      $assessment_link: data.assessment_link || null,
      $scoring_weights: data.scoring_weights ? JSON.stringify(data.scoring_weights) : null,
      $jd_original: data.jd_original || null,
      $jd_parsed: data.jd_parsed ? JSON.stringify(data.jd_parsed) : null,
      $culture_data: data.culture_data ? JSON.stringify(data.culture_data) : null,
      $questions: data.questions ? JSON.stringify(data.questions) : null,
      $branding: data.branding ? JSON.stringify(data.branding) : null,
      $created_at: data.created_at || new Date().toISOString(),
      $updated_at: data.updated_at || new Date().toISOString()
    });
    
    return positionDb.findById(data.id);
  },

  findById: (id: string): any | undefined => {
    const r = db.query('SELECT * FROM positions WHERE id = $id').get({ $id: id }) as any;
    if (!r) return undefined;
    return {
      ...r,
      requirements: r.requirements ? JSON.parse(r.requirements) : null,
      scoring_weights: r.scoring_weights ? JSON.parse(r.scoring_weights) : null,
      jd_parsed: r.jd_parsed ? JSON.parse(r.jd_parsed) : null,
      culture_data: r.culture_data ? JSON.parse(r.culture_data) : null,
      questions: r.questions ? JSON.parse(r.questions) : null,
      branding: r.branding ? JSON.parse(r.branding) : null
    };
  },

  findAll: (): any[] => {
    const results = db.query('SELECT * FROM positions ORDER BY created_at DESC').all() as any[];
    return results.map(r => ({
      ...r,
      requirements: r.requirements ? JSON.parse(r.requirements) : null,
      scoring_weights: r.scoring_weights ? JSON.parse(r.scoring_weights) : null,
      jd_parsed: r.jd_parsed ? JSON.parse(r.jd_parsed) : null,
      culture_data: r.culture_data ? JSON.parse(r.culture_data) : null,
      questions: r.questions ? JSON.parse(r.questions) : null,
      branding: r.branding ? JSON.parse(r.branding) : null
    }));
  },

  update: (id: string, data: any): void => {
    const sets: string[] = [];
    const params: any = { $id: id };
    
    for (const [key, value] of Object.entries(data)) {
      if (key === 'id') continue;
      sets.push(`${key} = $${key}`);
      params[`$${key}`] = (typeof value === 'object' && value !== null) ? JSON.stringify(value) : value;
    }
    
    if (sets.length === 0) return;
    
    sets.push('updated_at = $updated_at');
    params.$updated_at = new Date().toISOString();
    
    db.query(`
      UPDATE positions SET ${sets.join(', ')} WHERE id = $id
    `).run(params);
  },

  delete: (id: string): void => {
    db.query('DELETE FROM positions WHERE id = $id').run({ $id: id });
  }
};

/**
 * Assessment database operations
 */
export const assessmentDb = {
  create: (data: any): any => {
    db.query(`
      INSERT INTO assessments (
        id, position_id, candidate_email, candidate_name, status,
        started_at, completed_at, overall_score, technical_score,
        cultural_score, experience_score, market_score,
        conversation_data, feedback_data, resume_file_path,
        resume_parsed_data, resume_uploaded_at, recruiter_status,
        recruiter_notes, duration_seconds, created_at, updated_at
      )
      VALUES (
        $id, $position_id, $candidate_email, $candidate_name, $status,
        $started_at, $completed_at, $overall_score, $technical_score,
        $cultural_score, $experience_score, $market_score,
        $conversation_data, $feedback_data, $resume_file_path,
        $resume_parsed_data, $resume_uploaded_at, $recruiter_status,
        $recruiter_notes, $duration_seconds, $created_at, $updated_at
      )
    `).run({
      $id: data.id,
      $position_id: data.position_id,
      $candidate_email: data.candidate_email,
      $candidate_name: data.candidate_name || null,
      $status: data.status || 'in_progress',
      $started_at: data.started_at || null,
      $completed_at: data.completed_at || null,
      $overall_score: data.overall_score || null,
      $technical_score: data.technical_score || null,
      $cultural_score: data.cultural_score || null,
      $experience_score: data.experience_score || null,
      $market_score: data.market_score || null,
      $conversation_data: typeof data.conversation_data === 'string' ? data.conversation_data : (data.conversation_data ? JSON.stringify(data.conversation_data) : null),
      $feedback_data: typeof data.feedback_data === 'string' ? data.feedback_data : (data.feedback_data ? JSON.stringify(data.feedback_data) : null),
      $resume_file_path: data.resume_file_path || null,
      $resume_parsed_data: typeof data.resume_parsed_data === 'string' ? data.resume_parsed_data : (data.resume_parsed_data ? JSON.stringify(data.resume_parsed_data) : null),
      $resume_uploaded_at: data.resume_uploaded_at || null,
      $recruiter_status: data.recruiter_status || null,
      $recruiter_notes: data.recruiter_notes || null,
      $duration_seconds: data.duration_seconds || null,
      $created_at: data.created_at || new Date().toISOString(),
      $updated_at: data.updated_at || new Date().toISOString()
    });
    
    return assessmentDb.findById(data.id);
  },

  findById: (id: string): any | undefined => {
    const r = db.query('SELECT * FROM assessments WHERE id = $id').get({ $id: id }) as any;
    if (!r) return undefined;
    return {
      ...r,
      conversation_data: r.conversation_data ? JSON.parse(r.conversation_data) : null,
      feedback_data: r.feedback_data ? JSON.parse(r.feedback_data) : null,
      resume_parsed_data: r.resume_parsed_data ? JSON.parse(r.resume_parsed_data) : null,
    };
  },

  findAll: (): any[] => {
    const results = db.query('SELECT * FROM assessments ORDER BY created_at DESC').all() as any[];
    return results.map(r => ({
      ...r,
      conversation_data: r.conversation_data ? JSON.parse(r.conversation_data) : null,
      feedback_data: r.feedback_data ? JSON.parse(r.feedback_data) : null,
      resume_parsed_data: r.resume_parsed_data ? JSON.parse(r.resume_parsed_data) : null,
    }));
  },

  findByPositionId: (positionId: string): any[] => {
    const results = db.query('SELECT * FROM assessments WHERE position_id = $positionId ORDER BY created_at DESC').all({ $positionId: positionId }) as any[];
    return results.map(r => ({
      ...r,
      conversation_data: r.conversation_data ? JSON.parse(r.conversation_data) : null,
      feedback_data: r.feedback_data ? JSON.parse(r.feedback_data) : null,
      resume_parsed_data: r.resume_parsed_data ? JSON.parse(r.resume_parsed_data) : null,
    }));
  },

  update: (id: string, data: any): void => {
    const sets: string[] = [];
    const params: any = { $id: id };
    
    for (const [key, value] of Object.entries(data)) {
      if (key === 'id') continue;
      sets.push(`${key} = $${key}`);
      params[`$${key}`] = (typeof value === 'object' && value !== null) ? JSON.stringify(value) : value;
    }
    
    if (sets.length === 0) return;
    
    sets.push('updated_at = $updated_at');
    params.$updated_at = new Date().toISOString();
    
    db.query(`
      UPDATE assessments SET ${sets.join(', ')} WHERE id = $id
    `).run(params);
  },

  delete: (id: string): void => {
    db.query('DELETE FROM assessments WHERE id = $id').run({ $id: id });
  },

  // Messages DAO inside assessmentDb or separate
  getMessages: (assessmentId: string): any[] => {
    return db.query('SELECT * FROM messages WHERE assessment_id = $assessmentId ORDER BY timestamp ASC').all({ $assessmentId: assessmentId }) as any[];
  },

  addMessage: (data: any): any => {
    db.query(`
      INSERT INTO messages (id, assessment_id, role, content, phase, timestamp)
      VALUES ($id, $assessment_id, $role, $content, $phase, $timestamp)
    `).run({
      $id: data.id || crypto.randomUUID(),
      $assessment_id: data.assessment_id,
      $role: data.role,
      $content: data.content,
      $phase: data.phase || null,
      $timestamp: data.timestamp || new Date().toISOString()
    });
  },

  // Notes DAO inside assessmentDb or separate
  getNotes: (assessmentId: string): any[] => {
    return db.query('SELECT * FROM candidate_notes WHERE assessment_id = $assessmentId ORDER BY created_at DESC').all({ $assessmentId: assessmentId }) as any[];
  },

  addNote: (data: any): any => {
    db.query(`
      INSERT INTO candidate_notes (id, assessment_id, user_id, user_name, content, created_at)
      VALUES ($id, $assessment_id, $user_id, $user_name, $content, $created_at)
    `).run({
      $id: data.id || crypto.randomUUID(),
      $assessment_id: data.assessment_id,
      $user_id: data.user_id || null,
      $user_name: data.user_name || null,
      $content: data.content,
      $created_at: data.created_at || new Date().toISOString()
    });
  }
};

// Initialize database on import
initializeDatabase();
