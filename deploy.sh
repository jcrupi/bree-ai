#!/bin/bash

# BREE AI Multi-App Deployment Script for fly.io
# Usage: ./deploy.sh [app-name] or ./deploy.sh all

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

# Function to check if fly CLI is installed
check_fly_cli() {
    if ! command -v fly &> /dev/null; then
        print_error "fly CLI is not installed!"
        echo ""
        echo "Install it with:"
        echo "  curl -L https://fly.io/install.sh | sh"
        echo ""
        exit 1
    fi
    print_success "fly CLI is installed"
}

# Function to check if user is logged in to fly.io
check_fly_auth() {
    if ! fly auth whoami &> /dev/null; then
        print_error "You are not logged in to fly.io!"
        echo ""
        echo "Login with:"
        echo "  fly auth login"
        echo ""
        exit 1
    fi
    print_success "Authenticated with fly.io"
}

# Function to deploy an app
deploy_app() {
    local app_name=$1
    local app_dir="apps/${app_name}"

    if [ ! -d "$app_dir" ]; then
        print_error "App directory not found: $app_dir"
        return 1
    fi

    if [ ! -f "$app_dir/fly.toml" ]; then
        print_error "fly.toml not found in $app_dir"
        return 1
    fi

    # Get the actual fly app name from fly.toml
    local fly_app_name=$(grep "^app =" "$app_dir/fly.toml" | sed 's/app = "\(.*\)"/\1/' | sed "s/app = '\(.*\)'/\1/")
    
    if [ -z "$fly_app_name" ]; then
        fly_app_name=$app_name
    fi

    print_info "Deploying ${app_name} as fly app '${fly_app_name}'..."

    # Check if app exists, if not, create it
    if ! fly apps list | grep -q "^${fly_app_name} "; then
        print_warning "App '${fly_app_name}' doesn't exist. Creating it..."
        fly apps create "${fly_app_name}" --org personal
    fi

    # Deploy the app using root as context
    if fly deploy . --dockerfile "${app_dir}/Dockerfile" --config "${app_dir}/fly.toml"; then
        print_success "Successfully deployed ${app_name}"
        echo ""
        print_info "App URL: https://${fly_app_name}.fly.dev"
        echo ""
    else
        print_error "Failed to deploy ${app_name}"
        return 1
    fi
}

# Function to set environment secrets for an app
set_secrets() {
    local app_name=$1

    print_info "Setting secrets for ${app_name}..."

    case $app_name in
        "kat-ai")
            fly secrets set \
                VITE_RAGSTER_DEFAULT_ORG_ID="kat.ai" \
                VITE_APP_NAME="KAT.ai" \
                VITE_BRAND_ID="kat-ai" \
                -a kat-ai
            ;;
        "genius-talent")
            fly secrets set \
                VITE_RAGSTER_DEFAULT_ORG_ID="genius-talent" \
                VITE_APP_NAME="Genius Talent" \
                VITE_BRAND_ID="genius-talent" \
                -a genius-talent
            ;;
        "habitaware-ai")
            fly secrets set \
                VITE_RAGSTER_DEFAULT_ORG_ID="habitaware" \
                VITE_APP_NAME="HabitAware AI" \
                VITE_BRAND_ID="habitaware-ai" \
                -a habitaware-ai
            ;;
        "the-vineyard")
            fly secrets set \
                VITE_RAGSTER_DEFAULT_ORG_ID="the-vineyard" \
                VITE_APP_NAME="The Vineyard" \
                VITE_BRAND_ID="the-vineyard" \
                -a the-vineyard
            ;;
        "bree-api")
            print_warning "Please ensure the following secrets are set for bree-api:"
            echo "  fly secrets set ANTHROPIC_API_KEY=sk-... -a bree-api"
            echo "  fly secrets set MIGHTY_API_KEY=... -a bree-api"
            echo "  fly secrets set DB_PATH=/app/data/bree.db -a bree-api"
            echo "  fly secrets set OPENAI_API_KEY=sk-... -a bree-api"
            echo "  fly secrets set REALTIME_URL=https://bree-api-realtime.fly.dev -a bree-api"
            ;;
        "bree-api-realtime"|"api-realtime")
            print_warning "Please ensure the following secrets are set for bree-api-realtime:"
            echo "  fly secrets set NATS_URL=nats://... -a bree-api-realtime"
            echo "  fly secrets set JWT_SECRET=... -a bree-api-realtime"
            echo "  fly secrets set DB_PATH=/app/data/bree.db -a bree-api-realtime"
            echo "  fly secrets set TWILIO_SID=... -a bree-api-realtime"
            echo "  fly secrets set TWILIO_TOKEN=... -a bree-api-realtime"
            echo "  fly secrets set TWILIO_PHONE_NUMBER=... -a bree-api-realtime"
            ;;
    esac

    print_success "Secrets configured for ${app_name}"
}

