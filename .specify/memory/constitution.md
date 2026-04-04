<!--
SYNC IMPACT REPORT
==================
Version Change: 0.0.0 → 1.0.0 (Initial ratification)
Status: New constitution created from template

Modified Principles: N/A (initial creation)
Added Sections:
  - I. Domain-Driven Design (Aluminum Industry Focus)
  - II. Security-First Architecture
  - III. Data Integrity & Traceability
  - IV. Modular Monolith Architecture
  - V. Observability & Auditability
  - VI. Performance Standards
  - VII. Specification-Driven Development
  - VIII. AI-Ready Architecture
  - Technology Stack Standards
  - Governance

Removed Sections: N/A

Templates Requiring Updates:
  ✅ plan-template.md - Constitution Check gates aligned with principles
  ✅ spec-template.md - User story format supports traceability requirements
  ✅ tasks-template.md - Phase structure supports modular development
  
Follow-up TODOs:
  - TODO(RATIFICATION_DATE): Confirm actual project kickoff date for version history
  - TODO(TECH_LEAD_APPROVAL): Verify principle alignment with technical architecture

Generated: 2026-03-04
-->

# ERP Aluminium Constitution

## Core Principles

### I. Domain-Driven Design (Aluminum Industry Focus)

All business logic MUST be modeled around aluminum industry domain concepts. Profile types (cornière, tube, plat, UPN, IPE), calculations (surface, poids, coût matière), and workflows (devis → commande → fabrication → livraison) are first-class domain entities.

- Domain calculations MUST use precise formulas (Surface = Longueur × Largeur, Poids = Volume × 2.70 g/cm³)
- Unit conversions MUST be explicit and traceable (mm, m, kg, ml)
- Business rules for margin calculation, cost estimation, and quote generation MUST be configurable per client
- Rationale: The ERP's core value is accurate aluminum-specific business logic; generic implementations are unacceptable.

### II. Security-First Architecture (NON-NEGOTIABLE)

Security is not a feature—it is the foundation. Every module, API endpoint, and data access layer MUST implement defense in depth.

- Authentication: JWT-based with configurable expiration (default 24h, Remember Me: 7 days)
- Authorization: RBAC with 8 defined roles (Admin, Dirigeant, Commercial, Production, Stock, Maintenance, Qualité, Comptable)
- MFA: TOTP-based, mandatory for Admin and financial roles
- Encryption: TLS 1.3 in transit, AES-256 at rest
- Password policy: bcrypt (cost factor 12), minimum complexity enforced
- Input validation: ALL user inputs sanitized to prevent SQL injection and XSS
- Rationale: ERP systems contain sensitive financial and operational data; security breaches are catastrophic.

### III. Data Integrity & Traceability

Every business transaction MUST be traceable from origin to current state. Audit trails are mandatory for compliance and operational forensics.

- All create/update/delete operations MUST log: user_id, action, timestamp, IP address, before/after state
- Stock movements MUST maintain full history: entry/exit, reason, user, timestamp
- Quality non-conformities MUST track: detection → analysis → treatment → prevention → closure
- Financial records MUST be immutable once validated; corrections via reversing entries
- Database MUST enforce ACID transactions for all multi-step operations
- Rationale: Regulatory compliance, fraud prevention, and root cause analysis require complete data lineage.

### IV. Modular Monolith Architecture

The system is organized as a modular monolith: clear module boundaries with internal APIs, deployed as a single unit initially, designed for future extraction.

- Modules: Auth, Aluminium Business, Stock, Maintenance, Quality, Accounting, BI, AI
- Inter-module communication via well-defined internal APIs only
- Each module MUST have its own data access layer; direct cross-module DB access is PROHIBITED
- Module dependencies follow the defined graph (Auth → Aluminium → Stock → Maintenance/Quality → Accounting → BI)
- Circular dependencies between modules are FORBIDDEN
- Rationale: Enables parallel team development while maintaining deployment simplicity for Phase 1.

### V. Observability & Auditability

The system MUST provide real-time visibility into operations, performance, and security events.

- Structured logging: All operations logged in machine-parseable format (JSON)
- Metrics: Prometheus-compatible metrics for performance, error rates, business KPIs
- Dashboards: Role-based BI dashboards for each user profile (Dirigeant, Commercial, Production, etc.)
- Alerting: Automated alerts for stockouts, maintenance deadlines, quality issues, security events
- Audit reports: Periodic generation (weekly/monthly) with automated distribution
- Rationale: Data-driven decision making requires accessible, timely, and accurate operational intelligence.

### VI. Performance Standards

Performance is a measurable requirement, not an aspiration. All targets MUST be validated under load.

