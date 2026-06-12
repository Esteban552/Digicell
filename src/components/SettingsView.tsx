import React, { useState } from 'react';

interface SettingsViewProps {
  user: string | null;
  showToast: (title: string, desc: string, type: 'success' | 'info' | 'error') => void;
  settings: Record<string, string>;
  updateSetting: (key: string, value: string) => Promise<void>;
}

export default function SettingsView({ user, showToast, settings, updateSetting }: SettingsViewProps) {
  const exchangeRate = settings.exchange_rate ?? '18.50';
  const taxRate = settings.tax_rate ?? '16';
  const shopName = settings.shop_name ?? 'Digicell Centro';
  const isBackupEnabled = settings.backup_enabled !== 'false';

  const [errors, setErrors] = useState<Record<string, string>>({});
  const setError = (k: string, m: string) => setErrors(p => ({ ...p, [k]: m }));
  const clearError = (k: string) => setErrors(p => { const n = { ...p }; delete n[k]; return n; });

  const validateAll = (fd: FormData): boolean => {
    let ok = true;
    const sn = (fd.get('shop_name') as string)?.trim();
    if (!sn) { setError('shop_name', 'El nombre del negocio es obligatorio'); ok = false; }
    else clearError('shop_name');

    const er = (fd.get('exchange_rate') as string)?.trim();
    const erNum = parseFloat(er);
    if (!er || isNaN(erNum) || erNum <= 0) { setError('exchange_rate', 'Debe ser un número positivo'); ok = false; }
    else clearError('exchange_rate');

    const tr = (fd.get('tax_rate') as string)?.trim();
    const trNum = parseFloat(tr);
    if (!tr || isNaN(trNum) || trNum < 0 || trNum > 100) { setError('tax_rate', 'Debe estar entre 0 y 100'); ok = false; }
    else clearError('tax_rate');

    return ok;
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    if (!validateAll(fd)) return;
    await Promise.all([
      updateSetting('shop_name', (fd.get('shop_name') as string) ?? 'Digicell Centro'),
      updateSetting('exchange_rate', (fd.get('exchange_rate') as string) ?? '18.50'),
      updateSetting('tax_rate', (fd.get('tax_rate') as string) ?? '16'),
      updateSetting('backup_enabled', fd.get('backup_enabled') === 'on' ? 'true' : 'false'),
    ]);
    showToast('Configuración Guardada', 'Las tasas de cambio y datos fiscales se actualizaron con éxito.', 'success');
  };

  return (
    <div className="flex-1 flex flex-col gap-6 font-sans select-none max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-on-surface tracking-tight font-sans">
          Configuración
        </h2>
        <p className="text-xs font-sans text-on-surface-variant font-medium mt-1">
          Configurar parámetros del terminal, impuestos locales y respaldos del sistema.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="bg-white border border-outline-variant rounded-md p-6 shadow-sm space-y-5 font-sans text-xs">
        
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Nombre del Negocio</label>
          <input
            type="text"
            name="shop_name"
            defaultValue={shopName}
            onChange={() => clearError('shop_name')}
            className={`h-10 border rounded px-3 focus:border-tertiary outline-none text-sm font-sans font-semibold ${errors.shop_name ? 'border-error' : 'border-outline'}`}
          />
          {errors.shop_name && <p className="text-[10px] text-error font-semibold">{errors.shop_name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Tipo de Cambio (MXN por USD)</label>
            <input
              type="text"
              name="exchange_rate"
              defaultValue={exchangeRate}
              onChange={() => clearError('exchange_rate')}
              className={`h-10 border rounded px-3 focus:border-tertiary outline-none text-sm font-sans font-semibold ${errors.exchange_rate ? 'border-error' : 'border-outline'}`}
            />
            {errors.exchange_rate && <p className="text-[10px] text-error font-semibold">{errors.exchange_rate}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">IVA (%)</label>
            <input
              type="text"
              name="tax_rate"
              defaultValue={taxRate}
              onChange={() => clearError('tax_rate')}
              className={`h-10 border rounded px-3 focus:border-tertiary outline-none text-sm font-sans font-semibold ${errors.tax_rate ? 'border-error' : 'border-outline'}`}
            />
            {errors.tax_rate && <p className="text-[10px] text-error font-semibold">{errors.tax_rate}</p>}
          </div>
        </div>

        <div className="py-2 border-t border-b border-slate-100 flex items-center justify-between font-sans">
          <div>
            <h4 className="font-bold text-on-surface leading-tight text-xs">Respaldo en la Nube</h4>
            <p className="text-slate-400 mt-1 font-medium text-[10px]">Sincronizar automáticamente el historial de reparaciones a servidores seguros.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              name="backup_enabled"
              defaultChecked={isBackupEnabled}
              className="w-10 h-6 bg-slate-200 checked:bg-primary accent-primary cursor-pointer border rounded-full focus:ring-0 appearance-none inline-block relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all checked:after:translate-x-full"
            />
          </label>
        </div>

        <div className="bg-surface-container-low border border-outline-variant rounded p-3 text-on-surface flex items-center gap-2 font-sans select-none text-[11px] leading-normal font-medium text-on-surface-variant">
          <span className="material-symbols-outlined text-tertiary text-lg">info</span>
          <span>Conectado como <b>{user || 'J. Cashier'}</b> con privilegios de técnico.</span>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-6 h-11 bg-primary hover:bg-primary-container text-white rounded font-sans text-xs font-bold shadow-md shadow-primary/20 hover:shadow-lg transition-all outline-none"
          >
            Guardar Configuración
          </button>
        </div>

      </form>
    </div>
  );
}
