import { useState, useEffect } from 'react';
import { contractApi } from '../../services/hrApi';
import { EmployeeContract, ContractStatus } from '../../types/hr.types';
import Layout from '../../components/common/Layout';

export function ContractList() {
  const [contracts, setContracts] = useState<EmployeeContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ACTIVE');

  useEffect(() => {
    loadContracts();
  }, [filter]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const data = await contractApi.list({ status: filter });
      setContracts(data.contracts);
    } catch (err) {
      setError('Échec du chargement des contrats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async (id: string) => {
    const newEndDate = prompt('Nouvelle date de fin (YYYY-MM-DD):');
    if (!newEndDate) return;
    try {
      await contractApi.renew(id, { newEndDate });
      loadContracts();
    } catch (err) {
      alert('Échec du renouvellement');
    }
  };

  const handleTerminate = async (id: string) => {
    const confirm = window.confirm('Êtes-vous sûr de vouloir terminer ce contrat?');
    if (!confirm) return;
    try {
      await contractApi.terminate(id, { terminationDate: new Date().toISOString().split('T')[0] });
      loadContracts();
    } catch (err) {
      alert('Échec de la terminaison');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      EXPIRED: 'bg-yellow-100 text-yellow-800',
      TERMINATED: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      ACTIVE: 'Actif',
      EXPIRED: 'Expiré',
      TERMINATED: 'Terminé',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getContractTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      CDI: 'CDI',
      CDD: 'CDD',
      STAGE: 'Stage',
      APPRENTICE: 'Apprenti',
      INTERIM: 'Intérimaire',
    };
    return labels[type] || type;
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getEmployeeName = (employee: any) => {
    if (!employee) return '-';
    return `${employee.firstName} ${employee.lastName}`;
  };

  return (
    <Layout title="Gestion des Contrats" subtitle="Contrats des employés">
      <div className="flex justify-between items-center mb-6">
        <div></div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        {['ACTIVE', 'EXPIRED', 'TERMINATED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status === 'ACTIVE' && 'Actifs'}
            {status === 'EXPIRED' && 'Expirés'}
            {status === 'TERMINATED' && 'Terminés'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employé</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salaire Base</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Début</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fin</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Heures/Sem</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contracts.map((contract) => (
              <tr key={contract.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                  {getEmployeeName(contract.employee)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {getContractTypeLabel(contract.contractType)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {formatCurrency(contract.baseSalary)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {formatDate(contract.startDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {formatDate(contract.endDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {contract.weeklyHours}h
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(contract.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  {contract.status === 'ACTIVE' && (
                    <>
                      <button
                        onClick={() => handleRenew(contract.id)}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Renouveler
                      </button>
                      <button
                        onClick={() => handleTerminate(contract.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Terminer
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {contracts.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          Aucun contrat trouvé.
        </div>
      )}
    </Layout>
  );
}

export default ContractList;
