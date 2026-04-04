# 009 - Architecture Data Model

This document describes the data models required for the Technical Architecture & Infrastructure module.

---

## 1. System Configuration

### 1.1 SystemConfig Entity

Stores application configuration key-value pairs.

```typescript
interface SystemConfig {
  id: UUID;                    // Primary key
  key: string;                 // Unique configuration key (e.g., 'app.timezone')
  value: JSON;                // Configuration value (any type)
  category: string;           // Category: 'database', 'security', 'email', 'cache', 'app'
  description: string | null;  // Optional description
  isEncrypted: boolean;         // Whether value is encrypted
  isPublic: boolean;           // Whether visible to all users
  updatedAt: Timestamp;
  updatedBy: UUID | null;     // User who last updated
  createdAt: Timestamp;
}
```

**Indexes:**
- `idx_config_key` ON `key` (unique)
- `idx_config_category` ON `category`

**Categories:**
- `database` - Database connection settings
- `security` - Security policies and settings
- `email` - Email/SMTP configuration
- `cache` - Redis and caching settings
- `app` - Application general settings
- `integration` - External service integrations

---

## 2. Audit Logging

### 2.1 ApiLog Entity

Records all API requests for audit and analytics.

```typescript
interface ApiLog {
  id: UUID;                    // Primary key
  userId: UUID | null;        // Authenticated user (null if anonymous)
  sessionId: UUID | null;     // Session identifier
  endpoint: string;          // Full endpoint path
  method: string;             // HTTP method: GET, POST, PUT, DELETE, PATCH
  statusCode: number;        // HTTP response status
  responseTimeMs: number;     // Request processing time
  ipAddress: string;          // Client IP address
  userAgent: string;          // Browser/client identifier
  requestHeaders: JSON;      // Request headers (sanitized)
  requestBody: JSON | null;  // Request body (sanitized)
  responseBody: JSON | null;  // Response body (truncated if large)
  errorMessage: string | null; // Error message if status >= 400
  timestamp: Timestamp;
}
```

**Indexes:**
- `idx_api_log_user` ON `userId`
- `idx_api_log_endpoint` ON `endpoint`
- `idx_api_log_status` ON `statusCode`
- `idx_api_log_timestamp` ON `timestamp` DESC
- `idx_api_log_composite` ON (`timestamp`, `userId`)

**Partitioning:**
- Table partitioned by month (retention: 12 months)

---

## 3. Backup Management

### 3.1 BackupRecord Entity

Tracks all database and configuration backups.

```typescript
interface BackupRecord {
  id: UUID;                    // Primary key
  backupType: BackupType;     // Type of backup
  status: BackupStatus;      // Current status
  filePath: string;           // Storage location path
  fileSizeBytes: number;      // Size in bytes
  checksum: string;          // SHA-256 checksum for verification
  databaseName: string;      // Database being backed up
  startedAt: Timestamp;      // Backup start time
  completedAt: Timestamp | null; // Backup completion time
  expiresAt: Timestamp | null;   // Expiration for auto-deletion
  errorMessage: string | null;   // Error if failed
  createdBy: UUID | null;     // User/system that initiated
  metadata: JSON | null;      // Additional backup metadata
  createdAt: Timestamp;
}

type BackupType = 'FULL' | 'INCREMENTAL' | 'CONFIG' | 'LOGS';
type BackupStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
```

**Indexes:**
- `idx_backup_status` ON `status`
- `idx_backup_type` ON `backupType`
- `idx_backup_created` ON `createdAt` DESC
- `idx_backup_expires` ON `expiresAt`

---

## 4. Environment Configuration

### 4.1 EnvironmentConfig Entity

Manages environment-specific configurations.

```typescript
interface EnvironmentConfig {
  id: UUID;
  environment: Environment;   // Environment name
  configKey: string;         // Configuration key
  configValue: string;       // Configuration value
  isSecret: boolean;         // Whether value is sensitive
  description: string | null;
  updatedAt: Timestamp;
  createdAt: Timestamp;
}

type Environment = 'development' | 'testing' | 'staging' | 'production';
```

**Indexes:**
- `idx_env_config_env` ON `environment`
- `idx_env_config_key` ON (`environment`, `configKey`)

