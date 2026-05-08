import { useState, useEffect } from 'react';
import { attendanceApi, employeeApi } from '../../services/hrApi';
import { Attendance, AttendanceStatus, Employee } from '../../types/hr.types';
import Layout from '../../components/common/Layout';

export function AttendanceList() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState<Partial<Attendance>>({
    status: AttendanceStatus.PRESENT,
    attendanceDate: new Date().toISOString().split('T')[0] as any,
  });
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadAttendances();
    loadEmployees();
  }, [filter, startDate, endDate]);

  const loadEmployees = async () => {
    try {
      const data = await employeeApi.list({ limit: 100 });
      setEmployees(data.employees);
    } catch (err) {
      console.error('Failed to load employees', err);
    }
  };

  const loadAttendances = async () => {
    try {
      setLoading(true);
      const data = await attendanceApi.list({
        status: filter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setAttendances(data.attendances);
    } catch (err) {
      setError('Échec du chargement des présences');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedEmployeeId) {
      alert('Veuillez sélectionner un employé');
      return;
    }
    try {
      setProcessing(true);
      await attendanceApi.checkIn(selectedEmployeeId);
      loadAttendances();
      alert('Pointage entrée réussi');
    } catch (err: any) {
      if (err.response?.status === 400) {
        alert('Action impossible : l\'employé est déjà pointé pour aujourd\'hui.');
      } else {
        alert('Échec du pointage entrée');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedEmployeeId) {
      alert('Veuillez sélectionner un employé');
      return;
    }
    try {
      setProcessing(true);
      await attendanceApi.checkOut(selectedEmployeeId);
      loadAttendances();
      alert('Pointage sortie réussi');
    } catch (err: any) {
      if (err.response?.status === 404) {
        alert('Action impossible : aucun pointage d\'entrée trouvé pour aujourd\'hui.');
      } else {
        alert('Échec du pointage sortie');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.employeeId || !manualForm.attendanceDate || !manualForm.status) {
      alert('Veuillez remplir les champs obligatoires');
      return;
    }
    try {
      setSaving(true);
      await attendanceApi.create(manualForm as Partial<Attendance>);
      setShowManualModal(false);
      setManualForm({
        status: AttendanceStatus.PRESENT,
        attendanceDate: new Date().toISOString().split('T')[0] as any,
      });
      loadAttendances();
      alert('Enregistrement réussi');
    } catch (err) {
      alert('Échec de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PRESENT: 'bg-green-100 text-green-800',
      ABSENT: 'bg-red-100 text-red-800',
      LATE: 'bg-yellow-100 text-yellow-800',
      ON_LEAVE: 'bg-blue-100 text-blue-800',
    };
    const labels: Record<string, string> = {
      PRESENT: 'Présent',
      ABSENT: 'Absent',
      LATE: 'Retard',
      ON_LEAVE: 'En congé',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatTime = (time?: string) => {
    if (!time) return '-';
    return new Date(time).toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatHours = (hours?: number) => {
    if (!hours) return '0h';
    return `${Math.floor(hours)}h${Math.round((hours % 1) * 60)}m`;
  };

  const getEmployeeName = (employee: any) => {
    if (!employee) return '-';
    return `${employee.firstName} ${employee.lastName}`;
  };

  return (
    <Layout title="Suivi des Présences" subtitle="Pointage et temps de travail">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          <label className="text-sm font-semibold text-gray-700">Pointer pour :</label>
          <select
            className="border rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
          >
            <option value="">-- Sélectionner l'employé --</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => setShowManualModal(true)}
            className="flex-1 md:flex-none border border-indigo-600 text-indigo-600 px-4 py-2.5 rounded-lg hover:bg-indigo-50 font-medium transition-colors"
          >
            📝 Déclarer Absence/Retard
          </button>
          <button
            onClick={handleCheckIn}
            disabled={processing}
            className="flex-1 md:flex-none bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            📥 {processing ? '...' : 'Pointer Entrée'}
          </button>
          <button
            onClick={handleCheckOut}
            disabled={processing}
            className="flex-1 md:flex-none bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            📤 {processing ? '...' : 'Pointer Sortie'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('')}
            className={`px-4 py-2 rounded ${
              filter === ''
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Tous
          </button>
          {['PRESENT', 'ABSENT', 'LATE', 'ON_LEAVE'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status === 'PRESENT' && 'Présents'}
              {status === 'ABSENT' && 'Absents'}
              {status === 'LATE' && 'Retards'}
              {status === 'ON_LEAVE' && 'En congé'}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border rounded"
          />
          <span className="text-gray-500">à</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border rounded"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employé</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entrée</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sortie</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Heures</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sup.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attendances.map((attendance) => (
              <tr key={attendance.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                  {getEmployeeName(attendance.employee)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {new Date(attendance.attendanceDate).toLocaleDateString('fr-TN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {formatTime(attendance.checkIn)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {formatTime(attendance.checkOut)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {formatHours(attendance.workHours)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {formatHours(attendance.overtimeHours)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(attendance.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {attendances.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          Aucune présence trouvée.
        </div>
      )}
      {/* Manual Attendance Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">📝 Déclaration Manuelle</h2>
              <button onClick={() => setShowManualModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            
            <form onSubmit={handleSaveManual} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Employé *</label>
                <select
                  required
                  className="w-full border rounded-lg p-2.5"
                  value={manualForm.employeeId || ''}
                  onChange={e => setManualForm({ ...manualForm, employeeId: e.target.value })}
                >
                  <option value="">-- Sélectionner l'employé --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date *</label>
                  <input
                    required
                    type="date"
                    className="w-full border rounded-lg p-2.5"
                    value={manualForm.attendanceDate as string}
                    onChange={e => setManualForm({ ...manualForm, attendanceDate: e.target.value as any })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Statut *</label>
                  <select
                    required
                    className="w-full border rounded-lg p-2.5"
                    value={manualForm.status}
                    onChange={e => setManualForm({ ...manualForm, status: e.target.value as AttendanceStatus })}
                  >
                    <option value="PRESENT">Présent</option>
                    <option value="ABSENT">Absent</option>
                    <option value="LATE">Retard</option>
                    <option value="ON_LEAVE">En congé</option>
                  </select>
                </div>
              </div>

              {manualForm.status === 'PRESENT' || manualForm.status === 'LATE' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Heure Entrée</label>
                    <input
                      type="time"
                      className="w-full border rounded-lg p-2.5"
                      value={manualForm.checkIn || ''}
                      onChange={e => setManualForm({ ...manualForm, checkIn: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Heure Sortie</label>
                    <input
                      type="time"
                      className="w-full border rounded-lg p-2.5"
                      value={manualForm.checkOut || ''}
                      onChange={e => setManualForm({ ...manualForm, checkOut: e.target.value })}
                    />
                  </div>
                </div>
              ) : null}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Notes / Motif</label>
                <textarea
                  className="w-full border rounded-lg p-2.5 h-20"
                  placeholder="Ex: Justificatif médical, retard transport..."
                  value={manualForm.notes || ''}
                  onChange={e => setManualForm({ ...manualForm, notes: e.target.value })}
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-6 py-2.5 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default AttendanceList;
