import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, X } from 'lucide-react';
import Layout from '../components/common/Layout';
import { profileService } from '../services/api';
import { AluminumProfile, ProfileType } from '../types';

const ProfileList: React.FC = () => {
  const [profiles, setProfiles] = useState<AluminumProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    reference: '',
    name: '',
    type: 'TUBE' as ProfileType,
    length: '',
    width: '',
    thickness: '',
    unitPrice: '',
    weightPerMeter: '',
  });
  const [formError, setFormError] = useState('');

  // Fetch profiles when page, filter, or search changes
  useEffect(() => {
    fetchProfiles();
  }, [currentPage, filterType, searchTerm]);

  // Handle search/filter changes - reset to page 1
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (value: string) => {
    setFilterType(value);
    setCurrentPage(1);
  };

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const response = await profileService.getAll({
        page: currentPage,
        perPage: 10,
        type: filterType,
        search: searchTerm,
      });
      const result = response.data?.data;
      const data = result?.data || [];
      setProfiles(Array.isArray(data) ? data : []);
      setTotalPages(result?.totalPages || 1);
      setTotal(result?.total || 0);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      // Handle timeout or network error - use empty data
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error' || !error.response) {
        console.warn('Using fallback data due to connection error');
        setProfiles([]);
        setTotal(0);
        setTotalPages(1);
      } else {
        setProfiles([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce profilé ?')) {
      try {
        await profileService.delete(id);
        fetchProfiles();
      } catch (error) {
        console.error('Error deleting profile:', error);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.reference || formData.reference.trim() === '') {
        setFormError('La référence est requise');
        setIsSubmitting(false);
        return;
      }

      if (!formData.name || formData.name.trim() === '') {
        setFormError('Le nom est requis');
        setIsSubmitting(false);
        return;
      }

      if (!formData.unitPrice || formData.unitPrice.trim() === '') {
        setFormError('Le prix unitaire est requis');
        setIsSubmitting(false);
        return;
      }

      const unitPriceValue = parseFloat(formData.unitPrice);
      if (isNaN(unitPriceValue) || unitPriceValue < 0) {
        setFormError('Le prix unitaire doit être un nombre positif');
        setIsSubmitting(false);
        return;
      }

      const profileData = {
        reference: formData.reference.trim(),
        name: formData.name.trim(),
        type: formData.type,
        length: formData.length ? parseFloat(formData.length) : undefined,
        width: formData.width ? parseFloat(formData.width) : undefined,
        thickness: formData.thickness ? parseFloat(formData.thickness) : undefined,
        unitPrice: unitPriceValue,
        weightPerMeter: formData.weightPerMeter ? parseFloat(formData.weightPerMeter) : undefined,
      };

      console.log('Sending profile data:', profileData);
      
      await profileService.create(profileData);
      setShowModal(false);
      setFormData({
        reference: '',
        name: '',
        type: 'TUBE',
        length: '',
        width: '',
        thickness: '',
        unitPrice: '',
        weightPerMeter: '',
      });
      fetchProfiles();
    } catch (error: any) {
      console.error('Error creating profile:', error);
      
      let errorMessage = 'Erreur lors de la création du profilé';
      
      // Handle network errors
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Le serveur ne répond pas. Veuillez réessayer.';
      } else if (error.message === 'Network Error' || !error.response) {
        errorMessage = 'Erreur de connexion. Vérifiez que le serveur est bien démarré.';
      } else {
        // Get error data from response
        const errorData = error.response?.data;
        console.log('Error data received:', errorData);
        
        // Handle various error formats
        if (errorData) {
          // Format: { success: false, error: { code, message } }
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          }
          // Format: { message }
          else if (errorData.message) {
            errorMessage = errorData.message;
          }
          // Format: { error: "string" }
          else if (typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          }
          // Format: { errors: [...] }
          else if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.map((e: any) => e.message || e).join(', ');
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
      }
      
      console.log('Setting form error:', errorMessage);
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStockColor = (quantity: number) => {
    if (quantity === 0) return 'bg-red-100 text-red-800';
    if (quantity < 50) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <Layout title="Gestion des Profilés Aluminium" subtitle="Catalogue des profilés aluminium">
      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488] w-64"
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterType}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488] bg-white"
              >
                <option value="">Tous les types</option>
                <option value="CORNIERE">Cornière</option>
                <option value="TUBE">Tube</option>
                <option value="PLAT">Plat</option>
                <option value="UPN">UPN</option>
                <option value="IPE">IPE</option>
              </select>
            </div>
          </div>

          {/* Add Button */}
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Profilé
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Référence</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Dimensions (L×l×e)</th>
                <th className="px-6 py-4">Poids/m</th>
                <th className="px-6 py-4">Prix unitaire</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : profiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Aucun profilé trouvé
                  </td>
                </tr>
              ) : (
                profiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{profile.reference}</td>
                    <td className="px-6 py-4 text-gray-600">{profile.type}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {profile.length}×{profile.width}×{profile.thickness} mm
                    </td>
                    <td className="px-6 py-4 text-gray-600">{profile.weightPerMeter} kg/m</td>
                    <td className="px-6 py-4 text-gray-600">€{profile.unitPrice}/kg</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockColor(100)}`}>
                        100
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-[#0d9488] transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(profile.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Affichage {profiles.length > 0 ? (currentPage - 1) * 10 + 1 : 0}-{Math.min(currentPage * 10, total)} sur {total} profilés
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Précédent
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} sur {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {/* Create Profile Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Nouveau Profilé</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
                  {formError}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Référence <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="reference"
                    value={formData.reference}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                    placeholder="PROF-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                    placeholder="Profile aluminium 70mm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                  >
                    <option value="TUBE">Tube</option>
                    <option value="CORNIERE">Cornière</option>
                    <option value="PLAT">Plat</option>
                    <option value="UPN">UPN</option>
                    <option value="IPE">IPE</option>
                    <option value="CUSTOM">Autre</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longueur (mm)
                    </label>
                    <input
                      type="number"
                      name="length"
                      value={formData.length}
                      onChange={handleInputChange}
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                      placeholder="6000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Largeur (mm)
                    </label>
                    <input
                      type="number"
                      name="width"
                      value={formData.width}
                      onChange={handleInputChange}
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                      placeholder="70"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Épaisseur (mm)
                    </label>
                    <input
                      type="number"
                      name="thickness"
                      value={formData.thickness}
                      onChange={handleInputChange}
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                      placeholder="1.5"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix unitaire (DT/kg) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="unitPrice"
                      value={formData.unitPrice}
                      onChange={handleInputChange}
                      required
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                      placeholder="25.50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Poids (kg/m)
                    </label>
                    <input
                      type="number"
                      name="weightPerMeter"
                      value={formData.weightPerMeter}
                      onChange={handleInputChange}
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                      placeholder="1.25"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProfileList;