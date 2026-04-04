import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import Layout from '../../components/common/Layout';
import maintenanceApi from '../../services/maintenance/maintenanceApi';
import { MaintenancePlan, MaintenanceFrequency, Machine } from '../../types/maintenance.types';

const MaintenancePlans: React.FC = () => {
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MaintenancePlan | null>(null);
  const [formData, setFormData] = useState({
    machineId: '',
    description: '',
    taskType: '',
    frequency: MaintenanceFrequency.MONTHLY,
    frequencyDays: 30,
    estimatedDurationHours: 1,
    nextDueDate: '',
    assignedTechnicianId: '',
  });

  useEffect(() => {
    fetchData();
  }, [activeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (activeFilter !== '') filters.isActive = activeFilter;
      
      const [plansRes, machineRes] = await Promise.all([
        maintenanceApi.maintenancePlan.getAll(filters),
        maintenanceApi.machine.getActive(),
      ]);
      
      setPlans(plansRes.data.data);
      setMachines(machineRes.data.data);
    } catch (error) {
      console.error('Error fetching maintenance plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await maintenanceApi.maintenancePlan.update(editingPlan.id, formData);
      } else {
        await maintenanceApi.maintenancePlan.create(formData);
      }
      setShowModal(false);
      setEditingPlan(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving maintenance plan:', error);
    }
  };

  const handleEdit = (plan: MaintenancePlan) => {
    setEditingPlan(plan);
    setFormData({
      machineId: plan.machineId,
      description: plan.description,
      taskType: plan.taskType,
      frequency: plan.frequency,
      frequencyDays: plan.frequencyDays || 30,
      estimatedDurationHours: plan.estimatedDurationHours || 1,
      nextDueDate: plan.nextDueDate || '',
      assignedTechnicianId: plan.assignedTechnicianId || '',
    });
    setShowModal(true);
  };

  // eslint-disable-next-line no-restricted-globals
  const handleDeactivate = async (id: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Êtes-vous sûr de vouloir désactiver ce plan?')) return;
    try {
      await maintenanceApi.maintenancePlan.deactivate(id);
      fetchData();
    } catch (error) {
      console.error('Error deactivating plan:', error);
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      await maintenanceApi.maintenancePlan.reactivate(id);
      fetchData();
    } catch (error) {
      console.error('Error reactivating plan:', error);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await maintenanceApi.maintenancePlan.complete(id);
      fetchData();
    } catch (error) {
      console.error('Error completing plan:', error);
    }
  };

  const handleGenerateWorkOrders = async () => {
    try {
      const response = await maintenanceApi.maintenancePlan.generateWorkOrders();
      alert(`${response.data.data.length} work orders générés`);
      fetchData();
    } catch (error) {
      console.error('Error generating work orders:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      machineId: '',
      description: '',
      taskType: '',
      frequency: MaintenanceFrequency.MONTHLY,
      frequencyDays: 30,
      estimatedDurationHours: 1,
      nextDueDate: '',
      assignedTechnicianId: '',
    });
  };

  const getFrequencyLabel = (frequency: MaintenanceFrequency) => {
    const labels: Record<MaintenanceFrequency, string> = {
      DAILY: 'Quotidien',
      WEEKLY: 'Hebdomadaire',
      MONTHLY: 'Mensuel',
      QUARTERLY: 'Trimestriel',
      SEMI_ANNUAL: 'Semestriel',
      ANNUAL: 'Annuel',
    };
    return labels[frequency] || frequency;
  };

  const isDue = (nextDueDate?: string) => {
    if (!nextDueDate) return false;
    const dueDate = new Date(nextDueDate);
    const today = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const isOverdue = (nextDueDate?: string) => {
    if (!nextDueDate) return false;
    return new Date(nextDueDate) < new Date();
  };

  const filteredPlans = plans.filter(p =>
    p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.machine?.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.taskType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Plans de Maintenance" subtitle="Gestion des plans de maintenance préventive">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <form onSubmit={(e) => e.preventDefault()} className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
            />
          </div>
          <select
            value={activeFilter === '' ? '' : activeFilter.toString()}
            onChange={(e) => setActiveFilter(e.target.value === '' ? '' : e.target.value === 'true')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
          >
            <option value="">Tous les plans</option>
            <option value="true">Actifs</option>
            <option value="false">Inactifs</option>
          </select>
        </form>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateWorkOrders}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Calendar className="w-4 h-4" />
            Générer WO
          </button>
          <button
            onClick={() => {
              setEditingPlan(null);
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e]"
          >
            <Plus className="w-4 h-4" />
            Nouveau Plan
          </button>
        </div>
      </div>

      {/* Plans Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Machine</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fréquence</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durée (h)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prochaine Échéance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d9488]"></div>
                  </div>
                </td>
              </tr>
            ) : filteredPlans.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  Aucun plan de maintenance trouvé
                </td>
              </tr>
            ) : (
              filteredPlans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{plan.machine?.designation || '-'}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    <div className="max-w-xs truncate">{plan.description}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{plan.taskType}</td>
                  <td className="px-6 py-4 text-gray-500">{getFrequencyLabel(plan.frequency)}</td>
                  <td className="px-6 py-4 text-gray-500">{plan.estimatedDurationHours || '-'}</td>
                  <td className="px-6 py-4">
                    {plan.nextDueDate ? (
                      <span className={`flex items-center gap-1 ${
                        isOverdue(plan.nextDueDate) ? 'text-red-600 font-medium' :
                        isDue(plan.nextDueDate) ? 'text-orange-600 font-medium' :
                        'text-gray-500'
                      }`}>
                        {isOverdue(plan.nextDueDate) && <Clock className="w-4 h-4" />}
                        {new Date(plan.nextDueDate).toLocaleDateString('fr-FR')}
                        {isDue(plan.nextDueDate) && !isOverdue(plan.nextDueDate) && (
                          <span className="text-xs">(bientôt)</span>
                        )}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {plan.isActive ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Actif
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Inactif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {plan.isActive && (
                        <>
                          <button
                            onClick={() => handleComplete(plan.id)}
                            className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                            title="Marquer comme terminé"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeactivate(plan.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Désactiver"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {!plan.isActive && (
                        <button
                          onClick={() => handleReactivate(plan.id)}
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                          title="Réactiver"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(plan)}
                        className="p-2 text-gray-400 hover:text-[#0d9488] transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {editingPlan ? 'Modifier le Plan' : 'Nouveau Plan de Maintenance'}
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Machine *</label>
                    <select
                      required
                      value={formData.machineId}
                      onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                    >
                      <option value="">Sélectionner une machine</option>
                      {machines.map((m) => (
                        <option key={m.id} value={m.id}>{m.designation}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <input
                      type="text"
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Ex: Vidange moteur, Replace Filter"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type de tâche</label>
                    <input
                      type="text"
                      value={formData.taskType}
                      onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                      placeholder="Ex: Lubrification, Inspection"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence *</label>
                    <select
                      required
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value as MaintenanceFrequency })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                    >
                      <option value={MaintenanceFrequency.DAILY}>Quotidien</option>
                      <option value={MaintenanceFrequency.WEEKLY}>Hebdomadaire</option>
                      <option value={MaintenanceFrequency.MONTHLY}>Mensuel</option>
                      <option value={MaintenanceFrequency.QUARTERLY}>Trimestriel</option>
                      <option value={MaintenanceFrequency.SEMI_ANNUAL}>Semestriel</option>
                      <option value={MaintenanceFrequency.ANNUAL}>Annuel</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Intervalle (jours)</label>
                    <input
                      type="number"
                      value={formData.frequencyDays}
                      onChange={(e) => setFormData({ ...formData, frequencyDays: parseInt(e.target.value) || 30 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Durée estimée (heures)</label>
                    <input
                      type="number"
                      value={formData.estimatedDurationHours}
                      onChange={(e) => setFormData({ ...formData, estimatedDurationHours: parseFloat(e.target.value) || 1 })}
                      step="0.5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prochaine échéance</label>
                    <input
                      type="date"
                      value={formData.nextDueDate}
                      onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPlan(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e]"
                >
                  {editingPlan ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MaintenancePlans;
