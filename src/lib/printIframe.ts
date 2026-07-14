/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { POSTicketData, RepairOrder } from '../types';
import type { BusinessInfo } from './businessInfo';

/**
 * Prints an HTML document using a hidden iframe.
 * Avoids popup blockers and auto-cleans up after printing.
 *
 * @param html - Full HTML document string (including <!DOCTYPE>, <html>, etc.)
 * @param options - Optional cleanup callback and timeout override
 */
export function printHTML(
  html: string,
  options?: { onClose?: () => void; timeout?: number },
) {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    iframe.remove();
    return;
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  let didClose = false;
  const cleanup = () => {
    if (didClose) return;
    didClose = true;
    clearTimeout(safetyTimeout);
    if (document.body.contains(iframe)) iframe.remove();
    options?.onClose?.();
  };

  // afterprint fires when the user completes or cancels the print dialog
  iframe.contentWindow?.addEventListener('afterprint', cleanup, { once: true });

  // Safety net: remove iframe after 60s if afterprint never fires
  const safetyTimeout = setTimeout(cleanup, options?.timeout ?? 60_000);

  // Small delay lets the browser render the content before printing
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  }, 500);
}

/**
 * Thermal‑receipt page wrapper — wraps content in 80mm receipt format
 * with the business header already included.
 */
