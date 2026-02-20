import { Elysia, t } from "elysia";
import { db } from "../../lib/db";

export const organizationsRoutes = new Elysia()
  .get("/organizations", async () => {
    const clients = db.query(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM member WHERE client_id = c.client_id) as user_count
      FROM client c
      ORDER BY c.client_name
    `).all();
    return { organizations: clients };
  })
  
  .post("/organizations", async ({ body, set }) => {
    try {
      const { client_id, client_name } = body;
      const id = `client-${client_id}`;
      
      db.query(`
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
      const { client_name } = body;
      
      db.query(`
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
      const userCount = db.query(`
        SELECT COUNT(*) as count FROM member 
        WHERE client_id = (SELECT client_id FROM client WHERE id = ?)
      `).get(id) as any;
      
      if (userCount.count > 0) {
        set.status = 400;
        return { error: "Cannot delete organization with existing users" };
      }
      
      db.query(`DELETE FROM client WHERE id = ?`).run(id);
      return { success: true };
    } catch (error) {
      set.status = 500;
      return { error: "Failed to delete organization", details: String(error) };
    }
  }, {
    params: t.Object({ id: t.String() })
  });
