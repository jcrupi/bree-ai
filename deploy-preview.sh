#!/bin/bash
# deploy-preview.sh — Deploy any bree-ai app to a branch-based preview on Fly.io
#
# Usage:
#   ./deploy-preview.sh <app-dir>                  # Deploy current branch
#   ./deploy-preview.sh <app-dir> <branch-name>    # Deploy specific branch
#   ./deploy-preview.sh <app-dir> --destroy        # Destroy preview app
#   ./deploy-preview.sh <app-dir> --status         # Check preview status
#
# Examples:
#   ./deploy-preview.sh api
#   ./deploy-preview.sh habitaware-ai feat/parenting-book
#   ./deploy-preview.sh api --destroy

set -euo pipefail

APP_DIR="${1:?Usage: ./deploy-preview.sh <app-dir> [branch|--destroy|--status]}"
ACTION="${2:-}"

# Resolve paths
REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
FLY_TOML="$REPO_ROOT/apps/$APP_DIR/fly.toml"
DOCKERFILE="$REPO_ROOT/apps/$APP_DIR/Dockerfile"

if [[ ! -f "$FLY_TOML" ]]; then
  echo "❌ No fly.toml found at $FLY_TOML"
  echo "   Available apps:"
  ls -1 "$REPO_ROOT/apps/*/fly.toml" 2>/dev/null | sed 's|.*/apps/||;s|/fly.toml||' | sed 's/^/     /'
  exit 1
fi

if [[ ! -f "$DOCKERFILE" ]]; then
  echo "❌ No Dockerfile found at $DOCKERFILE"
  exit 1
fi

# Get production app name from fly.toml
PROD_APP=$(grep "^app = " "$FLY_TOML" | head -1 | sed "s/app = '//;s/'//")
if [[ -z "$PROD_APP" ]]; then
  echo "❌ Could not parse app name from $FLY_TOML"
  exit 1
fi

# Get branch name
if [[ -n "$ACTION" && "$ACTION" != "--destroy" && "$ACTION" != "--status" ]]; then
  BRANCH="$ACTION"
else
  BRANCH=$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD)
fi

# Sanitize branch name: lowercase, replace non-alphanum with hyphens, trim
SANITIZED=$(echo "$BRANCH" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')

# Guard against empty branch name
if [[ -z "$SANITIZED" ]]; then
  echo "❌ Branch name '$BRANCH' sanitized to empty string."
  echo "   Make sure you're on a feature branch, or pass a branch name."
  echo "   Usage: ./deploy-preview.sh <app-dir> [branch-name]"
  exit 1
fi

# Skip preview for main/master
if [[ "$SANITIZED" == "main" || "$SANITIZED" == "master" ]]; then
  echo "⚠️  You're on '$BRANCH'. Use regular deploy for production."
  echo "   flyctl deploy --config $FLY_TOML --dockerfile $DOCKERFILE --remote-only"
  exit 0
fi

# Truncate to fit Fly's 30-char app name limit
MAX_SUFFIX_LEN=$((30 - ${#PROD_APP} - 1))  # -1 for the hyphen
if [[ $MAX_SUFFIX_LEN -lt 4 ]]; then
  echo "❌ Production app name '$PROD_APP' is too long for preview naming"
  exit 1
fi
SANITIZED="${SANITIZED:0:$MAX_SUFFIX_LEN}"
SANITIZED="${SANITIZED%-}"  # Remove trailing hyphen if truncated

PREVIEW_APP="${PROD_APP}-${SANITIZED}"

echo "🔍 App:        $APP_DIR"
echo "🏭 Production: $PROD_APP"
echo "🌿 Branch:     $BRANCH"
echo "🚀 Preview:    $PREVIEW_APP"
echo ""

# Handle --status
if [[ "$ACTION" == "--status" ]]; then
  echo "📊 Checking status of $PREVIEW_APP..."
  flyctl status --app "$PREVIEW_APP" 2>&1 || echo "App does not exist."
  exit 0
fi

# Handle --destroy
if [[ "$ACTION" == "--destroy" ]]; then
  echo "🗑️  Destroying preview app: $PREVIEW_APP"
  flyctl apps destroy "$PREVIEW_APP" --yes 2>&1 || echo "App may not exist."
  echo "✅ Done"
  exit 0
fi

# Check if preview app exists, create if not
if ! flyctl status --app "$PREVIEW_APP" &>/dev/null; then
  echo "📦 Creating preview app: $PREVIEW_APP"
  flyctl apps create "$PREVIEW_APP" --org personal

  # Copy secrets from production app
  echo "🔑 Copying secrets from $PROD_APP..."
  SECRETS=$(flyctl secrets list --app "$PROD_APP" --json 2>/dev/null | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    names = [s['Name'] for s in data if 'Name' in s]
    print(' '.join(names))
except:
    pass
" 2>/dev/null || true)

  if [[ -n "$SECRETS" ]]; then
    echo "   Found secrets: $SECRETS"
    echo "   ⚠️  Secrets must be set manually (Fly doesn't allow reading values):"
    echo "   flyctl secrets list --app $PROD_APP"
    echo "   Then set them on the preview app:"
    echo "   flyctl secrets set KEY=VALUE --app $PREVIEW_APP"
  else
    echo "   No secrets found on production app."
  fi
  echo ""
else
  echo "✅ Preview app $PREVIEW_APP already exists"
fi

# Deploy
echo "🚀 Deploying to $PREVIEW_APP..."
flyctl deploy \
  --config "$FLY_TOML" \
  --dockerfile "$DOCKERFILE" \
  --app "$PREVIEW_APP" \
  --remote-only \
  --no-cache

echo ""
echo "✅ Preview deployed!"
echo "🌐 https://${PREVIEW_APP}.fly.dev/"
