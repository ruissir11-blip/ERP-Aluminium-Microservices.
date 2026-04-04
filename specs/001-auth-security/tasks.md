# Tasks: Authentication & Security Module

**Input**: Design documents from `/specs/001-auth-security/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create backend directory structure in `backend/src/` with subdirectories: config/, models/, services/, controllers/, middleware/, routes/, utils/
- [x] T002 [P] Create frontend directory structure in `frontend/src/` with subdirectories: components/auth/, components/common/, pages/, services/, utils/
- [x] T003 Initialize Node.js project in `backend/` with package.json and TypeScript configuration
- [x] T004 [P] Initialize React + TypeScript project in `frontend/` with Vite
- [x] T005 Install backend dependencies: express, typeorm, pg, redis, bcrypt, jsonwebtoken, speakeasy, nodemailer, class-validator, dotenv, cors, helmet, express-rate-limit
- [x] T006 [P] Install frontend dependencies: react-router-dom, axios, @tanstack/react-query, zustand, react-hook-form, zod, tailwindcss, @headlessui/react, qrcode.react
- [x] T007 Configure ESLint and Prettier for both backend and frontend
- [x] T008 [P] Setup Jest testing framework with TypeScript support in backend
- [x] T009 Create `.env.example` files for backend and frontend with all required environment variables

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T010 Create database configuration in `backend/src/config/database.ts` with TypeORM connection
- [x] T011 Setup Redis client configuration in `backend/src/config/redis.ts` (REMOVED - Redis not needed)
- [x] T012 Create email service configuration in `backend/src/config/email.ts`
- [x] T013 Implement centralized error handling middleware in `backend/src/middleware/errorHandler.ts`
- [x] T014 Setup request logging middleware with structured JSON format in `backend/src/middleware/logger.ts`
- [x] T015 Create validation utilities using class-validator in `backend/src/utils/validators.ts`
- [x] T016 Implement password hashing utilities (bcrypt wrapper) in `backend/src/utils/crypto.ts`
- [x] T017 Create JWT token utilities (sign, verify, refresh) in `backend/src/utils/jwt.ts`
- [x] T018 Setup base Express app with security middleware (helmet, cors) in `backend/src/app.ts`
- [x] T019 Create database migration for Role entity with 8 system roles in `backend/src/migrations/001-CreateRoles.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Login & Session Management (Priority: P1) 🎯 MVP

**Goal**: Implement secure user authentication with JWT tokens and session management

**Independent Test**: Can be tested by attempting login with valid/invalid credentials and verifying session persistence. Test all 5 acceptance scenarios from spec.

