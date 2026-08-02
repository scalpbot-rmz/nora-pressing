'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNoraStore } from '@/lib/store';
import { formatFCFA } from '@/lib/utils';
import { BillingType, PaymentStatus, TreatmentStatus, Customer } from '@/types';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  User, Tag, Calculator, Truck, FileCheck, Sparkles,
  ChevronDown, ChevronUp, Lock, Droplets, Zap, Wrench,
  Users, Package, TrendingUp, TrendingDown, CheckCircle2,
  RotateCcw, Search, UserPlus, X,
} from 'lucide-react';

// ─── Champ commun ──────────────────────────────────────────────────────────
const inputCls = "w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-shadow";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function NumInput({ label, value, onChange, min = 0, step = 100 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; step?: number;
}) {
  return (
    <Field label={label}>
      <input type="number" min={min} step={step} defaultValue={value}
        onBlur={(e) => onChange(parseFloat(e.target.value) || 0)} className={inputCls} />
    </Field>
  );
}

// ─── Autocomplétion client ──────────────────────────────────────────────────
function CustomerSearch({ customers, onSelect, onNew }: {
  customers: Customer[];
  onSelect: (c: Customer) => void;
  onNew: () => void;
}) {
  const [query, setQuery]       = useState('');
  const [open, setOpen]         = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.length >= 1
    ? customers.filter((c) =>
        c.phone.includes(query) ||
        (c.name?.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 8)
    : [];

  // Fermer au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pick = (c: Customer) => {
    setSelected(c);
    setQuery(c.name ? `${c.name} — ${c.phone}` : c.phone);
    setOpen(false);
    onSelect(c);
  };

  const clear = () => {
    setSelected(null);
    setQuery('');
    onNew();
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Chercher par nom ou téléphone..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setSelected(null); }}
          onFocus={() => { if (query.length >= 1) setOpen(true); }}
          className={`${inputCls} pl-10 pr-9`}
        />
        {selected && (
          <button type="button" onClick={clear}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown résultats */}
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-fade-up">
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => pick(c)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                {(c.name || 'C')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{c.name || 'Client'}</p>
                <p className="text-xs text-slate-400">{c.phone} · {c.orders_count} commande(s)</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 shrink-0">{formatFCFA(c.total_spent)}</span>
            </button>
          ))}
        </div>
      )}

      {/* Aucun résultat → proposer création */}
      {open && query.length >= 2 && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-fade-up">
          <button type="button" onClick={() => { setOpen(false); onNew(); }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-sm text-slate-700">
            <UserPlus className="w-4 h-4 text-[#2563EB]" />
            <span>Créer un nouveau client <strong>« {query} »</strong></span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Valeurs initiales ─────────────────────────────────────────────────────
const INIT = {
  customerPhone: '', customerName: '', customerAddress: '', customerId: '',
  selectedOfferId: '', billingType: 'kg' as BillingType,
  quantity: 1, unitPrice: 1200,
  pickupFee: 0, deliveryFee: 0, amountPaid: 0, internalNotes: '',
  lessive: 300, javel: 100, assouplissant: 100, amidon: 50,
  electricite: 150, eau: 100,
  usureMachine: 200, usureRepassage: 50,
  mainOeuvre: 500, coutRamassage: 0, coutLivraison: 0,
  emballage: 50, autresCharges: 0,
};

export default function NewOrderPage() {
  const router = useRouter();
  const { offers, customers, addOrder, isLoaded } = useNoraStore();
  const { success, error } = useToast();

  const [form, setForm]         = useState(INIT);
  const [showOwner, setShowOwner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [newClientMode, setNewClientMode] = useState(false);

  const set = (key: keyof typeof INIT) => (val: any) =>
    setForm((p) => ({ ...p, [key]: val }));

  // Offre par défaut
  useEffect(() => {
    if (offers.length > 0 && !form.selectedOfferId) {
      const d = offers[0];
      setForm((p) => ({ ...p, selectedOfferId: d.id, billingType: d.billing_type, unitPrice: d.default_price }));
    }
  }, [offers]); // eslint-disable-line

  const handleOfferChange = useCallback((id: string) => {
    const o = offers.find((x) => x.id === id);
    setForm((p) => ({ ...p, selectedOfferId: id, billingType: o?.billing_type ?? p.billingType, unitPrice: o?.default_price ?? p.unitPrice }));
  }, [offers]);

  // Sélection d'un client existant
  const handleSelectCustomer = useCallback((c: Customer) => {
    setForm((p) => ({
      ...p,
      customerId: c.id,
      customerPhone: c.phone,
      customerName: c.name || '',
      customerAddress: c.address || '',
    }));
    setNewClientMode(false);
  }, []);

  // Nouveau client
  const handleNewClient = useCallback(() => {
    setForm((p) => ({ ...p, customerId: '', customerPhone: '', customerName: '', customerAddress: '' }));
    setNewClientMode(true);
  }, []);

  // Calculs
  const gross     = form.quantity * form.unitPrice;
  const total     = gross + form.pickupFee + form.deliveryFee;
  const remaining = Math.max(0, total - form.amountPaid);
  const payStatus: PaymentStatus = remaining <= 0 ? 'paid' : 'unpaid';

  const totProduits   = form.lessive + form.javel + form.assouplissant + form.amidon;
  const totEnergie    = form.electricite + form.eau;
  const totEquipement = form.usureMachine + form.usureRepassage;
  const totTransport  = form.coutRamassage + form.coutLivraison;
  const totalExp      = totProduits + totEnergie + totEquipement + form.mainOeuvre + totTransport + form.emballage + form.autresCharges;
  const netProfit     = total - totalExp;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerPhone.trim()) { error('Téléphone requis', 'Saisissez le numéro du client.'); return; }
    setIsSubmitting(true);
    try {
      const offer = offers.find((o) => o.id === form.selectedOfferId);
      addOrder({
        customer_id: form.customerId || undefined,
        customer_name: form.customerName || 'Client',
        customer_phone: form.customerPhone,
        customer_address: form.customerAddress,
        offer_id: form.selectedOfferId,
        offer_name: offer?.name ?? 'Prestation',
        billing_type: form.billingType,
        quantity: form.quantity, unit_price: form.unitPrice,
        gross_amount: gross, pickup_fee: form.pickupFee, delivery_fee: form.deliveryFee,
        total_amount: total, amount_paid: form.amountPaid, remaining_amount: remaining,
        product_cost: totProduits + totEnergie, equipment_cost: totEquipement,
        total_expenses: totalExp, net_profit: netProfit,
        payment_status: payStatus, treatment_status: 'received' as TreatmentStatus,
        internal_notes: form.internalNotes,
      });
      success('Commande enregistrée !', 'La facture a été créée avec succès.');
      setSubmitted(true);
      setTimeout(() => {
        setForm({ ...INIT, selectedOfferId: form.selectedOfferId, billingType: form.billingType, unitPrice: form.unitPrice });
        setSubmitted(false); setIsSubmitting(false); setNewClientMode(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 1500);
    } catch {
      error('Erreur', 'Une erreur est survenue. Réessayez.'); setIsSubmitting(false);
    }
  };

  if (!isLoaded) return null;

  const OWNER_SECTIONS = [
    { icon: <Droplets className="w-4 h-4 text-blue-400" />, title: 'Produits & Consommables', total: totProduits, color: 'text-blue-400',
      fields: [{ l: 'Lessive', k: 'lessive' as const }, { l: 'Javel', k: 'javel' as const }, { l: 'Assouplissant', k: 'assouplissant' as const }, { l: 'Amidon', k: 'amidon' as const }] },
    { icon: <Zap className="w-4 h-4 text-yellow-400" />, title: 'Énergie & Eau', total: totEnergie, color: 'text-yellow-400',
      fields: [{ l: 'Électricité', k: 'electricite' as const }, { l: 'Eau', k: 'eau' as const }] },
    { icon: <Wrench className="w-4 h-4 text-orange-400" />, title: 'Usure équipement', total: totEquipement, color: 'text-orange-400',
      fields: [{ l: 'Machine à laver', k: 'usureMachine' as const }, { l: 'Fer à repasser', k: 'usureRepassage' as const }] },
    { icon: <Users className="w-4 h-4 text-purple-400" />, title: "Main d'Œuvre", total: form.mainOeuvre, color: 'text-purple-400',
      fields: [{ l: "Coût main d'œuvre", k: 'mainOeuvre' as const }] },
    { icon: <Truck className="w-4 h-4 text-cyan-400" />, title: 'Transport réel', total: totTransport, color: 'text-cyan-400',
      fields: [{ l: 'Coût ramassage', k: 'coutRamassage' as const }, { l: 'Coût livraison', k: 'coutLivraison' as const }] },
    { icon: <Package className="w-4 h-4 text-green-400" />, title: 'Emballage & Autres', total: form.emballage + form.autresCharges, color: 'text-green-400',
      fields: [{ l: 'Emballage', k: 'emballage' as const }, { l: 'Autres', k: 'autresCharges' as const }] },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-16">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Nouvelle Commande <Sparkles className="w-5 h-5 text-[#2563EB]" />
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Saisie rapide · Calcul automatique · Génération de facture</p>
        </div>
        <button type="button" onClick={() => setForm({ ...INIT, selectedOfferId: form.selectedOfferId, billingType: form.billingType, unitPrice: form.unitPrice })}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {submitted && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl animate-fade-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-800">Commande enregistrée avec succès !</p>
            <p className="text-xs text-emerald-600">Le formulaire sera réinitialisé dans un instant.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ─── CLIENT ───────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="bg-slate-50 border-b border-slate-100 flex items-center gap-2 py-3">
            <User className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Client</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {/* Recherche client existant */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" />
                Rechercher un client existant
              </p>
              <CustomerSearch customers={customers} onSelect={handleSelectCustomer} onNew={handleNewClient} />
            </div>

            {/* Séparateur */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">ou saisir manuellement</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Champs client */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Téléphone" required>
                <input type="tel" placeholder="+237 6 XX XX XX XX"
                  value={form.customerPhone}
                  onChange={(e) => set('customerPhone')(e.target.value)}
                  required className={inputCls} />
              </Field>
              <Field label="Nom du client">
                <input type="text" placeholder="ex: Mme Amina Nsangou"
                  value={form.customerName}
                  onChange={(e) => set('customerName')(e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label="Quartier / Adresse">
                <input type="text" placeholder="ex: Akwa, Rue Joffre"
                  value={form.customerAddress}
                  onChange={(e) => set('customerAddress')(e.target.value)}
                  className={inputCls} />
              </Field>
            </div>

            {form.customerId && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Client existant sélectionné — ses données ont été remplies automatiquement.
              </div>
            )}
          </CardBody>
        </Card>

        {/* ─── PRESTATION ───────────────────────────────────────────── */}
        <Card>
          <CardHeader className="bg-slate-50 border-b border-slate-100 flex items-center gap-2 py-3">
            <Tag className="w-4 h-4 text-[#16A34A]" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Prestation & Tarification</h2>
          </CardHeader>
          <CardBody className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2 md:col-span-1">
              <Field label="Offre">
                <select value={form.selectedOfferId} onChange={(e) => handleOfferChange(e.target.value)} className={inputCls}>
                  {offers.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.default_price} / {o.billing_type})</option>)}
                </select>
              </Field>
            </div>
            <Field label="Facturation">
              <select value={form.billingType} onChange={(e) => set('billingType')(e.target.value as BillingType)} className={inputCls}>
                <option value="kg">Par kilogramme</option>
                <option value="unit">Par unité</option>
              </select>
            </Field>
            <Field label={form.billingType === 'kg' ? 'Poids (kg)' : 'Quantité (u)'}>
              <input type="number" min="0.5" step="0.5" value={form.quantity}
                onChange={(e) => set('quantity')(parseFloat(e.target.value) || 0)} className={inputCls} />
            </Field>
            <Field label="Prix unitaire (FCFA)">
              <input type="number" min="0" step="100" value={form.unitPrice}
                onChange={(e) => set('unitPrice')(parseFloat(e.target.value) || 0)} className={inputCls} />
            </Field>
          </CardBody>
        </Card>

        {/* ─── TRANSPORT & PAIEMENT ─────────────────────────────────── */}
        <Card>
          <CardHeader className="bg-slate-50 border-b border-slate-100 flex items-center gap-2 py-3">
            <Truck className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Transport & Paiement</h2>
          </CardHeader>
          <CardBody className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Frais ramassage (FCFA)">
              <input type="number" min="0" step="100" value={form.pickupFee}
                onChange={(e) => set('pickupFee')(parseFloat(e.target.value) || 0)} className={inputCls} />
            </Field>
            <Field label="Frais livraison (FCFA)">
              <input type="number" min="0" step="100" value={form.deliveryFee}
                onChange={(e) => set('deliveryFee')(parseFloat(e.target.value) || 0)} className={inputCls} />
            </Field>
            <Field label="Montant déjà payé (FCFA)">
              <input type="number" min="0" step="100" value={form.amountPaid}
                onChange={(e) => set('amountPaid')(parseFloat(e.target.value) || 0)} className={inputCls} />
            </Field>
          </CardBody>
        </Card>

        {/* ─── NOTES + CALCULATRICE ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2">
            <Card className="h-full">
              <CardHeader className="bg-slate-50 border-b border-slate-100 py-3">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Notes internes (atelier)</h2>
              </CardHeader>
              <CardBody>
                <textarea rows={4} placeholder="Instructions de traitement, état des articles, taches..."
                  value={form.internalNotes} onChange={(e) => set('internalNotes')(e.target.value)}
                  className={`${inputCls} resize-none`} />
              </CardBody>
            </Card>
          </div>
          <Card className="bg-[#0F172A] text-white border-none shadow-xl">
            <CardBody className="p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
                <Calculator className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Récapitulatif</h3>
              </div>
              <div className="space-y-2 text-sm flex-1">
                <div className="flex justify-between text-slate-400"><span>Prestations</span><span className="font-semibold text-white">{formatFCFA(gross)}</span></div>
                {form.pickupFee > 0 && <div className="flex justify-between text-xs text-slate-500"><span>+ Ramassage</span><span>{formatFCFA(form.pickupFee)}</span></div>}
                {form.deliveryFee > 0 && <div className="flex justify-between text-xs text-slate-500"><span>+ Livraison</span><span>{formatFCFA(form.deliveryFee)}</span></div>}
                <div className="flex justify-between border-t border-slate-700 pt-2 font-bold"><span className="text-slate-200">Total TTC</span><span className="text-lg text-white">{formatFCFA(total)}</span></div>
                <div className="flex justify-between text-xs text-emerald-400"><span>Payé</span><span className="font-semibold">{formatFCFA(form.amountPaid)}</span></div>
                <div className="flex justify-between border-t border-slate-700 pt-2">
                  <span className="font-bold text-slate-300">Reste à payer</span>
                  <span className={`font-black text-xl ${remaining <= 0 ? 'text-[#16A34A]' : 'text-rose-400'}`}>{formatFCFA(remaining)}</span>
                </div>
              </div>
              <Button type="submit" variant="accent" size="lg" className="w-full gap-2 font-bold shadow-lg" disabled={isSubmitting}>
                {isSubmitting
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Enregistrement...</span></>
                  : <><FileCheck className="w-5 h-5" /><span>Enregistrer</span></>
                }
              </Button>
            </CardBody>
          </Card>
        </div>

        {/* ─── SECTION PROPRIÉTAIRE ─────────────────────────────────── */}
        <div className="rounded-2xl border-2 border-dashed border-slate-300 overflow-hidden">
          <button type="button" onClick={() => setShowOwner((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 bg-slate-800 hover:bg-[#0F172A] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Lock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white">Section Propriétaire — Dépenses & Rentabilité</p>
                <p className="text-xs text-slate-400">Coûts réels · Non visible sur la facture client</p>
              </div>
            </div>
            {showOwner ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>

          {showOwner && (
            <div className="bg-slate-900 p-6 space-y-6 animate-fade-up">
              {OWNER_SECTIONS.map((s) => (
                <div key={s.title}>
                  <div className="flex items-center gap-2 mb-3">
                    {s.icon}
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{s.title}</h3>
                    <span className={`ml-auto text-xs font-bold ${s.color}`}>{formatFCFA(s.total)}</span>
                  </div>
                  <div className={`grid gap-3 ${s.fields.length === 1 ? 'grid-cols-1 max-w-xs' : 'grid-cols-2 md:grid-cols-4'}`}>
                    {s.fields.map(({ l, k }) => (
                      <NumInput key={k} label={l} value={form[k] as number} onChange={set(k)} />
                    ))}
                  </div>
                </div>
              ))}

              <div className="border-t border-slate-700 pt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-800 rounded-xl p-4 text-center"><p className="text-xs text-slate-400 mb-1">Revenu client</p><p className="text-xl font-black text-white">{formatFCFA(total)}</p></div>
                <div className="bg-rose-950/60 border border-rose-800 rounded-xl p-4 text-center"><p className="text-xs text-rose-400 mb-1">Total dépenses</p><p className="text-xl font-black text-rose-400">{formatFCFA(totalExp)}</p></div>
                <div className={`rounded-xl p-4 text-center border ${netProfit >= 0 ? 'bg-emerald-950/60 border-emerald-800' : 'bg-rose-950/60 border-rose-800'}`}>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {netProfit >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
                    <p className="text-xs text-slate-300">Bénéfice net</p>
                  </div>
                  <p className={`text-xl font-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatFCFA(netProfit)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

      </form>
    </div>
  );
}
