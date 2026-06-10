import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { RepairOrder as DBRepairOrder } from '../lib/supabase-types';
import type { RepairOrder } from '../types';

function dbToComponent(db: DBRepairOrder): RepairOrder {
  return {
    id: String(db.id),
    clientName: db.client_name ?? '',
    clientPhone: db.client_phone ?? '',
    clientEmail: db.client_email ?? '',
    deviceBrand: db.device_brand,
    deviceModel: db.device_model ?? '',
    deviceSerial: db.device_serial ?? '',
    devicePassword: db.device_password ?? '',
    deviceColor: db.device_color ?? '',
    powersOn: db.powers_on,
    batteryPercent: db.battery_percent ?? '',
    chargerLeft: db.charger_left,
    coverLeft: db.cover_left,
    receivingCondition: db.receiving_condition ?? '',
    problemReported: db.problem_reported ?? '',
    status: db.status,
    technician: db.technician,
    deliveryDate: db.delivery_date ?? '',
    warrantyEnd: db.warranty_end ?? '',
    totalCost: db.total_cost,
    advancePaid: db.advance_paid,
    remainingBalance: db.remaining_balance,
    footnote: db.footnote ?? '',
    createdAt: db.created_at,
  };
}

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
    status: 'in_review',
    technician: 'Unassigned',
    delivery_date: today,
    warranty_end: warrantyEnd,
    total_cost: 0,
    advance_paid: 0,
    footnote: 'Garantía de 30 días en piezas reemplazadas. No nos hacemos responsables por equipos olvidados después de 60 días.',
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

const FIELD_MAP: Record<string, string> = {
  clientName: 'client_name',
  clientPhone: 'client_phone',
  clientEmail: 'client_email',
  deviceBrand: 'device_brand',
  deviceModel: 'device_model',
  deviceSerial: 'device_serial',
  devicePassword: 'device_password',
  deviceColor: 'device_color',
  powersOn: 'powers_on',
  batteryPercent: 'battery_percent',
  chargerLeft: 'charger_left',
  coverLeft: 'cover_left',
  receivingCondition: 'receiving_condition',
  problemReported: 'problem_reported',
  status: 'status',
  technician: 'technician',
  deliveryDate: 'delivery_date',
  warrantyEnd: 'warranty_end',
  totalCost: 'total_cost',
  advancePaid: 'advance_paid',
  footnote: 'footnote',
};

const GENERATED_DB = new Set(['id', 'remaining_balance', 'created_at', 'created_by', 'updated_at']);

function componentToDb(comp: Partial<RepairOrder>): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(comp)) {
    const dbKey = FIELD_MAP[key];
    if (dbKey && !GENERATED_DB.has(dbKey)) {
      db[dbKey] = val;
    }
  }
  return db;
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
