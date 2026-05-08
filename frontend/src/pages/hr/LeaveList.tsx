import { useState, useEffect } from 'react';
import { leaveApi, employeeApi } from '../../services/hrApi';
import { LeaveRequest, CreateLeaveRequestDto, LeaveType, Employee } from '../../types/hr.types';
import Layout from '../../components/common/Layout';

export function LeaveList() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('PENDING');
  const [showModal, setShowModal] = useState(false);
  const [formState, setFormState] = useState<Partial<CreateLeaveRequestDto>>({
    leaveType: LeaveType.ANNUAL,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRequests();
    loadEmployees();
  }, [filter]);

  const loadEmployees = async () => {
    try {
      const data = await employeeApi.list({ limit: 100 });
      setEmployees(data.employees);
    } catch (err) {
      console.error('Failed to load employees', err);
    }
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await leaveApi.list({ status: filter });
      setRequests(data.requests);
    } catch (err) {
      setError('Échec du chargement des demandes de congés');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await leaveApi.approve(id);
      loadRequests();
    } catch (err) {
      alert('Échec de l\'approbation');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Motif de rejet:');
    if (!reason) return;
    try {
      await leaveApi.reject(id, reason);
      loadRequests();
    } catch (err) {
      alert('Échec du rejet');
    }
  };

  const handleSaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.employeeId || !formState.leaveType || !formState.startDate || !formState.endDate) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setSaving(true);
      await leaveApi.create(formState as CreateLeaveRequestDto);
      setShowModal(false);
      setFormState({
        leaveType: LeaveType.ANNUAL,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      });
      loadRequests();
      alert('Demande de congé créée avec succès');
    } catch (err) {
      alert('Échec de la création de la demande');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      APPROVED: 'Approuvé',
      REJECTED: 'Rejeté',
      CANCELLED: 'Annulé',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getEmployeeName = (employee: any) => {
    if (!employee) return '-';
    return `${employee.firstName} ${employee.lastName}`;
  };

  const getLeaveTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ANNUAL: 'Congé annuel',
      SICK: 'Maladie',
      MATERNITY: 'Maternité',
      PATERNITY: 'Paternité',
      UNPAID: 'Sans solde',
      OTHER: 'Autre',
    };
    return labels[type] || type;
  };

  return (
    <Layout title="Demandes de Congés" subtitle="Suivi des congés et absences">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demandes de Congés</h1>
          <p className="text-sm text-gray-500">Suivi hebdomadaire et mensuel des absences</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <span>📅</span> Enregistrer congé
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        {['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status === 'PENDING' && 'En attente'}
            {status === 'APPROVED' && 'Approuvés'}
            {status === 'REJECTED' && 'Rejetés'}
            {status === 'CANCELLED' && 'Annulés'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employé</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Début</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fin</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jours</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                  {getEmployeeName(request.employee)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {getLeaveTypeLabel(request.leaveType)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {new Date(request.startDate).toLocaleDateString('fr-TN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {new Date(request.endDate).toLocaleDateString('fr-TN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {request.totalDays}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(request.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  {request.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Approuver
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Rejeter
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {requests.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          Aucune demande de congés trouvée.
        </div>
      )}
      {/* Create Leave Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">🌴 Nouvelle Demande de Congé</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            
            <form onSubmit={handleSaveRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Employé *</label>
                <select
                  required
                  className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formState.employeeId || ''}
                  onChange={e => setFormState({ ...formState, employeeId: e.target.value })}
                >
                  <option value="">-- Sélectionner l'employé --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Type de Congé *</label>
                <select
                  required
                  className="w-full border rounded-lg p-2.5"
                  value={formState.leaveType}
                  onChange={e => setFormState({ ...formState, leaveType: e.target.value as LeaveType })}
                >
                  <option value="ANNUAL">Congé annuel</option>
                  <option value="SICK">Maladie</option>
                  <option value="MATERNITY">Maternité</option>
                  <option value="PATERNITY">Paternité</option>
                  <option value="UNPAID">Sans solde</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date de début *</label>
                  <input
                    required
                    type="date"
                    className="w-full border rounded-lg p-2.5"
                    value={formState.startDate}
                    onChange={e => setFormState({ ...formState, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date de fin *</label>
                  <input
                    required
                    type="date"
                    className="w-full border rounded-lg p-2.5"
                    value={formState.endDate}
                    onChange={e => setFormState({ ...formState, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Motif / Commentaire</label>
                <textarea
                  className="w-full border rounded-lg p-2.5 h-24"
                  placeholder="Expliquez la raison de la demande..."
                  value={formState.reason || ''}
                  onChange={e => setFormState({ ...formState, reason: e.target.value })}
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 border rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Envoi...' : 'Soumettre la Demande'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default LeaveList;
