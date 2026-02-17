# Implementation Plan - Genius Talent Fly.io Deployment

This plan outlines the steps to deploy the refined Genius Talent application to Fly.io using the Bun "Holy Grail" (Single Container) pattern.

## User Review Required

> [!IMPORTANT]
> Please verify that you have the `fly` CLI installed and are logged in (`fly auth whoami`).

## Proposed Changes

### 1. Server Optimization (`apps/genius-talent/index.ts`)

- Update `Bun.serve` to use `process.env.PORT || 3000`.
- Update static file serving to check the `dist` directory (for production) and use a fallback to `index.html` for SPA routing.
- Ensure API routes are correctly handled.

### 2. Dockerfile Modernization (`apps/genius-talent/Dockerfile`)

- Replace the `nginx` stage with a Bun production stage.
- Use multi-stage build:
  - **Stage 1 (Build)**: Build the frontend using Vite.
  - **Stage 2 (Runtime)**: Run the Bun server (`index.ts`).
- Expose port `3000`.

### 3. Fly Configuration (`apps/genius-talent/fly.toml`)

- Set `internal_port = 3000`.
- Ensure all environment variables (VITE\_\*) are passed as build arguments or defined in the environment.

### 4. Deployment Execution

- Run `fly deploy` from the `apps/genius-talent` directory.

## Verification Plan

### Automated Tests

- N/A (Manual visual verification preferred for UI changes).

### Manual Verification

1. Run a local production build simulation:
   ```bash
   bun run build
   NODE_ENV=production bun index.ts
   ```
2. Check `http://localhost:3000` to ensure assets (CSS, JS, Images) load correctly.
3. Deploy to Fly.io and verify the live URL.
