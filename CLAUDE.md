# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a Wiki Desktop Application built with Electron, Next.js (Frontend), and FastAPI (Backend).

## Project Architecture

- `backend/` - FastAPI backend with SQLAlchemy
- `renderer/` - Next.js frontend application  
- `electron/` - Electron main process
- `database/` - Database schema and migrations
- `tests/` - Test suites (unit, integration, e2e)
- `docs/` - Project documentation

## Docker Environment

### Available Services
- **backend**: FastAPI server (port 8000)
- **frontend**: Next.js dev server (port 3000)
- **test-runner**: pytest environment
- **test-db**: SQLite database

### Docker Commands

#### Development
```bash
# Start all services
docker-compose up

# Start services in background
docker-compose up -d

# Start specific service
docker-compose up backend
docker-compose up frontend

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

#### Testing
```bash
# Run backend tests
docker-compose run test-runner

# Run tests with coverage
docker-compose run test-runner pytest tests/ --cov=backend --cov-report=html

# Run specific test
docker-compose run test-runner pytest tests/unit/test_articles.py -v
```

#### Database
```bash
# Reset database
docker-compose down
docker volume rm playground_claude_test_wiki-data
docker-compose up -d test-db backend
```

#### Cleanup
```bash
# Stop all services
docker-compose down

# Remove volumes
docker-compose down -v

# Rebuild images
docker-compose build --no-cache
```

## Development Workflow

### Local Development with Docker
1. Start Docker Desktop
2. Run `docker-compose up -d` to start services
3. Access frontend at http://localhost:3000
4. Access backend API at http://localhost:8000
5. API docs at http://localhost:8000/docs

### WSL Integration
- Docker Desktop WSL integration should be enabled
- Run commands from WSL terminal
- Hot reload works for both frontend and backend

## Current Configuration

The configuration in `.claude/settings.local.json` allows:
- `ls` commands via Bash
- `find` commands via Bash