import { useCallback, useRef, useEffect } from 'react';
import type { POSTicketData } from '../types';
import type { BusinessInfo } from '../lib/businessInfo';
import { getBusinessInfo } from '../lib/businessInfo';

interface POSTicketPrintModalProps {
  open: boolean;
  data: POSTicketData | null;
  onClose: () => void;
  businessInfo?: BusinessInfo;
}

function receiptHTML(d: POSTicketData, info: BusinessInfo) {
  const itemsHTML = d.items.map(item => `
    <div class="row s9">
      <span>${item.qty}x ${item.name}</span>
      <span>$${item.total.toFixed(2)}</span>
    </div>
  `).join('');

  const discountLine = d.discount > 0 ? `
    <div class="row s9" style="color:#c00">
      <span>Descuento</span>
      <span>-$${d.discount.toFixed(2)}</span>
    </div>
  ` : '';

  const payments: string[] = [];
  if (d.cashAmount > 0) payments.push(`Efectivo: $${d.cashAmount.toFixed(2)}`);
  if (d.cardAmount > 0) payments.push(`Tarjeta: $${d.cardAmount.toFixed(2)}`);
  if (d.usdAmount > 0) payments.push(`USD $${d.usdAmount.toFixed(2)} (T.C. $${d.usdExchangeRate.toFixed(2)})`);

  const dateStr = d.createdAt
    ? new Date(d.createdAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Tijuana' })
    : new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Tijuana' });

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=80mm">
<title>Ticket #${d.saleId}</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', 'Lucida Console', monospace;
    font-size: 10pt; width: 72mm; margin: 3mm auto; color: #000; background: #fff;
  }
  .cnt { text-align: center; }
  .b { font-weight: 700; }
  .s8  { font-size: 8pt; }
  .s9  { font-size: 9pt; }
  .s11 { font-size: 11pt; }
  .s13 { font-size: 13pt; }
  .dashed { border-bottom: 1px dashed #000; padding-bottom: 2mm; margin-bottom: 2mm; }
  .solid  { border-top: 1px solid #000; margin: 2mm 0; padding-top: 2mm; }
  .row { display: flex; justify-content: space-between; }
  .label { color: #555; }
</style>
</head>
<body>
<div class="cnt s13 b">${info.name}</div>
<div class="cnt s9 dashed">
  ${info.address}<br>
  Tel: ${info.phone}
</div>

<div class="s9 mb2">
  <span class="b">Ticket #</span>${d.saleId}<br>
  <span class="b">Fecha:</span> ${dateStr}<br>
  <span class="b">Atendió:</span> ${d.attendant}
</div>

<div class="solid s9">
  ${itemsHTML}
</div>

<div class="solid s9">
  <div class="row"><span>Subtotal</span><span>$${d.subtotal.toFixed(2)}</span></div>
  ${discountLine}
  <div class="row"><span>IVA (${d.taxRate}%)</span><span>$${d.tax.toFixed(2)}</span></div>
</div>

<div class="solid s11 b row">
  <span>TOTAL</span>
  <span>$${d.total.toFixed(2)}</span>
</div>

<div class="solid s9">
  ${payments.map(p => `<div class="row"><span>${p}</span></div>`).join('')}
  <div class="row b s11" style="margin-top:1mm">
    <span>Cambio</span>
    <span>$${d.change.toFixed(2)}</span>
  </div>
</div>

<div class="cnt s8 label dashed" style="margin-top:3mm">
  ¡Gracias por su compra!
</div>

</body>
</html>`;
}

export default function POSTicketPrintModal({ open, data, onClose, businessInfo }: POSTicketPrintModalProps) {
  const info = businessInfo ?? getBusinessInfo();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Cleanup: remove iframe on unmount
  useEffect(() => {
    return () => {
      if (iframeRef.current) {
        iframeRef.current.remove();
        iframeRef.current = null;
      }
    };
  }, []);

  const handlePrint = useCallback(() => {
    if (!data) return;

    // Use a hidden iframe for printing — avoids popup blockers
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);
    iframeRef.current = iframe;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      iframe.remove();
      iframeRef.current = null;
      return;
    }

    iframeDoc.open();
    iframeDoc.write(receiptHTML(data, info));
    iframeDoc.close();

    // Track if we already closed to prevent double onClose
    let didClose = false;
    const closeOnce = () => {
      if (didClose) return;
      didClose = true;
      if (document.body.contains(iframe)) iframe.remove();
      iframeRef.current = null;
      onClose();
    };

    // 'afterprint' is supported in most modern browsers
    iframe.contentWindow?.addEventListener('afterprint', closeOnce, { once: true });

    // Fallback: auto-close after 2s if afterprint doesn't fire
    setTimeout(closeOnce, 2000);

    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
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
