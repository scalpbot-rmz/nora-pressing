'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useNoraStore } from '@/lib/store';
import {
  formatFCFA,
  formatDateFR,
  getTreatmentStatusLabel,
  getTreatmentStatusColor,
  getPaymentStatusLabel,
  getPaymentStatusColor,
} from '@/lib/utils';
import { TreatmentStatus, PaymentStatus } from '@/types';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  PlusCircle,
  Eye,
  FileText,
  Trash2,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  Printer,
  Download,
} from 'lucide-react';
import { generateInvoicePDF, downloadPDF, printPDF } from '@/lib/pdf-generator';

export default function OrdersPage() {
  const { orders, pressing, updateOrderStatus, updatePaymentStatus, deleteOrder, isLoaded } = useNoraStore();

  const [search, setSearch] = useState('');
  const [treatmentFilter, setTreatmentFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  if (!isLoaded) return null;

  // Filtrage des commandes
  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone.includes(search) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(search.toLowerCase()));

    const matchTreatment = treatmentFilter === 'all' || o.treatment_status === treatmentFilter;
    const matchPayment = paymentFilter === 'all' || o.payment_status === paymentFilter;

    return matchSearch && matchTreatment && matchPayment;
  });

  const handleDownloadInvoice = async (order: any) => {
    const pdfBytes = await generateInvoicePDF(order, pressing);
    downloadPDF(pdfBytes, `Facture_${order.invoice_number}.pdf`);
  };

  const handlePrintInvoice = async (order: any) => {
    const pdfBytes = await generateInvoicePDF(order, pressing);
    printPDF(pdfBytes);
  };

  return (
    <div className="space-y-6">
      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestion des Commandes</h1>
          <p className="text-sm text-slate-500">
            Recherche, suivi du traitement en atelier et statut de paiement
          </p>
        </div>

        <Link href="/dashboard/orders/new">
          <Button variant="secondary" className="gap-2 shadow-md">
            <PlusCircle className="w-5 h-5" />
            <span>Nouvelle Commande</span>
          </Button>
        </Link>
      </div>

      {/* Barre de Recherche et Filtres */}
      <Card>
        <CardBody className="p-4 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
          {/* Recherche */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par téléphone, nom de client ou N° facture..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          {/* Filtre Statut de traitement */}
          <select
            value={treatmentFilter}
            onChange={(e) => setTreatmentFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          >
            <option value="all">Tous les traitements</option>
            <option value="received">Reçu</option>
            <option value="washing">En lavage</option>
            <option value="ironing">En repassage</option>
            <option value="ready">Prêt</option>
            <option value="delivered">Livré</option>
            <option value="cancelled">Annulé</option>
          </select>

          {/* Filtre Statut de paiement */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          >
            <option value="all">Tous les paiements</option>
            <option value="paid">Réglé</option>
            <option value="unpaid">Non réglé</option>
          </select>
        </CardBody>
      </Card>

      {/* Tableau / Liste des commandes */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-100/70 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-4">N° Facture</th>
                <th className="p-4">Client</th>
                <th className="p-4">Prestation</th>
                <th className="p-4">Montant</th>
                <th className="p-4">Traitement</th>
                <th className="p-4">Paiement</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Aucune commande trouvée
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900">
                      <Link href={`/dashboard/orders/${order.id}`} className="hover:text-[#2563EB] hover:underline">
                        {order.invoice_number}
                      </Link>
                      <span className="block text-xs font-normal text-slate-400">
                        {formatDateFR(order.created_at)}
                      </span>
                    </td>

                    <td className="p-4">
                      <p className="font-semibold text-slate-900">{order.customer_name || 'Client'}</p>
                      <a href={`tel:${order.customer_phone}`} className="text-xs text-[#2563EB] flex items-center gap-1 hover:underline">
                        <Phone className="w-3 h-3" />
                        {order.customer_phone}
                      </a>
                    </td>

                    <td className="p-4">
                      <p className="font-medium text-slate-800">{order.offer_name || 'Prestation'}</p>
                      <span className="text-xs text-slate-500">
                        {order.billing_type === 'kg' ? `${order.quantity} kg` : `${order.quantity} unité(s)`}
                      </span>
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-900">{formatFCFA(order.gross_amount)}</p>
                      {order.remaining_amount > 0 && (
                        <span className="text-xs font-semibold text-rose-600">
                          Reste: {formatFCFA(order.remaining_amount)}
                        </span>
                      )}
                    </td>

                    {/* Selecteur rapide de Statut de Traitement */}
                    <td className="p-4">
                      <select
                        value={order.treatment_status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as TreatmentStatus)}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border focus:outline-none cursor-pointer ${getTreatmentStatusColor(
                          order.treatment_status
                        )}`}
                      >
                        <option value="received">Reçu</option>
                        <option value="washing">En lavage</option>
                        <option value="ironing">En repassage</option>
                        <option value="ready">Prêt</option>
                        <option value="delivered">Livré</option>
                        <option value="cancelled">Annulé</option>
                      </select>
                    </td>

                    {/* Toggle rapide Statut de Paiement */}
                    <td className="p-4">
                      <button
                        onClick={() =>
                          updatePaymentStatus(
                            order.id,
                            order.payment_status === 'paid' ? 0 : order.total_amount
                          )
                        }
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all ${getPaymentStatusColor(
                          order.payment_status
                        )}`}
                      >
                        {getPaymentStatusLabel(order.payment_status)}
                      </button>
                    </td>

                    {/* Boutons d'actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/dashboard/orders/${order.id}`}>
                          <button
                            title="Voir la commande"
                            className="p-1.5 text-slate-600 hover:text-[#2563EB] hover:bg-slate-100 rounded-lg"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>

                        <button
                          onClick={() => handleDownloadInvoice(order)}
                          title="Télécharger la facture PDF"
                          className="p-1.5 text-slate-600 hover:text-[#16A34A] hover:bg-slate-100 rounded-lg"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handlePrintInvoice(order)}
                          title="Imprimer"
                          className="p-1.5 text-slate-600 hover:text-[#0F172A] hover:bg-slate-100 rounded-lg"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Supprimer la commande ${order.invoice_number} ?`)) {
                              deleteOrder(order.id);
                            }
                          }}
                          title="Supprimer"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
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
      </Card>
    </div>
  );
}
