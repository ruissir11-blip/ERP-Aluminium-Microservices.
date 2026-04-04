import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './stores/authStore';
import { RoleProtectedRoute } from './components/rbac/RBAC';
import { UserRole, getDefaultRouteForRole } from './types/rbac';

import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/Dashboard';
import ProfileList from './pages/ProfileList';
import QuoteList from './pages/QuoteList';
import CustomerList from './pages/aluminium/CustomerList';
import InvoiceList from './pages/aluminium/InvoiceList';
import OrderList from './pages/OrderList';
import StockManagement from './pages/StockManagement';
import AuditLog from './pages/AuditLog';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import QualityIndex from './pages/quality/QualityIndex';
import QualityDashboard from './pages/quality/QualityDashboard';
import NonConformityList from './pages/quality/NonConformityList';
import InspectionPoints from './pages/quality/InspectionPoints';
import InspectionRecords from './pages/quality/InspectionRecords';
import QualityDecisions from './pages/quality/QualityDecisions';
import CorrectiveActions from './pages/quality/CorrectiveActions';
import RootCauseAnalysis from './pages/quality/RootCauseAnalysis';
import MaintenanceDashboard from './pages/maintenance/MaintenanceDashboard';
import Machines from './pages/maintenance/Machines';
import WorkOrders from './pages/maintenance/WorkOrders';
import MaintenancePlans from './pages/maintenance/MaintenancePlans';
import MaintenanceCalendar from './pages/maintenance/MaintenanceCalendar';
import MaintenanceMetrics from './pages/maintenance/MaintenanceMetrics';
import MaintenanceCosts from './pages/maintenance/MaintenanceCosts';
import BIDashboard from './pages/bi/BIDashboard';

// HR pages
import EmployeeList from './pages/hr/EmployeeList';
import HRDashboard from './pages/hr/HRDashboard';
import DepartmentList from './pages/hr/DepartmentList';
import LeaveList from './pages/hr/LeaveList';
import AttendanceList from './pages/hr/AttendanceList';
import ContractList from './pages/hr/ContractList';
import PayslipList from './pages/hr/PayslipList';

// AI pages
import AIForecasting from './pages/ai/AIForecasting';
import AIInventoryOptimization from './pages/ai/AIInventoryOptimization';
import AIProductionSchedule from './pages/ai/AIProductionSchedule';
import AIStockout from './pages/ai/AIStockout';

// Comptabilité pages
import ROICalculator from './pages/comptabilite/ROICalculator';
import ProductCosts from './pages/comptabilite/ProductCosts';
import FinancialDashboard from './pages/comptabilite/FinancialDashboard';
import CommercialPerformance from './pages/comptabilite/CommercialPerformance';
import CustomerProfitability from './pages/comptabilite/CustomerProfitability';
import CostConfiguration from './pages/comptabilite/CostConfiguration';

// Report pages
import StockLevelsReport from './pages/reports/StockLevelsReport';
import StockMovementsReport from './pages/reports/StockMovementsReport';
import InventoryResultsReport from './pages/reports/InventoryResultsReport';
import StockAlertsReport from './pages/reports/StockAlertsReport';
import MaintenanceDashboardReport from './pages/reports/MaintenanceDashboardReport';
import MaintenanceCostsReport from './pages/reports/MaintenanceCostsReport';
import MaintenanceMetricsReport from './pages/reports/MaintenanceMetricsReport';
import WorkOrdersReport from './pages/reports/WorkOrdersReport';
import QualityDashboardReport from './pages/reports/QualityDashboardReport';
import NonConformitiesReport from './pages/reports/NonConformitiesReport';
import Analysis8DReport from './pages/reports/Analysis8DReport';
import CorrectiveActionsReport from './pages/reports/CorrectiveActionsReport';

// ============================================================================
// Role-based route access configuration
// ============================================================================

// Define which roles can access each route
type RouteRoles = UserRole[];

