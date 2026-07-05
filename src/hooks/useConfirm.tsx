import { useState, useCallback, useRef } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<(value: boolean) => void>(() => {});

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setOptions(opts);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setOptions(null);
    resolveRef.current(true);
  }, []);

  const handleCancel = useCallback(() => {
    setOptions(null);
    resolveRef.current(false);
  }, []);

  const ConfirmModal = useCallback(() => {
    if (!options) return null;

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={handleCancel}>
        <div
          className="bg-white rounded-xl border border-outline-variant shadow-xl w-[400px] p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-bold font-sans text-on-surface">{options.title}</h3>
          <p className="text-sm font-sans text-on-surface-variant font-medium mt-2 leading-relaxed">
            {options.message}
          </p>
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCancel}
              className="flex-1 h-10 border border-outline rounded-md text-sm font-semibold font-sans hover:bg-surface-container-low outline-none cursor-pointer"
            >
              {options.cancelLabel || 'Cancelar'}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 h-10 rounded-md text-sm font-bold font-sans text-white shadow-sm outline-none cursor-pointer ${
                options.danger ? 'bg-error hover:bg-error/90' : 'bg-primary hover:bg-primary-container'
              }`}
            >
              {options.confirmLabel || 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    );
  }, [options, handleConfirm, handleCancel]);

  return { confirm, ConfirmModal };
}
