import React, { useEffect, useState } from 'react';
import { RefreshCw, Download, ChevronUp, ChevronDown, Info } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { productCostApi } from '../../services/comptabiliteApi';
import { ProductCost } from '../../types/comptabilite.types';

const ProductCosts: React.FC = () => {
  const [products, setProducts] = useState<ProductCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [sortBy, setSortBy] = useState<string>('total_cost');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedProduct, setSelectedProduct] = useState<ProductCost | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, sortBy, sortOrder]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productCostApi.getAll({
        page: currentPage,
        perPage: 10,
        sortBy,
        sortOrder,
      });
      
      const data = response?.data || [];
      setProducts(Array.isArray(data) ? data : []);
      setTotalPages(response?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching product costs:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      await productCostApi.recalculate();
      fetchProducts();
    } catch (error) {
      console.error('Error recalculating costs:', error);
    } finally {
      setRecalculating(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return isNaN(num) ? '0,00 DT' : `${num.toFixed(2)} DT`;
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  const exportToExcel = () => {
    // Create CSV content
    const headers = ['Profil', 'Coût Matière', 'Coût Main d\'œuvre', 'Coût Frais Généraux', 'Coût Total'];
    const rows = products.map((p) => [
      p.profileName || p.profileId,
      p.materialCost,
      p.laborCost,
      p.overheadCost,
      p.totalCost,
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map((row) => row.join(';')),
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `couts_produits_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Layout title="Coûts Produits" subtitle="Analyse des coûts par produit">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Coûts par Produit</h1>
        <div className="flex gap-2">
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={20} className={recalculating ? 'animate-spin' : ''} />
            Recalculer
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download size={20} />
            Exporter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profil</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <button
                  onClick={() => handleSort('material_cost')}
                  className="flex items-center gap-1"
                >
                  Matière {getSortIcon('material_cost')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <button
                  onClick={() => handleSort('labor_cost')}
                  className="flex items-center gap-1"
                >
                  Main d'œuvre {getSortIcon('labor_cost')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <button
                  onClick={() => handleSort('overhead_cost')}
                  className="flex items-center gap-1"
                >
                  Frais Généraux {getSortIcon('overhead_cost')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <button
                  onClick={() => handleSort('total_cost')}
                  className="flex items-center gap-1"
                >
                  Coût Total {getSortIcon('total_cost')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Détails</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Chargement...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Aucun coût de produit trouvé
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {product.profileName || product.profileId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-600">
                    {formatCurrency(product.materialCost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-green-600">
                    {formatCurrency(product.laborCost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-purple-600">
                    {formatCurrency(product.overheadCost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold">
                    {formatCurrency(product.totalCost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="p-1 text-gray-600 hover:text-gray-800"
                    >
                      <Info size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-4">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
        >
          Précédent
        </button>
        <span className="px-4 py-2">
          Page {currentPage} sur {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
        >
          Suivant
        </button>
      </div>

      {/* Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">
              Détails du Coût: {selectedProduct.profileName || selectedProduct.profileId}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600">Matière</div>
                  <div className="text-xl font-bold text-blue-700">
                    {formatCurrency(selectedProduct.materialCost)}
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600">Main d'œuvre</div>
                  <div className="text-xl font-bold text-green-700">
                    {formatCurrency(selectedProduct.laborCost)}
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-purple-600">Frais Généraux</div>
                  <div className="text-xl font-bold text-purple-700">
                    {formatCurrency(selectedProduct.overheadCost)}
                  </div>
                </div>
                <div className="p-4 bg-gray-100 rounded-lg">
                  <div className="text-sm text-gray-600">Total</div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatCurrency(selectedProduct.totalCost)}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Calculé le: {new Date(selectedProduct.calculatedAt).toLocaleDateString('fr-FR')}
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProductCosts;
