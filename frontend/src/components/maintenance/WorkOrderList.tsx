import React from 'react';
import { WorkOrder } from '../../types/maintenance.types';
import { Edit2, Play, CheckCircle, XCircle, FileText } from 'lucide-react';

interface WorkOrderListProps {
  workOrders: WorkOrder[];
  loading?: boolean;
  onEdit: (workOrder: WorkOrder) => void;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onClose: (id: string) => void;
  onCancel: (id: string) => void;
}

const WorkOrderList: React.FC<WorkOrderListProps> = ({
  workOrders,
  loading,
  onEdit,
  onStart,
  onComplete,
  onClose,
  onCancel,
}) => {
  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      CREATED: 'bg-gray-100 text-gray-800',
      ASSIGNED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-teal-100 text-teal-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      CREATED: 'Créé',
      ASSIGNED: 'Assigné',
      IN_PROGRESS: 'En Cours',
      COMPLETED: 'Terminé',
      CLOSED: 'Clôturé',
      CANCELLED: 'Annulé',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${classes[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const classes: Record<string, string> = {
      PREVENTIVE: 'bg-green-100 text-green-800',
      CORRECTIVE: 'bg-red-100 text-red-800',
      IMPROVEMENT: 'bg-blue-100 text-blue-800',
      INSPECTION: 'bg-purple-100 text-purple-800',
    };
    const labels: Record<string, string> = {
      PREVENTIVE: 'Préventif',
      CORRECTIVE: 'Correctif',
      IMPROVEMENT: 'Amélioration',
      INSPECTION: 'Inspection',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${classes[type] || 'bg-gray-100'}`}>
        {labels[type] || type}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const classes: Record<string, string> = {
      CRITICAL: 'bg-red-100 text-red-800',
      MAJOR: 'bg-orange-100 text-orange-800',
      MINOR: 'bg-yellow-100 text-yellow-800',
      ROUTINE: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<string, string> = {
      CRITICAL: 'Critique',
      MAJOR: 'Majeur',
      MINOR: 'Mineur',
      ROUTINE: 'Routine',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${classes[priority] || 'bg-gray-100'}`}>
        {labels[priority] || priority}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d9488]"></div>
      </div>
    );
  }

  if (workOrders.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Aucun work order trouvé
      </div>
    );
  }

  return (
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
          {workOrders.map((wo) => (
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
                      onClick={() => onStart(wo.id)}
                      className="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
                      title="Démarrer"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  ) : null}
                  {wo.status === 'IN_PROGRESS' ? (
                    <button
                      onClick={() => onComplete(wo.id)}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      title="Terminer"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  ) : null}
                  {wo.status === 'COMPLETED' ? (
                    <button
                      onClick={() => onClose(wo.id)}
                      className="p-2 text-gray-400 hover:text-teal-600 transition-colors"
                      title="Clôturer"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  ) : null}
                  {['CREATED', 'ASSIGNED', 'IN_PROGRESS'].includes(wo.status) ? (
                    <button
                      onClick={() => onCancel(wo.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Annuler"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  ) : null}
                  <button
                    onClick={() => onEdit(wo)}
                    className="p-2 text-gray-400 hover:text-[#0d9488] transition-colors"
                    title="Modifier"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WorkOrderList;
