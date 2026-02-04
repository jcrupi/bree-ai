# HabitAware.ai - Rebranding and Deployment Guide

## ✅ Rebranding Complete

**Former Name**: Keen.ai  
**New Name**: HabitAware.ai

### Changes Made:

1. **Directory Renamed**: `apps/keen-ai` → `apps/habitaware-ai`
2. **Package Name Updated**: `keen-ai` → `habitaware-ai`
3. **Environment Configuration**:
   - `VITE_APP_NAME`: "HabitAware.ai"
   - `VITE_BRAND_ID`: "habitaware-ai"
   - `VITE_RAGSTER_DEFAULT_ORG_ID`: "habitaware.ai"
   - `VITE_RAGSTER_DEFAULT_USER_ID`: "user@habitaware.ai"

4. **Branding Configuration Updated**:
   - Display Name: "HabitAware.ai"
   - Tagline: "Empowering Habit Awareness"
   - AI Name: "HabitAware Assistant"
   - Collection ID: "habitaware-collection"

5. **Root Package Scripts Updated**:
   - `bun run dev:habitaware`
   - `bun run build:habitaware`

## 🚀 Deploy to fly.io

### Prerequisites

```bash
# Install flyctl if not already installed
curl -L https://fly.io/install.sh | sh

# Login to fly.io
flyctl auth login
```

### Step 1: Build the App Locally (Test)

```bash
cd apps/habitaware-ai
bun install
bun run build
```

### Step 2: Deploy to fly.io

```bash
# Navigate to the app directory
cd apps/habitaware-ai

# Launch the app (first time)
flyctl launch --config fly.toml

# Or deploy if already launched
flyctl deploy
```

### Step 3: Set Secrets (if needed)

```bash
# Set any sensitive environment variables
flyctl secrets set SOME_SECRET=value
```

### Step 4: Verify Deployment

```bash
# Check app status
flyctl status

# View logs
flyctl logs

# Open the app
flyctl open
```

## 📋 Environment Variables (fly.io)

All environment variables are configured in `fly.toml`:

- `VITE_APP_NAME`: "HabitAware.ai"
- `VITE_BRAND_ID`: "habitaware-ai"
- `VITE_RAGSTER_API_URL`: "https://agent-collective-ragster.fly.dev/api"
- `VITE_RAGSTER_DEFAULT_ORG_ID`: "habitaware.ai"
- `VITE_RAGSTER_DEFAULT_USER_ID`: "user@habitaware.ai"

## 🔧 Local Development

```bash
# From root
bun run dev:habitaware

# Or from app directory
cd apps/habitaware-ai
bun run dev

# Access at http://localhost:7117
```

## 📦 Build for Production

```bash
cd apps/habitaware-ai
bun run build

# Output will be in dist/
```

## 🌐 Deployment URLs

**Production**: `https://habitaware-ai.fly.dev` (after deployment)  
**Local Dev**: `http://localhost:7117`

## 🔄 post-Deployment Tasks

1. **Create Ragster Collection**:
   - Access Admin Settings in the deployed app
   - Create a new collection with ID: `habitaware-collection`
   - Upload documents specific to HabitAware.ai

2. **Update DNS** (if custom domain):

   ```bash
   flyctl certs add habitaware.ai
   ```

3. **Monitor**:
   ```bash
   flyctl dashboard
   flyctl logs
   ```

## 🛠️ Troubleshooting

### Build Fails

Check that all dependencies are installed:

```bash
bun install
```

### Deployment Fails

Check fly.io logs:

```bash
flyctl logs
```

### App Won't Start

Verify environment variables:

```bash
flyctl config show
```

## 📝 Files Created/Modified

### New Files:

- `apps/habitaware-ai/fly.toml` - Fly.io configuration
- `apps/habitaware-ai/Dockerfile` - Docker build configuration
- `apps/habitaware-ai/nginx.conf` - Nginx server configuration

### Modified Files:

- `apps/habitaware-ai/package.json` - Updated package name
- `apps/habitaware-ai/.env.local` - Updated environment variables
- `apps/habitaware-ai/.env.example` - Updated environment variables
- `package.json` - Updated scripts
- `packages/bree-ai-core/src/config/branding.ts` - Updated brand configuration
- All component files referencing `keen-ai` → `habitaware-ai`

## 🎯 Next Steps

1. Deploy to fly.io
2. Create `habitaware-collection` in Ragster
3. Upload HabitAware-specific documents
4. Test the application end-to-end
5. (Optional) Configure custom domain

---

**Ready to deploy!** Run `flyctl launch` from `apps/habitaware-ai/` to get started. 🚀
