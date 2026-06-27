import { useState, useMemo } from 'react';
import type { RepairOrder } from '../../types';

const repairStatusLabels: Record<string, string> = {
  in_review: 'En Revisión',
  waiting_parts: 'Esperando Piezas',
  repaired: 'Reparado',
  delivered: 'Entregado',
};

interface SearchModalProps {
  open: boolean;
  repairs: RepairOrder[];
  onSelect: (id: string) => void;
  onClose: () => void;
}

export default function SearchModal({ open, repairs, onSelect, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query) return repairs;
    const q = query.toLowerCase();
    return repairs.filter(
      (r) =>
        r.id.includes(q) ||
        r.clientName.toLowerCase().includes(q) ||
        (r.deviceBrand + ' ' + r.deviceModel).toLowerCase().includes(q),
    );
  }, [repairs, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-outline-variant w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center select-none font-sans">
          <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">search</span>
            Búsqueda Rápida de Órdenes
          </h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-error transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 font-sans text-xs">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px]">search</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filtered.length > 0) {
                  onSelect(filtered[0].id);
                  setQuery('');
                }
              }}
              placeholder="Buscar por cliente, marca, modelo o folio..."
              className="w-full h-11 pl-10 pr-4 mt-1 border border-outline-variant rounded bg-[#ffffff] text-sm focus:border-tertiary outline-none"
            />
          </div>

          <div className="border border-outline-variant rounded-md overflow-hidden max-h-[250px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#ffffff] sticky top-0 border-b border-outline-variant/60 z-10 font-sans">
                <tr>
                  <th className="p-2.5 text-[11px] font-bold text-on-surface-variant uppercase bg-slate-50">Folio</th>
                  <th className="p-2.5 text-[11px] font-bold text-on-surface-variant uppercase bg-slate-50">Cliente</th>
                  <th className="p-2.5 text-[11px] font-bold text-on-surface-variant uppercase bg-slate-50">Dispositivo</th>
                  <th className="p-2.5 text-[11px] font-bold text-on-surface-variant uppercase bg-slate-50 text-right">Saldo Pend.</th>
                  <th className="p-2.5 text-[11px] font-bold text-on-surface-variant uppercase bg-slate-50 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="text-xs font-sans">
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => {
                      onSelect(r.id);
                      setQuery('');
                    }}
                    className="hover:bg-slate-100 cursor-pointer border-b border-slate-100 last:border-0 transition-all font-medium"
                  >
                    <td className="p-2.5 font-mono text-primary font-bold">#{r.id}</td>
                    <td className="p-2.5 font-semibold text-on-surface">{r.clientName || 'Sin nombre'}</td>
                    <td className="p-2.5">{r.deviceBrand} {r.deviceModel}</td>
                    <td className="p-2.5 text-right font-mono">${(r.totalCost - r.advancePaid).toFixed(2)}</td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          r.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'repaired'
                              ? 'bg-blue-100 text-blue-800'
                              : r.status === 'waiting_parts'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {repairStatusLabels[r.status] || r.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400 font-sans font-medium">
                      No se encontraron órdenes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
