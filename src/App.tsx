/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';

// Modular View Imports
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import POSView from './components/POSView';
import RepairsView from './components/RepairsView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import ArqueoCaja from './components/ArqueoCaja';
import Toast from './components/Toast';

// Data & Types Imports
import { INITIAL_CART } from './data';
import { supabase } from './lib/supabase';
import { useRepairOrders } from './hooks/useRepairOrders';
import { useCashMovements } from './hooks/useCashMovements';
import { useActivityLogs } from './hooks/useActivityLogs';
import { useSettings } from './hooks/useSettings';
import { useProducts } from './hooks/useProducts';
import { ActiveView, RepairOrder, CartItem } from './types';

const DRAFT_ID = 'draft';

function blankRepair(): RepairOrder {
  const today = new Date().toISOString().split('T')[0];
  return {
    id: DRAFT_ID,
    clientName: '', clientPhone: '', clientEmail: '',
    deviceBrand: 'Apple', deviceModel: '', deviceSerial: '',
    devicePassword: '', deviceColor: '', powersOn: 'Yes',
    batteryPercent: '', chargerLeft: false, coverLeft: false,
    receivingCondition: '', problemReported: '', internalNotes: '',
    status: 'in_review',
    technician: 'Unassigned', deliveryDate: today,
    warrantyEnd: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    totalCost: 0, advancePaid: 0, abonosPaid: 0, remainingBalance: 0,
    footnote: 'Garantía de 30 días en piezas reemplazadas. No nos hacemos responsables por equipos olvidados después de 60 días.',
    createdAt: new Date().toISOString(),
  };
}

