import React, { useEffect, useState } from 'react';
import { DollarSign, Package, Clock, TrendingUp, BarChart3, Calendar } from 'lucide-react';
import Layout from '../../components/common/Layout';
import maintenanceApi from '../../services/maintenance/maintenanceApi';
import { Machine, MaintenanceCostReport } from '../../types/maintenance.types';

const MaintenanceCosts: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string>('all');
  const [costData, setCostData] = useState<MaintenanceCostReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchMachines();
  }, []);

  useEffect(() => {
    fetchCostData();
  }, [selectedMachine, period]);

  const fetchMachines = async () => {
    try {
      const response = await maintenanceApi.machine.getAll();
      setMachines(response.data.data);
    } catch (error) {
      console.error('Error fetching machines:', error);
    }
  };

  const fetchCostData = async () => {
    try {
      setLoading(true);
      const params = period;
      
      if (selectedMachine === 'all') {
        // Fetch for all machines
        const allData: MaintenanceCostReport[] = [];
        for (const machine of machines) {
          try {
            const response = await maintenanceApi.metrics.getCostReport(machine.id, params);
            if (response.data.data) {
              allData.push(response.data.data);
            }
          } catch (e) {
            // Skip if no data
          }
        }
        setCostData(allData);
      } else {
        const response = await maintenanceApi.metrics.getCostReport(selectedMachine, params);
        setCostData(response.data.data ? [response.data.data] : []);
      }
    } catch (error) {
      console.error('Error fetching cost data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalLaborCost = costData.reduce((sum, d) => sum + d.totalLaborCost, 0);
  const totalPartsCost = costData.reduce((sum, d) => sum + d.totalPartsCost, 0);
  const totalCost = costData.reduce((sum, d) => sum + d.totalCost, 0);
  const totalLaborHours = costData.reduce((sum, d) => sum + d.laborHours, 0);
  const avgCostPerHour = totalLaborHours > 0 ? totalCost / totalLaborHours : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'TND' }).format(value);
  };

  return (
    <Layout title="Coûts Maintenance" subtitle="Suivi des coûts de maintenance par machine">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Machine</label>
          <select
            value={selectedMachine}
            onChange={(e) => setSelectedMachine(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
          >
            <option value="all">Toutes les machines</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>{m.designation}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
          <input
            type="date"
            value={period.startDate}
            onChange={(e) => setPeriod({ ...period, startDate: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
          <input
            type="date"
            value={period.endDate}
            onChange={(e) => setPeriod({ ...period, endDate: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Coût Total</p>
              <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(totalCost)}</h3>
            </div>
            <div className="p-3 rounded-lg bg-red-50 text-red-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Coût Main d'œuvre</p>
              <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(totalLaborCost)}</h3>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Coût Pièces</p>
              <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(totalPartsCost)}</h3>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Coût/Heure</p>
              <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(avgCostPerHour)}</h3>
            </div>
            <div className="p-3 rounded-lg bg-green-50 text-green-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Labor vs Parts */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition Main d'œuvre / Pièces</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Main d'œuvre ({((totalLaborCost / totalCost) * 100 || 0).toFixed(0)}%)</span>
                <span className="text-gray-500">{formatCurrency(totalLaborCost)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-500 h-4 rounded-full"
                  style={{ width: `${totalCost > 0 ? (totalLaborCost / totalCost) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Pièces ({((totalPartsCost / totalCost) * 100 || 0).toFixed(0)}%)</span>
                <span className="text-gray-500">{formatCurrency(totalPartsCost)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-purple-500 h-4 rounded-full"
                  style={{ width: `${totalCost > 0 ? (totalPartsCost / totalCost) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Total Hours */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Heures de Travail</h3>
          <div className="text-center py-4">
            <div className="text-5xl font-bold text-gray-900">{totalLaborHours.toFixed(1)}h</div>
            <p className="text-gray-500 mt-2">Heures totales de maintenance</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="text-xl font-semibold text-gray-900">
                {totalLaborHours > 0 ? (totalLaborCost / totalLaborHours).toFixed(2) : 0}DT/h
              </div>
              <p className="text-sm text-gray-500">Taux horaire moyen</p>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-gray-900">
                {costData.length}
              </div>
              <p className="text-sm text-gray-500">Machines traitées</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cost by Machine Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Coût par Machine</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d9488]"></div>
          </div>
        ) : costData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Aucune donnée disponible pour la période sélectionnée
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Machine</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Coût Main d'œuvre</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Coût Pièces</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Coût Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Heures</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Coût/Heure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {costData.map((cost) => (
                <tr key={cost.machineId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{cost.machineName}</td>
                  <td className="px-6 py-4 text-right text-gray-500">{formatCurrency(cost.totalLaborCost)}</td>
                  <td className="px-6 py-4 text-right text-gray-500">{formatCurrency(cost.totalPartsCost)}</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">{formatCurrency(cost.totalCost)}</td>
                  <td className="px-6 py-4 text-right text-gray-500">{cost.laborHours.toFixed(1)}h</td>
                  <td className="px-6 py-4 text-right text-gray-500">{formatCurrency(cost.costPerOperatingHour)}/h</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-6 py-4 font-bold text-gray-900">TOTAL</td>
                <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(totalLaborCost)}</td>
                <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(totalPartsCost)}</td>
                <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(totalCost)}</td>
                <td className="px-6 py-4 text-right font-bold text-gray-900">{totalLaborHours.toFixed(1)}h</td>
                <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(avgCostPerHour)}/h</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </Layout>
  );
};

export default MaintenanceCosts;
