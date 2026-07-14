import React, { useState, useMemo } from 'react';
import type { CashRegistryMovement } from '../types';
import type { ArqueoSummary } from '../hooks/useArqueos';
import DenominationPad from './DenominationPad';
import { DENOMS, emptyCounts, calcTotal, type DenomCounts } from '../lib/denominations';

interface ArqueoCajaProps {
  movements: CashRegistryMovement[];
  startingFund?: number;
  historial: ArqueoSummary[];
  onSave: (data: {
    fondoInicial: number;
    totalEntradas: number;
    totalSalidas: number;
    totalEsperado: number;
    totalFisico: number;
    diferencia: number;
    denominaciones: Record<string, number>;
    desglose: Record<string, number>;
    notas?: string;
  }) => Promise<boolean>;
  onRefetchArqueos: () => Promise<void>;
}

function todayStr() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Tijuana' });
}

function toTijuanaDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('en-CA', { timeZone: 'America/Tijuana' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Tijuana' });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Tijuana' });
}

function categorizeNote(note: string): 'pos' | 'repair' | 'cash' {
  if (note.includes('Anticipo') || note.includes('Abono')) return 'repair';
  if (note.includes('item') || note.includes('Neto efectivo')) return 'pos';
  return 'cash';
}

const categoryMeta: Record<string, { label: string; icon: string; color: string }> = {
  pos:    { label: 'Ventas POS',     icon: 'point_of_sale',      color: 'text-emerald-600' },
  repair: { label: 'Reparaciones',   icon: 'build',              color: 'text-blue-600' },
  cash:   { label: 'Otros ingresos', icon: 'account_balance',    color: 'text-amber-600' },
};

