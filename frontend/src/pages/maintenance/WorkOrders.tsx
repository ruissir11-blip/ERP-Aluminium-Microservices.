import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Play, CheckCircle, XCircle, Clock, AlertTriangle, FileText } from 'lucide-react';
import Layout from '../../components/common/Layout';
import maintenanceApi from '../../services/maintenance/maintenanceApi';
import { WorkOrder, WorkOrderStatus, WorkOrderType, WorkOrderPriority, Machine, BreakdownSeverity } from '../../types/maintenance.types';

const WorkOrders: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<WorkOrderType | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);
  const [formData, setFormData] = useState({
    machineId: '',
    type: WorkOrderType.CORRECTIVE,
    priority: WorkOrderPriority.ROUTINE,
    title: '',
    description: '',
    scheduledDate: '',
    scheduledStartTime: '',
    scheduledEndTime: '',
  });

  const [breakdownData, setBreakdownData] = useState({
    machineId: '',
    title: '',
    description: '',
    severity: 'MINOR' as BreakdownSeverity,
    symptoms: '',
  });

  useEffect(() => {
    fetchData();
  }, [statusFilter, typeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (statusFilter) filters.status = statusFilter;
      if (typeFilter) filters.type = typeFilter;
      
      const [woRes, machineRes] = await Promise.all([
        maintenanceApi.workOrder.getAll(filters),
        maintenanceApi.machine.getActive(),
      ]);
      
      setWorkOrders(woRes.data.data);
      setMachines(machineRes.data.data);
    } catch (error) {
      console.error('Error fetching work orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWorkOrder) {
        await maintenanceApi.workOrder.update(editingWorkOrder.id, formData);
      } else {
        await maintenanceApi.workOrder.create(formData);
      }
      setShowModal(false);
      setEditingWorkOrder(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving work order:', error);
    }
  };

  const handleBreakdownSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await maintenanceApi.workOrder.reportBreakdown({
        machineId: breakdownData.machineId,
        title: breakdownData.title,
        description: breakdownData.description,
        severity: breakdownData.severity as unknown as BreakdownSeverity,
        symptoms: breakdownData.symptoms,
        priority: breakdownData.severity === 'CRITICAL' ? WorkOrderPriority.CRITICAL :
                 breakdownData.severity === 'MAJOR' ? WorkOrderPriority.MAJOR : WorkOrderPriority.MINOR,
      });
      setShowBreakdownModal(false);
      setBreakdownData({
        machineId: '',
        title: '',
        description: '',
        severity: 'MINOR' as BreakdownSeverity,
        symptoms: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error reporting breakdown:', error);
    }
  };

  const handleEdit = (workOrder: WorkOrder) => {
    setEditingWorkOrder(workOrder);
    setFormData({
      machineId: workOrder.machineId,
      type: workOrder.type,
      priority: workOrder.priority,
      title: workOrder.title,
      description: workOrder.description || '',
      scheduledDate: workOrder.scheduledDate || '',
      scheduledStartTime: workOrder.scheduledStartTime || '',
      scheduledEndTime: workOrder.scheduledEndTime || '',
    });
    setShowModal(true);
  };

  const handleStart = async (id: string) => {
    try {
      await maintenanceApi.workOrder.start(id);
      fetchData();
    } catch (error) {
      console.error('Error starting work order:', error);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await maintenanceApi.workOrder.complete(id, {
        completionNotes: 'Terminé',
      });
      fetchData();
    } catch (error) {
      console.error('Error completing work order:', error);
    }
  };

  const handleClose = async (id: string) => {
    try {
      await maintenanceApi.workOrder.close(id);
      fetchData();
    } catch (error) {
      console.error('Error closing work order:', error);
    }
  };

  // eslint-disable-next-line no-restricted-globals
  const handleCancel = async (id: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Êtes-vous sûr de vouloir annuler ce work order?')) return;
    try {
      await maintenanceApi.workOrder.cancel(id);
      fetchData();
    } catch (error) {
      console.error('Error cancelling work order:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      machineId: '',
      type: WorkOrderType.CORRECTIVE,
      priority: WorkOrderPriority.ROUTINE,
      title: '',
      description: '',
      scheduledDate: '',
      scheduledStartTime: '',
      scheduledEndTime: '',
    });
  };

  const getStatusBadge = (status: WorkOrderStatus) => {
    const classes: Record<WorkOrderStatus, string> = {
      CREATED: 'bg-gray-100 text-gray-800',
      ASSIGNED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-teal-100 text-teal-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    const labels: Record<WorkOrderStatus, string> = {
      CREATED: 'Créé',
      ASSIGNED: 'Assigné',
      IN_PROGRESS: 'En Cours',
      COMPLETED: 'Terminé',
      CLOSED: 'Clôturé',
      CANCELLED: 'Annulé',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${classes[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getTypeBadge = (type: WorkOrderType) => {
    const classes: Record<WorkOrderType, string> = {
      PREVENTIVE: 'bg-green-100 text-green-800',
      CORRECTIVE: 'bg-red-100 text-red-800',
      IMPROVEMENT: 'bg-blue-100 text-blue-800',
      INSPECTION: 'bg-purple-100 text-purple-800',
    };
    const labels: Record<WorkOrderType, string> = {
      PREVENTIVE: 'Préventif',
      CORRECTIVE: 'Correctif',
      IMPROVEMENT: 'Amélioration',
      INSPECTION: 'Inspection',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${classes[type]}`}>
        {labels[type]}
      </span>
    );
  };

  const getPriorityBadge = (priority: WorkOrderPriority) => {
    const classes: Record<WorkOrderPriority, string> = {
      CRITICAL: 'bg-red-100 text-red-800',
      MAJOR: 'bg-orange-100 text-orange-800',
      MINOR: 'bg-yellow-100 text-yellow-800',
      ROUTINE: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<WorkOrderPriority, string> = {
      CRITICAL: 'Critique',
      MAJOR: 'Majeur',
      MINOR: 'Mineur',
      ROUTINE: 'Routine',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${classes[priority]}`}>
        {labels[priority]}
      </span>
    );
  };

  const filteredWorkOrders = workOrders.filter(wo =>
    wo.workOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wo.machine?.designation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Work Orders" subtitle="Gestion des ordres de maintenance">
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as WorkOrderStatus | '')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="CREATED">Créé</option>
            <option value="ASSIGNED">Assigné</option>
            <option value="IN_PROGRESS">En Cours</option>
            <option value="COMPLETED">Terminé</option>
            <option value="CLOSED">Clôturé</option>
            <option value="CANCELLED">Annulé</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as WorkOrderType | '')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
          >
            <option value="">Tous les types</option>
            <option value="PREVENTIVE">Préventif</option>
            <option value="CORRECTIVE">Correctif</option>
            <option value="IMPROVEMENT">Amélioration</option>
            <option value="INSPECTION">Inspection</option>
          </select>
        </form>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBreakdownModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <AlertTriangle className="w-4 h-4" />
            Signaler Panne
          </button>
          <button
            onClick={() => {
              setEditingWorkOrder(null);
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e]"
          >
            <Plus className="w-4 h-4" />
            Nouveau WO
          </button>
        </div>
      </div>

      {/* Work Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° WO</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Machine</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priorité</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Échéance</th>
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
            ) : filteredWorkOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  Aucun work order trouvé
                </td>
              </tr>
            ) : (
              filteredWorkOrders.map((wo) => (
                <tr key={wo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{wo.workOrderNumber}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{wo.title}</td>
                  <td className="px-6 py-4 text-gray-500">{wo.machine?.designation || '-'}</td>
                  <td className="px-6 py-4">{getTypeBadge(wo.type)}</td>
                  <td className="px-6 py-4">{getPriorityBadge(wo.priority)}</td>
                  <td className="px-6 py-4">{getStatusBadge(wo.status)}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {wo.scheduledDate ? new Date(wo.scheduledDate).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {wo.status === 'CREATED' || wo.status === 'ASSIGNED' ? (
                        <button
                          onClick={() => handleStart(wo.id)}
                          className="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
                          title="Démarrer"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      ) : null}
                      {wo.status === 'IN_PROGRESS' ? (
                        <button
                          onClick={() => handleComplete(wo.id)}
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                          title="Terminer"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      ) : null}
                      {wo.status === 'COMPLETED' ? (
                        <button
                          onClick={() => handleClose(wo.id)}
                          className="p-2 text-gray-400 hover:text-teal-600 transition-colors"
                          title="Clôturer"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      ) : null}
                      {['CREATED', 'ASSIGNED', 'IN_PROGRESS'].includes(wo.status) ? (
                        <button
                          onClick={() => handleCancel(wo.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="Annuler"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      ) : null}
                      <button
                        onClick={() => handleEdit(wo)}
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {editingWorkOrder ? 'Modifier le Work Order' : 'Nouveau Work Order'}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as WorkOrderType })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                    >
                      <option value={WorkOrderType.PREVENTIVE}>Préventif</option>
                      <option value={WorkOrderType.CORRECTIVE}>Correctif</option>
                      <option value={WorkOrderType.IMPROVEMENT}>Amélioration</option>
                      <option value={WorkOrderType.INSPECTION}>Inspection</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as WorkOrderPriority })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                    >
                      <option value={WorkOrderPriority.ROUTINE}>Routine</option>
                      <option value={WorkOrderPriority.MINOR}>Mineure</option>
                      <option value={WorkOrderPriority.MAJOR}>Majeure</option>
                      <option value={WorkOrderPriority.CRITICAL}>Critique</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date prévue</label>
                    <input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heure de début</label>
                    <input
                      type="time"
                      value={formData.scheduledStartTime}
                      onChange={(e) => setFormData({ ...formData, scheduledStartTime: e.target.value })}
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
                    setEditingWorkOrder(null);
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
                  {editingWorkOrder ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Breakdown Modal */}
      {showBreakdownModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
              <h3 className="text-lg font-semibold text-red-800">Signaler une Panne</h3>
            </div>
            <form onSubmit={handleBreakdownSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Machine *</label>
                  <select
                    required
                    value={breakdownData.machineId}
                    onChange={(e) => setBreakdownData({ ...breakdownData, machineId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                  >
                    <option value="">Sélectionner une machine</option>
                    {machines.map((m) => (
                      <option key={m.id} value={m.id}>{m.designation}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                  <input
                    type="text"
                    required
                    value={breakdownData.title}
                    onChange={(e) => setBreakdownData({ ...breakdownData, title: e.target.value })}
                    placeholder="Description rapide de la panne"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sévérité *</label>
                  <select
                    required
                    value={breakdownData.severity}
                    onChange={(e) => setBreakdownData({ ...breakdownData, severity: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                  >
                    <option value="MINOR">Mineure</option>
                    <option value="MAJOR">Majeure</option>
                    <option value="CRITICAL">Critique</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Symptômes</label>
                  <textarea
                    value={breakdownData.symptoms}
                    onChange={(e) => setBreakdownData({ ...breakdownData, symptoms: e.target.value })}
                    placeholder="Décrivez les symptômes observés"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={breakdownData.description}
                    onChange={(e) => setBreakdownData({ ...breakdownData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBreakdownModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Signaler la Panne
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default WorkOrders;
