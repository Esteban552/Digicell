/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ActiveView } from '../types';

interface DashboardViewProps {
  onViewChange: (view: ActiveView) => void;
  onLogout: () => void;
  totalsSalesVal: number;
  completedRepairsCount: number;
  urgentCount: number;
  inProgressCount: number;
}

export default function DashboardView({
  onViewChange,
  onLogout,
  totalsSalesVal,
  completedRepairsCount,
  urgentCount,
  inProgressCount
}: DashboardViewProps) {
  return (
    <div className="flex-1 flex flex-col gap-6">
      
      {/* Upper Brand Greetings */}
      <div className="select-none">
        <h2 className="text-3xl font-bold text-on-surface tracking-tight font-sans">
          Bienvenido de vuelta, Técnico.
        </h2>
        <p className="text-sm font-sans text-on-surface-variant mt-1.5 font-medium">
          ¿Qué te gustaría hacer hoy?
        </p>
      </div>

      {/* Bento Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Bento 1: Punto de Venta (Large/Featured spanning 2 columns in desktop) */}
        <button
          onClick={() => onViewChange('pos')}
          className="group text-left relative col-span-1 md:col-span-2 lg:col-span-2 bg-white border border-outline-variant rounded-xl p-8 overflow-hidden hover:border-tertiary transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between min-h-[220px] cursor-pointer outline-none select-none"
        >
          {/* Subtle Graphic circular overlay */}
          <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-tertiary-fixed to-transparent opacity-20 rounded-bl-full -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-110 duration-500"></div>
          
          <div>
            <div className="h-12 w-12 bg-tertiary-fixed rounded-lg flex items-center justify-center text-tertiary mb-6">
              <span className="material-symbols-outlined text-[28px] icon-fill">point_of_sale</span>
            </div>
            <h3 className="text-xl font-bold font-headline-md text-on-surface mb-2 group-hover:text-tertiary transition-colors">
              Punto de Venta
            </h3>
            <p className="text-xs font-sans text-on-surface-variant max-w-md leading-relaxed font-medium">
              Accede al registro de ventas para procesar ventas de accesorios, finalizar tickets de reparación y gestionar el flujo de caja diario.
            </p>
          </div>
          
          <div className="flex items-center text-tertiary font-sans text-xs font-bold mt-6 group-hover:translate-x-2 transition-transform duration-200">
            <span>Abrir Caja</span>
            <span className="material-symbols-outlined ml-1.5 text-[16px]">arrow_forward</span>
          </div>
        </button>

        {/* Bento 2: Reparaciones (Right side / 1 Column) */}
        <button
          onClick={() => onViewChange('repairs')}
          className="group text-left relative bg-white border border-outline-variant rounded-xl p-8 overflow-hidden hover:border-primary transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between min-h-[220px] cursor-pointer outline-none select-none"
        >
          {/* Circular color accent */}
          <div className="absolute right-0 top-0 w-48 h-48 bg-gradient-to-br from-primary-fixed to-transparent opacity-20 rounded-bl-full -mr-8 -mt-8 pointer-events-none transition-transform group-hover:scale-110 duration-500"></div>
          
          <div>
            <div className="h-12 w-12 bg-primary-fixed rounded-lg flex items-center justify-center text-primary mb-6">
              <span className="material-symbols-outlined text-[28px] icon-fill">build</span>
            </div>
            <h3 className="text-lg font-bold font-headline-sm text-on-surface mb-2 group-hover:text-primary transition-colors">
              Reparaciones
            </h3>
            <p className="text-xs font-sans text-on-surface-variant leading-relaxed font-medium">
              Ver tickets activos, actualizar estados de diagnóstico y registrar nuevos dispositivos u órdenes de recepción.
            </p>
          </div>
          
          <div className="mt-4 flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[9px] font-bold tracking-wider font-sans">
                {urgentCount} URGENTE
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant text-[9px] font-bold tracking-wider font-sans">
                {inProgressCount} EN PROGRESO
              </span>
            </div>
            <div className="flex items-center text-primary font-sans text-xs font-bold group-hover:translate-x-2 transition-transform duration-200">
              <span>Ver Tickets</span>
              <span className="material-symbols-outlined ml-1.5 text-[16px]">arrow_forward</span>
            </div>
          </div>
        </button>

        {/* Bento 3: Reportes (Bottom / Left) */}
        <button
          onClick={() => onViewChange('reports')}
          className="group text-left relative bg-white border border-outline-variant rounded-xl p-8 overflow-hidden hover:border-tertiary transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between min-h-[190px] cursor-pointer outline-none select-none"
        >
          <div>
            <div className="h-10 w-10 bg-surface-container-high rounded-lg flex items-center justify-center text-on-surface mb-6">
              <span className="material-symbols-outlined icon-fill text-[24px]">analytics</span>
            </div>
            <h3 className="text-lg font-bold font-headline-sm text-on-surface mb-2 group-hover:text-tertiary transition-colors">
              Reportes
            </h3>
            <p className="text-xs font-sans text-on-surface-variant leading-relaxed font-medium">
              Resúmenes de fin de día, contadores de inventario, auditorías de flujo de caja y análisis técnicos.
            </p>
          </div>
          
          <div className="flex items-center text-on-surface font-sans text-xs font-bold mt-4 group-hover:translate-x-2 transition-transform duration-200">
            <span>Generar Reporte</span>
            <span className="material-symbols-outlined ml-1.5 text-[16px]">arrow_forward</span>
          </div>
        </button>

        {/* Bento 4: Cerrar Sesión (Outlined / Dashed) */}
        <button
          onClick={onLogout}
          className="group relative bg-white border border-dashed border-slate-300 rounded-xl p-8 overflow-hidden hover:bg-error-container hover:border-error transition-all duration-300 flex items-center justify-center min-h-[190px] cursor-pointer outline-none select-none"
        >
          <div className="text-center">
            <div className="h-10 w-10 mx-auto bg-surface-container-highest rounded-full flex items-center justify-center text-on-surface-variant group-hover:bg-error group-hover:text-white mb-4 transition-colors">
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </div>
            <h3 className="text-sm font-semibold font-sans text-on-surface-variant group-hover:text-on-error-container transition-colors leading-normal">
              Cerrar Sesión
            </h3>
            <p className="text-[10px] text-slate-400 font-sans mt-1 leading-normal">
              Salir cuenta J. Cashier
            </p>
          </div>
        </button>

      </div>

      {/* Quick Stats Row (Optional High-Utility Area) */}
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        
        <div className="bg-white p-5 rounded-lg border border-outline-variant flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-sans font-bold text-on-surface-variant uppercase tracking-wider">
              Ventas del Día
            </p>
            <p className="text-lg font-bold text-on-surface font-sans leading-tight mt-1">
              ${totalsSalesVal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <span className="material-symbols-outlined text-tertiary opacity-40 text-[26px]">
            payments
          </span>
        </div>

        <div className="bg-white p-5 rounded-lg border border-outline-variant flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-sans font-bold text-on-surface-variant uppercase tracking-wider">
              Reparaciones Completadas
            </p>
            <p className="text-lg font-bold text-on-surface font-sans leading-tight mt-1">
              {completedRepairsCount}
            </p>
          </div>
          <span className="material-symbols-outlined text-primary opacity-40 text-[26px]">
            task_alt
          </span>
        </div>

      </div>

    </div>
  );
}
