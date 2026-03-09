---
title: better-auth-ui — Shadcn Auth Component Library
type: package
package: "@daveyplate/better-auth-ui"
version: "3.3.15"
stack: React, Shadcn/ui, Better Auth, TypeScript, tsup
last_updated: 2026-02-25
ai_context: true
---

# better-auth-ui — Shadcn Auth Component Library

`better-auth-ui` is a **vendored/local copy** of the `@daveyplate/better-auth-ui` open-source library. It provides plug-and-play Shadcn/ui auth components (login, register, OTP, passkey, MFA) that wire directly to a [Better Auth](https://www.better-auth.com) backend.

> **Why it's in the monorepo:** BREE AI uses `better-auth` as its alternative auth provider (alongside Identity Zero). Having the UI library local allows customisation without publishing to npm.

---

## What It Provides

Pre-built auth UI components that connect to a Better Auth server:

| Component             | Description                                |
| --------------------- | ------------------------------------------ |
| `<SignIn />`          | Login form (email/password, OAuth)         |
| `<SignUp />`          | Registration form with validation          |
| `<ForgotPassword />`  | Password reset flow                        |
| `<MagicLink />`       | Passwordless email link                    |
| `<OTPInput />`        | 6-digit OTP / TOTP entry                   |
| `<PasskeyButton />`   | Passkey / WebAuthn authentication          |
| `<UserButton />`      | Avatar dropdown with session info + logout |
| `<SessionProvider />` | React context for current session          |

---

## Package Exports

```ts
// Core auth components
import { SignIn, SignUp, UserButton, SessionProvider } from '@daveyplate/better-auth-ui';

// Server-side (Next.js / Bun SSR)
import { getSession } from '@daveyplate/better-auth-ui/server';

// TanStack Query integration
import { useSession } from '@daveyplate/better-auth-ui/tanstack';

// InstantDB integration (experimental)
import { ... } from '@daveyplate/better-auth-ui/instantdb';
```

---

## Integration in BREE AI

Used when `AUTH_PROVIDER=better-auth`:

```tsx
// In any BREE frontend using better-auth
import {
  SessionProvider,
  SignIn,
  UserButton,
} from "@daveyplate/better-auth-ui";

function App() {
  return (
    <SessionProvider>
      <UserButton />
      {/* rest of app */}
    </SessionProvider>
  );
}

function LoginPage() {
  return <SignIn callbackURL="/dashboard" />;
}
```

The Better Auth backend is served by `BETTER_AUTH_URL` and verified in `bree-api` via JWKS at `BETTER_AUTH_JWKS_URL`.

---

## Build

```bash
cd apps/better-auth-ui
pnpm build   # tsup --clean --dts
# → dist/index.js, dist/index.cjs, dist/index.d.ts, dist/style.css
```

> **Note:** This package uses `pnpm` (not `bun`) — it has its own `packageManager: pnpm@10.26.2` setting and a `turbo.json`. Run commands inside its directory, not from the workspace root.

---

## Peer Dependencies

Requires the consumer to provide:

- `react >= 18`, `react-dom >= 18`
- `better-auth >= 1.4.6`
- `tailwindcss >= 3.0.0`
- Shadcn/ui primitives (`@radix-ui/*`, `lucide-react`, `class-variance-authority`)
- `react-hook-form >= 7.55.0`, `zod >= 3.0.0`

---

## Notes for AI Tools

- **Do not use `bun install`** inside `apps/better-auth-ui` — it uses `pnpm`.
- Editing components here affects all BREE apps that use `better-auth`.
- Styles are in `src/style.css` (Tailwind-based) and copied to `dist/style.css` on build.
- The `docs/` subfolder is a separate Next.js documentation site — not deployed to Fly.io.
