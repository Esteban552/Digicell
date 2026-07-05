import { useCallback, useRef, useEffect } from 'react';
import type { RepairOrder } from '../../types';
import { getBusinessInfo } from '../../lib/businessInfo';

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

function receiptHTML(repair: RepairOrder, remaining: number, info = BIZ) {
  const dateStr = repair.createdAt
    ? new Date(repair.createdAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Tijuana' })
    : new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Tijuana' });
  const accs = [
    repair.chargerLeft && 'Cargador',
    repair.coverLeft && 'Funda',
  ].filter(Boolean).join(', ') || 'Ninguno';

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=80mm">
<title>Comprobante #${repair.id}</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', 'Lucida Console', monospace;
    font-size: 10pt;
    width: 72mm;
    margin: 3mm auto;
    color: #000;
    background: #fff;
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
  .mt1 { margin-top: 1mm; }
  .mt2 { margin-top: 2mm; }
  .mt3 { margin-top: 3mm; }
  .mb2 { margin-bottom: 2mm; }
  .px1 { padding-left: 1mm; padding-right: 1mm; }
  .barcode {
    text-align: center; margin-top: 3mm;
    font-family: 'Libre Barcode 39', 'IDAutomationHC39M', monospace;
    font-size: 22pt; letter-spacing: 2px;
  }
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
  <span class="b">Folio:</span> #${repair.id}<br>
  <span class="b">Ingreso:</span> ${dateStr}<br>
  <span class="b">Estado:</span> ${statusLabels[repair.status] || repair.status}<br>
  <span class="b">Técnico:</span> ${repair.technician || '—'}
</div>

<div class="dashed s9">
  <span class="b">Cliente:</span> ${repair.clientName || 'N/A'}<br>
  <span class="b">Tel.:</span> ${repair.clientPhone || 'N/A'}<br>
  ${repair.clientEmail ? `<span class="b">Email:</span> ${repair.clientEmail}<br>` : ''}
  <span class="b">Equipo:</span> ${repair.deviceBrand} ${repair.deviceModel}<br>
  <span class="b">Color:</span> ${repair.deviceColor || '—'}<br>
  <span class="b">IMEI/SN:</span> ${repair.deviceSerial || '—'}<br>
  <span class="b">PIN/Pass:</span> ${repair.devicePassword || '—'}<br>
  <span class="b">Enciende:</span> ${repair.powersOn} / Batería: ${repair.batteryPercent || '—'}<br>
  <span class="b">Condición:</span> ${repair.receivingCondition || '—'}<br>
  <span class="b">Accesorios:</span> ${accs}<br>
  <span class="b mt1" style="display:inline-block">Falla:</span> ${repair.problemReported || 'Mantenimiento'}
</div>

<div class="solid s9">
  <div class="row"><span>Costo Est.:</span><span>$${repair.totalCost.toFixed(2)}</span></div>
  <div class="row"><span>Anticipo:</span><span>$${repair.advancePaid.toFixed(2)}</span></div>
  ${repair.abonosPaid > 0 ? `<div class="row"><span>Abonos:</span><span>$${repair.abonosPaid.toFixed(2)}</span></div>` : ''}
</div>

<div class="solid s11 b row">
  <span>SALDO PENDIENTE:</span>
  <span>$${remaining.toFixed(2)}</span>
</div>

${repair.deliveryDate ? `
<div class="dashed s9 cnt mt2">
  <span class="b">Entrega estimada:</span> ${new Date(repair.deliveryDate).toLocaleDateString('es-AR')}
  ${repair.warrantyEnd ? `<br><span class="b">Garantía hasta:</span> ${new Date(repair.warrantyEnd).toLocaleDateString('es-AR')}` : ''}
</div>` : ''}

<div class="cnt s8 label dashed" style="margin-top:3mm">
  ${repair.footnote || info.warrantyText}
</div>

<div class="barcode">*${repair.id}*</div>
<div class="cnt s8 label" style="margin-top:-1mm">${repair.id}</div>

</body>
</html>`;
}

export default function PrintModal({ open, repair, remainingCalculated, onClose }: PrintModalProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    return () => {
      if (iframeRef.current) {
        iframeRef.current.remove();
        iframeRef.current = null;
      }
    };
  }, []);

  const handlePrint = useCallback(() => {
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
    iframeDoc.write(receiptHTML(repair, remainingCalculated, BIZ));
    iframeDoc.close();

    let didClose = false;
    const closeOnce = () => {
      if (didClose) return;
      didClose = true;
      if (document.body.contains(iframe)) iframe.remove();
      iframeRef.current = null;
      onClose();
    };

    iframe.contentWindow?.addEventListener('afterprint', closeOnce, { once: true });
    setTimeout(closeOnce, 2000);

    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
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
