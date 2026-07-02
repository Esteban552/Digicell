-- Add discount column to sales table
ALTER TABLE public.sales ADD COLUMN discount NUMERIC(10,2) NOT NULL DEFAULT 0;
