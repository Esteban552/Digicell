import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Sale, Refund } from '../lib/supabase-types';

export function useRefunds() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Busca una venta por su ID numérico (folio). */
  const searchSaleById = useCallback(async (id: number): Promise<Sale | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('sales')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (err) throw err;
      return data as Sale | null;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /** Obtiene todas las ventas de una fecha (formato YYYY-MM-DD). */
  const listSalesByDate = useCallback(async (date: string): Promise<Sale[]> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', `${date}T00:00:00-07:00`)
        .lt('created_at', `${date}T23:59:59-07:00`)
        .order('created_at', { ascending: false });

      if (err) throw err;
      return (data as Sale[]) ?? [];
    } catch (e: any) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /** Crea un refund + cash_movement de salida. */
  const createRefund = useCallback(async (
    sale: Sale,
    reason: string,
    cancelledBy: string,
  ): Promise<Refund | null> => {
    setLoading(true);
    setError(null);
    try {
      // 1. Insert refund
      const { error: refundErr } = await supabase
        .from('refunds')
        .insert({
          sale_id: sale.id,
          total: sale.total,
          cash_amount: sale.cash_amount,
          card_amount: sale.card_amount,
          usd_amount: sale.usd_amount,
          reason,
          cancelled_by: cancelledBy,
        });

      if (refundErr) throw refundErr;

      // 2. Insert cash movement (out) so register balance reflects it.
      //    Usamos total - card porque cash_amount puede incluir billete
      //    mayor al total (ej: $1000 para pagar $750).
      const cashToReturn = sale.total - sale.card_amount;
      if (cashToReturn > 0) {
        const user = (await supabase.auth.getUser()).data.user;
        const note = `Reembolso Ticket #${sale.id}${reason ? ': ' + reason : ''}`;
        const { error: cmErr } = await supabase
          .from('cash_movements')
          .insert({
            type: 'out',
            amount: cashToReturn,
            note,
            created_by: user?.id ?? null,
          });

        if (cmErr) throw cmErr;
      }

      return { id: '', sale_id: sale.id, total: sale.total, cash_amount: sale.cash_amount, card_amount: sale.card_amount, usd_amount: sale.usd_amount, reason, cancelled_by: cancelledBy, created_at: '' } as Refund;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /** Verifica si una venta ya fue reembolsada. */
  const isRefunded = useCallback(async (saleId: number): Promise<boolean> => {
    try {
      const { count, error: err } = await supabase
        .from('refunds')
        .select('*', { count: 'exact', head: true })
        .eq('sale_id', saleId);

      if (err) throw err;
      return (count ?? 0) > 0;
    } catch {
      return false;
    }
  }, []);

  return {
    searchSaleById,
    listSalesByDate,
    createRefund,
    isRefunded,
    loading,
    error,
  };
}
