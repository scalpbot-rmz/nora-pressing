'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNoraStore } from '@/lib/store';
import { formatFCFA } from '@/lib/utils';
import { BillingType, Offer } from '@/types';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tag, PlusCircle, Trash2, Edit3, Clock } from 'lucide-react';

// ─── Modal rendu via createPortal (s'échappe de tout contexte CSS) ───────────
function OfferModal({
  open,
  editingId,
  name, setName,
  billingType, setBillingType,
  defaultPrice, setDefaultPrice,
  estimatedDelay, setEstimatedDelay,
  description, setDescription,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editingId: string | null;
  name: string; setName: (v: string) => void;
  billingType: BillingType; setBillingType: (v: BillingType) => void;
  defaultPrice: number; setDefaultPrice: (v: number) => void;
  estimatedDelay: string; setEstimatedDelay: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!open || !mounted) return null;

  const modal = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15,23,42,0.65)',
        backdropFilter: 'blur(4px)',
        overflowY: 'auto',
        padding: '24px 16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          maxWidth: '480px',
          width: '100%',
          margin: '0 auto',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            {editingId ? "Modifier l'Offre" : 'Créer une Nouvelle Offre'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: '16px', lineHeight: 1 }}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={onSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Nom de l'offre*"
            placeholder="ex: Lavage + Repassage"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Type de facturation
            </label>
            <select
              value={billingType}
              onChange={(e) => setBillingType(e.target.value as BillingType)}
              style={{ width: '100%', padding: '10px 14px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '12px', fontSize: '14px', fontWeight: 500, outline: 'none' }}
            >
              <option value="kg">Au Kilogramme (kg)</option>
              <option value="unit">À l&apos;Unité</option>
            </select>
          </div>

          <Input
            type="number"
            label="Prix par défaut*"
            value={defaultPrice}
            onChange={(e) => setDefaultPrice(parseFloat(e.target.value) || 0)}
            required
          />

          <Input
            label="Délai estimé"
            placeholder="ex: 24h, 48h, 12h VIP"
            value={estimatedDelay}
            onChange={(e) => setEstimatedDelay(e.target.value)}
          />

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Détails du service..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '8px 14px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '12px', fontSize: '14px', resize: 'none', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" variant="secondary">
              Enregistrer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function OffersPage() {
  const { offers, addOffer, updateOffer, deleteOffer, isLoaded } = useNoraStore();

  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [billingType, setBillingType] = useState<BillingType>('kg');
  const [defaultPrice, setDefaultPrice] = useState<number>(1500);
  const [description, setDescription] = useState('');
  const [estimatedDelay, setEstimatedDelay] = useState('24h');

  if (!isLoaded) return null;

  const handleOpenNew = () => {
    setEditingId(null);
    setName('');
    setBillingType('kg');
    setDefaultPrice(1500);
    setDescription('');
    setEstimatedDelay('24h');
    setIsOpenModal(true);
  };

  const handleOpenEdit = (offer: Offer) => {
    setEditingId(offer.id);
    setName(offer.name);
    setBillingType(offer.billing_type);
    setDefaultPrice(offer.default_price);
    setDescription(offer.description || '');
    setEstimatedDelay(offer.estimated_delay || '24h');
    setIsOpenModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingId) {
      updateOffer(editingId, {
        name,
        billing_type: billingType,
        default_price: Number(defaultPrice),
        description,
        estimated_delay: estimatedDelay,
      });
    } else {
      addOffer({
        name,
        billing_type: billingType,
        default_price: Number(defaultPrice),
        description,
        estimated_delay: estimatedDelay,
      });
    }

    setIsOpenModal(false);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Gestion des Offres &amp; Tarifs
            <Tag className="w-6 h-6 text-[#16A34A]" />
          </h1>
          <p className="text-sm text-slate-500">
            Catalogue des prestations de lavage, repassage et nettoyages spéciaux
          </p>
        </div>

        <Button onClick={handleOpenNew} variant="accent" className="gap-2 shadow-md">
          <PlusCircle className="w-5 h-5" />
          <span>Ajouter une Offre</span>
        </Button>
      </div>

      {/* Grille des Offres */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers.map((offer) => (
          <Card key={offer.id} className="hover:border-[#2563EB] transition-all">
            <CardBody className="p-5 flex flex-col justify-between h-full space-y-4">
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-slate-900 text-base">{offer.name}</h3>
                  <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-[#2563EB] rounded-lg uppercase">
                    {offer.billing_type === 'kg' ? 'Au kg' : 'À l\'unité'}
                  </span>
                </div>

                <p className="text-2xl font-black text-[#0F172A] mt-2">
                  {formatFCFA(offer.default_price)}
                  <span className="text-xs text-slate-400 font-normal"> / {offer.billing_type}</span>
                </p>

                {offer.description && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{offer.description}</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Délai: {offer.estimated_delay}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(offer)}
                    className="p-1.5 text-slate-600 hover:text-[#2563EB] hover:bg-slate-100 rounded-lg"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Supprimer l'offre ${offer.name} ?`)) {
                        deleteOffer(offer.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Modal via Portal — s'affiche toujours au-dessus de tout */}
      <OfferModal
        open={isOpenModal}
        editingId={editingId}
        name={name} setName={setName}
        billingType={billingType} setBillingType={setBillingType}
        defaultPrice={defaultPrice} setDefaultPrice={setDefaultPrice}
        estimatedDelay={estimatedDelay} setEstimatedDelay={setEstimatedDelay}
        description={description} setDescription={setDescription}
        onClose={() => setIsOpenModal(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
