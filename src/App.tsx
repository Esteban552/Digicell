/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import POSView from './components/POSView';
import RepairsView from './components/RepairsView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import ArqueoCaja from './components/ArqueoCaja';
import ErrorBoundary from './components/ErrorBoundary';
import Toast from './components/Toast';
import { printHTML, receiptHTML } from './lib/printIframe';

import { INITIAL_CART } from './data';
import { supabase } from './lib/supabase';
import { getBusinessInfo } from './lib/businessInfo';

import { useCashMovements } from './hooks/useCashMovements';
import { useActivityLogs } from './hooks/useActivityLogs';
import { useSettings } from './hooks/useSettings';
import { useProducts } from './hooks/useProducts';
import { useProfile } from './hooks/useProfile';
import { useToast } from './hooks/useToast';
import { useConfirm } from './hooks/useConfirm';
import { useRepairEditor } from './hooks/useRepairEditor';
import { useAppStats } from './hooks/useAppStats';
import { useArqueos } from './hooks/useArqueos';
import { ActiveView, CartItem, UserRole } from './types';

const VIEWS_BY_ROLE: Record<UserRole, ActiveView[]> = {
  admin: ['dashboard', 'pos', 'repairs', 'reports', 'settings', 'arqueo'],
  technician: ['dashboard', 'repairs', 'reports'],
};

