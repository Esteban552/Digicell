import type { RepairOrder } from '../../types';

interface FinancesSectionProps {
  repair: RepairOrder;
  isDraft: boolean;
  isDelivered: boolean;
  errors: Record<string, string>;
  remainingCalculated: number;
  onClearError: (field: string) => void;
  onSetError: (field: string, msg: string) => void;
  onDirectUpdate: (id: string, fields: Partial<RepairOrder>) => void;
}

export default function FinancesSection({
  repair,
  isDraft,
  isDelivered,
  errors,
  remainingCalculated,
  onClearError,
  onSetError,
  onDirectUpdate,
}: FinancesSectionProps) {
  return (
    <div className="bg-white border border-outline-variant rounded-md p-5 select-none hover:shadow-sm transition-all shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
      <h3 className="text-sm font-bold text-on-surface border-b border-outline-variant/60 pb-3 mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-[20px]">payments</span>
        Finanzas
      </h3>
      <div className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-on-surface-variant font-sans">Costo Total ($)</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-sans text-on-surface-variant">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              readOnly={isDelivered}
              value={repair.totalCost === 0 ? '' : repair.totalCost}
              onChange={(e) => {
                if (isDelivered) return;
                const costVal = Math.max(0, Number(e.target.value) || 0);
                onDirectUpdate(repair.id, {
                  totalCost: costVal,
                  remainingBalance: Math.max(0, costVal - (repair.advancePaid || 0) - (repair.abonosPaid || 0)),
                });
                if (errors.totalCost) onClearError('totalCost');
              }}
              onBlur={() => {
                if (repair.totalCost < 0) onSetError('totalCost', 'El costo no puede ser negativo');
                else onClearError('totalCost');
              }}
              className={`h-10 w-full pl-6 pr-3 border rounded disabled:bg-surface-container-low/40 disabled:cursor-default bg-white text-right text-xs font-mono font-medium focus:border-tertiary outline-none ${errors.totalCost ? 'border-error' : 'border-outline-variant'}`}
            />
          </div>
          {errors.totalCost && <p className="text-[10px] font-sans text-error font-semibold">{errors.totalCost}</p>}
        </div>

        <fieldset disabled={!isDraft} className="border-0 p-0 m-0 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-on-surface-variant font-sans">Anticipo ($)</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-sans text-on-surface-variant">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                readOnly={!isDraft}
                placeholder="0.00"
                value={repair.advancePaid === 0 ? '' : repair.advancePaid}
                onChange={(e) => {
                  if (!isDraft) return;
                  const advVal = Math.max(0, Number(e.target.value) || 0);
                  onDirectUpdate(repair.id, {
                    advancePaid: advVal,
                    remainingBalance: Math.max(0, repair.totalCost - advVal - (repair.abonosPaid || 0)),
                  });
                }}
                className="h-10 w-full pl-6 pr-3 border border-outline-variant rounded disabled:bg-surface-container-low/40 disabled:cursor-default bg-white text-right text-xs font-mono font-bold text-primary focus:border-tertiary outline-none"
              />
            </div>
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-on-surface-variant font-sans">Abonos ($)</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-sans text-on-surface-variant">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              readOnly={isDelivered}
              value={repair.abonosPaid === 0 ? '' : repair.abonosPaid}
              onChange={(e) => {
                if (isDelivered) return;
                const abVal = Math.max(0, Number(e.target.value) || 0);
                const totalPaid = (repair.advancePaid || 0) + abVal;
                onDirectUpdate(repair.id, {
                  abonosPaid: abVal,
                  remainingBalance: Math.max(0, repair.totalCost - (repair.advancePaid || 0) - abVal),
                });
                if (totalPaid > repair.totalCost) onSetError('abonosPaid', 'Los abonos no pueden superar el saldo pendiente');
                else onClearError('abonosPaid');
              }}
              className={`h-10 w-full pl-6 pr-3 border rounded disabled:bg-surface-container-low/40 disabled:cursor-default bg-white text-right text-xs font-mono font-bold text-tertiary focus:border-tertiary outline-none ${errors.abonosPaid ? 'border-error' : 'border-outline-variant'}`}
            />
          </div>
          {errors.abonosPaid && <p className="text-[10px] font-sans text-error font-semibold">{errors.abonosPaid}</p>}
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-between items-center select-none font-sans font-medium text-xs text-on-surface-variant">
          <span>Saldo Pendiente:</span>
          <span className="font-mono font-bold text-base text-on-surface">
            ${remainingCalculated.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
