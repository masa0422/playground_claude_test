#!/bin/bash

# Start frontend development server script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_DIR/renderer"

echo "Starting Wiki Desktop Frontend..."
echo "Project directory: $PROJECT_DIR"
echo "Frontend directory: $FRONTEND_DIR"

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "Error: Frontend directory not found: $FRONTEND_DIR"
    exit 1
fi

# Change to frontend directory
cd "$FRONTEND_DIR" || exit 1

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the development server
echo "Starting Next.js development server..."
exec npm run dev -- --hostname 0.0.0.0 --port 3000