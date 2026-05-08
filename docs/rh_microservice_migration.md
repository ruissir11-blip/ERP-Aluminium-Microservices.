# Migration du Module RH vers un Microservice Indépendant

Ce document décrit les étapes et configurations nécessaires pour transformer le module RH monolithique en un microservice autonome.

---

## 1. Arborescence Recommandée pour /microservice-rh

```
microservice-rh/
├── src/
│   ├── config/
│   │   ├── database.ts          # Configuration TypeORM avec schema 'rh_schema'
│   │   └── redis.ts             # Configuration Redis pour le microservice
│   ├── models/
│   │   └── hr/
│   │       ├── index.ts         # Export de toutes les entités HR
│   │       ├── Employee.ts
│   │       ├── Department.ts
│   │       ├── Poste.ts
│   │       ├── EmployeePost.ts
│   │       ├── EmployeeContract.ts
│   │       ├── LeaveRequest.ts
│   │       ├── Attendance.ts
│   │       ├── Payslip.ts
│   │       ├── Training.ts
│   │       ├── TrainingSession.ts
│   │       ├── TrainingEnrollment.ts
│   │       ├── PerformanceReview.ts
│   │       ├── RecruitmentJob.ts
│   │       └── RecruitmentCandidate.ts
│   ├── controllers/
│   │   └── hr/
│   │       ├── EmployeeController.ts
│   │       ├── DepartmentController.ts
│   │       ├── ContractController.ts
│   │       ├── LeaveController.ts
│   │       ├── AttendanceController.ts
│   │       ├── PayslipController.ts
│   │       └── ...
│   ├── services/
│   │   └── hr/
│   │       ├── EmployeeService.ts
│   │       ├── LeaveService.ts
│   │       └── ...
│   ├── routes/
│   │   └── hr.ts                # Routes API spécifiques HR
│   ├── migrations/
│   │   └── hr-migrations/      # Migrations spécifiques au module RH
│   ├── app.ts                  # Point d'entrée du microservice
│   └── index.ts                # Export du serveur
├── tests/
│   └── hr/
│       ├── employee.test.ts
│       └── ...
├── docker/
│   ├── Dockerfile              # Multi-stage build optimisé
│   └── .dockerignore
├── docker-compose.yml           # Configuration pour l'intégration
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## 2. Dockerfile Multi-stage (Production)

```dockerfile
# ============================================================
#  Stage 1: Build - Compilation TypeScript
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (only production)
RUN npm ci --only=production

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Generate TypeScript dist
RUN npm run build

# ============================================================
#  Stage 2: Production - Image légère et sécurisée
# ============================================================
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production dependencies and built files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/tsconfig.json ./

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 5001

# Change to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5001/api/v1/hr/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start application
CMD ["node", "dist/app.js"]

# ============================================================
#  Stage 3: Development - Hot reload
# ============================================================
FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm install -g ts-node-dev

EXPOSE 5001

CMD ["ts-node-dev", "--respawn", "--transpile-only", "src/app.ts"]
```

---

## 3. Snippet docker-compose.yml (Intégration)

Ajouter ce service au fichier `docker-compose.yml` principal :

```yaml
  # ──────────────────────────────────────────────────────────
  #  ERP RH SERVICE — Microservice RH (Node.js:5001)
  #  Données isolées dans le schema 'rh_schema'
  # ──────────────────────────────────────────────────────────
  erp-rh-service:
    build:
      context: ./microservice-rh
      dockerfile: docker/Dockerfile
      target: production
    container_name: erp-rh-service
    ports:
      - "5001:5001"
    volumes:
      - ./microservice-rh/src:/app/src
      - /app/node_modules
    env_file:
      - ./microservice-rh/.env
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - DB_NAME=erp_aluminium
      - DB_SCHEMA=rh_schema
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - erp-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:5001/api/v1/hr/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

---

## 4. Configuration Nginx (default.conf)

Le routeur doit être mis à jour pour rediriger `/api/v1/hr/` vers le microservice RH :