const routePermissions: Record<string, RouteRoles> = {
  // Dashboard & Base routes
  '/': ['ADMIN'],
  '/dashboard': ['ADMIN'],
  '/profiles': ['ADMIN', 'STOCK_RESPONSIBLE'],
  '/orders': ['ADMIN', 'COMMERCIAL_RESPONSIBLE'],
  '/stock': ['ADMIN', 'STOCK_RESPONSIBLE'],
  '/audit-logs': ['ADMIN'],
  
  // Commercial routes
  '/customers': ['ADMIN', 'COMMERCIAL_RESPONSIBLE'],
  '/quotes': ['ADMIN', 'COMMERCIAL_RESPONSIBLE'],
  '/invoices': ['ADMIN', 'COMPTABLE', 'COMMERCIAL_RESPONSIBLE'],
  
  // Reports & Settings (Admin only)
  '/reports': ['ADMIN'],
  '/settings': ['ADMIN'],
  '/bi-dashboards': ['ADMIN'],
  
  // Quality (Admin only)
  '/quality': ['ADMIN'],
  '/quality/dashboard': ['ADMIN'],
  '/quality/nc': ['ADMIN'],
  '/quality/inspection-points': ['ADMIN'],
  '/quality/inspection-records': ['ADMIN'],
  '/quality/decisions': ['ADMIN'],
  '/quality/corrective-actions': ['ADMIN'],
  '/quality/root-cause': ['ADMIN'],
  
  // Maintenance
  '/maintenance': ['ADMIN', 'MAINTENANCE_RESPONSIBLE'],
  '/maintenance/machines': ['ADMIN', 'MAINTENANCE_RESPONSIBLE'],
  '/maintenance/work-orders': ['ADMIN', 'MAINTENANCE_RESPONSIBLE'],
  '/maintenance/plans': ['ADMIN', 'MAINTENANCE_RESPONSIBLE'],
  '/maintenance/calendar': ['ADMIN', 'MAINTENANCE_RESPONSIBLE'],
  '/maintenance/metrics': ['ADMIN', 'MAINTENANCE_RESPONSIBLE'],
  '/maintenance/costs': ['ADMIN', 'MAINTENANCE_RESPONSIBLE'],
  
  // HR - accessible by ADMIN and RH_RESPONSIBLE, plus COMPTABLE for payslips
  '/hr': ['ADMIN', 'RH_RESPONSIBLE'],
  '/hr/employees': ['ADMIN', 'RH_RESPONSIBLE'],
  '/hr/departments': ['ADMIN', 'RH_RESPONSIBLE'],
  '/hr/contracts': ['ADMIN', 'RH_RESPONSIBLE'],
  '/hr/leave': ['ADMIN', 'RH_RESPONSIBLE'],
  '/hr/attendance': ['ADMIN', 'RH_RESPONSIBLE'],
  '/hr/payslips': ['ADMIN', 'RH_RESPONSIBLE', 'COMPTABLE'],
  
  // AI - different access based on feature
  '/ai/forecasting': ['ADMIN', 'COMMERCIAL_RESPONSIBLE'],
  '/ai/inventory-optimization': ['ADMIN', 'STOCK_RESPONSIBLE'],
  '/ai/production-schedule': ['ADMIN'],
  '/ai/stockout': ['ADMIN', 'STOCK_RESPONSIBLE'],
  
  // Comptabilité - accessible by ADMIN and COMPTABLE
  '/comptabilite/roi': ['ADMIN', 'COMPTABLE'],
  '/comptabilite/product-costs': ['ADMIN', 'COMPTABLE'],
  '/comptabilite/financial-dashboard': ['ADMIN', 'COMPTABLE'],
  '/comptabilite/commercial-performance': ['ADMIN', 'COMPTABLE'],
  '/comptabilite/customer-profitability': ['ADMIN', 'COMPTABLE'],
  '/comptabilite/cost-configuration': ['ADMIN', 'COMPTABLE'],
  
  // Stock Reports
  '/reports/stock-levels': ['ADMIN'],
  '/reports/stock-movements': ['ADMIN'],
  '/reports/inventory-results': ['ADMIN'],
  '/reports/stock-alerts': ['ADMIN'],
  
  // Maintenance Reports
  '/reports/maintenance-dashboard': ['ADMIN'],
  '/reports/maintenance-costs': ['ADMIN'],
  '/reports/maintenance-metrics': ['ADMIN'],
  '/reports/work-orders': ['ADMIN'],
  
  // Quality Reports
  '/reports/quality-dashboard': ['ADMIN'],
  '/reports/non-conformities': ['ADMIN'],
  '/reports/8d-analysis': ['ADMIN'],
  '/reports/corrective-actions': ['ADMIN'],
};

// Helper function to get allowed roles for a path
function getAllowedRoles(path: string): RouteRoles {
  // Check exact match first
  if (routePermissions[path]) {
    return routePermissions[path];
  }
  
  // Check partial match for sub-paths
  for (const [routePath, roles] of Object.entries(routePermissions)) {
    if (path.startsWith(routePath + '/') || path === routePath) {
      return roles;
    }
  }
  
  // Default: only ADMIN can access
  return ['ADMIN'];
}

