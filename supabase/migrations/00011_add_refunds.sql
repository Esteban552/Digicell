-- ============================================================
-- Migration 00011: Refunds / Cancelación de tickets
--
-- Permite cancelar una venta POS registrando un reembolso.
-- La venta original NO se elimina — el refund se refleja como
-- entrada negativa en activity_logs (tipo 'Refund').
-- ============================================================

-- 1. Refunds table
CREATE TABLE public.refunds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id INTEGER NOT NULL REFERENCES public.sales(id),
  total NUMERIC(10,2) NOT NULL,
  cash_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  card_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  usd_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  reason TEXT DEFAULT ''::text,
  cancelled_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS (already on, but explicit)
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert refunds
CREATE POLICY "refunds_insert" ON public.refunds
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Authenticated users can select refunds (for the activity_logs view)
CREATE POLICY "refunds_select" ON public.refunds
  FOR SELECT TO authenticated
  USING (true);

-- 2. Rebuild activity_logs with refunds + filter refund cash_movements
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
  'refund_' || r.id::text,
  r.created_at::time,
  'Refund'::text,
  'Reembolso Ticket #' || r.sale_id || COALESCE(': ' || r.reason, ''),
  -r.total,
  'Refund'::text,
  r.created_at
FROM public.refunds r
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
WHERE cm.note NOT LIKE '%Neto efectivo%'
  AND cm.note NOT LIKE '%Anticipo Reparación%'
  AND cm.note NOT LIKE '%Abono Reparación%'
  AND cm.note NOT LIKE '%Reembolso%'
ORDER BY created_at DESC;
