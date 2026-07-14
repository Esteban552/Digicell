-- ============================================================
-- Migration 00008: Cash audit persistence (arqueos)
-- Persists cash register audits so they survive page reloads
-- ============================================================

-- 1. Create arqueos table
CREATE TABLE IF NOT EXISTS public.arqueos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  fondo_inicial NUMERIC(10,2) NOT NULL DEFAULT 1000,
  total_entradas NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_salidas NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_esperado NUMERIC(10,2) NOT NULL DEFAULT 1000,
  total_fisico NUMERIC(10,2) NOT NULL DEFAULT 0,
  diferencia NUMERIC(10,2) NOT NULL DEFAULT 0,
  denominaciones JSONB NOT NULL DEFAULT '{}'::jsonb,
  desglose JSONB NOT NULL DEFAULT '{}'::jsonb,
  notas TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_arqueos_fecha ON public.arqueos(fecha DESC);
CREATE INDEX idx_arqueos_created_by ON public.arqueos(created_by);

ALTER TABLE public.arqueos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view arqueos"
  ON public.arqueos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert arqueos"
  ON public.arqueos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete own arqueos"
  ON public.arqueos FOR DELETE
  USING (auth.role() = 'authenticated');

-- 2. Add cost price column to products (for profit reporting)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost NUMERIC(10,2) NOT NULL DEFAULT 0;
