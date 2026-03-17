#!/bin/bash
set -e

# FlySaaS Deployment Script
# Deploys SuperOrg and builds client template image

echo "🚀 Deploying FlySaaS to Fly.io..."

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
  echo "❌ flyctl is not installed. Install from: https://fly.io/docs/hands-on/install-flyctl/"
  exit 1
fi

# Check if logged in
if ! flyctl auth whoami &> /dev/null; then
  echo "❌ Not logged in to Fly.io. Run: flyctl auth login"
  exit 1
fi

# Navigate to monorepo root
cd "$(dirname "$0")/.."

# 1. Deploy SuperOrg
echo ""
echo "📦 Deploying SuperOrg..."
cd apps/flysaas-superorg

# Check if app exists
if ! flyctl apps list | grep -q "flysaas-superorg"; then
  echo "Creating SuperOrg app..."
  flyctl apps create flysaas-superorg

  # Create and attach PostgreSQL
  echo "Creating PostgreSQL database..."
  flyctl postgres create --name flysaas-postgres --region iad --initial-cluster-size 1
  flyctl postgres attach flysaas-postgres --app flysaas-superorg
fi

# Set secrets
echo "Setting secrets..."
if [ -z "$JWT_SECRET" ]; then
  JWT_SECRET=$(openssl rand -hex 32)
  echo "Generated JWT_SECRET: $JWT_SECRET"
fi

flyctl secrets set JWT_SECRET="$JWT_SECRET" --app flysaas-superorg

if [ -n "$FLY_API_TOKEN" ]; then
  flyctl secrets set FLY_API_TOKEN="$FLY_API_TOKEN" --app flysaas-superorg
fi

# Deploy
echo "Deploying SuperOrg..."
flyctl deploy --remote-only

# Run migrations
echo "Running database migrations..."
flyctl ssh console -C "bun src/db/migrate.ts" --app flysaas-superorg

cd ../..

# 2. Build and push client template
echo ""
echo "🏗️  Building client template..."
cd apps/flysaas-client-template

# Build Docker image
docker build -f Dockerfile -t registry.fly.io/flysaas-client-template:latest ../..

# Login to Fly registry
flyctl auth docker

# Push image
echo "Pushing client template to Fly registry..."
docker push registry.fly.io/flysaas-client-template:latest

cd ../..

echo ""
echo "✅ Deployment complete!"
echo ""
echo "SuperOrg: https://flysaas-superorg.fly.dev"
echo "Swagger: https://flysaas-superorg.fly.dev/swagger"
echo "JWKS: https://flysaas-superorg.fly.dev/auth/jwks"
echo ""
echo "Client template image: registry.fly.io/flysaas-client-template:latest"
echo ""
echo "To provision a new client org:"
echo "  curl -X POST https://flysaas-superorg.fly.dev/api/orgs \\"
echo "    -H \"Authorization: Bearer <token>\" \\"
echo "    -d '{\"org_slug\":\"test-org\",\"org_name\":\"Test Org\"}'"
