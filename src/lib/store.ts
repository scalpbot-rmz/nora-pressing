'use client';

import { useState, useEffect } from 'react';
import {
  Pressing, Offer, Customer, Order, Expense,
  TreatmentStatus, PaymentStatus,
} from '@/types';
import {
  initialPressing, initialOffers, initialCustomers,
  initialOrders, initialExpenses,
} from './mock-data';

const SK = {
  PRESSING:  'nora_pressing_data',
  OFFERS:    'nora_offers_data',
  CUSTOMERS: 'nora_customers_data',
  ORDERS:    'nora_orders_data',
  EXPENSES:  'nora_expenses_data',
};

export function useNoraStore() {
  const [pressing,   setPressingState]   = useState<Pressing>(initialPressing);
  const [offers,     setOffersState]     = useState<Offer[]>(initialOffers);
  const [customers,  setCustomersState]  = useState<Customer[]>(initialCustomers);
  const [orders,     setOrdersState]     = useState<Order[]>(initialOrders);
  const [expenses,   setExpensesState]   = useState<Expense[]>(initialExpenses);
  const [isLoaded,   setIsLoaded]        = useState(false);

  useEffect(() => {
    try {
      const p  = localStorage.getItem(SK.PRESSING);
      const of = localStorage.getItem(SK.OFFERS);
      const cu = localStorage.getItem(SK.CUSTOMERS);
      const or = localStorage.getItem(SK.ORDERS);
      const ex = localStorage.getItem(SK.EXPENSES);
      if (p)  setPressingState(JSON.parse(p));
      if (of) setOffersState(JSON.parse(of));
      if (cu) setCustomersState(JSON.parse(cu));
      if (or) setOrdersState(JSON.parse(or));
      if (ex) setExpensesState(JSON.parse(ex));
    } catch (e) {
      console.error('Erreur localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // ── Pressing ───────────────────────────────────────────────────────────
  const updatePressing = (updated: Partial<Pressing>) => {
    setPressingState((prev) => {
      const next = { ...prev, ...updated };
      localStorage.setItem(SK.PRESSING, JSON.stringify(next));
      return next;
    });
  };

  // ── Offres ─────────────────────────────────────────────────────────────
  const addOffer = (data: Omit<Offer, 'id' | 'pressing_id' | 'created_at'>) => {
    const offer: Offer = { ...data, id: `off-${Date.now()}`, pressing_id: pressing.id, created_at: new Date().toISOString() };
    setOffersState((prev) => { const next = [offer, ...prev]; localStorage.setItem(SK.OFFERS, JSON.stringify(next)); return next; });
    return offer;
  };

  const updateOffer = (id: string, updated: Partial<Offer>) => {
    setOffersState((prev) => { const next = prev.map((o) => o.id === id ? { ...o, ...updated } : o); localStorage.setItem(SK.OFFERS, JSON.stringify(next)); return next; });
  };

  const deleteOffer = (id: string) => {
    setOffersState((prev) => { const next = prev.filter((o) => o.id !== id); localStorage.setItem(SK.OFFERS, JSON.stringify(next)); return next; });
  };

  // ── Clients ────────────────────────────────────────────────────────────
  const addCustomer = (data: { name?: string; phone: string; address?: string }) => {
    const existing = customers.find((c) => c.phone.trim() === data.phone.trim());
    if (existing) return existing;
    const c: Customer = {
      id: `cust-${Date.now()}`,
      pressing_id: pressing.id,
      name: data.name || 'Client',
      phone: data.phone,
      address: data.address || '',
      total_spent: 0,
      orders_count: 0,
      last_visit_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    setCustomersState((prev) => { const next = [c, ...prev]; localStorage.setItem(SK.CUSTOMERS, JSON.stringify(next)); return next; });
    return c;
  };

  const updateCustomer = (id: string, data: Partial<Pick<Customer, 'name' | 'phone' | 'address'>>) => {
    setCustomersState((prev) => {
      const next = prev.map((c) => c.id === id ? { ...c, ...data } : c);
      localStorage.setItem(SK.CUSTOMERS, JSON.stringify(next));
      return next;
    });
  };

  /** Supprime la fiche client. Les commandes sont conservées (intégrité des stats). */
  const deleteCustomer = (id: string) => {
    setCustomersState((prev) => {
      const next = prev.filter((c) => c.id !== id);
      localStorage.setItem(SK.CUSTOMERS, JSON.stringify(next));
      return next;
    });
  };

  // ── Commandes ──────────────────────────────────────────────────────────
  const addOrder = (orderData: Omit<Order, 'id' | 'pressing_id' | 'invoice_number' | 'created_at'>) => {
    const prefix = pressing.invoice_prefix || 'NOR';
    const num    = `${prefix}-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`;

    let custId = orderData.customer_id;
    if (!custId && orderData.customer_phone) {
      const c = addCustomer({ name: orderData.customer_name, phone: orderData.customer_phone, address: orderData.customer_address });
      custId = c.id;
    }

    const gross          = orderData.quantity * orderData.unit_price;
    const pickup_fee     = orderData.pickup_fee    || 0;
    const delivery_fee   = orderData.delivery_fee  || 0;
    const total_amount   = gross + pickup_fee + delivery_fee;
    const amount_paid    = orderData.amount_paid   || 0;
    const remaining      = Math.max(0, total_amount - amount_paid);
    const payment_status: PaymentStatus = remaining <= 0 ? 'paid' : 'unpaid';

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
      created_at: new Date().toISOString(),
    };

    setOrdersState((prev) => {
      const next = [newOrder, ...prev];
      localStorage.setItem(SK.ORDERS, JSON.stringify(next));
      return next;
    });

    if (custId) {
      setCustomersState((prev) => {
        const next = prev.map((c) => c.id === custId
          ? { ...c, total_spent: c.total_spent + total_amount, orders_count: c.orders_count + 1, last_visit_at: new Date().toISOString() }
          : c
        );
        localStorage.setItem(SK.CUSTOMERS, JSON.stringify(next));
        return next;
      });
    }

    return newOrder;
  };

  const updateOrderStatus = (id: string, treatment_status: TreatmentStatus) => {
    setOrdersState((prev) => {
      const next = prev.map((o) => o.id === id ? { ...o, treatment_status } : o);
      localStorage.setItem(SK.ORDERS, JSON.stringify(next));
      return next;
    });
  };

  const updatePaymentStatus = (id: string, amountPaidInput?: number) => {
    setOrdersState((prev) => {
      const next = prev.map((o) => {
        if (o.id !== id) return o;
        const amount_paid      = amountPaidInput !== undefined ? amountPaidInput : o.total_amount;
        const remaining_amount = Math.max(0, o.total_amount - amount_paid);
        const payment_status: PaymentStatus = remaining_amount <= 0 ? 'paid' : 'unpaid';
        return { ...o, amount_paid, remaining_amount, payment_status };
      });
      localStorage.setItem(SK.ORDERS, JSON.stringify(next));
      return next;
    });
  };

  const deleteOrder = (id: string) => {
    setOrdersState((prev) => {
      const next = prev.filter((o) => o.id !== id);
      localStorage.setItem(SK.ORDERS, JSON.stringify(next));
      return next;
    });
  };

  // ── Dépenses ───────────────────────────────────────────────────────────
  const addExpense = (data: Omit<Expense, 'id' | 'pressing_id' | 'created_at'>) => {
    const e: Expense = { ...data, id: `exp-${Date.now()}`, pressing_id: pressing.id, created_at: new Date().toISOString() };
    setExpensesState((prev) => { const next = [e, ...prev]; localStorage.setItem(SK.EXPENSES, JSON.stringify(next)); return next; });
    return e;
  };

  const deleteExpense = (id: string) => {
    setExpensesState((prev) => { const next = prev.filter((e) => e.id !== id); localStorage.setItem(SK.EXPENSES, JSON.stringify(next)); return next; });
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
