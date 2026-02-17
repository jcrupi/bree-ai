#!/usr/bin/env bash
#
# BREE AI Feedback Retrieval Script
# Retrieve feedback from fly.io deployment
#

set -e

# Configuration
APP_NAME="${FLY_APP_NAME:-bree-api}"
FEEDBACK_DIR="/app/data/feedback"
LOCAL_OUTPUT_DIR="./feedback-downloads"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if fly CLI is installed
check_fly_cli() {
    if ! command -v fly &> /dev/null; then
        print_error "fly CLI not found. Please install it first:"
        echo "  curl -L https://fly.io/install.sh | sh"
        exit 1
    fi
    print_success "fly CLI found"
}

# Check if app exists
check_app() {
    print_info "Checking app: $APP_NAME"
    if ! fly apps list | grep -q "$APP_NAME"; then
        print_error "App '$APP_NAME' not found"
        echo "Available apps:"
        fly apps list
        exit 1
    fi
    print_success "App '$APP_NAME' exists"
}

# List all feedback files
list_feedbacks() {
    print_header "Listing Feedback Files"
    echo "Fetching feedback list from $APP_NAME..."

    fly ssh console -a "$APP_NAME" -C "ls -lh $FEEDBACK_DIR" || {
        print_error "Failed to list feedbacks"
        exit 1
    }
}

# Count feedback files
count_feedbacks() {
    print_header "Feedback Statistics"

    local count=$(fly ssh console -a "$APP_NAME" -C "ls -1 $FEEDBACK_DIR | wc -l" 2>/dev/null | tr -d ' ')

    if [ -n "$count" ]; then
        print_success "Total feedbacks: $count"

        # Count by type
        echo ""
        print_info "Feedback breakdown:"
        fly ssh console -a "$APP_NAME" -C "cd $FEEDBACK_DIR && grep -h '\"type\":' *.json 2>/dev/null | sort | uniq -c" || true
    else
        print_warning "No feedbacks found"
    fi
}

# View a specific feedback
view_feedback() {
    local filename="$1"

    if [ -z "$filename" ]; then
        print_error "Please provide a filename"
        echo "Usage: $0 view <filename>"
        exit 1
    fi

    print_header "Viewing Feedback: $filename"

    fly ssh console -a "$APP_NAME" -C "cat $FEEDBACK_DIR/$filename | jq '.'" || {
        print_error "Failed to view feedback"
        exit 1
    }
}

# Download all feedbacks
download_all() {
    print_header "Downloading All Feedbacks"

    # Create local output directory
    mkdir -p "$LOCAL_OUTPUT_DIR"

    print_info "Downloading to: $LOCAL_OUTPUT_DIR"

    # Get list of files
    local files=$(fly ssh console -a "$APP_NAME" -C "ls -1 $FEEDBACK_DIR" 2>/dev/null | tr -d '\r')

    if [ -z "$files" ]; then
        print_warning "No feedback files found"
        exit 0
    fi

    local count=0
    while IFS= read -r file; do
        if [ -n "$file" ]; then
            print_info "Downloading: $file"
            fly ssh console -a "$APP_NAME" -C "cat $FEEDBACK_DIR/$file" > "$LOCAL_OUTPUT_DIR/$file" 2>/dev/null
            ((count++))
        fi
    done <<< "$files"

    print_success "Downloaded $count feedback files to $LOCAL_OUTPUT_DIR"
}

# Download feedbacks by date
download_by_date() {
    local date="$1"

    if [ -z "$date" ]; then
        print_error "Please provide a date (YYYY-MM-DD)"
        echo "Usage: $0 download-date 2026-02-09"
        exit 1
    fi

    print_header "Downloading Feedbacks for $date"

    # Create local output directory
    mkdir -p "$LOCAL_OUTPUT_DIR"

    # Convert date format for filename matching (YYYY-MM-DD -> YYYY-MM-DD)
    local pattern="feedback-${date}"

    print_info "Searching for pattern: $pattern*"

    # Get matching files
    local files=$(fly ssh console -a "$APP_NAME" -C "ls -1 $FEEDBACK_DIR | grep '$pattern'" 2>/dev/null | tr -d '\r')

    if [ -z "$files" ]; then
        print_warning "No feedback files found for date: $date"
        exit 0
    fi

    local count=0
    while IFS= read -r file; do
        if [ -n "$file" ]; then
            print_info "Downloading: $file"
            fly ssh console -a "$APP_NAME" -C "cat $FEEDBACK_DIR/$file" > "$LOCAL_OUTPUT_DIR/$file" 2>/dev/null
            ((count++))
        fi
    done <<< "$files"

    print_success "Downloaded $count feedback files to $LOCAL_OUTPUT_DIR"
}

