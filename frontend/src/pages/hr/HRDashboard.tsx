import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Calendar, UserMinus, Building2 } from 'lucide-react';
import { employeeApi } from '../../services/hrApi';
import { EmployeeStats } from '../../types/hr.types';
import Layout from '../../components/common/Layout';
import KPICard from '../../components/dashboard/KPICard';

export function HRDashboard() {
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await employeeApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load HR stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusCount = (status: string) => {
    return stats?.byStatus?.find(s => s.status === status)?.count || '0';
  };

  return (
    <Layout title="Ressources Humaines" subtitle="Tableau de bord RH">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d9488]"></div>
        </div>
      ) : stats ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KPICard
              title="Total Employés"
              value={stats.total.toString()}
              icon={Users}
              color="blue"
            />
            <KPICard
              title="Actifs"
              value={getStatusCount('ACTIVE')}
              icon={UserCheck}
              color="green"
            />
            <KPICard
              title="En Congé"
              value={getStatusCount('ON_LEAVE')}
              icon={Calendar}
              color="teal"
            />
            <KPICard
              title="Inactifs"
              value={getStatusCount('INACTIVE')}
              icon={UserMinus}
              color="red"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Department Distribution */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-[#0d9488]" />
                Répartition par Département
              </h2>
              <div className="space-y-4">
                {stats.byDepartment?.map((dept, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">{dept.department || 'Non assigné'}</span>
                      <span className="text-gray-500">{dept.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="bg-[#0d9488] h-2.5 rounded-full"
                        style={{ width: `${(Number(dept.count) / stats.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                {(!stats.byDepartment || stats.byDepartment.length === 0) && (
                  <p className="text-gray-500 text-sm">Aucune donnée disponible</p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Actions Rapides</h2>
              <div className="grid grid-cols-2 gap-4">
                <a href="/hr/employees" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-[#0d9488] hover:text-white transition-colors group">
                  <Users className="w-8 h-8 text-gray-400 group-hover:text-white mb-2" />
                  <span className="font-medium">Gérer les Employés</span>
                </a>
                <a href="/hr/leave" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-[#0d9488] hover:text-white transition-colors group">
                  <Calendar className="w-8 h-8 text-gray-400 group-hover:text-white mb-2" />
                  <span className="font-medium">Demandes Congés</span>
                </a>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-100">
          Aucune donnée disponible
        </div>
      )}
    </Layout>
  );
}

export default HRDashboard;