```nginx
# ============================================================
#  Nginx Reverse Proxy — ERP Aluminium Microservices
#  Routes:  /api/v1/hr/  → erp-rh-service:5001
#           /api/v1/     → backend (Node.js:3000)
#           /ai/         → ai-service (FastAPI:8000)
# ============================================================

upstream erp_backend {
    server backend:3000;
}

upstream erp_ai_service {
    server ai-service:8000;
}

upstream erp_rh_service {
    server erp-rh-service:5001;
}

server {
    listen 80;
    server_name localhost;

    # ── Logging ──────────────────────────────────────────────
    access_log /var/log/nginx/erp_access.log;
    error_log  /var/log/nginx/erp_error.log warn;

    # ── Gzip Compression ────────────────────────────────────
    gzip on;
    gzip_types application/json text/plain application/javascript;
    gzip_min_length 256;

    # ── Security Headers ────────────────────────────────────
    add_header X-Frame-Options       "SAMEORIGIN"     always;
    add_header X-Content-Type-Options "nosniff"        always;
    add_header X-XSS-Protection      "1; mode=block"  always;

    # ── RH Microservice (erp-rh-service:5001) ───────────────
    # Redirect /api/v1/hr/ to the HR microservice
    location /api/v1/hr/ {
        proxy_pass         http://erp_rh_service/api/v1/hr/;
        proxy_http_version 1.1;

        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";

        proxy_connect_timeout 60s;
        proxy_send_timeout    60s;
        proxy_read_timeout    60s;
    }

    # ── Backend API (Node.js) ───────────────────────────────
    # All other /api/ requests go to the main backend
    location /api/ {
        proxy_pass         http://erp_backend/api/;
        proxy_http_version 1.1;

        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";

        proxy_connect_timeout 60s;
        proxy_send_timeout    60s;
        proxy_read_timeout    60s;
    }

    # ── AI Service (FastAPI) ────────────────────────────────
    location /ai/ {
        proxy_pass         http://erp_ai_service/;
        proxy_http_version 1.1;

        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;

        proxy_connect_timeout 120s;
        proxy_send_timeout    120s;
        proxy_read_timeout    300s;
    }

    # ── Health endpoint for the proxy itself ─────────────────
    location /nginx-health {
        access_log off;
        return 200 '{"status":"ok","service":"nginx-proxy"}';
        add_header Content-Type application/json;
    }

    # ── Default — fallback ──────────────────────────────────
    location / {
        return 404 '{"error":"Not Found","hint":"Use /api/v1/hr/ for HR, /api/ for backend, or /ai/ for AI service"}';
        add_header Content-Type application/json;
    }
}
```

---

## 5. Configuration TypeORM avec Schema 'rh_schema'

Le microservice RH utilise le même schéma PostgreSQL `erp_aluminium` mais isolé via un schema PostgreSQL dédié `rh_schema` :

```typescript
// microservice-rh/src/config/database.ts

import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

// Validate required database environment variables
const requiredDbVars = ['DB_USER', 'DB_PASSWORD'];
const missingVars = requiredDbVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(`Missing required database environment variables: ${missingVars.join(', ')}`);
}

const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
if (isNaN(dbPort) || dbPort < 1 || dbPort > 65535) {
  throw new Error('DB_PORT must be a valid port number (1-65535)');
}

// Import all HR entities
import { Employee } from '../models/hr/Employee';
import { Department } from '../models/hr/Department';
import { Poste } from '../models/hr/Poste';
import { EmployeePost } from '../models/hr/EmployeePost';
import { EmployeeContract } from '../models/hr/EmployeeContract';
import { LeaveRequest } from '../models/hr/LeaveRequest';
import { Attendance } from '../models/hr/Attendance';
import { Payslip } from '../models/hr/Payslip';
import { Training } from '../models/hr/Training';
import { TrainingSession } from '../models/hr/TrainingSession';
import { TrainingEnrollment } from '../models/hr/TrainingEnrollment';
import { PerformanceReview } from '../models/hr/PerformanceReview';
import { RecruitmentJob } from '../models/hr/RecruitmentJob';
import { RecruitmentCandidate } from '../models/hr/RecruitmentCandidate';

// Re-export entities for external use
export { Employee } from '../models/hr/Employee';
export { Department } from '../models/hr/Department';
export { Poste } from '../models/hr/Poste';
export { EmployeePost } from '../models/hr/EmployeePost';
export { EmployeeContract } from '../models/hr/EmployeeContract';
export { LeaveRequest } from '../models/hr/LeaveRequest';
export { Attendance } from '../models/hr/Attendance';
export { Payslip } from '../models/hr/Payslip';
export { Training } from '../models/hr/Training';
export { TrainingSession } from '../models/hr/TrainingSession';
export { TrainingEnrollment } from '../models/hr/TrainingEnrollment';
export { PerformanceReview } from '../models/hr/PerformanceReview';
export { RecruitmentJob } from '../models/hr/RecruitmentJob';
export { RecruitmentCandidate } from '../models/hr/RecruitmentCandidate';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: dbPort,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'erp_aluminium',
  
  // IMPORTANT: Isolation des données RH dans un schema dédié
  schema: process.env.DB_SCHEMA || 'rh_schema',
  
  synchronize: false, // NEVER enable in production - use migrations only
  logging: process.env.NODE_ENV === 'development',
  
  entities: [
    Employee,
    Department,
    Poste,
    EmployeePost,
    EmployeeContract,
    LeaveRequest,
    Attendance,
    Payslip,
    Training,
    TrainingSession,
    TrainingEnrollment,
    PerformanceReview,
    RecruitmentJob,
    RecruitmentCandidate,
  ],
  
  migrations: ['src/migrations/**/*.{ts,js}'],
  subscribers: [],
  
  // Extra options for schema isolation
  extra: {
    // Ensure schema exists before creating tables
    statement_timeout: 60000,
  },
});

// Alias for backward compatibility
export const dataSource = AppDataSource;

// Initialize database with schema creation
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Create the schema if it doesn't exist
    const schemaName = process.env.DB_SCHEMA || 'rh_schema';
    
    await AppDataSource.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName};`);
    console.log(`Schema '${schemaName}' ensured to exist`);
    
    // Initialize the connection
    await AppDataSource.initialize();
    console.log('Database connection established successfully');
    
    // Set search path to the HR schema
    await AppDataSource.query(`SET search_path TO ${schemaName}, public;`);
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  }
};
```

---

## 6. Variables d'Environnement (.env)

```env
# ============================================================
#  ERP RH Microservice - Environment Variables
# ============================================================

