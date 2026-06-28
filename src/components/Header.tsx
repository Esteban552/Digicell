/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ActiveView } from '../types';

interface HeaderProps {
  activeView: ActiveView;
  user: string | null;
  onCreateNewRepair: () => void;
  onDeleteCurrentRepair: () => void;
  onReprintCurrentRepair: () => void;
  onClearRepairForm: () => void;
  onOpenServiciosModal: () => void;
  onJumpToRepair: (folio: number) => void;
  currentRepairId: string;
}

export default function Header({
  activeView,
  user,
  onCreateNewRepair,
  onDeleteCurrentRepair,
  onReprintCurrentRepair,
  onClearRepairForm,
  onOpenServiciosModal,
  onJumpToRepair,
  currentRepairId
}: HeaderProps) {
  const [folioInput, setFolioInput] = useState('');

  if (activeView === 'login') return null;

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-40 bg-white border-b border-outline-variant flex justify-between items-center h-16 px-6 select-none shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
      
      {/* Left side actions relative to the active view */}
      {activeView === 'repairs' ? (
        <div className="flex items-center gap-2">
          <button
            onClick={onCreateNewRepair}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-white text-xs font-semibold rounded hover:opacity-90 shadow-sm transition-all cursor-pointer outline-none shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Nueva Nota
          </button>
          
          <button
            onClick={onDeleteCurrentRepair}
            className="flex items-center gap-1.5 px-3.5 py-1.5 border border-outline text-on-surface text-xs font-semibold rounded hover:bg-slate-50 transition-colors cursor-pointer outline-none shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
            Eliminar Orden
          </button>
          
          <button
            onClick={onReprintCurrentRepair}
            className="flex items-center gap-1.5 px-3.5 py-1.5 border border-outline text-on-surface text-xs font-semibold rounded hover:bg-slate-50 transition-colors cursor-pointer outline-none shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            Reimprimir Comprobante
          </button>
          
          {/* Jump-to folio input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (folioInput.trim()) {
                onJumpToRepair(Number(folioInput));
                setFolioInput('');
              }
            }}
            className="contents"
          >
            <div className="flex items-center border border-outline rounded overflow-hidden h-8">
              <span className="text-[11px] font-bold font-sans text-on-surface-variant px-2 select-none">Folio</span>
              <input
                type="number"
                value={folioInput}
                onChange={(e) => setFolioInput(e.target.value)}
                placeholder={currentRepairId || '#'}
                className="w-14 h-full border-none outline-none text-xs font-sans font-semibold px-1 text-center"
                min="1"
              />
              <button
                type="submit"
                className="h-full px-1.5 bg-primary text-white text-[10px] font-bold font-sans hover:opacity-90 transition-all outline-none cursor-pointer flex items-center"
              >
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </button>
            </div>
          </form>

          <button
            onClick={onOpenServiciosModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-tertiary text-white text-xs font-semibold rounded hover:opacity-90 shadow-sm transition-all cursor-pointer outline-none shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">list_alt</span>
            Servicios
          </button>

          <button
            onClick={onClearRepairForm}
            className="flex items-center gap-1.5 px-3.5 py-1.5 border border-outline text-on-surface text-xs font-semibold rounded hover:bg-slate-50 transition-colors cursor-pointer outline-none shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">cleaning_services</span>
            Limpiar Pantalla
          </button>
        </div>
      ) : <div className="flex-1" />}

      {/* Brand Center text in Reports View as seen on Screen 5 */}
      {activeView === 'reports' && (
        <div className="flex-shrink-0 hidden lg:block select-none">
          <span className="text-xl font-black text-primary tracking-tight font-sans">Digicell</span>
        </div>
      )}

      {/* Trailing Actions & Profile */}
      <div className="flex items-center gap-4 ml-auto text-primary">

        
        <div className="h-6 w-px bg-outline-variant mx-1"></div>
        
        <div className="flex items-center gap-2.5 pl-3 border-l border-outline-variant select-none">
          <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center text-on-surface-variant font-semibold text-xs overflow-hidden">
            {user ? (
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTjFAcAaczH4adi75rr7NqkFHBwsdCPg6snooyjKT0m2g-272ktYn78181DDmICz-vBA1Akd6lwjM5BmNjKO9AK3S_Dmd7mzGylaXa1SSMwwvMtqqjvlX96T8JAywAICGQJ7FJXsRRNSs2SO_V7-m9QaWRz6VltULfR6PwZk6-whBOqT757cRBZNEnWMEIZgv98jV-pHHqIBBIF4XyemH0P8ukX2H2msBP_JpkkiKcwwynRul-2KUhjH7jVv8-dB1UC2Z0XuI6bMfE" 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="material-symbols-outlined text-[18px]">person</span>
            )}
          </div>
          <span className="font-sans text-xs font-semibold text-on-surface hidden md:block">
            {user || 'Invitado'}
          </span>
        </div>
      </div>
    </header>
  );
}
