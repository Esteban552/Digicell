import { describe, it, expect } from 'vitest';
import { FIELD_MAP, dbToComponent, componentToDb } from './repairTransform';
import type { RepairOrder as DBRepairOrder } from './supabase-types';
import type { RepairOrder } from '../types';

describe('FIELD_MAP', () => {
  it('maps all expected camelCase keys', () => {
    expect(FIELD_MAP.clientName).toBe('client_name');
    expect(FIELD_MAP.deviceModel).toBe('device_model');
    expect(FIELD_MAP.totalCost).toBe('total_cost');
    expect(FIELD_MAP.advancePaid).toBe('advance_paid');
    expect(FIELD_MAP.abonosPaid).toBe('abonos_paid');
  });

  it('has matching entries for every component field except generated ones', () => {
    const componentFields = [
      'clientName', 'clientPhone', 'clientEmail', 'deviceBrand', 'deviceModel',
      'deviceSerial', 'devicePassword', 'deviceColor', 'powersOn', 'batteryPercent',
      'chargerLeft', 'coverLeft', 'receivingCondition', 'problemReported',
      'internalNotes', 'status', 'technician', 'deliveryDate', 'warrantyEnd',
      'totalCost', 'advancePaid', 'abonosPaid', 'footnote',
    ];
    for (const f of componentFields) {
      expect(FIELD_MAP[f]).toBeTruthy();
    }
  });
});

describe('dbToComponent', () => {
  const dbRow: DBRepairOrder = {
    id: 42,
    client_name: 'Juan Pérez',
    client_phone: '5512345678',
    client_email: 'juan@example.com',
    device_brand: 'Apple',
    device_model: 'iPhone 12',
    device_serial: 'ABC123',
    device_password: '1234',
    device_color: 'Negro',
    powers_on: 'Yes',
    battery_percent: '80',
    charger_left: true,
    cover_left: false,
    receiving_condition: 'Rayones',
    problem_reported: 'No enciende',
    internal_notes: 'Cliente apurado',
    status: 'in_review',
    technician: 'Tech Alex',
    delivery_date: '2026-07-01',
    warranty_end: '2026-09-01',
    total_cost: 500,
    advance_paid: 200,
    abonos_paid: 50,
    remaining_balance: 250,
    footnote: 'Garantía 30 días',
    created_by: 'user-123',
    created_at: '2026-06-27T10:00:00Z',
    updated_at: '2026-06-27T10:00:00Z',
  };

  it('converts snake_case DB to camelCase component', () => {
    const comp = dbToComponent(dbRow);
    expect(comp.id).toBe('42');
    expect(comp.clientName).toBe('Juan Pérez');
    expect(comp.clientPhone).toBe('5512345678');
    expect(comp.clientEmail).toBe('juan@example.com');
    expect(comp.deviceBrand).toBe('Apple');
    expect(comp.deviceModel).toBe('iPhone 12');
    expect(comp.deviceSerial).toBe('ABC123');
    expect(comp.devicePassword).toBe('1234');
    expect(comp.deviceColor).toBe('Negro');
    expect(comp.powersOn).toBe('Yes');
    expect(comp.batteryPercent).toBe('80');
    expect(comp.chargerLeft).toBe(true);
    expect(comp.coverLeft).toBe(false);
    expect(comp.receivingCondition).toBe('Rayones');
    expect(comp.problemReported).toBe('No enciende');
    expect(comp.internalNotes).toBe('Cliente apurado');
    expect(comp.status).toBe('in_review');
    expect(comp.technician).toBe('Tech Alex');
    expect(comp.deliveryDate).toBe('2026-07-01');
    expect(comp.warrantyEnd).toBe('2026-09-01');
    expect(comp.totalCost).toBe(500);
    expect(comp.advancePaid).toBe(200);
    expect(comp.abonosPaid).toBe(50);
    expect(comp.remainingBalance).toBe(250);
    expect(comp.footnote).toBe('Garantía 30 días');
    expect(comp.createdAt).toBe('2026-06-27T10:00:00Z');
  });

  it('handles null values by converting to empty string', () => {
    const partial: DBRepairOrder = {
      ...dbRow,
      client_phone: null as unknown as string,
      client_email: null as unknown as string,
      internal_notes: null as unknown as string,
    };
    const comp = dbToComponent(partial);
    expect(comp.clientPhone).toBe('');
    expect(comp.clientEmail).toBe('');
    expect(comp.internalNotes).toBe('');
  });

  it('handles null abonos_paid as 0', () => {
    const partial: DBRepairOrder = { ...dbRow, abonos_paid: null as unknown as number };
    const comp = dbToComponent(partial);
    expect(comp.abonosPaid).toBe(0);
  });
});

describe('componentToDb', () => {
  it('converts camelCase component fields to snake_case DB', () => {
    const comp: Partial<RepairOrder> = {
      clientName: 'María Gómez',
      deviceModel: 'Samsung S22',
      totalCost: 700,
      advancePaid: 300,
    };
    const db = componentToDb(comp);
    expect(db.client_name).toBe('María Gómez');
    expect(db.device_model).toBe('Samsung S22');
    expect(db.total_cost).toBe(700);
    expect(db.advance_paid).toBe(300);
  });

  it('skips generated DB fields (id, remaining_balance, etc)', () => {
    const comp: Partial<RepairOrder> = {
      id: '99',
      remainingBalance: 400,
      clientName: 'Test',
    };
    const db = componentToDb(comp);
    expect(db.id).toBeUndefined();
    expect(db.remaining_balance).toBeUndefined();
    expect(db.client_name).toBe('Test');
  });

  it('returns empty object for empty input', () => {
    expect(componentToDb({})).toEqual({});
  });

  it('maps all component fields correctly', () => {
    const comp: Partial<RepairOrder> = {
      clientName: 'a', clientPhone: 'b', clientEmail: 'c',
      deviceBrand: 'd', deviceModel: 'e', deviceSerial: 'f',
      devicePassword: 'g', deviceColor: 'h', powersOn: 'Yes',
      batteryPercent: 'i', chargerLeft: true, coverLeft: false,
      receivingCondition: 'j', problemReported: 'k',
      internalNotes: 'l', status: 'in_review', technician: 'm',
      deliveryDate: 'n', warrantyEnd: 'o', totalCost: 1,
      advancePaid: 2, abonosPaid: 3, footnote: 'p',
    };
    const db = componentToDb(comp);
    expect(db.client_name).toBe('a');
    expect(db.client_phone).toBe('b');
    expect(db.client_email).toBe('c');
    expect(db.device_brand).toBe('d');
    expect(db.device_model).toBe('e');
    expect(db.device_serial).toBe('f');
    expect(db.device_password).toBe('g');
    expect(db.device_color).toBe('h');
    expect(db.powers_on).toBe('Yes');
    expect(db.battery_percent).toBe('i');
    expect(db.charger_left).toBe(true);
    expect(db.cover_left).toBe(false);
    expect(db.receiving_condition).toBe('j');
    expect(db.problem_reported).toBe('k');
    expect(db.internal_notes).toBe('l');
    expect(db.status).toBe('in_review');
    expect(db.technician).toBe('m');
    expect(db.delivery_date).toBe('n');
    expect(db.warranty_end).toBe('o');
    expect(db.total_cost).toBe(1);
    expect(db.advance_paid).toBe(2);
    expect(db.abonos_paid).toBe(3);
    expect(db.footnote).toBe('p');
  });
});
