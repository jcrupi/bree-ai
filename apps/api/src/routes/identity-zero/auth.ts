import { Elysia, t } from "elysia";
import bcrypt from "bcryptjs";
import { sql, decryptKey } from "./db";
import * as jose from "jose";

export const identityZeroAuthRoute = new Elysia()
  .post("/auth/login", async ({ body, set }) => {
    try {
      const { username, password } = body;

      const users = await sql`
        SELECT * FROM member 
        WHERE username = ${username}
      `;
      const user = users[0];

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

      // Fetch the multi-tenant client secret dynamically
      const clients = await sql`
        SELECT jwt_secret FROM client WHERE client_id = ${user.client_id}
      `;
      const client = clients[0];

      if (!client || !client.jwt_secret) {
         set.status = 500;
         return { error: "Client encryption configuration missing" };
      }

      // 1. Decrypt the envelope-encrypted secret from DB
      const decryptedSecret = await decryptKey(client.jwt_secret);

      // 2. Sign token dynamically with plaintext client-specific secret
      const secret = new TextEncoder().encode(decryptedSecret);
      const token = await new jose.SignJWT({
        id: user.id,
        username: user.username,
        client_id: user.client_id,
        role: user.role
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setIssuer(user.client_id)
        .setExpirationTime('7d')
        .sign(secret);

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
