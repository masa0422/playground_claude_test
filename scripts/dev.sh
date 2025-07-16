#!/bin/bash

# Development script for Wiki Desktop App

set -e

echo "🚀 Starting Wiki Desktop App Development Environment"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9 or higher."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating Python virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "📥 Installing Python dependencies..."
pip install -r requirements.txt

# Install Node.js dependencies
echo "📥 Installing Node.js dependencies..."
npm install

# Install renderer dependencies
echo "📥 Installing renderer dependencies..."
cd renderer && npm install && cd ..

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