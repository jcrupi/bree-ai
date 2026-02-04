# BREE AI - Environment Configuration Guide

This document explains how to configure the BREE AI applications to connect to the AgentX Collective on fly.io.

## Overview

All applications in this monorepo (`kat-ai`, `genius-talent`, `keen-ai`) can be configured to connect to:

- **AgentX Collective** - The main orchestration hub
- **Ragster** - Document search and RAG service
- **AntiMatterDB** - Identity and organization management

## Environment Variables

Each app uses Vite environment variables (prefixed with `VITE_`) to configure API endpoints.

### Core Configuration

| Variable               | Description                     | Default                     | Production (fly.io)                            |
| ---------------------- | ------------------------------- | --------------------------- | ---------------------------------------------- |
| `VITE_AGENTX_URL`      | AgentX Collective URL           | `http://localhost:9000`     | `https://agent-collective-agentx.fly.dev`      |
| `VITE_COLLECTIVE_URL`  | Alternative name for AgentX URL | `http://localhost:9000`     | `https://agent-collective-agentx.fly.dev`      |
| `VITE_RAGSTER_API_URL` | Ragster API endpoint            | `http://localhost:8898/api` | `https://agent-collective-ragster.fly.dev/api` |
| `VITE_ANTIMATTER_URL`  | AntiMatterDB endpoint           | `http://localhost:7198`     | `https://agent-collective-antimatter.fly.dev`  |

### App-Specific Configuration

| Variable                             | Description                | Default                                   |
| ------------------------------------ | -------------------------- | ----------------------------------------- |
| `VITE_RAGSTER_DEFAULT_ORG_ID`        | Default organization ID    | `kat.ai` or `genius-talent`               |
| `VITE_RAGSTER_DEFAULT_USER_ID`       | Default user ID            | `user@kat.ai` or `user@genius-talent.com` |
| `VITE_RAGSTER_DEFAULT_COLLECTION_ID` | Default Ragster collection | (empty)                                   |
| `VITE_APP_NAME`                      | Application display name   | `KAT.ai` or `Genius Talent`               |

## Setup Instructions

### 1. For Local Development (localhost)

If you want to run services locally, no configuration is needed. The apps will use default localhost URLs.

### 2. For Production (fly.io)

Each app has `.env.local` files pre-configured to point to the fly.io deployment:

```bash
# KAT.ai
cd apps/kat-ai
# The .env.local file is already configured

# Genius Talent
cd apps/genius-talent
# The .env.local file is already configured
```

### 3. Custom Configuration

To customize the configuration:

1. Copy `.env.example` to `.env.local` in your app directory:

   ```bash
   cd apps/kat-ai
   cp .env.example .env.local
   ```

2. Edit `.env.local` with your values:

   ```bash
   VITE_AGENTX_URL=https://your-custom-url.com
   VITE_RAGSTER_API_URL=https://your-custom-url.com/api/ragster
   # ... etc
   ```

3. Restart your dev server for changes to take effect

## Running the Apps

### KAT.ai

```bash
bun run dev:kat
# or
cd apps/kat-ai && bun run dev
```

### Genius Talent

```bash
bun run dev:genius
# or
cd apps/genius-talent && bun run dev
```

## Verification

To verify your apps are correctly configured:

1. **Start the app** - Run the dev server
2. **Open Admin Settings** - Navigate to the settings panel
3. **Check Identity (AM) tab** - Should show "AM Server Offline" if not connected, or list organizations if connected
4. **Check Collections** - Should load Ragster collections if connected

## Architecture

```
┌─────────────────┐
│   KAT.ai App    │
│ (Vite Frontend) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  AgentX Collective (fly.io) │
│  agentx-collective.fly.dev  │
├─────────────────────────────┤
│  ┌──────────────┐          │
│  │   Ragster    │          │
│  │ /api/ragster │          │
│  └──────────────┘          │
│  ┌──────────────┐          │
│  │ AntiMatterDB │          │
│  │/api/antimatter│         │
│  └──────────────┘          │
│  ┌──────────────┐          │
│  │  Collective  │          │
│  │ /api/collective│        │
│  └──────────────┘          │
└─────────────────────────────┘
```

## Code References

The environment variables are used in:

- **`packages/bree-ai-core/src/utils/ragster.ts`** - Ragster API client
- **`packages/bree-ai-core/src/utils/collective.ts`** - Collective API client
- **`packages/bree-ai-core/src/utils/antimatter.ts`** - AntiMatterDB client
- **`packages/bree-ai-core/src/components/AdminSettings.tsx`** - Admin UI

## Troubleshooting

### "Collection ID is required" Error

- Set `VITE_RAGSTER_DEFAULT_COLLECTION_ID` or select a collection in Admin Settings

### "AM Server Offline" in Identity Tab

- Verify `VITE_ANTIMATTER_URL` is correct
- Check that AgentX Collective is running and accessible

### CORS Errors

- Ensure the AgentX Collective server has CORS configured for your app's origin
- For local dev, the server should allow `http://localhost:8769` (kat-ai) and other ports

### API Calls Failing

- Check browser console for the actual URLs being called
- Verify the environment variables are loaded (check `import.meta.env` in browser console)
- Ensure the AgentX Collective endpoints are accessible

## Notes

- Environment variables are loaded at **build time** by Vite
- Changes to `.env.local` require **restarting the dev server**
- `.env.local` is gitignored - never commit it with sensitive data
- Use `.env.example` as a template for team members
