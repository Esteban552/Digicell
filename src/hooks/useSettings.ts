import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Setting } from '../lib/supabase-types';

interface UseSettingsReturn {
  data: Record<string, string>;
  loading: boolean;
  error: string | null;
  update: (key: string, value: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useSettings(): UseSettingsReturn {
  const [data, setData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: settings, error: err } = await supabase
      .from('settings')
      .select('*');

    if (err) {
      setError(err.message);
      setData({});
    } else {
      const map: Record<string, string> = {};
      ((settings ?? []) as Setting[]).forEach(s => { map[s.key] = s.value; });
      setData(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = useCallback(async (key: string, value: string) => {
    const { error: err } = await supabase
      .from('settings')
      .upsert({ key, value });

    if (err) {
      setError(err.message);
      return;
    }

    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  return { data, loading, error, update: updateSetting, refetch: fetchSettings };
}
