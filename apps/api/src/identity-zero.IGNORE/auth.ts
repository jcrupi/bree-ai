import { Elysia, t } from "elysia";
import bcrypt from "bcryptjs";
import { db } from "../../lib/db";
import { jwtPlugin, createJWTPayload } from "../../lib/jwt";

export const identityZeroAuthRoute = new Elysia()
  .use(jwtPlugin)
  .post("/auth/login", async ({ body, set, jwt }) => {
    try {
      const { username, password } = body;

      const user = db.query(`
        SELECT * FROM member 
        WHERE username = ? 
      `).get(username) as any;

      if (!user) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }
      
      if (user.active === 0) {
        set.status = 403;
        return { error: "Account disabled" };
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      const token = await jwt.sign(createJWTPayload({
        id: user.id,
        username: user.username,
        client_id: user.client_id,
        role: user.role
      }));

      return {
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          clientId: user.client_id,
          role: user.role,
          mustChangePassword: user.must_change_password === 1
        }
      };
    } catch (error) {
      console.error("Identity Zero login error:", error);
      set.status = 500;
      return { error: "Login failed" };
    }
  }, {
    body: t.Object({
      username: t.String(),
      password: t.String()
    })
  })
  
  .post("/auth/logout", async () => {
    return { success: true };
  });
