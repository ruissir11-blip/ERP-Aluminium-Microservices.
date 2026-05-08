import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Eye, FileText, CheckCircle, X, Edit, Calendar, MapPin, Phone, Mail, FileCheck, Package } from 'lucide-react';
import Layout from '../components/common/Layout';
import { orderService, customerService } from '../services/api';
import { CustomerOrder, OrderStatus } from '../types';

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<{id: string; companyName: string}[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [formData, setFormData] = useState({
    customerId: '',
    deliveryDate: '',
    notes: '',
    status: 'EN_ATTENTE'
  });

  useEffect(() => {
    fetchOrders();
  }, [currentPage, filterStatus, searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getAll({
        page: currentPage,
        perPage: 10,
        status: filterStatus,
      });
      setOrders(response.data.data.data);
      setTotalPages(response.data.data.totalPages);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMÉE':
        return 'bg-green-100 text-green-800';
      case 'EN_PRODUCTION':
        return 'bg-blue-100 text-blue-800';
      case 'TERMINÉE':
        return 'bg-teal-100 text-teal-800';
      case 'LIVRÉE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'EN_ATTENTE':
        return 'En attente';
      case 'CONFIRMÉE':
        return 'Confirmée';
      case 'EN_PRODUCTION':
        return 'En production';
      case 'TERMINÉE':
        return 'Terminée';
      case 'LIVRÉE':
        return 'Livrée';
      default:
        return status;
    }
  };

  // Fetch customers for the order form
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await customerService.getActive();
        if (response.data.success) {
          const customersData = response.data.data || [];
          setCustomers(customersData.map((c: any) => ({ id: c.id, companyName: c.companyName })));
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };
    if (showModal) {
      fetchCustomers();
    }
  }, [showModal]);

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setFormData({ customerId: '', deliveryDate: '', notes: '', status: 'EN_ATTENTE' });
    setShowModal(true);
  };

  const handleOpenEditModal = (order: CustomerOrder) => {
    setIsEditMode(true);
    setSelectedOrder(order);
    setFormData({ 
      customerId: order.customerId, 
      deliveryDate: order.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : '', 
      notes: order.notes || '',
      status: order.status
    });
    setShowModal(true);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (isEditMode && selectedOrder) {
        await orderService.update(selectedOrder.id, formData as any);
      } else {
        await orderService.create(formData as any);
      }
      setShowModal(false);
      fetchOrders();
    } catch (error) {
      console.error('Error saving order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await orderService.updateStatus(orderId, newStatus);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleViewDetails = (order: CustomerOrder) => {
    setSelectedOrder(order);
    setShowDetailDrawer(true);
  };

  const handleDownloadBL = async (orderId: string, orderNumber: string) => {
    try {
      const response = await orderService.generateDeliveryNote(orderId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BL-${orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading BL:', error);
      alert('Erreur lors du téléchargement du Bon de Livraison');
    }
  };

  return (
    <Layout title="Gestion des Commandes" subtitle="Suivi des commandes clients">
      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
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

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488] bg-white"
              >
                <option value="">Tous les statuts</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="CONFIRMÉE">Confirmée</option>
                <option value="EN_PRODUCTION">En production</option>
                <option value="TERMINÉE">Terminée</option>
                <option value="LIVRÉE">Livrée</option>
              </select>
            </div>
          </div>

          <button 
            onClick={handleOpenCreateModal}
            className="flex items-center px-4 py-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0f766e] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Commande
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">N° Commande</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Montant</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d9488] mb-2"></div>
                      <span className="text-gray-500">Chargement des commandes...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Package className="w-12 h-12 text-gray-300 mb-2" />
                      <span className="text-gray-500">Aucune commande trouvée</span>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">{order.orderNumber}</div>
                      {order.quoteId && <div className="text-[10px] text-gray-400">Issu du devis {order.quote?.quoteNumber}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 font-medium">{order.customer?.companyName}</div>
                      <div className="text-xs text-gray-400">{order.customer?.code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString('fr-TN')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900 whitespace-nowrap">
                        {order.total.toFixed(3)} <span className="text-[10px] text-gray-400">DT</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`text-[11px] font-bold px-3 py-1 rounded-full cursor-pointer border-transparent outline-none shadow-sm transition-all ${getStatusColor(order.status)}`}
                      >
                        <option value="EN_ATTENTE">EN ATTENTE</option>
                        <option value="CONFIRMÉE">CONFIRMÉE</option>
                        <option value="EN_PRODUCTION">EN PRODUCTION</option>
                        <option value="TERMINÉE">TERMINÉE</option>
                        <option value="LIVRÉE">LIVRÉE</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleViewDetails(order)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleOpenEditModal(order)}
                          className="p-2 text-[#0d9488] hover:bg-teal-50 rounded-lg transition-all"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDownloadBL(order.id, order.orderNumber)}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all" 
                          title="Bon de livraison"
                        >
                          <FileText className="w-4 h-4" />
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
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <p className="text-xs text-gray-500 italic">
            Affichage de {orders.length} commandes sur {totalPages * 10} au total
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg text-xs disabled:opacity-50 hover:bg-white transition-colors"
            >
              Précédent
            </button>
            <div className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600">
              {currentPage} / {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-lg text-xs disabled:opacity-50 hover:bg-white transition-colors"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {/* Create/Edit Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{isEditMode ? `Modifier Commande ${selectedOrder?.orderNumber}` : 'Nouvelle Commande'}</h2>
                <p className="text-xs text-gray-500 mt-1">Remplissez les informations ci-dessous</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmitOrder} className="p-8">
              <div className="space-y-5">
                {!isEditMode && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Client <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="customerId"
                      value={formData.customerId}
                      onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d9488] transition-all bg-gray-50/30"
                    >
                      <option value="">Sélectionner un client</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Statut
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d9488] transition-all bg-gray-50/30"
                    >
                      <option value="EN_ATTENTE">En attente</option>
                      <option value="CONFIRMÉE">Confirmée</option>
                      <option value="EN_PRODUCTION">En production</option>
                      <option value="TERMINÉE">Terminée</option>
                      <option value="LIVRÉE">Livrée</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Date de livraison
                    </label>
                    <input
                      type="date"
                      name="deliveryDate"
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d9488] transition-all bg-gray-50/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Notes complémentaires
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d9488] transition-all bg-gray-50/30"
                    placeholder="Précisions sur la livraison, finitions particulières..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-[#0d9488] text-white rounded-xl text-sm font-bold hover:bg-[#0f766e] disabled:opacity-50 shadow-md shadow-teal-100 transition-all active:scale-95"
                >
                  {isSubmitting ? 'Enregistrement...' : (isEditMode ? 'Mettre à jour' : 'Créer la commande')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {showDetailDrawer && selectedOrder && (
        <div className="fixed inset-0 z-[70] overflow-hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setShowDetailDrawer(false)} />
          <div className="absolute inset-y-0 right-0 max-w-2xl w-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-6 border-b bg-gray-50">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Détails Commande {selectedOrder.orderNumber}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                  <span className="text-xs text-gray-400">Créée le {new Date(selectedOrder.createdAt).toLocaleString('fr-TN')}</span>
                </div>
              </div>
              <button 
                onClick={() => setShowDetailDrawer(false)}
                className="p-2 hover:bg-white rounded-full border border-transparent hover:border-gray-200 transition-all"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10">
              {/* Customer Info */}
              <section>
                <h3 className="text-xs font-bold text-[#0d9488] uppercase tracking-widest mb-4 flex items-center">
                  <span className="w-6 h-[1px] bg-teal-200 mr-2"></span>
                  Client & Coordonnées
                </h3>
                <div className="grid grid-cols-2 gap-6 bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <MapPin className="w-4 h-4 text-gray-400 mr-3 shrink-0" />
                      <span className="text-gray-700 font-semibold">{selectedOrder.customer?.companyName}</span>
                    </div>
                    <div className="flex items-center text-sm pl-7">
                      <span className="text-gray-500 italic text-xs">{selectedOrder.customer?.billingStreet}, {selectedOrder.customer?.billingCity}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="w-4 h-4 text-gray-400 mr-3 shrink-0" />
                      <span className="text-gray-600">{selectedOrder.customer?.phone || 'Non renseigné'}</span>
                    </div>
                  </div>
                  <div className="space-y-3 border-l border-gray-200 pl-6">
                    <div className="flex items-center text-sm">
                      <Mail className="w-4 h-4 text-gray-400 mr-3 shrink-0" />
                      <span className="text-gray-600">{selectedOrder.customer?.email || 'Non renseigné'}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <FileCheck className="w-4 h-4 text-gray-400 mr-3 shrink-0" />
                      <span className="text-gray-600">Matricule: {selectedOrder.customer?.code}</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Order Status & Timeline */}
              <section className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Livraison Prévue</h3>
                  <div className="flex items-center p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <Calendar className="w-5 h-5 text-amber-600 mr-3" />
                    <div>
                      <div className="text-sm font-bold text-amber-900">
                        {selectedOrder.deliveryDate ? new Date(selectedOrder.deliveryDate).toLocaleDateString('fr-TN') : 'Non définie'}
                      </div>
                      <div className="text-[10px] text-amber-600 font-medium">Date estimée de réception</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Référence Devis</h3>
                  <div className="flex items-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <FileText className="w-5 h-5 text-blue-600 mr-3" />
                    <div>
                      <div className="text-sm font-bold text-blue-900">
                        {selectedOrder.quote?.quoteNumber || 'Directe'}
                      </div>
                      <div className="text-[10px] text-blue-600 font-medium">Document original</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Financials */}
              <section>
                <div className="bg-[#111827] text-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Total de la commande</p>
                      <h4 className="text-4xl font-black">{selectedOrder.total.toFixed(3)} <span className="text-lg font-normal text-teal-400">DT</span></h4>
                    </div>
                    <div className="text-right text-xs space-y-1">
                      <div className="flex justify-between w-40">
                        <span className="text-gray-500">Sous-total:</span>
                        <span>{Number(selectedOrder.subtotal).toFixed(3)} DT</span>
                      </div>
                      <div className="flex justify-between w-40">
                        <span className="text-gray-500">TVA (19%):</span>
                        <span>{Number(selectedOrder.vatAmount).toFixed(3)} DT</span>
                      </div>
                      {Number(selectedOrder.discountAmount) > 0 && (
                        <div className="flex justify-between w-40 text-red-400">
                          <span>Remise:</span>
                          <span>-{Number(selectedOrder.discountAmount).toFixed(3)} DT</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Notes */}
              <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Notes & Commentaires</h3>
                <div className="p-5 bg-white border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-600 italic">
                  {selectedOrder.notes || 'Aucune note particulière pour cette commande.'}
                </div>
              </section>
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button 
                onClick={() => handleOpenEditModal(selectedOrder)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#0d9488] text-white rounded-xl font-bold hover:bg-[#0f766e] transition-all"
              >
                <Edit className="w-4 h-4" /> Modifier
              </button>
              <button 
                onClick={() => handleDownloadBL(selectedOrder.id, selectedOrder.orderNumber)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-200 bg-white text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all font-premium"
              >
                <FileText className="w-4 h-4" /> Bon de Livraison
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default OrderList;