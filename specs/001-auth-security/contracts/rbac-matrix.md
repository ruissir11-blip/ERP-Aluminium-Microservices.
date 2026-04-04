# RBAC Permission Matrix

**Feature**: 001-auth-security  
**Date**: 2026-03-04

---

## Roles Definition

| Role | ID | Description |
|------|-----|-------------|
| **Admin** | `admin` | Full system access, user management, configuration |
| **Dirigeant** | `dirigeant` | Executive access to all modules and reports |
| **Directeur Commercial** | `commercial` | Sales, quotes, customer data, aluminum module |
| **Responsable Production** | `production` | Production planning, quality read, stock read |
| **Responsable Stock** | `stock` | Inventory management, stock movements |
| **Responsable Maintenance** | `maintenance` | Equipment, preventive/corrective maintenance |
| **Responsable Qualité** | `qualite` | Quality control, non-conformities, inspections |
| **Comptable/DAF** | `comptable` | Financial data, accounting, BI reports |

---

## Module Permissions Matrix

### Legend
- **C** = Create
- **R** = Read
- **U** = Update
- **D** = Delete
- **-** = No access

| Module | Admin | Dirigeant | Commercial | Production | Stock | Maintenance | Qualité | Comptable |
|--------|:-----:|:---------:|:----------:|:----------:|:-----:|:-----------:|:-------:|:---------:|
| **Authentication** | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD |
| **Module A - Aluminium** | CRUD | CRUD | CRUD | R | R | - | - | R |
| **Module B - Stock** | CRUD | CRUD | R | R | CRUD | R | - | R |
| **Module C - Maintenance** | CRUD | CRUD | - | R | - | CRUD | - | R |
| **Module D - Qualité** | CRUD | CRUD | - | R | - | - | CRUD | R |
| **Module E - Comptabilité** | CRUD | CRUD | R | - | - | - | - | CRUD |
| **BI Dashboard** | CRUD | CRUD | CRUD | R | R | R | R | CRUD |
| **AI Module** | CRUD | CRUD | R | R | - | - | - | - |
| **User Management** | CRUD | - | - | - | - | - | - | - |

---

## Permission Granularity

### Auth Module Permissions

| Action | Admin | Dirigeant | Commercial | Production | Stock | Maintenance | Qualité | Comptable |
|--------|:-----:|:---------:|:----------:|:----------:|:-----:|:-----------:|:-------:|:---------:|
| Login | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Logout | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Setup MFA | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Reset Password | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View Own Profile | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Edit Own Profile | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View All Users | ✓ | - | - | - | - | - | - | - |
| Create User | ✓ | - | - | - | - | - | - | - |
| Edit Any User | ✓ | - | - | - | - | - | - | - |
| Deactivate User | ✓ | - | - | - | - | - | - | - |
| View Roles | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Edit Roles | ✓ | - | - | - | - | - | - | - |
| View Audit Log | ✓ | ✓ | - | - | - | - | - | - |

### Aluminum Module Permissions

| Action | Admin | Dirigeant | Commercial | Production | Stock | Maintenance | Qualité | Comptable |
|--------|:-----:|:---------:|:----------:|:----------:|:-----:|:-----------:|:-------:|:---------:|
| Create Profiles | ✓ | ✓ | ✓ | - | - | - | - | - |
| Read Profiles | ✓ | ✓ | ✓ | ✓ | ✓ | - | - | ✓ |
| Update Profiles | ✓ | ✓ | ✓ | - | - | - | - | - |
| Delete Profiles | ✓ | ✓ | - | - | - | - | - | - |
| Create Quotes | ✓ | ✓ | ✓ | - | - | - | - | - |
| Read Quotes | ✓ | ✓ | ✓ | ✓ | ✓ | - | - | ✓ |
| Update Quotes | ✓ | ✓ | ✓ | - | - | - | - | - |
| Create Orders | ✓ | ✓ | ✓ | - | - | - | - | - |
| Read Orders | ✓ | ✓ | ✓ | ✓ | ✓ | - | - | ✓ |

