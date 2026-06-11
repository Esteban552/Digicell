import React, { useState, useMemo } from 'react';
import type { RepairOrder } from '../types';

const repairStatusLabels: Record<string, string> = {
  'in_review': 'En Revisión',
  'waiting_parts': 'Esperando Piezas',
  'repaired': 'Reparado',
  'delivered': 'Entregado'
};

interface ServiciosModalProps {
  open: boolean;
  onClose: () => void;
  repairs: RepairOrder[];
  onDeleteCompletedRepairs: (count: number) => Promise<void>;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

export default function ServiciosModal({ open, onClose, repairs, onDeleteCompletedRepairs }: ServiciosModalProps) {
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState(todayStr());

  const filtered = useMemo(() => {
    let list = repairs;

    // Filter by selected date
    if (filterDate) {
      list = list.filter(r => {
        const repDate = r.createdAt ? r.createdAt.slice(0, 10) : '';
        return repDate === filterDate;
      });
    }

    // Filter by search text
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.clientName.toLowerCase().includes(q) ||
        r.clientPhone.toLowerCase().includes(q) ||
        r.deviceModel.toLowerCase().includes(q)
      );
    }

    // Sort by newest first
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [repairs, search, filterDate]);

  const deliveredCount = useMemo(() => repairs.filter(r => r.status === 'delivered').length, [repairs]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-xl border border-outline-variant shadow-xl w-[700px] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-sans text-on-surface">Servicios Realizados</h3>
            <p className="text-xs font-sans text-on-surface-variant font-medium mt-0.5">
              Consultá todas las reparaciones registradas por fecha.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-surface-container-low outline-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-outline-variant flex gap-3">
          {/* Date filter */}
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">calendar_today</span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="h-9 border border-outline rounded px-3 focus:border-tertiary outline-none text-xs font-sans"
            />
          </div>
          {/* Search filter */}
          <div className="flex-1 relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-on-surface-variant pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, modelo o teléfono..."
              className="h-9 w-full pl-8 pr-3 border border-outline rounded focus:border-tertiary outline-none text-xs font-sans"
            />
          </div>
          <div className="text-xs font-sans text-on-surface-variant font-semibold flex items-center whitespace-nowrap">
            {filtered.length} servicio(s)
          </div>
        </div>

        {/* Results list */}
        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
              <span className="material-symbols-outlined text-4xl text-outline-variant">search_off</span>
              <p className="text-xs font-sans text-on-surface-variant font-medium">
                No se encontraron servicios para esta fecha.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(r => (
                <div
                  key={r.id}
                  className="border border-outline-variant rounded-lg p-4 hover:bg-surface-container-low transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold font-sans text-on-surface truncate">
                        {r.clientName}
                      </h4>
                      <p className="text-xs font-sans text-on-surface-variant font-medium mt-0.5">
                        {r.clientPhone && (
                          <span className="inline-flex items-center gap-1 mr-3">
                            <span className="material-symbols-outlined text-[12px]">call</span>
                            {r.clientPhone}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">smartphone</span>
                          {r.deviceBrand} {r.deviceModel}
                        </span>
                      </p>
                      <p className="text-[11px] font-sans text-on-surface-variant mt-1.5 leading-relaxed line-clamp-2">
                        {r.problemReported || 'Sin detalle'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-sans ${
                        r.status === 'delivered' ? 'bg-success-container text-success' :
                        r.status === 'repaired' ? 'bg-blue-100 text-blue-800' :
                        r.status === 'waiting_parts' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {repairStatusLabels[r.status] || r.status}
                      </span>
                      <p className="text-[10px] font-sans text-on-surface-variant mt-1.5">
                        ${r.totalCost.toFixed(2)}
                      </p>
                      <p className="text-[10px] font-sans text-on-surface-variant">
                        Folio #{r.id}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[10px] font-sans text-on-surface-variant">
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                      {formatDateTime(r.createdAt)}
                    </span>
                    {r.technician && (
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">person</span>
                        {r.technician}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-outline-variant flex items-center justify-between gap-4">
          <div className="text-[10px] font-sans text-on-surface-variant">
            {deliveredCount} entregada(s) — {repairs.length} total
          </div>
          {deliveredCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-sans font-semibold text-on-surface-variant">Eliminar entregadas:</span>
              <div className="flex gap-1">
                {[10, 100, 500].map(n => {
                  const actual = Math.min(n, deliveredCount);
                  return (
                    <button
                      key={n}
                      onClick={async () => {
                        if (confirm(`¿Eliminar las ${actual} órdenes entregadas más recientes? Esta acción no se puede deshacer.`)) {
                          await onDeleteCompletedRepairs(actual);
                        }
                      }}
                      className="px-2.5 py-1 text-[10px] font-bold font-sans bg-error/10 text-error rounded hover:bg-error hover:text-white transition-all outline-none cursor-pointer"
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
