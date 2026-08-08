'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Pressing, Offer, Customer, Order, Expense,
  TreatmentStatus, PaymentStatus,
} from '@/types';
import { initialPressing, initialOffers, initialCustomers, initialOrders, initialExpenses } from './mock-data';
import { useAuth } from '@/contexts/AuthContext';

// ─── Clés de stockage ────────────────────────────────────────────────────────
function keys(userId: string) {
  return {
    pressing:  `nora_pressing_${userId}`,
    offers:    `nora_offers_${userId}`,
    customers: `nora_customers_${userId}`,
    orders:    `nora_orders_${userId}`,
    expenses:  `nora_expenses_${userId}`,
  };
}

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// ─── Hook principal ──────────────────────────────────────────────────────────
export function useNoraStore() {
  const { user } = useAuth();
  const userId = user?.id || 'guest';
  const k = keys(userId);

  const [isLoaded, setIsLoaded]       = useState(false);
  const [pressing, setPressing]       = useState<Pressing>({ ...initialPressing, id: userId, user_id: userId });
  const [offers, setOffers]           = useState<Offer[]>(initialOffers);
  const [customers, setCustomers]     = useState<Customer[]>(initialCustomers);
  const [orders, setOrders]           = useState<Order[]>(initialOrders);
  const [expenses, setExpenses]       = useState<Expense[]>(initialExpenses);

  // Chargement depuis localStorage (immédiat, pas d'async, pas d'IndexedDB)
  useEffect(() => {
    if (!userId || userId === 'guest') return;

    const p = load<Pressing>(k.pressing, { ...initialPressing, id: userId, user_id: userId, name: user?.fullName || 'Mon Pressing' });
    const of = load<Offer[]>(k.offers, []);
    const cu = load<Customer[]>(k.customers, []);
    const or = load<Order[]>(k.orders, []);
    const ex = load<Expense[]>(k.expenses, []);

    setPressing(p);
    setOffers(of);
    setCustomers(cu);
    setOrders(or);
    setExpenses(ex);
    setIsLoaded(true);
  }, [userId, user?.fullName]);

  // Pour guest (non connecté) on marque aussi comme chargé
  useEffect(() => {
    if (userId === 'guest') setIsLoaded(true);
  }, [userId]);

  // ── Pressing ──────────────────────────────────────────────────────────────
  const updatePressing = useCallback((updated: Partial<Pressing>) => {
    setPressing(prev => {
      const next = { ...prev, ...updated, id: userId, user_id: userId, updated_at: new Date().toISOString() };
      save(k.pressing, next);
      return next;
    });
  }, [userId, k.pressing]);

  // ── Offres ────────────────────────────────────────────────────────────────
  const addOffer = useCallback((data: Omit<Offer, 'id' | 'pressing_id' | 'created_at'>) => {
    const offer: Offer = { ...data, id: `off-${Date.now()}`, pressing_id: userId, created_at: new Date().toISOString() };
    setOffers(prev => {
      const next = [...prev, offer];
      save(k.offers, next);
      return next;
    });
    return offer;
  }, [userId, k.offers]);

  const updateOffer = useCallback((id: string, updated: Partial<Offer>) => {
    setOffers(prev => {
      const next = prev.map(o => o.id === id ? { ...o, ...updated } : o);
      save(k.offers, next);
      return next;
    });
  }, [k.offers]);

  const deleteOffer = useCallback((id: string) => {
    setOffers(prev => {
      const next = prev.filter(o => o.id !== id);
      save(k.offers, next);
      return next;
    });
  }, [k.offers]);

  // ── Clients ───────────────────────────────────────────────────────────────
  const addCustomer = useCallback((data: { name?: string; phone: string; address?: string }) => {
    const existing = customers.find(c => c.phone.trim() === data.phone.trim());
    if (existing) return existing;

    const now = new Date().toISOString();
    const c: Customer = {
      id: `cust-${Date.now()}`,
      pressing_id: userId,
      name: data.name || 'Client',
      phone: data.phone,
      address: data.address || '',
      total_spent: 0,
      orders_count: 0,
      last_visit_at: now,
      created_at: now,
    };
    setCustomers(prev => {
      const next = [...prev, c];
      save(k.customers, next);
      return next;
    });
    return c;
  }, [customers, userId, k.customers]);

  const updateCustomer = useCallback((id: string, data: Partial<Pick<Customer, 'name' | 'phone' | 'address'>>) => {
    setCustomers(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...data } : c);
      save(k.customers, next);
      return next;
    });
  }, [k.customers]);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers(prev => {
      const next = prev.filter(c => c.id !== id);
      save(k.customers, next);
      return next;
    });
  }, [k.customers]);

  // ── Commandes ─────────────────────────────────────────────────────────────
  const addOrder = useCallback((orderData: Omit<Order, 'id' | 'pressing_id' | 'invoice_number' | 'created_at'>) => {
    const prefix = pressing.invoice_prefix || 'NOR';
    const num    = `${prefix}-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`;

    let custId = orderData.customer_id;
    if (!custId && orderData.customer_phone) {
      const c = addCustomer({ name: orderData.customer_name, phone: orderData.customer_phone, address: orderData.customer_address });
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
      pressing_id: userId,
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

    setOrders(prev => {
      const next = [newOrder, ...prev];
      save(k.orders, next);
      return next;
    });

    // Mettre à jour le client
    if (custId) {
      setCustomers(prev => {
        const next = prev.map(c =>
          c.id === custId
            ? { ...c, total_spent: c.total_spent + total_amount, orders_count: c.orders_count + 1, last_visit_at: now }
            : c
        );
        save(k.customers, next);
        return next;
      });
    }

    return newOrder;
  }, [pressing, orders, userId, k.orders, k.customers, addCustomer]);

  const updateOrderStatus = useCallback((id: string, treatment_status: TreatmentStatus) => {
    setOrders(prev => {
      const next = prev.map(o => o.id === id ? { ...o, treatment_status } : o);
      save(k.orders, next);
      return next;
    });
  }, [k.orders]);

  const updatePaymentStatus = useCallback((id: string, amountPaidInput?: number) => {
    setOrders(prev => {
      const next = prev.map(o => {
        if (o.id !== id) return o;
        const amount_paid      = amountPaidInput !== undefined ? amountPaidInput : o.total_amount;
        const remaining_amount = Math.max(0, o.total_amount - amount_paid);
        const payment_status: PaymentStatus = remaining_amount <= 0 ? 'paid' : 'unpaid';
        return { ...o, amount_paid, remaining_amount, payment_status };
      });
      save(k.orders, next);
      return next;
    });
  }, [k.orders]);

  const deleteOrder = useCallback((id: string) => {
    setOrders(prev => {
      const next = prev.filter(o => o.id !== id);
      save(k.orders, next);
      return next;
    });
  }, [k.orders]);

  // ── Dépenses ──────────────────────────────────────────────────────────────
  const addExpense = useCallback((data: Omit<Expense, 'id' | 'pressing_id' | 'created_at'>) => {
    const e: Expense = { ...data, id: `exp-${Date.now()}`, pressing_id: userId, created_at: new Date().toISOString() };
    setExpenses(prev => {
      const next = [e, ...prev];
      save(k.expenses, next);
      return next;
    });
    return e;
  }, [userId, k.expenses]);

  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => {
      const next = prev.filter(e => e.id !== id);
      save(k.expenses, next);
      return next;
    });
  }, [k.expenses]);

  return {
    isLoaded, pressing, offers, customers, orders, expenses,
    updatePressing,
    addOffer, updateOffer, deleteOffer,
    addCustomer, updateCustomer, deleteCustomer,
    addOrder, updateOrderStatus, updatePaymentStatus, deleteOrder,
    addExpense, deleteExpense,
  };
}
