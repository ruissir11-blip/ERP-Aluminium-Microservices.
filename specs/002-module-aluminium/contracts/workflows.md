# Workflow State Machines

**Feature**: 002-module-aluminium  
**Date**: 2026-03-04

---

## 1. Quote Workflow

### States

```
┌───────────┐    send     ┌───────────┐
│ BROUILLON │ ──────────> │  ENVOYÉ   │
└─────┬─────┘             └─────┬─────┘
      │                         │
      │ cancel                  │ accept
      v                         v
┌───────────┐             ┌───────────┐    convert    ┌──────────┐
│  ANNULÉ   │             │  ACCEPTÉ  │ ────────────> │ COMMANDE │
└─────┬─────┘             └─────┬─────┘               └──────────┘
      │                         │
      │                         │ refuse
      v                         v
┌───────────────────────────────────────┐
│              ARCHIVÉ                  │
└───────────────────────────────────────┘
                              ^
                              │ expire
                        ┌─────┴─────┐
                        │  EXPIRÉ   │
                        └───────────┘
```

### State Definitions

| State | Description | Allowed Roles | Actions Available |
|-------|-------------|---------------|-------------------|
| **BROUILLON** | Draft quote being prepared | Commercial, Admin | Edit, Add lines, Delete, Send, Cancel |
| **ENVOYÉ** | Quote sent to customer | Commercial, Admin | View, Accept, Refuse, Expire |
| **ACCEPTÉ** | Customer accepted quote | Commercial, Admin | Convert to Order |
| **REFUSÉ** | Customer declined quote | Commercial, Admin | Archive, Clone |
| **EXPIRÉ** | Quote past validity date | System, Admin | Archive, Extend |
| **ANNULÉ** | Cancelled by sales rep | Commercial, Admin | Archive |
| **ARCHIVÉ** | Final state, read-only | All (read) | View only |

### Valid Transitions

| From State | To State | Trigger | Authorized Roles | Side Effects |
|------------|----------|---------|------------------|--------------|
| BROUILLON | ENVOYÉ | `sendQuote` | Commercial, Admin | Set sentAt timestamp |
| BROUILLON | ANNULÉ | `cancelQuote` | Commercial, Admin | Log cancellation reason |
| ENVOYÉ | ACCEPTÉ | `acceptQuote` | Commercial, Admin | Set acceptedAt timestamp |
| ENVOYÉ | REFUSÉ | `refuseQuote` | Commercial, Admin | Log refusal reason |
| ENVOYÉ | EXPIRÉ | `expireQuote` | System (cron), Admin | Set expiredAt timestamp |
| ACCEPTÉ | COMMANDE | `convertToOrder` | Commercial, Admin | Create CustomerOrder, set convertedToOrderId |
| REFUSÉ | ARCHIVÉ | `archiveQuote` | Commercial, Admin | Read-only from now on |
| EXPIRÉ | ARCHIVÉ | `archiveQuote` | Commercial, Admin | Read-only from now on |
| ANNULÉ | ARCHIVÉ | `archiveQuote` | Commercial, Admin | Read-only from now on |

### Business Rules

1. **BROUILLON Rules**:
   - All fields are editable
   - Quote number assigned on first save
   - Valid until date defaults to +30 days from creation

2. **ENVOYÉ Rules**:
   - Quote becomes read-only (no line editing)
   - PDF is generated and stored
   - Email notification may be sent (async)

3. **ACCEPTÉ Rules**:
   - Quote is locked
   - Must convert to order within configurable period (default 7 days)
   - Conversion copies all pricing data

4. **Auto-Transitions**:
   - Daily cron job expires quotes past validUntil date
   - Expired quotes in ENVOYÉ status auto-transition to EXPIRÉ

---

## 2. Customer Order Workflow

### States

```
┌─────────────┐   confirm   ┌─────────────┐   start    ┌───────────────┐
│ EN_ATTENTE  │ ──────────> │  CONFIRMÉE  │ ─────────> │ EN_PRODUCTION │
└─────────────┘             └─────────────┘            └───────┬───────┘
                                                               │
                                                               │ complete
                                                               v
┌─────────────┐              ┌─────────────┐            ┌───────────────┐
│   LIVRÉE    │ <─────────── │  PARTIELLE  │ <────────│   TERMINÉE    │
└──────┬──────┘   partial    └─────────────┘  partial   └───────────────┘
       │
       │ full delivery
       v
┌─────────────┐   invoice   ┌─────────────┐
│  FACTURÉE   │ <────────── │ FACTURATION │
└─────────────┘             └─────────────┘
```

