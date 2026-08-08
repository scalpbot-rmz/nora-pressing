'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Pressing, Offer, Customer, Order, Expense,
  TreatmentStatus, PaymentStatus,
} from '@/types';
import {
  initialPressing, initialOffers, initialCustomers,
  initialOrders, initialExpenses,
} from './mock-data';
import { db, LocalPressing } from './db';
import { useAuth } from '@/contexts/AuthContext';

export function useNoraStore() {
  const { user } = useAuth();
  const userId = user?.id || 'guest';

  // ─── Live queries Dexie (syntaxe correcte) ────────────────────────────
  const dbPressing = useLiveQuery(
    () => db.pressings.get(userId),
    [userId]
  );

  const dbOffers = useLiveQuery(
    () => db.offers.filter(o => !o.deleted_at).toArray(),
    []
  );

  const dbCustomers = useLiveQuery(
    () => db.customers.filter(c => !c.deleted_at).toArray(),
    []
  );

  const dbOrders = useLiveQuery(
    () => db.orders.filter(o => !o.deleted_at).toArray().then(rows =>
      rows.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    ),
    []
  );

  const dbExpenses = useLiveQuery(
    () => db.expenses.filter(e => !e.deleted_at).toArray().then(rows =>
      rows.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    ),
    []
  );

  const [isLoaded, setIsLoaded] = useState(false);

  // ─── Initialisation et migration depuis localStorage ──────────────────
  useEffect(() => {
    async function initDB() {
      try {
        const existingPressing = await db.pressings.get(userId);
        if (!existingPressing) {
          const legacyP  = localStorage.getItem('nora_pressing_data');
          const legacyOf = localStorage.getItem('nora_offers_data');
          const legacyCu = localStorage.getItem('nora_customers_data');
          const legacyOr = localStorage.getItem('nora_orders_data');
          const legacyEx = localStorage.getItem('nora_expenses_data');

          const pressingData: LocalPressing = legacyP
            ? { ...JSON.parse(legacyP), id: userId, user_id: userId, _syncStatus: 'pending' }
            : { ...initialPressing, id: userId, user_id: userId, name: user?.fullName || 'Mon Pressing', _syncStatus: 'pending' };

          await db.pressings.put(pressingData);

          if (legacyOf) {
            const offers = JSON.parse(legacyOf).map((o: any) => ({ ...o, user_id: userId, _syncStatus: 'pending' }));
            await db.offers.bulkPut(offers);
          }
          if (legacyCu) {
            const customers = JSON.parse(legacyCu).map((c: any) => ({ ...c, user_id: userId, _syncStatus: 'pending' }));
            await db.customers.bulkPut(customers);
          }
          if (legacyOr) {
            const orders = JSON.parse(legacyOr).map((or: any) => ({ ...or, user_id: userId, _syncStatus: 'pending' }));
            await db.orders.bulkPut(orders);
          }
          if (legacyEx) {
            const expenses = JSON.parse(legacyEx).map((e: any) => ({ ...e, user_id: userId, _syncStatus: 'pending' }));
            await db.expenses.bulkPut(expenses);
          }
        }
      } catch (err) {
        console.error('Erreur initialisation DB:', err);
      } finally {
        setIsLoaded(true);
      }
    }

    initDB();
  }, [userId, user?.fullName]);

  // ─── Fallbacks vers valeurs par défaut ────────────────────────────────
  const pressing: Pressing = dbPressing || {
    ...initialPressing,
    id: userId,
    user_id: userId,
    name: user?.fullName || 'Mon Pressing',
  };

  const offers: Offer[]       = dbOffers    || initialOffers;
  const customers: Customer[] = dbCustomers || initialCustomers;
  const orders: Order[]       = dbOrders    || initialOrders;
  const expenses: Expense[]   = dbExpenses  || initialExpenses;

  // ─── Sync helper ─────────────────────────────────────────────────────
  const triggerSync = () => {
    if (!user?.id || typeof navigator === 'undefined' || !navigator.onLine) return;
    try {
      import('@/lib/sync-engine').then(({ syncEngine }) => {
        syncEngine.syncAll(user.id).catch(console.warn);
      });
    } catch {}
  };

  // ── Pressing ──────────────────────────────────────────────────────────
  const updatePressing = async (updated: Partial<Pressing>) => {
    const updatedRecord: LocalPressing = {
      ...pressing,
      ...updated,
      id: userId,
      user_id: userId,
      updated_at: new Date().toISOString(),
      _syncStatus: 'pending',
    };
    await db.pressings.put(updatedRecord);
    triggerSync();
  };

  // ── Offres ────────────────────────────────────────────────────────────
  const addOffer = async (data: Omit<Offer, 'id' | 'pressing_id' | 'created_at'>) => {
    const now = new Date().toISOString();
    const offer: Offer = {
      ...data,
      id: `off-${Date.now()}`,
      pressing_id: pressing.id,
      created_at: now,
    };
    await db.offers.put({ ...offer, user_id: userId, updated_at: now, _syncStatus: 'pending' });
    triggerSync();
    return offer;
  };

  const updateOffer = async (id: string, updated: Partial<Offer>) => {
    await db.offers.update(id, { ...updated, updated_at: new Date().toISOString(), _syncStatus: 'pending' });
    triggerSync();
  };

  const deleteOffer = async (id: string) => {
    await db.offers.update(id, { deleted_at: new Date().toISOString(), updated_at: new Date().toISOString(), _syncStatus: 'deleted' });
    triggerSync();
  };

  // ── Clients ───────────────────────────────────────────────────────────
  const addCustomer = async (data: { name?: string; phone: string; address?: string }) => {
    const existing = customers.find(c => c.phone.trim() === data.phone.trim());
    if (existing) return existing;

    const now = new Date().toISOString();
    const c: Customer = {
      id: `cust-${Date.now()}`,
      pressing_id: pressing.id,
      name: data.name || 'Client',
      phone: data.phone,
      address: data.address || '',
      total_spent: 0,
      orders_count: 0,
      last_visit_at: now,
      created_at: now,
    };
    await db.customers.put({ ...c, user_id: userId, updated_at: now, _syncStatus: 'pending' });
    triggerSync();
    return c;
  };

  const updateCustomer = async (id: string, data: Partial<Pick<Customer, 'name' | 'phone' | 'address'>>) => {
    await db.customers.update(id, { ...data, updated_at: new Date().toISOString(), _syncStatus: 'pending' });
    triggerSync();
  };

  const deleteCustomer = async (id: string) => {
    await db.customers.update(id, { deleted_at: new Date().toISOString(), updated_at: new Date().toISOString(), _syncStatus: 'deleted' });
    triggerSync();
  };

  // ── Commandes ─────────────────────────────────────────────────────────
  const addOrder = async (orderData: Omit<Order, 'id' | 'pressing_id' | 'invoice_number' | 'created_at'>) => {
    const prefix = pressing.invoice_prefix || 'NOR';
    const num    = `${prefix}-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`;

    let custId = orderData.customer_id;
    if (!custId && orderData.customer_phone) {
      const c = await addCustomer({ name: orderData.customer_name, phone: orderData.customer_phone, address: orderData.customer_address });
      custId = c.id;
    }

    const gross        = orderData.quantity * orderData.unit_price;
    const pickup_fee   = orderData.pickup_fee   || 0;
    const delivery_fee = orderData.delivery_fee || 0;
    const total_amount = gross + pickup_fee + delivery_fee;
    const amount_paid  = orderData.amount_paid  || 0;
    const remaining    = Math.max(0, total_amount - amount_paid);
    const payment_status: PaymentStatus = remaining <= 0 ? 'paid' : 'unpaid';

    const now = new Date().toISOString();
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      pressing_id: pressing.id,
      customer_id: custId,
      invoice_number: num,
      gross_amount: gross,
      pickup_fee,
      delivery_fee,
      total_amount,
      amount_paid,
      remaining_amount: remaining,
      payment_status,
      created_at: now,
    };

    await db.orders.put({ ...newOrder, user_id: userId, updated_at: now, _syncStatus: 'pending' });

    if (custId) {
      const cust = await db.customers.get(custId);
      if (cust) {
        await db.customers.update(custId, {
          total_spent: (cust.total_spent || 0) + total_amount,
          orders_count: (cust.orders_count || 0) + 1,
          last_visit_at: now,
          updated_at: now,
          _syncStatus: 'pending',
        });
      }
    }

    triggerSync();
    return newOrder;
  };

  const updateOrderStatus = async (id: string, treatment_status: TreatmentStatus) => {
    await db.orders.update(id, { treatment_status, updated_at: new Date().toISOString(), _syncStatus: 'pending' });
    triggerSync();
  };

  const updatePaymentStatus = async (id: string, amountPaidInput?: number) => {
    const order = await db.orders.get(id);
    if (!order) return;

    const amount_paid      = amountPaidInput !== undefined ? amountPaidInput : order.total_amount;
    const remaining_amount = Math.max(0, order.total_amount - amount_paid);
    const payment_status: PaymentStatus = remaining_amount <= 0 ? 'paid' : 'unpaid';

    await db.orders.update(id, { amount_paid, remaining_amount, payment_status, updated_at: new Date().toISOString(), _syncStatus: 'pending' });
    triggerSync();
  };

  const deleteOrder = async (id: string) => {
    await db.orders.update(id, { deleted_at: new Date().toISOString(), updated_at: new Date().toISOString(), _syncStatus: 'deleted' });
    triggerSync();
  };

  // ── Dépenses ──────────────────────────────────────────────────────────
  const addExpense = async (data: Omit<Expense, 'id' | 'pressing_id' | 'created_at'>) => {
    const now = new Date().toISOString();
    const e: Expense = {
      ...data,
      id: `exp-${Date.now()}`,
      pressing_id: pressing.id,
      created_at: now,
    };
    await db.expenses.put({ ...e, user_id: userId, updated_at: now, _syncStatus: 'pending' });
    triggerSync();
    return e;
  };

  const deleteExpense = async (id: string) => {
    await db.expenses.update(id, { deleted_at: new Date().toISOString(), updated_at: new Date().toISOString(), _syncStatus: 'deleted' });
    triggerSync();
  };

  return {
    isLoaded, pressing, offers, customers, orders, expenses,
    updatePressing,
    addOffer, updateOffer, deleteOffer,
    addCustomer, updateCustomer, deleteCustomer,
    addOrder, updateOrderStatus, updatePaymentStatus, deleteOrder,
    addExpense, deleteExpense,
  };
}