export function receiptPage(contentHTML: string, biz: { name: string; address?: string; phone?: string }) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<style>
  @page { size: 80mm auto; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 9.5pt; line-height: 1.6;
    width: 72mm; margin: 4mm auto;
    color: #000; background: #fff;
    font-weight: 500;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .cnt { text-align: center; }
  .b { font-weight: 700; }
  .label { color: #888; font-size: 9pt; }
  .s9  { font-size: 10pt; }
  .s10 { font-size: 11pt; }
  .s11 { font-size: 12pt; }
  .s13 { font-size: 14pt; }

  .section { margin: 3mm 0; }
  .divider { border: 0; border-top: 1px solid #bbb; margin: 2.5mm 0; }
  .divider-light { border: 0; border-top: 1px solid #ddd; margin: 2mm 0; }
  .divider-double { border: 0; border-top: 3px double #888; margin: 2.5mm 0; }
  .solid-bottom { border-bottom: 1px solid #000; }

  .hdr {
    font-size: 8.5pt; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.8px;
    color: #888; margin-bottom: 1.5mm;
  }

  .row { display: flex; justify-content: space-between; align-items: baseline; }
  .row + .row { margin-top: 0.8mm; }

  table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  th, td { padding: 1mm 0; text-align: left; vertical-align: top; }
  th {
    font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    color: #888; border-bottom: 1px solid #bbb; padding-bottom: 1.2mm;
  }
  td { border-bottom: 1px solid #ddd; }
  tr:last-child td { border-bottom: none; }
  tr + tr td { border-top: 1px solid #eee; }
  .amt { text-align: right; white-space: nowrap; }
</style>
</head>
<body>

<div class="cnt" style="margin-bottom: 1.5mm">
  <img src="/LogoDigicell.png" alt="${biz.name}" style="width: 36mm; height: auto; display: block; margin: 0 auto 0.5mm;" />
</div>
<hr class="divider-double">

${contentHTML}
</body>
</html>`;
}

// ── POS Ticket HTML ─────────────────────────────────────────

/** Generates a complete HTML document for a POS sale ticket. */
export function receiptHTML(d: POSTicketData, info: BusinessInfo) {
  const itemsHTML = d.items
    .map(
      (item) => `
    <div class="row" style="font-size:9.5pt">
      <span>${item.qty}x ${item.name}</span>
      <span>$${item.total.toFixed(2)}</span>
    </div>`,
    )
    .join('');

  const discountLine =
    d.discount > 0
      ? `
    <div class="row" style="font-size:9.5pt;color:#c00">
      <span>Descuento</span>
      <span>-$${d.discount.toFixed(2)}</span>
    </div>`
      : '';

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
<meta name="viewport" content="width=device-width">
<title>Ticket #${d.saleId}</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 9.5pt; line-height: 1.35;
    width: 72mm; margin: 3mm auto;
    color: #000; background: #fff;
    font-weight: 500;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .cnt { text-align: center; }
  .b { font-weight: 700; }
  .label { color: #888; font-size: 8.5pt; }

  .divider { border: 0; border-top: 1px solid #bbb; margin: 1.5mm 0; }
  .divider-light { border: 0; border-top: 1px solid #ddd; margin: 1.2mm 0; }
  .divider-double { border: 0; border-top: 3px double #888; margin: 1.5mm 0; }
  .section { margin: 1.5mm 0; }

  .row { display: flex; justify-content: space-between; align-items: baseline; }
  .row + .row { margin-top: 0.5mm; }
  .row-total { display: flex; justify-content: space-between; align-items: baseline; font-size: 12pt; font-weight: 700; }
  .row-change { display: flex; justify-content: space-between; align-items: baseline; font-size: 11pt; font-weight: 700; color: #222; }
</style>
</head>
<body>

<div class="cnt" style="margin-bottom: 1mm">
  <img src="/LogoDigicell.png" alt="${info.name}" style="width: 36mm; height: auto; display: block; margin: 0 auto 0.5mm;" />
  <div style="font-size: 8pt; color: #888; margin-top: 0.3mm; line-height: 1.3;">
    ${info.address}<br>Tel: ${info.phone}
  </div>
</div>
<hr class="divider-double">

<div class="section" style="font-size: 9pt; line-height: 1.4;">
  <span style="font-weight: 600;">Ticket #</span>${d.saleId}<br>
  <span style="font-weight: 600;">Fecha:</span> ${dateStr}<br>
  <span style="font-weight: 600;">Atendió:</span> ${d.attendant}
</div>

<hr class="divider-light">

<div class="section" style="font-size: 9.5pt;">
  ${itemsHTML}
</div>

<hr class="divider-light">

<div class="section" style="font-size: 9.5pt;">
  <div class="row"><span>Subtotal</span><span>$${d.subtotal.toFixed(2)}</span></div>
  ${discountLine}
  <div class="row"><span>IVA (${d.taxRate}%)</span><span>$${d.tax.toFixed(2)}</span></div>
</div>

<hr class="divider-double">

<div class="row-total">
  <span>TOTAL</span>
  <span>$${d.total.toFixed(2)}</span>
</div>

<hr class="divider-light">

<div class="section" style="font-size: 9.5pt;">
  ${payments.map((p) => `<div class="row"><span>${p}</span></div>`).join('')}
  <div class="row-change" style="margin-top: 1mm; padding-top: 1mm; border-top: 1px solid #ddd;">
    <span>Cambio</span>
    <span>$${d.change.toFixed(2)}</span>
  </div>
</div>

<hr class="divider-double">

<div class="cnt label" style="margin-top: 1.5mm;">
  ¡Gracias por su compra!
</div>

</body>
</html>`;
}

// ── Repair Ticket HTML ──────────────────────────────────────

const repairStatusLabels: Record<string, string> = {
  in_review: 'En Revisión',
  waiting_parts: 'Esperando Repuestos',
  repaired: 'Reparado',
  delivered: 'Entregado',
};

/** Generates a complete HTML document for a repair order ticket. */
export function repairReceiptHTML(repair: RepairOrder, remaining: number, info: BusinessInfo) {
  const dateStr = repair.createdAt
    ? new Date(repair.createdAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Tijuana' })
    : new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Tijuana' });
  const accs = [
    repair.chargerLeft && 'Cargador',
    repair.coverLeft && 'Funda',
  ].filter(Boolean).join(', ') || 'Ninguno';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>Comprobante #${repair.id}</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 9.5pt; line-height: 1.6;
    width: 72mm; margin: 4mm auto;
    color: #000; background: #fff;
    font-weight: 500;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .cnt { text-align: center; }
  .b { font-weight: 700; }
  .label { color: #888; font-size: 8pt; }

  .divider { border: 0; border-top: 1px solid #bbb; margin: 2.5mm 0; }
  .divider-light { border: 0; border-top: 1px solid #ddd; margin: 2mm 0; }
  .divider-double { border: 0; border-top: 3px double #888; margin: 2.5mm 0; }
  .section { margin: 2.5mm 0; }

  .row { display: flex; justify-content: space-between; align-items: baseline; }
  .row + .row { margin-top: 0.8mm; }
  .row-total { display: flex; justify-content: space-between; align-items: baseline; font-size: 11.5pt; font-weight: 700; }

  .info-grid { font-size: 9pt; line-height: 1.75; }
  .info-grid strong { font-weight: 600; }

  .barcode {
    text-align: center; margin-top: 3mm;
    font-family: 'Libre Barcode 39', 'IDAutomationHC39M', monospace;
    font-size: 22pt; letter-spacing: 2px;
  }
</style>
</head>
<body>

<div class="cnt" style="margin-bottom: 1mm">
  <img src="/LogoDigicell.png" alt="${info.name}" style="width: 36mm; height: auto; display: block; margin: 0 auto 0.5mm;" />
  <div style="font-size: 8pt; color: #888; margin-top: 0.3mm; line-height: 1.3;">
    ${info.address}<br>Tel: ${info.phone}
  </div>
</div>
<hr class="divider-double">

<div class="section info-grid">
  <strong>Folio:</strong> #${repair.id}<br>
  <strong>Ingreso:</strong> ${dateStr}<br>
  <strong>Estado:</strong> ${repairStatusLabels[repair.status] || repair.status}<br>
  <strong>Técnico:</strong> ${repair.technician || '—'}
</div>

<hr class="divider-light">

<div class="section info-grid">
  <strong>Cliente:</strong> ${repair.clientName || 'N/A'}<br>
  <strong>Tel.:</strong> ${repair.clientPhone || 'N/A'}<br>
  ${repair.clientEmail ? `<strong>Email:</strong> ${repair.clientEmail}<br>` : ''}
  <strong>Equipo:</strong> ${repair.deviceBrand} ${repair.deviceModel}<br>
  <strong>Color:</strong> ${repair.deviceColor || '—'}<br>
  <strong>IMEI/SN:</strong> ${repair.deviceSerial || '—'}<br>
  <strong>PIN/Pass:</strong> ${repair.devicePassword || '—'}<br>
  <strong>Enciende:</strong> ${repair.powersOn} / Batería: ${repair.batteryPercent || '—'}<br>
  <strong>Condición:</strong> ${repair.receivingCondition || '—'}<br>
  <strong>Accesorios:</strong> ${accs}<br>
  <strong>Falla:</strong> ${repair.problemReported || 'Mantenimiento'}
</div>

<hr class="divider-light">

<div class="section" style="font-size: 9.5pt;">
  <div class="row"><span>Costo Est.</span><span>$${repair.totalCost.toFixed(2)}</span></div>
  <div class="row"><span>Anticipo</span><span>$${repair.advancePaid.toFixed(2)}</span></div>
  ${repair.abonosPaid > 0 ? `<div class="row"><span>Abonos</span><span>$${repair.abonosPaid.toFixed(2)}</span></div>` : ''}
</div>

<hr class="divider-double">

<div class="row-total">
  <span>SALDO PENDIENTE</span>
  <span>$${remaining.toFixed(2)}</span>
</div>

${repair.deliveryDate ? `
<hr class="divider-light">
<div class="section cnt" style="font-size: 9pt; line-height: 1.7;">
  <strong>Entrega estimada:</strong> ${new Date(repair.deliveryDate).toLocaleDateString('es-MX')}
  ${repair.warrantyEnd ? `<br><strong>Garantía hasta:</strong> ${new Date(repair.warrantyEnd).toLocaleDateString('es-MX')}` : ''}
</div>` : ''}

<hr class="divider-double">

<div class="cnt label" style="margin-top: 1mm;">
  ${repair.footnote || info.warrantyText}
</div>

<div class="barcode">*${repair.id}*</div>
<div class="cnt label" style="margin-top: -0.5mm;">${repair.id}</div>

</body>
</html>`;
}