### State Definitions

| State | Description | Entry Conditions |
|-------|-------------|------------------|
| **EN_ATTENTE** | Order created, awaiting confirmation | Created from accepted quote |
| **CONFIRMÉE** | Order confirmed with customer | Confirmation received |
| **EN_PRODUCTION** | Production in progress | Production order started |
| **PARTIELLE** | Partially produced/delivered | Some items complete |
| **TERMINÉE** | Production complete | All production orders done |
| **LIVRÉE** | All items delivered | Delivery notes signed |
| **FACTURATION** | Ready for invoicing | Delivery confirmed |
| **FACTURÉE** | Invoice issued | Invoice created |
| **ANNULÉE** | Order cancelled | Cancellation approved |

### Valid Transitions

| From State | To State | Trigger | Authorized Roles | Side Effects |
|------------|----------|---------|------------------|--------------|
| EN_ATTENTE | CONFIRMÉE | `confirmOrder` | Commercial, Admin | Set confirmedAt timestamp |
| CONFIRMÉE | EN_PRODUCTION | `startProduction` | Production, Admin | Create ProductionOrder(s) |
| EN_PRODUCTION | PARTIELLE | `partialComplete` | Production, Admin | Some items finished |
| EN_PRODUCTION | TERMINÉE | `completeProduction` | Production, Admin | All items finished |
| PARTIELLE | TERMINÉE | `completeProduction` | Production, Admin | Remaining items finished |
| TERMINÉE | LIVRÉE | `deliverOrder` | Stock, Admin | Create DeliveryNote(s) |
| TERMINÉE | PARTIELLE | `partialDelivery` | Stock, Admin | Partial shipment |
| LIVRÉE | FACTURATION | `prepareInvoice` | Commercial, Admin | Invoice preparation |
| FACTURATION | FACTURÉE | `createInvoice` | Commercial, Admin | Create Invoice record |
| EN_ATTENTE | ANNULÉE | `cancelOrder` | Commercial, Admin | Log cancellation |

### Business Rules

1. **Status Aggregation**:
   - If multiple ProductionOrders exist, parent Order status reflects aggregate
   - All ProductionOrders TERMINÉ → Order becomes TERMINÉE
   - Some ProductionOrders TERMINÉ → Order becomes PARTIELLE

2. **Delivery Handling**:
   - Partial deliveries allowed (multiple DeliveryNotes)
   - Order becomes LIVRÉE when all items delivered
   - Stock automatically decremented on delivery confirmation

3. **Invoice Linking**:
   - One Order can have multiple Invoices (progress billing)
   - Order becomes FACTURÉE when fully invoiced

---

## 3. Production Order Workflow

### States

```
┌───────────┐   start    ┌───────────┐   pause    ┌───────────┐
│ PLANIFIÉ  │ ─────────> │ EN_COURS  │ <────────> │ EN_PAUSE  │
└───────────┘            └─────┬─────┘            └───────────┘
                               │
                               │ complete
                               v
                         ┌───────────┐
                         │  TERMINÉ  │
                         └─────┬─────┘
                               │ cancel
                               v
                         ┌───────────┐
                         │  ANNULÉ   │
                         └───────────┘
```

### State Definitions

| State | Description | Actions |
|-------|-------------|---------|
| **PLANIFIÉ** | Scheduled, not started | Edit, Start, Cancel |
| **EN_COURS** | Actively being produced | Pause, Complete, Update progress |
| **EN_PAUSE** | Temporarily halted | Resume, Cancel |
| **TERMINÉ** | Production complete | Archive, Create delivery |
| **ANNULÉ** | Cancelled | Archive |

### Valid Transitions

| From State | To State | Trigger | Authorized Roles |
|------------|----------|---------|------------------|
| PLANIFIÉ | EN_COURS | `startProduction` | Production, Admin |
| PLANIFIÉ | ANNULÉ | `cancelProduction` | Production, Admin |
| EN_COURS | EN_PAUSE | `pauseProduction` | Production, Admin |
| EN_COURS | TERMINÉ | `completeProduction` | Production, Admin |
| EN_PAUSE | EN_COURS | `resumeProduction` | Production, Admin |
| EN_PAUSE | ANNULÉ | `cancelProduction` | Production, Admin |

### Business Rules

1. **Time Tracking**:
   - actualStart set on transition to EN_COURS
   - actualEnd set on transition to TERMINÉ
   - Duration calculated for reporting

