'use client';

import { useState } from 'react';
import { useNoraStore } from '@/lib/store';
import { formatFCFA, formatDateFR, getExpenseCategoryLabel } from '@/lib/utils';
import { ExpenseCategory } from '@/types';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Receipt, PlusCircle, Trash2, Calendar, DollarSign } from 'lucide-react';
import dayjs from 'dayjs';

export default function ExpensesPage() {
  const { expenses, addExpense, deleteExpense, isLoaded } = useNoraStore();

  const [isOpenModal, setIsOpenModal] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>('products');
  const [amount, setAmount] = useState<number>(5000);
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isLoaded) return null;

  const now = dayjs();

  // Totaux Journaliers, Hebdomadaires et Mensuels
  const totalJour = expenses
    .filter((e) => dayjs(e.expense_date).isSame(now, 'day'))
    .reduce((acc, e) => acc + e.amount, 0);

  const totalSemaine = expenses
    .filter((e) => dayjs(e.expense_date).isAfter(now.subtract(7, 'days')))
    .reduce((acc, e) => acc + e.amount, 0);

  const totalMois = expenses
    .filter((e) => dayjs(e.expense_date).isSame(now, 'month'))
    .reduce((acc, e) => acc + e.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    addExpense({
      category,
      amount: Number(amount),
      description,
      expense_date: expenseDate,
    });

    setIsOpenModal(false);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Gestion des Dépenses
            <Receipt className="w-6 h-6 text-rose-600" />
          </h1>
          <p className="text-sm text-slate-500">
            Suivi des charges d'exploitation, factures d'énergie, intrants et salaires
          </p>
        </div>

        <Button onClick={() => setIsOpenModal(true)} variant="danger" className="gap-2 shadow-md">
          <PlusCircle className="w-5 h-5" />
          <span>Enregistrer une Dépense</span>
        </Button>
      </div>

      {/* Cartes Totaux Dépenses */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-rose-500">
          <CardBody className="p-5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Dépenses du Jour</span>
            <p className="text-2xl font-black text-rose-600 mt-1">{formatFCFA(totalJour)}</p>
            <span className="text-xs text-slate-500">Aujourd'hui</span>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardBody className="p-5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Dépenses 7 Derniers Jours</span>
            <p className="text-2xl font-black text-amber-600 mt-1">{formatFCFA(totalSemaine)}</p>
            <span className="text-xs text-slate-500">Cette semaine</span>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardBody className="p-5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Dépenses du Mois</span>
            <p className="text-2xl font-black text-indigo-600 mt-1">{formatFCFA(totalMois)}</p>
            <span className="text-xs text-slate-500">Mois courant</span>
          </CardBody>
        </Card>
      </div>

      {/* Tableau des Dépenses */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-100/70 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Catégorie</th>
                <th className="p-4">Description</th>
                <th className="p-4">Montant</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Aucune dépense enregistrée
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-semibold text-slate-900">
                      {formatDateFR(expense.expense_date)}
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                        {getExpenseCategoryLabel(expense.category)}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">
                      {expense.description || '-'}
                    </td>
                    <td className="p-4 font-bold text-rose-600">
                      {formatFCFA(expense.amount)}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm('Supprimer cette dépense ?')) {
                            deleteExpense(expense.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Ajout Dépense */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">Enregistrer une Dépense</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Catégorie de la dépense*
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2563EB]"
                >
                  <option value="fuel">Carburant (Groupe / Livraison)</option>
                  <option value="water">Eau (Camwater)</option>
                  <option value="electricity">Électricité (Eneo)</option>
                  <option value="products">Savon / Produits chimiques</option>
                  <option value="maintenance">Réparation matériel / Machines</option>
                  <option value="salaries">Salaires & Avances personnel</option>
                  <option value="other">Autres dépenses</option>
                </select>
              </div>

              <Input
                type="number"
                label="Montant (FCFA)*"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                required
              />

              <Input
                type="date"
                label="Date de la dépense"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description / Remarque
                </label>
                <textarea
                  rows={2}
                  placeholder="Détails du paiement, référence facture..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsOpenModal(false)}>
                  Annuler
                </Button>
                <Button type="submit" variant="danger">
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
