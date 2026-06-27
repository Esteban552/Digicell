import { useState, useCallback } from 'react';

export interface ToastMessage {
  title: string;
  desc: string;
  type: 'success' | 'info' | 'error';
}

export function useToast() {
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);

  const showToast = useCallback((title: string, desc: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage({ title, desc, type });
  }, []);

  return { toastMessage, showToast, setToastMessage };
}