---

## 5. Service Health

### 5.1 ServiceHealth Entity

Monitors health status of all system services.

```typescript
interface ServiceHealth {
  id: UUID;
  serviceName: string;       // Service identifier
  status: ServiceStatus;     // Current status
  version: string | null;    // Service version
  uptimeSeconds: number;    // Uptime since last restart
  lastCheckedAt: Timestamp;  // Last health check time
  responseTimeMs: number | null; // Last response time
  errorCount: number;        // Errors in last hour
  metadata: JSON | null;     // Additional service metrics
  createdAt: Timestamp;
}

type ServiceStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';
```

**Indexes:**
- `idx_health_service` ON `serviceName`
- `idx_health_status` ON `status`
- `idx_health_checked` ON `lastCheckedAt` DESC

---

## 6. Deployment Records

### 6.1 DeploymentRecord Entity

Tracks all deployments for audit and rollback purposes.

```typescript
interface DeploymentRecord {
  id: UUID;
  version: string;           // Application version (semver)
  environment: Environment; // Target environment
  status: DeploymentStatus; // Deployment status
  commitHash: string | null; // Git commit hash
  branch: string | null;     // Git branch
  deployedBy: UUID | null;   // User who triggered deployment
  startedAt: Timestamp;     // Deployment start time
  completedAt: Timestamp | null; // Completion time
  rollbackAvailable: boolean; // Whether rollback is possible
  previousVersion: string | null; // Previous deployed version
  errorMessage: string | null; // Error if failed
  artifacts: JSON | null;   // Deployment artifacts info
  createdAt: Timestamp;
}

type DeploymentStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK';
```

**Indexes:**
- `idx_deploy_version` ON `version`
- `idx_deploy_environment` ON `environment`
- `idx_deploy_status` ON `status`
- `idx_deploy_created` ON `createdAt` DESC

---

## 7. API Rate Limiting

### 7.1 RateLimitRecord Entity

Tracks API usage for rate limiting.

```typescript
interface RateLimitRecord {
  id: UUID;
  userId: UUID | null;      // User (null for IP-based)
  ipAddress: string;        // Client IP
  endpoint: string;         // API endpoint
  method: string;           // HTTP method
  requestCount: number;    // Requests in window
  windowStart: Timestamp;  // Window start time
  windowEnd: Timestamp;    // Window end time
  blockedUntil: Timestamp | null; // If blocked, unblock time
  createdAt: Timestamp;
}
```

**Indexes:**
- `idx_ratelimit_user` ON `userId`
- `idx_ratelimit_ip` ON `ipAddress`
- `idx_ratelimit_window` ON `windowStart`

**Retention:** 30 days

---

## 8. Cache Configuration

### 8.1 CacheConfig Entity

Manages caching rules for different data types.

```typescript
interface CacheConfig {
  id: UUID;
  cacheKey: string;         // Unique cache key pattern
  description: string | null;
  ttlSeconds: number;      // Time to live in seconds
  maxSizeBytes: number | null; // Maximum cache size
  strategy: CacheStrategy;  // Cache invalidation strategy
  enabled: boolean;         // Whether caching is enabled
  tags: string[];          // Cache tags for invalidation
  updatedAt: Timestamp;
  createdAt: Timestamp;
}

type CacheStrategy = 'TTL' | 'LRU' | 'LFU' | 'MANUAL';
```

**Indexes:**
- `idx_cache_key` ON `cacheKey` (unique)
- `idx_cache_strategy` ON `strategy`

---

## 9. Database Migration Tracking

### 9.1 MigrationRecord Entity

Tracks database schema migrations.

```typescript
interface MigrationRecord {
  id: UUID;
  migrationName: string;   // Migration file name
  version: string;         // Version identifier
  appliedAt: Timestamp;    // When migration was applied
  rolledBackAt: Timestamp | null; // When rolled back (if applicable)
  status: MigrationStatus; // Current status
  executionTimeMs: number; // Time to execute
  errorMessage: string | null; // Error if failed
}

type MigrationStatus = 'PENDING' | 'APPLIED' | 'ROLLED_BACK' | 'FAILED';
```

