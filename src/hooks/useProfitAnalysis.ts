import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface ProfitData {
  ventaTotal: number;
  costoTotal: number;
  ganancia: number;
  margen: number;
  ventasConCosto: number;
  totalVentas: number;
}

export function useProfitAnalysis() {
  const [data, setData] = useState<ProfitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfit = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: rows, error: err } = await supabase
      .from('profit_analysis')
      .select('*');

    if (err) {
      setError(err.message);
      setData(null);
      setLoading(false);
      return;
    }

    const entries = rows ?? [];
    const totalVentas = entries.length;
    const ventaTotal = entries.reduce((a, c) => a + c.venta_total, 0);
    const costoTotal = entries.reduce((a, c) => a + c.costo_total, 0);
    const ganancia = entries.reduce((a, c) => a + c.ganancia_estimada, 0);
    const ventasConCosto = entries.filter(e => e.costo_total > 0).length;
    const margen = ventaTotal > 0 ? (ganancia / ventaTotal) * 100 : 0;

    setData({ ventaTotal, costoTotal, ganancia, margen, ventasConCosto, totalVentas });
    setLoading(false);
  }, []);

  useEffect(() => { fetchProfit(); }, [fetchProfit]);

  return { data, loading, error, refetch: fetchProfit };
}
