import React from 'react';
import { DENOMS, type DenomCounts, calcTotal } from '../lib/denominations';

interface DenominationPadProps {
  counts: DenomCounts;
  onChange: (counts: DenomCounts) => void;
  readOnly?: boolean;
}

export default function DenominationPad({ counts, onChange, readOnly }: DenominationPadProps) {
  const total = calcTotal(counts);

  const inc = (value: number) => {
    if (readOnly) return;
    onChange({ ...counts, [value]: (counts[value] || 0) + 1 });
  };

  const dec = (value: number) => {
    if (readOnly) return;
    const curr = counts[value] || 0;
    if (curr <= 0) return;
    onChange({ ...counts, [value]: curr - 1 });
  };

  const bills = DENOMS.filter(d => d.type === 'bill');
  const coins = DENOMS.filter(d => d.type === 'coin');

  return (
    <div className="space-y-3">
      {/* Bills */}
      <div>
        <p className="text-[10px] font-bold font-sans text-on-surface-variant uppercase tracking-wider mb-1.5">Billetes</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {bills.map(d => {
            const qty = counts[d.value] || 0;
            return (
              <div key={d.value} className="flex flex-col items-stretch">
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => inc(d.value)}
                  className={`h-14 rounded-md border-2 font-sans font-bold text-sm transition-all outline-none cursor-pointer select-none
                    ${readOnly ? 'bg-surface-container-low text-on-surface-variant border-outline cursor-default' :
                      qty > 0 ? 'bg-primary/10 text-primary border-primary shadow-sm' : 'bg-white text-on-surface border-outline-variant hover:border-primary hover:bg-primary/5 active:scale-95'}`}
                >
                  {d.label}
                </button>
                <div className="flex items-center justify-center gap-0.5 mt-0.5">
                  <button
                    type="button"
                    disabled={readOnly || qty <= 0}
                    onClick={() => dec(d.value)}
                    className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold transition-all outline-none cursor-pointer select-none
                      ${readOnly || qty <= 0 ? 'text-outline-variant' : 'text-on-surface-variant hover:bg-surface-container-high active:scale-90'}`}
                  >
                    −
                  </button>
                  <span className={`w-6 text-center text-xs font-bold font-sans ${qty > 0 ? 'text-primary' : 'text-on-surface-variant'}`}>
                    {qty}
                  </span>
                  <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => inc(d.value)}
                    className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold transition-all outline-none cursor-pointer select-none
                      ${readOnly ? 'text-outline-variant' : 'text-on-surface-variant hover:bg-surface-container-high active:scale-90'}`}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coins */}
      <div>
        <p className="text-[10px] font-bold font-sans text-on-surface-variant uppercase tracking-wider mb-1.5">Monedas</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {coins.map(d => {
            const qty = counts[d.value] || 0;
            return (
              <div key={d.value} className="flex flex-col items-stretch">
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => inc(d.value)}
                  className={`h-14 rounded-md border-2 font-sans font-bold text-sm transition-all outline-none cursor-pointer select-none
                    ${readOnly ? 'bg-surface-container-low text-on-surface-variant border-outline cursor-default' :
                      qty > 0 ? 'bg-tertiary/10 text-tertiary border-tertiary shadow-sm' : 'bg-white text-on-surface border-outline-variant hover:border-tertiary hover:bg-tertiary/5 active:scale-95'}`}
                >
                  {d.label}
                </button>
                <div className="flex items-center justify-center gap-0.5 mt-0.5">
                  <button
                    type="button"
                    disabled={readOnly || qty <= 0}
                    onClick={() => dec(d.value)}
                    className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold transition-all outline-none cursor-pointer select-none
                      ${readOnly || qty <= 0 ? 'text-outline-variant' : 'text-on-surface-variant hover:bg-surface-container-high active:scale-90'}`}
                  >
                    −
                  </button>
                  <span className={`w-6 text-center text-xs font-bold font-sans ${qty > 0 ? 'text-tertiary' : 'text-on-surface-variant'}`}>
                    {qty}
                  </span>
                  <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => inc(d.value)}
                    className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold transition-all outline-none cursor-pointer select-none
                      ${readOnly ? 'text-outline-variant' : 'text-on-surface-variant hover:bg-surface-container-high active:scale-90'}`}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-end items-center gap-2 pt-1.5 border-t border-outline-variant">
        <span className="text-xs font-sans text-on-surface-variant font-semibold">Total recibido:</span>
        <span className="text-lg font-bold font-sans text-primary">${total.toFixed(2)}</span>
      </div>
    </div>
  );
}
