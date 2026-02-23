import { Elysia, t } from "elysia";
import bcrypt from "bcryptjs";
import { sql } from "./db";
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
  
  // Public Observation Submission
  .post("/observations", async ({ body, set, jwt, headers }) => {
    try {
      const { app_name, page_url, type, description, screenshot_data } = body as any;
      let client_id = "unknown";
      try {
        const authHeader = headers['authorization'];
        if (authHeader?.startsWith('Bearer ')) {
          const payload = await jwt.verify(authHeader.slice(7));
          if (payload && payload.client_id) {
            client_id = payload.client_id as string;
          }
        }
      } catch (e) {}

      const id = `obs-${Date.now()}`;
      await sql`
        INSERT INTO observations (id, client_id, app_name, page_url, type, description, screenshot_data)
        VALUES (${id}, ${client_id}, ${app_name}, ${page_url}, ${type}, ${description}, ${screenshot_data})
      `;
      
      return { success: true, observationId: id };
    } catch (error) {
      set.status = 500;
      return { error: "Failed to create observation", details: String(error) };
    }
  }, {
    body: t.Object({
      app_name: t.Optional(t.String()),
      page_url: t.Optional(t.String()),
      type: t.String(),
      description: t.String(),
      screenshot_data: t.Optional(t.String())
    })
  })
  
  // Protected Routes - Require Identity Zero Super Admin
  .onBeforeHandle(requireAuth)

  // ===== USERS MANAGEMENT (Members/Providers) =====
  .get("/users", async ({ query }) => {
    const { clientId, role } = query as { clientId?: string, role?: string };
    
    // Using dynamic query builder for Postgres
    let users;
    if (clientId && role) {
      users = await sql`
        SELECT u.id, u.username, u.client_id, u.role, u.active, u.must_change_password, u.is_lead_admin, u.created_at, c.client_name
        FROM member u
        LEFT JOIN client c ON u.client_id = c.client_id
        WHERE u.client_id = ${clientId} AND u.role = ${role}
        ORDER BY u.role ASC, u.created_at DESC
      `;
    } else if (clientId) {
      users = await sql`
        SELECT u.id, u.username, u.client_id, u.role, u.active, u.must_change_password, u.is_lead_admin, u.created_at, c.client_name
        FROM member u
        LEFT JOIN client c ON u.client_id = c.client_id
        WHERE u.client_id = ${clientId}
        ORDER BY u.role ASC, u.created_at DESC
      `;
    } else if (role) {
      users = await sql`
        SELECT u.id, u.username, u.client_id, u.role, u.active, u.must_change_password, u.is_lead_admin, u.created_at, c.client_name
        FROM member u
        LEFT JOIN client c ON u.client_id = c.client_id
        WHERE u.role = ${role}
        ORDER BY u.role ASC, u.created_at DESC
      `;
    } else {
      users = await sql`
        SELECT u.id, u.username, u.client_id, u.role, u.active, u.must_change_password, u.is_lead_admin, u.created_at, c.client_name
        FROM member u
        LEFT JOIN client c ON u.client_id = c.client_id
        ORDER BY u.role ASC, u.created_at DESC
      `;
    }

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
      
      const isLeadAdminInt = is_lead_admin ? 1 : 0;
      const mustChangePasswordInt = must_change_password ? 1 : 0;
      
      await sql`
        INSERT INTO member (id, username, password_hash, client_id, role, is_lead_admin, must_change_password)
        VALUES (${id}, ${username}, ${password_hash}, ${client_id}, ${role}, ${isLeadAdminInt}, ${mustChangePasswordInt})
      `;
      
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
      
      const isLeadAdminInt = is_lead_admin ? 1 : 0;
      const mustChangePasswordInt = must_change_password ? 1 : 0;
      
      await sql`
        UPDATE member 
        SET username = ${username}, client_id = ${client_id}, role = ${role}, is_lead_admin = ${isLeadAdminInt}, must_change_password = ${mustChangePasswordInt}
        WHERE id = ${id}
      `;
      
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
      await sql`DELETE FROM member WHERE id = ${id}`;
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
    const clients = await sql`
      SELECT c.*, 
        (SELECT COUNT(*) FROM member WHERE client_id = c.client_id) as user_count
      FROM client c
      ORDER BY c.client_name
    `;
    return { organizations: clients };
  })
  
  .post("/organizations", async ({ body, set }) => {
    try {
      const { client_id, client_name } = body as any;
      const id = `client-${client_id}`;
      
      await sql`
        INSERT INTO client (id, client_id, client_name)
        VALUES (${id}, ${client_id}, ${client_name})
      `;
      
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
      
      await sql`
        UPDATE client 
        SET client_name = ${client_name}
        WHERE id = ${id}
      `;
      
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
      const userCountRows = await sql`
        SELECT COUNT(*) as count FROM member 
        WHERE client_id = (SELECT client_id FROM client WHERE id = ${id})
      `;
      const userCount = userCountRows[0] || { count: 0 };
      
      if (userCount.count > 0) {
        set.status = 400;
        return { error: "Cannot delete organization with existing users" };
      }
      
      await sql`DELETE FROM client WHERE id = ${id}`;
      return { success: true };
    } catch (error) {
      set.status = 500;
      return { error: "Failed to delete organization", details: String(error) };
    }
  }, {
    params: t.Object({ id: t.String() })
  })

  // ===== OBSERVATIONS (Admin) =====
  .get("/observations", async () => {
    const observations = await sql`
      SELECT id, client_id, app_name, page_url, type, description, status, created_at 
      FROM observations 
      ORDER BY created_at DESC
    `;
    return { observations };
  })
  
  // ===== OBSERVATIONS AI CHAT (Admin) =====
  .post("/observations/chat", async ({ body, set }) => {
    try {
      const { message, observationId } = body as any;
      const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
      
      if (!OPENAI_API_KEY) {
        set.status = 500;
        return { error: 'OPENAI_API_KEY not configured on server' };
      }

      // Fetch context
      let contextData = "";
      if (observationId) {
        const obsRows = await sql`SELECT * FROM observations WHERE id = ${observationId}`;
        const obs = obsRows[0];
        if (obs) {
          contextData = `Focus Observation: ${JSON.stringify(obs)}\n\n`;
        }
      } else {
        const obs = await sql`SELECT id, app_name, type, status, description, created_at FROM observations ORDER BY created_at DESC LIMIT 50`;
        contextData = `Recent Observations: ${JSON.stringify(obs)}\n\n`;
      }

      const systemPrompt = `You are Observer.ai, an expert product manager and engineering assistant for the Bree AI ecosystem. 
You are analyzing user feedback, bug reports, and feature requests.
Be concise, helpful, and analytical.
Here is the observation data context:
${contextData}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'OpenAI API Error');
      }

      const data = await response.json();
      return { reply: data.choices[0].message.content };
    } catch (error) {
      set.status = 500;
      return { error: "Failed to process AI chat", details: String(error) };
    }
  }, {
    body: t.Object({
      message: t.String(),
      observationId: t.Optional(t.String())
    })
  });
