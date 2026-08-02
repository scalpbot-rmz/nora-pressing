import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFCFA(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 FCFA';
  const formatted = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} FCFA`;
}

export function formatDateFR(dateString?: string | Date): string {
  if (!dateString) return dayjs().format('DD/MM/YYYY');
  return dayjs(dateString).format('DD/MM/YYYY');
}

export function formatDateWithTimeFR(dateString?: string | Date): string {
  if (!dateString) return dayjs().format('DD/MM/YYYY à HH:mm');
  return dayjs(dateString).format('DD/MM/YYYY à HH:mm');
}

export function getTreatmentStatusLabel(status: string): string {
  switch (status) {
    case 'received':
      return 'Reçu';
    case 'washing':
      return 'En lavage';
    case 'ironing':
      return 'En repassage';
    case 'ready':
      return 'Prêt';
    case 'delivered':
      return 'Livré';
    case 'cancelled':
      return 'Annulé';
    default:
      return status;
  }
}

export function getTreatmentStatusColor(status: string): string {
  switch (status) {
    case 'received':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'washing':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'ironing':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'ready':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'delivered':
      return 'bg-slate-100 text-slate-800 border-slate-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getPaymentStatusLabel(status: string): string {
  return status === 'paid' ? 'Réglé' : 'Non réglé';
}

export function getPaymentStatusColor(status: string): string {
  return status === 'paid'
    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
    : 'bg-rose-100 text-rose-800 border-rose-300';
}

export function getExpenseCategoryLabel(category: string): string {
  switch (category) {
    case 'fuel':
      return 'Carburant';
    case 'water':
      return 'Eau';
    case 'electricity':
      return 'Électricité';
    case 'products':
      return 'Savon / Produits';
    case 'maintenance':
      return 'Réparation matériel';
    case 'salaries':
      return 'Salaires';
    case 'other':
      return 'Autres';
    default:
      return category;
  }
}
