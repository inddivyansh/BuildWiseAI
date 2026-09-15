# ============================================================
# BuildWise AI — Makefile
# Convenient shortcuts for development tasks
# Usage: make <target>
# ============================================================

.PHONY: help up down dev dev-backend dev-frontend \
        test test-unit test-integration \
        migrate migrate-create shell-backend shell-db \
        lint format ingest-regulations verify-models \
        build clean logs

# ─── Help ─────────────────────────────────────────────────
help:
	@echo ""
	@echo "BuildWise AI — Development Commands"
	@echo "===================================="
	@echo ""
	@echo "  DOCKER (Production / Demo)"
	@echo "  make up              Start full stack (postgres + backend + frontend)"
	@echo "  make down            Stop all containers"
	@echo "  make build           Rebuild all Docker images"
	@echo "  make logs            Tail all container logs"
	@echo ""
	@echo "  DEVELOPMENT"
	@echo "  make dev             Start postgres + backend (hot-reload) in Docker"
	@echo "                       Run frontend separately: cd frontend && npm run dev"
	@echo "  make dev-backend     Start backend only (with volume mount)"
	@echo "  make dev-frontend    Start Vite dev server"
	@echo ""
	@echo "  DATABASE"
	@echo "  make migrate         Apply all pending Alembic migrations"
	@echo "  make migrate-create  Create a new migration (NAME=description)"
	@echo "  make shell-db        Open psql shell in postgres container"
	@echo "  make shell-backend   Open bash shell in backend container"
	@echo ""
	@echo "  TESTING"
	@echo "  make test            Run all tests"
	@echo "  make test-unit       Run unit tests only"
	@echo "  make test-integration Run integration tests only"
	@echo ""
	@echo "  CODE QUALITY"
	@echo "  make lint            Run ruff + mypy"
	@echo "  make format          Run ruff format + isort"
	@echo ""
	@echo "  DATA & SCRIPTS"
	@echo "  make ingest-regulations  Ingest NBC PDFs into RAG corpus"
	@echo "  make verify-models   Verify Gemini models are accessible"
	@echo ""
	@echo "  make clean           Remove containers, volumes, and build artifacts"
	@echo ""

# ─── Environment ──────────────────────────────────────────
ENV_FILE := .env
ifeq (,$(wildcard $(ENV_FILE)))
    $(warning .env file not found. Copy .env.example to .env and fill in values.)
endif

# ─── Docker — Production ──────────────────────────────────
up:
	@echo "Starting BuildWise AI (production mode)..."
	docker compose up --build -d
	@echo "Services started. Frontend: http://localhost:80  Backend: http://localhost:8000"

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

# ─── Docker — Development ─────────────────────────────────
dev:
	@echo "Starting development stack (postgres + backend)..."
	docker compose -f docker-compose.dev.yml up -d
	@echo ""
	@echo "Backend running at: http://localhost:8000"
	@echo "API docs at:        http://localhost:8000/docs"
	@echo ""
	@echo "Start frontend with:  cd frontend && npm run dev"

dev-backend:
	docker compose -f docker-compose.dev.yml up -d postgres backend

dev-frontend:
	cd frontend && npm run dev

# ─── Database Migrations ──────────────────────────────────
migrate:
	docker compose -f docker-compose.dev.yml exec backend \
		alembic -c alembic/alembic.ini upgrade head

migrate-create:
	@if [ -z "$(NAME)" ]; then echo "Usage: make migrate-create NAME=your_migration_name"; exit 1; fi
	docker compose -f docker-compose.dev.yml exec backend \
		alembic -c alembic/alembic.ini revision --autogenerate -m "$(NAME)"

# ─── Shells ───────────────────────────────────────────────
shell-backend:
	docker compose -f docker-compose.dev.yml exec backend bash

shell-db:
	docker compose -f docker-compose.dev.yml exec postgres \
		psql -U $${POSTGRES_USER:-buildwise_user} -d $${POSTGRES_DB:-buildwise}

# ─── Testing ──────────────────────────────────────────────
test:
	docker compose -f docker-compose.dev.yml exec backend \
		pytest tests/ -v --tb=short

test-unit:
	docker compose -f docker-compose.dev.yml exec backend \
		pytest tests/unit/ -v --tb=short

test-integration:
	docker compose -f docker-compose.dev.yml exec backend \
		pytest tests/integration/ -v --tb=short

# ─── Code Quality ─────────────────────────────────────────
lint:
	cd backend && ruff check . && mypy app/ engines/

format:
	cd backend && ruff format . && ruff check --fix .

# ─── Data Scripts ─────────────────────────────────────────
ingest-regulations:
	docker compose -f docker-compose.dev.yml exec backend \
		python scripts/ingest_regulations.py

verify-models:
	docker compose -f docker-compose.dev.yml exec backend \
		python scripts/verify_models.py

# ─── Cleanup ──────────────────────────────────────────────
clean:
	docker compose down -v --remove-orphans
	docker compose -f docker-compose.dev.yml down -v --remove-orphans
	find backend -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find backend -name "*.pyc" -delete 2>/dev/null || true
	rm -rf frontend/node_modules frontend/dist frontend/.vite
	@echo "Clean complete."
