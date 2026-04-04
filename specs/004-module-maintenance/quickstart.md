# Quickstart: Maintenance Module

## Getting Started

### Prerequisites
- Node.js 20 LTS
- PostgreSQL database
- Redis (for caching)
- Completed: 001-auth-security, 003-module-stock

### Backend Setup

1. **Run the migration**:
   ```bash
   cd backend
   npm run migration:run
   ```

2. **Start the server**:
   ```bash
   npm run dev
   ```

3. **Verify endpoints**:
   ```bash
   # Health check
   curl http://localhost:3000/api/v1/health

   # List machines (requires auth)
   curl -H "Authorization: Bearer <token>" \
     http://localhost:3000/api/v1/maintenance/machines
   ```

### API Examples

#### Create a Machine
```bash
curl -X POST http://localhost:3000/api/v1/maintenance/machines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "designation": "CNC Machine A1",
    "brand": "Haas",
    "model": "VF-2",
    "serial_number": "HA-VF2-2024-001",
    "purchase_date": "2024-01-15",
    "acquisition_value": 75000.00,
    "residual_value": 50000.00,
    "workshop_id": "uuid-of-workshop"
  }'
```

#### Create a Work Order
```bash
curl -X POST http://localhost:3000/api/v1/maintenance/work-orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "machine_id": "uuid-of-machine",
    "type": "preventive",
    "priority": "medium",
    "description": "Quarterly oil change",
    "scheduled_date": "2026-04-01"
  }'
```

#### Get Machine TRS
```bash
curl http://localhost:3000/api/v1/maintenance/metrics/trs/uuid-of-machine \
  -H "Authorization: Bearer <token>"
```

## Frontend Development

### Available Scripts
```bash
cd frontend
npm run dev
```

### Key Pages
- `/maintenance/machines` - Machine fleet management
- `/maintenance/work-orders` - Work order list
- `/maintenance/calendar` - Maintenance calendar
- `/maintenance/dashboard` - KPIs dashboard

## Testing

```bash
# Backend tests
cd backend
npm test

# Linting
npm run lint
```
