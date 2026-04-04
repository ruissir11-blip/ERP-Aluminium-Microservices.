# 009 - Architecture Quick Start Guide

Quick start guide for setting up the Technical Architecture & Infrastructure components.

---

## Prerequisites

### Required Software

| Software | Version | Installation |
|----------|---------|---------------|
| Node.js | 20 LTS | [nodejs.org](https://nodejs.org/) |
| Python | 3.11 | [python.org](https://python.org/) |
| Docker | 24.x | [docker.com](https://docker.com/) |
| Docker Compose | 2.x | Included with Docker |
| Git | 2.x | [git-scm.com](https://git-scm.com/) |

### System Requirements

- **OS**: Ubuntu 22.04 LTS / macOS 13+ / Windows 10+
- **RAM**: 8GB minimum (16GB recommended)
- **Disk**: 50GB free space
- **CPU**: 4 cores minimum

---

## Quick Setup - Development Environment

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-org/erp-aluminium.git
cd erp-aluminium

# Install Node.js dependencies
cd backend
npm install

# Install Python dependencies (for AI module)
cd ../backend/python-ai
pip install -r requirements.txt

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Start Infrastructure Services

```bash
# Start all infrastructure services (PostgreSQL, Redis, MinIO)
cd backend
docker-compose up -d postgres redis minio

# Wait for services to be ready
sleep 10

# Check service status
docker-compose ps
```

### 3. Configure Environment Variables

```bash
# Copy example environment file
cp backend/.env.example backend/.env

# Edit .env with your settings
# Required: Database connection, Redis, JWT secret
```

### 4. Initialize Database

```bash
# Run migrations
cd backend
npm run migration:run

# Seed initial data
npm run seed
```

### 5. Start Application

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev

# Terminal 3: Start AI service (optional)
cd backend/python-ai
python main.py
```

### 6. Access Application

| Service | URL | Credentials |
|---------|-----|--------------|
| Frontend | http://localhost:3000 | admin@erp.local / admin123 |
| Backend API | http://localhost:4000 | - |
| API Docs | http://localhost:4000/api-docs | - |
| AI Service | http://localhost:5000 | - |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin |
| Grafana | http://localhost:3001 | admin / admin |

---

## Docker Compose Setup

### Full Development Stack

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up -d --build
```

### Service Health Check

```bash
# Check all container health
curl http://localhost:4000/health

# Check individual services
curl http://localhost:6379  # Redis
curl http://localhost:5432 # PostgreSQL
```

---

## Environment Configuration

### Development (.env)

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=erp_user
DATABASE_PASSWORD=dev_password
DATABASE_NAME=erp_aluminium

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=24h

# Application
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000
```

### Production (.env)

```bash
# Database
DATABASE_HOST=postgres.production
DATABASE_PORT=5432
DATABASE_USER=erp_prod_user
DATABASE_PASSWORD=<secure-password>
DATABASE_NAME=erp_aluminium_prod

# Redis
REDIS_HOST=redis.production
REDIS_PORT=6379

# JWT
JWT_SECRET=<generate-secure-secret>
JWT_EXPIRES_IN=1h

# Application
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://erp.yourcompany.com
```

---

## Kubernetes Setup (Production)

### Prerequisites

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# Install Helm
curl -fsSL https://get.helm.sh/helm-v3.12.0-linux-amd64.tar.gz | tar -xz

# Configure kubectl
kubectl config use-context <your-cluster>
```

### Deploy Application

```bash
# Add repositories
helm repo add stable https://charts.helm.sh/stable
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Install PostgreSQL
helm install postgresql bitnami/postgresql \
  --set persistence.size=50Gi \
  --set postgresqlPassword=<password>

# Install Redis
helm install redis bitnami/redis \
  --set persistence.size=10Gi \
  --set password=<password>

# Deploy application
kubectl apply -f deploy/production/

# Check deployment
kubectl get pods
kubectl get services
```

---

## Verification Checklist

### Services Running

```bash
# PostgreSQL
docker exec -it erp-aluminium-postgres-1 psql -U erp_user -d erp_aluminium -c "SELECT version();"

# Redis
docker exec -it erp-aluminium-redis-1 redis-cli ping

# MinIO
curl http://localhost:9000/minio/health/live
```

### API Health

```bash
# Backend health check
curl http://localhost:4000/health

# Expected response:
# {"status":"healthy","timestamp":"2026-03-09T12:00:00Z","version":"1.0.0"}
```

### Frontend

```bash
# Open browser to http://localhost:3000
# Login with: admin@erp.local / admin123
# Verify dashboard loads without errors
```

---

## Common Issues

### Port Already in Use

```bash
# Find process using port
lsof -i :4000

# Kill process
kill -9 <PID>

# Or use different port
PORT=4001 npm run dev
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Node Modules Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
```

### Docker Issues

```bash
# Clean up Docker
docker system prune -a

# Remove all containers
docker rm -f $(docker ps -aq)

# Remove all volumes
docker volume rm $(docker volume ls -q)
```

---

## Next Steps

1. **Configure SSL/TLS** - Set up for production
2. **Set up monitoring** - Prometheus + Grafana dashboards
3. **Configure backups** - Automated backup schedule
4. **Set up CI/CD** - GitHub Actions workflow
5. **Security hardening** - Review and apply security settings

---

## Useful Commands

```bash
# Development
npm run dev              # Start development server
npm run lint             # Run linter
npm run test             # Run tests
npm run build            # Build for production

# Database
npm run migration:generate # Generate new migration
npm run migration:run      # Run pending migrations
npm run seed              # Seed database

# Docker
docker-compose up -d      # Start services
docker-compose down      # Stop services
docker-compose logs -f   # View logs
docker-compose exec api sh # Shell into container

# Kubernetes
kubectl get pods         # List pods
kubectl logs <pod>       # View pod logs
kubectl describe pod <pod> # Pod details
kubectl exec -it <pod> -- sh # Shell into pod
```
