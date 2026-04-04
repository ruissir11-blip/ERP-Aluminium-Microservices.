# Feature Specification: API Error Resolution

**Feature Branch**: `006-api-error-resolution`  
**Created**: 2026-03-07  
**Status**: Completed  
**Input**: User description: "Resolve API errors identified in 006-api-error-resolution-plan.md"

## Summary

This feature resolves API errors for the Dashboard and Profile endpoints. The Dashboard endpoints were already implemented but returning 404 errors, while the Profile API was returning 500 errors due to database unavailability.

## User Scenarios & Testing

### User Story 1 - Dashboard Endpoints Return Data (Priority: P1)

**Description**: Frontend can successfully call dashboard endpoints and receive data

**Why this priority**: Dashboard is the main landing page - if it fails, users cannot see critical KPIs

**Independent Test**: Call each dashboard endpoint with curl and verify 200 response with valid JSON

**Acceptance Scenarios**:

1. **Given** backend is running, **When** GET /api/v1/dashboard/kpis is called, **Then** returns 200 with KPI data
2. **Given** backend is running, **When** GET /api/v1/dashboard/revenue is called, **Then** returns 200 with revenue data
3. **Given** backend is running, **When** GET /api/v1/dashboard/stock-distribution is called, **Then** returns 200 with stock distribution
4. **Given** backend is running, **When** GET /api/v1/dashboard/recent-orders is called, **Then** returns 200 with recent orders
5. **Given** backend is running, **When** GET /api/v1/dashboard/stock-alerts is called, **Then** returns 200 with stock alerts

---

### User Story 2 - Profile API Works Without Database (Priority: P1)

**Description**: Profile API returns mock data when database is unavailable instead of 500 error

**Why this priority**: Critical for development/demo environments without database

**Independent Test**: Call /api/v1/profiles without database running and verify mock data is returned

**Acceptance Scenarios**:

1. **Given** database is unavailable, **When** GET /api/v1/profiles is called, **Then** returns 200 with mock profile data
2. **Given** database is unavailable, **When** GET /api/v1/profiles/:id is called, **Then** returns 200 with mock profile or 404 if not found
3. **Given** database is unavailable, **When** POST /api/v1/profiles is called, **Then** returns 503 with "Database unavailable" message

---

### User Story 3 - Proper Error Status Codes (Priority: P2)

**Description**: API returns appropriate HTTP status codes for different error scenarios

**Why this priority**: Proper status codes help frontend handle errors correctly

**Independent Test**: Check HTTP status codes returned for various error conditions

**Acceptance Scenarios**:

1. **Given** resource not found, **When** GET /api/v1/profiles/invalid-id is called, **Then** returns 404
2. **Given** database unavailable, **When** POST /api/v1/profiles is called, **Then** returns 503 (not 500)
3. **Given** invalid UUID format, **When** GET /api/v1/profiles/not-a-uuid is called, **Then** returns 400

---

## Requirements

### Functional Requirements

- **FR-001**: Dashboard endpoints MUST return valid JSON with expected data structure
- **FR-002**: Profile API MUST return mock data when database is unavailable
- **FR-003**: Profile API MUST return 503 status when database is unavailable for write operations
- **FR-004**: All endpoints MUST return proper HTTP status codes (200, 400, 404, 503)
- **FR-005**: Frontend API calls MUST match backend endpoint paths

### Key Entities

- **DashboardKPIs**: Object containing chiffreAffaires, stockValue, trs, tauxNonConformite
- **MonthlyRevenue**: Array of objects with month and revenue
- **StockDistribution**: Array of objects with category and percentage
- **AluminumProfile**: Profile entity with reference, name, type, unitPrice

### Modified Files

- `backend/src/services/aluminium/ProfileService.ts` - Added mock data fallback
- `backend/src/controllers/aluminium/ProfileController.ts` - Added 503 error handling
- `plans/006-api-error-resolution-plan.md` - Updated plan with resolution details

## Success Criteria

### Measurable Outcomes

- **SC-001**: All 5 dashboard endpoints return 200 status
- **SC-002**: Profile API returns 200 with mock data when database unavailable
- **SC-003**: No 500 errors from Profile API (replaced with 503 or mock data)
- **SC-004**: TypeScript compiles without errors
