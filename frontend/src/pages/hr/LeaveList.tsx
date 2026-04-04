import { useState, useEffect } from 'react';
import { leaveApi } from '../../services/hrApi';
import { LeaveRequest } from '../../types/hr.types';
import Layout from '../../components/common/Layout';

export function LeaveList() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('PENDING');

  useEffect(() => {
    loadRequests();
  }, [filter]);

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
        <div></div>
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
                  {new Date(request.startDate).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {new Date(request.endDate).toLocaleDateString('fr-FR')}
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
    </Layout>
  );
}

export default LeaveList;
