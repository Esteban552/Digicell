/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { LogEntry, RepairOrder } from '../types';

interface ReportsViewProps {
  logs: LogEntry[];
  repairs: RepairOrder[];
  totalSalesSum: number;
  totalAdvancesSum: number;
  showToast: (title: string, desc: string, type: 'success' | 'info' | 'error') => void;
}

const typeLabels: Record<string, string> = {
  'POS Sale': 'Venta POS',
  'Repair Advance': 'Anticipo de Reparación',
  'Cash Movement': 'Movimiento de Caja',
  'Repair Payment': 'Pago de Reparación'
};

const statusLabels: Record<string, string> = {
  'Paid': 'Pagado',
  'Advance': 'Anticipo',
  'Outflow': 'Salida'
};

type TypeFilter = 'all' | 'sales' | 'advances' | 'cash';

const repairStatusConfig = [
  { key: 'in_review' as const, label: 'En Revisión', icon: 'search', color: 'text-rose-600', bg: 'bg-rose-50' },
  { key: 'waiting_parts' as const, label: 'Esperando Piezas', icon: 'inventory_2', color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'repaired' as const, label: 'Reparado', icon: 'check_circle', color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'delivered' as const, label: 'Entregado', icon: 'assignment_turned_in', color: 'text-emerald-600', bg: 'bg-emerald-50' },
];

