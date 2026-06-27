import type { RepairOrder as DBRepairOrder } from '../lib/supabase-types';
import type { RepairOrder } from '../types';

export const FIELD_MAP: Record<string, string> = {
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
  internalNotes: 'internal_notes',
  status: 'status',
  technician: 'technician',
  deliveryDate: 'delivery_date',
  warrantyEnd: 'warranty_end',
  totalCost: 'total_cost',
  advancePaid: 'advance_paid',
  abonosPaid: 'abonos_paid',
  footnote: 'footnote',
};

const GENERATED_DB = new Set(['id', 'remaining_balance', 'created_at', 'created_by', 'updated_at']);

export function dbToComponent(db: DBRepairOrder): RepairOrder {
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
    internalNotes: db.internal_notes ?? '',
    status: db.status,
    technician: db.technician,
    deliveryDate: db.delivery_date ?? '',
    warrantyEnd: db.warranty_end ?? '',
    totalCost: db.total_cost,
    advancePaid: db.advance_paid,
    abonosPaid: db.abonos_paid ?? 0,
    remainingBalance: db.remaining_balance,
    footnote: db.footnote ?? '',
    createdAt: db.created_at,
  };
}

export function componentToDb(comp: Partial<RepairOrder>): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(comp)) {
    const dbKey = FIELD_MAP[key];
    if (dbKey && !GENERATED_DB.has(dbKey)) {
      db[dbKey] = val;
    }
  }
  return db;
}