# Node
NODE_ENV=development
PORT=5001

# Database (PostgreSQL - Shared with main ERP)
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=erp_aluminium
DB_SCHEMA=rh_schema  # Isolation des données RH

# Redis (Shared with main ERP)
REDIS_HOST=redis
REDIS_PORT=6379

# JWT Secret (Shared for token validation)
JWT_SECRET=your-jwt-secret-here

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

---

## 7. Frontend - Mise à jour du Service API

Le frontend continue d'utiliser `/api/v1/hr/` de façon transparente grâce au reverse proxy Nginx :

```typescript
// frontend/src/services/hrApi.ts

const API_BASE_URL = '/api/v1/hr';

// The Nginx proxy will automatically redirect to erp-rh-service:5001
// No changes needed in the frontend code!
export const hrApi = {
  // Employees
  getEmployees: () => axios.get(`${API_BASE_URL}/employees`),
  getEmployee: (id: string) => axios.get(`${API_BASE_URL}/employees/${id}`),
  createEmployee: (data: any) => axios.post(`${API_BASE_URL}/employees`, data),
  updateEmployee: (id: string, data: any) => axios.put(`${API_BASE_URL}/employees/${id}`, data),
  deleteEmployee: (id: string) => axios.delete(`${API_BASE_URL}/employees/${id}`),
  
  // Departments
  getDepartments: () => axios.get(`${API_BASE_URL}/departments`),
  // ... etc
};
```

---

## 8. Schéma de Migration des Données

Pour migrer les données RH existantes vers le nouveau schema :

```sql
-- Créer le nouveau schema
CREATE SCHEMA IF NOT EXISTS rh_schema;

-- Déplacer les tables RH vers le nouveau schema
ALTER TABLE public.employees    SET SCHEMA rh_schema;
ALTER TABLE public.departments  SET SCHEMA rh_schema;
ALTER TABLE public.postes       SET SCHEMA rh_schema;
ALTER TABLE public.employee_contracts SET SCHEMA rh_schema;
ALTER TABLE public.leave_requests   SET SCHEMA rh_schema;
ALTER TABLE public.attendances      SET SCHEMA rh_schema;
ALTER TABLE public.payslips         SET SCHEMA rh_schema;
-- ... autres tables RH

-- Mettre à jour les séquences
ALTER SEQUENCE public.employees_id_seq    SET SCHEMA rh_schema;
ALTER SEQUENCE public.departments_id_seq  SET SCHEMA rh_schema;
-- ... autres séquences
```

---

## Résumé de l'Architecture

| Composant | Détail |
|-----------|--------|
| **URL Frontend** | `/api/v1/hr/*` (inchangé) |
| **Nginx** | Redirect `/api/v1/hr/` → `erp-rh-service:5001` |
| **Port du Microservice** | 5001 |
| **Base de données** | `erp_aluminium` (partagée) |
| **Schema PostgreSQL** | `rh_schema` (isolé) |
| **Dependencies** | Redis partagé avec le backend principal |