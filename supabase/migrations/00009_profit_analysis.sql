-- ============================================================
-- Migration 00009: Profit analysis view
-- Estimates profit per sale by matching sale_items to products.cost
-- ============================================================

-- Drop if exists (idempotent)
DROP VIEW IF EXISTS public.profit_analysis;

CREATE VIEW public.profit_analysis AS
SELECT
  s.id AS sale_id,
  s.created_at::date AS fecha,
  s.total AS venta_total,
  COALESCE((
    SELECT SUM(si.qty * COALESCE(p.cost, 0))
    FROM public.sale_items si
    LEFT JOIN public.products p ON p.name = si.product_name AND p.active = true
    WHERE si.sale_id = s.id
  ), 0) AS costo_total,
  s.total - COALESCE((
    SELECT SUM(si.qty * COALESCE(p.cost, 0))
    FROM public.sale_items si
    LEFT JOIN public.products p ON p.name = si.product_name AND p.active = true
    WHERE si.sale_id = s.id
  ), 0) AS ganancia_estimada
FROM public.sales s
WHERE s.total > 0
ORDER BY s.created_at DESC;
