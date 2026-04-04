# AluTech ERP - Dashboard Issues Fix Plan

## Executive Summary
The Dashboard page (Tableau de Bord) gets stuck on a loading spinner due to multiple issues: authentication state not initializing properly, API error handling gaps, and missing user context in the Header component.

---

## Issues Identified & Fix Plan

### Issue 1: Dashboard Stuck on Loading Spinner
**Root Cause:** The authStore doesn't initialize from localStorage on page load.

**Location:** `frontend/src/stores/authStore.ts`

**Current Code (lines 30-35):**
```typescript
const [state, setState] = useState<AuthState>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
});
```

**Fix:** Add initialization logic to check for existing token and validate it on mount.

---

### Issue 2: Header User Info Not Displaying
**Root Cause:** Hardcoded values instead of using auth context.

**Location:** `frontend/src/components/common/Header.tsx` (lines 40-43)

**Current Code:**
```typescript
<p className="text-sm font-medium text-gray-900">Administrateur</p>
<p className="text-xs text-gray-500">admin@alutech.com</p>
```

**Fix:** Import useAuth hook and display user.firstName/user.email from context.

---

### Issue 3: Notification Icon Not Loading
**Root Cause:** Header.tsx uses static button instead of NotificationBell component.

**Location:** `frontend/src/components/common/Header.tsx` (lines 33-36)

**Current Code:**
```typescript
<button className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors">
  <Bell className="w-5 h-5" />
  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
</button>
```

**Fix:** Replace with `<NotificationBell />` component.

---

### Issue 4: Sidebar Logout Uses Wrong Key
**Root Cause:** Removes 'token' instead of 'accessToken'.

**Location:** `frontend/src/components/common/Sidebar.tsx` (line 115)

**Current Code:**
```typescript
localStorage.removeItem('token');
```

**Fix:** Change to:
```typescript
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
```

---

### Issue 5: Missing NotificationProvider
**Root Cause:** App not wrapped with NotificationProvider.

**Location:** `frontend/src/index.tsx`

**Current Code (lines 11-18):**
```typescript
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
```

**Fix:** Add NotificationProvider:
```typescript
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
```

---

### Issue 6: Dashboard API Error Handling
**Root Cause:** Promise.all could hang if API calls fail without proper error handling.

**Location:** `frontend/src/pages/Dashboard.tsx` (lines 20-41)

**Current Code:**
```typescript
const fetchDashboardData = async () => {
  try {
    setLoading(true);
    const [kpisRes, revenueRes, stockDistRes, ordersRes, alertsRes] = await Promise.all([
      dashboardService.getKPIs(),
      // ... other calls
    ]);
    // Set states...
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  } finally {
    setLoading(false);
  }
};
```

**Fix:** Add individual try-catch for each API call to prevent one failure from breaking all data, and add timeout handling.

---

## Implementation Order

1. **Step 1:** Fix authStore initialization - restore auth state from localStorage
2. **Step 2:** Fix Header.tsx - integrate auth context for user display
3. **Step 3:** Fix Header.tsx - replace static button with NotificationBell
4. **Step 4:** Fix Sidebar.tsx - correct logout localStorage keys
5. **Step 5:** Fix index.tsx - add NotificationProvider wrapper
6. **Step 6:** Fix Dashboard.tsx - improve API error handling with fallbacks
7. **Step 7:** Test all fixes

---

## Files to Modify

| File | Changes |
|------|---------|
| `frontend/src/stores/authStore.ts` | Add init from localStorage, add validateToken method |
| `frontend/src/components/common/Header.tsx` | Use auth context, use NotificationBell |
| `frontend/src/components/common/Sidebar.tsx` | Fix localStorage keys |
| `frontend/src/index.tsx` | Add NotificationProvider |
| `frontend/src/pages/Dashboard.tsx` | Improve error handling |

---

## Expected Results After Fix

1. ✅ Dashboard loads within 2-3 seconds with all KPI cards
2. ✅ User info (name/email) displays correctly in header
3. ✅ Notification bell shows unread count and dropdown
4. ✅ Logout properly clears all auth tokens
5. ✅ App recovers gracefully from API failures
