import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/supabase-types';

interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export function useProfile(userId: string | null): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (err) {
      setError(err.message);
      setProfile(null);
    } else {
      setProfile(data as Profile);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error };
}
