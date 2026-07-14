import { useState, useMemo, useEffect } from 'react';

interface DeliveryPaymentModalProps {
  open: boolean;
  clientName: string;
  remaining: number;
  onConfirm: (amount: number) => void;
  onClose: () => void;
}

export default function DeliveryPaymentModal({
  open,
  clientName,
  remaining,
  onConfirm,
  onClose,
}: DeliveryPaymentModalProps) {
  const [received, setReceived] = useState(0);

  // Reset received amount every time the modal opens
  useEffect(() => {
    if (open) setReceived(remaining);
  }, [open, remaining]);

  const change = useMemo(() => Math.max(0, received - remaining), [received, remaining]);
  const short = useMemo(() => Math.max(0, remaining - received), [received, remaining]);
  const canConfirm = received > 0 && short === 0;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(received);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-outline-variant w-full max-w-sm shadow-2xl flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center select-none">
          <h3 className="text-sm font-bold text-on-surface font-sans">Cobrar y Entregar</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-error transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="text-center select-none">
            <p className="text-[11px] font-bold text-on-surface-variant font-sans uppercase tracking-wider mb-1">
              Cliente
            </p>
            <p className="text-base font-bold text-on-surface font-sans">{clientName}</p>
          </div>

          <div className="bg-surface-container-low rounded-lg p-4 select-none">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs font-semibold text-on-surface-variant font-sans">Saldo pendiente</span>
              <span className="text-lg font-bold font-mono text-on-surface">${remaining.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-semibold text-on-surface-variant font-sans">Total a cobrar</span>
              <span className="text-lg font-bold font-mono text-primary">${remaining.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-on-surface-variant font-sans">Efectivo recibido</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-sans text-on-surface-variant font-semibold">$</span>
              <input
                type="number"
                min="0"
                step="any"
                value={received || ''}
                placeholder="0.00"
                onChange={(e) => setReceived(Math.max(0, Number(e.target.value) || 0))}
                autoFocus
                className="h-12 w-full pl-8 pr-4 border border-outline-variant rounded-lg bg-white text-right text-lg font-mono font-bold text-on-surface focus:border-tertiary outline-none transition-all"
              />
            </div>
          </div>

          {change > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex justify-between items-center select-none">
              <span className="text-xs font-bold text-emerald-700 font-sans">Cambio a entregar</span>
              <span className="text-lg font-bold font-mono text-emerald-600">${change.toFixed(2)}</span>
            </div>
          )}

          {short > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex justify-between items-center select-none">
              <span className="text-xs font-bold text-red-700 font-sans">Saldo pendiente</span>
              <span className="text-lg font-bold font-mono text-red-600">${short.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-outline-variant bg-surface-container flex justify-end gap-3 select-none">
          <button
            onClick={onClose}
            className="px-4.5 h-10 border border-outline text-on-surface text-xs font-semibold rounded bg-white hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="px-4.5 h-10 bg-primary hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded shadow-sm flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">handshake</span>
            Cobrar y Entregar
          </button>
        </div>
      </div>
    </div>
  );
}
