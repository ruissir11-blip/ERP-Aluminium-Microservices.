import { useState, useEffect } from 'react';
import { contractApi, employeeApi } from '../../services/hrApi';
import { EmployeeContract, ContractStatus, CreateContractDto, ContractType, Employee } from '../../types/hr.types';
import Layout from '../../components/common/Layout';

export function ContractList() {
  const [contracts, setContracts] = useState<EmployeeContract[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ACTIVE');
  const [showModal, setShowModal] = useState(false);
  const [formState, setFormState] = useState<Partial<CreateContractDto>>({
    contractType: ContractType.CDI,
    startDate: new Date().toISOString().split('T')[0],
    weeklyHours: 40,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContracts();
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

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.employeeId || !formState.contractType || !formState.startDate || !formState.baseSalary) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setSaving(true);
      await contractApi.create(formState as CreateContractDto);
      setShowModal(false);
      setFormState({
        contractType: ContractType.CDI,
        startDate: new Date().toISOString().split('T')[0],
        weeklyHours: 40,
      });
      loadContracts();
      alert('Contrat créé avec succès');
    } catch (err) {
      alert('Échec de la création du contrat');
      console.error(err);
    } finally {
      setSaving(false);
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
    return new Date(date).toLocaleDateString('fr-TN');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(amount);
  };

  const getEmployeeName = (employee: any) => {
    if (!employee) return '-';
    return `${employee.firstName} ${employee.lastName}`;
  };

  return (
    <Layout title="Gestion des Contrats" subtitle="Contrats des employés">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Contrats</h1>
          <p className="text-sm text-gray-500">Gérez les contrats de travail de vos employés</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <span>➕</span> Nouveau Contrat
        </button>
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
      {/* Create Contract Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">📖 Nouveau Contrat de Travail</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            
            <form onSubmit={handleSaveContract} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Employé *</label>
                  <select
                    required
                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formState.employeeId || ''}
                    onChange={e => setFormState({ ...formState, employeeId: e.target.value })}
                  >
                    <option value="">-- Sélectionner l'employé --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeNumber})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Type de Contrat *</label>
                  <select
                    required
                    className="w-full border rounded-lg p-2.5"
                    value={formState.contractType}
                    onChange={e => setFormState({ ...formState, contractType: e.target.value as ContractType })}
                  >
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="STAGE">Stage</option>
                    <option value="APPRENTICE">Apprentissage</option>
                    <option value="INTERIM">Intérim</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Salaire de Base *</label>
                  <div className="relative">
                    <input
                      required
                      type="number"
                      placeholder="0.00"
                      className="w-full border rounded-lg p-2.5 pl-8"
                      value={formState.baseSalary || ''}
                      onChange={e => setFormState({ ...formState, baseSalary: Number(e.target.value) })}
                    />
                    <span className="absolute left-3 top-2.5 text-gray-400">DT</span>
                  </div>
                </div>

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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date de fin (pour CDD/Stage)</label>
                  <input
                    type="date"
                    className="w-full border rounded-lg p-2.5"
                    value={formState.endDate || ''}
                    onChange={e => setFormState({ ...formState, endDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Heures Hebdomadaires</label>
                  <input
                    type="number"
                    className="w-full border rounded-lg p-2.5"
                    value={formState.weeklyHours}
                    onChange={e => setFormState({ ...formState, weeklyHours: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Planning / Horaire</label>
                  <input
                    type="text"
                    placeholder="ex: 09:00 - 17:00"
                    className="w-full border rounded-lg p-2.5"
                    value={formState.workSchedule || ''}
                    onChange={e => setFormState({ ...formState, workSchedule: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Clauses Particulières</label>
                <textarea
                  className="w-full border rounded-lg p-2.5 h-24"
                  placeholder="Notes ou clauses additionnelles..."
                  value={formState.terms || ''}
                  onChange={e => setFormState({ ...formState, terms: e.target.value })}
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
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Création...' : 'Créer le Contrat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default ContractList;
