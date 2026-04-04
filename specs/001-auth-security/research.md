# Research: Authentication & Security Module

**Feature**: 001-auth-security  
**Date**: 2026-03-04  
**Status**: Complete

---

## Research Topics

### 1. JWT Implementation Library

**Decision**: Use `jsonwebtoken` (npm package)

**Rationale**:
- Industry standard for Node.js JWT handling
- 25M+ weekly downloads, actively maintained
- Supports RS256 (asymmetric) and HS256 (symmetric) algorithms
- Built-in expiration and validation
- TypeScript definitions available

**Alternatives Considered**:
- `jose`: Modern, but larger bundle size
- `fast-jwt`: Faster performance, but less community adoption
- Native crypto: Too low-level, error-prone

**Configuration**:
- Algorithm: HS256 for Phase 1 (RS256 for production scaling)
- Secret: 256-bit random key from environment
- Access token expiry: 24 hours (configurable)
- Refresh token expiry: 7 days (Remember Me)

---

### 2. TOTP/MFA Implementation

**Decision**: Use `speakeasy` library

**Rationale**:
- RFC 6238 (TOTP) and RFC 4226 (HOTP) compliant
- QR code generation for easy setup
- Base32 secret generation
- Verified with Google Authenticator, Authy, Microsoft Authenticator
- 2M+ weekly downloads

**Implementation Details**:
- Secret length: 32 bytes (base32 encoded)
- Time step: 30 seconds
- Verification window: ±1 step (90 seconds tolerance)
- Backup codes: 10 single-use codes, bcrypt hashed

**Alternatives Considered**:
- `otplib`: Similar functionality, smaller community
- Native implementation: Error-prone, stick with library

---

### 3. Password Hashing

**Decision**: Use `bcrypt` with cost factor 12

**Rationale**:
- OWASP recommended for password storage
- Adaptive (slow) hashing resistant to brute force
- Salt automatically generated
- Cost factor 12 = ~250ms hash time (acceptable UX)

**Configuration**:
- Salt rounds: 12 (configurable via env)
- Future migration path to Argon2 if needed

**Alternatives Considered**:
- `argon2`: Modern winner of password hashing competition, but bcrypt is sufficient
- `scrypt`: Good for cryptocurrencies, bcrypt preferred for passwords
- `pbkdf2`: Older, slower than bcrypt

---

### 4. Rate Limiting Strategy

**Decision**: Use `express-rate-limit` with Redis store

**Rationale**:
- Express middleware integration
- Redis store for distributed rate limiting
- Configurable per-endpoint

**Policies**:
| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /auth/login | 5 requests | 1 minute |
| POST /auth/forgot-password | 3 requests | 1 hour |
| All authenticated APIs | 100 requests | 1 minute |
| All APIs (IP-based) | 1000 requests | 15 minutes |

**Alternatives Considered**:
- `rate-limiter-flexible`: More flexible, but overkill for needs
- NGINX rate limiting: Works at infrastructure level, but need app-level too

---

### 5. Email Service

**Decision**: Use `nodemailer` with SMTP transport

**Rationale**:
- Industry standard for Node.js email
- Supports any SMTP provider
- HTML and text email templates
- Attachment support for future needs

**Configuration**:
- SMTP credentials from environment variables
- From address: configurable (e.g., noreply@erp-aluminium.com)
- Templates: EJS for HTML emails

**Email Types**:
- Password reset link (valid 1 hour)
- MFA backup codes
- Account lockout notification
- New user welcome (optional)

**Alternatives Considered**:
- SendGrid/SES SDK: Vendor lock-in, SMTP is universal
- `email-templates`: Nice abstraction, but can add later

---

### 6. Session Storage

**Decision**: Use Redis for session/token storage

**Rationale**:
- Fast in-memory lookups
- TTL support for automatic expiration
- Distributed (works across multiple backend instances)
- Supports blacklisting revoked tokens

**Storage Strategy**:
- Active JWTs: Not stored (stateless validation)
- Refresh tokens: Stored in Redis with TTL
- Revoked tokens: Blacklisted in Redis until natural expiry
- Session metadata: User agent, IP, last activity

**Alternatives Considered**:
- Database-only: Slower, more DB load
- Memory-only: Doesn't scale to multiple instances

---

### 7. Audit Log Storage

**Decision**: PostgreSQL with dedicated AuditLog table

**Rationale**:
- ACID compliance for audit trail integrity
- JSONB column for flexible details
- Queryable with SQL (filter by user, date, action)
- Partitioning strategy for long-term retention

**Retention Strategy**:
- Hot storage: 90 days in primary table
- Cold storage: Archive to separate table/partition
- Export: CSV/Excel generation for compliance

**Schema**:
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  module VARCHAR(50) NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  severity VARCHAR(20) DEFAULT 'info',
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 8. Database ORM

**Decision**: Use TypeORM 0.3.x

**Rationale**:
- Native TypeScript support
- Decorator-based entity definitions
- Migration support
- Query builder for complex queries
- Good PostgreSQL support

**Alternatives Considered**:
- Prisma: Good, but schema file separate from code
- Sequelize: Older, less TypeScript friendly
- Knex: Query builder only, no ORM

---

## Summary Table

| Component | Library/Tool | Version | Justification |
|-----------|--------------|---------|---------------|
| JWT | jsonwebtoken | ^9.0.2 | Industry standard, proven |
| TOTP | speakeasy | ^2.0.0 | RFC compliant, widely used |
| Password Hash | bcrypt | ^5.1.1 | OWASP recommended |
| Rate Limiting | express-rate-limit | ^7.1.5 | Express native |
| Email | nodemailer | ^6.9.7 | Universal SMTP support |
| Cache/Session | Redis | 7.x | Fast, distributed, TTL |
| ORM | TypeORM | ^0.3.17 | TypeScript native |
| Validation | class-validator | ^0.14.0 | Decorator-based DTO validation |

---

*Research complete. All technical decisions align with Constitution principles II (Security-First), III (Data Integrity), and VI (Performance Standards).*
