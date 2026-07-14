import type { SectionProps } from './types';

export default function CustomerDetailsSection({
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
          <span className="material-symbols-outlined text-primary text-[20px]">person</span>
          Datos del Cliente
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-on-surface-variant font-sans">Teléfono</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px]">call</span>
              <input
                type="tel"
                value={repair.clientPhone}
                readOnly={!isDraft}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                  let formatted = digits;
                  if (digits.length >= 3) formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
                  if (digits.length >= 7) formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
                  onUpdateField('clientPhone', formatted);
                  if (digits.length === 10) onClearError('clientPhone');
                }}
                onBlur={() => {
                  const digits = (repair.clientPhone || '').replace(/\D/g, '');
                  if (digits && digits.length !== 10) onSetError('clientPhone', 'El teléfono debe tener 10 dígitos');
                  else onClearError('clientPhone');
                }}
                placeholder="(555) 000-0000"
                className={`h-10 w-full pl-9 pr-3 border rounded disabled:bg-surface-container-low/40 disabled:cursor-default bg-white text-xs text-on-surface focus:border-tertiary outline-none transition-all font-sans ${errors.clientPhone ? 'border-error' : 'border-outline-variant'}`}
              />
            </div>
            {errors.clientPhone && <p className="text-[10px] font-sans text-error font-semibold">{errors.clientPhone}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-on-surface-variant font-sans">
              Nombre Completo <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={repair.clientName}
              readOnly={!isDraft}
              onChange={(e) => {
                const v = e.target.value.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]/g, '').slice(0, 50);
                onUpdateField('clientName', v);
                if (v.trim()) onClearError('clientName');
              }}
              onBlur={() => {
                if (!repair.clientName?.trim()) onSetError('clientName', 'El nombre del cliente es obligatorio');
                else onClearError('clientName');
              }}
              placeholder="Juan Pérez"
              className={`h-10 w-full px-3 border rounded disabled:bg-surface-container-low/40 disabled:cursor-default bg-white text-xs text-on-surface focus:border-tertiary outline-none transition-all font-sans font-medium ${errors.clientName ? 'border-error' : 'border-outline-variant'}`}
              maxLength={50}
            />
            {errors.clientName && <p className="text-[10px] font-sans text-error font-semibold">{errors.clientName}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-on-surface-variant font-sans">Correo Electrónico</label>
            <input
              type="email"
              value={repair.clientEmail}
              readOnly={!isDraft}
              onChange={(e) => {
                onUpdateField('clientEmail', e.target.value.slice(0, 50));
                if (errors.clientEmail) onClearError('clientEmail');
              }}
              onBlur={() => {
                const v = repair.clientEmail?.trim();
                if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) onSetError('clientEmail', 'Correo electrónico no válido');
                else onClearError('clientEmail');
              }}
              placeholder="cliente@correo.com"
              className={`h-10 w-full px-3 border rounded disabled:bg-surface-container-low/40 disabled:cursor-default bg-white text-xs text-on-surface focus:border-tertiary outline-none transition-all font-sans ${errors.clientEmail ? 'border-error' : 'border-outline-variant'}`}
              maxLength={50}
            />
            {errors.clientEmail && <p className="text-[10px] font-sans text-error font-semibold">{errors.clientEmail}</p>}
          </div>
        </div>
      </div>
    </fieldset>
  );
}
