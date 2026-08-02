-- Schema SQL pour Nora Pressing & Blanchisserie
-- Active l'extension UUID si pas déjà fait
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table des Pressings (Espaces de travail)
CREATE TABLE IF NOT EXISTS public.pressings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    phone_primary VARCHAR(50) NOT NULL,
    phone_secondary VARCHAR(50),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Douala',
    currency VARCHAR(10) NOT NULL DEFAULT 'FCFA',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Profils Utilisateurs
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pressing_id UUID REFERENCES public.pressings(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'owner',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Offres / Services
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pressing_id UUID NOT NULL REFERENCES public.pressings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    billing_type VARCHAR(20) NOT NULL CHECK (billing_type IN ('kg', 'unit')),
    default_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    description TEXT,
    estimated_delay VARCHAR(100) DEFAULT '24h',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Clients
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pressing_id UUID NOT NULL REFERENCES public.pressings(id) ON DELETE CASCADE,
    name VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    address TEXT,
    total_spent NUMERIC(12, 2) DEFAULT 0,
    orders_count INT DEFAULT 0,
    last_visit_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(pressing_id, phone)
);

-- 5. Commandes
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pressing_id UUID NOT NULL REFERENCES public.pressings(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) NOT NULL,
    offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
    billing_type VARCHAR(20) NOT NULL CHECK (billing_type IN ('kg', 'unit')),
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    gross_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    pickup_cost NUMERIC(12, 2) DEFAULT 0,
    delivery_cost NUMERIC(12, 2) DEFAULT 0,
    total_transport NUMERIC(12, 2) DEFAULT 0,
    product_cost NUMERIC(12, 2) DEFAULT 0,
    equipment_cost NUMERIC(12, 2) DEFAULT 0,
    total_expenses NUMERIC(12, 2) DEFAULT 0,
    net_profit NUMERIC(12, 2) DEFAULT 0,
    deposit_amount NUMERIC(12, 2) DEFAULT 0,
    remaining_amount NUMERIC(12, 2) DEFAULT 0,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid')),
    treatment_status VARCHAR(20) NOT NULL DEFAULT 'received' CHECK (treatment_status IN ('received', 'washing', 'ironing', 'ready', 'delivered', 'cancelled')),
    internal_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Dépenses
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pressing_id UUID NOT NULL REFERENCES public.pressings(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('fuel', 'water', 'electricity', 'products', 'maintenance', 'salaries', 'other')),
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    description TEXT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes pour les performances
CREATE INDEX IF NOT EXISTS idx_pressings_user ON public.pressings(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_pressing_phone ON public.customers(pressing_id, phone);
CREATE INDEX IF NOT EXISTS idx_orders_pressing ON public.orders(pressing_id);
CREATE INDEX IF NOT EXISTS idx_orders_invoice ON public.orders(invoice_number);
CREATE INDEX IF NOT EXISTS idx_expenses_pressing_date ON public.expenses(pressing_id, expense_date);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.pressings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Utilisateurs accèdent à leur pressing" ON public.pressings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Profils accessibles par utilisateur" ON public.user_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Offres accessibles par le pressing" ON public.offers
    FOR ALL USING (
        pressing_id IN (SELECT id FROM public.pressings WHERE user_id = auth.uid())
    );

CREATE POLICY "Clients accessibles par le pressing" ON public.customers
    FOR ALL USING (
        pressing_id IN (SELECT id FROM public.pressings WHERE user_id = auth.uid())
    );

CREATE POLICY "Commandes accessibles par le pressing" ON public.orders
    FOR ALL USING (
        pressing_id IN (SELECT id FROM public.pressings WHERE user_id = auth.uid())
    );

CREATE POLICY "Dépenses accessibles par le pressing" ON public.expenses
    FOR ALL USING (
        pressing_id IN (SELECT id FROM public.pressings WHERE user_id = auth.uid())
    );
