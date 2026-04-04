# Data Model: Authentication & Security Module

**Feature**: 001-auth-security  
**Date**: 2026-03-04  
**ORM**: TypeORM 0.3.x

---

## Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      User       │     │      Role       │     │   Permission    │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ PK id: UUID     │────▶│ PK id: UUID     │◄────│ PK id: UUID     │
│ email: string   │     │ name: string    │     │ module: enum    │
│ password_hash   │     │ description     │     │ action: enum    │
│ first_name      │     │ permissions:    │     │ description     │
│ last_name       │     │   JSON[]        │     └─────────────────┘
│ FK role_id      │     │ is_system_role  │
│ mfa_enabled     │     └─────────────────┘
│ mfa_secret      │
│ last_login_at   │
│ is_active       │
│ created_at      │
│ updated_at      │
└─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐     ┌─────────────────────────┐
│  PasswordReset  │     │        Session          │
│     Token       │     ├─────────────────────────┤
├─────────────────┤     │ PK id: UUID             │
│ PK id: UUID     │     │ FK user_id              │
│ FK user_id      │     │ token_hash: string      │
│ token_hash      │     │ expires_at: timestamp   │
│ expires_at      │     │ ip_address: inet        │
│ used_at         │     │ user_agent: text        │
│ created_at      │     │ is_remember_me: boolean │
└─────────────────┘     │ created_at: timestamp   │
                        └─────────────────────────┘
┌─────────────────┐
│    AuditLog     │
├─────────────────┤
│ PK id: UUID     │
│ FK user_id      │
│ action: enum    │
│ module: string  │
│ details: JSONB  │
│ ip_address: inet│
│ user_agent: text│
│ severity: enum  │
│ created_at      │
└─────────────────┘
```

---

## Entity Definitions

### User

Core user entity for authentication and authorization.

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  @Index()
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ name: 'role_id' })
  roleId: string;

  @ManyToOne(() => Role, role => role.users)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'mfa_enabled', default: false })
  mfaEnabled: boolean;

  @Column({ name: 'mfa_secret', nullable: true, length: 255 })
  mfaSecret: string | null; // Encrypted TOTP secret

  @Column({ name: 'backup_codes', type: 'jsonb', nullable: true })
  backupCodes: string[] | null; // Array of bcrypt hashed codes

  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt: Date | null;

  @Column({ name: 'is_active', default: true })
  @Index()
  isActive: boolean;

  @Column({ name: 'failed_login_attempts', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'locked_until', nullable: true })
  lockedUntil: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @OneToMany(() => Session, session => session.user)
  sessions: Session[];

  @OneToMany(() => AuditLog, log => log.user)
  auditLogs: AuditLog[];

  @OneToMany(() => PasswordResetToken, token => token.user)
  passwordResetTokens: PasswordResetToken[];
}
```

---

### Role

Role-based access control definition.

```typescript
@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  @Index()
  name: string; // Admin, Dirigeant, Commercial, etc.

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  permissions: Permission[]; // Array of {module, action}

  @Column({ name: 'is_system_role', default: false })
  isSystemRole: boolean; // Cannot be deleted if true

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @OneToMany(() => User, user => user.role)
  users: User[];
}

// Permission sub-type (embedded in Role)
interface Permission {
  module: Module; // Auth, Aluminium, Stock, etc.
  action: Action; // create, read, update, delete
}

enum Module {
  AUTH = 'auth',
  ALUMINIUM = 'aluminium',
  STOCK = 'stock',
  MAINTENANCE = 'maintenance',
  QUALITY = 'quality',
  ACCOUNTING = 'accounting',
  BI = 'bi',
  AI = 'ai',
  USERS = 'users'
}

enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete'
}
```

---

### Session

Active session tracking for JWT token management.

```typescript
@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, user => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'token_hash', length: 255 })
  @Index()
  tokenHash: string; // SHA-256 hash of JWT token (for revocation lookup)

  @Column({ name: 'refresh_token_hash', length: 255, nullable: true })
  refreshTokenHash: string | null;

  @Column({ name: 'expires_at' })
  @Index()
  expiresAt: Date;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string | null;

  @Column({ name: 'is_remember_me', default: false })
  isRememberMe: boolean;

  @Column({ name: 'revoked_at', nullable: true })
  revokedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

---

### PasswordResetToken

Time-limited tokens for password reset flow.

```typescript
@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, user => user.passwordResetTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'token_hash', length: 255 })
  @Index()
  tokenHash: string; // bcrypt hash of token

  @Column({ name: 'expires_at' })
  @Index()
  expiresAt: Date;

  @Column({ name: 'used_at', nullable: true })
  usedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

---

### AuditLog

Immutable audit trail for compliance and security forensics.

```typescript
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, user => user.auditLogs, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ length: 50 })
  @Index()
  action: string; // login, logout, password_change, permission_denied, etc.

  @Column({ length: 50 })
  @Index()
  module: string;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any> | null;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string | null;

  @Column({ length: 20, default: 'info' })
  severity: 'info' | 'warning' | 'error';

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;
}
```

---

## Database Indexes

For query performance optimization:

```sql
-- User lookup by email (login)
CREATE INDEX idx_users_email ON users(email);

-- Active users only
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- Session expiration (cleanup job)
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Token lookup (revocation check)
CREATE INDEX idx_sessions_token ON sessions(token_hash);

-- Audit log filtering
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- Password reset token lookup
CREATE INDEX idx_reset_token ON password_reset_tokens(token_hash);
CREATE INDEX idx_reset_expires ON password_reset_tokens(expires_at);
```

---

## Data Constraints

### Business Rules

1. **Email Uniqueness**: Email addresses must be unique across all users (case-insensitive)
2. **Role Assignment**: Every user must have exactly one role
3. **System Roles**: Roles marked `is_system_role=true` cannot be deleted
4. **Active Sessions**: A user can have multiple active sessions (concurrent devices allowed)
5. **Single Session Policy**: When configured, new login invalidates previous sessions
6. **Account Lockout**: After 5 failed attempts, account locked for 15 minutes
7. **Token Expiry**: Password reset tokens valid for exactly 1 hour
8. **Audit Immutability**: Audit log entries cannot be updated or deleted

### Referential Integrity

- `User.role_id` → `Role.id` (ON DELETE RESTRICT)
- `Session.user_id` → `User.id` (ON DELETE CASCADE)
- `PasswordResetToken.user_id` → `User.id` (ON DELETE CASCADE)
- `AuditLog.user_id` → `User.id` (ON DELETE SET NULL - preserve audit trail)

---

*Data model follows Constitution principle III (Data Integrity & Traceability) with immutable audit logs and ACID compliance.*
