import { describe, it, expect } from 'vitest';
import { calcReportStats, calcDashboardStats } from './reportStats';
import type { LogEntry, RepairOrder } from '../types';

describe('calcReportStats', () => {
  it('returns zeros for empty logs', () => {
    const r = calcReportStats([]);
    expect(r).toEqual({ totalSales: 0, totalAdvances: 0, totalCashInRegister: 1000 });
  });

  it('sums POS Sale amounts correctly', () => {
    const logs: LogEntry[] = [
      { id: '1', time: '', type: 'POS Sale', description: '', amount: 150, status: 'Paid' },
      { id: '2', time: '', type: 'POS Sale', description: '', amount: 50, status: 'Paid' },
      { id: '3', time: '', type: 'Repair Advance', description: '', amount: 100, status: 'Advance' },
    ];
    const r = calcReportStats(logs);
    expect(r.totalSales).toBe(200);
    expect(r.totalAdvances).toBe(100);
  });

  it('calculates totalCashInRegister as 1000 + all collections', () => {
    const logs: LogEntry[] = [
      { id: '1', time: '', type: 'POS Sale', description: '', amount: 300, status: 'Paid' },
      { id: '2', time: '', type: 'Repair Advance', description: '', amount: 200, status: 'Advance' },
      { id: '3', time: '', type: 'Cash Movement', description: '', amount: 500, status: 'Outflow' },
    ];
    const r = calcReportStats(logs);
    expect(r.totalCashInRegister).toBe(1000 + 300 + 200 + 500);
  });
});

describe('calcDashboardStats', () => {
  const base: RepairOrder = {
    id: '1', clientName: '', clientPhone: '', clientEmail: '',
    deviceBrand: '', deviceModel: '', deviceSerial: '', devicePassword: '',
    deviceColor: '', powersOn: 'Yes', batteryPercent: '', chargerLeft: false,
    coverLeft: false, receivingCondition: '', problemReported: '', internalNotes: '',
    status: 'in_review',
    technician: '', deliveryDate: '', warrantyEnd: '', totalCost: 0,
    advancePaid: 0, abonosPaid: 0, remainingBalance: 0, footnote: '',
    createdAt: '',
  };

  it('counts statuses correctly', () => {
    const repairs: RepairOrder[] = [
      { ...base, id: '1', status: 'in_review' },
      { ...base, id: '2', status: 'in_review' },
      { ...base, id: '3', status: 'waiting_parts' },
      { ...base, id: '4', status: 'repaired' },
      { ...base, id: '5', status: 'repaired' },
      { ...base, id: '6', status: 'delivered' },
    ];
    const r = calcDashboardStats(repairs);
    expect(r.urgent).toBe(3);     // in_review(2) + waiting_parts(1)
    expect(r.inProgress).toBe(2); // repaired(2)
    expect(r.completed).toBe(1);  // delivered(1)
  });

  it('returns zeros for empty array', () => {
    const r = calcDashboardStats([]);
    expect(r).toEqual({ urgent: 0, inProgress: 0, completed: 0 });
  });
});
