# Research: Maintenance Module

## Industry Standards

### TRS (Taux de Rendement Synthétique) / OEE
The French term for Overall Equipment Effectiveness (OEE), a gold-standard metric in manufacturing:

- **Availability**: Actual production time / Planned production time
- **Performance**: (Ideal cycle time × Total pieces) / Operating time
- **Quality**: Good pieces / Total pieces

Typical targets:
- World-class: >85%
- Good: 70-85%
- Needs improvement: <70%

### MTBF (Mean Time Between Failures)
- Average time between breakdowns
- Higher is better (indicates reliability)
- Formula: Total Operating Time / Number of Breakdowns

### MTTR (Mean Time To Repair)
- Average time to repair a breakdown
- Lower is better (indicates maintainability)
- Formula: Total Repair Time / Number of Repairs

## French Industrial Maintenance Standards

### Severity Levels
- **Critique** (Critical): Immediate response required, production stopped
- **Majeure** (Major): 4-hour response, significant impact
- **Mineure** (Minor): 24-hour response, minimal impact

### Work Order Status Flow (Standard French)
1. Créé (Created) - Initial state
2. Assigné (Assigned) - Technician assigned
3. En cours (In Progress) - Work started
4. Terminé (Completed) - Work finished
5. Clôturé (Closed) - Verified and archived

## Integration Points

### Stock Module
- WorkOrderPart links to InventoryItem
- Automatic stock deduction on work order completion
- Reorder alerts integration

### Auth Module
- User roles: Technician, Supervisor, Manager
- RBAC for maintenance operations

### Audit Module
- All state changes logged
- Breakdown events tracked

## Technology Considerations

### Scheduling
- Cron jobs for preventive maintenance generation
- Event-based triggers for breakdown alerts

### Reporting
- Historical trend analysis
- Cost aggregation per machine
- Seasonal breakdown patterns

## References
- ISO 9001:2015 Quality Management
- AFNOR X 60-000 French Maintenance Standard
- LEAN manufacturing principles
