import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Arqueo as DBArqueo } from '../lib/supabase-types';

export interface ArqueoSummary {
  id: number;
  fecha: string;
  fondoInicial: number;
  totalEntradas: number;
  totalSalidas: number;
  totalEsperado: number;
  totalFisico: number;
  diferencia: number;
  denominaciones: Record<string, number>;
  desglose: Record<string, number>;
  notas: string;
  createdAt: string;
}

function dbToComponent(db: DBArqueo): ArqueoSummary {
  return {
    id: db.id,
    fecha: db.fecha,
    fondoInicial: db.fondo_inicial,
    totalEntradas: db.total_entradas,
    totalSalidas: db.total_salidas,
    totalEsperado: db.total_esperado,
    totalFisico: db.total_fisico,
    diferencia: db.diferencia,
    denominaciones: typeof db.denominaciones === 'object' ? db.denominaciones : {},
    desglose: typeof db.desglose === 'object' ? db.desglose : {},
    notas: db.notas,
    createdAt: db.created_at,
  };
}

interface UseArqueosReturn {
  historial: ArqueoSummary[];
  loading: boolean;
  error: string | null;
  save: (data: {
    fondoInicial: number;
    totalEntradas: number;
    totalSalidas: number;
    totalEsperado: number;
    totalFisico: number;
    diferencia: number;
    denominaciones: Record<string, number>;
    desglose: Record<string, number>;
    notas?: string;
  }) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useArqueos(): UseArqueosReturn {
  const [historial, setHistorial] = useState<ArqueoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArqueos = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: rows, error: err } = await supabase
      .from('arqueos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (err) {
      setError(err.message);
      setHistorial([]);
    } else {
      setHistorial((rows ?? []).map(dbToComponent));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArqueos();
  }, [fetchArqueos]);

  const save = useCallback(async (data: {
    fondoInicial: number;
    totalEntradas: number;
    totalSalidas: number;
    totalEsperado: number;
    totalFisico: number;
    diferencia: number;
    denominaciones: Record<string, number>;
    desglose: Record<string, number>;
    notas?: string;
  }): Promise<boolean> => {
    const user = (await supabase.auth.getUser()).data.user;
    const { error: err } = await supabase.from('arqueos').insert({
      fondo_inicial: data.fondoInicial,
      total_entradas: data.totalEntradas,
      total_salidas: data.totalSalidas,
      total_esperado: data.totalEsperado,
      total_fisico: data.totalFisico,
      diferencia: data.diferencia,
      denominaciones: data.denominaciones,
      desglose: data.desglose,
      notas: data.notas ?? '',
      created_by: user?.id ?? null,
    });

    if (err) {
      setError(err.message);
      return false;
    }

    await fetchArqueos();
    return true;
  }, [fetchArqueos]);

  return { historial, loading, error, save, refetch: fetchArqueos };
}
