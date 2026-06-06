/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ActiveView } from '../types';

interface HeaderProps {
  activeView: ActiveView;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  user: string | null;
  onOpenSearchModal: () => void;
  onCreateNewRepair: () => void;
  onDeleteCurrentRepair: () => void;
  onReprintCurrentRepair: () => void;
  onClearRepairForm: () => void;
}

export default function Header({
  activeView,
  searchQuery,
  onSearchQueryChange,
  user,
  onOpenSearchModal,
  onCreateNewRepair,
  onDeleteCurrentRepair,
  onReprintCurrentRepair,
  onClearRepairForm
}: HeaderProps) {
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
            Reimprimir Receipt
          </button>
          
          <button
            onClick={onClearRepairForm}
            className="flex items-center gap-1.5 px-3.5 py-1.5 border border-outline text-on-surface text-xs font-semibold rounded hover:bg-slate-50 transition-colors cursor-pointer outline-none shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">cleaning_services</span>
            Limpiar Pantalla
          </button>
        </div>
      ) : (
        <div className="flex-1 max-w-md">
          <div className="relative flex items-center w-full h-10 rounded-md bg-surface-container-low border border-outline-variant focus-within:border-tertiary focus-within:bg-white focus-within:ring-1 focus-within:ring-tertiary transition-all">
            <span className="material-symbols-outlined text-on-surface-variant ml-3 absolute pointer-events-none select-none text-[20px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onClick={() => {
                if (activeView === 'reports') {
                  // Keep normal input
                } else if (activeView === 'dashboard') {
                  // Maybe focus
                }
              }}
              placeholder={
                activeView === 'pos'
                  ? "Search products..."
                  : activeView === 'reports'
                  ? "Search transaction or description..."
                  : "Search repairs, model, customer..."
              }
              className="w-full h-full pl-10 pr-4 bg-transparent border-none text-sm text-on-surface focus:outline-none focus:ring-0 placeholder-on-surface-variant font-sans"
            />
            {searchQuery && (
              <button 
                onClick={() => onSearchQueryChange('')}
                className="absolute right-3 text-slate-400 hover:text-slate-600 outline-none"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Brand Center text in Reports View as seen on Screen 5 */}
      {activeView === 'reports' && (
        <div className="flex-shrink-0 hidden lg:block select-none">
          <span className="text-xl font-black text-primary tracking-tight font-sans">Digicell</span>
        </div>
      )}

      {/* Trailing Actions & Profile */}
      <div className="flex items-center gap-4 ml-auto text-primary">
        {/* Quick Search trigger F8 button for other views */}
        {activeView !== 'repairs' && (
          <button 
            onClick={onOpenSearchModal}
            className="text-on-surface-variant hover:bg-surface-variant p-2 rounded-full transition-all duration-200 flex items-center justify-center outline-none cursor-pointer"
            title="Abrir búsqueda rápida (F8)"
          >
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>
        )}

        <div className="flex gap-1.5">
          <button className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors flex items-center justify-center select-none cursor-pointer outline-none">
            <span className="material-symbols-outlined text-[20px]">wifi</span>
          </button>
          <button className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors flex items-center justify-center select-none cursor-pointer outline-none">
            <span className="material-symbols-outlined text-[20px]">schedule</span>
          </button>
        </div>
        
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