export default function App() {
  // Supabase Auth session
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const initialViewSet = useRef(false);

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
        setSession(session);
      })
      .catch(() => {
        setSession(null);
      })
      .finally(() => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          setAuthLoading(false);
        }
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      // Only navigate on explicit sign-out. SIGNED_IN from tab reconnect does NOT reset view.
      // TOKEN_REFRESHED (fires when tab regains focus) is completely ignored for navigation.
      if (event === 'SIGNED_OUT') setCurrentView('login');
      if (event === 'SIGNED_IN' && session) setCurrentView(prev => prev === 'login' ? 'dashboard' : prev);
    });

    return () => {
      settled = true;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const userName = session?.user?.user_metadata?.display_name ?? session?.user?.email?.split('@')[0] ?? 'Invitado';
  const userId = session?.user?.id ?? null;

  const { profile, loading: profileLoading } = useProfile(userId);
  const userRole: UserRole = profile?.role ?? 'technician';

  const [currentView, setCurrentView] = useState<ActiveView>('dashboard');

  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (initialViewSet.current) return; // Only set view once on initial load
    initialViewSet.current = true;
    setCurrentView(session ? 'dashboard' : 'login');
  }, [session, authLoading, profileLoading]);

  useEffect(() => {
    if (authLoading || profileLoading || !session) return;
    const allowed = VIEWS_BY_ROLE[userRole];
    if (!allowed.includes(currentView)) {
      setCurrentView('dashboard');
    }
  }, [currentView, userRole, session, authLoading, profileLoading]);

  // Toast notifications
  const { toastMessage, showToast, setToastMessage } = useToast();

  // Data hooks
  const { data: logs, loading: logsLoading, error: logsError, refetch: refetchLogs } = useActivityLogs();
  const { data: cashMovements, loading: cashLoading, error: cashError, add: addCashMovement, refetch: refetchCashMovements } = useCashMovements();
  const { data: settings, loading: settingsLoading, error: settingsError, update: updateSetting, refetch: refetchSettings } = useSettings();
  const { data: products, loading: productsLoading, error: productsError, refetch: refetchProducts } = useProducts();
  const { historial: arqueoHistorial, loading: arqueosLoading, error: arqueosError, save: saveArqueo, refetch: refetchArqueos } = useArqueos();
  const [cart, setCart] = useState<CartItem[]>(INITIAL_CART);

  // Confirm dialog hook
  const { confirm, ConfirmModal } = useConfirm();

  // Repair editor — manages all repair state and CRUD
  const { refetchRepairs, ...repairEditor } = useRepairEditor(showToast, refetchLogs, refetchCashMovements, setCurrentView, confirm);

  // Surface hook errors to user via toast
  useEffect(() => { if (repairEditor.repairsError) showToast('Error en reparaciones', repairEditor.repairsError, 'error'); }, [repairEditor.repairsError, showToast]);
  useEffect(() => { if (logsError) showToast('Error en actividad', logsError, 'error'); }, [logsError, showToast]);
  useEffect(() => { if (cashError) showToast('Error en caja', cashError, 'error'); }, [cashError, showToast]);
  useEffect(() => { if (settingsError) showToast('Error en configuración', settingsError, 'error'); }, [settingsError, showToast]);
  useEffect(() => { if (productsError) showToast('Error en inventario', productsError, 'error'); }, [productsError, showToast]);
  useEffect(() => { if (arqueosError) showToast('Error en arqueos', arqueosError, 'error'); }, [arqueosError, showToast]);

  const repairsLoading = repairEditor.repairsLoading;
  const startingFund = Number(settings.starting_fund) || 1000;
  const bizInfo = getBusinessInfo(settings);

  const prevSessionRef = useRef(session);
  useEffect(() => {
    if (!prevSessionRef.current && session) {
      refetchProducts();
      refetchLogs();
      refetchCashMovements();
      refetchSettings();
      refetchRepairs();
    }
    prevSessionRef.current = session;
  }, [session, refetchProducts, refetchLogs, refetchCashMovements, refetchSettings, refetchRepairs]);

  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    if (!session) { setDataReady(false); return; }
    if (!logsLoading && !cashLoading && !settingsLoading && !productsLoading && !repairsLoading && !arqueosLoading) {
      setDataReady(true);
    }
  }, [session, logsLoading, cashLoading, settingsLoading, productsLoading, repairsLoading]);

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [serviciosModalOpen, setServiciosModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Global Keyboard listener shortcuts
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

  const handleReprint = useCallback(() => {
    repairEditor.handleReprintCurrentRepair();
  }, [repairEditor]);

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Cerrar Sesión',
      message: '¿Seguro que deseas salir y cerrar sesión?',
      confirmLabel: 'Cerrar Sesión',
      danger: true,
    });
    if (!ok) return;
    await supabase.auth.signOut();
    setCart([]);
    showToast('Sesión Cerrada', 'Has desconectado de la terminal actual con éxito.', 'info');
  };

  // Complete point-of-sale transaction
  const handleCompletePOSCheckout = async (cash: number, card: number, usd: number, discount: number = 0) => {
    const subtotalCost = cart.reduce((acc, c) => acc + (c.price * c.qty), 0);
    const taxPct = settings.tax_rate !== undefined ? parseFloat(settings.tax_rate) : 16;
    const taxableAmount = Math.max(0, subtotalCost - discount);
    const taxCharge = taxableAmount * (taxPct / 100);
    const totalCost = taxableAmount + taxCharge;

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
        discount,
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
      // Rollback: delete the sale so we don't leave orphan records
      await supabase.from('sales').delete().eq('id', sale.id);
      showToast('Error', 'No se pudieron registrar los productos. La venta fue cancelada.', 'error');
      return;
    }

    // Deduct stock for each product
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

    const exchangeRate = settings.exchange_rate !== undefined ? parseFloat(settings.exchange_rate) : 18.50;
    const usdValue = usd * exchangeRate;
    const change = (cash + card + usdValue) - totalCost;

    // Record net cash retained from this sale
    // (used by ArqueoCaja — cash_movements entries appear in register audit)
    const netCash = totalCost - card;
    if (netCash > 0) {
      const { data: { user: u3 } } = await supabase.auth.getUser();
      const desc = `${cart.length} item${cart.length === 1 ? '' : 's'} — Neto efectivo: $${netCash.toFixed(2)}${usd > 0 ? ` (USD ${usd.toFixed(2)} recibidos)` : ''}`;
      await supabase.from('cash_movements').insert({
        type: 'in',
        amount: netCash,
        note: desc.slice(0, 150),
        created_by: u3?.id ?? null,
      });
    }

    const ticketData = {
      saleId: sale.id,
      createdAt: sale.created_at,
      items: cart.map(c => ({ name: c.name, qty: c.qty, price: c.price, total: c.price * c.qty })),
      subtotal: subtotalCost,
      discount,
      tax: taxCharge,
      taxRate: taxPct,
      total: totalCost,
      cashAmount: cash,
      cardAmount: card,
      usdAmount: usd,
      usdExchangeRate: exchangeRate,
      change,
      attendant: userName,
    };
    printHTML(receiptHTML(ticketData, bizInfo));

    setCart([]);
    refetchLogs();
    refetchCashMovements();
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

  // Live total financial summaries
  const { calculatedStats, dashboardBentoStats } = useAppStats(logs, repairEditor.repairs, startingFund);

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bright">
      <span className="animate-spin material-symbols-outlined text-primary text-4xl">progress_activity</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-bright flex antialiased select-none font-sans">

      <Sidebar
        activeView={currentView}
        onViewChange={setCurrentView}
        onCreateNewRepair={repairEditor.handleCreateNewRepair}
        onLogout={handleLogout}
        userRole={userRole}
      />

      <div className={`flex-1 flex flex-col ${session ? 'ml-64' : 'ml-0'}`}>

        <Header
          activeView={currentView}
          user={userName}
          onCreateNewRepair={repairEditor.handleCreateNewRepair}
          onDeleteCurrentRepair={repairEditor.handleDeleteCurrentRepair}
          onReprintCurrentRepair={handleReprint}
          onClearRepairForm={repairEditor.handleClearRepairForm}
          onOpenServiciosModal={() => setServiciosModalOpen(true)}
          onJumpToRepair={repairEditor.handleJumpToRepair}
          currentRepairId={repairEditor.selectedRepairId}
        />

        <ErrorBoundary>
        <main className={`flex-1 p-6 ${session ? 'mt-16' : 'mt-0'} overflow-y-auto bg-surface-container-lowest h-[calc(100vh-4rem)]`}>
          <div className="max-w-7xl mx-auto h-full flex flex-col">

            {session && !dataReady ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                  <span className="animate-spin material-symbols-outlined text-primary text-4xl">progress_activity</span>
                  <p className="text-sm font-sans text-on-surface-variant font-medium">Cargando datos...</p>
                </div>
              </div>
            ) : (
              <>

            {currentView === 'login' && <LoginView />}

            {currentView === 'dashboard' && (
              <DashboardView
                onViewChange={setCurrentView}
                onLogout={handleLogout}
                urgentCount={dashboardBentoStats.urgent}
                inProgressCount={dashboardBentoStats.inProgress}
                userName={userName}
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
                repairs={repairEditor.repairs}
                selectedId={repairEditor.selectedRepairId}
                onUpdateRepair={repairEditor.handleUpdateRepair}
                onSaveRepairOrder={repairEditor.handleSaveRepairOrder}
                showToast={showToast}
                searchModalOpen={searchModalOpen}
                onSetSearchModalOpen={setSearchModalOpen}
                serviciosModalOpen={serviciosModalOpen}
                onSetServiciosModalOpen={setServiciosModalOpen}
                onDeleteCompletedRepairs={repairEditor.handleDeleteCompletedRepairs}
                draftRepair={repairEditor.draftRepair}
                draftId={repairEditor.DRAFT_ID}
                onSelectRepair={(id: string) => {
                  repairEditor.setSelectedRepairId(id);
                  setCurrentView('repairs');
                  setServiciosModalOpen(false);
                }}
                isSaving={repairEditor.isSaving}
                printModalOpen={printModalOpen}
                onSetPrintModalOpen={setPrintModalOpen}
                onReprint={handleReprint}
              />
            )}

            {currentView === 'reports' && (
              <ReportsView
                logs={logs}
                repairs={repairEditor.repairs}
                totalSalesSum={calculatedStats.totalSales}
                totalAdvancesSum={calculatedStats.totalAdvances}
                showToast={showToast}
              />
            )}

            {currentView === 'arqueo' && (
              <ArqueoCaja
                movements={cashMovements}
                startingFund={startingFund}
                historial={arqueoHistorial}
                onSave={saveArqueo}
                onRefetchArqueos={refetchArqueos}
              />
            )}

            {currentView === 'settings' && (
              <SettingsView user={userName} showToast={showToast} settings={settings} updateSetting={updateSetting} userRole={userRole} />
            )}

              </>
            )}

          </div>
        </main>
        </ErrorBoundary>

      </div>

      <ConfirmModal />
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

    </div>
  );
}
