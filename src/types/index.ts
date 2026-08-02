export type BillingType = 'kg' | 'unit';

export type PaymentStatus = 'paid' | 'unpaid';

export type TreatmentStatus = 
  | 'received' 
  | 'washing' 
  | 'ironing' 
  | 'ready' 
  | 'delivered' 
  | 'cancelled';

export type ExpenseCategory = 
  | 'fuel' 
  | 'water' 
  | 'electricity' 
  | 'products' 
  | 'maintenance' 
  | 'salaries' 
  | 'other';

export interface Pressing {
  id: string;
  user_id: string;
  name: string;
  logo_url?: string;
  phone_primary: string;
  phone_secondary?: string;
  email?: string;
  address: string;
  city: string;
  currency: string;
  invoice_prefix?: string;
  thank_you_message?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  pressing_id?: string;
  full_name: string;
  role: 'owner' | 'manager' | 'employee';
  created_at: string;
}

export interface Offer {
  id: string;
  pressing_id: string;
  name: string;
  billing_type: BillingType;
  default_price: number;
  description?: string;
  estimated_delay: string;
  created_at: string;
}

export interface Customer {
  id: string;
  pressing_id: string;
  name?: string;
  phone: string;
  address?: string;
  total_spent: number;
  orders_count: number;
  last_visit_at?: string;
  created_at: string;
}

export interface Order {
  id: string;
  pressing_id: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone: string;
  customer_address?: string;
  invoice_number: string;
  offer_id?: string;
  offer_name?: string;
  billing_type: BillingType;
  quantity: number;
  unit_price: number;
  gross_amount: number; // Subtotal prestations
  pickup_fee: number;   // Frais de ramassage
  delivery_fee: number; // Frais de livraison
  total_amount: number; // total = gross_amount + pickup_fee + delivery_fee
  amount_paid: number;  // Montant payé
  remaining_amount: number; // remaining = total_amount - amount_paid
  product_cost: number;
  equipment_cost: number;
  total_expenses: number;
  net_profit: number;
  payment_status: PaymentStatus;
  treatment_status: TreatmentStatus;
  internal_notes?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  pressing_id: string;
  category: ExpenseCategory;
  amount: number;
  description?: string;
  expense_date: string;
  created_at: string;
}

export type FinancialPeriod = 'today' | 'week' | 'month' | 'year' | 'all';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info';
}
