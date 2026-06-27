import type { SectionProps } from './types';

export default function DeviceInfoSection({
  repair,
  isDraft,
  errors,
  onUpdateField,
  onClearError,
  onSetError,
}: SectionProps) {
  return (
    <fieldset disabled={!isDraft} className="border-0 p-0 m-0 min-w-0">
      <div className="bg-white border border-outline-variant rounded-md p-5 select-none hover:shadow-sm transition-all shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
        <h3 className="text-sm font-bold text-on-surface border-b border-outline-variant/60 pb-3 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">smartphone</span>
          Información del Dispositivo
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-on-surface-variant font-sans">Marca</label>
            <select
              disabled={!isDraft}
              value={repair.deviceBrand}
              onChange={(e) => onUpdateField('deviceBrand', e.target.value)}
              className="h-10 w-full px-2.5 border border-outline-variant rounded disabled:bg-surface-container-low/40 disabled:cursor-default bg-white text-xs text-on-surface focus:border-tertiary outline-none font-sans cursor-pointer"
            >
              <option value="Apple">Apple</option>
              <option value="Samsung">Samsung</option>
              <option value="Motorola">Motorola</option>
              <option value="Xiaomi">Xiaomi</option>
              <option value="Huawei">Huawei</option>
              <option value="Other">Otra Marca</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-on-surface-variant font-sans">
              Modelo {repair.totalCost > 0 && <span className="text-error">*</span>}
            </label>
            <input
              type="text"
              value={repair.deviceModel}
              readOnly={!isDraft}
              onChange={(e) => {
                const v = e.target.value.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9\s-./]/g, '').slice(0, 30);
                onUpdateField('deviceModel', v);
                if (errors.deviceModel) onClearError('deviceModel');
              }}
              onBlur={() => {
                if (repair.totalCost > 0 && !repair.deviceModel?.trim()) onSetError('deviceModel', 'Indicá el modelo si hay costo');
                else onClearError('deviceModel');
              }}
              placeholder="Ej: iPhone 13 Pro"
              className={`h-10 w-full px-3 border rounded disabled:bg-surface-container-low/40 disabled:cursor-default bg-white text-xs text-on-surface focus:border-tertiary outline-none font-sans font-medium ${errors.deviceModel ? 'border-error' : 'border-outline-variant'}`}
              maxLength={30}
            />
            {errors.deviceModel && <p className="text-[10px] font-sans text-error font-semibold">{errors.deviceModel}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-on-surface-variant font-sans">IMEI / Serial</label>
            <input
              type="text"
              value={repair.deviceSerial}
              readOnly={!isDraft}
              onChange={(e) =>
                onUpdateField('deviceSerial', e.target.value.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9]/g, '').slice(0, 20))
              }
              placeholder="15 Digits"
              className="h-10 w-full px-3 border border-outline-variant rounded disabled:bg-surface-container-low/40 disabled:cursor-default bg-white text-xs text-on-surface font-mono focus:border-tertiary outline-none font-sans"
              maxLength={20}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-on-surface-variant font-sans">Contraseña/PIN</label>
            <input
              type="text"
              value={repair.devicePassword}
              readOnly={!isDraft}
              onChange={(e) => onUpdateField('devicePassword', e.target.value.slice(0, 20))}
              placeholder="PIN/Patrón"
              className="h-10 w-full px-3 border border-outline-variant rounded disabled:bg-surface-container-low/40 disabled:cursor-default bg-white text-xs text-on-surface focus:border-tertiary outline-none font-sans"
              maxLength={20}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-on-surface-variant font-sans">Color</label>
            <input
              type="text"
              value={repair.deviceColor}
              readOnly={!isDraft}
              onChange={(e) =>
                onUpdateField('deviceColor', e.target.value.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]/g, '').slice(0, 15))
              }
              placeholder="Ej: Graphite / Space Grey"
              className="h-10 w-full px-3 border border-outline-variant rounded disabled:bg-surface-container-low/40 disabled:cursor-default bg-white text-xs text-on-surface focus:border-tertiary outline-none font-sans"
              maxLength={15}
            />
          </div>
        </div>
      </div>
    </fieldset>
  );
}
