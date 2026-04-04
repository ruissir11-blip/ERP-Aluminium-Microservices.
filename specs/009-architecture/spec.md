# 009 - Technical Architecture & Infrastructure Specification

## 1. Project Overview

**Project Name:** ERP Aluminium - Technical Architecture & Infrastructure  
**Project Type:** Infrastructure & System Architecture  
**Core Functionality:** Define the complete technical architecture including frontend, backend, database, security, deployment infrastructure, and non-functional requirements for the aluminum ERP system.  
**Target Users:** System Administrators, DevOps Engineers, Security Administrators, Operations Engineers

---

## 2. Executive Summary

The Technical Architecture & Infrastructure module establishes the foundational infrastructure for the entire ERP Aluminium system. This module defines:

- **Frontend Architecture**: React.js SPA with TypeScript, Tailwind CSS, and Ant Design
- **Backend Architecture**: Node.js/Express REST API with Python FastAPI for ML workloads
- **Database Architecture**: PostgreSQL 15 with proper indexing and JSON support
- **Security Architecture**: JWT authentication, MFA, RBAC, TLS 1.3, AES-256 encryption
- **Deployment Architecture**: Docker containerization with Docker Compose (dev) and Kubernetes (prod)
- **Infrastructure Services**: Redis caching, MinIO file storage, Apache Superset BI

---

## 3. System Architecture

### 3.1 Overall Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Browser   │  │   Tablet    │  │   Mobile (Read-only)   │ │
│  │  (Chrome,   │  │  (Touch)    │  │      (Future)          │ │
│  │   Firefox)  │  │             │  │                        │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
└─────────┼────────────────┼─────────────────────┼───────────────┘
          │                │                      │
          └────────────────┼──────────────────────┘
                           │ HTTPS (TLS 1.3)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        REVERSE PROXY                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Nginx / HAProxy                        │  │
│  │         (SSL Termination, Load Balancing)               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                          │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │  Frontend      │  │   Backend      │  │   AI/ML          │  │
│  │  (React +      │◄─┤   (Node.js/    │  │   (Python        │  │
│  │   TypeScript)  │  │    FastAPI)    │  │    Flask)        │  │
│  └────────────────┘  └───────┬────────┘  └──────────────────┘  │
│                              │                                   │
│  ┌────────────────┐  ┌───────┴────────┐  ┌──────────────────┐  │
│  │   BI Tool     │  │   Celery       │  │   Redis          │  │
│  │  (Superset/   │  │   (Async      │  │   (Cache +      │  │
│  │   Metabase)   │  │    Tasks)     │  │    Sessions)     │  │
│  └────────────────┘  └────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                               │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │  PostgreSQL    │  │    MinIO       │  │   Backup         │  │
│  │  (Primary DB)  │  │  (Documents/   │  │   (S3/Local)     │  │
│  │                │  │   Files/PDFs)  │  │                  │  │
│  └────────────────┘  └────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Service Architecture

| Service | Technology | Port | Purpose |
|---------|------------|------|---------|
| frontend | React + Vite | 3000 | User interface |
| backend-api | Node.js/Express | 4000 | REST API |
| ai-service | Python/FastAPI | 5000 | ML predictions |
| celery-worker | Python/Celery | - | Async tasks |
| postgres | PostgreSQL 15 | 5432 | Primary database |
| redis | Redis 7 | 6379 | Cache, sessions |
| superset | Apache Superset | 8088 | BI dashboards |
| minio | MinIO | 9000 | File storage |
| nginx | Nginx | 80/443 | Reverse proxy |

---

## 4. Frontend Specification

### 4.1 Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React.js | 18.x |
| Language | TypeScript | 5.x |
| Build Tool | Vite | 5.x |
| UI Framework | Ant Design | 5.x |
| Styling | Tailwind CSS | 3.x |
| State Management | Zustand | - |
| HTTP Client | Axios | - |
| Charts | Recharts | - |
| Forms | React Hook Form | - |

### 4.2 Browser Support

- **Chrome** (last 2 versions)
- **Firefox** (last 2 versions)
- **Edge** (last 2 versions)
- **Safari** (last 2 versions)

