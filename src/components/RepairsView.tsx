/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { RepairOrder, RepairStatus } from '../types';

const repairStatusLabels: Record<string, string> = {
  'in_review': 'En Revisión',
  'waiting_parts': 'Esperando Piezas',
  'repaired': 'Reparado',
  'delivered': 'Entregado'
};

interface RepairsViewProps {
  repairs: RepairOrder[];
  selectedId: string;
  onSetSelectedId: (id: string) => void;
  onUpdateRepair: (id: string, updated: Partial<RepairOrder>) => void;
  onSaveRepairOrder: (id: string) => void;
  showToast: (title: string, desc: string, type: 'success' | 'info' | 'error') => void;
  searchModalOpen: boolean;
  onSetSearchModalOpen: (open: boolean) => void;
}

export default function RepairsView({
  repairs,
  selectedId,
  onSetSelectedId,
  onUpdateRepair,
  onSaveRepairOrder,
  showToast,
  searchModalOpen,
  onSetSearchModalOpen
}: RepairsViewProps) {
  // Local modals
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Find active loaded repair
  const activeRepair = useMemo(() => {
    return repairs.find(r => r.id === selectedId) || repairs[0];
  }, [repairs, selectedId]);

  // Handle live calculation of remaining balance
  const remainingCalculated = useMemo(() => {
    if (!activeRepair) return 0;
    const cost = activeRepair.totalCost || 0;
    const paid = activeRepair.advancePaid || 0;
    return Math.max(0, cost - paid);
  }, [activeRepair]);

  // Search filter
  const filteredRepairsList = useMemo(() => {
    if (!searchQuery) return repairs;
    const q = searchQuery.toLowerCase();
    return repairs.filter(r => 
      r.id.includes(q) || 
      r.clientName.toLowerCase().includes(q) || 
      (r.deviceBrand + ' ' + r.deviceModel).toLowerCase().includes(q)
    );
  }, [repairs, searchQuery]);

  if (!activeRepair) {
    return (
      <div className="p-8 text-center bg-white border border-outline-variant rounded-md shadow-sm select-none font-sans">
        <p className="text-on-surface-variant font-medium">Ninguna orden cargada. Presiona "+ Nueva Reparación" en la barra lateral para iniciar.</p>
      </div>
    );
  }

  // Trigger simulated whatsapp URL
  const triggerWhatsApp = () => {
    const phoneClean = activeRepair.clientPhone.replace(/\D/g, '');
    const textMsg = encodeURIComponent(
      `Hola ${activeRepair.clientName}, de parte de Digicell Repairs. Su dispositivo ${activeRepair.deviceBrand} ${activeRepair.deviceModel} (Folio #${activeRepair.id}) está registrado bajo el estado: "${activeRepair.status.toUpperCase()}". Costo estimado: $${activeRepair.totalCost.toFixed(2)}, Anticipo: $${activeRepair.advancePaid.toFixed(2)}. Saldo pendiente: $${remainingCalculated.toFixed(2)}.`
    );
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneClean || '5550000000'}&text=${textMsg}`;
    
    showToast('WhatsApp Preparado', 'Simulando apertura de chat con plantilla de entrega.', 'success');
    window.open(whatsappUrl, '_blank', 'noreferrer');
  };

  const handleUpdateField = (key: keyof RepairOrder, value: any) => {
    onUpdateRepair(activeRepair.id, { [key]: value });
  };

  return (
    <div className="flex-1 flex flex-col gap-6 font-sans">
      
      <div className="select-none mb-2">
        <h2 className="text-2xl font-bold text-on-surface font-sans tracking-tight">
          Formulario de Recepción
        </h2>
        <p className="text-[11px] font-semibold text-on-surface-variant tracking-wider uppercase mt-1 font-sans">
          Cargado actualmente: Folio #{activeRepair.id} — {activeRepair.clientName || 'Cliente sin nombre'}
        </p>
      </div>

      {/* Grid core layout: Left Forms (span 8), Right Side metadata controls (span 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (Span 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Section: Customer Details */}
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
                    value={activeRepair.clientPhone}
                    onChange={(e) => handleUpdateField('clientPhone', e.target.value)}
                    placeholder="(555) 000-0000"
                    className="h-10 w-full pl-9 pr-3 border border-outline-variant rounded bg-white text-xs text-on-surface focus:border-tertiary outline-none transition-all font-sans"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant font-sans">Nombre Completo</label>
                <input
                  type="text"
                  value={activeRepair.clientName}
                  onChange={(e) => handleUpdateField('clientName', e.target.value)}
                    placeholder="Juan Pérez"
                  className="h-10 w-full px-3 border border-outline-variant rounded bg-white text-xs text-on-surface focus:border-tertiary outline-none transition-all font-sans font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant font-sans">Correo Electrónico</label>
                <input
                  type="email"
                  value={activeRepair.clientEmail}
                  onChange={(e) => handleUpdateField('clientEmail', e.target.value)}
                  placeholder="cliente@correo.com"
                  className="h-10 w-full px-3 border border-outline-variant rounded bg-white text-xs text-on-surface focus:border-tertiary outline-none transition-all font-sans"
                />
              </div>
            </div>
          </div>

          {/* Section: Device Information */}
          <div className="bg-white border border-outline-variant rounded-md p-5 select-none hover:shadow-sm transition-all shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
            <h3 className="text-sm font-bold text-on-surface border-b border-outline-variant/60 pb-3 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">smartphone</span>
              Información del Dispositivo
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant font-sans">Marca</label>
                <select
                  value={activeRepair.deviceBrand}
                  onChange={(e) => handleUpdateField('deviceBrand', e.target.value)}
                  className="h-10 w-full px-2.5 border border-outline-variant rounded bg-white text-xs text-on-surface focus:border-tertiary outline-none font-sans cursor-pointer"
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
                <label className="text-[11px] font-bold text-on-surface-variant font-sans">Modelo</label>
                <input
                  type="text"
                  value={activeRepair.deviceModel}
                  onChange={(e) => handleUpdateField('deviceModel', e.target.value)}
                  placeholder="Ej: iPhone 13 Pro"
                  className="h-10 w-full px-3 border border-outline-variant rounded bg-white text-xs text-on-surface focus:border-tertiary outline-none font-sans font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant font-sans">IMEI / Serial</label>
                <input
                  type="text"
                  value={activeRepair.deviceSerial}
                  onChange={(e) => handleUpdateField('deviceSerial', e.target.value)}
                  placeholder="15 Digits"
                  className="h-10 w-full px-3 border border-outline-variant rounded bg-white text-xs text-on-surface font-mono focus:border-tertiary outline-none font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant font-sans">Contraseña/PIN</label>
                <input
                  type="text"
                  value={activeRepair.devicePassword}
                  onChange={(e) => handleUpdateField('devicePassword', e.target.value)}
                  placeholder="PIN/Patrón"
                  className="h-10 w-full px-3 border border-outline-variant rounded bg-white text-xs text-on-surface focus:border-tertiary outline-none font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant font-sans">Color</label>
                <input
                  type="text"
                  value={activeRepair.deviceColor}
                  onChange={(e) => handleUpdateField('deviceColor', e.target.value)}
                  placeholder="Ej: Graphite / Space Grey"
                  className="h-10 w-full px-3 border border-outline-variant rounded bg-white text-xs text-on-surface focus:border-tertiary outline-none font-sans"
                />
              </div>
            </div>
          </div>

          {/* Section: Intake Checklist */}
          <div className="bg-white border border-outline-variant rounded-md p-5 select-none hover:shadow-sm transition-all shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
            <h3 className="text-sm font-bold text-on-surface border-b border-outline-variant/60 pb-3 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">fact_check</span>
              Lista de Recepción
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant font-sans">¿Enciende?</label>
                <select
                  value={activeRepair.powersOn}
                  onChange={(e) => handleUpdateField('powersOn', e.target.value)}
                  className="h-10 w-full px-2.5 border border-outline-variant rounded bg-white text-xs text-on-surface focus:border-tertiary outline-none font-sans cursor-pointer font-semibold"
                >
                  <option value="Yes">Sí</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant font-sans">Batería %</label>
                <input
                  type="text"
                  value={activeRepair.batteryPercent}
                  onChange={(e) => handleUpdateField('batteryPercent', e.target.value)}
                  placeholder="0-100"
                  className="h-10 w-full px-3 border border-outline-variant rounded bg-white text-xs text-on-surface focus:border-tertiary outline-none font-sans"
                />
              </div>

              <div className="flex items-center h-10 select-none pb-1 font-sans">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeRepair.chargerLeft}
                    onChange={(e) => handleUpdateField('chargerLeft', e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-outline-variant text-primary focus:ring-0 accent-primary cursor-pointer border"
                  />
                  <span className="text-xs font-semibold text-on-surface font-sans">¿Cargador Incluido?</span>
                </label>
              </div>

              <div className="flex items-center h-10 select-none pb-1 font-sans">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeRepair.coverLeft}
                    onChange={(e) => handleUpdateField('coverLeft', e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-outline-variant text-primary focus:ring-0 accent-primary cursor-pointer border"
                  />
                  <span className="text-xs font-semibold text-on-surface font-sans">¿Funda Incluida?</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section: Service Details (textareas) */}
          <div className="bg-white border border-outline-variant rounded-md p-5 select-none hover:shadow-sm transition-all shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
            <h3 className="text-sm font-bold text-on-surface border-b border-outline-variant/60 pb-3 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">description</span>
              Detalles del Servicio
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant font-sans">
                  Condiciones de Recepción
                </label>
                <textarea
                  value={activeRepair.receivingCondition}
                  onChange={(e) => handleUpdateField('receivingCondition', e.target.value)}
                  placeholder="Detalle de condiciones físicas..."
                  className="w-full border border-outline-variant rounded bg-white text-xs text-on-surface p-3 h-24 focus:border-tertiary outline-none resize-none leading-relaxed font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant font-sans">
                  Detalle del Problema Reportado
                </label>
                <textarea
                  value={activeRepair.problemReported}
                  onChange={(e) => handleUpdateField('problemReported', e.target.value)}
                  placeholder="Detalle de la falla y trabajo requerido..."
                  className="w-full border border-outline-variant rounded bg-white text-xs text-on-surface p-3 h-24 focus:border-tertiary outline-none resize-none leading-relaxed font-sans font-medium"
                />
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Section: Management status dropdowns */}
          <div className="bg-white border border-outline-variant rounded-md p-5 select-none hover:shadow-sm transition-all shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
            <h3 className="text-sm font-bold text-on-surface border-b border-outline-variant/60 pb-3 mb-4 flex items-center gap-2 flex-wrap">
              <span className="material-symbols-outlined text-primary text-[20px]">manage_history</span>
              Estado de la Orden
            </h3>
            <div className="space-y-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant font-sans">Estado</label>
                <select
                  value={activeRepair.status}
                  onChange={(e) => handleUpdateField('status', e.target.value as RepairStatus)}
                  className="h-10 w-full px-2.5 border border-outline-variant rounded bg-white text-xs font-bold text-primary focus:border-tertiary outline-none cursor-pointer font-sans"
                >
                  <option value="in_review">En Revisión</option>
                  <option value="waiting_parts">Esperando Piezas</option>
                  <option value="repaired">Reparado</option>
                  <option value="delivered">Entregado</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant font-sans">Técnico Asignado</label>
                <select
                  value={activeRepair.technician}
                  onChange={(e) => handleUpdateField('technician', e.target.value)}
                  className="h-10 w-full px-2.5 border border-outline-variant rounded bg-white text-xs text-on-surface focus:border-tertiary outline-none cursor-pointer font-sans font-medium"
                >
                  <option value="Unassigned">Sin Asignar</option>
                  <option value="Tech Alex">Tech Alex</option>
                  <option value="Tech Maria">Tech Maria</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant font-sans">Fecha de Entrega</label>
                <input
                  type="date"
                  value={activeRepair.deliveryDate}
                  onChange={(e) => handleUpdateField('deliveryDate', e.target.value)}
                  className="h-10 w-full px-3 border border-outline-variant rounded bg-white text-xs font-medium text-on-surface focus:border-tertiary outline-none font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant font-sans">Fin de Garantía</label>
                <input
                  type="date"
                  value={activeRepair.warrantyEnd}
                  onChange={(e) => handleUpdateField('warrantyEnd', e.target.value)}
                  className="h-10 w-full px-3 border border-outline-variant rounded bg-white text-xs text-on-surface focus:border-tertiary outline-none font-sans"
                />
              </div>

            </div>
          </div>

          {/* Section: Financial cost metrics logs */}
          <div className="bg-white border border-outline-variant rounded-md p-5 select-none hover:shadow-sm transition-all shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
            <h3 className="text-sm font-bold text-on-surface border-b border-outline-variant/60 pb-3 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">payments</span>
              Finanzas
            </h3>
            <div className="space-y-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant font-sans">Costo Total ($)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-sans text-on-surface-variant">$</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={activeRepair.totalCost === 0 ? '' : activeRepair.totalCost}
                    onChange={(e) => {
                      const costVal = Math.max(0, Number(e.target.value) || 0);
                      onUpdateRepair(activeRepair.id, {
                        totalCost: costVal,
                        remainingBalance: Math.max(0, costVal - activeRepair.advancePaid)
                      });
                    }}
                    className="h-10 w-full pl-6 pr-3 border border-outline-variant rounded bg-[#ffffff] text-right text-xs font-mono font-medium focus:border-tertiary outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant font-sans">Anticipo ($)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-sans text-on-surface-variant">$</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={activeRepair.advancePaid === 0 ? '' : activeRepair.advancePaid}
                    onChange={(e) => {
                      const advVal = Math.max(0, Number(e.target.value) || 0);
                      onUpdateRepair(activeRepair.id, {
                        advancePaid: advVal,
                        remainingBalance: Math.max(0, activeRepair.totalCost - advVal)
                      });
                    }}
                    className="h-10 w-full pl-6 pr-3 border border-outline-variant rounded bg-[#ffffff] text-right text-xs font-mono font-bold text-primary focus:border-tertiary outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center select-none font-sans font-medium text-xs text-on-surface-variant">
                <span>Saldo Pendiente:</span>
                <span className="font-mono font-bold text-base text-on-surface">
                  ${remainingCalculated.toFixed(2)}
                </span>
              </div>

            </div>
          </div>

          {/* Section: Action Triggers & Note Footnotes */}
          <div className="flex flex-col gap-4">
            
            <button
              onClick={triggerWhatsApp}
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-sans text-xs font-bold py-3 px-4 rounded-md transition-colors shadow-sm shadow-[#25D366]/10 outline-none cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current select-none" viewBox="0 0 24 24">
                <path d="M12.031 0C5.385 0 .002 5.385.002 12.031c0 2.124.553 4.195 1.603 6.012L.002 24l6.115-1.605c1.761.968 3.753 1.481 5.912 1.481 6.646 0 12.029-5.385 12.029-12.031S18.677 0 12.031 0zm0 21.84c-1.802 0-3.565-.483-5.112-1.4l-.367-.217-3.799.996.996-3.704-.239-.38C2.553 15.534 2.034 13.805 2.034 12.031c0-5.524 4.496-10.02 10.02-10.02 5.524 0 10.02 4.496 10.02 10.02 0 5.524-4.496 10.02-10.02 10.02zm5.503-7.519c-.302-.151-1.782-.879-2.059-.979-.277-.1-.478-.151-.679.151-.201.302-.779.979-.955 1.18-.176.201-.352.226-.654.075-2.022-1.01-3.415-2.827-3.83-3.551-.237-.417-.037-.629.112-.779.123-.124.277-.302.415-.453.139-.151.185-.252.277-.415.093-.163.046-.314-.029-.465-.075-.151-.679-1.636-.929-2.241-.242-.588-.488-.508-.679-.517-.176-.008-.377-.008-.578-.008-.201 0-.528.075-.805.377-.277.302-1.056 1.032-1.056 2.518 0 1.486 1.082 2.923 1.233 3.125.151.201 2.131 3.253 5.163 4.56.723.311 1.286.497 1.724.636.726.231 1.387.198 1.91.12.585-.088 1.782-.729 2.034-1.433.252-.704.252-1.308.176-1.433-.075-.125-.277-.2-.578-.352z" />
              </svg>
              Enviar por WhatsApp
            </button>

            <div className="flex flex-col gap-1.5 select-none font-sans">
              <label className="text-[11px] font-bold text-on-surface-variant font-sans flex justify-between">
                <span>Nota del Ticket</span>
                <span className="text-slate-400 font-semibold">{activeRepair.footnote?.length || 0}/150</span>
              </label>
              <textarea
                maxLength={150}
                value={activeRepair.footnote}
                onChange={(e) => handleUpdateField('footnote', e.target.value)}
                placeholder="Ej: 30 días de garantía en piezas reemplazadas."
                className="w-full border border-outline-variant rounded bg-[#ffffff] text-xs p-2.5 h-16 focus:border-tertiary outline-none resize-none leading-relaxed font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2 pt-4 border-t border-outline-variant/60">
              <button
                type="button"
                onClick={() => setPrintModalOpen(true)}
                className="w-full bg-white border border-outline text-on-surface text-xs font-bold py-2.5 rounded hover:bg-slate-50 transition-colors cursor-pointer outline-none"
              >
                Vista Previa
              </button>
              
              <button
                type="button"
                onClick={() => onSaveRepairOrder(activeRepair.id)}
                className="w-full bg-primary hover:bg-primary-container text-white text-xs font-bold py-2.5 rounded transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer outline-none"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                Guardar Nota
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* ================= MODAL: QUICK SEARCH ORDER (F8) ================= */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-outline-variant w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden">
            
            <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center select-none font-sans">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">search</span>
                Búsqueda Rápida de Órdenes
              </h3>
              <button 
                onClick={() => onSetSearchModalOpen(false)}
                className="text-on-surface-variant hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4 font-sans text-xs">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px]">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por cliente, marca, modelo o folio..."
                  className="w-full h-11 pl-10 pr-4 mt-1 border border-outline-variant rounded bg-[#ffffff] text-sm focus:border-tertiary outline-none"
                />
              </div>

              {/* Autocomplete previous records table list */}
              <div className="border border-outline-variant rounded-md overflow-hidden max-h-[250px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#ffffff] sticky top-0 border-b border-outline-variant/60 z-10 font-sans">
                    <tr>
                      <th className="p-2.5 text-[11px] font-bold text-on-surface-variant uppercase bg-slate-50">Folio</th>
                      <th className="p-2.5 text-[11px] font-bold text-on-surface-variant uppercase bg-slate-50">Cliente</th>
                      <th className="p-2.5 text-[11px] font-bold text-on-surface-variant uppercase bg-slate-50">Dispositivo</th>
                      <th className="p-2.5 text-[11px] font-bold text-on-surface-variant uppercase bg-slate-50 text-right">Saldo Pend.</th>
                      <th className="p-2.5 text-[11px] font-bold text-on-surface-variant uppercase bg-slate-50 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-sans">
                    {filteredRepairsList.map(r => (
                      <tr
                        key={r.id}
                        onClick={() => {
                          onSetSelectedId(r.id);
                          onSetSearchModalOpen(false);
                          setSearchQuery('');
                        }}
                        className="hover:bg-slate-100 cursor-pointer border-b border-slate-100 last:border-0 transition-all font-medium"
                      >
                        <td className="p-2.5 font-mono text-primary font-bold">#{r.id}</td>
                        <td className="p-2.5 font-semibold text-on-surface">{r.clientName || 'Sin nombre'}</td>
                        <td className="p-2.5">{r.deviceBrand} {r.deviceModel}</td>
                        <td className="p-2.5 text-right font-mono">${(r.totalCost - r.advancePaid).toFixed(2)}</td>
                        <td className="p-2.5 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            r.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                            r.status === 'repaired' ? 'bg-blue-100 text-blue-800' :
                            r.status === 'waiting_parts' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {repairStatusLabels[r.status] || r.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredRepairsList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400 font-sans font-medium">
                          No se encontraron órdenes.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL: THERMAL PRINT TICKET PREVIEW ================= */}
      {printModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-outline-variant w-full max-w-sm shadow-2xl flex flex-col overflow-hidden">
            
            <div className="px-5 py-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center select-none">
              <h3 className="text-sm font-bold text-on-surface font-sans">Vista Previa de Impresión</h3>
              <button 
                onClick={() => setPrintModalOpen(false)}
                className="text-on-surface-variant hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Simulated 58mm Thermal Receipt strip paper */}
            <div className="p-6 bg-slate-100 flex justify-center items-center h-[350px] overflow-y-auto">
              <div id="receipt-thermal" className="bg-white text-black w-[240px] p-4 font-mono text-[11px] leading-tight shadow-md border border-slate-300 select-none">
                
                <div className="text-center font-bold text-sm tracking-wide mb-1">DIGICELL REPAIRS</div>
                <div className="text-center text-[10px] mb-3 border-b border-dashed border-slate-400 pb-2">
                  123 Tech Street, Downtown<br />
                  Tel: (555) 123-4567
                </div>

                <div className="mb-2.5">
                  Folio: #{activeRepair.id}<br />
                  Fecha: {new Date(activeRepair.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                </div>

                <div className="border-t border-b border-dashed border-slate-400 py-2 mb-3 space-y-1">
                  <strong>Cliente:</strong> {activeRepair.clientName || 'N/A'}<br />
                  <strong>Teléfono:</strong> {activeRepair.clientPhone || 'N/A'}<br />
                  <strong>Equipo:</strong> {activeRepair.deviceBrand} {activeRepair.deviceModel}<br />
                  <strong>IMEI/SN:</strong> {activeRepair.deviceSerial ? `***${activeRepair.deviceSerial.slice(-4)}` : 'N/A'}<br />
                  <strong className="block mt-1">Falla: {activeRepair.problemReported || 'Mantenimiento de reparación'}</strong>
                </div>

                <div className="flex justify-between mb-1">
                  <span>Costo Est.:</span>
                  <span>${activeRepair.totalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Anticipo:</span>
                  <span>${activeRepair.advancePaid.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between font-bold mt-2.5 pt-2 border-t border-solid border-slate-400 text-sm">
                  <span>TOTAL A PAGAR:</span>
                  <span>${remainingCalculated.toFixed(2)}</span>
                </div>

                {/* Footer terms */}
                <div className="text-center text-[8px] leading-relaxed text-slate-500 mt-5 pt-2 border-t border-dashed border-slate-400">
                  {activeRepair.footnote || 'Garantía estándar de 30 días.'}
                </div>

                {/* Simulated barcode */}
                <div className="text-center mt-4">
                  <div className="flex justify-center items-center h-8 gap-[1px] bg-black max-w-[120px] mx-auto select-none opacity-90">
                    {[2,1,3,1,4,2,1,3,2,4,1,3,1,1,2,3,4,1,2].map((num, i) => (
                      <div 
                        key={i} 
                        style={{ width: `${num}px` }} 
                        className="h-full bg-black/0 first:bg-black even:bg-black filter invert"
                      />
                    ))}
                  </div>
                  <div className="text-[9px] mt-1 tracking-widest text-slate-600 font-sans">
                    {activeRepair.id}
                  </div>
                </div>

              </div>
            </div>

            <div className="p-4 border-t border-outline-variant bg-surface-container flex justify-end gap-3 select-none">
              <button 
                onClick={() => setPrintModalOpen(false)}
                className="px-4.5 h-10 border border-outline text-on-surface text-xs font-semibold rounded bg-white hover:bg-slate-50 transition-colors"
              >
                Cerrar
              </button>
              <button 
                onClick={() => {
                  setPrintModalOpen(false);
                  showToast('Comprobante enviado', `Simulando impresión térmica en folio #${activeRepair.id}.`, 'success');
                }}
                className="px-4.5 h-10 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded shadow-sm flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                Imprimir (F8)
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
