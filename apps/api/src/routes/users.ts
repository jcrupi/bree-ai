import { Elysia, t } from 'elysia';
import bcrypt from 'bcryptjs';
import { userDb, roleDb } from '../db';
import { requireAuth } from '../index';

const USER_ROLES = ['editor', 'administrator', 'view_only'] as const;

function userToResponse(user: any) {
  const { password_hash, ...rest } = user;
  return rest;
}

function requireAdminRole(auth: any, set: any): boolean {
  if (!auth) {
    set.status = 401;
    return false;
  }
  const isAdmin = auth.roles?.some((r: any) =>
    r.role === 'super_org' || r.role === 'admin' || r.role === 'org'
  );
  if (!isAdmin) {
    set.status = 403;
    return false;
  }
  return true;
}

export const usersRoutes = new Elysia({ prefix: '/api/v1/users' })

  // GET /api/v1/users — list all users (admin only)
  .get('', async ({ headers, set }) => {
    const auth = await requireAuth(headers, {}, set);
    if (!requireAdminRole(auth, set)) return { error: 'Forbidden' };

    const users = userDb.findAll();
    return {
      data: users.map(userToResponse),
      total: users.length
    };
  })

  // GET /api/v1/users/:id
  .get('/:id', async ({ params: { id }, headers, set }) => {
    const auth = await requireAuth(headers, {}, set);
    if (!requireAdminRole(auth, set)) return { error: 'Forbidden' };

    const user = userDb.findById(Number(id));
    if (!user) {
      set.status = 404;
      return { error: 'User not found' };
    }

    // Include role info
    const roles = roleDb.findByUserIdWithOrgs(user.id);
    return {
      ...userToResponse(user),
      roles
    };
  })

  // POST /api/v1/users — create user (admin only)
  .post('', async ({ body, headers, set }) => {
    const auth = await requireAuth(headers, {}, set);
    if (!requireAdminRole(auth, set)) return { error: 'Forbidden' };

    const { email, name, password, role = 'member', organization_id } = body as any;

    // Check duplicate email
    const existing = userDb.findByEmail(email);
    if (existing) {
      set.status = 400;
      return { error: 'Email already registered' };
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = userDb.create(email, password_hash, name);

    // Assign role
    roleDb.assign(user.id, role, organization_id ? Number(organization_id) : undefined);

    const roles = roleDb.findByUserIdWithOrgs(user.id);
    return {
      ...userToResponse(user),
      roles
    };
  }, {
    body: t.Object({
      email: t.String(),
      name: t.String(),
      password: t.String(),
      role: t.Optional(t.String()),
      organization_id: t.Optional(t.Union([t.String(), t.Number()]))
    })
  })

  // PUT /api/v1/users/:id — update user (admin only)
  .put('/:id', async ({ params: { id }, body, headers, set }) => {
    const auth = await requireAuth(headers, {}, set);
    if (!requireAdminRole(auth, set)) return { error: 'Forbidden' };

    const user = userDb.findById(Number(id));
    if (!user) {
      set.status = 404;
      return { error: 'User not found' };
    }

    const updates: any = {};
    const payload = body as any;

    if (payload.name) updates.name = payload.name;
    if (payload.status) {
      if (!['active', 'inactive'].includes(payload.status)) {
        set.status = 400;
        return { error: 'status must be active or inactive' };
      }
      updates.status = payload.status;
    }
    if (payload.password) {
      updates.password_hash = await bcrypt.hash(payload.password, 10);
    }

    const updated = userDb.update(Number(id), updates);
    return userToResponse(updated!);
  })

  // PATCH /api/v1/users/:id/role — assign a new role 
  .patch('/:id/role', async ({ params: { id }, body, headers, set }) => {
    const auth = await requireAuth(headers, {}, set);
    if (!requireAdminRole(auth, set)) return { error: 'Forbidden' };

    const user = userDb.findById(Number(id));
    if (!user) {
      set.status = 404;
      return { error: 'User not found' };
    }

    const { role, organization_id } = body as any;
    roleDb.assign(Number(id), role, organization_id ? Number(organization_id) : undefined);

    const roles = roleDb.findByUserIdWithOrgs(Number(id));
    return { id: Number(id), roles };
  }, {
    body: t.Object({
      role: t.String(),
      organization_id: t.Optional(t.Union([t.String(), t.Number()]))
    })
  })

  // DELETE /api/v1/users/:id — deactivate user (admin only, can't delete self)
  .delete('/:id', async ({ params: { id }, headers, set }) => {
    const auth = await requireAuth(headers, {}, set);
    if (!requireAdminRole(auth, set)) return { error: 'Forbidden' };

    // Prevent self-deletion
    if (String(auth.userId) === String(id)) {
      set.status = 400;
      return { error: 'Cannot deactivate your own account' };
    }

    const user = userDb.findById(Number(id));
    if (!user) {
      set.status = 404;
      return { error: 'User not found' };
    }

    userDb.deactivate(Number(id));
    return { message: 'User deactivated', id: Number(id) };
  });
