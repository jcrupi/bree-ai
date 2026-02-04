import bcrypt from 'bcryptjs';
import { userDb, roleDb, organizationDb, type User } from './db';

/**
 * JWT payload structure
 */
export interface JWTPayload {
  userId: number;
  email: string;
  name: string;
  roles: Array<{
    role: 'super_org' | 'org' | 'admin' | 'member';
    organizationId?: number;
    organizationSlug?: string;
    organizationName?: string;
  }>;
}

/**
 * User with roles
 */
export interface UserWithRoles extends Omit<User, 'password_hash'> {
  roles: JWTPayload['roles'];
}

/**
 * Authentication service
 */
export const authService = {
  /**
   * Register a new user
   */
  async register(email: string, password: string, name: string, role: string = 'member', organizationSlug?: string): Promise<UserWithRoles> {
    // Check if user already exists
    const existing = userDb.findByEmail(email);
    if (existing) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = userDb.create(email, passwordHash, name);

    // Assign role
    let orgId: number | undefined;
    if (organizationSlug) {
      const org = organizationDb.findBySlug(organizationSlug);
      if (!org) {
        throw new Error(`Organization '${organizationSlug}' not found`);
      }
      orgId = org.id;
    }

    roleDb.assign(user.id, role, orgId);

    return authService.getUserWithRoles(user.id);
  },

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<UserWithRoles> {
    // Find user
    const user = userDb.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    userDb.updateLastLogin(user.id);

    return authService.getUserWithRoles(user.id);
  },

  /**
   * Get user with roles
   */
  getUserWithRoles(userId: number): UserWithRoles {
    const user = userDb.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get user roles with organization details
    const userRoles = roleDb.findByUserIdWithOrgs(userId);

    const roles = userRoles.map((r: any) => ({
      role: r.role,
      organizationId: r.organization_id,
      organizationSlug: r.org_slug,
      organizationName: r.org_name
    }));

    // Remove password_hash from response
    const { password_hash, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      roles
    };
  },

  /**
   * Create JWT payload from user
   */
  createJWTPayload(user: UserWithRoles): JWTPayload {
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles
    };
  },

  /**
   * Check if user has specific role
   */
  hasRole(payload: JWTPayload, requiredRole: string, organizationId?: number): boolean {
    return payload.roles.some(r => {
      if (r.role === 'super_org') return true; // Super org has all permissions
      if (organizationId) {
        return r.role === requiredRole && r.organizationId === organizationId;
      }
      return r.role === requiredRole;
    });
  },

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(payload: JWTPayload, roles: string[]): boolean {
    return payload.roles.some(r => roles.includes(r.role));
  }
};

/**
 * Seed initial data for testing
 */
export async function seedDatabase() {
  try {
    // Create organizations
    const kickOrg = organizationDb.findBySlug('kick-analytics') || 
      organizationDb.create('kick-analytics', 'Kick Analytics');
    
    const grelinOrg = organizationDb.findBySlug('grelin') || 
      organizationDb.create('grelin', 'Grelin');

    // Create super admin user
    let superAdmin = userDb.findByEmail('admin@bree.ai');
    if (!superAdmin) {
      await authService.register(
        'admin@bree.ai',
        'admin123',
        'BREE Admin',
        'super_org'
      );
      console.log('✅ Created super admin: admin@bree.ai / admin123');
    }

    // Create org admin for Kick Analytics
    let kickAdmin = userDb.findByEmail('admin@kickanalytics.com');
    if (!kickAdmin) {
      await authService.register(
        'admin@kickanalytics.com',
        'kick123',
        'Kick Admin',
        'org',
        'kick-analytics'
      );
      console.log('✅ Created org admin: admin@kickanalytics.com / kick123');
    }

    // Create member user
    let member = userDb.findByEmail('user@kickanalytics.com');
    if (!member) {
      await authService.register(
        'user@kickanalytics.com',
        'user123',
        'Test User',
        'member',
        'kick-analytics'
      );
      console.log('✅ Created member: user@kickanalytics.com / user123');
    }

    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