- [x] T020 [P] [US1] Create Role entity in `backend/src/models/Role.ts`
- [x] T021 [P] [US1] Create User entity in `backend/src/models/User.ts`
- [x] T022 [P] [US1] Create Session entity in `backend/src/models/Session.ts`
- [x] T023 [US1] Run TypeORM migrations to create database tables for Role, User, Session
- [x] T024 [US1] Implement AuthService with login, logout, refresh methods in `backend/src/services/AuthService.ts`
- [x] T025 [US1] Create JWT authentication middleware in `backend/src/middleware/auth.ts`
- [x] T026 [US1] Implement login endpoint in `backend/src/controllers/AuthController.ts`
- [x] T027 [US1] Implement logout endpoint in `backend/src/controllers/AuthController.ts`
- [x] T028 [US1] Implement token refresh endpoint in `backend/src/controllers/AuthController.ts`
- [x] T029 [US1] Add rate limiting middleware (5 login attempts/minute) in `backend/src/middleware/rateLimiter.ts`
- [x] T030 [US1] Implement account lockout logic (5 failed attempts = 15min lock) in `backend/src/services/AuthService.ts`
- [x] T031 [US1] Create auth routes in `backend/src/routes/auth.routes.ts`
- [x] T032 [US1] Build LoginForm component in `frontend/src/components/auth/LoginForm.tsx`
- [x] T033 [US1] Create Login page in `frontend/src/pages/Login.tsx`
- [x] T034 [US1] Implement auth API service in `frontend/src/services/authApi.ts`
- [x] T035 [US1] Create auth state management (Zustand store) in `frontend/src/stores/authStore.ts`
- [x] T036 [US1] Seed database with initial admin user in `backend/src/seeds/001-AdminUser.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Role-Based Access Control (Priority: P1)

**Goal**: Implement RBAC system with 8 roles and permission enforcement

**Independent Test**: Can be tested by creating users with different roles and verifying they can/cannot access specific features. Test the permissions matrix from spec.

- [x] T037 [P] [US2] Create Permission entity in `backend/src/models/Permission.ts`
- [x] T038 [US2] Update Role entity to include permissions JSON array
- [x] T039 [US2] Run migration to update Role table with permissions column
- [x] T040 [US2] Implement RoleService with CRUD operations in `backend/src/services/RoleService.ts`
- [x] T041 [US2] Create RBAC middleware for permission checking in `backend/src/middleware/rbac.ts`
- [x] T042 [US2] Implement get current user endpoint in `backend/src/controllers/AuthController.ts`
- [x] T043 [US2] Implement list roles endpoint in `backend/src/controllers/RoleController.ts`
- [x] T044 [US2] Create user management endpoints (CRUD) in `backend/src/controllers/UserController.ts`
- [x] T045 [US2] Add user routes with RBAC protection in `backend/src/routes/users.routes.ts`
- [x] T046 [US2] Build UserManagement page in `frontend/src/pages/UserManagement.tsx`
- [x] T047 [US2] Create UserForm component for creating/editing users in `frontend/src/components/auth/UserForm.tsx`
- [x] T048 [US2] Implement users API service in `frontend/src/services/usersApi.ts`
- [x] T049 [US2] Build role assignment UI in `frontend/src/components/auth/RoleAssignment.tsx`
- [x] T050 [US2] Seed all 8 system roles with default permissions in `backend/src/seeds/002-SystemRoles.ts`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Multi-Factor Authentication (Priority: P2)

**Goal**: Implement TOTP-based MFA with QR code setup and backup codes

**Independent Test**: Can be tested by enabling MFA and verifying 2nd factor is required during login. Test QR code scanning, TOTP validation, and backup code usage.

- [x] T051 [P] [US3] Create MfaService with TOTP generation/verification in `backend/src/services/MfaService.ts`
- [x] T052 [US3] Implement MFA setup endpoint in `backend/src/controllers/AuthController.ts`
- [x] T053 [US3] Implement MFA verification endpoint in `backend/src/controllers/AuthController.ts`
- [x] T054 [US3] Implement MFA disable endpoint in `backend/src/controllers/AuthController.ts`
- [x] T055 [US3] Update login flow to handle MFA challenge in `backend/src/services/AuthService.ts`
- [x] T056 [US3] Add MFA encryption key to environment config
- [x] T057 [US3] Build MfaSetup component in `frontend/src/components/auth/MfaSetup.tsx`
- [x] T058 [US3] Create MfaVerify component for TOTP input in `frontend/src/components/auth/MfaVerify.tsx`
- [x] T059 [US3] Add MFA settings page in `frontend/src/pages/auth/MfaSettings.tsx`
- [x] T060 [US3] Display backup codes after MFA setup in `frontend/src/components/auth/BackupCodes.tsx`

**Checkpoint**: User Story 3 complete - MFA fully functional

---

## Phase 6: User Story 4 - Password Management (Priority: P2)

**Goal**: Implement password reset via email with secure tokens

**Independent Test**: Can be tested by requesting password reset and following email link. Verify token expiry, password history, and session invalidation.

- [x] T061 [P] [US4] Create PasswordResetToken entity in `backend/src/models/PasswordResetToken.ts`
- [x] T062 [US4] Run migration for PasswordResetToken table
- [x] T063 [US4] Implement PasswordService in `backend/src/services/PasswordService.ts`
- [x] T064 [US4] Implement forgot password endpoint in `backend/src/controllers/AuthController.ts`
- [x] T065 [US4] Implement reset password endpoint in `backend/src/controllers/AuthController.ts`
- [x] T066 [US4] Create password reset email template in `backend/src/templates/emails/password-reset.hbs`
- [x] T067 [US4] Implement password history check in `backend/src/services/PasswordService.ts`
- [x] T068 [US4] Build ForgotPassword page in `frontend/src/pages/ForgotPassword.tsx`
- [x] T069 [US4] Create ResetPassword page in `frontend/src/pages/ResetPassword.tsx`
- [x] T070 [US4] Add password strength indicator in `frontend/src/components/auth/PasswordStrength.tsx`
- [x] T071 [US4] Build ChangePassword component in `frontend/src/components/auth/ChangePassword.tsx`

**Checkpoint**: User Story 4 complete - Password reset flow working

---

## Phase 7: User Story 5 - Audit Trail & Logging (Priority: P2)

**Goal**: Implement comprehensive audit logging for compliance and security forensics

**Independent Test**: Can be tested by performing actions and verifying they appear in audit log with correct details. Test filtering, pagination, and export.

- [x] T072 [P] [US5] Create AuditLog entity in `backend/src/models/AuditLog.ts`
- [x] T073 [US5] Run migration for AuditLog table with indexes
- [x] T074 [US5] Implement AuditService in `backend/src/services/AuditService.ts`
- [x] T075 [US5] Create audit logging middleware in `backend/src/middleware/audit.ts`
- [x] T076 [US5] Implement audit log query endpoint in `backend/src/controllers/AuditController.ts`
- [x] T077 [US5] Add audit log export endpoint (CSV/Excel) in `backend/src/controllers/AuditController.ts`
- [x] T078 [US5] Create audit routes in `backend/src/routes/audit.routes.ts`
- [x] T079 [US5] Build AuditLog page with filters in `frontend/src/pages/AuditLog.tsx`
- [x] T080 [US5] Create AuditLogTable component in `frontend/src/components/audit/AuditLogTable.tsx`
- [x] T081 [US5] Implement audit filters (date range, user, action) in `frontend/src/components/audit/AuditFilters.tsx`
- [x] T082 [US5] Add audit log export button in `frontend/src/components/audit/ExportButton.tsx`
- [x] T083 [US5] Implement audit API service in `frontend/src/services/auditApi.ts`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T084 [P] Implement API request/response logging with correlation IDs
- [x] T085 [P] Add security headers (HSTS, CSP, X-Frame-Options) via Helmet
- [x] T086 Create API documentation page (Swagger UI) at `/api-docs`
- [x] T087 [P] Add input sanitization middleware to prevent XSS
- [x] T088 [P] Implement request ID middleware for tracing
- [x] T089 Create health check endpoint at `/health`
- [x] T090 [P] Add frontend error boundary component
- [x] T091 Implement loading states for all async operations
- [x] T092 [P] Add form validation error messages (French localization)
- [ ] T093 Create docker-compose.yml for full stack development
- [ ] T094 Write integration tests for all 5 user stories in `backend/tests/integration/`
- [ ] T095 [P] Add unit tests for services (AuthService, RoleService, etc.) in `backend/tests/unit/`
- [ ] T096 Run quickstart.md validation - verify all steps work
- [ ] T097 Performance test: verify login < 2s (95th percentile)
- [ ] T098 Security review: check for common vulnerabilities (OWASP Top 10)

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ──▶ Phase 2 (Foundation) ──▶ Phase 3 (US1: Login)
                                                  │
                                                  ▼
Phase 4 (US2: RBAC) ◀─────────────────────────────┘
       │
       ▼
Phase 5 (US3: MFA) ──┐
Phase 6 (US4: Password) ──┼──▶ Phase 7 (US5: Audit) ──▶ Phase 8 (Polish)
Phase 7 (US5: Audit) ─────┘
```