### 4.3 Responsive Design

| Device Type | Support Level | Features |
|-------------|---------------|----------|
| Desktop | Primary | Full functionality |
| Tablet | Supported | Touch-friendly controls |
| Mobile | Read-only | View-only access |

### 4.4 Accessibility

- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios meet standards

### 4.5 Frontend Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-001 | Application MUST be built as SPA using React.js with TypeScript | Must |
| FR-002 | UI framework MUST use Tailwind CSS for styling and Ant Design for components | Must |
| FR-003 | Application MUST support modern browsers: Chrome, Firefox, Edge, Safari (last 2 versions) | Must |
| FR-004 | Application MUST be responsive: desktop (primary), tablet (supported), mobile (read-only) | Must |
| FR-005 | Application MUST comply with WCAG 2.1 Level AA accessibility standards | Must |

---

## 5. Backend Specification

### 5.1 Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Node.js | 20 LTS |
| Framework | Express.js | 4.x |
| Language | TypeScript | 5.x |
| ORM | TypeORM | 0.3.x |
| Validation | Zod | - |
| Documentation | Swagger/OpenAPI | - |

### 5.2 API Design

- RESTful conventions
- JSON request/response format
- Standard HTTP methods (GET, POST, PUT, DELETE)
- Proper status codes (200, 201, 400, 401, 403, 404, 500)

### 5.3 Authentication & Authorization

| Feature | Implementation |
|---------|---------------|
| Authentication | JWT tokens |
| Token Expiration | Configurable (default: 24 hours) |
| Refresh Tokens | Supported |
| Password Hashing | bcrypt (cost factor 12) |
| MFA | TOTP (Google Authenticator compatible) |
| Authorization | RBAC with role-based permissions |

### 5.4 Rate Limiting

- Default: 100 requests/minute per user
- Configurable per endpoint
- Redis-based distributed rate limiting

### 5.5 Logging

- All requests logged for audit purposes
- Log levels: ERROR, WARN, INFO, DEBUG
- Structured JSON logging
- Request ID correlation

### 5.6 Backend Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-006 | API MUST be built using Node.js (Express) or Python (FastAPI) | Must |
| FR-007 | API MUST follow RESTful conventions | Must |
| FR-008 | API MUST support authentication via JWT tokens | Must |
| FR-009 | API MUST implement rate limiting (100 requests/minute per user) | Must |
| FR-010 | API MUST log all requests for audit purposes | Must |

---

## 6. Database Specification

### 6.1 Technology

- **Primary Database**: PostgreSQL 15
- **Extensions**: TimescaleDB (for time-series), pg_trgm (full-text search)

### 6.2 Data Model

| Feature | Implementation |
|---------|---------------|
| ACID Transactions | Fully supported |
| Indexing | Strategic indexes for query performance |
| JSON Support | JSONB for flexible schemas |
| Partitioning | Table partitioning for large tables (e.g., audit logs) |
| Replication | Streaming replication for HA |

### 6.3 Key Entities

```typescript
// System Configuration
interface SystemConfig {
  id: UUID;
  key: string;
  value: JSON;
  category: string;
  updatedAt: Timestamp;
}

// API Audit Log
interface ApiLog {
  id: UUID;
  userId: UUID | null;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  ipAddress: string;
  timestamp: Timestamp;
}

// Backup Record
interface BackupRecord {
  id: UUID;
  backupType: 'FULL' | 'INCREMENTAL' | 'CONFIG';
  filePath: string;
  sizeBytes: number;
  createdAt: Timestamp;
  expiresAt: Timestamp | null;
}
```

### 6.4 Database Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-011 | Database MUST use PostgreSQL as primary relational database | Must |
| FR-012 | Database MUST support ACID transactions | Must |
| FR-013 | Database MUST implement proper indexing for query performance | Must |
| FR-014 | Database MUST support JSON data types for flexible schemas | Must |

---

## 7. Security Specification

### 7.1 Authentication

| Feature | Specification |
|---------|---------------|
| JWT Algorithm | RS256 (RSA) |
| Token Expiration | Configurable (default: 24 hours) |
| Refresh Token | JWT with longer expiration (7 days) |
| Password Hashing | bcrypt with cost factor 12 |
| MFA | TOTP-based (RFC 6238) |

