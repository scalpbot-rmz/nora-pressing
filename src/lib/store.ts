'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Pressing, Offer, Customer, Order, Expense,
  TreatmentStatus, PaymentStatus,
} from '@/types';
import { initialPressing, initialOffers, initialCustomers, initialOrders, initialExpenses } from './mock-data';
import { useAuth } from '@/contexts/AuthContext';
import { db, LocalPressing, LocalOffer, LocalCustomer, LocalOrder, LocalExpense } from './db';
import { syncEngine } from './sync-engine';

export function useNoraStore() {
  const { user } = useAuth();
  const userId = user?.id || 'guest';

  const [isLoaded, setIsLoaded]   = useState(false);
  const [pressing, setPressing]   = useState<Pressing>({ ...initialPressing, id: userId, user_id: userId });
  const [offers, setOffers]       = useState<Offer[]>(initialOffers);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [orders, setOrders]       = useState<Order[]>(initialOrders);
  const [expenses, setExpenses]   = useState<Expense[]>(initialExpenses);

  // Fonction de rechargement des données depuis IndexedDB
  const reloadFromDB = useCallback(async () => {
    if (!userId || userId === 'guest') {
      setIsLoaded(true);
      return;
    }

    try {
      // 1. Pressing
      let dbP = await db.pressings.get(userId);
      if (!dbP) {
        dbP = { ...initialPressing, id: userId, user_id: userId, name: user?.fullName || 'Mon Pressing', _syncStatus: 'pending' };
        await db.pressings.put(dbP);
      }
      setPressing(dbP);

      // 2. Offres
      const dbOf = await db.offers.filter(o => !o.deleted_at).toArray();
      setOffers(dbOf);

      // 3. Clients
      const dbCu = await db.customers.filter(c => !c.deleted_at).toArray();
      setCustomers(dbCu);

      // 4. Commandes
      const dbOr = await db.orders.filter(o => !o.deleted_at).toArray();
      dbOr.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setOrders(dbOr);

      // 5. Dépenses
      const dbEx = await db.expenses.filter(e => !e.deleted_at).toArray();
      dbEx.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setExpenses(dbEx);

    } catch (err) {
      console.warn('[useNoraStore] Erreur lecture DB:', err);
    } finally {
      setIsLoaded(true);
    }
  }, [userId, user?.fullName]);

  // Chargement initial + Écouteur d'événements de synchronisation temps réel
  useEffect(() => {
    reloadFromDB();

    const handleDBChange = () => {
      reloadFromDB();
    };

    window.addEventListener('nora-db-change', handleDBChange);
    return () => {
      window.removeEventListener('nora-db-change', handleDBChange);
    };
  }, [reloadFromDB]);

  // Déclencher la synchronisation après une modification locale
  const triggerSync = useCallback(() => {
    syncEngine.notifyListeners();
    if (user?.id && typeof navigator !== 'undefined' && navigator.onLine) {
      syncEngine.syncAll(user.id).catch(console.warn);
    }
  }, [user?.id]);

  // ── Pressing ──────────────────────────────────────────────────────────────
  const updatePressing = useCallback(async (updated: Partial<Pressing>) => {
    const updatedRecord: LocalPressing = {
      ...pressing,
      ...updated,
      id: userId,
      user_id: userId,
      updated_at: new Date().toISOString(),
      _syncStatus: 'pending',
    };
    // Protection logo : si pas de logo dans updated et présent dans pressing, le garder
    if (!updated.logo_url && pressing.logo_url) {
      updatedRecord.logo_url = pressing.logo_url;
    }

    setPressing(updatedRecord);
    await db.pressings.put(updatedRecord);
    triggerSync();
  }, [pressing, userId, triggerSync]);

  // ── Offres ────────────────────────────────────────────────────────────────
  const addOffer = useCallback(async (data: Omit<Offer, 'id' | 'pressing_id' | 'created_at'>) => {
    const now = new Date().toISOString();
    const offer: LocalOffer = {
      ...data,
      id: `off-${Date.now()}`,
      pressing_id: userId,
      user_id: userId,
      created_at: now,
      updated_at: now,
      _syncStatus: 'pending',
    };

    setOffers(prev => [...prev, offer]);
    await db.offers.put(offer);
    triggerSync();
    return offer;
  }, [userId, triggerSync]);

  const updateOffer = useCallback(async (id: string, updated: Partial<Offer>) => {
    const now = new Date().toISOString();
    setOffers(prev => prev.map(o => o.id === id ? { ...o, ...updated } : o));
    await db.offers.update(id, { ...updated, updated_at: now, _syncStatus: 'pending' });
    triggerSync();
  }, [triggerSync]);

  const deleteOffer = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    setOffers(prev => prev.filter(o => o.id !== id));
    await db.offers.update(id, { deleted_at: now, updated_at: now, _syncStatus: 'deleted' });
    triggerSync();
  }, [triggerSync]);

  // ── Clients ───────────────────────────────────────────────────────────────
  const addCustomer = useCallback(async (data: { name?: string; phone: string; address?: string }) => {
    const existing = customers.find(c => c.phone.trim() === data.phone.trim());
    if (existing) return existing;

    const now = new Date().toISOString();
    const c: LocalCustomer = {
      id: `cust-${Date.now()}`,
      pressing_id: userId,
      user_id: userId,
      name: data.name || 'Client',
      phone: data.phone,
      address: data.address || '',
      total_spent: 0,
      orders_count: 0,
      last_visit_at: now,
      created_at: now,
      updated_at: now,
      _syncStatus: 'pending',
    };

    setCustomers(prev => [...prev, c]);
    await db.customers.put(c);
    triggerSync();
    return c;
  }, [customers, userId, triggerSync]);

  const updateCustomer = useCallback(async (id: string, data: Partial<Pick<Customer, 'name' | 'phone' | 'address'>>) => {
    const now = new Date().toISOString();
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    await db.customers.update(id, { ...data, updated_at: now, _syncStatus: 'pending' });
    triggerSync();
  }, [triggerSync]);

  const deleteCustomer = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    setCustomers(prev => prev.filter(c => c.id !== id));
    await db.customers.update(id, { deleted_at: now, updated_at: now, _syncStatus: 'deleted' });
    triggerSync();
  }, [triggerSync]);

  // ── Commandes ─────────────────────────────────────────────────────────────
  const addOrder = useCallback(async (orderData: Omit<Order, 'id' | 'pressing_id' | 'invoice_number' | 'created_at'>) => {
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
    const newOrder: LocalOrder = {
      ...orderData,
      id: `ord-${Date.now()}`,
      pressing_id: userId,
      user_id: userId,
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
      updated_at: now,
      _syncStatus: 'pending',
    };

    setOrders(prev => [newOrder, ...prev]);
    await db.orders.put(newOrder);

    // Mettre à jour le client en DB
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
  }, [pressing, orders.length, userId, addCustomer, triggerSync]);

  const updateOrderStatus = useCallback(async (id: string, treatment_status: TreatmentStatus) => {
    const now = new Date().toISOString();
    setOrders(prev => prev.map(o => o.id === id ? { ...o, treatment_status } : o));
    await db.orders.update(id, { treatment_status, updated_at: now, _syncStatus: 'pending' });
    triggerSync();
  }, [triggerSync]);

  const updatePaymentStatus = useCallback(async (id: string, amountPaidInput?: number) => {
    const order = await db.orders.get(id);
    if (!order) return;

    const amount_paid      = amountPaidInput !== undefined ? amountPaidInput : order.total_amount;
    const remaining_amount = Math.max(0, order.total_amount - amount_paid);
    const payment_status: PaymentStatus = remaining_amount <= 0 ? 'paid' : 'unpaid';
    const now = new Date().toISOString();

    setOrders(prev => prev.map(o => o.id === id ? { ...o, amount_paid, remaining_amount, payment_status } : o));
    await db.orders.update(id, { amount_paid, remaining_amount, payment_status, updated_at: now, _syncStatus: 'pending' });
    triggerSync();
  }, [triggerSync]);

  const deleteOrder = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    setOrders(prev => prev.filter(o => o.id !== id));
    await db.orders.update(id, { deleted_at: now, updated_at: now, _syncStatus: 'deleted' });
    triggerSync();
  }, [triggerSync]);

  // ── Dépenses ──────────────────────────────────────────────────────────────
  const addExpense = useCallback(async (data: Omit<Expense, 'id' | 'pressing_id' | 'created_at'>) => {
    const now = new Date().toISOString();
    const e: LocalExpense = {
      ...data,
      id: `exp-${Date.now()}`,
      pressing_id: userId,
      user_id: userId,
      created_at: now,
      updated_at: now,
      _syncStatus: 'pending',
    };

    setExpenses(prev => [e, ...prev]);
    await db.expenses.put(e);
    triggerSync();
    return e;
  }, [userId, triggerSync]);

  const deleteExpense = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    setExpenses(prev => prev.filter(e => e.id !== id));
    await db.expenses.update(id, { deleted_at: now, updated_at: now, _syncStatus: 'deleted' });
    triggerSync();
  }, [triggerSync]);

  return {
    isLoaded, pressing, offers, customers, orders, expenses,
    updatePressing,
    addOffer, updateOffer, deleteOffer,
    addCustomer, updateCustomer, deleteCustomer,
    addOrder, updateOrderStatus, updatePaymentStatus, deleteOrder,
    addExpense, deleteExpense,
  };
}
