-- Restore RLS to authenticated-only now that Supabase Auth is wired in
-- Run this AFTER confirming sign-in/sign-up works in the app

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['repair_orders', 'products', 'sales', 'sale_items', 'cash_movements', 'settings', 'profiles'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow all" ON %I', tbl);
    EXECUTE format('CREATE POLICY "Authenticated only" ON %I FOR ALL USING (auth.role() = ''authenticated'')', tbl);
  END LOOP;
END $$;
