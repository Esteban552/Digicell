import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { CashMovement as DBCashMovement } from '../lib/supabase-types';
import type { CashRegistryMovement } from '../types';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function dbToComponent(db: DBCashMovement): CashRegistryMovement {
  return {
    id: String(db.id),
    type: db.type,
    amount: db.amount,
    note: db.note,
    time: formatTime(db.created_at),
  };
}

interface UseCashMovementsReturn {
  data: CashRegistryMovement[];
  loading: boolean;
  error: string | null;
  add: (type: 'in' | 'out', amount: number, note: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useCashMovements(): UseCashMovementsReturn {
  const [data, setData] = useState<CashRegistryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: rows, error: err } = await supabase
      .from('cash_movements')
      .select('*')
      .order('created_at', { ascending: false });

    if (err) {
      setError(err.message);
      setData([]);
    } else {
      setData((rows ?? []).map(dbToComponent));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const add = useCallback(async (type: 'in' | 'out', amount: number, note: string): Promise<boolean> => {
    const user = (await supabase.auth.getUser()).data.user;

    const { data: row, error: err } = await supabase
      .from('cash_movements')
      .insert({
        type,
        amount,
        note,
        created_by: user?.id ?? null,
      })
      .select()
      .single();

    if (err || !row) {
      setError(err?.message ?? 'Error al registrar movimiento');
      return false;
    }

    setData(prev => [dbToComponent(row as DBCashMovement), ...prev]);
    return true;
  }, []);

  return { data, loading, error, add, refetch: fetchMovements };
}
