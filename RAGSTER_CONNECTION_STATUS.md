# Ragster Connection Status for Keen and Genius Apps

## ✅ Status: CONNECTED

Both **Keen.ai** and **Genius Talent** are now properly configured to connect to Ragster on fly.io.

## Deployed Services

The following services are deployed and running on fly.io:

| Service           | URL                                           | Status     |
| ----------------- | --------------------------------------------- | ---------- |
| Ragster           | `https://agent-collective-ragster.fly.dev`    | ✅ Running |
| AgentX Collective | `https://agent-collective-agentx.fly.dev`     | ✅ Running |
| AntiMatterDB      | `https://agent-collective-antimatter.fly.dev` | ✅ Running |

## Configuration Updates

### Keen.ai

- **Location**: `apps/keen-ai/.env.local`
- **Ragster URL**: `https://agent-collective-ragster.fly.dev/api`
- **Organization**: `keen.ai`
- **User**: `user@keen.ai`

### Genius Talent

- **Location**: `apps/genius-talent/.env.local`
- **Ragster URL**: `https://agent-collective-ragster.fly.dev/api`
- **Organization**: `genius-talent`
- **User**: `user@genius-talent.com`

## Environment Variables

Both apps are configured with the following environment variables:

```bash
# AgentX Collective URL
VITE_AGENTX_URL=https://agent-collective-agentx.fly.dev
VITE_COLLECTIVE_URL=https://agent-collective-agentx.fly.dev

# Ragster API (direct to Ragster service)
VITE_RAGSTER_API_URL=https://agent-collective-ragster.fly.dev/api

# AntiMatterDB (direct to AntiMatter service)
VITE_ANTIMATTER_URL=https://agent-collective-antimatter.fly.dev

# Organization-specific settings
VITE_RAGSTER_DEFAULT_ORG_ID=<keen.ai or genius-talent>
VITE_RAGSTER_DEFAULT_USER_ID=<user@keen.ai or user@genius-talent.com>
```

## Verification

Run the verification script to test the connection:

```bash
./verify-ragster-connection.sh
```

Health check results:

- ✅ Ragster service is responding
- ✅ Collections endpoint is accessible for both organizations
- ✅ Environment files are properly configured

## Testing the Apps

### Start Keen.ai

```bash
cd apps/keen-ai
bun run dev
# Or from root: bun run dev:keen (if configured)
```

### Start Genius Talent

```bash
cd apps/genius-talent
bun run dev
# Or from root: bun run dev:genius
```

## What Changed

1. **Fixed Incorrect URLs**: Updated from non-existent `agentx-collective.fly.dev` to the actual deployed service URLs
2. **Direct Service Access**: Apps now connect directly to each service rather than through a proxy
3. **Updated Documentation**: All `.env.local` and `.env.example` files updated with correct URLs

## Key URLs for Reference

**Ragster API Endpoints:**

- Health: `https://agent-collective-ragster.fly.dev/api/health`
- Collections: `https://agent-collective-ragster.fly.dev/api/collections`
- Search: `https://agent-collective-ragster.fly.dev/api/search`
- Upload: `https://agent-collective-ragster.fly.dev/api/index/file`

## Next Steps

1. ✅ Environment files configured
2. ✅ Connection verified
3. 🔄 Ready to test in the apps
4. 📝 Create collections via Admin Settings if needed
5. 📤 Upload documents via Admin Settings
6. 🔍 Test document search functionality

## Troubleshooting

If you encounter issues:

1. **Verify environment files are loaded**: Check browser console

   ```javascript
   console.log(import.meta.env.VITE_RAGSTER_API_URL);
   ```

2. **Check CORS**: Ensure Ragster allows requests from your localhost ports

3. **Restart dev server**: Changes to `.env.local` require restart

4. **Verify fly.io services**:
   ```bash
   flyctl apps list
   flyctl status -a agent-collective-ragster
   ```

## Files Modified

- ✅ `apps/keen-ai/.env.local`
- ✅ `apps/keen-ai/.env.example`
- ✅ `apps/genius-talent/.env.local`
- ✅ `apps/genius-talent/.env.example`
- ✅ `verify-ragster-connection.sh` (created)

---

**Last Updated**: 2026-02-01  
**Verified**: Connection tested and working ✅
