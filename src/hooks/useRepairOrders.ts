import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { RepairOrder as DBRepairOrder } from '../lib/supabase-types';
import type { RepairOrder } from '../types';
import { dbToComponent, componentToDb } from '../lib/repairTransform';
import { getBusinessInfo } from '../lib/businessInfo';

type DBWritable = Omit<DBRepairOrder, 'id' | 'remaining_balance' | 'created_at' | 'created_by' | 'updated_at'>;

function defaults(): DBWritable {
  const today = new Date().toISOString().split('T')[0];
  const warrantyEnd = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().split('T')[0];
  return {
    client_name: '',
    client_phone: '',
    client_email: '',
    device_brand: 'Apple',
    device_model: '',
    device_serial: '',
    device_password: '',
    device_color: '',
    powers_on: 'Yes',
    battery_percent: '',
    charger_left: false,
    cover_left: false,
    receiving_condition: '',
    problem_reported: '',
    internal_notes: '',
    status: 'in_review',
    technician: 'Unassigned',
    delivery_date: today,
    warranty_end: warrantyEnd,
    total_cost: 0,
    advance_paid: 0,
    abonos_paid: 0,
    footnote: getBusinessInfo().warrantyText,
  };
}

interface UseRepairOrdersReturn {
  data: RepairOrder[];
  loading: boolean;
  error: string | null;
  create: (overrides?: Partial<RepairOrder>) => Promise<RepairOrder | null>;
  update: (id: string, fields: Partial<RepairOrder>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useRepairOrders(): UseRepairOrdersReturn {
  const [data, setData] = useState<RepairOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: rows, error: err } = await supabase
      .from('repair_orders')
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
    fetchOrders();
  }, [fetchOrders]);

  const create = useCallback(async (overrides?: Partial<RepairOrder>): Promise<RepairOrder | null> => {
    const payload: Record<string, unknown> = { ...defaults() };
    if (overrides) {
      Object.assign(payload, componentToDb(overrides));
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) payload.created_by = user.id;

    const { data: row, error: err } = await supabase
      .from('repair_orders')
      .insert(payload)
      .select()
      .single();

    if (err || !row) {
      setError(err?.message ?? 'Error al crear orden');
      return null;
    }

    const mapped = dbToComponent(row as DBRepairOrder);
    setData(prev => [mapped, ...prev]);
    return mapped;
  }, []);

  const update = useCallback(async (id: string, fields: Partial<RepairOrder>) => {
    const dbFields = componentToDb(fields);

    const { error: err } = await supabase
      .from('repair_orders')
      .update(dbFields)
      .eq('id', Number(id));

    if (err) {
      setError(err.message);
      return;
    }

    setData(prev => prev.map(r => r.id === id ? { ...r, ...fields } : r));
  }, []);

  const remove = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('repair_orders')
      .delete()
      .eq('id', Number(id));

    if (err) {
      setError(err.message);
      return;
    }

    setData(prev => prev.filter(r => r.id !== id));
  }, []);

  return { data, loading, error, create, update, remove, refetch: fetchOrders };
}
