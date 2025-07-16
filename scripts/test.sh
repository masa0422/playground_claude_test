#!/bin/bash

# Test script for Wiki Desktop App

set -e

echo "🧪 Running tests for Wiki Desktop App"

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Run Python tests
echo "🐍 Running Python tests..."
python -m pytest tests/ -v --cov=backend --cov-report=html --cov-report=term-missing

# Run JavaScript/TypeScript tests
echo "🟨 Running JavaScript/TypeScript tests..."
npm test

# Run linting
echo "🔍 Running linting..."
npm run lint

echo "✅ All tests passed!"
echo ""
echo "Coverage reports:"
echo "  htmlcov/index.html   - Python coverage"
echo "  coverage/            - JavaScript coverage"