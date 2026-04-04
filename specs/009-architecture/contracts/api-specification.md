# 009 - Architecture API Specification

API contracts for the Technical Architecture & Infrastructure module.

---

## 1. System Configuration API

### 1.1 Get All Configurations

```
GET /api/v1/config
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| category | string | No | Filter by category |
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 20) |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "key": "app.timezone",
        "value": "Europe/Paris",
        "category": "app",
        "isPublic": true,
        "updatedAt": "2026-03-09T12:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

### 1.2 Get Configuration by Key

```
GET /api/v1/config/:key
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "key": "app.timezone",
    "value": "Europe/Paris",
    "category": "app",
    "isPublic": true,
    "updatedAt": "2026-03-09T12:00:00Z"
  }
}
```

**Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "CONFIG_NOT_FOUND",
    "message": "Configuration key not found"
  }
}
```

### 1.3 Update Configuration

```
PUT /api/v1/config/:key
```

**Request Body:**
```json
{
  "value": "America/New_York",
  "description": "Application timezone setting"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "key": "app.timezone",
    "value": "America/New_York",
    "category": "app",
    "updatedAt": "2026-03-09T12:30:00Z"
  }
}
```

---

## 2. Audit Logging API

### 2.1 Query API Logs

```
GET /api/v1/audit/logs
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | uuid | No | Filter by user |
| endpoint | string | No | Filter by endpoint |
| method | string | No | Filter by HTTP method |
| statusCode | number | No | Filter by status code |
| startDate | date | No | Start date (ISO 8601) |
| endDate | date | No | End date (ISO 8601) |
| page | number | No | Page number |
| limit | number | No | Items per page |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "userId": "uuid",
        "endpoint": "/api/v1/customers",
        "method": "GET",
        "statusCode": 200,
        "responseTimeMs": 45,
        "ipAddress": "192.168.1.100",
        "timestamp": "2026-03-09T12:00:00Z"
      }
    ],
    "total": 1000,
    "page": 1,
    "limit": 50
  }
}
```

### 2.2 Get API Statistics

```
GET /api/v1/audit/stats
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| period | string | No | daily, weekly, monthly |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalRequests": 50000,
    "avgResponseTime": 120,
    "errorRate": 0.02,
    "requestsByEndpoint": [
      { "endpoint": "/api/v1/customers", "count": 15000 },
      { "endpoint": "/api/v1/orders", "count": 12000 }
    ],
    "requestsByStatus": [
      { "statusCode": 200, "count": 48000 },
      { "statusCode": 400, "count": 1500 },
      { "statusCode": 500, "count": 500 }
    ]
  }
}
```

---

## 3. Backup API

### 3.1 Get Backup Records

```
GET /api/v1/backups
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "backupType": "FULL",
        "status": "COMPLETED",
        "fileSizeBytes": 524288000,
        "databaseName": "erp_aluminium",
        "startedAt": "2026-03-09T00:00:00Z",
        "completedAt": "2026-03-09T00:15:00Z"
      }
    ]
  }
}
```

### 3.2 Trigger New Backup

```
POST /api/v1/backups
```

**Request Body:**
```json
{
  "backupType": "FULL",
  "databaseName": "erp_aluminium"
}
```

**Response (202):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "backupType": "FULL",
    "status": "PENDING",
    "startedAt": "2026-03-09T12:00:00Z"
  }
}
```

### 3.3 Restore Backup

```
POST /api/v1/backups/:id/restore
```

**Response (202):**
```json
{
  "success": true,
  "message": "Restore job started",
  "data": {
    "jobId": "uuid"
  }
}
```

---

## 4. Health Check API

### 4.1 System Health

```
GET /api/v1/health
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": "2026-03-09T12:00:00Z",
    "uptime": 86400,
    "services": {
      "database": "healthy",
      "redis": "healthy",
      "storage": "healthy"
    }
  }
}
```

### 4.2 Service Health

```
GET /api/v1/health/services
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "serviceName": "backend-api",
      "status": "HEALTHY",
      "version": "1.0.0",
      "uptimeSeconds": 86400,
      "lastCheckedAt": "2026-03-09T12:00:00Z",
      "responseTimeMs": 25
    },
    {
      "serviceName": "ai-service",
      "status": "HEALTHY",
      "version": "1.0.0",
      "uptimeSeconds": 86400,
      "lastCheckedAt": "2026-03-09T12:00:00Z",
      "responseTimeMs": 150
    }
  ]
}
```

---

## 5. Deployment API

### 5.1 Get Deployments

```
GET /api/v1/deployments
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| environment | string | No | Filter by environment |
| status | string | No | Filter by status |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "version": "1.0.0",
        "environment": "production",
        "status": "COMPLETED",
        "deployedBy": "user-uuid",
        "startedAt": "2026-03-09T10:00:00Z",
        "completedAt": "2026-03-09T10:15:00Z"
      }
    ]
  }
}
```

### 5.2 Trigger Deployment

```
POST /api/v1/deployments
```

**Request Body:**
```json
{
  "version": "1.0.1",
  "environment": "staging",
  "commitHash": "abc123"
}
```

**Response (202):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "version": "1.0.1",
    "environment": "staging",
    "status": "PENDING",
    "startedAt": "2026-03-09T12:00:00Z"
  }
}
```

