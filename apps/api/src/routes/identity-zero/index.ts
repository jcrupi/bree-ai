import { Elysia, t } from "elysia";
import bcrypt from "bcryptjs";
import { identityDb } from "./db";
import { identityZeroAuthRoute } from "./auth";
import { jwt } from '@elysiajs/jwt';

// Helper to require authentication (re-using bree-ai's JWT structure)
const requireAuth = async ({ headers, jwt, set }: any) => {
  const authHeader = headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    set.status = 401;
    throw new Error('Unauthorized');
  }

  const token = authHeader.slice(7);
  const payload = await jwt.verify(token);
  if (!payload || !['super_admin', 'super_agent', 'super_org_admin', 'org_admin'].includes(payload.role as string)) {
    set.status = 403;
    throw new Error('Forbidden: Insufficient privileges');
  }

  return payload;
};

// Identity Zero - Central Identity & Access Management API
export const identityZeroRoutes = new Elysia({ prefix: "/api/identity-zero" })
  .use(jwt({
    name: 'jwt',
    secret: process.env.JWT_SECRET || 'bree-secret-change-in-production',
    exp: '7d'
  }))
  // Public Auth Routes
  .use(identityZeroAuthRoute)
  
  // Protected Routes - Require Identity Zero Super Admin
  .onBeforeHandle(requireAuth)

  // ===== USERS MANAGEMENT (Members/Providers) =====
  .get("/users", async ({ query }) => {
    const { clientId, role } = query as { clientId?: string, role?: string };
    let sql = `
      SELECT u.id, u.username, u.client_id, u.role, u.active, u.must_change_password, u.is_lead_admin, u.created_at, c.client_name
      FROM member u
      LEFT JOIN client c ON u.client_id = c.client_id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (clientId) {
      sql += ` AND u.client_id = ? `;
      params.push(clientId);
    }

    if (role) {
      sql += ` AND u.role = ? `;
      params.push(role);
    }
    
    sql += ` ORDER BY u.role ASC, u.created_at DESC `;
    const users = identityDb.query(sql).all(...params);
    return { users };
  }, {
    query: t.Object({
      clientId: t.Optional(t.String()),
      role: t.Optional(t.String())
    })
  })
  
  .post("/users", async ({ body, set }) => {
    try {
      const { username, password, client_id, role, is_lead_admin, must_change_password } = body as any;
      const defaultPassword = password || "changeMe123!";
      const password_hash = await bcrypt.hash(defaultPassword, 10);
      const id = `${role}-${username.split('@')[0]}-${Date.now()}`;
      
      identityDb.query(`
        INSERT INTO member (id, username, password_hash, client_id, role, is_lead_admin, must_change_password)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, username, password_hash, client_id, role, is_lead_admin ? 1 : 0, must_change_password ? 1 : 0);
      
      return { success: true, user: { id, username, client_id, role, is_lead_admin, must_change_password } };
    } catch (error) {
      set.status = 500;
      return { error: "Failed to create user", details: String(error) };
    }
  }, {
    body: t.Object({
      username: t.String({ format: 'email' }),
      password: t.Optional(t.String()),
      client_id: t.String(),
      role: t.String(),
      is_lead_admin: t.Optional(t.Boolean()),
      must_change_password: t.Optional(t.Boolean())
    })
  })
  
   .put("/users/:id", async ({ params, body, set }) => {
    try {
      const { id } = params;
      const { username, client_id, role, is_lead_admin, must_change_password } = body as any;
      
      identityDb.query(`
        UPDATE member 
        SET username = ?, client_id = ?, role = ?, is_lead_admin = ?, must_change_password = ?
        WHERE id = ?
      `).run(username, client_id, role, is_lead_admin ? 1 : 0, must_change_password ? 1 : 0, id);
      
      return { success: true };
    } catch (error) {
      set.status = 500;
      return { error: "Failed to update user", details: String(error) };
    }
  }, {
    params: t.Object({ id: t.String() }),
    body: t.Object({
      username: t.String({ format: 'email' }),
      client_id: t.String(),
      role: t.String(),
      is_lead_admin: t.Optional(t.Boolean()),
      must_change_password: t.Optional(t.Boolean())
    })
  })
  
  .delete("/users/:id", async ({ params, set }) => {
    try {
      const { id } = params;
      identityDb.query(`DELETE FROM member WHERE id = ?`).run(id);
      return { success: true };
    } catch (error) {
      set.status = 500;
      return { error: "Failed to delete user", details: String(error) };
    }
  }, {
    params: t.Object({ id: t.String() })
  })

  // ===== ORGANIZATIONS (Clients) MANAGEMENT =====
  .get("/organizations", async () => {
    const clients = identityDb.query(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM member WHERE client_id = c.client_id) as user_count
      FROM client c
      ORDER BY c.client_name
    `).all();
    return { organizations: clients };
  })
  
  .post("/organizations", async ({ body, set }) => {
    try {
      const { client_id, client_name } = body as any;
      const id = `client-${client_id}`;
      
      identityDb.query(`
        INSERT INTO client (id, client_id, client_name)
        VALUES (?, ?, ?)
      `).run(id, client_id, client_name);
      
      return { success: true, organization: { id, client_id, client_name } };
    } catch (error) {
      set.status = 500;
      return { error: "Failed to create organization", details: String(error) };
    }
  }, {
    body: t.Object({
      client_id: t.String(),
      client_name: t.String()
    })
  })
  
  .put("/organizations/:id", async ({ params, body, set }) => {
    try {
      const { id } = params;
      const { client_name } = body as any;
      
      identityDb.query(`
        UPDATE client 
        SET client_name = ?
        WHERE id = ?
      `).run(client_name, id);
      
      return { success: true };
    } catch (error) {
      set.status = 500;
      return { error: "Failed to update organization", details: String(error) };
    }
  }, {
    params: t.Object({ id: t.String() }),
    body: t.Object({ client_name: t.String() })
  })
  
  .delete("/organizations/:id", async ({ params, set }) => {
    try {
      const { id } = params;
      const userCount = identityDb.query(`
        SELECT COUNT(*) as count FROM member 
        WHERE client_id = (SELECT client_id FROM client WHERE id = ?)
      `).get(id) as any;
      
      if (userCount.count > 0) {
        set.status = 400;
        return { error: "Cannot delete organization with existing users" };
      }
      
      identityDb.query(`DELETE FROM client WHERE id = ?`).run(id);
      return { success: true };
    } catch (error) {
      set.status = 500;
      return { error: "Failed to delete organization", details: String(error) };
    }
  }, {
    params: t.Object({ id: t.String() })
  });
