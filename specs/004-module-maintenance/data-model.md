# Data Model: Maintenance Module

## Entities

### Machine
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| designation | String(100) | Machine name/identifier |
| brand | String(50) | Manufacturer |
| model | String(50) | Model number |
| serial_number | String(100) | Unique serial number |
| purchase_date | Date | Acquisition date |
| acquisition_value | Decimal(12,2) | Purchase price in EUR |
| residual_value | Decimal(12,2) | Current book value |
| workshop_id | UUID | Foreign key to workshop/area |
| status | Enum | active, archived, maintenance |
| created_at | Timestamp | Creation timestamp |
| updated_at | Timestamp | Last update timestamp |

### MachineDocument
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| machine_id | UUID | Foreign key to Machine |
| document_type | Enum | manual, schematic, guide, certificate |
| file_path | String(255) | Storage path |
| file_name | String(100) | Original filename |
| uploaded_by | UUID | Foreign key to User |
| uploaded_at | Timestamp | Upload timestamp |

### MaintenancePlan
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| machine_id | UUID | Foreign key to Machine |
| description | String(255) | Plan description |
| frequency | Enum | daily, weekly, monthly, quarterly, annually |
| frequency_days | Integer | Days between occurrences |
| next_due_date | Date | Next scheduled date |
| is_active | Boolean | Plan enabled |
| created_by | UUID | Foreign key to User |
| created_at | Timestamp | Creation timestamp |

### WorkOrder
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| work_order_number | String(20) | Unique WO number (WO-YYYYMMDD-XXXX) |
| machine_id | UUID | Foreign key to Machine |
| type | Enum | preventive, corrective |
| status | Enum | created, assigned, in_progress, completed, closed |
| priority | Enum | critical, high, medium, low |
| assigned_to | UUID | Foreign key to User (technician) |
| description | Text | Work description |
| scheduled_date | Date | Planned date |
| actual_start | Timestamp | Start time |
| actual_end | Timestamp | End time |
| labor_hours | Decimal(6,2) | Hours worked |
| labor_cost | Decimal(10,2) | Labor cost (hours × rate) |
| total_cost | Decimal(12,2) | Total cost including parts |
| notes | Text | Additional notes |
| created_by | UUID | Foreign key to User |
| created_at | Timestamp | Creation timestamp |
| closed_at | Timestamp | Closure timestamp |

### WorkOrderPart
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| work_order_id | UUID | Foreign key to WorkOrder |
| part_id | UUID | Foreign key to InventoryItem |
| quantity | Integer | Quantity used |
| unit_cost | Decimal(10,2) | Cost per unit |

### BreakdownRecord
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| work_order_id | UUID | Foreign key to WorkOrder |
| machine_id | UUID | Foreign key to Machine |
| reported_at | Timestamp | When breakdown reported |
| acknowledged_at | Timestamp | When acknowledged |
| response_time_minutes | Integer | Time to acknowledge |
| repair_time_minutes | Integer | Time to repair |
| root_cause | Text | Root cause description |
| severity | Enum | critique, majeure, mineure |

## Relationships

```
Machine 1───∞ MachineDocument
Machine 1───∞ MaintenancePlan
Machine 1───∞ WorkOrder
Machine 1───∞ BreakdownRecord
WorkOrder 1───∞ WorkOrderPart
WorkOrder 1───1 BreakdownRecord
WorkOrder ∞───1 User (assigned_to)
WorkOrder ∞───1 User (created_by)
```

## Enums

### MachineStatus
- active
- archived
- maintenance

### DocumentType
- manual
- schematic
- guide
- certificate

### MaintenanceFrequency
- daily
- weekly
- monthly
- quarterly
- annually

### WorkOrderType
- preventive
- corrective

### WorkOrderStatus
- created
- assigned
- in_progress
- completed
- closed

### WorkOrderPriority
- critical
- high
- medium
- low

### BreakdownSeverity
- critique (critical)
- majeure (major)
- mineure (minor)
