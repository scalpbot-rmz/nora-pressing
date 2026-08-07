import Dexie, { Table } from 'dexie';
import { Pressing, Offer, Customer, Order, Expense } from '@/types';

export type SyncStatus = 'synced' | 'pending' | 'deleted';

export interface LocalRecord {
  _syncStatus?: SyncStatus;
  user_id?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export type LocalPressing = Pressing & LocalRecord;
export type LocalOffer = Offer & LocalRecord;
export type LocalCustomer = Customer & LocalRecord;
export type LocalOrder = Order & LocalRecord;
export type LocalExpense = Expense & LocalRecord;

export class NoraDatabase extends Dexie {
  pressings!: Table<LocalPressing, string>;
  offers!: Table<LocalOffer, string>;
  customers!: Table<LocalCustomer, string>;
  orders!: Table<LocalOrder, string>;
  expenses!: Table<LocalExpense, string>;

  constructor() {
    super('NoraPressingDB');

    this.version(1).stores({
      pressings: 'id, user_id, _syncStatus, updated_at',
      offers: 'id, pressing_id, user_id, _syncStatus, updated_at',
      customers: 'id, pressing_id, user_id, phone, _syncStatus, updated_at',
      orders: 'id, pressing_id, user_id, customer_id, invoice_number, payment_status, treatment_status, _syncStatus, updated_at, created_at',
      expenses: 'id, pressing_id, user_id, category, _syncStatus, updated_at, created_at',
    });
  }
}

export const db = new NoraDatabase();
