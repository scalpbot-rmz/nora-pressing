'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { useNoraStore } from '@/lib/store';
import {
  formatFCFA,
  formatDateFR,
  getTreatmentStatusLabel,
  getTreatmentStatusColor,
  getPaymentStatusLabel,
  getPaymentStatusColor,
} from '@/lib/utils';
import { TreatmentStatus } from '@/types';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Download,
  Share2,
  Printer,
  ArrowLeft,
  Phone,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldAlert,
  QrCode,
  DollarSign,
} from 'lucide-react';
import {
  generateInvoicePDF,
  downloadPDF,
  printPDF,
  shareOnWhatsApp,
} from '@/lib/pdf-generator';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { orders, pressing, updateOrderStatus, updatePaymentStatus, isLoaded } = useNoraStore();

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [partialPayment, setPartialPayment] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const order = orders.find((o) => o.id === resolvedParams.id);

  useEffect(() => {
    if (order && pressing) {
      const targetPhone = (pressing.phone_secondary || pressing.phone_primary).replace(/[^0-9]/g, '');
      const waMessage = encodeURIComponent(
        `Bonjour, je vous contacte concernant ma commande ${order.invoice_number}`
      );
      const waUrl = `https://wa.me/${targetPhone}?text=${waMessage}`;

      QRCode.toDataURL(waUrl, { margin: 1, width: 140 })
        .then((url) => setQrDataUrl(url))
        .catch(console.error);
    }
  }, [order, pressing]);

  if (!isLoaded) return null;

  if (!order) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Commande introuvable</h2>
        <Link href="/dashboard/orders">
          <Button variant="outline">Retour aux commandes</Button>
        </Link>
      </div>
    );
  }

  const isPaid = order.remaining_amount <= 0 || order.payment_status === 'paid';

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const pdfBytes = await generateInvoicePDF(order, pressing);
      downloadPDF(pdfBytes, `Facture_${order.invoice_number}.pdf`);
    } catch (err) {
      console.error('Erreur génération PDF:', err);
      alert('Impossible de générer le PDF. Vérifiez votre connexion et réessayez.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = async () => {
    if (isPrinting) return;
    setIsPrinting(true);
    try {
      const pdfBytes = await generateInvoicePDF(order, pressing);
      printPDF(pdfBytes);
    } catch (err) {
      console.error('Erreur impression PDF:', err);
      alert('Impossible d’imprimer le PDF. Essayez de télécharger le fichier à la place.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleWhatsApp = () => {
    shareOnWhatsApp(order, pressing);
  };

  const handleRegisterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (partialPayment > 0) {
      updatePaymentStatus(order.id, order.amount_paid + Number(partialPayment));
      setPartialPayment(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* En-tête + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/orders">
            <button className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Facture {order.invoice_number}
            </h1>
            <p className="text-xs text-slate-500">
              Enregistrée le {formatDateFR(order.created_at)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            onClick={handleDownload}
            disabled={isDownloading}
            className="gap-1.5 shadow-md"
          >
            {isDownloading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Génération...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Télécharger PDF</span>
              </>
            )}
          </Button>

          <Button variant="accent" onClick={handleWhatsApp} className="gap-1.5 shadow-md">
            <Share2 className="w-4 h-4" />
            <span>Partager WhatsApp</span>
          </Button>

          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={isPrinting}
            className="gap-1.5"
          >
            {isPrinting ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-400/40 border-t-slate-600 rounded-full animate-spin" />
                <span>Préparation...</span>
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                <span>Imprimer</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* APERÇU FIDÈLE DU DESIGN DE LA FACTURE CLIENT */}
      <Card className="bg-white border-2 border-slate-200 shadow-xl overflow-hidden max-w-md mx-auto">
        <div className="p-6 space-y-5">
          {/* Header Pressing */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div>
              {pressing.logo_url ? (
                <img
                  src={pressing.logo_url}
                  alt="Logo"
                  className="w-14 h-14 rounded-xl object-contain ring-1 ring-slate-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-[#0F172A] text-white font-black flex items-center justify-center text-lg">
                  N
                </div>
              )}
            </div>

            <div className="text-right space-y-0.5">
              <h2 className="font-bold text-base text-slate-900 tracking-wide uppercase">
                {pressing.name}
              </h2>
              <p className="text-xs text-slate-500">
                Tél : {pressing.phone_primary}
              </p>
              {pressing.phone_secondary && (
                <p className="text-xs text-slate-400">SAV : {pressing.phone_secondary}</p>
              )}
              {pressing.address && (
                <p className="text-[11px] text-slate-400">{pressing.address}</p>
              )}
            </div>
          </div>

          {/* Numéro & Infos Client */}
          <div className="bg-slate-50 p-3.5 rounded-xl space-y-2 border border-slate-100">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#2563EB]">FACTURE N° {order.invoice_number}</span>
              <span className="text-slate-500">Date: {formatDateFR(order.created_at)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 text-xs">
              <p className="font-bold text-slate-900">{order.customer_name || 'Client Passage'}</p>
              <p className="text-slate-600">Tél : {order.customer_phone}</p>
              {order.customer_address && (
                <p className="text-slate-400">Quartier/Adresse : {order.customer_address}</p>
              )}
            </div>
          </div>

          {/* Tableau des prestations */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Prestations & Services
            </h3>
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold">
                <tr>
                  <th className="p-2 text-left">Service</th>
                  <th className="p-2 text-center">Qté</th>
                  <th className="p-2 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-2 font-medium text-slate-900">{order.offer_name}</td>
                  <td className="p-2 text-center font-bold text-slate-700">
                    {order.billing_type === 'kg' ? `${order.quantity} kg` : `${order.quantity} u`}
                  </td>
                  <td className="p-2 text-right font-bold text-slate-900">
                    {formatFCFA(order.gross_amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Ventilation Financière */}
          <div className="border-t border-slate-200 pt-3 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Total Prestations</span>
              <span>{formatFCFA(order.gross_amount)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Frais de ramassage</span>
              <span>{formatFCFA(order.pickup_fee || 0)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Frais de livraison</span>
              <span>{formatFCFA(order.delivery_fee || 0)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Montant payé</span>
              <span className="font-semibold text-[#16A34A]">{formatFCFA(order.amount_paid || 0)}</span>
            </div>

            <div className={`flex justify-between p-2.5 rounded-xl font-bold border ${isPaid ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-rose-50 text-rose-900 border-rose-300'}`}>
              <span>RESTE À PAYER</span>
              <span className="text-sm font-black">{formatFCFA(order.remaining_amount)}</span>
            </div>
          </div>

          {/* Badge Statut */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-500 font-medium">Statut de Règlement :</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${isPaid ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'}`}>
              {isPaid ? 'RÉGLÉ ✅' : 'NON RÉGLÉ ❌'}
            </span>
          </div>

          {/* QR Code WhatsApp Direct */}
          {qrDataUrl && (
            <div className="text-center pt-2">
              <img src={qrDataUrl} alt="QR Code WhatsApp" className="w-24 h-24 mx-auto" />
              <p className="text-[10px] text-slate-400 mt-1">Scannez pour contacter le Service Client WhatsApp</p>
            </div>
          )}

          <div className="text-center pt-3 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-800">
              {pressing.thank_you_message || 'Merci pour votre confiance !'}
            </p>
          </div>
        </div>
      </Card>

      {/* SECTION ENREGISTREMENT DE RÈGLEMENTS */}
      {!isPaid && (
        <Card className="bg-amber-50/70 border-amber-200">
          <CardBody className="p-5 space-y-3">
            <h3 className="font-bold text-amber-900 text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-700" />
              Enregistrer un Règlement / Versement Client
            </h3>

            <form onSubmit={handleRegisterPayment} className="flex gap-3">
              <Input
                type="number"
                placeholder="Montant du versement (FCFA)"
                value={partialPayment || ''}
                onChange={(e) => setPartialPayment(parseFloat(e.target.value) || 0)}
              />
              <Button type="submit" variant="accent" className="shrink-0 font-bold">
                Valider Versement
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      {/* SECTION INTERNE DU PRESSING */}
      <Card className="bg-[#0F172A] text-white border-none shadow-xl">
        <CardHeader className="border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">
              Détails Internes & Marges du Pressing
            </h3>
          </div>
          <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-lg">
            Privé Admin
          </span>
        </CardHeader>
        <CardBody className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6">
          <div>
            <span className="text-xs text-slate-400 block">Total Charges Logistiques</span>
            <p className="text-lg font-bold text-slate-200">{formatFCFA(order.total_expenses)}</p>
          </div>

          <div>
            <span className="text-xs text-slate-400 block">Bénéfice Net Pressing</span>
            <p className="text-lg font-bold text-[#16A34A]">{formatFCFA(order.net_profit)}</p>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Changer Statut Traitement</span>
            <select
              value={order.treatment_status}
              onChange={(e) => updateOrderStatus(order.id, e.target.value as TreatmentStatus)}
              className="w-full bg-slate-800 text-white border border-slate-700 text-xs font-bold p-2.5 rounded-xl focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="received">Reçu</option>
              <option value="washing">En lavage</option>
              <option value="ironing">En repassage</option>
              <option value="ready">Prêt</option>
              <option value="delivered">Livré</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
