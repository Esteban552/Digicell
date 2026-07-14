import { useCallback } from 'react';
import type { RepairOrder } from '../../types';
import { getBusinessInfo } from '../../lib/businessInfo';
import { printHTML, repairReceiptHTML } from '../../lib/printIframe';

const BIZ = getBusinessInfo();

interface PrintModalProps {
  open: boolean;
  repair: RepairOrder;
  remainingCalculated: number;
  onClose: () => void;
}

const statusLabels: Record<string, string> = {
  in_review: 'En Revisión',
  waiting_parts: 'Esperando Repuestos',
  repaired: 'Reparado',
  delivered: 'Entregado',
};

export default function PrintModal({ open, repair, remainingCalculated, onClose }: PrintModalProps) {
  const handlePrint = useCallback(() => {
    const html = repairReceiptHTML(repair, remainingCalculated, BIZ);
    printHTML(html, { onClose });
  }, [repair, remainingCalculated, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-outline-variant w-full max-w-sm shadow-2xl flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center select-none">
          <h3 className="text-sm font-bold text-on-surface font-sans">Vista Previa de Impresión</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-error transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 bg-slate-100 flex justify-center items-center h-[350px] overflow-y-auto">
          <div
            id="receipt-thermal"
            className="bg-white text-black w-[240px] p-4 font-mono text-[11px] leading-tight shadow-md border border-slate-300 select-none"
          >
            <div className="text-center font-bold text-sm tracking-wide mb-1">{BIZ.name}</div>
            <div className="text-center text-[10px] mb-3 border-b border-dashed border-slate-400 pb-2">
              {BIZ.address}<br />Tel: {BIZ.phone}
            </div>

            <div className="mb-2.5">
              <strong>Folio:</strong> #{repair.id}<br />
              <strong>Ingreso:</strong> {new Date(repair.createdAt || Date.now()).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Tijuana' })}<br />
              <strong>Estado:</strong> {statusLabels[repair.status] || repair.status}<br />
              <strong>Técnico:</strong> {repair.technician || '—'}
            </div>

            <div className="border-t border-b border-dashed border-slate-400 py-2 mb-2.5 space-y-1">
              <strong>Cliente:</strong> {repair.clientName || 'N/A'}<br />
              <strong>Tel.:</strong> {repair.clientPhone || 'N/A'}<br />
              {repair.clientEmail && <><strong>Email:</strong> {repair.clientEmail}<br /></>}
              <strong>Equipo:</strong> {repair.deviceBrand} {repair.deviceModel}<br />
              <strong>Color:</strong> {repair.deviceColor || '—'}<br />
              <strong>IMEI/SN:</strong> {repair.deviceSerial || '—'}<br />
              <strong>PIN/Pass:</strong> {repair.devicePassword || '—'}<br />
              <strong>Enciende:</strong> {repair.powersOn} / Batería: {repair.batteryPercent || '—'}<br />
              <strong>Condición:</strong> {repair.receivingCondition || '—'}<br />
              <strong>Accesorios:</strong>{' '}
              {repair.chargerLeft || repair.coverLeft
                ? [repair.chargerLeft && 'Cargador', repair.coverLeft && 'Funda'].filter(Boolean).join(', ')
                : 'Ninguno'}<br />
              <strong className="block mt-1">Falla:</strong> {repair.problemReported || 'Mantenimiento'}
            </div>

            <div className="flex justify-between mb-1">
              <span>Costo Est.:</span>
              <span>${repair.totalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Anticipo:</span>
              <span>${repair.advancePaid.toFixed(2)}</span>
            </div>
            {repair.abonosPaid > 0 && (
              <div className="flex justify-between mb-1">
                <span>Abonos:</span>
                <span>${repair.abonosPaid.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between font-bold mt-2.5 pt-2 border-t border-solid border-slate-400 text-sm">
              <span>SALDO PENDIENTE:</span>
              <span>${remainingCalculated.toFixed(2)}</span>
            </div>

            <div className="text-center text-[8px] leading-relaxed text-slate-500 mt-3 pt-2 border-t border-dashed border-slate-400">
              {repair.footnote || BIZ.warrantyText}
            </div>

            <div className="text-center mt-4">
              <div className="text-[9px] tracking-widest text-slate-600 font-sans font-bold">{repair.id}</div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-outline-variant bg-surface-container flex justify-end gap-3 select-none">
          <button
            onClick={onClose}
            className="px-4.5 h-10 border border-outline text-on-surface text-xs font-semibold rounded bg-white hover:bg-slate-50 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="px-4.5 h-10 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded shadow-sm flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            Imprimir (F8)
          </button>
        </div>
      </div>
    </div>
  );
}
