-- Allow anon access to all tables (temporary until Supabase Auth is implemented)
-- The app currently uses mocked login, so there's no real auth session.
-- Once Supabase Auth sign-in is wired in, these policies can be restricted again.

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['repair_orders', 'products', 'sales', 'sale_items', 'cash_movements', 'settings', 'profiles'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow all for authenticated users" ON %I', tbl);
    EXECUTE format('CREATE POLICY "Allow all" ON %I FOR ALL USING (true)', tbl);
  END LOOP;
END $$;
