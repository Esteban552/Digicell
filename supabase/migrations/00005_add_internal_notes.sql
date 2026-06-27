-- ============================================================
-- Migration 00005: Add internal_notes column to repair_orders
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'repair_orders' AND column_name = 'internal_notes'
  ) THEN
    ALTER TABLE public.repair_orders ADD COLUMN internal_notes TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

