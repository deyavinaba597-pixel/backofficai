.PHONY: install dev build start stop logs migrate seed clean help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies
	cd backend && npm install
	cd frontend && npm install

dev: ## Start development servers
	@echo "Starting backend..."
	cd backend && npm run dev &
	@echo "Starting frontend..."
	cd frontend && npm run dev

migrate: ## Run database migrations
	cd backend && npx prisma migrate dev

migrate-prod: ## Run production migrations
	cd backend && npx prisma migrate deploy

generate: ## Generate Prisma client
	cd backend && npx prisma generate

studio: ## Open Prisma Studio
	cd backend && npx prisma studio

build: ## Build for production
	cd backend && npm run build
	cd frontend && npm run build

docker-up: ## Start all services with Docker
	docker-compose up -d

docker-down: ## Stop all Docker services
	docker-compose down

docker-logs: ## View Docker logs
	docker-compose logs -f

docker-build: ## Rebuild Docker images
	docker-compose build --no-cache

clean: ## Clean build artifacts
	rm -rf backend/dist frontend/dist
	rm -rf backend/node_modules frontend/node_modules

typecheck: ## Run TypeScript type checking
	cd backend && npx tsc --noEmit
	cd frontend && npx tsc --noEmit

seed: ## Seed database with sample data
	cd backend && npx ts-node src/scripts/seed.ts
