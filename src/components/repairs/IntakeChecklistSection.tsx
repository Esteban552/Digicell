import type { SectionProps } from './types';

export default function IntakeChecklistSection({
  repair,
  isDraft,
  isDelivered,
  errors,
  onUpdateField,
  onClearError,
  onSetError,
}: SectionProps) {
  return (
    <fieldset disabled={!isDraft || isDelivered} className="border-0 p-0 m-0 min-w-0">
      <div className="bg-white border border-outline-variant rounded-md p-5 select-none hover:shadow-sm transition-all shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
        <h3 className="text-sm font-bold text-on-surface border-b border-outline-variant/60 pb-3 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">fact_check</span>
          Lista de Recepción
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-on-surface-variant font-sans">¿Enciende?</label>
            <select
              disabled={!isDraft}
              value={repair.powersOn}
              onChange={(e) => onUpdateField('powersOn', e.target.value)}
              className="h-10 w-full px-2.5 border border-outline-variant rounded disabled:bg-surface-container-low/40 disabled:cursor-default bg-white text-xs text-on-surface focus:border-tertiary outline-none font-sans cursor-pointer font-semibold"
            >
              <option value="Yes">Sí</option>
              <option value="No">No</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-on-surface-variant font-sans">Batería %</label>
            <input
              type="text"
              value={repair.batteryPercent}
              readOnly={!isDraft}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 3);
                onUpdateField('batteryPercent', v);
                if (errors.batteryPercent) onClearError('batteryPercent');
              }}
              onBlur={() => {
                const n = parseInt(repair.batteryPercent, 10);
                if (repair.batteryPercent && (isNaN(n) || n < 0 || n > 100)) onSetError('batteryPercent', 'Debe ser un número entre 0 y 100');
                else onClearError('batteryPercent');
              }}
              placeholder="0-100"
              className={`h-10 w-full px-3 border rounded disabled:bg-surface-container-low/40 disabled:cursor-default bg-white text-xs text-on-surface focus:border-tertiary outline-none font-sans ${errors.batteryPercent ? 'border-error' : 'border-outline-variant'}`}
            />
            {errors.batteryPercent && <p className="text-[10px] font-sans text-error font-semibold">{errors.batteryPercent}</p>}
          </div>

          <div className="flex items-center h-10 select-none pb-1 font-sans">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                disabled={!isDraft}
                checked={repair.chargerLeft}
                onChange={(e) => onUpdateField('chargerLeft', e.target.checked)}
                className="w-4.5 h-4.5 rounded border-outline-variant text-primary focus:ring-0 accent-primary disabled:opacity-50 cursor-pointer border"
              />
              <span className="text-xs font-semibold text-on-surface font-sans">¿Cargador Incluido?</span>
            </label>
          </div>

          <div className="flex items-center h-10 select-none pb-1 font-sans">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                disabled={!isDraft}
                checked={repair.coverLeft}
                onChange={(e) => onUpdateField('coverLeft', e.target.checked)}
                className="w-4.5 h-4.5 rounded border-outline-variant text-primary focus:ring-0 accent-primary disabled:opacity-50 cursor-pointer border"
              />
              <span className="text-xs font-semibold text-on-surface font-sans">¿Funda Incluida?</span>
            </label>
          </div>
        </div>
      </div>
    </fieldset>
  );
}
