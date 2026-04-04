# Quickstart: Authentication & Security Module

**Feature**: 001-auth-security  
**Date**: 2026-03-04

---

## Prerequisites

- Node.js 20 LTS
- PostgreSQL 15+
- Redis 7+
- SMTP server (or Mailtrap for development)

## Environment Setup

### 1. Clone and Install

```bash
# From project root
git checkout 001-auth-security

cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure Environment Variables

Create `backend/.env`:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=erp_aluminium
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-256-bit-key-here-min-32-chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# MFA
MFA_ENCRYPTION_KEY=another-256-bit-key-for-mfa-secrets

# Email (SMTP)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_password
SMTP_FROM=noreply@erp-aluminium.local

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```

### 3. Database Setup

```bash
cd backend

# Run migrations
npm run migration:run

# Seed initial data (roles and admin user)
npm run seed
```

Default admin credentials after seeding:
- Email: `admin@erp-aluminium.local`
- Password: `Admin123!@#` (change immediately)

### 4. Start Development Servers

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

Access the application at `http://localhost:5173`

---

## API Testing

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@erp-aluminium.local",
    "password": "Admin123!@#",
    "rememberMe": false
  }'
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "admin@erp-aluminium.local",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin",
    "mfaEnabled": false
  },
  "expiresIn": 86400
}
```

### Access Protected Endpoint

```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Setup MFA

```bash
curl -X POST http://localhost:3000/api/v1/auth/mfa/setup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response includes QR code URL for authenticator app scanning.

---

## Development Workflow

### Running Tests

```bash
# Unit tests
cd backend
npm run test

# Integration tests
npm run test:integration

# Watch mode
npm run test:watch
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run typecheck

# Format code
npm run format
```

### Database Migrations

```bash
# Generate migration from entity changes
npm run migration:generate -- -n MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

---

## Docker Development

### Start All Services

```bash
# From project root
docker-compose up -d

# Includes: PostgreSQL, Redis, Backend, Frontend
```

### View Logs

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Reset Environment

```bash
docker-compose down -v
docker-compose up -d
```

---

## Common Issues

### JWT Secret Too Short

**Error**: `Error: secretOrPrivateKey must be at least 256 bits`

**Solution**: Ensure `JWT_SECRET` is at least 32 characters long.

### Database Connection Failed

**Error**: `Error: connect ECONNREFUSED`

**Solution**: 
- Verify PostgreSQL is running
- Check `.env` database credentials
- Ensure database exists: `createdb erp_aluminium`

### Redis Connection Failed

**Error**: `Error: Redis connection failed`

**Solution**:
- Verify Redis is running: `redis-cli ping`
- Check `REDIS_URL` in `.env`

### Email Not Sending

**Issue**: Password reset emails not received

**Solution**:
- Check Mailtrap inbox
- Verify SMTP credentials in `.env`
- Check spam folders

---

## Testing MFA

### Using Test TOTP

For development, you can generate TOTP codes:

```bash
# Install oath-toolkit
brew install oath-toolkit

# Generate TOTP (replace with your secret)
othtool --totp -b YOUR_BASE32_SECRET
```

### Backup Codes

When enabling MFA, 10 backup codes are generated. Store these securely - they can be used if the authenticator device is lost.

---

## Production Considerations

### Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT secrets (256-bit random)
- [ ] Enable TLS 1.3
- [ ] Configure rate limiting appropriately
- [ ] Set up log aggregation
- [ ] Enable database encryption at rest
- [ ] Use Redis with persistence for sessions
- [ ] Configure email SPF/DKIM

### Performance Tuning

- [ ] Database connection pooling
- [ ] Redis connection pooling
- [ ] JWT caching
- [ ] Audit log partitioning (after 1M records)

### Monitoring

Key metrics to track:
- Login success/failure rate
- Average login duration
- MFA setup completion rate
- Session count
- Audit log growth rate

---

## Next Steps

1. Review the [specification](./spec.md) for full requirements
2. Check the [data model](./data-model.md) for entity relationships
3. Test API endpoints using the [OpenAPI spec](./contracts/auth-api.yaml)
4. Run `/speckit.tasks` to generate implementation tasks

---

*Quickstart guide for the 001-auth-security feature. Follows ERP Aluminium Constitution principles.*
