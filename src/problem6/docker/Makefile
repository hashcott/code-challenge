# Simple Makefile for Scoreboard System Development

.PHONY: help dev build logs shell clean db-migrate status restart

# Default target
help:
	@echo "Scoreboard System Development Commands:"
	@echo ""
	@echo "  make dev          - Start development environment"
	@echo "  make build        - Build development images"
	@echo "  make logs         - Show development logs"
	@echo "  make shell        - Open shell in app container"
	@echo "  make clean        - Stop and remove containers"
	@echo "  make db-migrate   - Run database migrations"
	@echo "  make status       - Show container status"
	@echo "  make restart      - Restart development environment"
	@echo ""

# Start development environment
dev:
	@echo "Starting development environment..."
	docker compose up -d

# Build development images
build:
	@echo "Building development images..."
	docker compose build

# Show logs
logs:
	@echo "Showing development logs..."
	docker compose logs -f

# Open shell in app container
shell:
	@echo "Opening shell in app container..."
	docker compose exec app sh

# Clean up containers and volumes
clean:
	@echo "Cleaning up containers and volumes..."
	docker compose down -v --remove-orphans

# Run database migrations
db-migrate:
	@echo "Running database migrations..."
	docker compose exec app npx prisma db push

# Show container status
status:
	@echo "Container status:"
	@docker compose ps

# Restart development environment
restart: clean dev
	@echo "Development environment restarted!"

# Quick start
start: dev
stop: clean