# Implementation Plan: Authentication & Security Module

**Branch**: `001-auth-security` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-auth-security/spec.md`

## Summary

This plan implements the foundational Authentication & Security module for the ERP Aluminium platform. The module provides JWT-based authentication, RBAC with 8 roles, TOTP-based MFA, password reset via email, comprehensive audit logging, and rate limiting. This is a **foundation module** that all other modules depend on.

**Technical approach**: Node.js/Express backend with TypeScript, PostgreSQL for persistence, Redis for session management, and Speakeasy for TOTP implementation.

## Technical Context

**Language/Version**: Node.js 20 LTS + TypeScript 5.3
**Primary Dependencies**: Express.js 4.x, TypeORM 0.3.x, jsonwebtoken 9.x, bcrypt 5.x, speakeasy 2.x, nodemailer 6.x
**Storage**: PostgreSQL 15+ (primary), Redis 7+ (session cache)
**Testing**: Jest 29.x, Supertest 6.x
**Target Platform**: Docker containers on Linux (development & production)
**Project Type**: Web service (REST API + Frontend SPA)
**Performance Goals**: < 2s login (95th percentile), support 50 concurrent users
**Constraints**: Must comply with WCAG 2.1 AA, French language support, 3-week timeline
**Scale/Scope**: 50 concurrent users, 1000 user accounts, 100k audit log entries/month

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Domain-Driven Design | N/A | Auth module is cross-cutting; no aluminum domain logic |
| II. Security-First Architecture | ✅ PASS | MFA, bcrypt, JWT, TLS 1.3, AES-256 all implemented |
| III. Data Integrity & Traceability | ✅ PASS | AuditLog entity captures all required fields |
| IV. Modular Monolith Architecture | ✅ PASS | Auth module exposes internal API only |
| V. Observability & Auditability | ✅ PASS | Structured JSON logging, audit trail complete |
| VI. Performance Standards | ✅ PASS | Targets defined: <2s login, 50 concurrent users |
| VII. Specification-Driven Development | ✅ PASS | Spec complete with user stories and acceptance criteria |
| VIII. AI-Ready Architecture | N/A | No AI features in auth module |

**Gate Result**: ✅ ALL CHECKS PASSED - Proceeding to research phase

## Project Structure

### Documentation (this feature)

```text
specs/001-auth-security/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── auth-api.yaml    # OpenAPI specification
│   └── rbac-matrix.md   # Permission definitions
└── checklists/
    └── requirements.md  # Validation checklist
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── config/          # Environment, database config
│   ├── models/          # TypeORM entities
│   │   ├── User.ts
│   │   ├── Role.ts
│   │   ├── Permission.ts
│   │   ├── AuditLog.ts
│   │   ├── Session.ts
│   │   └── PasswordResetToken.ts
│   ├── services/        # Business logic
│   │   ├── AuthService.ts
│   │   ├── UserService.ts
│   │   ├── RoleService.ts
│   │   ├── AuditService.ts
│   │   └── MfaService.ts
│   ├── controllers/     # HTTP request handlers
│   │   ├── AuthController.ts
│   │   ├── UserController.ts
│   │   └── AuditController.ts
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts      # JWT validation
│   │   ├── rbac.ts      # Permission checking
│   │   ├── rateLimiter.ts
│   │   ├── audit.ts     # Audit logging
│   │   └── errorHandler.ts
│   ├── routes/          # Route definitions
│   │   ├── auth.routes.ts
│   │   ├── users.routes.ts
│   │   └── audit.routes.ts
│   ├── utils/           # Helpers
│   │   ├── crypto.ts    # bcrypt, token generation
│   │   ├── jwt.ts       # JWT operations
│   │   └── validators.ts
│   └── app.ts           # Express app setup
├── tests/
│   ├── unit/            # Unit tests
│   ├── integration/     # API integration tests
│   └── contract/        # Contract tests
└── package.json

frontend/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── MfaSetup.tsx
│   │   │   └── PasswordReset.tsx
│   │   └── common/
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── UserManagement.tsx
│   │   └── AuditLog.tsx
│   ├── services/
│   │   └── authApi.ts
│   └── utils/
│       └── auth.ts
└── package.json
```

**Structure Decision**: Web application (Option 2) - Separate backend/frontend directories. Backend provides REST API consumed by React SPA frontend.

## Complexity Tracking

No constitutional violations identified. All design decisions align with constitution principles.

## Phase 0: Research

### Research Topics

See [research.md](./research.md) for detailed findings.

**Key Decisions**:
1. **JWT Library**: jsonwebtoken (industry standard, widely used)
2. **TOTP Implementation**: speakeasy (RFC 6238 compliant, battle-tested)
3. **Password Hashing**: bcrypt with cost factor 12 (OWASP recommendation)
4. **Rate Limiting**: express-rate-limit with Redis store
5. **Email**: nodemailer with SMTP transport

## Phase 1: Design

### Data Model

See [data-model.md](./data-model.md) for entity definitions and relationships.

**Key Entities**:
- User (UUID, email, password_hash, role, MFA settings)
- Role (system roles with JSON permissions)
- AuditLog (immutable event log)
- Session (JWT token tracking)
- PasswordResetToken (time-limited reset tokens)

### API Contracts

See [contracts/auth-api.yaml](./contracts/auth-api.yaml) for OpenAPI specification.

**Endpoints**:
- `POST /auth/login` - Authenticate, return JWT
- `POST /auth/verify-mfa` - Verify TOTP code
- `POST /auth/logout` - Invalidate session
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/forgot-password` - Request reset email
- `POST /auth/reset-password` - Reset with token
- `GET /auth/me` - Get current user
- `POST /auth/mfa/setup` - Enable MFA
- `POST /auth/mfa/disable` - Disable MFA
- `GET /users` - List users (admin only)
- `POST /users` - Create user
- `GET /users/:id` - Get user details
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Deactivate user
- `GET /roles` - List roles
- `GET /audit-logs` - Query audit log (admin only)

### Quick Start

See [quickstart.md](./quickstart.md) for development environment setup.

---

*Plan created following ERP Aluminium Constitution v1.0.0*