# Generate summary report
generate_report() {
    print_header "Generating Feedback Report"

    print_info "Fetching all feedbacks..."

    # Download all feedbacks first
    download_all

    echo ""
    print_header "Feedback Summary Report"

    # Count total
    local total=$(find "$LOCAL_OUTPUT_DIR" -name "*.json" | wc -l | tr -d ' ')
    echo "Total Feedbacks: $total"
    echo ""

    # Count by type
    echo "By Type:"
    jq -r '.type' "$LOCAL_OUTPUT_DIR"/*.json 2>/dev/null | sort | uniq -c | while read count type; do
        echo "  $type: $count"
    done
    echo ""

    # Count by brand
    echo "By Brand:"
    jq -r '.metadata.brand' "$LOCAL_OUTPUT_DIR"/*.json 2>/dev/null | sort | uniq -c | while read count brand; do
        echo "  $brand: $count"
    done
    echo ""

    # Recent feedbacks
    echo "Most Recent (last 5):"
    ls -t "$LOCAL_OUTPUT_DIR"/*.json 2>/dev/null | head -5 | while read file; do
        local name=$(jq -r '.name' "$file" 2>/dev/null)
        local type=$(jq -r '.type' "$file" 2>/dev/null)
        local date=$(jq -r '.receivedAt' "$file" 2>/dev/null)
        echo "  [$type] $name - $date"
    done

    print_success "Report generated"
}

# Watch for new feedbacks (polling)
watch_feedbacks() {
    print_header "Watching for New Feedbacks"
    print_info "Polling every 30 seconds... (Ctrl+C to stop)"
    echo ""

    local last_count=0

    while true; do
        local current_count=$(fly ssh console -a "$APP_NAME" -C "ls -1 $FEEDBACK_DIR | wc -l" 2>/dev/null | tr -d ' ')

        if [ -n "$current_count" ] && [ "$current_count" -gt "$last_count" ]; then
            local new_count=$((current_count - last_count))
            print_success "New feedback detected! (+$new_count)"

            # Show latest feedback
            fly ssh console -a "$APP_NAME" -C "ls -t $FEEDBACK_DIR | head -1 | xargs -I {} cat $FEEDBACK_DIR/{} | jq '.'"

            last_count=$current_count
        elif [ -n "$current_count" ]; then
            echo -ne "\rTotal feedbacks: $current_count (no new updates)"
        fi

        sleep 30
    done
}

# Show usage
show_usage() {
    cat << EOF
BREE AI Feedback Retrieval Script

Usage: $0 <command> [options]

Commands:
  list                List all feedback files
  count               Show feedback statistics
  view <filename>     View a specific feedback file
  download            Download all feedbacks
  download-date <date> Download feedbacks for a specific date (YYYY-MM-DD)
  report              Generate comprehensive feedback report
  watch               Watch for new feedbacks (polling)
  help                Show this help message

Environment Variables:
  FLY_APP_NAME       Fly.io app name (default: bree-api)

Examples:
  $0 list
  $0 count
  $0 view feedback-2026-02-09T02-01-34-585Z-76c7814e.json
  $0 download
  $0 download-date 2026-02-09
  $0 report
  $0 watch

Downloaded files are saved to: $LOCAL_OUTPUT_DIR

EOF
}

# Main script
main() {
    local command="${1:-help}"

    case "$command" in
        list)
            check_fly_cli
            check_app
            list_feedbacks
            ;;
        count)
            check_fly_cli
            check_app
            count_feedbacks
            ;;
        view)
            check_fly_cli
            check_app
            view_feedback "$2"
            ;;
        download)
            check_fly_cli
            check_app
            download_all
            ;;
        download-date)
            check_fly_cli
            check_app
            download_by_date "$2"
            ;;
        report)
            check_fly_cli
            check_app

            # Check if jq is installed
            if ! command -v jq &> /dev/null; then
                print_error "jq not found. Please install it first:"
                echo "  macOS: brew install jq"
                echo "  Linux: apt-get install jq"
                exit 1
            fi

            generate_report
            ;;
        watch)
            check_fly_cli
            check_app
            watch_feedbacks
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            print_error "Unknown command: $command"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
