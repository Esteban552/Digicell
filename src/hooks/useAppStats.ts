import { useMemo } from 'react';
import { LogEntry, RepairOrder } from '../types';

export function useAppStats(logs: LogEntry[], repairs: RepairOrder[]) {
  const calculatedStats = useMemo(() => {
    const salesOnly = logs
      .filter(l => l.type === 'POS Sale')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const advancesOnly = logs
      .filter(l => l.type === 'Repair Advance')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const startingFundBase = 1000.00;
    const collections = logs.reduce((acc, curr) => acc + curr.amount, 0);
    const finalRegisterFund = startingFundBase + collections;

    return {
      totalSales: salesOnly,
      totalAdvances: advancesOnly,
      totalCashInRegister: finalRegisterFund,
    };
  }, [logs]);

  const dashboardBentoStats = useMemo(() => {
    const waitingParts = repairs.filter(r => r.status === 'waiting_parts').length;
    const inReview = repairs.filter(r => r.status === 'in_review').length;
    const repaired = repairs.filter(r => r.status === 'repaired').length;

    return {
      urgent: waitingParts + inReview,
      inProgress: repaired,
      completed: repairs.filter(r => r.status === 'delivered').length,
    };
  }, [repairs]);

  return { calculatedStats, dashboardBentoStats };
}
