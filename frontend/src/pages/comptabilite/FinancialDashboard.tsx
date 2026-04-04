import React, { useEffect, useState } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Percent, Clock } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { kpiApi } from '../../services/comptabiliteApi';
import { DashboardKPI } from '../../types/comptabilite.types';

const FinancialDashboard: React.FC = () => {
  const [kpis, setKpis] = useState<DashboardKPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      const response = await kpiApi.getDashboard();
      setKpis(response);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      // Set default values on error
      setKpis({
        revenueMtd: '0',
        revenueYtd: '0',
        marginMtd: '0',
        marginYtd: '0',
        currentDso: '0',
        outstandingReceivables: '0',
        dsoTrend: 'stable',
        topCustomers: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await kpiApi.recalculate();
      await fetchKPIs();
    } catch (error) {
      console.error('Error refreshing KPIs:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0 DT' : `${num.toLocaleString('fr-FR')} DT`;
  };

  const formatDSO = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0 jours' : `${num.toFixed(0)} jours`;
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingDown size={20} className="text-green-600" />;
    if (trend === 'declining') return <TrendingUp size={20} className="text-red-600" />;
    return null;
  };

  const getDSOColor = (dso: number) => {
    if (dso <= 30) return 'text-green-600';
    if (dso <= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Layout title="Dashboard Financier" subtitle="Vue d'ensemble financière">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Chargement des KPIs...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard Financier" subtitle="Vue d'ensemble financière">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord Financier</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Revenue MTD */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <DollarSign size={20} />
            <span>Revenus (Mois)</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(kpis?.revenueMtd || 0)}
          </div>
        </div>

        {/* Revenue YTD */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <DollarSign size={20} />
            <span>Revenus (Année)</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(kpis?.revenueYtd || 0)}
          </div>
        </div>

        {/* Margin */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Percent size={20} />
            <span>Marge Brute</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {kpis?.marginMtd ? `${parseFloat(kpis.marginMtd).toFixed(1)}%` : '0%'}
          </div>
        </div>

        {/* DSO */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Clock size={20} />
            <span>DSO (Jours)</span>
          </div>
          <div className={`text-2xl font-bold ${getDSOColor(parseFloat(String(kpis?.currentDso || '0')))}`}>
            {formatDSO(kpis?.currentDso || 0)}
            <span className="ml-2">{getTrendIcon(kpis?.dsoTrend || 'stable')}</span>
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Outstanding Receivables */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Créances en Circulation</h3>
          <div className="text-3xl font-bold text-gray-900 mb-4">
            {formatCurrency(kpis?.outstandingReceivables || 0)}
          </div>
          <div className="text-sm text-gray-500">
            Total des factures impayées
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top Clients</h3>
          {kpis?.topCustomers && kpis.topCustomers.length > 0 ? (
            <div className="space-y-3">
              {kpis.topCustomers.slice(0, 5).map((customer, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="font-medium">{customer.name}</span>
                  <span className="text-green-600">{formatCurrency(customer.revenue)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-4">Aucune donnée disponible</div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default FinancialDashboard;