// Protected Route component (basic auth check)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Route wrapper that applies role-based protection
const ProtectedRouteWithRoles: React.FC<{
  path: string;
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}> = ({ path, children, allowedRoles }) => {
  const { user } = useAuth();
  const roles = allowedRoles || getAllowedRoles(path);
  
  return (
    <RoleProtectedRoute allowedRoles={roles}>
      {children}
    </RoleProtectedRoute>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Routes with Role-Based Access */}
        
        {/* Dashboard */}
        <Route path="/" element={
          <ProtectedRouteWithRoles path="/">
            <Dashboard />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/dashboard" element={
          <ProtectedRouteWithRoles path="/dashboard">
            <Dashboard />
          </ProtectedRouteWithRoles>
        } />
        
        {/* Profiles/Articles */}
        <Route path="/profiles" element={
          <ProtectedRouteWithRoles path="/profiles">
            <ProfileList />
          </ProtectedRouteWithRoles>
        } />
        
        {/* Orders */}
        <Route path="/orders" element={
          <ProtectedRouteWithRoles path="/orders">
            <OrderList />
          </ProtectedRouteWithRoles>
        } />
        
        {/* Stock */}
        <Route path="/stock" element={
          <ProtectedRouteWithRoles path="/stock">
            <StockManagement />
          </ProtectedRouteWithRoles>
        } />
        
        {/* Audit Logs */}
        <Route path="/audit-logs" element={
          <ProtectedRouteWithRoles path="/audit-logs">
            <AuditLog />
          </ProtectedRouteWithRoles>
        } />
        
        {/* Commercial */}
        <Route path="/quotes" element={
          <ProtectedRouteWithRoles path="/quotes">
            <QuoteList />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/customers" element={
          <ProtectedRouteWithRoles path="/customers">
            <CustomerList />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/invoices" element={
          <ProtectedRouteWithRoles path="/invoices">
            <InvoiceList />
          </ProtectedRouteWithRoles>
        } />
        
        {/* Reports & Settings */}
        <Route path="/reports" element={
          <ProtectedRouteWithRoles path="/reports">
            <Reports />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/settings" element={
          <ProtectedRouteWithRoles path="/settings">
            <Settings />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/bi-dashboards" element={
          <ProtectedRouteWithRoles path="/bi-dashboards">
            <BIDashboard />
          </ProtectedRouteWithRoles>
        } />
        
        {/* Quality */}
        <Route path="/quality" element={
          <ProtectedRouteWithRoles path="/quality">
            <QualityIndex />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/quality/dashboard" element={
          <ProtectedRouteWithRoles path="/quality/dashboard">
            <QualityDashboard />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/quality/nc" element={
          <ProtectedRouteWithRoles path="/quality/nc">
            <NonConformityList />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/quality/inspection-points" element={
          <ProtectedRouteWithRoles path="/quality/inspection-points">
            <InspectionPoints />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/quality/inspection-records" element={
          <ProtectedRouteWithRoles path="/quality/inspection-records">
            <InspectionRecords />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/quality/decisions" element={
          <ProtectedRouteWithRoles path="/quality/decisions">
            <QualityDecisions />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/quality/corrective-actions" element={
          <ProtectedRouteWithRoles path="/quality/corrective-actions">
            <CorrectiveActions />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/quality/root-cause" element={
          <ProtectedRouteWithRoles path="/quality/root-cause">
            <RootCauseAnalysis />
          </ProtectedRouteWithRoles>
        } />
        
        {/* Maintenance */}
        <Route path="/maintenance" element={
          <ProtectedRouteWithRoles path="/maintenance">
            <MaintenanceDashboard />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/maintenance/machines" element={
          <ProtectedRouteWithRoles path="/maintenance/machines">
            <Machines />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/maintenance/work-orders" element={
          <ProtectedRouteWithRoles path="/maintenance/work-orders">
            <WorkOrders />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/maintenance/plans" element={
          <ProtectedRouteWithRoles path="/maintenance/plans">
            <MaintenancePlans />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/maintenance/calendar" element={
          <ProtectedRouteWithRoles path="/maintenance/calendar">
            <MaintenanceCalendar />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/maintenance/metrics" element={
          <ProtectedRouteWithRoles path="/maintenance/metrics">
            <MaintenanceMetrics />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/maintenance/costs" element={
          <ProtectedRouteWithRoles path="/maintenance/costs">
            <MaintenanceCosts />
          </ProtectedRouteWithRoles>
        } />
        
        {/* HR */}
        <Route path="/hr" element={
          <ProtectedRouteWithRoles path="/hr">
            <HRDashboard />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/hr/employees" element={
          <ProtectedRouteWithRoles path="/hr/employees">
            <EmployeeList />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/hr/departments" element={
          <ProtectedRouteWithRoles path="/hr/departments">
            <DepartmentList />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/hr/leave" element={
          <ProtectedRouteWithRoles path="/hr/leave">
            <LeaveList />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/hr/attendance" element={
          <ProtectedRouteWithRoles path="/hr/attendance">
            <AttendanceList />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/hr/contracts" element={
          <ProtectedRouteWithRoles path="/hr/contracts">
            <ContractList />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/hr/payslips" element={
          <ProtectedRouteWithRoles path="/hr/payslips">
            <PayslipList />
          </ProtectedRouteWithRoles>
        } />
        
        {/* AI */}
        <Route path="/ai/forecasting" element={
          <ProtectedRouteWithRoles path="/ai/forecasting">
            <AIForecasting />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/ai/inventory-optimization" element={
          <ProtectedRouteWithRoles path="/ai/inventory-optimization">
            <AIInventoryOptimization />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/ai/production-schedule" element={
          <ProtectedRouteWithRoles path="/ai/production-schedule">
            <AIProductionSchedule />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/ai/stockout" element={
          <ProtectedRouteWithRoles path="/ai/stockout">
            <AIStockout />
          </ProtectedRouteWithRoles>
        } />
        
        {/* Comptabilité */}
        <Route path="/comptabilite/roi" element={
          <ProtectedRouteWithRoles path="/comptabilite/roi">
            <ROICalculator />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/comptabilite/product-costs" element={
          <ProtectedRouteWithRoles path="/comptabilite/product-costs">
            <ProductCosts />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/comptabilite/financial-dashboard" element={
          <ProtectedRouteWithRoles path="/comptabilite/financial-dashboard">
            <FinancialDashboard />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/comptabilite/commercial-performance" element={
          <ProtectedRouteWithRoles path="/comptabilite/commercial-performance">
            <CommercialPerformance />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/comptabilite/customer-profitability" element={
          <ProtectedRouteWithRoles path="/comptabilite/customer-profitability">
            <CustomerProfitability />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/comptabilite/cost-configuration" element={
          <ProtectedRouteWithRoles path="/comptabilite/cost-configuration">
            <CostConfiguration />
          </ProtectedRouteWithRoles>
        } />
        
        {/* Stock Reports */}
        <Route path="/reports/stock-levels" element={
          <ProtectedRouteWithRoles path="/reports/stock-levels">
            <StockLevelsReport />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/reports/stock-movements" element={
          <ProtectedRouteWithRoles path="/reports/stock-movements">
            <StockMovementsReport />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/reports/inventory-results" element={
          <ProtectedRouteWithRoles path="/reports/inventory-results">
            <InventoryResultsReport />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/reports/stock-alerts" element={
          <ProtectedRouteWithRoles path="/reports/stock-alerts">
            <StockAlertsReport />
          </ProtectedRouteWithRoles>
        } />
        
        {/* Maintenance Reports */}
        <Route path="/reports/maintenance-dashboard" element={
          <ProtectedRouteWithRoles path="/reports/maintenance-dashboard">
            <MaintenanceDashboardReport />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/reports/maintenance-costs" element={
          <ProtectedRouteWithRoles path="/reports/maintenance-costs">
            <MaintenanceCostsReport />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/reports/maintenance-metrics" element={
          <ProtectedRouteWithRoles path="/reports/maintenance-metrics">
            <MaintenanceMetricsReport />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/reports/work-orders" element={
          <ProtectedRouteWithRoles path="/reports/work-orders">
            <WorkOrdersReport />
          </ProtectedRouteWithRoles>
        } />
        
        {/* Quality Reports */}
        <Route path="/reports/quality-dashboard" element={
          <ProtectedRouteWithRoles path="/reports/quality-dashboard">
            <QualityDashboardReport />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/reports/non-conformities" element={
          <ProtectedRouteWithRoles path="/reports/non-conformities">
            <NonConformitiesReport />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/reports/8d-analysis" element={
          <ProtectedRouteWithRoles path="/reports/8d-analysis">
            <Analysis8DReport />
          </ProtectedRouteWithRoles>
        } />
        <Route path="/reports/corrective-actions" element={
          <ProtectedRouteWithRoles path="/reports/corrective-actions">
            <CorrectiveActionsReport />
          </ProtectedRouteWithRoles>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
