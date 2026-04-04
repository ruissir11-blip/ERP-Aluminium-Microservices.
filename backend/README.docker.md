# Docker Setup for ERP Aluminium Backend

This document describes how to run the ERP Aluminium backend using Docker and Docker Compose.

## Prerequisites

- [Docker](https://www.docker.com/get-started) (version 20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0+)

## Quick Start

### 1. Navigate to the backend directory

```bash
cd backend
```

### 2. Start the containers

```bash
# Using npm scripts
npm run docker:up

# Or using docker-compose directly
docker-compose up -d
```

### 3. Verify services are running

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f backend
```

### 4. Access the application

- **API**: http://localhost:3000
- **API Documentation (Swagger)**: http://localhost:3000/api-docs
- **PostgreSQL**: localhost:5432 (user: postgres, password: postgres, db: erp_aluminium)

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run docker:up` | Start all containers in detached mode |
| `npm run docker:down` | Stop and remove all containers |
| `npm run docker:build` | Build the Docker images |
| `npm run docker:logs` | View logs from all containers |
| `npm run docker:shell` | Access the backend container shell |
| `npm run docker:ps` | Show running containers |

## Environment Configuration

The Docker setup uses `.env.docker` which contains:

- **Database**: PostgreSQL 15 (credentials: postgres/postgres)
- **Redis**: Not included - use external service or host's Redis
- **API**: Runs on port 3000

### Redis Configuration

Since Redis is not included in Docker, you have two options:

1. **Use external Redis**: Set `REDIS_HOST` to your Redis service address
2. **Disable Redis**: The app will log Redis connection errors but continue running

## Development Mode

The Docker setup runs in development mode with hot reload:

- Source code is mounted as a volume
- TypeScript is compiled on-the-fly with `ts-node-dev`
- Changes to `src/` are reflected immediately

## Production Build

To build a production image:

```bash
# Build production image
docker build --target production -t erp-backend:prod .

# Run production container
docker run -p 3000:3000 --env-file .env.docker erp-backend:prod
```

## Data Persistence

PostgreSQL data is persisted in a Docker volume named `postgres_data`. To reset the database:

```bash
# Stop containers
docker-compose down

# Remove volume
docker volume rm backend_postgres_data

# Start fresh
docker-compose up -d
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs backend

# Rebuild if needed
docker-compose build --no-cache
```

### Database connection issues

Ensure PostgreSQL is healthy:
```bash
docker-compose ps
```

### Port already in use

If port 3000 or 5432 is in use, modify `docker-compose.yml` to use different ports.

## Cleanup

To remove all containers and volumes:

```bash
docker-compose down -v
```
