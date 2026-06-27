import { useMemo } from 'react';
import { LogEntry, RepairOrder } from '../types';
import { calcReportStats, calcDashboardStats } from '../lib/reportStats';

export function useAppStats(logs: LogEntry[], repairs: RepairOrder[]) {
  const calculatedStats = useMemo(() => calcReportStats(logs), [logs]);
  const dashboardBentoStats = useMemo(() => calcDashboardStats(repairs), [repairs]);

  return { calculatedStats, dashboardBentoStats };
}
