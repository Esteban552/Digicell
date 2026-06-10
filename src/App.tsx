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
  } = useRepairOrders();

  // Local mirror for instant form editing — syncs from DB on load
  const [repairs, setRepairs] = useState<RepairOrder[]>([]);
  useEffect(() => {
    if (!repairsLoading) setRepairs(dbRepairs);
  }, [dbRepairs, repairsLoading]);

  const { data: logs, refetch: refetchLogs } = useActivityLogs();
  const { add: addCashMovement } = useCashMovements();
  const { data: settings, update: updateSetting } = useSettings();
  const { data: products, refetch: refetchProducts } = useProducts();
  const [cart, setCart] = useState<CartItem[]>(INITIAL_CART);

  // Active loaded repair inside Order Intake Form
  const [selectedRepairId, setSelectedRepairId] = useState<string>('');
  // Set initial selected repair from DB data once loaded
  useEffect(() => {
    if (repairs.length > 0 && !selectedRepairId) {
      setSelectedRepairId(repairs[0].id);
    }
  }, [repairs, selectedRepairId]);

  // Search parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [searchModalOpen, setSearchModalOpen] = useState(false);

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

  // Create a brand new vacant repair order
  const handleCreateNewRepair = async () => {
    const newOrder = await createRepairInDb();
    if (!newOrder) {
      showToast('Error', 'No se pudo crear la orden de reparación.', 'error');
      return;
    }
    setRepairs(prev => [newOrder, ...prev]);
    setSelectedRepairId(newOrder.id);
    setCurrentView('repairs');
    showToast('Nueva Orden', `Se inició folio #${newOrder.id} para edición.`, 'info');
  };

  // Handle updates inside repair forms (local-only for instant response)
  const handleUpdateRepair = (id: string, updatedFields: Partial<RepairOrder>) => {
    setRepairs(prev => prev.map(r => r.id === id ? { ...r, ...updatedFields } : r));
  };

  // Finalize/Save the repair order, syncing to Supabase
  const handleSaveRepairOrder = async (id: string) => {
    const orderRef = repairs.find(r => r.id === id);
    if (!orderRef) return;

    if (!orderRef.clientName?.trim()) {
      showToast('Falta nombre', 'Por favor llena el nombre del cliente.', 'error');
      return;
    }

    await syncRepairToDb(id, orderRef);
    refetchLogs();
    showToast('¡Guardado Perfecto!', `Orden de servicio #${orderRef.id} actualizada correctamente.`, 'success');
  };

  // Perform delete on selected repair
  const handleDeleteCurrentRepair = async () => {
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

  // Clear loaded fields in Repairs
  const handleClearRepairForm = () => {
    handleUpdateRepair(selectedRepairId, {
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      deviceModel: '',
      deviceSerial: '',
      devicePassword: '',
      deviceColor: '',
      receivingCondition: '',
      problemReported: '',
      totalCost: 0,
      advancePaid: 0,
      remainingBalance: 0
    });
    showToast('Campos Limpiados', 'La forma actual se ha restablecido en blanco.', 'info');
  };

  // Complete point-of-sale transaction
  const handleCompletePOSCheckout = async (cash: number, card: number, usd: number) => {
    const subtotalCost = cart.reduce((acc, c) => acc + (c.price * c.qty), 0);
    const taxCharge = subtotalCost * 0.16;
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
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          user={userName}
          onOpenSearchModal={() => setSearchModalOpen(true)}
          onCreateNewRepair={handleCreateNewRepair}
          onDeleteCurrentRepair={handleDeleteCurrentRepair}
          onReprintCurrentRepair={handleReprintCurrentRepair}
          onClearRepairForm={handleClearRepairForm}
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
              />
            )}

            {currentView === 'reports' && (
              <ReportsView
                logs={logs}
                totalSalesSum={calculatedStats.totalSales}
                totalAdvancesSum={calculatedStats.totalAdvances}
                totalCashSum={calculatedStats.totalCashInRegister}
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
