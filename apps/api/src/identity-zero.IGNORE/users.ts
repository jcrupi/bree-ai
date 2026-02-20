import { Elysia, t } from "elysia";
import bcrypt from "bcryptjs";
import { db } from "../../lib/db";

export const usersRoutes = new Elysia()
  .get("/users", async ({ query }) => {
    const { clientId, role } = query;
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
    const users = db.query(sql).all(...params);
    return { users };
  }, {
    query: t.Object({
      clientId: t.Optional(t.String()),
      role: t.Optional(t.String())
    })
  })
  
  .post("/users", async ({ body, set }) => {
    try {
      const { username, password, client_id, role, is_lead_admin, must_change_password } = body;
      const password_hash = await bcrypt.hash(password, 10);
      const id = `${role}-${username.split('@')[0]}-${Date.now()}`;
      
      db.query(`
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
      password: t.String(),
      client_id: t.String(),
      role: t.String(),
      is_lead_admin: t.Optional(t.Boolean()),
      must_change_password: t.Optional(t.Boolean())
    })
  })
  
   .put("/users/:id", async ({ params, body, set }) => {
    try {
      const { id } = params;
      const { username, client_id, role, is_lead_admin, must_change_password } = body;
      
      db.query(`
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
      db.query(`DELETE FROM member WHERE id = ?`).run(id);
      return { success: true };
    } catch (error) {
      set.status = 500;
      return { error: "Failed to delete user", details: String(error) };
    }
  }, {
    params: t.Object({ id: t.String() })
  });
