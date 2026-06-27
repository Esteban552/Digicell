import React, { useState, useMemo } from 'react';
import type { CashRegistryMovement } from '../types';
import DenominationPad from './DenominationPad';
import { DENOMS, emptyCounts, calcTotal, type DenomCounts } from '../lib/denominations';

interface ArqueoCajaProps {
  movements: CashRegistryMovement[];
}

export default function ArqueoCaja({ movements }: ArqueoCajaProps) {
  const STARTING_FUND = 1000;
  const [physicalCounts, setPhysicalCounts] = useState<DenomCounts>(emptyCounts);

  const totals = useMemo(() => {
    let entries = 0;
    let exits = 0;
    const entryCounts = emptyCounts();
    const exitCounts = emptyCounts();

    for (const m of movements) {
      const amt = m.amount;
      if (m.type === 'in') {
        entries += amt;
        // Try to parse denominations from note: "motivo | 2× $500, 1× $100"
        const parts = m.note.split(' | ');
        if (parts.length > 1) {
          parts[1].split(', ').forEach(p => {
            const match = p.match(/(\d+)×\s*\$?([\d,]+)/);
            if (match) {
              const qty = parseInt(match[1], 10);
              const val = parseInt(match[2].replace(/,/g, ''), 10);
              if (!isNaN(qty) && !isNaN(val)) {
                const d = DENOMS.find(dd => dd.value === val);
                if (d) entryCounts[d.value] = (entryCounts[d.value] || 0) + qty;
              }
            }
          });
        }
      } else {
        exits += amt;
        const parts = m.note.split(' | ');
        if (parts.length > 1) {
          parts[1].split(', ').forEach(p => {
            const match = p.match(/(\d+)×\s*\$?([\d,]+)/);
            if (match) {
              const qty = parseInt(match[1], 10);
              const val = parseInt(match[2].replace(/,/g, ''), 10);
              if (!isNaN(qty) && !isNaN(val)) {
                const d = DENOMS.find(dd => dd.value === val);
                if (d) exitCounts[d.value] = (exitCounts[d.value] || 0) + qty;
              }
            }
          });
        }
      }
    }

    return { entries, exits, entryCounts, exitCounts };
  }, [movements]);

  const expectedTotal = STARTING_FUND + totals.entries - totals.exits;
  const physicalTotal = calcTotal(physicalCounts);
  const difference = physicalTotal - expectedTotal;
  const isBalanced = difference === 0;

  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <h2 className="text-2xl font-bold text-on-surface tracking-tight font-sans">Arqueo de Caja</h2>
        <p className="text-xs font-sans text-on-surface-variant font-medium mt-1">Cierre de turno — conteo físico de efectivo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* LEFT: Expected */}
        <div className="bg-white border border-outline-variant rounded-md p-4 shadow-sm overflow-y-auto">
          <h3 className="text-sm font-bold font-sans text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">account_balance</span>
            Saldo esperado
          </h3>

          <div className="space-y-2 text-xs font-sans">
            <div className="flex justify-between py-1.5 border-b border-outline-variant/50">
              <span className="text-on-surface-variant font-semibold">Fondo inicial</span>
              <span className="font-bold">${STARTING_FUND.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-outline-variant/50">
              <span className="text-success font-semibold">+ Entradas del día</span>
              <span className="font-bold text-success">${totals.entries.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-outline-variant/50">
              <span className="text-error font-semibold">- Salidas del día</span>
              <span className="font-bold text-error">${totals.exits.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-on-surface font-bold">Total esperado</span>
              <span className="text-lg font-bold text-primary">${expectedTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Expected breakdown */}
          <div className="mt-4 pt-3 border-t border-outline-variant">
            <p className="text-[10px] font-bold font-sans text-on-surface-variant uppercase tracking-wider mb-2">
              Desglose esperado (aproximado de movimientos con denominaciones)
            </p>
            {DENOMS.filter(d => (totals.entryCounts[d.value] || 0) > 0 || (totals.exitCounts[d.value] || 0) > 0).length === 0 ? (
              <p className="text-[11px] font-sans text-on-surface-variant italic">
                No hay movimientos con desglose por denominación registrados hoy.
              </p>
            ) : (
              <div className="space-y-1">
                {DENOMS.map(d => {
                  const net = (totals.entryCounts[d.value] || 0) - (totals.exitCounts[d.value] || 0);
                  if (net === 0) return null;
                  return (
                    <div key={d.value} className="flex justify-between text-xs font-sans">
                      <span className="text-on-surface-variant">{d.label}</span>
                      <span className={`font-semibold ${net > 0 ? 'text-success' : 'text-error'}`}>
                        {net > 0 ? '+' : ''}{net} {net > 0 ? 'en entradas' : 'en salidas'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent movements */}
          <div className="mt-4 pt-3 border-t border-outline-variant">
            <p className="text-[10px] font-bold font-sans text-on-surface-variant uppercase tracking-wider mb-2">
              Movimientos del día
            </p>
            {movements.length === 0 ? (
              <p className="text-[11px] font-sans text-on-surface-variant italic">Sin movimientos registrados.</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {movements.map(m => (
                  <div key={m.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-surface-container-low">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`material-symbols-outlined text-[14px] shrink-0 ${m.type === 'in' ? 'text-success' : 'text-error'}`}>
                        {m.type === 'in' ? 'arrow_downward' : 'arrow_upward'}
                      </span>
                      <span className="text-[11px] font-sans text-on-surface-variant truncate">{m.note.split(' | ')[0]}</span>
                    </div>
                    <span className={`text-[11px] font-bold font-sans shrink-0 ${m.type === 'in' ? 'text-success' : 'text-error'}`}>
                      {m.type === 'in' ? '+' : '-'}${m.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Physical count */}
        <div className="bg-white border border-outline-variant rounded-md p-4 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold font-sans text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">hand_coins</span>
            Conteo físico
          </h3>

          <p className="text-[11px] font-sans text-on-surface-variant mb-3">
            Ingresá la cantidad de billetes y monedas que hay físicamente en el cajón.
          </p>

          <DenominationPad counts={physicalCounts} onChange={setPhysicalCounts} />

          <div className="mt-auto pt-4 border-t border-outline-variant space-y-2">
            <div className="flex justify-between text-sm font-sans">
              <span className="font-semibold text-on-surface-variant">Total en cajón</span>
              <span className="font-bold text-on-surface">${physicalTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-sans">
              <span className="font-semibold text-on-surface-variant">Total esperado</span>
              <span className="font-bold">${expectedTotal.toFixed(2)}</span>
            </div>
            <div className={`flex justify-between text-sm font-sans pt-1 border-t ${isBalanced ? 'border-success' : 'border-error'}`}>
              <span className="font-bold">Diferencia</span>
              <span className={`font-bold ${isBalanced ? 'text-success' : Math.abs(difference) > 10 ? 'text-error' : 'text-orange-500'}`}>
                {difference === 0 ? '✓ CUADRADO' : `${difference > 0 ? '+' : ''} $${difference.toFixed(2)}`}
              </span>
            </div>
            {difference !== 0 && (
              <p className="text-[10px] font-sans text-on-surface-variant italic">
                {difference > 0
                  ? `Sobran $${difference.toFixed(2)} en el cajón.`
                  : `Faltan $${Math.abs(difference).toFixed(2)} en el cajón.`}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
