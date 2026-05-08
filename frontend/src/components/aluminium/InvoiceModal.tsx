import React, { useState, useEffect } from 'react';
import { CustomerOrder } from '../../types';
import { orderService } from '../../services/api';
import { invoiceService } from '../../services/aluminium/invoiceApi';

import { X } from 'lucide-react';

interface InvoiceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ onClose, onSuccess }) => {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Additional optional fields
  const [vatRate, setVatRate] = useState<number>(19);
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // Get completed orders ready for invoicing
      const response = await orderService.getAll({ perPage: 100 });
      if (response.data.success) {
        setOrders(response.data.data.data.filter(o => o.status === 'LIVRÉE' || o.status === 'TERMINÉE'));
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) {
      setError('Veuillez sélectionner une commande');
      return;
    }

    const order = orders.find((o) => o.id === selectedOrderId);
    if (!order) return;

    setLoading(true);
    setError(null);
    try {
      await invoiceService.createFromOrder({
        orderId: selectedOrderId,
        customerId: order.customerId,
        invoiceDate,
        dueDate: dueDate || undefined,
        vatRate,
        notes: notes || undefined,
      });
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.details || 
        err?.response?.data?.error || 
        'Erreur lors de la création de la facture'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Nouvelle Facture</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Commande Source *
            </label>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">-- Sélectionner une commande --</option>
              {orders.length === 0 && <option disabled>Aucune commande livrée ou terminée disponible</option>}
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} - {order.status} (Total: {order.total} DT)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Facture
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Échéance
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Taux TVA (%)
            </label>
            <input
              type="number"
              value={vatRate}
              onChange={(e) => setVatRate(Number(e.target.value))}
              placeholder="Ex: 19"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:bg-indigo-400"
            >
              {loading ? 'Création...' : 'Générer Facture'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceModal;