### 7.2 Authorization

- Role-Based Access Control (RBAC)
- Permission levels: Admin, Manager, User, Guest
- Module-level and action-level permissions
- Audit trail for permission changes

### 7.3 Data Protection

| Layer | Protection |
|-------|------------|
| Transit | TLS 1.3 (HTTPS) |
| At Rest | AES-256 encryption |
| Database | Column-level encryption for sensitive data |
| Backups | Encrypted backup files |

### 7.4 Input Validation

- SQL injection prevention via parameterized queries
- XSS prevention via input sanitization
- CSRF protection via tokens
- Request validation using Zod schemas

### 7.5 Network Security

- CORS configured for authorized origins only
- API Gateway with rate limiting
- DDoS protection via CDN/WAF
- Private network for database/services

### 7.6 Security Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-015 | Authentication MUST use JWT with configurable expiration | Must |
| FR-016 | Passwords MUST be hashed using bcrypt (cost factor 12) | Must |
| FR-017 | MFA MUST be supported via TOTP | Must |
| FR-018 | RBAC MUST be implemented with role-based permissions | Must |
| FR-019 | All data in transit MUST use TLS 1.3 | Must |
| FR-020 | Sensitive data at rest MUST be encrypted (AES-256) | Must |
| FR-021 | Input validation MUST prevent SQL injection and XSS attacks | Must |
| FR-022 | CORS MUST be configured to allow only authorized origins | Must |

---

## 8. Infrastructure Specification

### 8.1 Containerization

- All services containerized with Docker
- Multi-stage builds for optimized images
- Health checks defined for all containers
- Resource limits configured

### 8.2 Orchestration

| Environment | Tool | Use Case |
|-------------|------|----------|
| Development | Docker Compose | Local development, testing |
| Production | Kubernetes | Auto-scaling, high availability |

### 8.3 CI/CD Pipeline

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Code   │───▶│  Build  │───▶│  Test   │───▶│ Deploy  │
│  Commit │    │         │    │         │    │         │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
                   │              │              │
                   ▼              ▼              ▼
              Lint/Build     Unit Tests    Staging/Prod
                              E2E Tests
```

### 8.4 Monitoring

| Tool | Purpose |
|------|---------|
| Prometheus | Metrics collection |
| Grafana | Visualization & dashboards |
| AlertManager | Alert routing |
| ELK Stack | Log aggregation |

### 8.5 Infrastructure Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-023 | Application MUST be containerized using Docker | Must |
| FR-024 | Orchestration MUST use Docker Compose (development) and Kubernetes (production) | Must |
| FR-025 | CI/CD pipeline MUST be implemented for automated testing and deployment | Must |
| FR-026 | Monitoring MUST use Prometheus for metrics and Grafana for visualization | Must |

---

## 9. Non-Functional Requirements

### 9.1 Performance

| Metric | Target | Measurement |
|--------|--------|--------------|
| Page load time | < 2 seconds | 95th percentile |
| API response time | < 500ms | Average |
| Database query time | < 2 seconds | Complex queries |
| Time to First Byte | < 200ms | Frontend |

### 9.2 Availability

| Metric | Target |
|--------|--------|
| System uptime | 99.5% |
| Planned maintenance | Off-hours only |
| Maximum downtime | 4 hours (RTO) |

### 9.3 Scalability

| Metric | Target |
|--------|--------|
| Concurrent users | 50 minimum |
| Horizontal scaling | Auto-scaling enabled |
| Database connections | Pool size: 20-100 |

### 9.4 Backup & Recovery

| Metric | Target |
|--------|--------|
| RPO (Recovery Point Objective) | < 24 hours |
| RTO (Recovery Time Objective) | < 4 hours |
| Backup retention | 30 days daily, 12 months monthly |
| Disaster recovery test | Quarterly |

### 9.5 Security Compliance

| Standard | Requirement |
|----------|-------------|
| Data encryption | TLS 1.3 + AES-256 |
| Access control | RBAC with MFA |
| Audit logging | All operations logged |
| Vulnerability scanning | Weekly automated scans |

---

## 10. Environment Strategy

### 10.1 Environment Matrix

| Environment | Purpose | Data | Deployment |
|-------------|---------|------|------------|
| Development | Feature development | Sample data | Manual |
| Testing | QA testing | Sanitized production data | CI/CD on PR |
| Staging | UAT, Pre-production | Production-like data | CI/CD on merge |
| Production | Live system | Real data | CI/CD on release |

### 10.2 Environment Variables

| Variable | Development | Staging | Production |
|----------|-------------|---------|------------|
| NODE_ENV | development | staging | production |
| DEBUG | true | false | false |
| LOG_LEVEL | debug | info | warn |
| API_URL | localhost:4000 | staging-api | production-api |

---

## 11. Key Entities

### 11.1 SystemConfig

```typescript
interface SystemConfig {
  id: UUID;
  key: string;           // unique configuration key
  value: JSON;           // configuration value
  category: string;      // e.g., 'database', 'security', 'email'
  updatedAt: Timestamp;
  createdAt: Timestamp;
}
```

### 11.2 ApiLog

```typescript
interface ApiLog {
  id: UUID;
  userId: UUID | null;   // associated user
  endpoint: string;       // API endpoint path
  method: string;        // HTTP method
  statusCode: number;    // response status
  responseTimeMs: number;
  ipAddress: string;
  userAgent: string;
  requestBody: JSON;
  timestamp: Timestamp;
}
```

### 11.3 BackupRecord

```typescript
interface BackupRecord {
  id: UUID;
  backupType: 'FULL' | 'INCREMENTAL' | 'CONFIG';
  filePath: string;
  sizeBytes: number;
  checksum: string;
  createdAt: Timestamp;
  expiresAt: Timestamp | null;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}
