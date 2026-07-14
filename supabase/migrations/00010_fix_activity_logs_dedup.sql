-- ============================================================
-- Migration 00010: Fix double-counting in activity_logs view
-- 
-- Problem: Cash movements from POS sales and repair payments
-- are stored in BOTH the source table (sales/repair_orders) AND
-- cash_movements, causing double-counting in reports.
--
-- Fix: Filter cash_movements to only include MANUAL entries
-- (added via the "Register cash movement" form). Auto-generated
-- entries (POS net cash, repair advances/abonos) are excluded
-- since their source data is already in the view.
-- ============================================================

DROP VIEW IF EXISTS public.activity_logs;

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
-- Only include MANUAL cash movements, not auto-generated ones
-- Auto-generated POS entries contain "Neto efectivo"
-- Auto-generated repair entries contain "Anticipo Reparación" or "Abono Reparación"
WHERE cm.note NOT LIKE '%Neto efectivo%'
  AND cm.note NOT LIKE '%Anticipo Reparación%'
  AND cm.note NOT LIKE '%Abono Reparación%'
ORDER BY created_at DESC;
