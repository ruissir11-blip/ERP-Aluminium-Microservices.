import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertTriangle, TrendingUp, TrendingDown, ChevronUp, ChevronDown } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { customerProfitabilityApi } from '../../services/comptabiliteApi';
import type { CustomerProfitability } from '../../types/comptabilite.types';

const CustomerProfitability: React.FC = () => {
  const [profitabilities, setProfitabilities] = useState<CustomerProfitability[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [sortBy, setSortBy] = useState<string>('marginPercent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [minMargin, setMinMargin] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchProfitabilities();
  }, [currentPage, sortBy, sortOrder, minMargin]);

  const fetchProfitabilities = async () => {
    try {
      setLoading(true);
      const response = await customerProfitabilityApi.getAll({
        page: currentPage,
        perPage: 10,
        sortBy,
        sortOrder,
        min_margin: minMargin ? parseFloat(minMargin) : undefined,
      });
      
      const data = response?.data || [];
      setProfitabilities(Array.isArray(data) ? data : []);
      setTotalPages(response?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching customer profitabilities:', error);
      setProfitabilities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      await customerProfitabilityApi.recalculateAll();
      fetchProfitabilities();
    } catch (error) {
      console.error('Error recalculating profitabilities:', error);
    } finally {
      setRecalculating(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0,00 DT' : `${num.toFixed(2)} DT`;
  };

  const formatPercent = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0%' : `${num.toFixed(1)}%`;
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  const getStatusColor = (margin: number | string) => {
    const num = typeof margin === 'string' ? parseFloat(margin) : margin;
    if (num >= 20) return 'text-green-600';
    if (num >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (margin: number | string) => {
    const num = typeof margin === 'string' ? parseFloat(margin) : margin;
    if (num >= 20) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Rentable</span>;
    }
    if (num >= 10) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Attention</span>;
    }
    return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Non rentable</span>;
  };

  return (
    <Layout title="Rentabilité Client" subtitle="Analyse de la rentabilité par client">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rentabilité par Client</h1>
        <button
          onClick={handleRecalculate}
          disabled={recalculating}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={20} className={recalculating ? 'animate-spin' : ''} />
          Recalculer
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Marge minimale (%)
          </label>
          <input
            type="number"
            value={minMargin}
            onChange={(e) => setMinMargin(e.target.value)}
            placeholder="Ex: 10"
            className="px-3 py-2 border border-gray-300 rounded-lg w-32"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total Clients</div>
          <div className="text-2xl font-bold">{profitabilities.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Revenu Total</div>
          <div className="text-2xl font-bold">
            {formatCurrency(profitabilities.reduce((sum, p) => sum + (p.totalRevenue || 0), 0))}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Marge Totale</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(profitabilities.reduce((sum, p) => sum + (p.totalMargin || 0), 0))}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Marge Moyenne</div>
          <div className="text-2xl font-bold">
            {profitabilities.length > 0
              ? formatPercent(
                  profitabilities.reduce((sum, p) => sum + (p.marginPercent || 0), 0) / profitabilities.length
                )
              : '0%'}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <button onClick={() => handleSort('orderCount')} className="flex items-center gap-1">
                  Commandes {getSortIcon('orderCount')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <button onClick={() => handleSort('totalRevenue')} className="flex items-center gap-1">
                  Revenu {getSortIcon('totalRevenue')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <button onClick={() => handleSort('totalMargin')} className="flex items-center gap-1">
                  Marge {getSortIcon('totalMargin')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <button onClick={() => handleSort('marginPercent')} className="flex items-center gap-1">
                  Marge % {getSortIcon('marginPercent')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Chargement...
                </td>
              </tr>
            ) : profitabilities.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Aucune rentabilité client trouvée
                </td>
              </tr>
            ) : (
              profitabilities.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {p.customer?.companyName || p.customerName || p.customerId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{p.orderCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(p.totalRevenue)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusColor(p.marginPercent)}>
                      {formatCurrency(p.totalMargin)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {(p.marginPercent || 0) >= 0 ? (
                        <TrendingUp size={16} className="text-green-600" />
                      ) : (
                        <TrendingDown size={16} className="text-red-600" />
                      )}
                      <span className={getStatusColor(p.marginPercent)}>
                        {formatPercent(p.marginPercent)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(p.marginPercent)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-4">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
        >
          Précédent
        </button>
        <span className="px-4 py-2">
          Page {currentPage} sur {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
        >
          Suivant
        </button>
      </div>
    </Layout>
  );
};

export default CustomerProfitability;
