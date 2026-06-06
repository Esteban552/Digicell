/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { LogEntry } from '../types';

interface ReportsViewProps {
  logs: LogEntry[];
  totalSalesSum: number;
  totalAdvancesSum: number;
  totalCashSum: number;
  showToast: (title: string, desc: string, type: 'success' | 'info' | 'error') => void;
}

export default function ReportsView({
  logs,
  totalSalesSum,
  totalAdvancesSum,
  totalCashSum,
  showToast
}: ReportsViewProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('2023-10-27');

  // Filter logs based on search inputs
  const filteredLogs = useMemo(() => {
    if (!filterQuery) return logs;
    const q = filterQuery.toLowerCase();
    return logs.filter(log => 
      log.description.toLowerCase().includes(q) || 
      log.type.toLowerCase().includes(q) ||
      log.status.toLowerCase().includes(q)
    );
  }, [logs, filterQuery]);

  const handlePrintCorte = () => {
    showToast(
      'Imprimiendo Corte', 
      `Se ha enviado a imprimir el informe de corte de caja para el día ${selectedDate}.`, 
      'success'
    );
  };

  return (
    <div className="flex-1 flex flex-col gap-6 font-sans select-none">
      
      {/* Upper header action row */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 w-full">
        <div>
          <h2 className="text-2xl font-bold text-on-surface tracking-tight font-sans">
            Reports Activity
          </h2>
          <p className="text-xs font-sans text-on-surface-variant font-medium mt-1">
            Overview of daily POS transactions, repair entries, and cash register updates.
          </p>
        </div>

        <div className="flex flex-col gap-1 w-44">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide">Select Date</label>
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
            onClick={() => showToast('Filtrando Ingresos', 'Mostrando únicamente cobros por concepto de ventas directas.', 'info')}
            className="h-10 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-on-surface text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer outline-none transition-colors border-dashed"
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            Ver ingresos
          </button>
          
          <button 
            type="button"
            onClick={() => showToast('Moviendo Flujo', 'Filtrando movimientos manuales de caja chica (In/Out).', 'info')}
            className="h-10 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-on-surface text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer outline-none transition-colors border-dashed"
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
          onClick={handlePrintCorte}
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
          <h3 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Total POS Sales</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-sans text-on-surface">
              ${totalSalesSum.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center font-sans">
              <span className="material-symbols-outlined text-[12px] mr-0.5">arrow_upward</span> 
              12%
            </span>
          </div>
          <p className="text-xs font-sans text-slate-400 mt-1 font-semibold">
            {logs.filter(l => l.type === 'POS Sale').length} Transactions today
          </p>
        </div>

        {/* Advances Stats Box */}
        <div className="bg-white border border-slate-300 rounded-lg p-6 relative overflow-hidden group border-blue-200 hover:shadow-sm transition-all shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-blue-600">
            <span className="material-symbols-outlined text-[68px]">build</span>
          </div>
          <h3 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Repair Advances</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-sans text-on-surface">
              ${totalAdvancesSum.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-xs font-sans text-slate-400 mt-1 font-semibold">
            From {logs.filter(l => l.type === 'Repair Advance').length} active repair tickets
          </p>
        </div>

        {/* Register Balance Box */}
        <div className="bg-red-950 text-white border border-transparent rounded-lg p-6 relative overflow-hidden group hover:shadow-md transition-all shadow-md">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-white">
            <span className="material-symbols-outlined text-[68px] icon-fill">account_balance_wallet</span>
          </div>
          <h3 className="text-[11px] font-bold text-red-200 uppercase tracking-wider mb-2">Total Cash in Register</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-sans text-[#ffffff]">
              ${totalCashSum.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-xs font-sans text-red-300 mt-1 font-semibold">
            Ready for End of Day
          </p>
        </div>

      </section>

      {/* Detailed table Activity logs list layout card */}
      <section className="bg-white border border-outline-variant rounded-lg flex-1 flex flex-col overflow-hidden mb-6 shadow-sm min-h-[300px]">
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-[#ffffff]">
          <h3 className="text-sm font-bold text-on-surface font-sans">Daily Activity Log</h3>
          
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[14px]">
              filter_alt
            </span>
            <input 
              type="text" 
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter list..."
              className="h-8 pl-6 pr-2 rounded border border-outline text-[11px] font-sans focus:border-tertiary outline-none w-36"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 h-[250px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#ffffff] border-b border-outline-variant/60 z-10 font-sans shadow-sm">
              <tr>
                <th className="p-3 text-[10px] font-bold text-on-surface-variant uppercase bg-slate-50">Time</th>
                <th className="p-3 text-[10px] font-bold text-on-surface-variant uppercase bg-slate-50">Type</th>
                <th className="p-3 text-[10px] font-bold text-on-surface-variant uppercase bg-slate-50 w-2/5">Description</th>
                <th className="p-3 text-[10px] font-bold text-on-surface-variant uppercase bg-slate-50 text-right">Amount</th>
                <th className="p-3 text-[10px] font-bold text-on-surface-variant uppercase bg-slate-50 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="text-xs select-text font-sans">
              {filteredLogs.map((log) => (
                <tr 
                  key={log.id} 
                  className="even:bg-slate-50/40 hover:bg-slate-100/30 transition-colors border-b border-slate-100 last:border-0"
                >
                  <td className="p-3 font-mono font-medium text-on-surface-variant">{log.time}</td>
                  <td className="p-3">
                    <span className="flex items-center gap-1.5 text-on-surface font-semibold text-[11px]">
                      <span className={`material-symbols-outlined text-[16px] ${
                        log.type === 'POS Sale' ? 'text-emerald-500' :
                        log.type === 'Repair Advance' ? 'text-blue-500' :
                        log.type === 'Cash Movement' ? 'text-rose-500' :
                        'text-indigo-500'
                      }`}>
                        {
                          log.type === 'POS Sale' ? 'point_of_sale' :
                          log.type === 'Repair Advance' ? 'build' :
                          log.type === 'Cash Movement' ? 'swap_horiz' :
                          'payments'
                        }
                      </span>
                      {log.type}
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
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-sans font-semibold">
                    No matching activity logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center select-none font-sans text-[11px] leading-normal">
          <span className="text-slate-500 font-medium">Showing {filteredLogs.length} of {logs.length} entries</span>
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
