import { useState, useEffect } from 'react';
import { payslipApi } from '../../services/hrApi';
import { Payslip } from '../../types/hr.types';
import Layout from '../../components/common/Layout';

export function PayslipList() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('DRAFT');
  const [periodMonth, setPeriodMonth] = useState<number>(new Date().getMonth() + 1);
  const [periodYear, setPeriodYear] = useState<number>(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadPayslips();
  }, [filter, periodMonth, periodYear]);

  const loadPayslips = async () => {
    try {
      setLoading(true);
      const data = await payslipApi.list({
        status: filter,
        periodMonth,
        periodYear,
      });
      setPayslips(data.payslips);
    } catch (err) {
      setError('Échec du chargement des bulletins de paie');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (employeeId: string) => {
    try {
      await payslipApi.generate({
        employeeId,
        periodMonth,
        periodYear,
      });
      loadPayslips();
    } catch (err) {
      alert('Échec de la génération');
    }
  };

  const handleGenerateBatch = async () => {
    if (!confirm(`Générer les bulletins de paie pour tous les employés (${periodMonth}/${periodYear})?`)) return;
    try {
      setGenerating(true);
      await payslipApi.generateBatch({
        periodMonth,
        periodYear,
      });
      loadPayslips();
    } catch (err) {
      alert('Échec de la génération batch');
    } finally {
      setGenerating(false);
    }
  };

  const handleValidate = async (id: string) => {
    try {
      await payslipApi.validate(id);
      loadPayslips();
    } catch (err) {
      alert('Échec de la validation');
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await payslipApi.markAsPaid(id);
      loadPayslips();
    } catch (err) {
      alert('Erreur lors du marquage');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-yellow-100 text-yellow-800',
      VALIDATED: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
    };
    const labels: Record<string, string> = {
      DRAFT: 'Brouillon',
      VALIDATED: 'Validé',
      PAID: 'Payé',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getEmployeeName = (employee: any) => {
    if (!employee) return '-';
    return `${employee.firstName} ${employee.lastName}`;
  };

  const getMonthName = (month: number) => {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[month - 1];
  };

  return (
    <Layout title="Gestion de la Paie" subtitle="Bulletins de paie et paiements">
      <div className="flex justify-between items-center mb-6">
        <div></div>
        <button
          onClick={handleGenerateBatch}
          disabled={generating}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {generating ? 'Génération...' : 'Générer tous les bulletins'}
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-4">
        <div className="flex gap-2">
          {['DRAFT', 'VALIDATED', 'PAID'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status === 'DRAFT' && 'Brouillons'}
              {status === 'VALIDATED' && 'Validés'}
              {status === 'PAID' && 'Payés'}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={periodMonth}
            onChange={(e) => setPeriodMonth(Number(e.target.value))}
            className="px-3 py-2 border rounded"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{getMonthName(m)}</option>
            ))}
          </select>
          <select
            value={periodYear}
            onChange={(e) => setPeriodYear(Number(e.target.value))}
            className="px-3 py-2 border rounded"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employé</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salaire Base</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Heures Sup.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bonus</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Déductions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salaire Net</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payslips.map((payslip) => (
              <tr key={payslip.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                  {getEmployeeName(payslip.employee)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {getMonthName(payslip.periodMonth)} {payslip.periodYear}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {formatCurrency(payslip.baseSalary)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {formatCurrency(payslip.overtimePay)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {formatCurrency(payslip.bonuses)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-red-500">
                  {formatCurrency(payslip.deductions)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-bold text-green-600">
                  {formatCurrency(payslip.netSalary)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(payslip.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  {payslip.status === 'DRAFT' && (
                    <button
                      onClick={() => handleValidate(payslip.id)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Valider
                    </button>
                  )}
                  {payslip.status === 'VALIDATED' && (
                    <button
                      onClick={() => handleMarkAsPaid(payslip.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Marquer payé
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {payslips.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          Aucun bulletin de paie trouvé. Générez les bulletins pour la période sélectionnée.
        </div>
      )}
    </Layout>
  );
}

export default PayslipList;