### 5.3 Rollback Deployment

```
POST /api/v1/deployments/:id/rollback
```

**Response (202):**
```json
{
  "success": true,
  "message": "Rollback initiated",
  "data": {
    "newDeploymentId": "uuid"
  }
}
```

---

## 6. Rate Limiting API

### 6.1 Get Rate Limit Status

```
GET /api/v1/ratelimit/status
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "limit": 100,
    "remaining": 75,
    "resetAt": "2026-03-09T12:01:00Z"
  }
}
```

### 6.2 Get Rate Limit Configuration

```
GET /api/v1/ratelimit/config
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "endpoint": "/api/v1/*",
      "method": "ALL",
      "limit": 100,
      "windowSeconds": 60
    },
    {
      "endpoint": "/api/v1/auth/login",
      "method": "POST",
      "limit": 5,
      "windowSeconds": 60
    }
  ]
}
```

---

## 7. Cache API

### 7.1 Get Cache Configuration

```
GET /api/v1/cache
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "cacheKey": "customer:*",
        "ttlSeconds": 300,
        "strategy": "TTL",
        "enabled": true,
        "tags": ["customer", "data"]
      }
    ]
  }
}
```

### 7.2 Invalidate Cache

```
DELETE /api/v1/cache
```

**Request Body:**
```json
{
  "cacheKey": "customer:123",
  "tags": ["customer"]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Cache invalidated"
}
```

### 7.3 Get Cache Statistics

```
GET /api/v1/cache/stats
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalKeys": 1000,
    "memoryUsed": "15MB",
    "hitRate": 0.85,
    "missRate": 0.15,
    "evictions": 50
  }
}
```

---

## 8. Metrics API

### 8.1 Get Application Metrics

```
GET /api/v1/metrics
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "requests": {
      "total": 50000,
      "byMethod": {
        "GET": 35000,
        "POST": 10000,
        "PUT": 3000,
        "DELETE": 2000
      }
    },
    "responses": {
      "total": 50000,
      "byStatus": {
        "2xx": 45000,
        "4xx": 4000,
        "5xx": 1000
      }
    },
    "performance": {
      "avgResponseTime": 120,
      "p50": 80,
      "p95": 350,
      "p99": 800
    }
  }
}
```

### 8.2 Get Custom Metrics

```
GET /api/v1/metrics/custom
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | Yes | Metric name |
| startDate | date | Yes | Start date |
| endDate | date | Yes | End date |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "metricName": "order_processing_time",
    "values": [
      { "timestamp": "2026-03-09T00:00:00Z", "value": 150 },
      { "timestamp": "2026-03-09T01:00:00Z", "value": 145 }
    ]
  }
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Access denied |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid request data |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

### Rate Limited Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "retryAfter": 60
  }
}
```

---

## Authentication

All API endpoints (except /health) require authentication using JWT Bearer token.

```
Authorization: Bearer <jwt-token>
```

### Required Scopes

| Endpoint | Required Scope |
|----------|----------------|
| GET /api/v1/config | config:read |
| PUT /api/v1/config | config:write |
| GET /api/v1/audit/* | audit:read |
| GET /api/v1/backups | backup:read |
| POST /api/v1/backups | backup:write |
| GET /api/v1/health | none |
| GET /api/v1/deployments | deployment:read |
| POST /api/v1/deployments | deployment:write |
| GET /api/v1/cache | cache:read |
| DELETE /api/v1/cache | cache:write |
| GET /api/v1/metrics | metrics:read |
