-- ============================================================
-- Digicell POS — Migración Inicial
-- ============================================================

-- 0. Extensiones útiles
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES (extiende auth.users de Supabase)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'technician' CHECK (role IN ('admin', 'technician')),
  avatar_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. REPAIR ORDERS
CREATE TABLE public.repair_orders (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  client_name TEXT NOT NULL DEFAULT '',
  client_phone TEXT NOT NULL DEFAULT '',
  client_email TEXT NOT NULL DEFAULT '',
  device_brand TEXT NOT NULL DEFAULT 'Apple',
  device_model TEXT NOT NULL DEFAULT '',
  device_serial TEXT NOT NULL DEFAULT '',
  device_password TEXT NOT NULL DEFAULT '',
  device_color TEXT NOT NULL DEFAULT '',
  powers_on TEXT NOT NULL DEFAULT 'Yes' CHECK (powers_on IN ('Yes', 'No')),
  battery_percent TEXT NOT NULL DEFAULT '',
  charger_left BOOLEAN NOT NULL DEFAULT FALSE,
  cover_left BOOLEAN NOT NULL DEFAULT FALSE,
  receiving_condition TEXT NOT NULL DEFAULT '',
  problem_reported TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'in_review' CHECK (status IN ('in_review', 'waiting_parts', 'repaired', 'delivered')),
  technician TEXT NOT NULL DEFAULT 'Unassigned',
  delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
  warranty_end DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '90 days'),
  total_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  advance_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  remaining_balance NUMERIC(10,2) GENERATED ALWAYS AS (GREATEST(0, total_cost - advance_paid)) STORED,
  footnote TEXT NOT NULL DEFAULT 'Garantía de 30 días en piezas reemplazadas. No nos hacemos responsables por equipos olvidados después de 60 días.',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_repair_orders_status ON public.repair_orders(status);
CREATE INDEX idx_repair_orders_client_name ON public.repair_orders(client_name);
CREATE INDEX idx_repair_orders_created_at ON public.repair_orders(created_at DESC);

ALTER TABLE public.repair_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view repair_orders"
  ON public.repair_orders FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can insert repair_orders"
  ON public.repair_orders FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can update repair_orders"
  ON public.repair_orders FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can delete repair_orders"
  ON public.repair_orders FOR DELETE
  USING (auth.role() = 'authenticated');

-- 3. PRODUCTS (inventario / catálogo POS)
CREATE TABLE public.products (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT '',
  stock INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_active ON public.products(active);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view products"
  ON public.products FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage products"
  ON public.products FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update products"
  ON public.products FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 4. SALES (cabecera de venta POS)
CREATE TABLE public.sales (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  description TEXT NOT NULL DEFAULT '',
  cash_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  card_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  usd_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sales_created_at ON public.sales(created_at DESC);
CREATE INDEX idx_sales_created_by ON public.sales(created_by);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sales"
  ON public.sales FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert sales"
  ON public.sales FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 5. SALE ITEMS (detalle de cada venta)
CREATE TABLE public.sale_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sale_id BIGINT NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  qty INTEGER NOT NULL CHECK (qty > 0),
  price NUMERIC(10,2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_sale_items_sale_id ON public.sale_items(sale_id);

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sale_items"
  ON public.sale_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert sale_items"
  ON public.sale_items FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 6. CASH MOVEMENTS (movimientos manuales de caja)
CREATE TABLE public.cash_movements (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  note TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cash_movements_created_at ON public.cash_movements(created_at DESC);

ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cash_movements"
  ON public.cash_movements FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert cash_movements"
  ON public.cash_movements FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 7. SETTINGS (configuración key-value)
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view settings"
  ON public.settings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update settings"
  ON public.settings FOR ALL
  USING (auth.role() = 'authenticated');

-- 8. ACTIVITY LOGS (vista consolidada de actividad financiera)
CREATE VIEW public.activity_logs AS
SELECT
  'sale_' || s.id::text AS id,
  s.created_at::time AS time,
  'POS Sale'::text AS type,
  s.description,
  s.total AS amount,
  'Paid'::text AS status,
  s.created_at
FROM public.sales s
UNION ALL
SELECT
  'advance_' || ro.id::text,
  GREATEST(ro.updated_at, ro.created_at)::time,
  'Repair Advance'::text,
  'Ticket #R-' || ro.id || ': ' || ro.device_brand || ' ' || ro.device_model || ' Depósito',
  ro.advance_paid,
  'Advance'::text,
  ro.updated_at
FROM public.repair_orders ro
WHERE ro.advance_paid > 0
UNION ALL
SELECT
  'cash_' || cm.id::text,
  cm.created_at::time,
  'Cash Movement'::text,
  cm.note,
  CASE WHEN cm.type = 'out' THEN -cm.amount ELSE cm.amount END,
  CASE WHEN cm.type = 'out' THEN 'Outflow'::text ELSE 'Paid'::text END,
  cm.created_at
FROM public.cash_movements cm
ORDER BY created_at DESC;

-- 9. TRIGGER: actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_repair_orders_updated_at
  BEFORE UPDATE ON public.repair_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 10. FUNCIÓN: auto-crear profile al registrar usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'technician')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SEED DATA
-- ============================================================

-- Settings por defecto
INSERT INTO public.settings (key, value) VALUES
  ('shop_name', 'Digicell Centro'),
  ('exchange_rate', '18.50'),
  ('tax_rate', '16');

-- Productos del inventario
INSERT INTO public.products (name, price, category, stock) VALUES
  ('Pantalla iPhone 13 Pro Max', 185.00, 'Pantallas', 5),
  ('Protector Cristal Templado Universal', 15.00, 'Accesorios', 50),
  ('Cable USB-C Carga Rápida 2M', 25.00, 'Cables', 30),
  ('Audífonos Bluetooth (Sony)', 120.00, 'Audio', 10),
  ('Pantalla Samsung Galaxy S21', 165.00, 'Pantallas', 3),
  ('Batería iPhone (X/11/12/13)', 60.00, 'Baterías', 8),
  ('Micro SD 128GB Kingston', 19.99, 'Almacenamiento', 20),
  ('Funda Reforzada iPhone 14/15', 35.00, 'Accesorios', 15);
