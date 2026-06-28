import { useMemo } from 'react';
import { LogEntry, RepairOrder } from '../types';
import { calcReportStats, calcDashboardStats } from '../lib/reportStats';

export function useAppStats(logs: LogEntry[], repairs: RepairOrder[], startingFund = 1000) {
  const calculatedStats = useMemo(() => calcReportStats(logs, startingFund), [logs, startingFund]);
  const dashboardBentoStats = useMemo(() => calcDashboardStats(repairs), [repairs]);

  return { calculatedStats, dashboardBentoStats };
}