- Page load time: < 2 seconds (95th percentile) for all user-facing pages
- API response time: < 500ms average, < 2 seconds maximum for complex queries
- Database queries: < 2 seconds for analytics queries, < 100ms for CRUD operations
- Concurrent users: Support 50 simultaneous users without degradation
- Uptime: 99.5% availability (excluding planned maintenance)
- Rationale: Slow systems reduce productivity and user adoption; performance impacts business outcomes.

### VII. Specification-Driven Development

All features MUST be specified before implementation. The specification documents are the single source of truth.

- Every feature MUST have: specification document, implementation plan, test scenarios
- User stories MUST include: priority (P1/P2/P3), acceptance criteria, independent testability
- Technical decisions MUST be documented in architecture decision records (ADRs)
- API contracts MUST be defined before implementation (OpenAPI/Swagger)
- Code changes without corresponding specification updates are PROHIBITED
- Rationale: Prevents scope creep, enables parallel development, ensures testability, supports maintenance.

### VIII. AI-Ready Architecture

The system MUST be designed to integrate AI/ML capabilities progressively without architectural rework.

- Data pipelines: Structured data export for ML training (historical sales, stock movements, maintenance logs)
- Prediction endpoints: API hooks for demand forecasting, stockout prediction, optimization recommendations
- Feature stores: Centralized, versioned feature definitions for ML models
- Model versioning: Tracked deployments of ML models with A/B testing capability
- Human-in-the-loop: AI recommendations require user confirmation for critical decisions
- Rationale: AI is a Phase 2 requirement; architecture must accommodate it without disruption.

## Technology Stack Standards

Technology choices are constrained to ensure maintainability and team efficiency.

| Layer | Technology | Justification |
|-------|------------|---------------|
| Frontend | React.js + TypeScript | Type safety, component reusability, team expertise |
| UI Framework | Tailwind CSS + Ant Design | Rapid UI development, accessible components |
| Backend | Node.js (Express) or Python (FastAPI) | REST API performance, team familiarity |
| Database | PostgreSQL | ACID compliance, JSON support, BI/analytics capable |
| Cache | Redis | Session storage, performance optimization |
| File Storage | MinIO | S3-compatible, on-premise capable |
| BI Engine | Apache Superset or Metabase | Open source, PostgreSQL native |
| ML/AI | Python (scikit-learn, Prophet, TensorFlow) | Industry standard, model ecosystem |
| Infrastructure | Docker + Docker Compose / Kubernetes | Reproducible deployments, scalability |
| Authentication | JWT + OAuth2 / Keycloak | Standards-based, SSO capable |

### Technology Constraints

- All code MUST be strongly typed (TypeScript, Python type hints)
- API responses MUST include consistent error formatting (code, message, details)
- Frontend MUST support: Chrome, Firefox, Edge, Safari (last 2 versions)
- UI MUST be responsive: desktop (primary), tablet (full functionality), mobile (read-only Phase 1)
- Accessibility: WCAG 2.1 Level AA compliance mandatory
- Rationale: Technology constraints reduce cognitive load, enable tooling, and ensure consistency.

## Governance

### Amendment Procedure

1. **Proposal**: Any team member may propose a constitutional amendment via documented RFC
2. **Review**: Tech Lead and Project Manager review for alignment with project goals
3. **Impact Analysis**: All affected specifications and templates MUST be identified
4. **Approval**: Amendments require written approval from Tech Lead; major changes (principle removal/redefinition) require stakeholder sign-off
5. **Version Bump**: Semantic versioning applied (MAJOR: breaking governance changes; MINOR: new principles/sections; PATCH: clarifications)
6. **Propagation**: Updates MUST be reflected in all templates and active specifications

### Versioning Policy

- **MAJOR (X.0.0)**: Principle removal, backward-incompatible governance changes, fundamental architecture shifts
- **MINOR (x.Y.0)**: New principles added, new sections, materially expanded guidance
- **PATCH (x.y.Z)**: Clarifications, wording improvements, typo fixes, non-semantic refinements

### Compliance Review

- All pull requests MUST verify constitution compliance (automated check + reviewer confirmation)
- Quarterly constitution review: assess principle adherence, identify drift, propose amendments
- Architecture decisions conflicting with constitution MUST justify the exception and propose amendment if permanent

### Roles and Responsibilities

| Role | Responsibility |
|------|----------------|
| Tech Lead | Constitution interpretation, amendment approval, architecture alignment |
| Project Manager | Governance process, stakeholder communication, compliance tracking |
| Developers | Principle adherence in implementation, raising constitution conflicts |
| QA Engineer | Verifying testability, audit trail completeness, security compliance |

---

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE) | **Last Amended**: 2026-03-04
