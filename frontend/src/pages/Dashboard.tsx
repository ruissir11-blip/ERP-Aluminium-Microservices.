import React, { useEffect, useState } from 'react';
import { DollarSign, Package, Activity, AlertTriangle } from 'lucide-react';
import Layout from '../components/common/Layout';
import KPICard from '../components/dashboard/KPICard';
import { dashboardService } from '../services/api';
import { DashboardKPIs, MonthlyRevenue, StockDistribution, CustomerOrder, StockItem } from '../types';

const Dashboard: React.FC = () => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [stockDistribution, setStockDistribution] = useState<StockDistribution[]>([]);
  const [recentOrders, setRecentOrders] = useState<CustomerOrder[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Create a timeout helper function
      const withTimeout = <T,>(promise: Promise<T>, ms: number, type: string): Promise<{ type: string; data: T | null; error: Error | null }> => {
        return Promise.race([
          promise
            .then(data => ({ type, data, error: null }))
            .catch(err => ({ type, data: null, error: err as Error })),
          new Promise<{ type: string; data: null; error: Error }>(resolve => 
            setTimeout(() => resolve({ type, data: null, error: new Error('Timeout') }), ms)
          )
        ]);
      };

      // Fetch all dashboard data with timeout
      const [kpisResult, revenueResult, stockDistResult, ordersResult, alertsResult] = await Promise.all([
        withTimeout(dashboardService.getKPIs(), 10000, 'kpis'),
        withTimeout(dashboardService.getMonthlyRevenue(), 10000, 'revenue'),
        withTimeout(dashboardService.getStockDistribution(), 10000, 'stockDist'),
        withTimeout(dashboardService.getRecentOrders(5), 10000, 'orders'),
        withTimeout(dashboardService.getStockAlerts(), 10000, 'alerts'),
      ]);

      // Process KPIs
      if (!kpisResult.error && kpisResult.data) {
        setKpis((kpisResult.data as any).data as DashboardKPIs);
      } else {
        console.warn('Failed to fetch KPIs:', kpisResult.error);
      }

      // Process Revenue
      if (!revenueResult.error && revenueResult.data) {
        setMonthlyRevenue((revenueResult.data as any).data as MonthlyRevenue[]);
      } else {
        console.warn('Failed to fetch revenue:', revenueResult.error);
      }

      // Process Stock Distribution
      if (!stockDistResult.error && stockDistResult.data) {
        setStockDistribution((stockDistResult.data as any).data as StockDistribution[]);
      } else {
        console.warn('Failed to fetch stock distribution:', stockDistResult.error);
      }

      // Process Orders
      if (!ordersResult.error && ordersResult.data) {
        setRecentOrders((ordersResult.data as any).data as CustomerOrder[]);
      } else {
        console.warn('Failed to fetch orders:', ordersResult.error);
      }

      // Process Alerts
      if (!alertsResult.error && alertsResult.data) {
        setStockAlerts((alertsResult.data as any).data as StockItem[]);
      } else {
        console.warn('Failed to fetch alerts:', alertsResult.error);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Tableau de Bord">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d9488]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Tableau de Bord" subtitle="Vue d'ensemble de l'activité">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Chiffre d'Affaires"
          value={kpis?.chiffreAffaires != null ? `DT${(kpis.chiffreAffaires / 1000000).toFixed(1)}M` : 'DT0'}
          change={kpis?.chiffreAffairesChange}
          icon={DollarSign}
          color="teal"
        />
        <KPICard
          title="Valeur du Stock"
          value={kpis?.stockValue != null ? `DT${(kpis.stockValue / 1000).toFixed(0)}K` : 'DT0'}
          icon={Package}
          color="blue"
        />
        <KPICard
          title="TRS Machine"
          value={kpis?.trs != null ? `${kpis.trs.toFixed(1)}%` : '0%'}
          icon={Activity}
          color="green"
        />
        <KPICard
          title="Taux Non-Conformité"
          value={kpis?.tauxNonConformite != null ? `${kpis.tauxNonConformite.toFixed(1)}%` : '0%'}
          change={kpis?.tauxNonConformiteChange}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">CA Mensuel</h3>
          <div className="h-64 flex items-end space-x-4">
            {Array.isArray(monthlyRevenue) && monthlyRevenue.map((month, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-[#0d9488] rounded-t"
                  style={{
                    height: `${(month.revenue / (Math.max(...monthlyRevenue.map(m => m.revenue), 1))) * 200}px`,
                    minHeight: '20px',
                  }}
                ></div>
                <span className="text-xs text-gray-500 mt-2">{month.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition Stock par Catégorie</h3>
          <div className="space-y-4">
            {Array.isArray(stockDistribution) && stockDistribution.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{item.category}</span>
                  <span className="text-gray-500">{item.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#1e3a5f] h-2 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Dernières Commandes</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="pb-3">Référence</th>
                  <th className="pb-3">Client</th>
                  <th className="pb-3">Montant</th>
                  <th className="pb-3">Statut</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {Array.isArray(recentOrders) && recentOrders.map((order) => (
                  <tr key={order.id} className="border-t border-gray-100">
                    <td className="py-3 text-gray-900">{order.orderNumber}</td>
                    <td className="py-3 text-gray-500">{order.customer?.companyName}</td>
                    <td className="py-3 text-gray-900">DT{order.total?.toFixed(2) || '0.00'}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'CONFIRMÉE' ? 'bg-green-100 text-green-800' :
                        order.status === 'EN_PRODUCTION' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'TERMINÉE' ? 'bg-teal-100 text-teal-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertes Stock</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="pb-3">Article</th>
                  <th className="pb-3">Stock Actuel</th>
                  <th className="pb-3">Seuil Min</th>
                  <th className="pb-3">Statut</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {Array.isArray(stockAlerts) && stockAlerts.slice(0, 5).map((alert) => (
                  <tr key={alert.id} className="border-t border-gray-100">
                    <td className="py-3 text-gray-900">{alert.profile?.name}</td>
                    <td className="py-3 text-gray-500">{alert.quantity}</td>
                    <td className="py-3 text-gray-500">{alert.minThreshold}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        alert.quantity === 0 ? 'bg-red-100 text-red-800' :
                        alert.quantity < alert.minThreshold ? 'bg-orange-100 text-orange-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {alert.quantity === 0 ? 'Rupture' :
                         alert.quantity < alert.minThreshold ? 'Critique' : 'OK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;