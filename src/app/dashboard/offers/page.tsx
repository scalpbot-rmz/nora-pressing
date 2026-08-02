'use client';

import { useState } from 'react';
import { useNoraStore } from '@/lib/store';
import { formatFCFA } from '@/lib/utils';
import { BillingType, Offer } from '@/types';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tag, PlusCircle, Trash2, Edit3, Clock, Sparkles } from 'lucide-react';

export default function OffersPage() {
  const { offers, addOffer, updateOffer, deleteOffer, isLoaded } = useNoraStore();

  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
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
            Gestion des Offres & Tarifs
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

      {/* Modal Formulaire Offre */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">
              {editingId ? 'Modifier l\'Offre' : 'Créer une Nouvelle Offre'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nom de l'offre*"
                placeholder="ex: Lavage + Repassage"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Type de facturation
                </label>
                <select
                  value={billingType}
                  onChange={(e) => setBillingType(e.target.value as BillingType)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2563EB]"
                >
                  <option value="kg">Au Kilogramme (kg)</option>
                  <option value="unit">À l'Unité</option>
                </select>
              </div>

              <Input
                type="number"
                label="Prix par défaut (FCFA)*"
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
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Détails du service..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsOpenModal(false)}>
                  Annuler
                </Button>
                <Button type="submit" variant="secondary">
                  Enregistrer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
