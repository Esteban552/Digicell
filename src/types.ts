/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RepairStatus = 'in_review' | 'waiting_parts' | 'repaired' | 'delivered';

export interface RepairOrder {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  deviceBrand: string;
  deviceModel: string;
  deviceSerial: string;
  devicePassword: string;
  deviceColor: string;
  powersOn: 'Yes' | 'No';
  batteryPercent: string;
  chargerLeft: boolean;
  coverLeft: boolean;
  receivingCondition: string;
  problemReported: string;
  status: RepairStatus;
  technician: string;
  deliveryDate: string;
  warrantyEnd: string;
  totalCost: number;
  advancePaid: number;
  remainingBalance: number;
  footnote: string;
  createdAt: string;
}

export interface CartItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

export interface LogEntry {
  id: string;
  time: string;
  type: 'Repair Advance' | 'POS Sale' | 'Cash Movement' | 'Repair Payment';
  description: string;
  amount: number;
  status: 'Advance' | 'Paid' | 'Outflow';
}

export interface CashRegistryMovement {
  id: string;
  type: 'in' | 'out';
  amount: number;
  note: string;
  time: string;
}

export type ActiveView = 'login' | 'dashboard' | 'pos' | 'repairs' | 'reports' | 'settings';