### Stock Module Permissions

| Action | Admin | Dirigeant | Commercial | Production | Stock | Maintenance | Qualité | Comptable |
|--------|:-----:|:---------:|:----------:|:----------:|:-----:|:-----------:|:-------:|:---------:|
| Create Movements | ✓ | ✓ | - | - | ✓ | - | - | - |
| Read Stock | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - | ✓ |
| Update Stock | ✓ | ✓ | - | - | ✓ | - | - | - |
| Create Alerts | ✓ | ✓ | - | - | ✓ | - | - | - |
| Read Alerts | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - | ✓ |
| Generate Reports | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - | ✓ |

---

## Role Default Permissions (JSON)

### Admin
```json
{
  "role": "admin",
  "permissions": [
    {"module": "*", "actions": ["create", "read", "update", "delete"]}
  ]
}
```

### Dirigeant
```json
{
  "role": "dirigeant",
  "permissions": [
    {"module": "*", "actions": ["create", "read", "update", "delete"]}
  ]
}
```

### Commercial
```json
{
  "role": "commercial",
  "permissions": [
    {"module": "auth", "actions": ["create", "read", "update", "delete"]},
    {"module": "aluminium", "actions": ["create", "read", "update"]},
    {"module": "stock", "actions": ["read"]},
    {"module": "accounting", "actions": ["read"]},
    {"module": "bi", "actions": ["create", "read", "update"]},
    {"module": "ai", "actions": ["read"]}
  ]
}
```

### Production
```json
{
  "role": "production",
  "permissions": [
    {"module": "auth", "actions": ["create", "read", "update", "delete"]},
    {"module": "aluminium", "actions": ["read"]},
    {"module": "stock", "actions": ["read"]},
    {"module": "maintenance", "actions": ["read"]},
    {"module": "quality", "actions": ["read"]},
    {"module": "bi", "actions": ["read"]},
    {"module": "ai", "actions": ["read"]}
  ]
}
```

### Stock
```json
{
  "role": "stock",
  "permissions": [
    {"module": "auth", "actions": ["create", "read", "update", "delete"]},
    {"module": "aluminium", "actions": ["read"]},
    {"module": "stock", "actions": ["create", "read", "update"]},
    {"module": "maintenance", "actions": ["read"]},
    {"module": "bi", "actions": ["read"]}
  ]
}
```

### Maintenance
```json
{
  "role": "maintenance",
  "permissions": [
    {"module": "auth", "actions": ["create", "read", "update", "delete"]},
    {"module": "maintenance", "actions": ["create", "read", "update"]},
    {"module": "bi", "actions": ["read"]}
  ]
}
```

### Qualité
```json
{
  "role": "qualite",
  "permissions": [
    {"module": "auth", "actions": ["create", "read", "update", "delete"]},
    {"module": "quality", "actions": ["create", "read", "update"]},
    {"module": "bi", "actions": ["read"]}
  ]
}
```

### Comptable
```json
{
  "role": "comptable",
  "permissions": [
    {"module": "auth", "actions": ["create", "read", "update", "delete"]},
    {"module": "aluminium", "actions": ["read"]},
    {"module": "stock", "actions": ["read"]},
    {"module": "maintenance", "actions": ["read"]},
    {"module": "quality", "actions": ["read"]},
    {"module": "accounting", "actions": ["create", "read", "update"]},
    {"module": "bi", "actions": ["create", "read", "update"]}
  ]
}
```

---

## Middleware Implementation

```typescript
// Permission check middleware
export const requirePermission = (module: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const hasPermission = user.role.permissions.some(
      p => (p.module === module || p.module === '*') && 
           (p.actions.includes(action) || p.actions.includes('*'))
    );
    
    if (!hasPermission) {
      // Log permission denied
      auditService.log({
        userId: user.id,
        action: 'permission_denied',
        module,
        details: { attemptedAction: action },
        severity: 'warning'
      });
      
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};
```

---

*RBAC matrix defined per Constitution principle II (Security-First Architecture) with defense-in-depth authorization.*
