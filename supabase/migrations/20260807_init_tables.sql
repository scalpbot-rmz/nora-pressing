-- Migration initialisation Supabase pour Nora Pressing
-- Domaine de production : https://www.nora-app.online

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table pressings
CREATE TABLE IF NOT EXISTS public.pressings (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    logo_url TEXT,
    phone_primary TEXT NOT NULL,
    phone_secondary TEXT,
    email TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    currency TEXT DEFAULT 'FCFA',
    invoice_prefix TEXT DEFAULT 'NOR',
    thank_you_message TEXT DEFAULT 'Merci pour votre confiance !',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 2. Table offers (offres et tarifs)
CREATE TABLE IF NOT EXISTS public.offers (
    id TEXT PRIMARY KEY,
    pressing_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    billing_type TEXT NOT NULL CHECK (billing_type IN ('kg', 'unit')),
    default_price NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    estimated_delay TEXT DEFAULT '24h',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 3. Table customers (clients)
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    pressing_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Client',
    phone TEXT NOT NULL,
    address TEXT,
    total_spent NUMERIC DEFAULT 0,
    orders_count INT DEFAULT 0,
    last_visit_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 4. Table orders (commandes)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    pressing_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id TEXT,
    customer_name TEXT,
    customer_phone TEXT NOT NULL,
    customer_address TEXT,
    invoice_number TEXT NOT NULL,
    offer_id TEXT,
    offer_name TEXT,
    billing_type TEXT NOT NULL DEFAULT 'unit',
    quantity NUMERIC DEFAULT 1,
    unit_price NUMERIC DEFAULT 0,
    gross_amount NUMERIC DEFAULT 0,
    pickup_fee NUMERIC DEFAULT 0,
    delivery_fee NUMERIC DEFAULT 0,
    total_amount NUMERIC DEFAULT 0,
    amount_paid NUMERIC DEFAULT 0,
    remaining_amount NUMERIC DEFAULT 0,
    product_cost NUMERIC DEFAULT 0,
    equipment_cost NUMERIC DEFAULT 0,
    total_expenses NUMERIC DEFAULT 0,
    net_profit NUMERIC DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    treatment_status TEXT NOT NULL DEFAULT 'received',
    internal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 5. Table expenses (dépenses)
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    pressing_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    expense_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Index pour accélérer la recherche par utilisateur et date de mise à jour
CREATE INDEX IF NOT EXISTS idx_pressings_user_id ON public.pressings(user_id);
CREATE INDEX IF NOT EXISTS idx_offers_user_id ON public.offers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);

-- Activer Row Level Security (RLS) sur toutes les tables
ALTER TABLE public.pressings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Politiques RLS (chaque utilisateur ne voit et ne modifie que ses propres données)
CREATE POLICY "Users access own pressings" ON public.pressings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own offers" ON public.offers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own customers" ON public.customers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own orders" ON public.orders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own expenses" ON public.expenses FOR ALL USING (auth.uid() = user_id);

-- Storage bucket pour les logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pressing-logos', 'pressing-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Logo public select" ON storage.objects FOR SELECT USING (bucket_id = 'pressing-logos');
CREATE POLICY "Users upload own logo" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pressing-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own logo" ON storage.objects FOR UPDATE USING (bucket_id = 'pressing-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