export default function App() {
  // Supabase Auth session
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        setAuthLoading(false);
      }
    }, 4000);

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!settled) setSession(session);
      })
      .catch(() => {
        if (!settled) setSession(null);
      })
      .finally(() => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          setAuthLoading(false);
        }
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      settled = true;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const userName = session?.user?.user_metadata?.display_name ?? session?.user?.email?.split('@')[0] ?? 'Invitado';
  const userId = session?.user?.id ?? null;

  // Active navigation view state
  const [currentView, setCurrentView] = useState<ActiveView>('dashboard');

  // Navigate based on auth state
  useEffect(() => {
    if (authLoading) return;
    setCurrentView(session ? 'dashboard' : 'login');
  }, [session, authLoading]);

  // Shared application "database" states
  const {
    data: dbRepairs,
    loading: repairsLoading,
    create: createRepairInDb,
    update: syncRepairToDb,
    remove: removeRepairFromDb,
    refetch: refetchRepairs,
  } = useRepairOrders();

  // Local mirror for instant form editing — syncs from DB on load
  const [repairs, setRepairs] = useState<RepairOrder[]>([]);
  useEffect(() => {
    if (!repairsLoading) setRepairs(dbRepairs);
  }, [dbRepairs, repairsLoading]);

  const { data: logs, refetch: refetchLogs } = useActivityLogs();
  const { data: cashMovements, add: addCashMovement } = useCashMovements();
  const { data: settings, update: updateSetting } = useSettings();
  const { data: products, refetch: refetchProducts } = useProducts();
  const [cart, setCart] = useState<CartItem[]>(INITIAL_CART);

  // Draft repair for new notes (not yet saved to DB)
  const [draftRepair, setDraftRepair] = useState<RepairOrder>(blankRepair);

  // Active loaded repair inside Order Intake Form
  const [selectedRepairId, setSelectedRepairId] = useState<string>('');
  // Set initial selected repair from DB data once loaded
  useEffect(() => {
    if (repairs.length > 0 && !selectedRepairId) {
      setSelectedRepairId(repairs[0].id);
    }
  }, [repairs, selectedRepairId]);

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [serviciosModalOpen, setServiciosModalOpen] = useState(false);

  // Global Toast notification state
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    desc: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  // Helper trigger to flash notification
  const showToast = useCallback((title: string, desc: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage({ title, desc, type });
  }, []);

  // Global Keyboard listener shortcuts (F5 for Checkout, F8 for Search)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (!session) return;
      
      if (e.key === 'F8') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
        showToast('Búsqueda Rápida', 'Toggle de pantalla de órdenes activa (F8).', 'info');
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [session, showToast]);

  // Log out user
  const handleLogout = async () => {
    if (confirm('¿Seguro que deseas salir y cerrar sesión?')) {
      await supabase.auth.signOut();
      setCart([]);
      showToast('Sesión Cerrada', 'Has desconectado de la terminal actual con éxito.', 'info');
    }
  };

  // Create a brand new vacant repair order (local draft, no DB insert yet)
  const handleCreateNewRepair = () => {
    setDraftRepair(blankRepair());
    setSelectedRepairId(DRAFT_ID);
    setCurrentView('repairs');
    showToast('Nueva Nota', 'Completá los datos y guardá para asignar el folio.', 'info');
  };

  // Handle updates inside repair forms (local-only for instant response)
  const handleUpdateRepair = (id: string, updatedFields: Partial<RepairOrder>) => {
    if (id === DRAFT_ID) {
      setDraftRepair(prev => ({ ...prev, ...updatedFields }));
    } else {
      setRepairs(prev => prev.map(r => r.id === id ? { ...r, ...updatedFields } : r));
    }
  };

  // Finalize/Save the repair order, syncing to Supabase
  const handleSaveRepairOrder = async (id: string) => {
    // Resolve the repair data (draft or existing)
    let orderRef = id === DRAFT_ID ? draftRepair : repairs.find(r => r.id === id);
    if (!orderRef) return;

    // When saving with 'delivered' status, auto-assign warranty to 30 days
    if (orderRef.status === 'delivered') {
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      if (id === DRAFT_ID) {
        setDraftRepair(prev => ({ ...prev, warrantyEnd: thirtyDaysFromNow }));
      } else {
        setRepairs(prev => prev.map(r => r.id === id ? { ...r, warrantyEnd: thirtyDaysFromNow } : r));
      }
      orderRef = { ...orderRef, warrantyEnd: thirtyDaysFromNow };
    }

    // Validations
    const errors: string[] = [];
    if (!orderRef.clientName?.trim()) errors.push('El nombre del cliente es obligatorio.');
    if (orderRef.clientPhone && !/^\d{10}$/.test(orderRef.clientPhone.replace(/\D/g, ''))) errors.push('El teléfono debe tener 10 dígitos.');
    if (orderRef.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderRef.clientEmail)) errors.push('El correo electrónico no es válido.');
    if (orderRef.totalCost < 0) errors.push('El costo total no puede ser negativo.');
    if (orderRef.advancePaid < 0) errors.push('El anticipo no puede ser negativo.');
    if (orderRef.advancePaid > orderRef.totalCost) errors.push('El anticipo no puede superar el costo total.');
    if (orderRef.abonosPaid < 0) errors.push('Los abonos no pueden ser negativos.');
    if ((orderRef.abonosPaid || 0) + orderRef.advancePaid > orderRef.totalCost) errors.push('La suma de anticipo + abonos no puede superar el costo total.');
    if (orderRef.totalCost > 0 && !orderRef.deviceModel?.trim()) errors.push('Si hay costo, indicá el modelo del equipo.');
    if (!orderRef.deliveryDate?.trim()) errors.push('La fecha de entrega es obligatoria.');
    if (!orderRef.warrantyEnd?.trim()) errors.push('La fecha de fin de garantía es obligatoria.');
    if (!orderRef.problemReported?.trim()) errors.push('El detalle del problema es obligatorio.');

    if (errors.length > 0) {
      showToast('Corregí los errores', errors.join(' '), 'error');
      return;
    }

    if (id === DRAFT_ID) {
      // Insert new repair into DB
      const { data: { user } } = await supabase.auth.getUser();
      const payload: Record<string, unknown> = {
        client_name: draftRepair.clientName,
        client_phone: draftRepair.clientPhone,
        client_email: draftRepair.clientEmail,
        device_brand: draftRepair.deviceBrand,
        device_model: draftRepair.deviceModel,
        device_serial: draftRepair.deviceSerial,
        device_password: draftRepair.devicePassword,
        device_color: draftRepair.deviceColor,
        powers_on: draftRepair.powersOn,
        battery_percent: draftRepair.batteryPercent,
        charger_left: draftRepair.chargerLeft,
        cover_left: draftRepair.coverLeft,
        receiving_condition: draftRepair.receivingCondition,
        problem_reported: draftRepair.problemReported,
        internal_notes: draftRepair.internalNotes,
        status: draftRepair.status,
        technician: draftRepair.technician,
        delivery_date: draftRepair.deliveryDate,
        warranty_end: orderRef.warrantyEnd,
        total_cost: draftRepair.totalCost,
        advance_paid: draftRepair.advancePaid,
        abonos_paid: draftRepair.abonosPaid,
        footnote: draftRepair.footnote,
        created_by: user?.id ?? null,
      };
      const { data: row, error: err } = await supabase
        .from('repair_orders')
        .insert(payload)
        .select()
        .single();

      if (err || !row) {
        showToast('Error', 'No se pudo guardar la orden.', 'error');
        return;
      }

      const newRepair: RepairOrder = {
        id: String(row.id),
        clientName: draftRepair.clientName,
        clientPhone: draftRepair.clientPhone,
        clientEmail: draftRepair.clientEmail,
        deviceBrand: draftRepair.deviceBrand,
        deviceModel: draftRepair.deviceModel,
        deviceSerial: draftRepair.deviceSerial,
        devicePassword: draftRepair.devicePassword,
        deviceColor: draftRepair.deviceColor,
        powersOn: draftRepair.powersOn,
        batteryPercent: draftRepair.batteryPercent,
        chargerLeft: draftRepair.chargerLeft,
        coverLeft: draftRepair.coverLeft,
        receivingCondition: draftRepair.receivingCondition,
        problemReported: draftRepair.problemReported,
        internalNotes: draftRepair.internalNotes,
        status: draftRepair.status,
        technician: draftRepair.technician,
        deliveryDate: draftRepair.deliveryDate,
        warrantyEnd: draftRepair.warrantyEnd,
        totalCost: draftRepair.totalCost,
        advancePaid: draftRepair.advancePaid,
        abonosPaid: draftRepair.abonosPaid,
        remainingBalance: Math.max(0, draftRepair.totalCost - draftRepair.advancePaid - draftRepair.abonosPaid),
        footnote: draftRepair.footnote,
        createdAt: row.created_at,
      };

      setRepairs(prev => [newRepair, ...prev]);
      setSelectedRepairId(newRepair.id);
      refetchLogs();
      showToast('Nota Guardada', `Folio #${newRepair.id} asignado correctamente.`, 'success');
    } else {
      // Update existing repair
      await syncRepairToDb(id, orderRef);
      refetchLogs();
      showToast('Nota Actualizada', `Orden #${orderRef.id} guardada correctamente.`, 'success');
    }
  };

  // Perform delete on selected repair
  const handleDeleteCurrentRepair = async () => {
    if (selectedRepairId === DRAFT_ID) {
      setDraftRepair(blankRepair());
      setSelectedRepairId(repairs.length > 0 ? repairs[0].id : '');
      showToast('Borrador descartado', 'La nota nueva se ha descartado.', 'info');
      return;
    }
    if (confirm(`¿Seguro que deseas eliminar permanentemente el folio #${selectedRepairId}?`)) {
      await removeRepairFromDb(selectedRepairId);
      setRepairs(prev => prev.filter(r => r.id !== selectedRepairId));
      refetchLogs();
      showToast('Registro eliminado', `Se descartó el folio #${selectedRepairId} del registro.`, 'error');
      
      // Load next available or make a new one
      const remaining = repairs.filter(r => r.id !== selectedRepairId);
      if (remaining.length > 0) {
        setSelectedRepairId(remaining[0].id);
      } else {
        handleCreateNewRepair();
      }
    }
  };

  // Reprint triggered from Repairs top bar
  const handleReprintCurrentRepair = () => {
    showToast('Reimprimir Comprobante', `Generando ticket de carga térmica para folio #${selectedRepairId}...`, 'info');
  };

  // Jump to a repair by its folio number
  const handleJumpToRepair = useCallback((folioNumber: number) => {
    let target: RepairOrder | undefined;
    for (const r of repairs) {
      if (Number(r.id) === folioNumber || r.id === String(folioNumber)) {
        target = r;
        break;
      }
    }
    if (target) {
      setSelectedRepairId(target.id);
      setCurrentView('repairs');
      showToast('Orden encontrada', `Folio #${folioNumber} cargado.`, 'success');
    } else {
      showToast('No encontrada', `No existe orden con folio #${folioNumber}.`, 'error');
    }
  }, [repairs, showToast]);

  // Bulk-delete completed (delivered) repair orders
  const handleDeleteCompletedRepairs = useCallback(async (count: number) => {
    const { data: toDelete, error: fetchErr } = await supabase
      .from('repair_orders')
      .select('id')
      .eq('status', 'delivered')
      .order('created_at', { ascending: false })
      .limit(count);

    if (fetchErr || !toDelete || toDelete.length === 0) {
      showToast('Error', 'No se pudieron obtener las órdenes a eliminar.', 'error');
      return;
    }

    const ids = toDelete.map(r => r.id);
    const { error: delErr } = await supabase
      .from('repair_orders')
      .delete()
      .in('id', ids);

    if (delErr) {
      showToast('Error', 'No se pudieron eliminar las órdenes.', 'error');
      return;
    }

    await refetchRepairs();
    showToast('Órdenes eliminadas', `Se eliminaron ${ids.length} órdenes entregadas.`, 'success');
  }, [showToast, refetchRepairs]);

  // Clear loaded fields in Repairs
  const handleClearRepairForm = () => {
    if (selectedRepairId === DRAFT_ID) {
      setDraftRepair(blankRepair());
    } else {
      handleCreateNewRepair();
    }
  };

  // Complete point-of-sale transaction
  const handleCompletePOSCheckout = async (cash: number, card: number, usd: number) => {
    const subtotalCost = cart.reduce((acc, c) => acc + (c.price * c.qty), 0);
    const taxPct = settings.tax_rate !== undefined ? parseFloat(settings.tax_rate) : 16;
    const taxCharge = subtotalCost * (taxPct / 100);
    const totalCost = subtotalCost + taxCharge;

    const itemsDesc = cart.map(c => `${c.qty}x ${c.name}`).join(', ');
    const description = itemsDesc.length > 55 ? itemsDesc.slice(0, 52) + '...' : itemsDesc;

    const { data: sale, error: saleErr } = await supabase
      .from('sales')
      .insert({
        description,
        cash_amount: cash,
        card_amount: card,
        usd_amount: usd,
        subtotal: subtotalCost,
        tax: taxCharge,
        total: totalCost,
        created_by: userId,
      })
      .select()
      .single();

    if (saleErr || !sale) {
      showToast('Error', 'No se pudo procesar la venta.', 'error');
      return;
    }

    const { error: itemsErr } = await supabase.from('sale_items').insert(
      cart.map(c => ({
        sale_id: sale.id,
        product_name: c.name,
        qty: c.qty,
        price: c.price,
      }))
    );

    if (itemsErr) {
      showToast('Error', 'Venta registrada pero fallaron los detalles.', 'error');
    } else {
      // Deduct stock for cart items that have a productId
      const stockDeductions = cart
        .filter(c => c.productId)
        .map(c => {
          const product = products.find(p => p.id === c.productId);
          if (!product) return Promise.resolve();
          const newStock = Math.max(0, product.stock - c.qty);
          return supabase.from('products').update({ stock: newStock }).eq('id', c.productId!);
        });
      await Promise.all(stockDeductions);
      showToast('Venta Exitosa', `Venta procesada correctamente por $${totalCost.toFixed(2)}.`, 'success');
    }

    setCart([]);
    refetchLogs();
    refetchProducts();
  };

  // Register cash registry movement
  const handleRegisterCashMovement = async (type: 'in' | 'out', amount: number, note: string) => {
    const ok = await addCashMovement(type, amount, note);
    if (!ok) {
      showToast('Error', 'No se pudo registrar el movimiento de caja.', 'error');
      return;
    }
    refetchLogs();
    showToast('Flujo registrado', `Movimiento de caja por $${amount.toFixed(2)} asentado en reporte.`, 'success');
  };

  // Live total financial summaries for Reports View
  const calculatedStats = useMemo(() => {
    // 1) Total POS sales: summing item costs inside POS Sale logs
    const salesOnly = logs
      .filter(l => l.type === 'POS Sale')
      .reduce((acc, curr) => acc + curr.amount, 0);

    // 2) Repair Advances: summing Repair Advance logs
    const advancesOnly = logs
      .filter(l => l.type === 'Repair Advance')
      .reduce((acc, curr) => acc + curr.amount, 0);

    // 3) Total Cash in Registry
    // Start register base state fund + all positive register collections (sales, advances) - outflows
    const startingFundBase = 1000.00;
    const collections = logs.reduce((acc, curr) => acc + curr.amount, 0);
    const finalRegisterFund = startingFundBase + collections;

    return {
      totalSales: salesOnly,
      totalAdvances: advancesOnly,
      totalCashInRegister: finalRegisterFund
    };
  }, [logs]);

  const dashboardBentoStats = useMemo(() => {
    const waitingParts = repairs.filter(r => r.status === 'waiting_parts').length;
    const inReview = repairs.filter(r => r.status === 'in_review').length;
    const repaired = repairs.filter(r => r.status === 'repaired').length;
    
    return {
      urgent: waitingParts + inReview,
      inProgress: repaired,
      completed: repairs.filter(r => r.status === 'delivered').length
    };
  }, [repairs]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-bright">
        <span className="animate-spin material-symbols-outlined text-primary text-4xl">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-bright flex antialiased select-none font-sans">
      
      {/* Sidebar navigation */}
      <Sidebar
        activeView={currentView}
        onViewChange={setCurrentView}
        onCreateNewRepair={handleCreateNewRepair}
        onLogout={handleLogout}
      />

      {/* Main interactive workspace panels wrapper */}
      <div className={`flex-1 flex flex-col ${session ? 'ml-64' : 'ml-0'}`}>
        
        {/* Top bar header */}
        <Header
          activeView={currentView}
          user={userName}
          onOpenSearchModal={() => setSearchModalOpen(true)}
          onCreateNewRepair={handleCreateNewRepair}
          onDeleteCurrentRepair={handleDeleteCurrentRepair}
          onReprintCurrentRepair={handleReprintCurrentRepair}
          onClearRepairForm={handleClearRepairForm}
          onOpenServiciosModal={() => setServiciosModalOpen(true)}
          onJumpToRepair={handleJumpToRepair}
          currentRepairId={selectedRepairId}
        />

        {/* Dynamic page routes rendering canvas */}
        <main className={`flex-1 p-6 ${session ? 'mt-16' : 'mt-0'} overflow-y-auto bg-surface-container-lowest h-[calc(100vh-4rem)]`}>
          <div className="max-w-7xl mx-auto h-full flex flex-col">
            
            {currentView === 'login' && (
              <LoginView />
            )}

            {currentView === 'dashboard' && (
              <DashboardView
                onViewChange={setCurrentView}
                onLogout={handleLogout}
                totalsSalesVal={calculatedStats.totalSales}
                completedRepairsCount={dashboardBentoStats.completed}
                urgentCount={dashboardBentoStats.urgent}
                inProgressCount={dashboardBentoStats.inProgress}
              />
            )}

            {currentView === 'pos' && (
              <POSView
                cart={cart}
                onSetCart={setCart}
                onCompleteCheckout={handleCompletePOSCheckout}
                onRegisterCashMovement={handleRegisterCashMovement}
                showToast={showToast}
                products={products}
                onRefetchProducts={refetchProducts}
                taxRate={settings.tax_rate !== undefined ? parseFloat(settings.tax_rate) : 16}
                exchangeRate={settings.exchange_rate !== undefined ? parseFloat(settings.exchange_rate) : 18.50}
              />
            )}

            {currentView === 'repairs' && (
              <RepairsView
                repairs={repairs}
                selectedId={selectedRepairId}
                onSetSelectedId={setSelectedRepairId}
                onUpdateRepair={handleUpdateRepair}
                onSaveRepairOrder={handleSaveRepairOrder}
                showToast={showToast}
                searchModalOpen={searchModalOpen}
                onSetSearchModalOpen={setSearchModalOpen}
                serviciosModalOpen={serviciosModalOpen}
                onSetServiciosModalOpen={setServiciosModalOpen}
                onDeleteCompletedRepairs={handleDeleteCompletedRepairs}
                draftRepair={draftRepair}
                draftId={DRAFT_ID}
                onSelectRepair={(id: string) => {
                  setSelectedRepairId(id);
                  setCurrentView('repairs');
                  setServiciosModalOpen(false);
                }}
              />
            )}

            {currentView === 'reports' && (
              <ReportsView
                logs={logs}
                repairs={repairs}
                totalSalesSum={calculatedStats.totalSales}
                totalAdvancesSum={calculatedStats.totalAdvances}
                totalCashSum={calculatedStats.totalCashInRegister}
                showToast={showToast}
              />
            )}

            {currentView === 'arqueo' && (
              <ArqueoCaja
                movements={cashMovements}
                showToast={showToast}
              />
            )}

            {currentView === 'settings' && (
              <SettingsView user={userName} showToast={showToast} settings={settings} updateSetting={updateSetting} />
            )}

          </div>
        </main>

      </div>

      {/* Persistent global toast notifications widget */}
      <Toast 
        message={toastMessage} 
        onClose={() => setToastMessage(null)} 
      />

    </div>
  );
}
