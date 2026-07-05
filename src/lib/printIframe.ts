/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
    if (document.body.contains(iframe)) iframe.remove();
    options?.onClose?.();
  };

  iframe.contentWindow?.addEventListener('afterprint', cleanup, { once: true });
  setTimeout(cleanup, options?.timeout ?? 2000);

  iframe.contentWindow?.focus();
  iframe.contentWindow?.print();
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
<meta name="viewport" content="width=80mm">
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
  .s10 { font-size: 10pt; }
  .s11 { font-size: 11pt; }
  .s13 { font-size: 13pt; }
  .dashed { border-bottom: 1px dashed #000; padding-bottom: 2mm; margin-bottom: 2mm; }
  .solid  { border-top: 1px solid #000; margin: 2mm 0; padding-top: 2mm; }
  .solid-bottom  { border-bottom: 1px solid #000; padding-bottom: 2mm; margin-bottom: 2mm; }
  .row { display: flex; justify-content: space-between; }
  .label { color: #555; }
  table { width: 100%; border-collapse: collapse; font-size: 9pt; }
  th, td { padding: 1mm 0; text-align: left; }
  th { border-bottom: 1px solid #000; font-weight: 700; font-size: 8pt; }
  td { border-bottom: 1px dashed #ccc; }
  .amt { text-align: right; }
</style>
</head>
<body>
<div class="cnt s13 b">${biz.name}</div>
<div class="cnt s9 dashed" style="margin-bottom:2mm">
  ${biz.address ?? ''}${biz.address ? '<br>' : ''}Tel: ${biz.phone ?? '—'}
</div>
${contentHTML}
</body>
</html>`;
}
