/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface SettingsViewProps {
  user: string | null;
  showToast: (title: string, desc: string, type: 'success' | 'info' | 'error') => void;
}

export default function SettingsView({ user, showToast }: SettingsViewProps) {
  const [exchangeRate, setExchangeRate] = useState('18.50');
  const [taxRate, setTaxRate] = useState('16');
  const [shopName, setShopName] = useState('Digicell Centro');
  const [isBackupEnabled, setIsBackupEnabled] = useState(true);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Configuración Guardada', 'Las tasas de cambio y datos fiscales se actualizaron con éxito.', 'success');
  };

  return (
    <div className="flex-1 flex flex-col gap-6 font-sans select-none max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-on-surface tracking-tight font-sans">
          Settings
        </h2>
        <p className="text-xs font-sans text-on-surface-variant font-medium mt-1">
          Configure terminal parameters, local taxes, and system backup triggers.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="bg-white border border-outline-variant rounded-md p-6 shadow-sm space-y-5 font-sans text-xs">
        
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Shop Brand / Name</label>
          <input 
            type="text" 
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            className="h-10 border border-outline rounded px-3 focus:border-tertiary outline-none text-sm font-sans font-semibold"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Exchange Rate (MXN per USD)</label>
            <input 
              type="text" 
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              className="h-10 border border-outline rounded px-3 focus:border-tertiary outline-none text-sm font-sans font-semibold"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Tax (IVA %)</label>
            <input 
              type="text" 
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="h-10 border border-outline rounded px-3 focus:border-tertiary outline-none text-sm font-sans font-semibold"
            />
          </div>
        </div>

        <div className="py-2 border-t border-b border-slate-100 flex items-center justify-between font-sans">
          <div>
            <h4 className="font-bold text-on-surface leading-tight text-xs">Durable Cloud Backups</h4>
            <p className="text-slate-400 mt-1 font-medium text-[10px]">Automatically synchronize repair history to secure encrypted servers.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={isBackupEnabled}
              onChange={() => setIsBackupEnabled(!isBackupEnabled)}
              className="w-10 h-6 bg-slate-200 checked:bg-primary accent-primary cursor-pointer border rounded-full focus:ring-0 appearance-none inline-block relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all checked:after:translate-x-full"
            />
          </label>
        </div>

        <div className="bg-surface-container-low border border-outline-variant rounded p-3 text-on-surface flex items-center gap-2 font-sans select-none text-[11px] leading-normal font-medium text-on-surface-variant">
          <span className="material-symbols-outlined text-tertiary text-lg">info</span>
          <span>Logged in as <b>{user || 'J. Cashier'}</b> with technician security privileges.</span>
        </div>

        <div className="pt-2 flex justify-end">
          <button 
            type="submit"
            className="px-6 h-11 bg-primary hover:bg-primary-container text-white rounded font-sans text-xs font-bold shadow-md shadow-primary/20 hover:shadow-lg transition-all outline-none"
          >
            Save Settings
          </button>
        </div>

      </form>
    </div>
  );
}
