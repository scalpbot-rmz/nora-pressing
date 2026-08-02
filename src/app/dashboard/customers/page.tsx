'use client';

import { useState, useMemo } from 'react';
import { useNoraStore } from '@/lib/store';
import { formatFCFA, formatDateFR } from '@/lib/utils';
import { Customer } from '@/types';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  Users, Phone, MapPin, ShoppingBag, Search, History,
  Pencil, Trash2, X, Check, ChevronDown, ChevronUp,
  UserPlus, AlertTriangle, Archive,
} from 'lucide-react';

// ─── Modale édition client ──────────────────────────────────────────────────
function EditModal({ customer, onSave, onClose }: {
  customer: Customer;
  onSave: (data: { name: string; phone: string; address: string }) => void;
  onClose: () => void;
}) {
  const [name,    setName]    = useState(customer.name || '');
  const [phone,   setPhone]   = useState(customer.phone);
  const [address, setAddress] = useState(customer.address || '');

  const inputCls = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]";

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 flex items-center gap-2"><Pencil className="w-4 h-4 text-[#2563EB]" />Modifier le client</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nom complet</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du client" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Téléphone <span className="text-rose-500">*</span></label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Adresse / Quartier</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Quartier, rue..." className={inputCls} />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
          <Button variant="secondary" className="flex-1 gap-2" onClick={() => { if (phone.trim()) onSave({ name, phone, address }); }}>
            <Check className="w-4 h-4" />Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Modale confirmation suppression ───────────────────────────────────────
function DeleteModal({ customer, ordersCount, onConfirm, onClose }: {
  customer: Customer; ordersCount: number;
  onConfirm: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-up">
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Supprimer ce client ?</h3>
              <p className="text-sm text-slate-500 mt-1">
                <strong>{customer.name || customer.phone}</strong> sera supprimé de la liste des clients.
              </p>
            </div>
          </div>

          {ordersCount > 0 && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <Archive className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">
                <strong>{ordersCount} commande(s)</strong> associée(s) à ce client.
                Elles seront <strong>conservées</strong> pour préserver l'historique, les statistiques et les factures.
                Seule la fiche client sera supprimée.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button variant="danger" className="flex-1 gap-2" onClick={onConfirm}>
              <Trash2 className="w-4 h-4" />Supprimer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modale historique ──────────────────────────────────────────────────────
function HistoryModal({ customer, orders, onClose }: {
  customer: Customer; orders: any[]; onClose: () => void;
}) {
  const total = orders.reduce((s, o) => s + o.total_amount, 0);
  const paid  = orders.reduce((s, o) => s + o.amount_paid,  0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fade-up">
        {/* En-tête */}
        <div className="px-6 py-4 bg-[#0F172A] text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">{customer.name || 'Client'}</h3>
            <p className="text-xs text-slate-400">{customer.phone} · {orders.length} commande(s) · {formatFCFA(total)} au total</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Résumé financier */}
        {orders.length > 0 && (
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
            {[
              { label: 'Total facturé',  value: formatFCFA(total), color: 'text-slate-900' },
              { label: 'Montant réglé',  value: formatFCFA(paid),  color: 'text-emerald-600' },
              { label: 'Reste à payer',  value: formatFCFA(total - paid), color: total - paid > 0 ? 'text-rose-600' : 'text-emerald-600' },
            ].map((r) => (
              <div key={r.label} className="p-4 text-center">
                <p className="text-xs text-slate-500 mb-1">{r.label}</p>
                <p className={`text-sm font-black ${r.color}`}>{r.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Liste commandes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {orders.length === 0 ? (
            <p className="text-center text-slate-400 py-12 text-sm">Aucune commande enregistrée pour ce client</p>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{o.invoice_number}</p>
                  <p className="text-xs text-slate-400">{formatDateFR(o.created_at)}</p>
                  <p className="text-xs text-[#2563EB] font-medium mt-0.5">{o.offer_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 text-sm">{formatFCFA(o.total_amount)}</p>
                  <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-lg ${o.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {o.payment_status === 'paid' ? 'Réglé' : 'Non réglé'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function CustomersPage() {
  const { customers, orders, updateCustomer, deleteCustomer, isLoaded } = useNoraStore();
  const { success, error } = useToast();

  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState<'all' | 'active' | 'inactive' | 'unpaid'>('all');
  const [sortBy,   setSortBy]   = useState<'name' | 'total' | 'orders' | 'recent'>('recent');

  const [editId,   setEditId]   = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [histId,   setHistId]   = useState<string | null>(null);

  const getOrders = (cust: Customer) =>
    orders.filter((o) => o.customer_id === cust.id || o.customer_phone === cust.phone);

  const hasUnpaid = (cust: Customer) =>
    getOrders(cust).some((o) => o.remaining_amount > 0);

  // Filtre + tri — hook déclaré AVANT le return conditionnel (Rules of Hooks)
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers
      .filter((c) => {
        const matchQ = !q || c.phone.includes(q) || (c.name?.toLowerCase().includes(q)) || (c.address?.toLowerCase().includes(q));
        const matchF =
          filter === 'all'      ? true :
          filter === 'active'   ? c.orders_count > 0 :
          filter === 'inactive' ? c.orders_count === 0 :
          filter === 'unpaid'   ? hasUnpaid(c) : true;
        return matchQ && matchF;
      })
      .sort((a, b) => {
        if (sortBy === 'name')   return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'total')  return b.total_spent - a.total_spent;
        if (sortBy === 'orders') return b.orders_count - a.orders_count;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [customers, orders, search, filter, sortBy]); // eslint-disable-line

  // Guard — après tous les hooks
  if (!isLoaded) return null;

  const handleEdit = (id: string, data: { name: string; phone: string; address: string }) => {
    updateCustomer(id, data);
    setEditId(null);
    success('Client modifié', 'Les informations ont été mises à jour.');
  };

  const handleDelete = (id: string) => {
    deleteCustomer(id);
    setDeleteId(null);
    success('Client supprimé', 'La fiche client a été retirée. Les commandes sont conservées.');
  };

  const editCust   = customers.find((c) => c.id === editId);
  const deleteCust = customers.find((c) => c.id === deleteId);
  const histCust   = customers.find((c) => c.id === histId);

  return (
    <div className="space-y-6">

      {/* ─── En-tête ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Clients <Users className="w-6 h-6 text-[#2563EB]" />
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">{customers.length} client(s) · Fichier complet et historique des commandes</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-full">{customers.filter(c => c.orders_count > 0).length} actifs</span>
          <span className="bg-rose-100 text-rose-600 font-bold px-3 py-1.5 rounded-full">{customers.filter(c => hasUnpaid(c)).length} impayés</span>
        </div>
      </div>

      {/* ─── Recherche + filtres ───────────────────────────────────── */}
      <Card>
        <CardBody className="p-4 space-y-3">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Nom, téléphone ou adresse..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          {/* Filtres + tri */}
          <div className="flex flex-wrap gap-2">
            {[['all','Tous'],['active','Actifs'],['inactive','Inactifs'],['unpaid','Impayés']].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${filter === v ? 'bg-[#0F172A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {l}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-slate-400">Trier par :</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#2563EB]">
                <option value="recent">Date d'ajout</option>
                <option value="name">Nom</option>
                <option value="total">Total dépensé</option>
                <option value="orders">Nb commandes</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ─── Résultats ─────────────────────────────────────────────── */}
      <p className="text-xs text-slate-400 font-medium">{filtered.length} résultat(s)</p>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Aucun client trouvé</p>
          <p className="text-xs text-slate-400 mt-1">Modifiez la recherche ou les filtres</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((customer) => {
          const cOrders   = getOrders(customer);
          const unpaid    = cOrders.reduce((s, o) => s + o.remaining_amount, 0);
          const isUnpaid  = unpaid > 0;

          return (
            <Card key={customer.id} className={`hover:border-[#2563EB] transition-all ${isUnpaid ? 'border-rose-200' : ''}`}>
              <CardBody className="p-5 space-y-4">
                {/* Ligne supérieure */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xs font-black shrink-0">
                        {(customer.name || 'C')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm truncate">{customer.name || 'Client sans nom'}</h3>
                        <a href={`tel:${customer.phone}`} className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1">
                          <Phone className="w-3 h-3" />{customer.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{customer.orders_count} cmd</span>
                    {isUnpaid && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded-full">impayé</span>}
                  </div>
                </div>

                {customer.address && (
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />{customer.address}
                  </p>
                )}

                {/* Financier */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Total dépensé</p>
                    <p className="text-sm font-black text-[#16A34A]">{formatFCFA(customer.total_spent)}</p>
                  </div>
                  {isUnpaid && (
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Reste dû</p>
                      <p className="text-sm font-black text-rose-600">{formatFCFA(unpaid)}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setHistId(customer.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                    <History className="w-3.5 h-3.5" />Historique
                  </button>
                  <button onClick={() => setEditId(customer.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#2563EB] bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
                    <Pencil className="w-3.5 h-3.5" />Modifier
                  </button>
                  <button onClick={() => setDeleteId(customer.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* ─── Modales ──────────────────────────────────────────────────── */}
      {editCust && (
        <EditModal
          customer={editCust}
          onSave={(data) => handleEdit(editCust.id, data)}
          onClose={() => setEditId(null)}
        />
      )}

      {deleteCust && (
        <DeleteModal
          customer={deleteCust}
          ordersCount={getOrders(deleteCust).length}
          onConfirm={() => handleDelete(deleteCust.id)}
          onClose={() => setDeleteId(null)}
        />
      )}

      {histCust && (
        <HistoryModal
          customer={histCust}
          orders={getOrders(histCust).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())}
          onClose={() => setHistId(null)}
        />
      )}
    </div>
  );
}
