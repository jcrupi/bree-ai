---
title: Identity Zero — Multi-Tenant Authentication
type: service
scope: platform
stack: Postgres, JWT, JOSE, Elysia
last_updated: 2026-02-25
ai_context: true
---

# Identity Zero — Multi-Tenant Authentication

Identity Zero is the **default authentication provider** for BREE AI. It enables fully isolated, multi-tenant JWT auth where each client (tenant) has its own encrypted JWT secret stored in Postgres.

---

## Architecture

```
Frontend                    bree-api
   │                           │
   │── POST /api/auth/login ──►│
   │                           │── Postgres: SELECT client WHERE client_id = iss
   │                           │── Decrypt jwt_secret (AES-256)
   │                           │── jose.jwtVerify(token, decryptedSecret)
   │◄── { accessToken } ──────│
   │                           │
   │── Request with Bearer ───►│
   │                           │── requireAuth() → JWTPayload
```

---

## Database Schema

Managed by `apps/api/src/routes/identity-zero/db.ts` — connects to `DATABASE_URL` (Postgres).

### `client` table

| Column           | Type        | Description                                  |
| ---------------- | ----------- | -------------------------------------------- |
| `client_id`      | `text PK`   | Tenant identifier (also the JWT `iss` claim) |
| `name`           | `text`      | Display name                                 |
| `jwt_secret`     | `text`      | **AES-encrypted** JWT signing secret         |
| `encryption_key` | `text`      | **AES-encrypted** tenant data encryption key |
| `active`         | `boolean`   | Whether this tenant is enabled               |
| `created_at`     | `timestamp` |                                              |

### `user` table

| Column          | Type        | Description                 |
| --------------- | ----------- | --------------------------- | -------- | ------------- | ------- |
| `user_id`       | `serial PK` |                             |
| `client_id`     | `text FK`   | Tenant this user belongs to |
| `email`         | `text`      |                             |
| `password_hash` | `text`      | bcrypt                      |
| `name`          | `text`      |                             |
| `roles`         | `jsonb`     | `[{ role: 'admin'           | 'member' | 'lead_expert' | ... }]` |
| `active`        | `boolean`   |                             |

---

## JWT Verification Flow

```ts
// 1. Decode without verification to read the issuer (client_id)
const { iss: clientId } = jose.decodeJwt(token);

// 2. Look up the client row in Postgres
const client =
  await sql`SELECT jwt_secret FROM client WHERE client_id = ${clientId}`;

// 3. Decrypt the stored secret (AES-256-GCM)
const secret = await decryptKey(client.jwt_secret);

// 4. Verify the JWT signature
const { payload } = await jose.jwtVerify(
  token,
  new TextEncoder().encode(secret),
);
```

This means **each tenant signs with a different secret** — a compromised tenant's tokens cannot be used against other tenants.

---

## `auth-provider.ts` — Provider Switcher

`AUTH_PROVIDER` env var controls which system is active:

```ts
// identity-zero (default)
export const AUTH_PROVIDER = process.env.AUTH_PROVIDER ?? "identity-zero";

export async function verifyToken(
  token: string,
  identityZeroVerifier,
): Promise<JWTPayload> {
  if (isBetterAuth()) {
    return verifyBetterAuthToken(token);
  }
  return identityZeroVerifier(token); // uses encrypted per-tenant secret
}
```

---

## JWTPayload Shape

```ts
interface JWTPayload {
  userId: number;
  email: string;
  name: string;
  roles: Array<{ role: string }>;
  clientId?: string; // Identity Zero tenantId
  iss?: string; // JWT issuer = client_id
}
```

---

## Tenant Encryption Key

Beyond JWT verification, each tenant also has an **encryption key** for encrypting sensitive data at rest:

```ts
const encKey = await getTenantEncryptionKey(headers);
// Returns undefined for better-auth tenants (no per-tenant encryption)
// Used as: { 'x-tenant-encryption-key': encKey } forwarded to agents
```

---

## Switching to Better Auth

Set `AUTH_PROVIDER=better-auth` and configure:

| Env Var                | Description                                 |
| ---------------------- | ------------------------------------------- |
| `BETTER_AUTH_JWKS_URL` | JWKS endpoint for public key lookup         |
| `BETTER_AUTH_URL`      | Better Auth base URL for session validation |

Better Auth uses standard JWKS — no per-tenant secret lookup needed.

---

## `requireAuth()` Middleware

Used in every authenticated route in both `bree-api` and `bree-api-realtime`:

```ts
const payload = await requireAuth(headers, jwt, set);
if (!payload) return { error: "Unauthorized" }; // 401 already set

// payload.email, payload.roles, payload.userId available
```

If `DEMO_MODE=true`, `requireAuth` returns a guest payload without checking the token — useful for development without an auth server.
