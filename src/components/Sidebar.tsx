/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ActiveView } from '../types';

interface SidebarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  onCreateNewRepair: () => void;
  onLogout: () => void;
}

export default function Sidebar({
  activeView,
  onViewChange,
  onCreateNewRepair,
  onLogout
}: SidebarProps) {
  if (activeView === 'login') return null;

  const navItems = [
    { view: 'dashboard' as ActiveView, label: 'Panel', icon: 'dashboard' },
    { view: 'pos' as ActiveView, label: 'POS', icon: 'point_of_sale' },
    { view: 'repairs' as ActiveView, label: 'Reparaciones', icon: 'build' },
    { view: 'arqueo' as ActiveView, label: 'Arqueo', icon: 'account_balance' },
    { view: 'reports' as ActiveView, label: 'Reportes', icon: 'analytics' },
  ];

  return (
    <aside className="bg-white h-full w-64 fixed left-0 top-0 border-r border-outline-variant flex flex-col py-6 px-4 z-50 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm shadow-primary/20">
          <span className="material-symbols-outlined icon-fill text-[22px]">build</span>
        </div>
        <div>
          <h1 className="text-[20px] leading-tight font-headline-md font-bold text-primary tracking-tight">Digicell</h1>
          <p className="text-xs font-medium text-on-surface-variant font-sans tracking-wide">Sistema POS</p>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={onCreateNewRepair}
        className="w-full bg-primary hover:bg-primary-container text-white py-2.5 px-4 rounded-md font-sans text-sm font-semibold transition-colors duration-200 shadow-sm flex items-center justify-center gap-2 mb-6 outline-none hover:shadow-md cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        Nueva Reparación
      </button>

      {/* Navigation tabs */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = activeView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onViewChange(item.view)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 text-left cursor-pointer outline-none ${
                isActive
                  ? 'text-primary font-bold border-r-4 border-primary bg-surface-container-low scale-[0.98]'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low hover:scale-[0.98]'
              }`}
            >
              <span className={`material-symbols-outlined ${isActive ? 'icon-fill text-primary' : 'text-on-surface-variant'}`}>
                {item.icon}
              </span>
              <span className="text-sm font-sans font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Navigation */}
      <div className="mt-auto space-y-1 pt-4 border-t border-outline-variant">
        <button
          onClick={() => onViewChange('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 text-left cursor-pointer outline-none ${
            activeView === 'settings'
              ? 'text-primary font-bold border-r-4 border-primary bg-surface-container-low scale-[0.98]'
              : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low hover:scale-[0.98]'
          }`}
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="text-sm font-sans font-medium">Configuración</span>
        </button>
        
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-error hover:bg-error-container hover:text-on-error-container transition-all duration-200 text-left cursor-pointer outline-none hover:scale-[0.98]"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="text-sm font-sans font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