**Indexes:**
- `idx_migration_version` ON `version` (unique)
- `idx_migration_status` ON `status`

---

## 10. Event Log

### 10.1 EventLog Entity

Centralized event logging for system events.

```typescript
interface EventLog {
  id: UUID;
  eventType: string;        // Event type identifier
  eventCategory: EventCategory; // Event category
  severity: LogSeverity;   // Event severity
  message: string;         // Event message
  userId: UUID | null;     // Associated user
  sessionId: UUID | null;  // Associated session
  resourceType: string | null; // Resource type
  resourceId: UUID | null; // Resource ID
  metadata: JSON | null;   // Additional event data
  source: string;          // Event source service
  timestamp: Timestamp;
}

type EventCategory = 'AUTH' | 'DATA' | 'SYSTEM' | 'SECURITY' | 'BUSINESS';
type LogSeverity = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
```

**Indexes:**
- `idx_event_type` ON `eventType`
- `idx_event_category` ON `eventCategory`
- `idx_event_severity` ON `severity`
- `idx_event_timestamp` ON `timestamp` DESC
- `idx_event_user` ON `userId`

**Partitioning:** Table partitioned by day (retention: 90 days)

---

## 11. Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐
│  SystemConfig  │     │  EnvironmentConfig │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────┐
│           ApiLog                        │
│  (partitioned by month)                 │
└────────┬────────┬────────┬──────────────┘
         │        │        │
         ▼        ▼        ▼
┌───────────┐ ┌───────────┐ ┌────────────┐
│  Backup   │ │ Deployment│ │   EventLog  │
│  Record   │ │  Record   │ │(partitioned)│
└───────────┘ └───────────┘ └─────────────┘
         │
         ▼
┌───────────┐
│  Service  │
│  Health   │
└───────────┘

┌──────────────────────────────────────┐
│         RateLimitRecord              │
│  (TTL: 30 days)                      │
└──────────────────────────────────────┘

┌───────────────┐
│  CacheConfig ───┘

┌──────────────── │
└─────────────┐
│ MigrationRecord │
└─────────────────┘
```

---

## 12. Migration SQL

### 12.1 Create SystemConfig Table

```sql
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_config_category ON system_config(category);
```

### 12.2 Create ApiLog Table (Partitioned)

```sql
CREATE TABLE api_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    session_id UUID,
    endpoint VARCHAR(500) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    request_headers JSONB,
    request_body JSONB,
    response_body JSONB,
    error_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions
CREATE TABLE api_log_2026_01 PARTITION OF api_log
    FOR VALUES FROM ('2026-01-01') TO ('20201');

--6-02- Add indexes on each partition
CREATE INDEX idx_api_log_user_2026_01 ON api_log_2026_01(user_id);
CREATE INDEX idx_api_log_endpoint_2026_01 ON api_log_2026_01(endpoint);
CREATE INDEX idx_api_log_timestamp_2026_01 ON api_log_2026_01(timestamp DESC);
```

### 12.3 Create BackupRecord Table

```sql
CREATE TABLE backup_record (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size_bytes BIGINT,
    checksum VARCHAR(64),
    database_name VARCHAR(100) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_by UUID REFERENCES users(id),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_backup_status ON backup_record(status);
CREATE INDEX idx_backup_type ON backup_record(backup_type);
CREATE INDEX idx_backup_created ON backup_record(created_at DESC);
```

---

## 13. Entity Summary

| Entity | Purpose | Partitioned | Retention |
|--------|---------|-------------|-----------|
| SystemConfig | App configuration | No | Permanent |
| ApiLog | API audit trail | Yes (monthly) | 12 months |
| BackupRecord | Backup tracking | No | 12 months |
| EnvironmentConfig | Env-specific config | No | Permanent |
| ServiceHealth | Service monitoring | No | 30 days |
| DeploymentRecord | Deployment tracking | No | Permanent |
| RateLimitRecord | Rate limiting | No | 30 days |
| CacheConfig | Cache rules | No | Permanent |
| MigrationRecord | Schema migrations | No | Permanent |
| EventLog | Event logging | Yes (daily) | 90 days |