2. **Quantity Tracking**:
   - quantityProduced updated throughout production
   - Can exceed quantityRequired (overproduction)
   - Final quantities locked on TERMINÉ

---

## 4. Delivery Note Workflow

### States

```
┌───────────┐   ship     ┌───────────┐   deliver   ┌───────────┐
│ PRÉPARÉ   │ ─────────> │ EXPÉDIÉ   │ ──────────> │  LIVRÉ    │
└───────────┘            └───────────┘             └───────────┘
                                                    │
                                                    │ return
                                                    v
                                               ┌───────────┐
                                               │ RETOURNÉ  │
                                               └───────────┘
```

### State Definitions

| State | Description | Actions |
|-------|-------------|---------|
| **PRÉPARÉ** | Ready for shipment | Edit, Mark shipped, Cancel |
| **EXPÉDIÉ** | In transit | Mark delivered |
| **LIVRÉ** | Delivered and signed | Archive |
| **RETOURNÉ** | Returned by customer | Process return |

### Valid Transitions

| From State | To State | Trigger | Authorized Roles |
|------------|----------|---------|------------------|
| PRÉPARÉ | EXPÉDIÉ | `markShipped` | Stock, Admin |
| EXPÉDIÉ | LIVRÉ | `markDelivered` | Stock, Admin |
| LIVRÉ | RETOURNÉ | `processReturn` | Stock, Admin |

### Business Rules

1. **Signature Required**:
   - signedBy and signedAt required for LIVRÉ status
   - signatureImage optional but recommended

2. **Stock Impact**:
   - Stock decremented on transition to EXPÉDIÉ or LIVRÉ
   - Stock incremented on transition to RETOURNÉ

---

## 5. Invoice Workflow

### States

```
┌───────────┐   send     ┌───────────┐   pay      ┌───────────┐
│ BROUILLON │ ─────────> │  ENVOYÉE  │ ─────────> │   PAYÉE   │
└───────────┘            └─────┬─────┘            └───────────┘
                               │
                               │ overdue
                               v
                         ┌───────────┐
                         │ EN_RETARD │
                         └─────┬─────┘
                               │ pay
                               └───────────> PAYÉE
```

### State Definitions

| State | Description | Actions |
|-------|-------------|---------|
| **BROUILLON** | Draft invoice | Edit, Send, Delete |
| **ENVOYÉE** | Sent to customer | Record payment, Mark overdue |
| **PAYÉE** | Payment received | Archive |
| **EN_RETARD** | Past due date | Record payment |
| **ANNULÉE** | Cancelled | Archive |

### Valid Transitions

| From State | To State | Trigger | Authorized Roles |
|------------|----------|---------|------------------|
| BROUILLON | ENVOYÉE | `sendInvoice` | Commercial, Admin |
| ENVOYÉE | PAYÉE | `recordPayment` | Comptable, Admin |
| ENVOYÉE | EN_RETARD | `markOverdue` | System (cron), Admin |
| EN_RETARD | PAYÉE | `recordPayment` | Comptable, Admin |
| BROUILLON | ANNULÉE | `cancelInvoice` | Commercial, Admin |

### Business Rules

1. **Sequential Numbering**:
   - Invoice numbers must be sequential per year
   - Format: FAC-{YYYY}-{SEQUENCE}
   - No gaps allowed in sequence

2. **Payment Tracking**:
   - amountPaid tracks partial payments
   - Invoice PAYÉE when amountPaid >= total
   - Multiple payments allowed

3. **Auto-Transitions**:
   - Daily cron marks invoices as EN_RETARD when past dueDate

---

## State Transition API

All state transitions are performed through dedicated endpoints:

```
POST /api/quotes/:id/{transition}
POST /api/orders/:id/{transition}
POST /api/production/:id/{transition}
POST /api/deliveries/:id/{transition}
POST /api/invoices/:id/{transition}
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
  "previousState": "BROUILLON",
  "currentState": "ENVOYÉ",
  "transitionedAt": "2024-03-04T10:30:00Z",
  "transitionedBy": "user-uuid",
  "sideEffects": {
    "pdfGenerated": true,
    "emailSent": true
  }
}
```

### Error Responses

- `400 Bad Request`: Invalid transition for current state
- `403 Forbidden`: User not authorized for this transition
- `409 Conflict`: Business rules prevent transition
- `422 Unprocessable`: Missing required data for transition

---

**Workflows Version**: 1.0.0 | **Last Updated**: 2026-03-04
