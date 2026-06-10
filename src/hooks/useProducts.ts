import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Product } from '../lib/supabase-types';

interface UseProductsReturn {
  data: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProducts(): UseProductsReturn {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: products, error: err } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('name');

    if (err) {
      setError(err.message);
      setData([]);
    } else {
      setData(products ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { data, loading, error, refetch: fetchProducts };
}
