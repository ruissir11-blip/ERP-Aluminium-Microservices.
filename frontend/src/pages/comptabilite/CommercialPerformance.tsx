import React, { useEffect, useState } from 'react';
import { RefreshCw, Trophy, TrendingUp, Users } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { commercialPerformanceApi } from '../../services/comptabiliteApi';
import { CommercialLeaderboard } from '../../types/comptabilite.types';

const CommercialPerformance: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<CommercialLeaderboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [period, setPeriod] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await commercialPerformanceApi.getLeaderboard({ period });
      setLeaderboard(response || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      await commercialPerformanceApi.getAll({ period });
      fetchLeaderboard();
    } catch (error) {
      console.error('Error recalculating performances:', error);
    } finally {
      setRecalculating(false);
    }
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0 DT' : `${num.toFixed(2)} DT`;
  };

  const formatPercent = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0%' : `${num.toFixed(1)}%`;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <Layout title="Performance Commerciale" subtitle="Suivi des performances commerciales">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Performance Commerciale</h1>
        <div className="flex gap-2">
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={20} className={recalculating ? 'animate-spin' : ''} />
            Recalculer
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Trophy size={20} />
            <span>Total Commerciaux</span>
          </div>
          <div className="text-2xl font-bold">{leaderboard.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <TrendingUp size={20} />
            <span>Revenu Total</span>
          </div>
          <div className="text-2xl font-bold">
            {formatCurrency(leaderboard.reduce((sum, l) => sum + (parseFloat(String(l.totalRevenue)) || 0), 0))}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users size={20} />
            <span>Conversion Moyenne</span>
          </div>
          <div className="text-2xl font-bold">
            {leaderboard.length > 0
              ? formatPercent(
                  leaderboard.reduce((sum, l) => sum + (parseFloat(String(l.conversionRate)) || 0), 0) /
                    leaderboard.length
                )
              : '0%'}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Trophy size={20} />
            <span>Objectif Moyen</span>
          </div>
          <div className="text-2xl font-bold">
            {leaderboard.length > 0
              ? formatPercent(
                  leaderboard.reduce((sum, l) => sum + (parseFloat(String(l.achievementPercent)) || 0), 0) /
                    leaderboard.length
                )
              : '0%'}
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rang</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commercial</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenu</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marge</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversion</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Objectif</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Chargement...
                </td>
              </tr>
            ) : leaderboard.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Aucune performance trouvée
                </td>
              </tr>
            ) : (
              leaderboard.map((entry) => (
                <tr key={entry.commercialId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg">{getRankBadge(entry.rank)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {entry.commercialName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-green-600">
                    {formatCurrency(entry.totalRevenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatPercent(entry.marginPercent)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {formatPercent(entry.conversionRate)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(parseFloat(String(entry.achievementPercent)) || 0, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm">{formatPercent(entry.achievementPercent)}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default CommercialPerformance;
