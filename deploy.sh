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

    print_info "Deploying ${app_name}..."
    cd "$app_dir"

    # Check if app exists, if not, create it
    if ! fly apps list | grep -q "^${app_name} "; then
        print_warning "App '${app_name}' doesn't exist. Creating it..."
        fly apps create "${app_name}" --org personal
    fi

    # Deploy the app
    if fly deploy; then
        print_success "Successfully deployed ${app_name}"
        echo ""
        print_info "App URL: https://${app_name}.fly.dev"
        echo ""
    else
        print_error "Failed to deploy ${app_name}"
        cd - > /dev/null
        return 1
    fi

    cd - > /dev/null
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
        "bree-api")
            print_warning "Please set OPENAI_API_KEY manually:"
            echo "  fly secrets set OPENAI_API_KEY=sk-... -a bree-api"
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

            # Deploy API first
            deploy_app "api"

            # Deploy frontend apps
            deploy_app "kat-ai"
            deploy_app "genius-talent"
            deploy_app "habitaware-ai"

            echo ""
            print_success "All apps deployed successfully!"
            echo ""
            print_info "App URLs:"
            echo "  - API:          https://bree-api.fly.dev"
            echo "  - KAT.ai:       https://kat-ai.fly.dev"
            echo "  - Genius:       https://genius-talent.fly.dev"
            echo "  - HabitAware:   https://habitaware-ai.fly.dev"
            ;;

        "api")
            deploy_app "api"
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

        "status")
            show_status "bree-api"
            show_status "kat-ai"
            show_status "genius-talent"
            show_status "habitaware-ai"
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
