import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { LogEntry } from '../types';

interface UseActivityLogsReturn {
  data: LogEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useActivityLogs(): UseActivityLogsReturn {
  const [data, setData] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: logs, error: err } = await supabase
      .from('activity_logs')
      .select('*');

    if (err) {
      setError(err.message);
      setData([]);
    } else {
      setData((logs ?? []) as LogEntry[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { data, loading, error, refetch: fetchLogs };
}
