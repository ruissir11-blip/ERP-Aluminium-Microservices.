# Workflow State Machines

**Feature**: 003-module-stock  
**Date**: 2026-03-04

---

## 1. Inventory Count Workflow

### States

```
┌─────────┐    start()     ┌─────────────┐   submit()   ┌─────────────────┐
│  DRAFT  │───────────────▶│ IN_PROGRESS │─────────────▶│ VARIANCE_REVIEW │
└────┬────┘                └──────┬──────┘              └────────┬────────┘
     │                            │         ┌───────────────────┘
     │ cancel()                   │ back()  │ approve()
     ▼                            ▼         ▼
┌───────────┐               ┌─────────┐  ┌─────────────────────┐
│ CANCELLED │               │  DRAFT  │  │ ADJUSTMENT_APPROVED │
└───────────┘               └─────────┘  └──────────┬──────────┘
                                                    │ apply()
                                                    ▼
                                              ┌──────────┐
                                              │ COMPLETED│
                                              └──────────┘
```

### State Definitions

| State | Description | Allowed Roles | Actions Available |
|-------|-------------|---------------|-------------------|
| **DRAFT** | Count created, locations assigned | Stock Manager, Admin | Edit, Add lines, Remove lines, Start, Cancel |
| **IN_PROGRESS** | Physical counting in progress | Stock Clerk, Admin | Record counts, Request recount, Submit for review, Back to draft |
| **VARIANCE_REVIEW** | Variances being analyzed | Stock Manager, Admin | View variances, Approve adjustments, Request recount, Back to in-progress |
| **ADJUSTMENT_APPROVED** | Adjustments approved, ready to apply | Stock Manager, Admin | Apply adjustments, Back to review |
| **COMPLETED** | Final state, stock adjusted | All (read) | View only, Export report |
| **CANCELLED** | Count cancelled, no adjustments | Stock Manager, Admin | View only, Archive |

### Valid Transitions

| From State | To State | Trigger | Authorized Roles | Side Effects |
|------------|----------|---------|------------------|--------------|
| DRAFT | IN_PROGRESS | `startCount` | Stock Manager, Admin | Set startedAt timestamp, freeze inventory snapshots |
| DRAFT | CANCELLED | `cancelCount` | Stock Manager, Admin | Log cancellation reason |
| IN_PROGRESS | VARIANCE_REVIEW | `submitCount` | Stock Clerk, Admin | Calculate variances, lock count editing |
| IN_PROGRESS | DRAFT | `backToDraft` | Stock Manager, Admin | Allow editing of count lines |
| VARIANCE_REVIEW | ADJUSTMENT_APPROVED | `approveAdjustments` | Stock Manager, Admin | Record approved variances |
| VARIANCE_REVIEW | IN_PROGRESS | `requestRecount` | Stock Manager, Admin | Flag specific lines for recount |
| ADJUSTMENT_APPROVED | COMPLETED | `applyAdjustments` | Stock Manager, Admin | Post stock adjustments, create movements |
| ADJUSTMENT_APPROVED | VARIANCE_REVIEW | `backToReview` | Stock Manager, Admin | Reopen review process |

### Business Rules

1. **DRAFT Rules**:
   - Count number auto-generated (format: IC-{YYYY}-{SEQUENCE})
   - All fields editable
   - System quantities captured when transitioning to IN_PROGRESS
   - Can add/remove count lines freely

2. **IN_PROGRESS Rules**:
   - System quantities are frozen (snapshot taken)
   - Only countedQuantity, countStatus, reasonCode, notes editable
   - Partial submissions allowed (PENDING lines remain unchanged)
   - RECOUNT_REQUESTED status requires supervisor action

3. **VARIANCE_REVIEW Rules**:
   - System calculates: variance = countedQuantity - systemQuantity
   - Variance percentage = (variance / systemQuantity) * 100
   - Large variances (>5% or configurable threshold) flagged for review
   - Each line can be approved/rejected individually

4. **ADJUSTMENT_APPROVED Rules**:
   - Only approved lines will be adjusted
   - Rejected lines maintain original system quantity
   - User must confirm before applying adjustments

5. **COMPLETED Rules**:
   - All adjustments posted to inventory
   - StockMovement records created for each adjustment
   - Count becomes read-only
   - set completedAt timestamp

6. **Recount Handling**:
   - Specific lines can be flagged for recount
   - Returns to IN_PROGRESS state
   - Previous count values preserved in history
   - New count values overwrite previous

---

## 2. Lot Quality Status Workflow

### States

```
                    ┌─────────────┐
                    │  QUARANTINE │◀──── on receipt pending quality check
                    └──────┬──────┘
                           │ quality check passed
                           ▼
┌─────────────┐      ┌─────────────┐
│   REJECTED  │◀─────│   APPROVED  │◀──── normal operational state
└─────────────┘      └──────┬──────┘
     ▲                      │
     │ quality issue         │ quality issue detected
     │ detected              ▼
     └────────────────┌─────────────┐
                      │  QUARANTINE │◀──── can return to quarantine from approved
                      └─────────────┘
```

### State Definitions

| State | Description | Entry Conditions | Exit Conditions |
|-------|-------------|------------------|-----------------|
| **QUARANTINE** | Pending quality inspection | On receipt without COC, or manual hold | Quality check passed → APPROVED; Quality check failed → REJECTED |
| **APPROVED** | Quality approved, available for use | Quality check passed, COC received | Quality issue detected → QUARANTINE or REJECTED |
| **REJECTED** | Failed quality check, blocked | Quality check failed, or manual rejection | Return to supplier or disposal |

### Valid Transitions