export default function ArqueoCaja({ movements, startingFund = 1000, historial, onSave, onRefetchArqueos }: ArqueoCajaProps) {
  const [filterDate, setFilterDate] = useState(todayStr());
  const [physicalCounts, setPhysicalCounts] = useState<DenomCounts>(emptyCounts);
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const filteredMovements = useMemo(() => {
    if (!filterDate) return movements;
    return movements.filter(m => m.createdAt ? toTijuanaDate(m.createdAt) === filterDate : false);
  }, [movements, filterDate]);

  const breakdown = useMemo(() => {
    let pos = 0, repair = 0, otherIn = 0, exits = 0;
    for (const m of filteredMovements) {
      if (m.type === 'out') { exits += m.amount; continue; }
      const cat = categorizeNote(m.note);
      if (cat === 'pos')    pos += m.amount;
      else if (cat === 'repair') repair += m.amount;
      else otherIn += m.amount;
    }
    return { pos, repair, otherIn, exits };
  }, [filteredMovements]);

  const totals = useMemo(() => {
    let entries = 0;
    let exits = 0;
    const entryCounts = emptyCounts();
    const exitCounts = emptyCounts();

    for (const m of filteredMovements) {
      const amt = m.amount;
      if (m.type === 'in') {
        entries += amt;
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
        // Same parsing for exits
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
  }, [filteredMovements]);

  const expectedTotal = startingFund + totals.entries - totals.exits;
  const physicalTotal = calcTotal(physicalCounts);
  const difference = physicalTotal - expectedTotal;
  const isBalanced = difference === 0;
  const hasPhysicalCount = Object.values(physicalCounts).some(c => c > 0);

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSave({
      fondoInicial: startingFund,
      totalEntradas: totals.entries,
      totalSalidas: totals.exits,
      totalEsperado: expectedTotal,
      totalFisico: physicalTotal,
      diferencia: difference,
      denominaciones: physicalCounts,
      desglose: { pos: breakdown.pos, repair: breakdown.repair, otherIn: breakdown.otherIn, exits: breakdown.exits },
      notas,
    });
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const lastArqueo = historial.length > 0 ? historial[0] : null;

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-on-surface tracking-tight font-sans">Arqueo de Caja</h2>
          <p className="text-xs font-sans text-on-surface-variant font-medium mt-1">Cierre de turno — conteo físico de efectivo.</p>
        </div>
        <div className="flex items-center gap-2">
          {lastArqueo && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="h-9 px-3 text-xs font-bold font-sans bg-surface-container-low text-on-surface-variant rounded hover:bg-outline-variant transition-all outline-none cursor-pointer"
            >
              {showHistory ? 'Ocultar historial' : `Último corte: ${formatDate(lastArqueo.createdAt)}`}
            </button>
          )}
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="h-9 border border-outline rounded px-3 focus:border-tertiary outline-none text-xs font-sans"
          />
          <button
            onClick={() => setFilterDate('')}
            className="h-9 px-3 text-xs font-bold font-sans bg-tertiary/10 text-tertiary rounded hover:bg-tertiary hover:text-white transition-all outline-none cursor-pointer whitespace-nowrap"
          >
            Mostrar Todas
          </button>
        </div>
      </div>

      {/* ── Income breakdown cards ─────────────────────────── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-3">
          <span className="material-symbols-outlined text-emerald-600 text-[28px]">point_of_sale</span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider font-sans">Ventas POS</p>
            <p className="text-lg font-bold text-emerald-900 font-sans">${breakdown.pos.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
          <span className="material-symbols-outlined text-blue-600 text-[28px]">build</span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider font-sans">Reparaciones</p>
            <p className="text-lg font-bold text-blue-900 font-sans">${breakdown.repair.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
          <span className="material-symbols-outlined text-amber-600 text-[28px]">account_balance</span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider font-sans">Otros ingresos</p>
            <p className="text-lg font-bold text-amber-900 font-sans">${breakdown.otherIn.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-center gap-3">
          <span className="material-symbols-outlined text-rose-600 text-[28px]">arrow_upward</span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider font-sans">Salidas</p>
            <p className="text-lg font-bold text-rose-900 font-sans">${breakdown.exits.toFixed(2)}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* LEFT: Expected + Movements */}
        <div className="bg-white border border-outline-variant rounded-md p-4 shadow-sm overflow-y-auto">
          <h3 className="text-sm font-bold font-sans text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">account_balance</span>
            Saldo esperado
          </h3>

          <div className="space-y-2 text-xs font-sans">
            <div className="flex justify-between py-1.5 border-b border-outline-variant/50">
              <span className="text-on-surface-variant font-semibold">Fondo inicial</span>
              <span className="font-bold">${startingFund.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-outline-variant/50">
              <span className="text-success font-semibold">+ Entradas{filterDate ? ' del día' : ''}</span>
              <span className="font-bold text-success">${totals.entries.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-outline-variant/50">
              <span className="text-error font-semibold">- Salidas{filterDate ? ' del día' : ''}</span>
              <span className="font-bold text-error">${totals.exits.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-on-surface font-bold">Total esperado</span>
              <span className="text-lg font-bold text-primary">${expectedTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Recent movements */}
          <div className="mt-4 pt-3 border-t border-outline-variant">
            <p className="text-[10px] font-bold font-sans text-on-surface-variant uppercase tracking-wider mb-2">
              Movimientos{filterDate ? ' del día' : ''} ({filteredMovements.length})
            </p>
            {filteredMovements.length === 0 ? (
              <p className="text-[11px] font-sans text-on-surface-variant italic">Sin movimientos registrados{filterDate ? ' para esta fecha' : ''}.</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {filteredMovements.map(m => {
                  const cat = m.type === 'in' ? categorizeNote(m.note) : null;
                  const meta = cat ? categoryMeta[cat] : null;
                  return (
                    <div key={m.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-surface-container-low">
                      <div className="flex items-center gap-2 min-w-0">
                        {meta ? (
                          <span className={`material-symbols-outlined text-[14px] shrink-0 ${meta.color}`}>{meta.icon}</span>
                        ) : (
                          <span className={`material-symbols-outlined text-[14px] shrink-0 ${m.type === 'in' ? 'text-success' : 'text-error'}`}>
                            {m.type === 'in' ? 'arrow_downward' : 'arrow_upward'}
                          </span>
                        )}
                        <span className="text-[11px] font-sans text-on-surface-variant truncate">{m.note.split(' | ')[0]}</span>
                      </div>
                      <span className={`text-[11px] font-bold font-sans shrink-0 ${m.type === 'in' ? 'text-success' : 'text-error'}`}>
                        {m.type === 'in' ? '+' : '-'}${m.amount.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Physical count + Save */}
        <div className="bg-white border border-outline-variant rounded-md p-4 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold font-sans text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">hand_coins</span>
            Conteo físico
          </h3>

          <p className="text-[11px] font-sans text-on-surface-variant mb-3">
            Ingresá la cantidad de billetes y monedas que hay físicamente en el cajón.
          </p>

          <DenominationPad counts={physicalCounts} onChange={setPhysicalCounts} />

          {/* Notes */}
          <div className="mt-3">
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas del corte (opcional)..."
              className="h-9 w-full border border-outline rounded px-3 text-xs font-sans outline-none focus:border-tertiary"
            />
          </div>

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

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving || !hasPhysicalCount}
              className="w-full h-11 mt-2 bg-primary hover:bg-primary-container disabled:opacity-40 text-white rounded-lg text-xs font-bold shadow-md shadow-primary/20 hover:shadow-lg transition-all outline-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <span className="animate-spin material-symbols-outlined text-[16px]">progress_activity</span>
              ) : saved ? (
                <>
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  ¡Corte guardado!
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  Guardar Corte
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── History section ─────────────────────────────── */}
      {showHistory && historial.length > 0 && (
        <section className="bg-white border border-outline-variant rounded-md p-4 shadow-sm">
          <h3 className="text-sm font-bold font-sans text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">history</span>
            Historial de Cortes
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="p-2 text-[10px] font-bold text-on-surface-variant uppercase">Fecha</th>
                  <th className="p-2 text-[10px] font-bold text-on-surface-variant uppercase">Esperado</th>
                  <th className="p-2 text-[10px] font-bold text-on-surface-variant uppercase">Físico</th>
                  <th className="p-2 text-[10px] font-bold text-on-surface-variant uppercase">Diferencia</th>
                  <th className="p-2 text-[10px] font-bold text-on-surface-variant uppercase">POS</th>
                  <th className="p-2 text-[10px] font-bold text-on-surface-variant uppercase">Reparac.</th>
                  <th className="p-2 text-[10px] font-bold text-on-surface-variant uppercase">Notas</th>
                </tr>
              </thead>
              <tbody>
                {historial.slice(0, 15).map(a => (
                  <tr key={a.id} className="border-b border-outline-variant/50 hover:bg-surface-container-low">
                    <td className="p-2 font-semibold">{formatDateTime(a.createdAt)}</td>
                    <td className="p-2">${a.totalEsperado.toFixed(2)}</td>
                    <td className="p-2">${a.totalFisico.toFixed(2)}</td>
                    <td className={`p-2 font-bold ${a.diferencia === 0 ? 'text-success' : Math.abs(a.diferencia) > 10 ? 'text-error' : 'text-orange-500'}`}>
                      {a.diferencia === 0 ? '✓' : `${a.diferencia > 0 ? '+' : ''}$${a.diferencia.toFixed(2)}`}
                    </td>
                    <td className="p-2">${(a.desglose?.pos ?? 0).toFixed(2)}</td>
                    <td className="p-2">${(a.desglose?.repair ?? 0).toFixed(2)}</td>
                    <td className="p-2 text-on-surface-variant max-w-[120px] truncate">{a.notas || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