```

---

## 12. Success Criteria

### 12.1 Measurable Outcomes

| ID | Criteria | Target |
|----|----------|--------|
| SC-001 | Application passes security audit | No critical vulnerabilities |
| SC-002 | Load test performance | < 5% degradation with 50 users |
| SC-003 | Automated deployment time | < 15 minutes |
| SC-004 | Backup restoration | Tested and verified quarterly |
| SC-005 | Non-functional requirements | All met and documented |

### 12.2 Acceptance Criteria

1. **Security Audit**
   - [ ] No critical or high vulnerabilities in dependency scan
   - [ ] All authentication mechanisms tested and working
   - [ ] Encryption verified for data in transit and at rest

2. **Performance**
   - [ ] Page load time < 2s (95th percentile)
   - [ ] API response time < 500ms (average)
   - [ ] Database queries < 2s (complex queries)

3. **Availability**
   - [ ] System uptime ≥ 99.5%
   - [ ] RTO < 4 hours documented and tested
   - [ ] RPO < 24 hours verified

4. **Deployment**
   - [ ] Automated deployment completes < 15 minutes
   - [ ] Zero-downtime deployment configured
   - [ ] Rollback procedure documented and tested

---

## 13. Dependencies

- **Prerequisites**: All functional module specs (001-008)
- **Infrastructure**: Cloud provider (AWS/Azure/GCP) or on-premise
- **External Services**: Email service, SMS gateway (optional)

---

## 14. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- Docker containerization setup
- Docker Compose development environment
- PostgreSQL configuration and indexing
- Redis caching layer

### Phase 2: Security (Week 3-4)
- JWT authentication implementation
- MFA setup
- RBAC system
- TLS/SSL configuration

### Phase 3: CI/CD (Week 5-6)
- GitHub Actions/GitLab CI pipeline
- Automated testing
- Staging deployment
- Monitoring setup

### Phase 4: Production (Week 7-8)
- Kubernetes deployment
- Auto-scaling configuration
- Backup and recovery procedures
- Final security audit

---

## 15. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data breach | Critical | Encryption, access controls, monitoring |
| Service downtime | High | High availability, automated recovery |
| Performance degradation | Medium | Monitoring, auto-scaling, caching |
| Dependency vulnerabilities | Medium | Regular security scanning, updates |
