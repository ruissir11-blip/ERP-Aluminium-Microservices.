import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Box, 
  FileText, 
  ShoppingCart, 
  Warehouse, 
  Wrench, 
  CheckCircle, 
  BarChart3, 
  Settings,
  LogOut,
  ChevronDown,
  Activity,
  Calendar,
  ClipboardList,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ClipboardCheck,
  FileSearch,
  CheckSquare,
  Hammer,
  Users,
  X,
  Brain,
  Calculator,
  Receipt,
  UserCheck,
  Building2,
  Clock,
  FileSignature,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../../stores/authStore';
import { UserRole, hasAnyRole, hasRole } from '../../types/rbac';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// Menu Configuration with Role-Based Access
// ============================================================================

type MenuRole = UserRole | 'ALL'; // 'ALL' means accessible by everyone

interface MenuItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  requiredRoles: MenuRole[]; // Roles allowed to see this item
}

interface MenuSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRoles: MenuRole[]; // Roles allowed to see this section
  items: MenuItem[];
}

// Main menu items configuration
const mainMenuItems: MenuItem[] = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', requiredRoles: ['ADMIN'] },
  { path: '/customers', icon: Users, label: 'Clients', requiredRoles: ['ADMIN', 'COMMERCIAL_RESPONSIBLE'] },
  { path: '/profiles', icon: Box, label: 'Articles', requiredRoles: ['ADMIN', 'STOCK_RESPONSIBLE'] },
  { path: '/quotes', icon: FileText, label: 'Devis', requiredRoles: ['ADMIN', 'COMMERCIAL_RESPONSIBLE'] },
  { path: '/orders', icon: ShoppingCart, label: 'Commandes', requiredRoles: ['ADMIN', 'COMMERCIAL_RESPONSIBLE'] },
  { path: '/invoices', icon: Receipt, label: 'Factures', requiredRoles: ['ADMIN', 'COMPTABLE'] },
  { path: '/stock', icon: Warehouse, label: 'Stock', requiredRoles: ['ADMIN', 'STOCK_RESPONSIBLE'] },
  { path: '/bi-dashboards', icon: BarChart3, label: 'BI Dashboards', requiredRoles: ['ADMIN'] },
  { path: '/reports', icon: BarChart3, label: 'Rapports', requiredRoles: ['ADMIN'] },
  { path: '/settings', icon: Settings, label: 'Paramètres', requiredRoles: ['ADMIN'] },
];

// Submenu sections configuration
const menuSections: MenuSection[] = [
  {
    id: 'quality',
    label: 'Qualité',
    icon: CheckCircle,
    requiredRoles: ['ADMIN'],
    items: [
      { path: '/quality', icon: CheckCircle, label: 'Accueil Qualité', requiredRoles: ['ADMIN'] },
      { path: '/quality/dashboard', icon: BarChart3, label: 'Dashboard Qualité', requiredRoles: ['ADMIN'] },
      { path: '/quality/nc', icon: AlertTriangle, label: 'Non-conformités', requiredRoles: ['ADMIN'] },
      { path: '/quality/inspection-points', icon: ClipboardCheck, label: "Points d'Inspection", requiredRoles: ['ADMIN'] },
      { path: '/quality/inspection-records', icon: FileSearch, label: 'Enregistrements', requiredRoles: ['ADMIN'] },
      { path: '/quality/decisions', icon: CheckSquare, label: 'Décisions Qualité', requiredRoles: ['ADMIN'] },
      { path: '/quality/corrective-actions', icon: Hammer, label: 'Actions Correctives', requiredRoles: ['ADMIN'] },
      { path: '/quality/root-cause', icon: FileText, label: 'Analyse des Causes', requiredRoles: ['ADMIN'] },
    ],
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    icon: Wrench,
    requiredRoles: ['ADMIN', 'MAINTENANCE_RESPONSIBLE'],
    items: [
      { path: '/maintenance', icon: Wrench, label: 'Dashboard', requiredRoles: ['ADMIN', 'MAINTENANCE_RESPONSIBLE'] },
      { path: '/maintenance/machines', icon: Activity, label: 'Machines', requiredRoles: ['ADMIN', 'MAINTENANCE_RESPONSIBLE'] },
      { path: '/maintenance/work-orders', icon: ClipboardList, label: 'Ordres de Travail', requiredRoles: ['ADMIN', 'MAINTENANCE_RESPONSIBLE'] },
      { path: '/maintenance/metrics', icon: TrendingUp, label: 'Métriques', requiredRoles: ['ADMIN', 'MAINTENANCE_RESPONSIBLE'] },
    ],
  },
  {
    id: 'ai',
    label: 'System IA',
    icon: Brain,
    requiredRoles: ['ADMIN', 'COMMERCIAL_RESPONSIBLE', 'STOCK_RESPONSIBLE'],
    items: [
      { path: '/ai/forecasting', icon: TrendingUp, label: 'Prévisions', requiredRoles: ['ADMIN', 'COMMERCIAL_RESPONSIBLE'] },
      { path: '/ai/inventory-optimization', icon: Warehouse, label: 'Optimisation Stock', requiredRoles: ['ADMIN', 'STOCK_RESPONSIBLE'] },
      { path: '/ai/production-schedule', icon: Calendar, label: 'Planning Production', requiredRoles: ['ADMIN'] },
      { path: '/ai/stockout', icon: AlertTriangle, label: 'Risques Rupture', requiredRoles: ['ADMIN', 'STOCK_RESPONSIBLE'] },
    ],
  },
    {
      id: 'comptabilite',
      label: 'Comptabilité',
      icon: Calculator,
      requiredRoles: ['ADMIN', 'COMPTABLE'],
      items: [
        { path: '/comptabilite/financial-dashboard', icon: DollarSign, label: 'Dashboard Financier', requiredRoles: ['ADMIN', 'COMPTABLE'] },
        { path: '/comptabilite/product-costs', icon: Calculator, label: 'Coûts Produits', requiredRoles: ['ADMIN', 'COMPTABLE'] },
        { path: '/comptabilite/roi', icon: BarChart3, label: 'Calculateur ROI', requiredRoles: ['ADMIN', 'COMPTABLE'] },
        { path: '/comptabilite/payroll-calculation', icon: DollarSign, label: 'Calcul des Paies', requiredRoles: ['ADMIN', 'COMPTABLE'] },
      ],
    },
  {
    id: 'hr',
    label: 'Ressources Humaines',
    icon: UserCheck,
    requiredRoles: ['ADMIN', 'RH_RESPONSIBLE'],
    items: [
      { path: '/hr', icon: UserCheck, label: 'Dashboard RH', requiredRoles: ['ADMIN', 'RH_RESPONSIBLE'] },
      { path: '/hr/employees', icon: Users, label: 'Employés et Départements', requiredRoles: ['ADMIN', 'RH_RESPONSIBLE'] },
      { path: '/hr/contracts', icon: FileSignature, label: 'Contrats', requiredRoles: ['ADMIN', 'RH_RESPONSIBLE'] },
      { path: '/hr/leave', icon: Calendar, label: 'Congés', requiredRoles: ['ADMIN', 'RH_RESPONSIBLE'] },
      { path: '/hr/attendance', icon: Clock, label: 'Présences', requiredRoles: ['ADMIN', 'RH_RESPONSIBLE'] },
      // Paie is accessible by RH and COMPTABLE
      { path: '/hr/payslips', icon: DollarSign, label: 'Paie', requiredRoles: ['ADMIN', 'RH_RESPONSIBLE', 'COMPTABLE'] },
    ],
  },
];

