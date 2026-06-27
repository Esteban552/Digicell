import { LogEntry, RepairOrder } from '../types';

export interface ReportStats {
  totalSales: number;
  totalAdvances: number;
  totalCashInRegister: number;
}

export interface DashboardStats {
  urgent: number;
  inProgress: number;
  completed: number;
}

export function calcReportStats(logs: LogEntry[]): ReportStats {
  const totalSales = logs
    .filter(l => l.type === 'POS Sale')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalAdvances = logs
    .filter(l => l.type === 'Repair Advance')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const startingFundBase = 1000.00;
  const collections = logs.reduce((acc, curr) => acc + curr.amount, 0);

  return {
    totalSales,
    totalAdvances,
    totalCashInRegister: startingFundBase + collections,
  };
}

export function calcDashboardStats(repairs: RepairOrder[]): DashboardStats {
  const waitingParts = repairs.filter(r => r.status === 'waiting_parts').length;
  const inReview = repairs.filter(r => r.status === 'in_review').length;
  const repaired = repairs.filter(r => r.status === 'repaired').length;

  return {
    urgent: waitingParts + inReview,
    inProgress: repaired,
    completed: repairs.filter(r => r.status === 'delivered').length,
  };
}