# Function to display app status
show_status() {
    local app_name=$1

    print_info "Status for ${app_name}:"
    fly status -a "${app_name}" || print_warning "App '${app_name}' not found or not deployed"
    echo ""
}

# Main deployment logic
main() {
    local target=$1

    print_info "BREE AI Multi-App Deployment Script"
    echo ""

    # Pre-flight checks
    check_fly_cli
    check_fly_auth
    echo ""

    case $target in
        "all")
            print_info "Deploying all apps..."
            echo ""

            # Deploy data plane first
            deploy_app "api"

            # Deploy real-time plane
            deploy_app "api-realtime"

            # Deploy frontend apps
            deploy_app "kat-ai"
            deploy_app "genius-talent"
            deploy_app "habitaware-ai"
            deploy_app "the-vineyard"
            deploy_app "talent-village-ai"
            deploy_app "playbooks-ai"

            echo ""
            print_success "All apps deployed successfully!"
            echo ""
            print_info "App URLs:"
            echo "  - API (data):       https://bree-api.fly.dev"
            echo "  - API (realtime):   https://bree-api-realtime.fly.dev"
            echo "  - KAT.ai:           https://kat-ai.fly.dev"
            echo "  - Genius:           https://genius-talent.fly.dev"
            echo "  - HabitAware:       https://habitaware-ai.fly.dev"
            echo "  - The Vineyard:     https://the-vineyard.fly.dev"
            echo "  - Talent Village:   https://talent-village-ai.fly.dev"
            echo "  - Playbooks AI:     https://playbooks-ai.fly.dev"
            ;;

        "api")
            deploy_app "api"
            ;;

        "api-realtime"|"realtime"|"rt")
            deploy_app "api-realtime"
            ;;

        "kat-ai"|"kat")
            deploy_app "kat-ai"
            ;;

        "genius-talent"|"genius")
            deploy_app "genius-talent"
            ;;

        "habitaware-ai"|"habitaware")
            deploy_app "habitaware-ai"
            ;;

        "the-vineyard"|"vineyard")
            deploy_app "the-vineyard"
            ;;

        "talent-village-ai"|"talent-village"|"tv")
            deploy_app "talent-village-ai"
            ;;

        "playbooks-ai"|"playbooks")
            deploy_app "playbooks-ai"
            ;;

        "status")
            show_status "bree-api"
            show_status "bree-api-realtime"
            show_status "kat-ai"
            show_status "genius-talent"
            show_status "habitaware-ai"
            show_status "the-vineyard"
            show_status "talent-village-ai"
            show_status "playbooks-ai"
            ;;

        "secrets")
            set_secrets "kat-ai"
            set_secrets "genius-talent"
            set_secrets "habitaware-ai"
            set_secrets "bree-api"
            ;;

        "help"|"--help"|"-h"|"")
            echo "Usage: ./deploy.sh [target]"
            echo ""
            echo "Targets:"
            echo "  all              Deploy all apps (API + all frontends)"
            echo "  api              Deploy API server only"
            echo "  kat-ai           Deploy KAT.ai only"
            echo "  genius-talent    Deploy Genius Talent only"
            echo "  habitaware-ai    Deploy HabitAware AI only"
            echo "  playbooks-ai     Deploy Playbooks AI only"
            echo "  status           Show status of all apps"
            echo "  secrets          Configure environment secrets for all apps"
            echo "  help             Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./deploy.sh all              # Deploy everything"
            echo "  ./deploy.sh kat-ai           # Deploy only KAT.ai"
            echo "  ./deploy.sh status           # Check status of all apps"
            ;;

        *)
            print_error "Unknown target: $target"
            echo ""
            echo "Run './deploy.sh help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
