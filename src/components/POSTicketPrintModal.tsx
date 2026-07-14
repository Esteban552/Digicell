import { useCallback } from 'react';
import type { POSTicketData } from '../types';
import type { BusinessInfo } from '../lib/businessInfo';
import { getBusinessInfo } from '../lib/businessInfo';
import { printHTML, receiptHTML } from '../lib/printIframe';

interface POSTicketPrintModalProps {
  open: boolean;
  data: POSTicketData | null;
  onClose: () => void;
  businessInfo?: BusinessInfo;
}

export default function POSTicketPrintModal({ open, data, onClose, businessInfo }: POSTicketPrintModalProps) {
  const info = businessInfo ?? getBusinessInfo();

  const handlePrint = useCallback(() => {
    if (!data) return;
    printHTML(receiptHTML(data, info), { onClose });
  }, [data, info, onClose]);

  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-outline-variant w-full max-w-sm shadow-2xl flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center select-none">
          <h3 className="text-sm font-bold text-on-surface font-sans">Ticket de Venta</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-error transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 bg-slate-100 flex justify-center items-center h-[350px] overflow-y-auto">
          <div className="bg-white text-black w-[240px] p-4 font-mono text-[11px] leading-tight shadow-md border border-slate-300 select-none">
            <div className="text-center font-bold text-sm tracking-wide mb-1">{info.name}</div>
            <div className="text-center text-[10px] mb-3 border-b border-dashed border-slate-400 pb-2">
              {info.address}<br />Tel: {info.phone}
            </div>

            <div className="mb-2.5">
              <strong>Ticket #</strong>{data.saleId}<br />
              <strong>Fecha:</strong> {new Date(data.createdAt || Date.now()).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Tijuana' })}<br />
              <strong>Atendió:</strong> {data.attendant}
            </div>

            <div className="border-t border-b border-dashed border-slate-400 py-2 mb-2.5">
              {data.items.map((item, i) => (
                <div key={i} className="flex justify-between text-[11px]">
                  <span className="truncate mr-2">{item.qty}x {item.name}</span>
                  <span className="shrink-0">${item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-b border-dashed border-slate-400 py-2 mb-2.5">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${data.subtotal.toFixed(2)}</span>
              </div>
              {data.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Descuento</span>
                  <span>-${data.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>IVA ({data.taxRate}%)</span>
                <span>${data.tax.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between font-bold mt-2.5 pt-2 border-t border-solid border-slate-400 text-sm">
              <span>TOTAL</span>
              <span>${data.total.toFixed(2)}</span>
            </div>

            <div className="border-t border-dashed border-slate-400 py-2 mt-2.5 space-y-1">
              {data.cashAmount > 0 && (
                <div className="flex justify-between"><span>Efectivo:</span><span>${data.cashAmount.toFixed(2)}</span></div>
              )}
              {data.cardAmount > 0 && (
                <div className="flex justify-between"><span>Tarjeta:</span><span>${data.cardAmount.toFixed(2)}</span></div>
              )}
              {data.usdAmount > 0 && (
                <div className="flex justify-between"><span>USD ${data.usdAmount.toFixed(2)}:</span><span>${(data.usdAmount * data.usdExchangeRate).toFixed(2)}</span></div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-slate-400">
                <span>Cambio</span>
                <span>${data.change.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-center text-[8px] leading-relaxed text-slate-500 mt-3 pt-2 border-t border-dashed border-slate-400">
              ¡Gracias por su compra!
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
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}
