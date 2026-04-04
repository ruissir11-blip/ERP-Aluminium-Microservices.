import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { departmentApi } from '../../services/hrApi';
import { Department } from '../../types/hr.types';
import Layout from '../../components/common/Layout';

export function DepartmentList() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await departmentApi.list();
      setDepartments(data);
    } catch (err) {
      setError('Échec du chargement des départements');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce département?')) return;
    try {
      await departmentApi.delete(id);
      setDepartments(departments.filter(d => d.id !== id));
    } catch (err) {
      alert('Échec de la suppression');
    }
  };

  return (
    <Layout title="Départements" subtitle="Gérer les départements de l'entreprise">
      <div className="flex justify-between items-center mb-6">
        <div></div>
        <Link
          to="/hr/departments/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Nouveau Département
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manager</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employés</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {departments.map((dept) => (
              <tr key={dept.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                  {dept.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {dept.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {dept.managerName || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {dept.employeeCount || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    dept.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {dept.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <Link
                    to={`/hr/departments/${dept.id}`}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Voir
                  </Link>
                  <Link
                    to={`/hr/departments/${dept.id}/edit`}
                    className="text-yellow-600 hover:text-yellow-900 mr-4"
                  >
                    Modifier
                  </Link>
                  <button
                    onClick={() => handleDelete(dept.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {departments.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          Aucun département trouvé. Créez votre premier département.
        </div>
      )}
    </Layout>
  );
}

export default DepartmentList;
