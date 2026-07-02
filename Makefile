.PHONY: install install-backend install-frontend lint lint-backend lint-frontend \
        test test-backend test-frontend build build-backend build-frontend \
        docker-build docker-build-backend docker-build-frontend \
        dev dev-backend dev-frontend clean check pre-commit help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: install-backend install-frontend ## Install all dependencies

install-backend: ## Install backend dependencies
	pip install -r backend/requirements.txt
	pre-commit install

install-frontend: ## Install frontend dependencies
	cd frontend && npm ci

lint: lint-backend lint-frontend ## Run all linters

lint-backend: ## Lint backend
	ruff check backend/ tests/

lint-frontend: ## Lint frontend
	cd frontend && npm run lint

test: test-backend test-frontend ## Run all tests

test-backend: ## Run backend tests
	PYTHONPATH=backend python -m pytest tests/ -v --tb=short

test-frontend:
	cd frontend && npm run test:unit

build: build-backend build-frontend ## Build all artifacts

build-backend: ## Check backend package
	pip install -e .

build-frontend: ## Build frontend
	cd frontend && npm run build

docker-build: docker-build-backend docker-build-frontend ## Build all Docker images

docker-build-backend: ## Build backend Docker image
	docker build -t cyberfinrisk-backend backend/

docker-build-frontend: ## Build frontend Docker image
	docker build -t cyberfinrisk-frontend frontend/

dev: dev-backend dev-frontend ## Start all dev servers

dev-backend: ## Start backend dev server
	cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

dev-frontend: ## Start frontend dev server
	cd frontend && npm run dev

engine-demo: ## Run engine self-check
	PYTHONPATH=backend python -m backend.engine.__main__

check: lint test build ## Run all checks before committing

clean: ## Clean temporary files
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .ruff_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .next -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name node_modules -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name playwright-report -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name test-results -exec rm -rf {} + 2>/dev/null || true

docker-compose-up: ## Start full stack with Docker Compose
	docker compose up -d

docker-compose-down: ## Stop full stack
	docker compose down

pre-commit: ## Run pre-commit on all files
	pre-commit run --all-files
