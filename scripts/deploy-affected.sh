#!/usr/bin/env bash
set -e

# ============================================================================
# Nx-Aware Fly.io Deployment Script
# ============================================================================
# Deploys only apps affected by changes since last deploy
# Usage:
#   ./scripts/deploy-affected.sh              # Deploy all affected apps
#   ./scripts/deploy-affected.sh playbooks-ai # Deploy specific app
#   BASE_REF=main ./scripts/deploy-affected.sh # Custom base branch
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# Configuration
BASE_REF="${BASE_REF:-HEAD~1}"
SPECIFIC_APP="${1:-}"
DRY_RUN="${DRY_RUN:-false}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

# ============================================================================
# Helper Functions
# ============================================================================

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if app has fly.toml
has_fly_config() {
    local app=$1
    [ -f "apps/$app/fly.toml" ]
}

# Get affected projects
get_affected_apps() {
    if [ -n "$SPECIFIC_APP" ]; then
        echo "$SPECIFIC_APP"
        return
    fi

    log_info "Detecting affected projects (base: $BASE_REF)..."

    # Get all affected projects
    local affected=$(npx nx show projects --affected --base="$BASE_REF" 2>/dev/null || echo "")

    if [ -z "$affected" ]; then
        log_warning "No affected projects detected"
        return
    fi

    # Filter for apps with fly.toml
    local deployable=""
    for project in $affected; do
        # Remove @ prefix and scope
        local app=$(echo "$project" | sed 's/@[^/]*\///')

        if has_fly_config "$app"; then
            deployable="$deployable $app"
        fi
    done

    echo "$deployable"
}

# Deploy single app
deploy_app() {
    local app=$1

    log_info "Deploying $app to Fly.io..."

    if [ ! -f "apps/$app/fly.toml" ]; then
        log_error "No fly.toml found for $app"
        return 1
    fi

    if [ "$DRY_RUN" = "true" ]; then
        log_warning "DRY RUN: Would deploy $app"
        return 0
    fi

    # Build with Nx (uses cache)
    log_info "Building $app with Nx cache..."
    npx nx build "$app" || {
        log_error "Build failed for $app"
        return 1
    }

    # Deploy to fly.io
    log_info "Deploying to fly.io..."
    fly deploy "apps/$app" --remote-only || {
        log_error "Deployment failed for $app"
        return 1
    }

    log_success "$app deployed successfully!"
    return 0
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    log_info "Nx-Aware Fly.io Deployment"
    echo ""

    # Ensure we're in a git repo
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not a git repository"
        exit 1
    fi

    # Check fly CLI is installed
    if ! command -v fly &> /dev/null; then
        log_error "fly CLI not found. Install: https://fly.io/docs/flyctl/install/"
        exit 1
    fi

    # Get affected apps
    local apps=$(get_affected_apps)

    if [ -z "$apps" ]; then
        log_warning "No deployable apps affected by changes"
        exit 0
    fi

    log_info "Apps to deploy: $apps"
    echo ""

    # Deploy each app
    local success_count=0
    local fail_count=0

    for app in $apps; do
        if deploy_app "$app"; then
            ((success_count++))
        else
            ((fail_count++))
        fi
        echo ""
    done

    # Summary
    echo "════════════════════════════════════════"
    log_info "Deployment Summary"
    log_success "Successful: $success_count"
    if [ $fail_count -gt 0 ]; then
        log_error "Failed: $fail_count"
        exit 1
    fi
    echo "════════════════════════════════════════"
}

main "$@"