### User Story Dependencies

| Story | Dependencies | Parallel With |
|-------|--------------|---------------|
| US1 (Login) | Phase 1, Phase 2 | - |
| US2 (RBAC) | Phase 1, Phase 2, US1 | - |
| US3 (MFA) | Phase 1, Phase 2, US1 | US2, US4, US5 |
| US4 (Password) | Phase 1, Phase 2, US1 | US2, US3, US5 |
| US5 (Audit) | Phase 1, Phase 2, US1 | US2, US3, US4 |

### Within Each User Story

- Models before services
- Services before controllers
- Controllers before routes
- Backend API before frontend components
- Core implementation before edge cases

### Parallel Opportunities

**Maximum Parallelization** (with 4 developers):

| Developer | Tasks |
|-----------|-------|
| Dev 1 | Backend: US1 (Login) + US2 (RBAC) |
| Dev 2 | Backend: US3 (MFA) + US4 (Password) + US5 (Audit) |
| Dev 3 | Frontend: US1 + US2 components |
| Dev 4 | Frontend: US3 + US4 + US5 components + Testing |

---

## Implementation Strategy

### MVP First (Sprint 1)

Focus on **User Story 1 (Login)** + **User Story 2 (RBAC)**:
- Basic login/logout
- Token refresh
- Session management
- User CRUD for admins
- Role assignment
- Basic permission enforcement

**Acceptance**: Admin can log in, create users, assign roles, users can log in with assigned roles

### Incremental Delivery

**Sprint 2**: Add US3 (MFA) - Optional but recommended for security
**Sprint 3**: Add US4 (Password Reset) - Reduces support burden
**Sprint 4**: Add US5 (Audit) - Required for compliance

### Testing Strategy

1. **Unit Tests**: Services, utilities, middleware
2. **Integration Tests**: API endpoints, full user flows
3. **Contract Tests**: API schema validation
4. **E2E Tests**: Critical paths (login → action → logout)

### Risk Mitigation

- **Security**: Regular dependency audits (`npm audit`)
- **Performance**: Load testing before production
- **Data Loss**: Database backups before migrations
- **Lockout**: Admin recovery procedure documented

---

## Task Statistics

| Category | Count |
|----------|-------|
| **Total Tasks** | 98 |
| **Setup Phase** | 9 |
| **Foundational Phase** | 10 |
| **US1 (Login - P1)** | 17 |
| **US2 (RBAC - P1)** | 14 |
| **US3 (MFA - P2)** | 10 |
| **US4 (Password - P2)** | 11 |
| **US5 (Audit - P2)** | 12 |
| **Polish Phase** | 15 |

---

*Tasks generated from design documents following Constitution principles: Security-First, Data Integrity, Modular Architecture, and Performance Standards.*
