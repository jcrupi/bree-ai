#!/bin/bash

# Configuration Verification Script
# This script helps verify that the apps are correctly configured to point to fly.io

echo "🔍 BREE AI Configuration Verification"
echo "=========================================="
echo ""

# Function to check if a file exists
check_file() {
    if [ -f "$1" ]; then
        echo "✅ $1 exists"
        return 0
    else
        echo "❌ $1 missing"
        return 1
    fi
}

# Function to check if a URL is in a file
check_url() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo "✅ $1 contains $2"
        return 0
    else
        echo "❌ $1 does not contain $2"
        return 1
    fi
}

echo "📁 Checking Configuration Files..."
echo ""

# Check KAT.ai
echo "KAT.ai App:"
check_file "apps/kat-ai/.env.local"
check_file "apps/kat-ai/.env.example"
check_url "apps/kat-ai/.env.local" "agentx-collective.fly.dev"
echo ""

# Check Genius Talent
echo "Genius Talent App:"
check_file "apps/genius-talent/.env.local"
check_file "apps/genius-talent/.env.example"
check_url "apps/genius-talent/.env.local" "agentx-collective.fly.dev"
echo ""

# Check code updates
echo "📝 Checking Code Updates..."
echo ""
echo "AntiMatter Utils:"
check_url "packages/bree-ai-core/src/utils/antimatter.ts" "import.meta.env.VITE_ANTIMATTER_URL"
echo ""

# Check documentation
echo "📚 Checking Documentation..."
echo ""
check_file "ENV_CONFIG.md"
check_file "CONFIGURATION_CHANGES.md"
check_file ".gitignore"
echo ""

echo "=========================================="
echo "🎯 Configuration Status Summary"
echo "=========================================="
echo ""

# Count successes
total_checks=10
passed=0

[ -f "apps/kat-ai/.env.local" ] && ((passed++))
[ -f "apps/kat-ai/.env.example" ] && ((passed++))
[ -f "apps/genius-talent/.env.local" ] && ((passed++))
[ -f "apps/genius-talent/.env.example" ] && ((passed++))
grep -q "agentx-collective.fly.dev" "apps/kat-ai/.env.local" 2>/dev/null && ((passed++))
grep -q "agentx-collective.fly.dev" "apps/genius-talent/.env.local" 2>/dev/null && ((passed++))
grep -q "import.meta.env.VITE_ANTIMATTER_URL" "packages/bree-ai-core/src/utils/antimatter.ts" 2>/dev/null && ((passed++))
[ -f "ENV_CONFIG.md" ] && ((passed++))
[ -f "CONFIGURATION_CHANGES.md" ] && ((passed++))
[ -f ".gitignore" ] && ((passed++))

echo "Passed: $passed/$total_checks checks"
echo ""

if [ $passed -eq $total_checks ]; then
    echo "✨ All configuration checks passed!"
    echo ""
    echo "🚀 Next Steps:"
    echo "   1. Run: bun run dev:kat"
    echo "   2. Open: http://localhost:8769"
    echo "   3. Check Admin Settings → Identity (AM) tab"
    echo "   4. Verify connection to fly.io services"
else
    echo "⚠️  Some checks failed. Please review the output above."
fi

echo ""