// Helper to check if menu item should be visible
function isItemVisible(userRole: UserRole | undefined, requiredRoles: MenuRole[]): boolean {
  if (!userRole) return false;
  if (requiredRoles.includes('ALL')) return true;
  return hasAnyRole(userRole, requiredRoles as UserRole[]);
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const userRole = user?.role as UserRole | undefined;
  
  // State for expandable sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    quality: false,
    maintenance: false,
    ai: false,
    comptabilite: false,
    hr: false,
  });

  // Filter menu items based on user role
  const visibleMainItems = useMemo(() => {
    return mainMenuItems.filter(item => isItemVisible(userRole, item.requiredRoles));
  }, [userRole]);

  // Filter sections based on user role
  const visibleSections = useMemo(() => {
    return menuSections.filter(section => isItemVisible(userRole, section.requiredRoles));
  }, [userRole]);

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return (
    <>
      {/* Overlay backdrop when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar - slides in from left */}
      <aside 
        className={`fixed left-0 top-0 h-full w-64 bg-[#1e3a5f] text-white flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header with logo and close button */}
        <div className="p-4 border-b border-blue-800 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">AluTech ERP</h1>
            <p className="text-xs text-blue-300 mt-1">Système de Gestion Intégré</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {visibleMainItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#0d9488] text-white'
                        : 'text-gray-300 hover:bg-blue-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Render visible sections */}
          {visibleSections.map((section) => (
            <div key={section.id} className="mt-4">
              <button
                onClick={() => toggleSection(section.id)}
                className="flex items-center w-full px-6 py-3 text-sm font-medium text-gray-300 hover:bg-blue-800 hover:text-white transition-colors"
              >
                <section.icon className="w-5 h-5 mr-3" />
                {section.label}
                <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${expandedSections[section.id] ? 'rotate-180' : ''}`} />
              </button>
              {expandedSections[section.id] && (
                <ul className="ml-4 mt-1 space-y-1">
                  {section.items
                    .filter(item => isItemVisible(userRole, item.requiredRoles))
                    .map((item) => (
                      <li key={item.path}>
                        <NavLink
                          to={item.path}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `flex items-center px-4 py-2 text-sm font-medium transition-colors ${
                              isActive
                                ? 'bg-[#0d9488] text-white'
                                : 'text-gray-400 hover:bg-blue-800 hover:text-white'
                            }`
                          }
                        >
                          <item.icon className="w-4 h-4 mr-2" />
                          {item.label}
                        </NavLink>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-blue-800">
          <button 
            onClick={() => {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
