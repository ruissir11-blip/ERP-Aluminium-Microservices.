import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, ArrowUpDown, AlertTriangle, Warehouse, X } from 'lucide-react';
import Layout from '../components/common/Layout';
import { stockService, profileService, warehouseService } from '../services/api';
import { StockItem, MovementType, AluminumProfile, Warehouse as WarehouseType } from '../types';

const StockManagement: React.FC = () => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [formStockItems, setFormStockItems] = useState<AluminumProfile[]>([]); // Separate state for form dropdown using Articles/Profiles
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]); // Warehouses for movement form
  const [loading, setLoading] = useState(true);
  const [loadingForm, setLoadingForm] = useState(false); // Loading state for form
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: 'ENTRÉE' as MovementType,
    stockItemId: '',
    warehouseId: '', // Add warehouse to form
    quantity: '',
    notes: '',
  });

  useEffect(() => {
    fetchStock();
  }, [currentPage, filterWarehouse, showLowStockOnly, searchTerm]);

  const fetchStock = async () => {
    try {
      setLoading(true);
      const response = await stockService.getAll({
        page: currentPage,
        perPage: 10,
        warehouseId: filterWarehouse,
        lowStock: showLowStockOnly,
      });
      // Backend returns ApiResponse<PaginatedResponse<InventoryItem>>
      // Structure: { data: { data: InventoryItem[], total, page, perPage, totalPages } }
      // Map backend fields to frontend expected fields
      const items = (response.data.data?.data || []).map((item: any) => ({
        id: item.id,
        profileId: item.profileId,
        profile: item.profile,
        warehouseId: item.warehouseId,
        warehouse: item.warehouse,
        quantity: item.quantityOnHand ?? 0, // Map quantityOnHand to quantity
        location: item.location?.code || item.locationId || '-',
        minThreshold: item.profile?.minStockLevel || 10, // Use profile minStockLevel or default
        maxThreshold: item.profile?.maxStockLevel || 100,
        lastMovement: item.lastMovementDate,
      }));
      setStockItems(items);
      // Get totalPages and total from paginated response
      setTotalPages(response.data.data?.totalPages || 1);
      setTotalItems(response.data.data?.total || 0);
    } catch (error) {
      console.error('Error fetching stock:', error);
      setStockItems([]);
    } finally {
      setLoading(false);
    }
  };

  const getStockColor = (quantity: number, minThreshold: number) => {
    if (quantity === 0) return 'bg-red-100 text-red-800';
    if (quantity < minThreshold) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  const getStockLabel = (quantity: number, minThreshold: number) => {
    if (quantity === 0) return 'Rupture';
    if (quantity < minThreshold) return 'Critique';
    return 'OK';
  };

  // Fetch profiles (articles) for the movement form dropdown
  useEffect(() => {
    const fetchFormData = async () => {
      setLoadingForm(true);
      try {
        // Use profileService to get articles
        const profileRes = await profileService.getAll({ perPage: 100 });
        const responseData = (profileRes.data as any).data?.data || [];
        setFormStockItems(responseData);
        
        // Also fetch warehouses - warehouseService.getAll returns ApiResponse<any[]>
        const warehouseRes = await warehouseService.getAll();
        const warehouseData = (warehouseRes.data as any).data || [];
        setWarehouses(warehouseData);
      } catch (error) {
        console.error('Error fetching form data:', error);
        setFormStockItems([]);
        setWarehouses([]);
      } finally {
        setLoadingForm(false);
      }
    };
    if (showModal) {
      fetchFormData();
    }
  }, [showModal]);

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      // Map French movement types to English
      const typeMap: Record<string, string> = {
        'ENTRÉE': 'RECEIPT',
        'SORTIE': 'ISSUE',
        'TRANSFERT': 'TRANSFER',
        'AJUSTEMENT': 'ADJUSTMENT',
        'INVENTAIRE': 'COUNT',
      };
      
      await stockService.createMovement({
        profileId: formData.stockItemId, // Use profileId instead of stockItemId
        warehouseId: formData.warehouseId,
        movementType: typeMap[formData.type] || formData.type,
        quantity: parseFloat(formData.quantity),
        notes: formData.notes,
        referenceType: 'MANUAL',
        referenceId: `MOV-${Date.now()}`,
      });
      setShowModal(false);
      setFormData({
        type: 'ENTRÉE',
        stockItemId: '',
        warehouseId: '',
        quantity: '',
        notes: '',
      });
      fetchStock();
    } catch (error) {
      console.error('Error creating movement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="Gestion des Stocks" subtitle="Suivi des stocks multi-entrepôt">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Warehouse className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Valeur du Stock</p>
              <p className="text-xl font-bold text-gray-900">DT890K</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <ArrowUpDown className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Articles en Stock</p>
              <p className="text-xl font-bold text-gray-900">1,245</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-orange-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Alertes</p>
              <p className="text-xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-teal-50 rounded-lg">
              <ArrowUpDown className="w-6 h-6 text-teal-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Rotation</p>
              <p className="text-xl font-bold text-gray-900">4.2/mois</p>
            </div>
          </div>
        </div>
      </div>

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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488] w-64"
              />
            </div>

            {/* Warehouse Filter */}
            <div className="relative">
              <Warehouse className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterWarehouse}
                onChange={(e) => setFilterWarehouse(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488] bg-white"
              >
                <option value="">Tous les entrepôts</option>
                <option value="1">Entrepôt Nord</option>
                <option value="2">Entrepôt Sud</option>
              </select>
            </div>

            {/* Low Stock Toggle */}
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLowStockOnly}
                onChange={(e) => setShowLowStockOnly(e.target.checked)}
                className="rounded border-gray-300 text-[#0d9488] focus:ring-[#0d9488]"
              />
              <span className="text-sm text-gray-700">Stock bas uniquement</span>
            </label>
          </div>

          {/* Add Button */}
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Mouvement
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Article</th>
                <th className="px-6 py-4">Référence</th>
                <th className="px-6 py-4">Entrepôt</th>
                <th className="px-6 py-4">Emplacement</th>
                <th className="px-6 py-4">Quantité</th>
                <th className="px-6 py-4">Seuil Min</th>
                <th className="px-6 py-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : stockItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Aucun article en stock
                  </td>
                </tr>
              ) : (
                stockItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.profile?.name}</td>
                    <td className="px-6 py-4 text-gray-600">{item.profile?.reference}</td>
                    <td className="px-6 py-4 text-gray-600">{item.warehouse?.name}</td>
                    <td className="px-6 py-4 text-gray-600">{item.location || '-'}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{item.quantity}</td>
                    <td className="px-6 py-4 text-gray-600">{item.minThreshold}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockColor(item.quantity, item.minThreshold)}`}>
                        {getStockLabel(item.quantity, item.minThreshold)}
                      </span>
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
            Affichage 1-{stockItems.length} sur {totalItems} articles
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

      {/* Create Movement Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Nouveau Mouvement de Stock</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreateMovement} className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de mouvement <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as MovementType })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                  >
                    <option value="ENTRÉE">Entrée</option>
                    <option value="SORTIE">Sortie</option>
                    <option value="TRANSFERT">Transfert</option>
                    <option value="INVENTAIRE">Inventaire</option>
                    <option value="AJUSTEMENT">Ajustement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Article en stock <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="stockItemId"
                    value={formData.stockItemId}
                    onChange={(e) => setFormData({ ...formData, stockItemId: e.target.value })}
                    required
                    disabled={loadingForm}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                  >
                    <option value="">{loadingForm ? 'Chargement...' : 'Sélectionner un article'}</option>
                    {formStockItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.reference} - {item.name} ({item.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entrepôt <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="warehouseId"
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                    required
                    disabled={loadingForm}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                  >
                    <option value="">{loadingForm ? 'Chargement...' : 'Sélectionner un entrepôt'}</option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} ({wh.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantité <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                    placeholder="Notes complémentaires..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] disabled:opacity-50"
                >
                  {isSubmitting ? 'Création...' : 'Créer le mouvement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default StockManagement;