#!/bin/bash

# Build script for Wiki Desktop App with WSL memory optimization

set -e

echo "🔨 Building Wiki Desktop App (WSL optimized)"

# WSL environment detection
if grep -q Microsoft /proc/version 2>/dev/null; then
    echo "🐧 WSL environment detected - using memory-safe build"
    WSL_ENV=true
else
    echo "🖥️  Native environment detected"
    WSL_ENV=false
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf renderer/out/

# Build Electron main process first (lighter build)
echo "📦 Building Electron main process..."
npm run build:electron

# Build renderer (Next.js) with memory optimization
echo "📦 Building renderer..."
cd renderer

if [ "$WSL_ENV" = true ]; then
    echo "🔧 Using WSL-optimized build settings..."
    NODE_OPTIONS="--max-old-space-size=2048" npm run build
else
    NODE_OPTIONS="--max-old-space-size=4096" npm run build
fi

cd ..

# Build backend (if needed)
echo "📦 Preparing backend..."
# Backend doesn't need building for Python, but we could add compilation steps here

echo "✅ Build complete!"
echo ""
echo "Output directories:"
echo "  dist/electron/       - Electron main process"
echo "  renderer/out/        - Next.js renderer"
echo ""
echo "To run the built application:"
echo "  npm start"