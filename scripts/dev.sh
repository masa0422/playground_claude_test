#!/bin/bash

# Development script for Wiki Desktop App with enhanced error handling

set -e

echo "🚀 Starting Wiki Desktop App Development Environment"

# Environment detection
if grep -q Microsoft /proc/version 2>/dev/null; then
    echo "🐧 WSL environment detected"
    WSL_ENV=true
else
    echo "🖥️  Native environment detected"
    WSL_ENV=false
fi

# Function to check command availability
check_command() {
    local cmd=$1
    local install_msg=$2
    
    if ! command -v "$cmd" &> /dev/null; then
        echo "❌ $cmd is not installed. $install_msg"
        exit 1
    else
        echo "✅ $cmd is available"
    fi
}

# Check if Python is installed
check_command python3 "Please install Python 3.9 or higher."

# Check if Node.js is installed
check_command node "Please install Node.js 18 or higher."

# Check if npm is installed
check_command npm "Please install npm."

# Check versions
echo "🔍 Checking versions..."
python3 --version
node --version
npm --version

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "❌ Failed to create virtual environment"
        exit 1
    fi
fi

# Activate virtual environment
echo "🔄 Activating Python virtual environment..."
source venv/bin/activate
if [ $? -ne 0 ]; then
    echo "❌ Failed to activate virtual environment"
    exit 1
fi

# Install Python dependencies
echo "📥 Installing Python dependencies..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Python dependencies"
        exit 1
    fi
else
    echo "⚠️  requirements.txt not found, skipping Python dependencies"
fi

# Install Node.js dependencies with error handling
echo "📥 Installing Node.js dependencies..."
if [ "$WSL_ENV" = true ]; then
    echo "🔧 Using WSL-optimized npm install..."
    NODE_OPTIONS="--max-old-space-size=2048" npm install
else
    npm install
fi

if [ $? -ne 0 ]; then
    echo "❌ Failed to install Node.js dependencies"
    exit 1
fi

# Install renderer dependencies
echo "📥 Installing renderer dependencies..."
cd renderer

if [ "$WSL_ENV" = true ]; then
    echo "🔧 Using WSL-optimized npm install for renderer..."
    NODE_OPTIONS="--max-old-space-size=2048" npm install
else
    npm install
fi

if [ $? -ne 0 ]; then
    echo "❌ Failed to install renderer dependencies"
    cd ..
    exit 1
fi

cd ..

# Create data directory if it doesn't exist
mkdir -p data

# Seed database if it doesn't exist
if [ ! -f "data/wiki.db" ]; then
    echo "🌱 Seeding database with initial data..."
    python database/seed.py
fi

echo "✅ Development environment setup complete!"
echo ""
echo "Available commands:"
echo "  npm run dev          - Start development environment"
echo "  npm run build        - Build the application"
echo "  npm run test         - Run tests"
echo "  npm run lint         - Run linting"
echo "  npm run format       - Format code"
echo ""
echo "🎉 Happy coding!"