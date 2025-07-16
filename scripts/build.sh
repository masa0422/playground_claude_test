#!/bin/bash

# Build script for Wiki Desktop App

set -e

echo "🔨 Building Wiki Desktop App"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf renderer/out/

# Build renderer (Next.js)
echo "📦 Building renderer..."
cd renderer
npm run build
cd ..

# Build Electron main process
echo "📦 Building Electron main process..."
npm run build:electron

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