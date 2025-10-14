# Docker Setup

## Quick Start

```bash
# Start development environment
make dev

# Run database migrations
make db-migrate

# Access the application
# API: http://localhost:3000/api/
# Frontend: http://localhost:3000/
# WebSocket: ws://localhost:3000/ws
```

## Available Commands

```bash
make dev          # Start development environment
make build        # Build development images
make logs         # Show development logs
make shell        # Open shell in app container
make clean        # Stop and remove containers
make db-migrate   # Run database migrations
make status       # Show container status
make restart      # Restart development environment
```

## Architecture

- **App**: Fastify + TypeScript + Prisma
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Real-time**: WebSocket

## Environment Variables

All environment variables are configured in `docker-compose.yml`:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT signing secret
- `PORT`: Application port (3000)
- `HOST`: Application host (0.0.0.0)

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database Connection Issues
```bash
# Check database status
make status
docker compose logs postgres
```

### Container Issues
```bash
# Restart containers
make restart

# Clean and restart
make clean
make dev
```

## Development

The app runs with hot reload - any changes to the source code will automatically restart the server.

### Database Management
- Database: `scoreboard_dev`
- User: `scoreboard_user`
- Password: `scoreboard_password`
- Port: `5432`

### Logs
```bash
# View all logs
make logs

# View specific service logs
docker compose logs app
docker compose logs postgres
docker compose logs redis
```