import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Archive, RotateCcw, FileText, Activity, AlertTriangle } from 'lucide-react';
import Layout from '../../components/common/Layout';
import maintenanceApi from '../../services/maintenance/maintenanceApi';
import { Machine, MachineStatus } from '../../types/maintenance.types';

const Machines: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<MachineStatus | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [formData, setFormData] = useState({
    designation: '',
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    acquisitionValue: 0,
    residualValue: 0,
    workshop: '',
    locationDetails: '',
    installationDate: '',
    notes: '',
  });

  useEffect(() => {
    fetchMachines();
  }, [statusFilter]);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (statusFilter) filters.status = statusFilter;
      const response = await maintenanceApi.machine.getAll(filters);
      setMachines(response.data.data);
    } catch (error) {
      console.error('Error fetching machines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const filtered = machines.filter(m =>
      m.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setMachines(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMachine) {
        await maintenanceApi.machine.update(editingMachine.id, formData);
      } else {
        await maintenanceApi.machine.create(formData);
      }
      setShowModal(false);
      setEditingMachine(null);
      resetForm();
      fetchMachines();
    } catch (error) {
      console.error('Error saving machine:', error);
    }
  };

  const handleEdit = (machine: Machine) => {
    setEditingMachine(machine);
    setFormData({
      designation: machine.designation,
      brand: machine.brand || '',
      model: machine.model || '',
      serialNumber: machine.serialNumber || '',
      purchaseDate: machine.purchaseDate || '',
      acquisitionValue: machine.acquisitionValue || 0,
      residualValue: machine.residualValue || 0,
      workshop: machine.workshop || '',
      locationDetails: machine.locationDetails || '',
      installationDate: machine.installationDate || '',
      notes: machine.notes || '',
    });
    setShowModal(true);
  };

  // eslint-disable-next-line no-restricted-globals
  const handleArchive = async (id: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Êtes-vous sûr de vouloir archiver cette machine?')) return;
    try {
      await maintenanceApi.machine.archive(id);
      fetchMachines();
    } catch (error) {
      console.error('Error archiving machine:', error);
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      await maintenanceApi.machine.reactivate(id);
      fetchMachines();
    } catch (error) {
      console.error('Error reactivating machine:', error);
    }
  };

  const handleStatusChange = async (id: string, status: MachineStatus) => {
    try {
      await maintenanceApi.machine.updateStatus(id, status);
      fetchMachines();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      designation: '',
      brand: '',
      model: '',
      serialNumber: '',
      purchaseDate: '',
      acquisitionValue: 0,
      residualValue: 0,
      workshop: '',
      locationDetails: '',
      installationDate: '',
      notes: '',
    });
  };

  const getStatusBadge = (status: MachineStatus) => {
    const classes = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      MAINTENANCE: 'bg-yellow-100 text-yellow-800',
      BROKEN_DOWN: 'bg-red-100 text-red-800',
      ARCHIVED: 'bg-purple-100 text-purple-800',
    };
    const labels = {
      ACTIVE: 'Active',
      INACTIVE: 'Inactive',
      MAINTENANCE: 'En Maintenance',
      BROKEN_DOWN: 'En Panne',
      ARCHIVED: 'Archivée',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${classes[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const filteredMachines = machines.filter(m =>
    m.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Machines" subtitle="Gestion du parc machine">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
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
            onChange={(e) => setStatusFilter(e.target.value as MachineStatus | '')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="MAINTENANCE">En Maintenance</option>
            <option value="BROKEN_DOWN">En Panne</option>
            <option value="ARCHIVED">Archivée</option>
          </select>
        </form>
        <button
          onClick={() => {
            setEditingMachine(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e]"
        >
          <Plus className="w-4 h-4" />
          Nouvelle Machine
        </button>
      </div>

      {/* Machines Table */}
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
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d9488]"></div>
                  </div>
                </td>
              </tr>
            ) : filteredMachines.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  Aucune machine trouvée
                </td>
              </tr>
            ) : (
              filteredMachines.map((machine) => (
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
                        onClick={() => handleEdit(machine)}
                        className="p-2 text-gray-400 hover:text-[#0d9488] transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {machine.status !== 'ARCHIVED' ? (
                        <button
                          onClick={() => handleArchive(machine.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="Archiver"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(machine.id)}
                          className="p-2 text-gray-400 hover:text-green-500 transition-colors"
                          title="Réactiver"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
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
                {editingMachine ? 'Modifier la Machine' : 'Nouvelle Machine'}
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Désignation *</label>
                    <input
                      type="text"
                      required
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Marque</label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modèle</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">N° Série</label>
                    <input
                      type="text"
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date d'achat</label>
                    <input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date d'installation</label>
                    <input
                      type="date"
                      value={formData.installationDate}
                      onChange={(e) => setFormData({ ...formData, installationDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valeur d'acquisition (DT)</label>
                    <input
                      type="number"
                      value={formData.acquisitionValue}
                      onChange={(e) => setFormData({ ...formData, acquisitionValue: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valeur résiduelle (DT)</label>
                    <input
                      type="number"
                      value={formData.residualValue}
                      onChange={(e) => setFormData({ ...formData, residualValue: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Atelier</label>
                    <input
                      type="text"
                      value={formData.workshop}
                      onChange={(e) => setFormData({ ...formData, workshop: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Localisation</label>
                    <input
                      type="text"
                      value={formData.locationDetails}
                      onChange={(e) => setFormData({ ...formData, locationDetails: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingMachine(null);
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
                  {editingMachine ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Machines;
