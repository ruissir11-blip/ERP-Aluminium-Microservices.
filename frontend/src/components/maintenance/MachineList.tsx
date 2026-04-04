import React from 'react';
import { Machine } from '../../types/maintenance.types';
import { Activity, AlertTriangle, Edit2, Archive, RotateCcw } from 'lucide-react';

interface MachineListProps {
  machines: Machine[];
  loading?: boolean;
  onEdit: (machine: Machine) => void;
  onArchive: (id: string) => void;
  onReactivate: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

const MachineList: React.FC<MachineListProps> = ({
  machines,
  loading,
  onEdit,
  onArchive,
  onReactivate,
  onStatusChange,
}) => {
  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      MAINTENANCE: 'bg-yellow-100 text-yellow-800',
      BROKEN_DOWN: 'bg-red-100 text-red-800',
      ARCHIVED: 'bg-purple-100 text-purple-800',
    };
    const labels: Record<string, string> = {
      ACTIVE: 'Active',
      INACTIVE: 'Inactive',
      MAINTENANCE: 'En Maintenance',
      BROKEN_DOWN: 'En Panne',
      ARCHIVED: 'Archivée',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${classes[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
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

  if (machines.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Aucune machine trouvée
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Désignation</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marque/Modèle</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Série</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atelier</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Heures</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {machines.map((machine) => (
            <tr key={machine.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  {machine.status === 'BROKEN_DOWN' ? (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  ) : machine.status === 'MAINTENANCE' ? (
                    <Activity className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Activity className="w-5 h-5 text-green-500" />
                  )}
                  <span className="font-medium text-gray-900">{machine.designation}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-gray-500">
                {[machine.brand, machine.model].filter(Boolean).join(' / ') || '-'}
              </td>
              <td className="px-6 py-4 text-gray-500">{machine.serialNumber || '-'}</td>
              <td className="px-6 py-4 text-gray-500">{machine.workshop || '-'}</td>
              <td className="px-6 py-4 text-gray-500">{machine.operationalHours}h</td>
              <td className="px-6 py-4">{getStatusBadge(machine.status)}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(machine)}
                    className="p-2 text-gray-400 hover:text-[#0d9488] transition-colors"
                    title="Modifier"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {machine.status !== 'ARCHIVED' ? (
                    <button
                      onClick={() => onArchive(machine.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Archiver"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onReactivate(machine.id)}
                      className="p-2 text-gray-400 hover:text-green-500 transition-colors"
                      title="Réactiver"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MachineList;
