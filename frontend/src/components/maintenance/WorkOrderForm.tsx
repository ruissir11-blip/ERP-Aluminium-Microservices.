import React from 'react';
import { WorkOrder, WorkOrderType, WorkOrderPriority } from '../../types/maintenance.types';
import { Machine } from '../../types/maintenance.types';

interface WorkOrderFormProps {
  workOrder?: WorkOrder | null;
  machines: Machine[];
  onSubmit: (data: WorkOrderFormData) => void;
  onCancel: () => void;
}

export interface WorkOrderFormData {
  machineId: string;
  type: WorkOrderType;
  priority: WorkOrderPriority;
  title: string;
  description?: string;
  scheduledDate?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
}

const WorkOrderForm: React.FC<WorkOrderFormProps> = ({ workOrder, machines, onSubmit, onCancel }) => {
  const [formData, setFormData] = React.useState<WorkOrderFormData>({
    machineId: workOrder?.machineId || '',
    type: workOrder?.type || WorkOrderType.CORRECTIVE,
    priority: workOrder?.priority || WorkOrderPriority.ROUTINE,
    title: workOrder?.title || '',
    description: workOrder?.description || '',
    scheduledDate: workOrder?.scheduledDate || '',
    scheduledStartTime: workOrder?.scheduledStartTime || '',
    scheduledEndTime: workOrder?.scheduledEndTime || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">
            {workOrder ? 'Modifier le Work Order' : 'Nouveau Work Order'}
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
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e]"
            >
              {workOrder ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkOrderForm;
