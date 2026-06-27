-- ============================================================
-- Migration 00004: Add abonos_paid, fix remaining_balance, update activity_logs
-- Idempotent — safe to run multiple times
-- ============================================================

-- 1. Add abonos_paid column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'repair_orders' AND column_name = 'abonos_paid'
  ) THEN
    ALTER TABLE public.repair_orders ADD COLUMN abonos_paid NUMERIC(10,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 2. Recreate remaining_balance with corrected expression (including abonos_paid)
ALTER TABLE public.repair_orders DROP COLUMN IF EXISTS remaining_balance;

ALTER TABLE public.repair_orders
  ADD COLUMN remaining_balance NUMERIC(10,2)
  GENERATED ALWAYS AS (GREATEST(0, total_cost - advance_paid - COALESCE(abonos_paid, 0))) STORED;

-- 3. Update activity_logs view to include Repair Payment entries
CREATE OR REPLACE VIEW public.activity_logs AS
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
  'payment_' || ro.id::text,
  GREATEST(ro.updated_at, ro.created_at)::time,
  'Repair Payment'::text,
  'Ticket #R-' || ro.id || ': ' || ro.device_brand || ' ' || ro.device_model || ' Abono',
  ro.abonos_paid,
  'Paid'::text,
  ro.updated_at
FROM public.repair_orders ro
WHERE COALESCE(ro.abonos_paid, 0) > 0
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
