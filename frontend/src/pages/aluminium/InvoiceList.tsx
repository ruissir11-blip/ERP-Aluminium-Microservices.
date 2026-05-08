import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Filter, Download, Send, Eye, Edit, Trash2 } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { invoiceService } from '../../services/aluminium/invoiceApi';
import { Invoice, InvoiceStatus } from '../../types/aluminium.types';
import InvoiceModal from '../../components/aluminium/InvoiceModal';

const statusColors: Record<InvoiceStatus, string> = {
  'BROUILLON': 'bg-gray-100 text-gray-800',
  'VALIDÉE': 'bg-blue-100 text-blue-800',
  'ENVOYÉE': 'bg-yellow-100 text-yellow-800',
  'PAYÉE': 'bg-green-100 text-green-800',
  'EN_RETARD': 'bg-red-100 text-red-800',
  'ANNULÉE': 'bg-gray-100 text-gray-500',
};

const InvoiceList: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, [currentPage, statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getAll({
        page: currentPage,
        perPage: 10,
        status: statusFilter || undefined,
      });
      
      if (response.data) {
        // Si le backend renvoie { data: [...] } formatté en tableau non paginé
        if (Array.isArray(response.data.data)) {
          setInvoices(response.data.data);
          setTotalPages(1);
        } 
        // Si le backend renvoie un objet paginé { success: true, data: { data: [...], totalPages: 1 } }
        else if (response.data.data && Array.isArray(response.data.data.data)) {
          setInvoices(response.data.data.data);
          setTotalPages(response.data.data.totalPages || 1);
        }
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoice = async (id: string) => {
    try {
      await invoiceService.send(id);
      fetchInvoices();
      alert('Facture envoyée avec succès !');
    } catch (error: any) {
      console.error('Error sending invoice:', error);
      alert('Erreur lors de l\'envois : ' + (error.response?.data?.error || error.message));
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await invoiceService.update(id, { status: newStatus as InvoiceStatus });
      fetchInvoices();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const handleUpdateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editInvoice) return;

    try {
      await invoiceService.update(editInvoice.id, {
        status: editInvoice.status,
        invoiceDate: editInvoice.invoiceDate,
        dueDate: editInvoice.dueDate,
        vatRate: editInvoice.vatRate,
        notes: editInvoice.notes
      });
      setIsEditModalOpen(false);
      fetchInvoices();
      alert('Facture mise à jour avec succès !');
    } catch (error) {
      console.error('Error updating invoice:', error);
      alert('Erreur lors de la mise à jour de la facture');
    }
  };

  const handleDownloadPdf = async (id: string) => {
    try {
      const response = await invoiceService.getPdf(id);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      if (error.response?.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          const message = JSON.parse(reader.result as string).details || JSON.parse(reader.result as string).error;
          alert('Erreur lors du téléchargement : ' + message);
        };
        reader.readAsText(error.response.data);
      } else {
        alert('Erreur lors du téléchargement : ' + (error.response?.data?.details || error.message));
      }
    }
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customer?.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Factures" subtitle="Gestion des factures clients">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouvelle Facture
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher par numéro ou client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
          >
            <option value="">Tous les statuts</option>
            <option value="BROUILLON">Brouillon</option>
            <option value="VALIDÉE">Validée</option>
            <option value="ENVOYÉE">Envoyée</option>
            <option value="PAYÉE">Payée</option>
            <option value="EN_RETARD">En retard</option>
            <option value="ANNULÉE">Annulée</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                N° Facture
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Échéance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Montant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Chargement...
                </td>
              </tr>
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Aucune facture trouvée
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{invoice.customer?.companyName || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {new Date(invoice.invoiceDate).toLocaleDateString('fr-TN')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {new Date(invoice.dueDate).toLocaleDateString('fr-TN')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {invoice.total.toLocaleString('fr-TN', { style: 'currency', currency: 'TND' })}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                        value={invoice.status}
                        onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                        className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full cursor-pointer border-transparent outline-none ring-0 appearance-none text-center ${statusColors[invoice.status]}`}
                        style={{ textAlignLast: 'center' }}
                      >
                        <option value="BROUILLON">Brouillon</option>
                        <option value="VALIDÉE">Validée</option>
                        <option value="ENVOYÉE">Envoyée</option>
                        <option value="PAYÉE">Payée</option>
                        <option value="EN_RETARD">En retard</option>
                        <option value="ANNULÉE">Annulée</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleSendInvoice(invoice.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Envoyer"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDownloadPdf(invoice.id)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Télécharger PDF"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setIsViewModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Voir"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditInvoice(invoice);
                          setIsEditModalOpen(true);
                        }}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Modifier"
                      >
                        <Edit className="w-5 h-5" />
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
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Précédent
            </button>
            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
              Page {currentPage} sur {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Suivant
            </button>
          </nav>
        </div>
      )}

      {isModalOpen && (
        <InvoiceModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchInvoices();
          }}
        />
      )}

      {/* View Detail Modal */}
      {/* Edit Modal */}
      {isEditModalOpen && editInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Modifier Facture : {editInvoice.invoiceNumber}</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateInvoice}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Statut</label>
                  <select
                    value={editInvoice.status}
                    onChange={(e) => setEditInvoice({ ...editInvoice, status: e.target.value as InvoiceStatus })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="BROUILLON">Brouillon</option>
                    <option value="VALIDÉE">Validée</option>
                    <option value="ENVOYÉE">Envoyée</option>
                    <option value="PAYÉE">Payée</option>
                    <option value="ANNULÉE">Annulée</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date de facture</label>
                  <input
                    type="date"
                    value={new Date(editInvoice.invoiceDate).toISOString().split('T')[0]}
                    onChange={(e) => setEditInvoice({ ...editInvoice, invoiceDate: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date d'échéance</label>
                  <input
                    type="date"
                    value={new Date(editInvoice.dueDate).toISOString().split('T')[0]}
                    onChange={(e) => setEditInvoice({ ...editInvoice, dueDate: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Taux TVA (%)</label>
                  <input
                    type="number"
                    value={editInvoice.vatRate}
                    onChange={(e) => setEditInvoice({ ...editInvoice, vatRate: Number(e.target.value) })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={editInvoice.notes || ''}
                    onChange={(e) => setEditInvoice({ ...editInvoice, notes: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 border-b pb-2">
              <h2 className="text-xl font-bold">Détails Facture : {selectedInvoice.invoiceNumber}</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500 text-uppercase font-bold">Client</p>
                <p className="text-lg">{selectedInvoice.customer?.companyName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 text-uppercase font-bold">Statut</p>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[selectedInvoice.status]}`}>
                  {selectedInvoice.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 text-uppercase font-bold">Date de facture</p>
                <p>{new Date(selectedInvoice.invoiceDate).toLocaleDateString('fr-TN')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 text-uppercase font-bold">Échéance</p>
                <p>{new Date(selectedInvoice.dueDate).toLocaleDateString('fr-TN')}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold border-b mb-2">Détails Techniques (Commande n° {selectedInvoice.order?.orderNumber})</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2">Réf</th>
                    <th className="text-left py-2">Désignation</th>
                    <th className="text-right py-2">Qté</th>
                    <th className="text-right py-2">Poids total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedInvoice.order?.quote?.lines?.map((line: any) => (
                    <tr key={line.id}>
                      <td className="py-2">{line.profile?.reference}</td>
                      <td className="py-2">{line.profile?.name}</td>
                      <td className="text-right py-2">{line.quantity}</td>
                      <td className="text-right py-2">{line.totalWeight} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 mt-4 border-t pt-4">
              <div className="text-right mr-auto">
                <p className="text-sm text-gray-500">Total TTC</p>
                <p className="text-2xl font-bold text-indigo-600">{selectedInvoice.total.toLocaleString('fr-TN', { style: 'currency', currency: 'TND' })}</p>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
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

// Simple X icon for the modal if not imported
const X = ({ className, onClick }: any) => (
  <svg onClick={onClick} className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default InvoiceList;
