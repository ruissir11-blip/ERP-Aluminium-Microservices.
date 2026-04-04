import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { costComponentApi } from '../../services/comptabiliteApi';
import { CostComponent, CostComponentInput, CostComponentType } from '../../types/comptabilite.types';

const CostConfiguration: React.FC = () => {
  const [components, setComponents] = useState<CostComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<CostComponentType | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [editingComponent, setEditingComponent] = useState<CostComponent | null>(null);
  const [formData, setFormData] = useState<CostComponentInput>({
    name: '',
    type: 'material',
    rate: '',
    unit: '',
    is_active: true,
  });

  useEffect(() => {
    fetchComponents();
  }, [filterType]);

  const fetchComponents = async () => {
    try {
      setLoading(true);
      const params = filterType ? { type: filterType, is_active: undefined } : {};
      const response = await costComponentApi.getAll(params);
      setComponents(response || []);
    } catch (error) {
      console.error('Error fetching cost components:', error);
      setComponents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingComponent) {
        await costComponentApi.update(editingComponent.id, formData);
      } else {
        await costComponentApi.create(formData);
      }
      setShowModal(false);
      resetForm();
      fetchComponents();
    } catch (error) {
      console.error('Error saving cost component:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce composant de coût ?')) {
      try {
        await costComponentApi.delete(id);
        fetchComponents();
      } catch (error) {
        console.error('Error deleting cost component:', error);
      }
    }
  };

  const handleToggleActive = async (component: CostComponent) => {
    try {
      await costComponentApi.update(component.id, { is_active: !component.is_active });
      fetchComponents();
    } catch (error) {
      console.error('Error toggling component status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'material',
      rate: '',
      unit: '',
      is_active: true,
    });
    setEditingComponent(null);
  };

  const openEditModal = (component: CostComponent) => {
    setEditingComponent(component);
    setFormData({
      name: component.name,
      type: component.type,
      rate: component.rate,
      unit: component.unit,
      is_active: component.is_active,
    });
    setShowModal(true);
  };

  const filteredComponents = components.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeLabel = (type: CostComponentType) => {
    const labels: Record<CostComponentType, string> = {
      material: 'Matière',
      labor: 'Main d\'œuvre',
      overhead: 'Frais généraux',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: CostComponentType) => {
    const colors: Record<CostComponentType, string> = {
      material: 'bg-blue-100 text-blue-800',
      labor: 'bg-green-100 text-green-800',
      overhead: 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Layout title="Configuration Coûts" subtitle="Gestion des composants de coûts">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuration des Coûts</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Nouveau Composant
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as CostComponentType | '')}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Tous les types</option>
          <option value="material">Matière</option>
          <option value="labor">Main d'œuvre</option>
          <option value="overhead">Frais généraux</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taux</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unité</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Chargement...
                </td>
              </tr>
            ) : filteredComponents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Aucun composant de coût trouvé
                </td>
              </tr>
            ) : (
              filteredComponents.map((component) => (
                <tr key={component.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{component.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(component.type)}`}>
                      {getTypeLabel(component.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{component.rate} DT</td>
                  <td className="px-6 py-4 whitespace-nowrap">{component.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(component)}
                      className={`flex items-center gap-1 ${component.is_active ? 'text-green-600' : 'text-gray-400'}`}
                    >
                      {component.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      <span className="text-sm">{component.is_active ? 'Actif' : 'Inactif'}</span>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(component)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(component.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={18} />
                      </button>
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingComponent ? 'Modifier le Composant' : 'Nouveau Composant'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as CostComponentType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="material">Matière</option>
                    <option value="labor">Main d'œuvre</option>
                    <option value="overhead">Frais généraux</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taux (DT)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="ex: kg, heure, m²"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingComponent ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CostConfiguration;
