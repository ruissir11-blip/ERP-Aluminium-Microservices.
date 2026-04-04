import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Clock, AlertTriangle, BarChart3, Activity } from 'lucide-react';
import Layout from '../../components/common/Layout';
import maintenanceApi from '../../services/maintenance/maintenanceApi';
import { Machine, MTBFMetrics, MTTRMetrics, TRSMetrics } from '../../types/maintenance.types';

const MaintenanceMetrics: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string>('');
  const [mtbfData, setMtbfData] = useState<MTBFMetrics | null>(null);
  const [mttrData, setMttrData] = useState<MTTRMetrics | null>(null);
  const [trsData, setTrsData] = useState<TRSMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchMachines();
  }, []);

  useEffect(() => {
    if (selectedMachine) {
      fetchMetrics();
    }
  }, [selectedMachine, period]);

  const fetchMachines = async () => {
    try {
      const response = await maintenanceApi.machine.getActive();
      setMachines(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedMachine(response.data.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching machines:', error);
    }
  };

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const params = period;
      
      const [mtbfRes, mttrRes, trsRes] = await Promise.all([
        selectedMachine ? maintenanceApi.metrics.getMTBF(selectedMachine, params) : Promise.resolve({ data: { data: null } }),
        selectedMachine ? maintenanceApi.metrics.getMTTR(selectedMachine, params) : Promise.resolve({ data: { data: null } }),
        selectedMachine ? maintenanceApi.metrics.getTRS(selectedMachine, params) : Promise.resolve({ data: { data: null } }),
      ]);

      setMtbfData(mtbfRes.data.data);
      setMttrData(mttrRes.data.data);
      setTrsData(trsRes.data.data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedMachineData = machines.find(m => m.id === selectedMachine);

  // Calculate derived metrics
  const availability = trsData?.availability || 0;
  const performance = trsData?.performance || 0;
  const quality = trsData?.quality || 0;
  const trs = trsData?.trs || 0;

  return (
    <Layout title="Métriques Maintenance" subtitle="TRS, MTBF, MTTR - Analyse des performances">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Machine</label>
          <select
            value={selectedMachine}
            onChange={(e) => setSelectedMachine(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
          >
            <option value="">Sélectionner une machine</option>
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

      {!selectedMachine ? (
        <div className="text-center py-12 text-gray-500">
          Sélectionnez une machine pour voir ses métriques
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d9488]"></div>
        </div>
      ) : (
        <>
          {/* TRS Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              TRS - Taux de Rendement Synthétique
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">TRS Global</span>
                  <TrendingUp className={`w-5 h-5 ${trs >= 80 ? 'text-green-500' : trs >= 60 ? 'text-yellow-500' : 'text-red-500'}`} />
                </div>
                <div className="text-3xl font-bold" style={{ color: trs >= 80 ? '#22c55e' : trs >= 60 ? '#eab308' : '#ef4444' }}>
                  {trs.toFixed(1)}%
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${trs >= 80 ? 'bg-green-500' : trs >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(trs, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Disponibilité</span>
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{availability.toFixed(1)}%</div>
                <p className="text-xs text-gray-500 mt-1">Temps de fonctionnement / Temps prévu</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Performance</span>
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{performance.toFixed(1)}%</div>
                <p className="text-xs text-gray-500 mt-1">(Cycle idéal × Pièces) / Temps</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Qualité</span>
                  <TrendingDown className="w-5 h-5 text-teal-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{quality.toFixed(1)}%</div>
                <p className="text-xs text-gray-500 mt-1">Pièces bonnes / Pièces totales</p>
              </div>
            </div>
          </div>

          {/* MTBF/MTTR Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* MTBF */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                MTBF - Mean Time Between Failures
              </h4>
              {mtbfData ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600">
                      {mtbfData.mtbf.toFixed(1)}h
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Temps moyen entre les pannes
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-sm text-gray-500">Temps de fonctionnement total</p>
                      <p className="font-semibold">{mtbfData.totalOperatingTime.toFixed(0)}h</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Nombre de pannes</p>
                      <p className="font-semibold">{mtbfData.numberOfBreakdowns}</p>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${mtbfData.mtbf > 168 ? 'bg-green-50 text-green-700' : mtbfData.mtbf > 72 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                    <div className="flex items-center gap-2">
                      {mtbfData.mtbf > 168 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : mtbfData.mtbf > 72 ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">
                        {mtbfData.mtbf > 168 ? 'Excellente fiabilité (>1 semaine)' :
                         mtbfData.mtbf > 72 ? 'Fiabilité correcte (>3 jours)' :
                         'Fiabilité à améliorer (<3 jours)'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Aucune donnée disponible</p>
              )}
            </div>

            {/* MTTR */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                MTTR - Mean Time To Repair
              </h4>
              {mttrData ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-orange-600">
                      {mttrData.mttr.toFixed(1)}h
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Temps moyen de réparation
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-sm text-gray-500">Temps de réparation total</p>
                      <p className="font-semibold">{mttrData.totalRepairTime.toFixed(0)}h</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Nombre de réparations</p>
                      <p className="font-semibold">{mttrData.numberOfRepairs}</p>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${mttrData.mttr < 2 ? 'bg-green-50 text-green-700' : mttrData.mttr < 4 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                    <div className="flex items-center gap-2">
                      {mttrData.mttr < 2 ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : mttrData.mttr < 4 ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">
                        {mttrData.mttr < 2 ? 'Excellente réparation (<2h)' :
                         mttrData.mttr < 4 ? 'Réparation correcte (<4h)' :
                         'Réparation à optimiser (>4h)'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Aucune donnée disponible</p>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Analyse Résumé</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">TRS</h5>
                <p className="text-sm text-gray-600">
                  Le TRS de {trs.toFixed(1)}% {' '}
                  {trs >= 80 ? 'indique une excellente performance globale.' :
                   trs >= 60 ? 'indique une performance acceptable.' :
                   'nécessite des améliorations.'}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">MTBF</h5>
                <p className="text-sm text-gray-600">
                  La machine tombe en panne en moyenne toutes les {' '}
                  {(mtbfData?.mtbf || 0 / 24).toFixed(1)} jours.
                  {mtbfData && mtbfData.mtbf < 72 && ' Fréquence élevée - action préventive recommandée.'}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">MTTR</h5>
                <p className="text-sm text-gray-600">
                  Le temps moyen de réparation est de {(mttrData?.mttr || 0).toFixed(1)}h.
                  {mttrData && mttrData.mttr > 4 && ' Temps élevé - améliorez les procédures.'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default MaintenanceMetrics;