export default function ReportsView({
  logs,
  repairs,
  totalSalesSum,
  totalAdvancesSum,
  showToast
}: ReportsViewProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [activeFilter, setActiveFilter] = useState<TypeFilter>('all');

  const logIsOnDate = (log: LogEntry, date: string) =>
    (log.created_at && log.created_at.startsWith(date)) || (log.time && log.time.startsWith(date));

  const dateFilteredLogs = useMemo(() =>
    logs.filter(l => logIsOnDate(l, selectedDate)),
    [logs, selectedDate]
  );

  const filteredLogs = useMemo(() => {
    let result = dateFilteredLogs;
    if (activeFilter === 'sales') result = result.filter(l => l.type === 'POS Sale');
    if (activeFilter === 'advances') result = result.filter(l => l.type === 'Repair Advance' || l.type === 'Repair Payment');
    if (activeFilter === 'cash') result = result.filter(l => l.type === 'Cash Movement');
    if (filterQuery) {
      const q = filterQuery.toLowerCase();
      result = result.filter(log =>
        log.description.toLowerCase().includes(q) ||
        log.type.toLowerCase().includes(q) ||
        log.status.toLowerCase().includes(q)
      );
    }
    return result;
  }, [dateFilteredLogs, activeFilter, filterQuery]);

  const todayStats = useMemo(() => {
    const sales = dateFilteredLogs.filter(l => l.type === 'POS Sale').reduce((a, c) => a + c.amount, 0);
    const advances = dateFilteredLogs.filter(l => l.type === 'Repair Advance').reduce((a, c) => a + c.amount, 0);
    const payments = dateFilteredLogs.filter(l => l.type === 'Repair Payment').reduce((a, c) => a + c.amount, 0);
    const movements = dateFilteredLogs.filter(l => l.type === 'Cash Movement');
    const cashIn = movements.filter(l => l.amount > 0).reduce((a, c) => a + c.amount, 0);
    const cashOut = movements.filter(l => l.amount < 0).reduce((a, c) => a + Math.abs(c.amount), 0);
    return { sales, advances, payments, cashIn, cashOut };
  }, [dateFilteredLogs]);

  const repairCounts = useMemo(() => {
    const counts: Record<string, number> = { in_review: 0, waiting_parts: 0, repaired: 0, delivered: 0 };
    repairs.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
    return counts;
  }, [repairs]);

  return (
    <div className="flex-1 flex flex-col gap-6 font-sans select-none">

      {/* Upper header action row */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 w-full">
        <div>
          <h2 className="text-2xl font-bold text-on-surface tracking-tight font-sans">
            Actividad de Reportes
          </h2>
          <p className="text-xs font-sans text-on-surface-variant font-medium mt-1">
            Resumen de transacciones POS, órdenes de reparación y movimientos de caja.
          </p>
        </div>

        <div className="flex flex-col gap-1 w-44">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide">Seleccionar Fecha</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">
              calendar_today
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 w-full pl-8 pr-2 border border-outline rounded text-xs font-semibold focus:border-tertiary outline-none font-sans"
            />
          </div>
        </div>
      </section>

      {/* Primary Command Bar */}
      <section className="bg-white border border-outline-variant rounded-md p-4 flex flex-wrap gap-3 items-center justify-between shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter(activeFilter === 'sales' ? 'all' : 'sales')}
            className={`h-10 px-4 border text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer outline-none transition-colors ${activeFilter === 'sales' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-300 hover:bg-slate-50 text-on-surface border-dashed'}`}
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            Ver ingresos
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter(activeFilter === 'advances' ? 'all' : 'advances')}
            className={`h-10 px-4 border text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer outline-none transition-colors ${activeFilter === 'advances' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-300 hover:bg-slate-50 text-on-surface border-dashed'}`}
          >
            <span className="material-symbols-outlined text-[16px]">build</span>
            Ver anticipos
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter(activeFilter === 'cash' ? 'all' : 'cash')}
            className={`h-10 px-4 border text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer outline-none transition-colors ${activeFilter === 'cash' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-slate-300 hover:bg-slate-50 text-on-surface border-dashed'}`}
          >
            <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
            Ver movimientos de caja
          </button>

          <button
            type="button"
            onClick={() => showToast('Ticket Corte', 'Se ha preparado la plantilla de flujo de caja para impresión.', 'info')}
            className="h-10 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-on-surface text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer outline-none transition-colors border-dashed"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            Imprimir movimientos
          </button>
        </div>

        <button
          type="button"
          onClick={() => showToast('Imprimiendo Corte', `Se ha enviado a imprimir el informe de corte de caja para el día ${selectedDate}.`, 'success')}
          className="h-10 px-4 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded flex items-center gap-2 cursor-pointer shadow-md shadow-primary/20 hover:shadow-lg transition-all outline-none"
        >
          <span className="material-symbols-outlined text-[16px]">receipt_long</span>
          Imprimir Corte del Día
        </button>
      </section>

      {/* Bento Grid layout statistics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Sales Stats Box */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 relative overflow-hidden group hover:shadow-sm transition-all shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-on-surface">
            <span className="material-symbols-outlined text-[68px]">point_of_sale</span>
          </div>
          <h3 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Ventas POS {selectedDate}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-sans text-on-surface">
              ${todayStats.sales.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-xs font-sans text-slate-400 mt-1 font-semibold">
            {dateFilteredLogs.filter(l => l.type === 'POS Sale').length} transacciones · Total histórico: ${totalSalesSum.toFixed(2)}
          </p>
        </div>

        {/* Advances Stats Box */}
        <div className="bg-white border border-slate-300 rounded-lg p-6 relative overflow-hidden group border-blue-200 hover:shadow-sm transition-all shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-blue-600">
            <span className="material-symbols-outlined text-[68px]">build</span>
          </div>
          <h3 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Anticipos + Pagos {selectedDate}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-sans text-on-surface">
              ${(todayStats.advances + todayStats.payments).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-xs font-sans text-slate-400 mt-1 font-semibold">
            {repairCounts.in_review + repairCounts.waiting_parts + repairCounts.repaired} activas · Total histórico: ${totalAdvancesSum.toFixed(2)}
          </p>
        </div>

        {/* Register Balance Box */}
        <div className="bg-red-950 text-white border border-transparent rounded-lg p-6 relative overflow-hidden group hover:shadow-md transition-all shadow-md">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-white">
            <span className="material-symbols-outlined text-[68px] icon-fill">account_balance_wallet</span>
          </div>
          <h3 className="text-[11px] font-bold text-red-200 uppercase tracking-wider mb-2">Flujo del Día {selectedDate}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-sans text-[#ffffff]">
              ${(todayStats.sales + todayStats.advances + todayStats.payments + todayStats.cashIn - todayStats.cashOut).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-xs font-sans text-red-300 mt-1 font-semibold">
            +${todayStats.cashIn.toFixed(2)} entró · -${todayStats.cashOut.toFixed(2)} salió
          </p>
        </div>

      </section>

      {/* Repair status summary row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {repairStatusConfig.map(({ key, label, icon, color, bg }) => (
          <div key={key} className={`${bg} border border-outline-variant rounded-lg p-4 flex items-center gap-3 hover:shadow-sm transition-all`}>
            <span className={`material-symbols-outlined ${color} text-[28px]`}>{icon}</span>
            <div>
              <p className="text-xs font-sans text-on-surface-variant font-semibold">{label}</p>
              <p className={`text-xl font-bold font-sans ${color}`}>{repairCounts[key]}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Detailed table Activity logs list layout card */}
      <section className="bg-white border border-outline-variant rounded-lg flex-1 flex flex-col overflow-hidden mb-6 shadow-sm min-h-[300px]">
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-[#ffffff]">
          <h3 className="text-sm font-bold text-on-surface font-sans">
            {activeFilter === 'all' ? 'Registro de Actividad Diaria' :
             activeFilter === 'sales' ? 'Ingresos por Ventas' :
             activeFilter === 'advances' ? 'Anticipos y Pagos' : 'Movimientos de Caja'}
          </h3>

          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[14px]">
              filter_alt
            </span>
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filtrar lista..."
              className="h-8 pl-6 pr-2 rounded border border-outline text-[11px] font-sans focus:border-tertiary outline-none w-36"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 h-[250px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#ffffff] border-b border-outline-variant/60 z-10 font-sans shadow-sm">
              <tr>
                <th className="p-3 text-[10px] font-bold text-on-surface-variant uppercase bg-slate-50">Hora</th>
                <th className="p-3 text-[10px] font-bold text-on-surface-variant uppercase bg-slate-50">Tipo</th>
                <th className="p-3 text-[10px] font-bold text-on-surface-variant uppercase bg-slate-50 w-2/5">Descripción</th>
                <th className="p-3 text-[10px] font-bold text-on-surface-variant uppercase bg-slate-50 text-right">Monto</th>
                <th className="p-3 text-[10px] font-bold text-on-surface-variant uppercase bg-slate-50 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="text-xs select-text font-sans">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="even:bg-slate-50/40 hover:bg-slate-100/30 transition-colors border-b border-slate-100 last:border-0"
                >
                  <td className="p-3 font-mono font-medium text-on-surface-variant">
                    {log.time && log.time.includes('T') ? log.time.split('T')[1].split('.')[0].slice(0, 5) : log.time}
                  </td>
                  <td className="p-3">
                    <span className="flex items-center gap-1.5 text-on-surface font-semibold text-[11px]">
                      <span className={`material-symbols-outlined text-[16px] ${
                        log.type === 'POS Sale' ? 'text-emerald-500' :
                        log.type === 'Repair Advance' || log.type === 'Repair Payment' ? 'text-blue-500' :
                        log.type === 'Cash Movement' ? 'text-rose-500' :
                        'text-indigo-500'
                      }`}>
                        {
                          log.type === 'POS Sale' ? 'point_of_sale' :
                          log.type === 'Repair Advance' ? 'build' :
                          log.type === 'Repair Payment' ? 'payments' :
                          log.type === 'Cash Movement' ? 'swap_horiz' :
                          'receipt'
                        }
                      </span>
                      {typeLabels[log.type] || log.type}
                    </span>
                  </td>
                  <td className="p-3 text-on-surface leading-snug font-medium font-sans">
                    {log.description}
                  </td>
                  <td className={`p-3 text-right font-mono font-bold font-sans ${log.amount < 0 ? 'text-error' : 'text-on-surface'}`}>
                    {log.amount < 0 ? '' : '+'}${log.amount.toFixed(2)}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      log.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                      log.status === 'Advance' ? 'bg-blue-100 text-blue-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {statusLabels[log.status] || log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-sans font-semibold">
                    No se encontraron registros para el {selectedDate}. {activeFilter !== 'all' && 'Cambiá el filtro o la fecha.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center select-none font-sans text-[11px] leading-normal">
          <span className="text-slate-500 font-medium">Mostrando {filteredLogs.length} de {dateFilteredLogs.length} registros del {selectedDate}</span>
          <div className="flex gap-1">
            <button className="w-8 h-8 rounded border border-slate-300 flex items-center justify-center text-slate-400 hover:bg-white disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <button className="w-8 h-8 rounded border border-slate-300 flex items-center justify-center text-slate-700 bg-white font-bold">1</button>
            <button className="w-8 h-8 rounded border border-transparent flex items-center justify-center text-slate-500 hover:bg-slate-200" disabled>2</button>
            <button className="w-8 h-8 rounded border border-slate-300 flex items-center justify-center text-slate-400 hover:bg-white" disabled>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
