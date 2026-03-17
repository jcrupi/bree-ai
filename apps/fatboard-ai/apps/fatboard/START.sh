#!/bin/bash

echo "🚀 Starting FatBoard (BREE Stack)"
echo ""
echo "Stack:"
echo "  B - Bun runtime"
echo "  R - React frontend"
echo "  E - Elysia backend"
echo "  E - Eden type-safe API"
echo ""

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed!"
    echo ""
    echo "Install Bun:"
    echo "  curl -fsSL https://bun.sh/install | bash"
    echo ""
    exit 1
fi

echo "✓ Bun $(bun --version) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
bun install

echo ""
echo "✅ Ready to run!"
echo ""
echo "Start development:"
echo "  bun dev          # Both client & server"
echo "  bun dev:server   # Server only (port 8001)"
echo "  bun dev:client   # Client only (port 3001)"
echo ""
echo "Then open: http://localhost:3001"
echo ""
