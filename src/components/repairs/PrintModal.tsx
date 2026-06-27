import type { RepairOrder } from '../../types';

interface PrintModalProps {
  open: boolean;
  repair: RepairOrder;
  remainingCalculated: number;
  onClose: () => void;
  onPrint: () => void;
}

export default function PrintModal({ open, repair, remainingCalculated, onClose, onPrint }: PrintModalProps) {
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
            <div className="text-center font-bold text-sm tracking-wide mb-1">DIGICELL REPAIRS</div>
            <div className="text-center text-[10px] mb-3 border-b border-dashed border-slate-400 pb-2">
              123 Tech Street, Downtown
              <br />
              Tel: (555) 123-4567
            </div>

            <div className="mb-2.5">
              Folio: #{repair.id}
              <br />
              Fecha: {new Date(repair.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
            </div>

            <div className="border-t border-b border-dashed border-slate-400 py-2 mb-3 space-y-1">
              <strong>Cliente:</strong> {repair.clientName || 'N/A'}
              <br />
              <strong>Teléfono:</strong> {repair.clientPhone || 'N/A'}
              <br />
              <strong>Equipo:</strong> {repair.deviceBrand} {repair.deviceModel} ({repair.deviceColor || 'Sin color'})
              <br />
              <strong>IMEI/SN:</strong> {repair.deviceSerial || 'N/A'}
              <br />
              <strong>Contraseña/PIN:</strong> {repair.devicePassword || 'N/A'}
              <br />
              <strong>Condición:</strong> {repair.receivingCondition || 'N/A'}
              <br />
              <strong>Accesorios:</strong>{' '}
              {repair.chargerLeft ? 'Cargador ' : ''}{' '}
              {repair.coverLeft ? 'Funda' : ''}{' '}
              {!repair.chargerLeft && !repair.coverLeft ? 'Ninguno' : ''}
              <br />
              <strong className="block mt-1">
                Falla: {repair.problemReported || 'Mantenimiento de reparación'}
              </strong>
            </div>

            <div className="flex justify-between mb-1">
              <span>Costo Est.:</span>
              <span>${repair.totalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Anticipo:</span>
              <span>${repair.advancePaid.toFixed(2)}</span>
            </div>

            <div className="flex justify-between font-bold mt-2.5 pt-2 border-t border-solid border-slate-400 text-sm">
              <span>TOTAL A PAGAR:</span>
              <span>${remainingCalculated.toFixed(2)}</span>
            </div>

            <div className="text-center text-[8px] leading-relaxed text-slate-500 mt-5 pt-2 border-t border-dashed border-slate-400">
              {repair.footnote || 'Garantía estándar de 30 días.'}
            </div>

            <div className="text-center mt-4">
              <div className="flex justify-center items-center h-8 gap-[1px] bg-black max-w-[120px] mx-auto select-none opacity-90">
                {[2, 1, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3, 1, 1, 2, 3, 4, 1, 2].map((num, i) => (
                  <div key={i} style={{ width: `${num}px` }} className="h-full bg-black/0 first:bg-black even:bg-black filter invert" />
                ))}
              </div>
              <div className="text-[9px] mt-1 tracking-widest text-slate-600 font-sans">{repair.id}</div>
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
            onClick={onPrint}
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
