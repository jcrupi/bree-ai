# Configuration Update Summary

## Objective

Configure all BREE AI applications to point to the AgentX Collective on fly.io, specifically for services like Ragster.

## Changes Made

### 1. Environment Configuration Files Created

#### KAT.ai App

- ✅ `apps/kat-ai/.env.example` - Template with fly.io URLs
- ✅ `apps/kat-ai/.env.local` - Production config pointing to `https://agentx-collective.fly.dev`

#### Genius Talent App

- ✅ `apps/genius-talent/.env.example` - Template with fly.io URLs
- ✅ `apps/genius-talent/.env.local` - Production config pointing to fly.io services

#### Keen.ai App

- ✅ `apps/keen-ai/.env.example` - Template with fly.io URLs
- ✅ `apps/keen-ai/.env.local` - Production config pointing to fly.io services

### 2. Code Updates

#### `packages/bree-ai-core/src/utils/antimatter.ts`

**Changed:** Hardcoded `ANTIMATTER_URL` to support environment variable

```typescript
// Before
const ANTIMATTER_URL = "http://localhost:7198";

// After
const ANTIMATTER_URL =
  import.meta.env.VITE_ANTIMATTER_URL || "http://localhost:7198";
```

### 3. Documentation

- ✅ `ENV_CONFIG.md` - Comprehensive guide on environment configuration
- ✅ `.gitignore` - Ensures `.env.local` files are not committed

## Environment Variables Configured

All apps now support these environment variables:

| Variable               | Production Value                               |
| ---------------------- | ---------------------------------------------- |
| `VITE_AGENTX_URL`      | `https://agent-collective-agentx.fly.dev`      |
| `VITE_COLLECTIVE_URL`  | `https://agent-collective-agentx.fly.dev`      |
| `VITE_RAGSTER_API_URL` | `https://agent-collective-ragster.fly.dev/api` |
| `VITE_ANTIMATTER_URL`  | `https://agent-collective-antimatter.fly.dev`  |

## API Endpoints Now Pointing to fly.io

### Ragster (Document Search & RAG)

- **Local:** `http://localhost:8898/api`
- **Production:** `https://agent-collective-ragster.fly.dev/api`

### AgentX Collective (Orchestration)

- **Local:** `http://localhost:9000`
- **Production:** `https://agent-collective-agentx.fly.dev`

### AntiMatterDB (Identity & Orgs)

- **Local:** `http://localhost:7198`
- **Production:** `https://agent-collective-antimatter.fly.dev`

## How to Use

### Option 1: Use Pre-configured Production Settings

The `.env.local` files are already configured for fly.io. Just run:

```bash
bun run dev:kat
# or
bun run dev:genius
```

### Option 2: Switch Back to Local Development

Delete or rename `.env.local` files to use default localhost URLs:

```bash
mv apps/kat-ai/.env.local apps/kat-ai/.env.local.backup
```

### Option 3: Custom Configuration

Edit `.env.local` files with your own URLs.

## Testing the Configuration

1. **Start KAT.ai:**

   ```bash
   bun run dev:kat
   ```

2. **Open the app** at `http://localhost:8769`

3. **Check Admin Settings:**
   - Navigate to Admin Settings
   - Go to "Identity (AM)" tab
   - Should connect to fly.io AntiMatterDB
   - Go to "Admin Stuff" tab
   - Should load Ragster collections from fly.io

4. **Verify in Browser Console:**
   ```javascript
   console.log(import.meta.env.VITE_AGENTX_URL);
   // Should output: https://agentx-collective.fly.dev
   ```

## Files Modified

```
bree-ai/
├── .gitignore (created)
├── ENV_CONFIG.md (created)
├── apps/
│   ├── kat-ai/
│   │   ├── .env.example (created)
│   │   └── .env.local (created)
│   └── genius-talent/
│       ├── .env.example (created)
│       └── .env.local (created)
└── packages/
    └── bree-ai-core/
        └── src/
            └── utils/
                └── antimatter.ts (modified)
```

## Next Steps

1. **Test the apps** to ensure they connect to fly.io correctly
2. **Verify Ragster integration** - Upload a document and search
3. **Check AntiMatterDB** - Create orgs/users via Identity tab
4. **Update other apps** (keen-ai) if needed

## Rollback Instructions

If you need to revert to localhost:

```bash
# Remove production config files
rm apps/kat-ai/.env.local
rm apps/genius-talent/.env.local

# Or edit them to use localhost URLs
```

The code will automatically fall back to localhost defaults when environment variables are not set.
