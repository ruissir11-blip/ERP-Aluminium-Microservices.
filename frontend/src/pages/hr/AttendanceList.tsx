import { useState, useEffect } from 'react';
import { attendanceApi } from '../../services/hrApi';
import { Attendance, AttendanceStatus } from '../../types/hr.types';
import Layout from '../../components/common/Layout';

export function AttendanceList() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('PRESENT');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    loadAttendances();
  }, [filter, startDate, endDate]);

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
    try {
      await attendanceApi.checkIn();
      loadAttendances();
    } catch (err) {
      alert('Échec du pointage');
    }
  };

  const handleCheckOut = async () => {
    try {
      await attendanceApi.checkOut();
      loadAttendances();
    } catch (err) {
      alert('Échec du pointage');
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
    return new Date(time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
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
      <div className="flex justify-between items-center mb-6">
        <div></div>
        <div className="flex gap-2">
          <button
            onClick={handleCheckIn}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Pointer Entrée
          </button>
          <button
            onClick={handleCheckOut}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Pointer Sortie
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-4">
        <div className="flex gap-2">
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
                  {new Date(attendance.attendanceDate).toLocaleDateString('fr-FR')}
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
    </Layout>
  );
}

export default AttendanceList;