| From State | To State | Trigger | Authorized Roles | Side Effects |
|------------|----------|---------|------------------|--------------|
| QUARANTINE | APPROVED | `approveLot` | Quality Manager, Admin | Set approvedAt, qualityCheckPassed = true, make available for allocation |
| QUARANTINE | REJECTED | `rejectLot` | Quality Manager, Admin | Set rejectedAt, log rejection reason, block from allocation |
| APPROVED | QUARANTINE | `quarantineLot` | Quality Manager, Admin | Set quarantinedAt, log reason, stop allocations |
| APPROVED | REJECTED | `rejectLot` | Quality Manager, Admin | Set rejectedAt, log rejection reason, block remaining stock |

### Business Rules

1. **QUARANTINE Rules**:
   - Lot is received but not available for allocation
   - Can be consumed by production orders if "allowQuarantineConsumption" flag set (emergency only)
   - Quality check must be completed within configured SLA (default 48 hours)
   - Alert triggered if quarantine exceeds SLA

2. **APPROVED Rules**:
   - Certificate of Conformity (COC) must be on file
   - Lot is available for normal stock operations
   - Can be allocated to production orders, sales orders
   - FIFO consumption includes approved lots only

3. **REJECTED Rules**:
   - Lot is blocked from all consumption
   - Existing reservations must be reallocated
   - Options: Return to supplier, Scrap/Disposal, Rework
   - Requires quarantine location transfer

4. **Auto-Transitions**:
   - New lots without COC auto-enter QUARANTINE
   - Lots with COC and "autoApprove" supplier setting → APPROVED
   - Expired lots (past expiryDate) → QUARANTINE (if not already REJECTED)

5. **Quality Documentation**:
   - Certificate of Conformity stored as document reference
   - Quality check results recorded in traceability chain
   - Photo/documentation of defects for rejected lots

---

## 3. Stock Alert States

### States

```
┌───────────┐   trigger   ┌─────────────┐   acknowledge   ┌─────────────┐
│  INACTIVE │────────────▶│  TRIGGERED  │───────────────▶│ ACKNOWLEDGED│
└─────┬─────┘             └─────────────┘                └──────┬──────┘
      │                                                         │
      │ reset                                                   │ auto-reset
      ▼                                                         ▼
┌───────────┐                                            ┌───────────┐
│  INACTIVE │◀───────────────────────────────────────────│  INACTIVE │
└───────────┘      (stock level back above threshold)    └───────────┘
```

### State Definitions

| State | Description | Actions |
|-------|-------------|---------|
| **INACTIVE** | Alert condition not met | Monitor stock levels |
| **TRIGGERED** | Stock below minimum or above maximum threshold | Send notifications, display in dashboard |
| **ACKNOWLEDGED** | Alert seen and acknowledged by user | Silence notifications, track acknowledgment |

### Valid Transitions

| From State | To State | Trigger | Authorized Roles | Side Effects |
|------------|----------|---------|------------------|--------------|
| INACTIVE | TRIGGERED | `checkThreshold` | System | Set lastTriggeredAt, send email notifications, display alert |
| TRIGGERED | ACKNOWLEDGED | `acknowledgeAlert` | Stock Manager, Admin | Set acknowledgedAt, acknowledgedBy, stop repeat notifications |
| ACKNOWLEDGED | INACTIVE | `resetAlert` | System | Clear acknowledgment, stock level recovered |
| TRIGGERED | INACTIVE | `resetAlert` | System | Auto-reset when stock level recovers |

### Business Rules

1. **Threshold Evaluation**:
   - Checked on every stock movement that affects quantity
   - Also checked periodically by scheduled job (every 15 minutes)
   - Minimum threshold: alert when available < minimum
   - Maximum threshold: alert when onHand > maximum (overstock)

2. **Notification Rules**:
   - Email sent to configured recipients on trigger
   - Dashboard notification displayed
   - Repeat notifications every 4 hours until acknowledged
   - SMS optional for critical alerts

3. **Acknowledgment Rules**:
   - Requires explicit user action
   - Must provide acknowledgment note (optional)
   - Tracked for audit purposes
   - Does not prevent re-triggering if condition persists

---

## State Transition API

All state transitions are performed through dedicated endpoints:

```
POST /api/inventory-counts/:id/{transition}
POST /api/lots/:id/{transition}
POST /api/alerts/:id/{transition}
```

### Request Body

```json
{
  "reason": "Optional reason for transition",
  "metadata": {
    // Transition-specific data
  }
}
```

### Response

```json
{
  "success": true,
  "previousState": "DRAFT",
  "currentState": "IN_PROGRESS",
  "transitionedAt": "2024-03-04T10:30:00Z",
  "transitionedBy": "user-uuid",
  "sideEffects": {
    "snapshotCreated": true,
    "notificationsSent": false
  }
}
```

### Error Responses

- `400 Bad Request`: Invalid transition for current state
- `403 Forbidden`: User not authorized for this transition
- `409 Conflict`: Business rules prevent transition
- `422 Unprocessable`: Missing required data for transition

---

## Inventory Count Line Status

### Count Status Values

| Status | Description | Transitions |
|--------|-------------|-------------|
| **PENDING** | Not yet counted | → COUNTED, → RECOUNT_REQUESTED |
| **COUNTED** | Count recorded | → RECOUNT_REQUESTED |
| **RECOUNT_REQUESTED** | Supervisor requested recount | → COUNTED |

### Adjustment Status

| Status | Description |
|--------|-------------|
| **PENDING** | Not yet reviewed |
| **APPROVED** | Variance approved for adjustment |
| **REJECTED** | Variance rejected, no adjustment |

---

**Workflows Version**: 1.0.0 | **Last Updated**: 2026-03-04