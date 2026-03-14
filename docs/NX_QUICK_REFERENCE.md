# Nx + Fly.io Quick Reference

One-page cheat sheet for common Nx and Fly.io commands in BREE AI monorepo.

## 🚀 Quick Commands

### Nx Core

```bash
# Visualize dependency graph
bun run nx:graph

# See what's affected by changes
bun run nx:affected
npx nx show projects --affected

# Build all projects (with cache)
bun run nx:build

# Build only affected projects
bun run nx:build:affected

# Test all projects
bun run nx:test

# Test only affected projects
bun run nx:test:affected

# Clear cache
bun run nx:reset
```

### Project-Specific

```bash
# Run any target for specific project
npx nx <target> <project-name>

# Examples:
npx nx dev playbooks-ai
npx nx build playbooks-ai
npx nx test @bree-ai/math-ai-engine
npx nx lint bree-ai-api
```

### Deployment

```bash
# Deploy all affected apps
./scripts/deploy-affected.sh

# Deploy specific app
./scripts/deploy-affected.sh playbooks-ai

# Dry run (see what would deploy)
DRY_RUN=true ./scripts/deploy-affected.sh

# Custom base for affected detection
BASE_REF=main ./scripts/deploy-affected.sh
```

---

## 📊 Common Workflows

### Before Making Changes

```bash
# 1. See current state
npx nx show projects --affected

# 2. Visualize dependencies
bun run nx:graph
```

### After Making Changes

```bash
# 1. Build affected
bun run nx:build:affected

# 2. Test affected
bun run nx:test:affected

# 3. Deploy affected (if on master)
./scripts/deploy-affected.sh
```

### Pull Request Workflow

```bash
# 1. Check what will be built/tested
npx nx show projects --affected --base=origin/master

# 2. Build and test
bun run nx:build:affected
bun run nx:test:affected

# 3. Push - GitHub Actions will run automatically
git push origin feature-branch
```

### Deploy to Production

```bash
# Option 1: Automatic (recommended)
git checkout master
git merge feature-branch
git push origin master
# GitHub Actions deploys affected apps

# Option 2: Manual
./scripts/deploy-affected.sh

# Option 3: Direct fly.io
npx nx build playbooks-ai
fly deploy apps/playbooks-ai
```

---

## 🎯 Affected Detection

### Base References

```bash
# Since last commit
npx nx show projects --affected

# Since specific commit
npx nx show projects --affected --base=HEAD~3

# Since main branch
npx nx show projects --affected --base=origin/main

# All projects (no filtering)
npx nx show projects --all
```

### With Filters

```bash
# Only apps (exclude packages)
npx nx show projects --affected | grep -v "@bree-ai"

# Only packages
npx nx show projects --affected | grep "@bree-ai"

# With fly.toml only
for p in $(npx nx show projects --affected); do
  [ -f "apps/$p/fly.toml" ] && echo $p
done
```

---

## 🔧 Nx Cache

### Cache Management

```bash
# View cache directory size
du -sh .nx/cache

# Clear all cache
bun run nx:reset
rm -rf .nx/cache

# Clear specific project cache
rm -rf .nx/cache/<project-hash>

# Disable cache for one command
npx nx build playbooks-ai --skip-nx-cache
```

### Cache Troubleshooting

```bash
# Why is cache not working?
# 1. Check nx.json configuration
cat nx.json | grep -A 10 "cacheableOperations"

# 2. Check if outputs are defined
npx nx show project playbooks-ai --json | grep outputs

# 3. Verify inputs haven't changed
git status

# 4. Check Nx Cloud connection (if using)
npx nx-cloud print-affected
```

---

## ☁️ Nx Cloud

### Setup & Configuration

```bash
# Connect to Nx Cloud
npx nx connect

# Check if connected
cat nx.json | grep nxCloudAccessToken

# Test remote cache
NX_CLOUD_ENABLED=true npx nx build playbooks-ai

# Disable remote cache temporarily
NX_CLOUD_ENABLED=false npx nx build playbooks-ai
```

### Environment Variables

```bash
# For CI/CD (GitHub Actions)
export NX_CLOUD_ACCESS_TOKEN=<your-token>

# For local development (optional)
export NX_CLOUD_ENABLED=true
```

---

## 🚁 Fly.io

### Basic Commands

```bash
# Login
fly auth login

# Get API token (for GitHub secrets)
fly auth token

# List all apps
fly apps list

# Check app status
fly status -a playbooks-ai

# View logs
fly logs -a playbooks-ai

# SSH into app
fly ssh console -a playbooks-ai
```

### Deployment

```bash
# Deploy with Dockerfile
fly deploy apps/playbooks-ai

# Deploy with remote builder
fly deploy apps/playbooks-ai --remote-only

# Deploy specific Dockerfile
fly deploy apps/playbooks-ai -c apps/playbooks-ai/Dockerfile

# Deploy with build args
fly deploy apps/playbooks-ai \
  --build-arg APP_NAME=playbooks-ai \
  --build-arg NX_CLOUD_ACCESS_TOKEN=$NX_CLOUD_ACCESS_TOKEN
```

### App Management

```bash
# Scale app
fly scale count 2 -a playbooks-ai
fly scale vm shared-cpu-2x -a playbooks-ai

# Set secrets
fly secrets set MY_SECRET=value -a playbooks-ai

# View secrets
fly secrets list -a playbooks-ai

# Restart app
fly restart -a playbooks-ai
```

---

## 🐛 Troubleshooting

### Nx Issues

```bash
# Cache not working?
bun run nx:reset && bun run nx:build

# Affected detection wrong?
git fetch --unshallow  # Ensure full history
npx nx affected:graph  # Visualize

# Build fails?
npx nx build playbooks-ai --verbose
NX_VERBOSE_LOGGING=true npx nx build playbooks-ai

# Dependency graph issues?
npx nx graph --focus=playbooks-ai
```

### Deployment Issues

```bash
# Script won't run?
chmod +x scripts/deploy-affected.sh

# Fly CLI not found?
curl -L https://fly.io/install.sh | sh

# Build fails in CI?
# Check GitHub Actions logs:
# Repository → Actions → Latest run

# Deploy fails?
fly logs -a playbooks-ai  # Check logs
fly status -a playbooks-ai  # Check status
```

---

## 📚 References

| Resource | URL |
|----------|-----|
| Full Guide | [docs/NX_FLYIO_GUIDE.md](./NX_FLYIO_GUIDE.md) |
| Nx Docs | https://nx.dev |
| Nx Cloud | https://nx.app |
| Fly.io Docs | https://fly.io/docs |

---

## 💡 Pro Tips

1. **Use `--dry-run`** to preview changes before executing
2. **Visualize first** with `nx graph` before making architectural changes
3. **Check affected** with `nx show projects --affected` before pushing
4. **Clear cache** if you see unexpected behavior
5. **Use Nx Cloud** for 70-90% faster builds across team
6. **Deploy affected only** to save time and resources
7. **Monitor fly logs** during deployment: `fly logs -a <app>`
8. **Set up notifications** in GitHub for deployment status

---

**Last Updated:** 2026-03-14
