# AI Service Containerization Analysis & Plan

## Executive Summary

The AI Service (FastAPI) is already fully configured in the codebase. All required components exist:
- ✅ FastAPI Dockerfile with Python 3.10-slim
- ✅ Dependencies: prophet, statsmodels, fastapi
- ✅ docker-compose.yml integration with ai-service
- ✅ Nginx reverse proxy routing `/api/` → backend, `/ai/` → FastAPI
- ✅ Healthchecks for Postgres and Redis dependencies

**The setup appears complete. The issue is likely that the containers haven't been built/run yet.**

---

## Current Architecture

```mermaid
graph TB
    subgraph Docker Network
        N[nginx:80] --> B[backend:3000]
        N --> A[ai-service:8000]
        P[postgres:5432]
        R[redis:6379]
        L[loki:3100]
        
        B --> P
        B --> R
        A --> P
        A --> R
    end
    
    Client[Client] --> N
```

---

## Component Analysis

### 1. Dockerfile (`backend/python-ai/Dockerfile`)
- **Base Image**: python:3.10-slim ✅
- **Multi-stage build**: Builder stage for compiling dependencies, production stage for runtime
- **Dependencies**: Includes gcc, g++, gfortran for prophet/statsmodels compilation
- **Runtime**: Installs only necessary libraries (libopenblas0, liblapack3, libgomp1, curl)
- **Non-root user**: Creates `aiservice` user for security
- **Exposed port**: 8000 ✅
- **Healthcheck**: Uses curl to check `/health` endpoint ✅
- **Issue**: curl added in production stage - OK

### 2. Requirements (`backend/python-ai/requirements.txt`)
```
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
pydantic>=2.5.0
pydantic-settings>=2.1.0
sqlalchemy>=2.0.0
psycopg2-binary>=2.9.9
alembic>=1.13.0
redis>=5.0.0
numpy>=1.26.0
pandas>=2.1.0
scikit-learn>=1.4.0
prophet>=1.1.0
statsmodels>=0.14.0
python-dotenv>=1.0.0
httpx>=0.26.0
matplotlib>=3.8.0
```
✅ All required dependencies present

### 3. docker-compose.yml (`backend/docker-compose.yml`)

**AI Service Configuration (lines 70-99):**
- Build context: `./python-ai` with `Dockerfile`
- Container name: `erp-ai-service`
- Port: `8000:8000` ✅
- Environment variables:
  - `DATABASE_URL=postgresql://postgres:postgres@postgres:5432/erp_aluminium` ✅
  - `REDIS_URL=redis://redis:6379/1` ✅
- Volume: `./python-ai:/app` + `ai-models:/app/models`
- Depends on: postgres (healthy), redis (healthy) ✅
- Healthcheck: `curl -f http://localhost:8000/health` ✅

**Healthchecks:**
- Postgres: `pg_isready -U postgres -d erp_aluminium` (10s interval, 5 retries)
- Redis: `redis-cli ping` (10s interval, 5 retries)
- Backend: `wget http://localhost:3000/health` (30s interval, 3 retries)
- AI Service: `curl -f http://localhost:8000/health` (30s interval, 3 retries)

### 4. Nginx Configuration (`backend/nginx/default.conf`)

**Routing Rules:**
- `/api/` → `backend:3000` (proxies to `/api/`)
- `/ai/` → `ai-service:8000` (proxies to `/`, strips `/ai/` prefix)
- Timeout for AI: 300s (suitable for model training)

**Upstream definitions:**
```nginx
upstream erp_backend {
    server backend:3000;
}

upstream erp_ai_service {
    server ai-service:8000;
}
```
✅ Proper upstream configuration

### 5. Main.py Health Endpoint

```python
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ai",
        "timestamp": datetime.utcnow().isoformat()
    }
```
✅ Health endpoint exists at line 962

---

## Potential Issues Identified

### Issue 1: Missing curl in base image
The Python slim image doesn't include curl by default. The Dockerfile adds it in the production stage, but it may not be available during the build process.

**Mitigation**: Already addressed - curl is added in production stage.

### Issue 2: Redis connection without wait script
The AI service starts immediately after postgres/redis are "healthy", but "healthy" only means the services are accepting connections, not that they're fully ready. There may be a brief period where the AI service can't connect.

**Status**: This is a minor issue - FastAPI will retry connections. The healthcheck will fail and restart if needed.

### Issue 3: Environment variable conflict
The docker-compose passes `DATABASE_URL` as environment variable, but the main.py also reads from `.env.ai`. The env_file should override defaults.

**Status**: Should work - docker-compose environment variables take precedence.

---

## Recommended Next Steps

### Step 1: Build and Run the Containers
```bash
cd backend
docker-compose down
docker-compose build ai-service
docker-compose up -d
```

### Step 2: Verify Container Status
```bash
docker ps
docker logs erp-ai-service
```

### Step 3: Test Health Endpoints
```bash
curl http://localhost:8000/health
curl http://localhost/ai/health
curl http://localhost/api/health
```

### Step 4: Test Full Integration
```bash
# Through Nginx
curl http://localhost/api/ai/forecast/generate -X POST -H "Content-Type: application/json" -d '{"product_id": 1}'

# Direct to AI service
curl http://localhost:8000/forecast/generate -X POST -H "Content-Type: application/json" -d '{"product_id": 1}'
```

---

## Conclusion

**All required components are already in place.** The setup meets all constraints:
- ✅ Lightweight base image (python:3.10-slim)
- ✅ Dependencies: prophet, statsmodels, fastapi
- ✅ AI service runs on port 8000
- ✅ Communication with erp-redis and erp-postgres configured
- ✅ Nginx routes /api/ to backend, /ai/ to FastAPI
- ✅ Healthchecks ensure DB/Redis are ready

**Action needed**: Build and start the containers to verify everything works. The user's "missing" AI service is likely just not built/run yet.
