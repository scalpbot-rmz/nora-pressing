import { Pressing, Offer, Customer, Order, Expense } from '@/types';

/**
 * Valeurs initiales réelles pour la production :
 * 0 client, 0 commande, 0 dépense pré-remplie.
 * L'utilisateur construit sa propre base de données.
 */

export const initialPressing: Pressing = {
  id: 'pressing-default',
  user_id: 'user-default',
  name: 'Mon Pressing',
  logo_url: '/assets/logo.jpg',
  phone_primary: '',
  phone_secondary: '',
  email: '',
  address: '',
  city: '',
  currency: 'FCFA',
  invoice_prefix: 'NOR',
  thank_you_message: 'Merci pour votre confiance !',
  created_at: new Date().toISOString(),
};

export const initialOffers: Offer[] = [];
export const initialCustomers: Customer[] = [];
export const initialOrders: Order[] = [];
export const initialExpenses: Expense[] = [];
