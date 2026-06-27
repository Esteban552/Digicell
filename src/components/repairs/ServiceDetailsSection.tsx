import type { SectionProps } from './types';

export default function ServiceDetailsSection({
  repair,
  isDraft,
  isDelivered,
  errors,
  onUpdateField,
  onClearError,
  onSetError,
}: SectionProps) {
  return (
    <div className="bg-white border border-outline-variant rounded-md p-5 select-none hover:shadow-sm transition-all shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
      <h3 className="text-sm font-bold text-on-surface border-b border-outline-variant/60 pb-3 mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-[20px]">description</span>
        Detalles del Servicio
      </h3>
      <fieldset disabled={!isDraft} className="border-0 p-0 m-0 min-w-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-on-surface-variant font-sans">Condiciones de Recepción</label>
            <textarea
              readOnly={!isDraft}
              value={repair.receivingCondition}
              onChange={(e) => onUpdateField('receivingCondition', e.target.value.slice(0, 150))}
              placeholder="Detalle de condiciones físicas..."
              className="w-full border border-outline-variant rounded disabled:bg-surface-container-low/40 disabled:cursor-default bg-white text-xs text-on-surface p-3 h-24 focus:border-tertiary outline-none resize-none leading-relaxed font-sans"
              maxLength={150}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-on-surface-variant font-sans">Detalle del Problema Reportado</label>
            <textarea
              readOnly={!isDraft}
              value={repair.problemReported}
              onChange={(e) => {
                const v = e.target.value.slice(0, 150);
                onUpdateField('problemReported', v);
                if (v.trim()) onClearError('problemReported');
              }}
              onBlur={() => {
                if (!repair.problemReported?.trim()) onSetError('problemReported', 'El detalle del problema es obligatorio');
                else onClearError('problemReported');
              }}
              placeholder="Detalle de la falla y trabajo requerido..."
              className={`w-full border rounded disabled:bg-surface-container-low/40 disabled:cursor-default bg-white text-xs text-on-surface p-3 h-24 focus:border-tertiary outline-none resize-none leading-relaxed font-sans font-medium ${errors.problemReported ? 'border-error' : 'border-outline-variant'}`}
              maxLength={150}
            />
            {errors.problemReported && <p className="text-[10px] font-sans text-error font-semibold">{errors.problemReported}</p>}
          </div>
        </div>
      </fieldset>

      <div className="border-t border-outline-variant/60 pt-3 mt-2">
        <label className="text-[11px] font-bold text-on-surface-variant font-sans flex items-center gap-1.5 mb-1.5">
          <span className="material-symbols-outlined text-[16px]">notes</span>
          Notas internas (técnicos)
        </label>
        <textarea
          readOnly={isDelivered}
          value={repair.internalNotes}
          onChange={(e) => onUpdateField('internalNotes', e.target.value.slice(0, 350))}
          placeholder="Mensajes entre técnicos sobre el avance del trabajo..."
          className="w-full border border-outline-variant rounded disabled:bg-surface-container-low/40 disabled:cursor-default bg-white text-xs text-on-surface p-3 h-20 focus:border-tertiary outline-none resize-none leading-relaxed font-sans"
          maxLength={350}
        />
      </div>
    </div>
  );
}
