import React, { useEffect, useState } from 'react';
import { Wrench, AlertTriangle, Clock, CheckCircle, TrendingUp, Activity } from 'lucide-react';
import Layout from '../../components/common/Layout';
import KPICard from '../../components/dashboard/KPICard';
import maintenanceApi from '../../services/maintenance/maintenanceApi';
import { Machine, WorkOrder, MaintenanceKPIs, PreventiveCorrectiveRatio } from '../../types/maintenance.types';

const MaintenanceDashboard: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [kpis, setKpis] = useState<MaintenanceKPIs[]>([]);
  const [ratio, setRatio] = useState<PreventiveCorrectiveRatio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endDate = now.toISOString().split('T')[0];
      const params = { startDate, endDate };

      const [machinesRes, workOrdersRes, metricsRes, ratioRes] = await Promise.all([
        maintenanceApi.machine.getAll(),
        maintenanceApi.workOrder.getAll(),
        maintenanceApi.metrics.getAllMachineMetrics(params),
        maintenanceApi.metrics.getPreventiveCorrectiveRatio(params),
      ]);

      setMachines(machinesRes.data.data);
      setWorkOrders(workOrdersRes.data.data);
      setKpis(metricsRes.data.data);
      setRatio(ratioRes.data.data);
    } catch (error) {
      console.error('Error fetching maintenance dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const activeMachines = machines.filter(m => m.status === 'ACTIVE').length;
  const brokenDownMachines = machines.filter(m => m.status === 'BROKEN_DOWN').length;
  const pendingWorkOrders = workOrders.filter(wo => ['CREATED', 'ASSIGNED'].includes(wo.status)).length;
  const inProgressWorkOrders = workOrders.filter(wo => wo.status === 'IN_PROGRESS').length;
  const overdueWorkOrders = workOrders.filter(wo => {
    if (!wo.scheduledDate) return false;
    return new Date(wo.scheduledDate) < new Date() && !['COMPLETED', 'CLOSED', 'CANCELLED'].includes(wo.status);
  }).length;

  // Calculate average TRS
  const avgTRS = kpis.length > 0 
    ? kpis.reduce((sum, k) => sum + (k.trs?.trs || 0), 0) / kpis.length 
    : 0;

  // Get recent work orders
  const recentWorkOrders = [...workOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Get machines needing maintenance (next 7 days)
  const upcomingMaintenance = machines.filter(m => m.status === 'MAINTENANCE').slice(0, 5);

  if (loading) {
    return (
      <Layout title="Maintenance">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d9488]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Maintenance" subtitle="Tableau de bord de la maintenance industrielle">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Machines Actives"
          value={activeMachines.toString()}
          icon={Activity}
          color="green"
        />
        <KPICard
          title="En Panne"
          value={brokenDownMachines.toString()}
          icon={AlertTriangle}
          color="red"
        />
        <KPICard
          title="TRS Moyen"
          value={`${avgTRS.toFixed(1)}%`}
          icon={TrendingUp}
          color={avgTRS >= 80 ? 'green' : avgTRS >= 60 ? 'blue' : 'red'}
        />
        <KPICard
          title="Work Orders en Attente"
          value={pendingWorkOrders.toString()}
          icon={Clock}
          color="blue"
        />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="En Cours"
          value={inProgressWorkOrders.toString()}
          icon={Wrench}
          color="blue"
        />
        <KPICard
          title="En Retard"
          value={overdueWorkOrders.toString()}
          icon={AlertTriangle}
          color="red"
        />
        <KPICard
          title="Total Machines"
          value={machines.length.toString()}
          icon={Activity}
          color="blue"
        />
        <KPICard
          title="Préventif/Correctif"
          value={ratio ? ratio.ratio : 'N/A'}
          icon={CheckCircle}
          color="teal"
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* TRS by Machine */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">TRS par Machine</h3>
          <div className="space-y-4">
            {kpis.slice(0, 5).map((kpi) => (
              <div key={kpi.machineId}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{kpi.machineName}</span>
                  <span className={`font-medium ${
                    (kpi.trs?.trs || 0) >= 80 ? 'text-green-600' :
                    (kpi.trs?.trs || 0) >= 60 ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {(kpi.trs?.trs || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      (kpi.trs?.trs || 0) >= 80 ? 'bg-green-500' :
                      (kpi.trs?.trs || 0) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(kpi.trs?.trs || 0, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {kpis.length === 0 && (
              <p className="text-gray-500 text-sm">Aucune donnée disponible</p>
            )}
          </div>
        </div>

        {/* Preventive vs Corrective Ratio */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition des Interventions</h3>
          {ratio && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Préventif</span>
                  <span className="text-gray-500">{ratio.preventive} ({((ratio.preventive / ratio.total) * 100).toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(ratio.preventive / ratio.total) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Correctif</span>
                  <span className="text-gray-500">{ratio.corrective} ({((ratio.corrective / ratio.total) * 100).toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(ratio.corrective / ratio.total) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Amélioration</span>
                  <span className="text-gray-500">{ratio.improvement} ({((ratio.improvement / ratio.total) * 100).toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(ratio.improvement / ratio.total) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Inspection</span>
                  <span className="text-gray-500">{ratio.inspection} ({((ratio.inspection / ratio.total) * 100).toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(ratio.inspection / ratio.total) * 100}%` }}></div>
                </div>
              </div>
            </div>
          )}
          {!ratio && (
            <p className="text-gray-500 text-sm">Aucune donnée disponible</p>
          )}
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Work Orders */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Derniers Work Orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="pb-3">N°</th>
                  <th className="pb-3">Machine</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Statut</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentWorkOrders.map((wo) => (
                  <tr key={wo.id} className="border-t border-gray-100">
                    <td className="py-3 text-gray-900">{wo.workOrderNumber}</td>
                    <td className="py-3 text-gray-500">{wo.machine?.designation}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        wo.type === 'PREVENTIVE' ? 'bg-green-100 text-green-800' :
                        wo.type === 'CORRECTIVE' ? 'bg-red-100 text-red-800' :
                        wo.type === 'IMPROVEMENT' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {wo.type}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        wo.status === 'CREATED' ? 'bg-gray-100 text-gray-800' :
                        wo.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-800' :
                        wo.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                        wo.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        wo.status === 'CLOSED' ? 'bg-teal-100 text-teal-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {wo.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentWorkOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500">Aucun work order</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Machines Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">État des Machines</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="pb-3">Machine</th>
                  <th className="pb-3">Atelier</th>
                  <th className="pb-3">Heures</th>
                  <th className="pb-3">Statut</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {machines.slice(0, 5).map((machine) => (
                  <tr key={machine.id} className="border-t border-gray-100">
                    <td className="py-3 text-gray-900">{machine.designation}</td>
                    <td className="py-3 text-gray-500">{machine.workshop || '-'}</td>
                    <td className="py-3 text-gray-500">{machine.operationalHours}h</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        machine.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        machine.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
                        machine.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-800' :
                        machine.status === 'BROKEN_DOWN' ? 'bg-red-100 text-red-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {machine.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {machines.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500">Aucune machine</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MaintenanceDashboard;
