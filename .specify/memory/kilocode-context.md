# Kilo Code Agent Context

**Project**: ERP Aluminium  
**Features**: 001-auth-security, 002-module-aluminium  
**Updated**: 2026-03-04

---

## Current Feature Context

### Active Features
- **Branch**: 002-module-aluminium
- **Specs**: 
  - specs/001-auth-security/spec.md
  - specs/002-module-aluminium/spec.md
- **Plans**: 
  - specs/001-auth-security/plan.md
  - specs/002-module-aluminium/plan.md

### Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20 LTS |
| Language | TypeScript 5.3 |
| Framework | Express.js 4.x |
| ORM | TypeORM 0.3.x |
| Database | PostgreSQL 15+ |
| Cache | Redis 7+ |
| Auth | JWT (jsonwebtoken), bcrypt, speakeasy (TOTP) |
| Validation | class-validator |
| Email | nodemailer |
| **PDF Generation** | **Puppeteer 21.x** |
| **Decimal Math** | **decimal.js 10.x** |
| Testing | Jest 29.x, Supertest |</textarea>

### Architecture Decisions

1. **Modular Monolith**: Auth module is self-contained with clear boundaries
2. **Stateless JWT**: Access tokens are stateless; refresh tokens stored in Redis
3. **RBAC**: Role-based permissions stored as JSON in Role entity
4. **Audit Trail**: Immutable audit logs in PostgreSQL with JSONB details
5. **Rate Limiting**: Redis-backed rate limiting for distributed deployments

### Project Structure

```
backend/
├── src/
│   ├── config/
│   ├── models/ (TypeORM entities)
│   ├── services/ (Business logic)
│   ├── controllers/ (HTTP handlers)
│   ├── middleware/ (Auth, RBAC, rate limit)
│   ├── routes/
│   └── utils/
├── tests/
└── package.json

frontend/
├── src/
│   ├── components/auth/
│   ├── pages/
│   └── services/
```

### Key Entities

**Auth Module (001)**:
- **User**: Authentication credentials, MFA settings, lockout tracking
- **Role**: RBAC definitions with JSON permissions array
- **Session**: Token tracking for revocation
- **AuditLog**: Immutable security event log
- **PasswordResetToken**: Time-limited reset tokens

**Aluminum Module (002)**:
- **AluminumProfile**: Catalog of aluminum profiles (PLAT, TUBE, CORNIERE, UPN, IPE)
- **Customer**: Customer data with billing/shipping addresses
- **Quote**: Sales quote with lines, calculations, workflow (BROUILLON → ENVOYÉ → ACCEPTÉ)
- **QuoteLine**: Individual line items with auto-calculated weight, surface, cost
- **CustomerOrder**: Confirmed order linked to quote
- **ProductionOrder**: Manufacturing orders with status tracking
- **DeliveryNote**: Delivery documentation with signatures
- **Invoice**: Billing with sequential numbering

### Domain Knowledge - Aluminum Calculations

**Formulas**:
- Weight = Volume × 2.70 g/cm³ (aluminum density)
- Surface = Length × Width (in m²)
- Material Cost = Weight × Unit Price
- Margin = Selling Price - Material Cost

**Profile Types**:
- PLAT: Flat bar with length, width, thickness
- TUBE: Hollow profiles (round, square, rectangular)
- CORNIERE: Angle/L-profiles
- UPN: U-channel structural profiles
- IPE: I-beam structural profiles

**Quote Workflow States**:
```
BROUILLON → ENVOYÉ → ACCEPTÉ → COMMANDE
              ↓
            REFUSÉ, EXPIRÉ, ANNULÉ → ARCHIVÉ
```

**Order Workflow States**:
```
EN_ATTENTE → CONFIRMÉE → EN_PRODUCTION → TERMINÉE → LIVRÉE → FACTURÉE
```</textarea>

### Environment Variables Required

```
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
REDIS_URL
JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN
MFA_ENCRYPTION_KEY
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
BCRYPT_ROUNDS
```

### Implementation Notes

- bcrypt cost factor: 12
- JWT expiry: 24h (access), 7d (refresh)
- TOTP window: ±1 step (90 seconds)
- Account lockout: 5 failed attempts, 15 minutes
- Password reset: 1 hour expiry
- Rate limits: 5 login/min, 100 API/min

---

*Context for Kilo Code agent - maintains state across sessions*
