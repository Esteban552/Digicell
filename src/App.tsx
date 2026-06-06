/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';

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
import { 
  INITIAL_REPAIRS, 
  INITIAL_CART, 
  INITIAL_LOGS, 
  INITIAL_CASH_MOVEMENTS 
} from './data';
import { 
  ActiveView, 
  RepairOrder, 
  CartItem, 
  LogEntry, 
  CashRegistryMovement 
} from './types';

export default function App() {
  // Session authentication state (initial prefilled J. Cashier for quick preview)
  const [user, setUser] = useState<string | null>('J. Cashier');
  
  // Active navigation view state
  const [currentView, setCurrentView] = useState<ActiveView>('dashboard');

  // Shared application "database" states
  const [repairs, setRepairs] = useState<RepairOrder[]>(INITIAL_REPAIRS);
  const [cart, setCart] = useState<CartItem[]>(INITIAL_CART);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [cashMovements, setCashMovements] = useState<CashRegistryMovement[]>(INITIAL_CASH_MOVEMENTS);

  // Active loaded repair inside Order Intake Form
  const [selectedRepairId, setSelectedRepairId] = useState<string>('10041');

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

  // Sync currentView if User is logged out
  useEffect(() => {
    if (!user) {
      setCurrentView('login');
    }
  }, [user]);

  // Global Keyboard listener shortcuts (F5 for Checkout, F8 for Search)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (!user) return;
      
      if (e.key === 'F8') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
        showToast('Búsqueda Rápida', 'Toggle de pantalla de órdenes activa (F8).', 'info');
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [user, showToast]);

  // Log in user
  const handleLoginSuccess = (username: string) => {
    setUser(username);
    setCurrentView('dashboard');
    showToast('Sesión Iniciada', `Bienvenido al sistema Digicell, ${username}.`, 'success');
  };

  // Log out user
  const handleLogout = () => {
    if (confirm('¿Seguro que deseas salir y cerrar sesión?')) {
      setUser(null);
      setCurrentView('login');
      setCart([]);
      showToast('Sesión Cerrada', 'Has desconectado de la terminal actual con éxito.', 'info');
    }
  };

  // Create a brand new vacant repair order
  const handleCreateNewRepair = () => {
    const nextNumericId = String(Math.max(...repairs.map(r => Number(r.id) || 10000)) + 1);
    const newOrder: RepairOrder = {
      id: nextNumericId,
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      deviceBrand: 'Apple',
      deviceModel: '',
      deviceSerial: '',
      devicePassword: '',
      deviceColor: '',
      powersOn: 'Yes',
      batteryPercent: '',
      chargerLeft: false,
      coverLeft: false,
      receivingCondition: '',
      problemReported: '',
      status: 'in_review',
      technician: 'Unassigned',
      deliveryDate: new Date().toISOString().split('T')[0],
      warrantyEnd: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().split('T')[0],
      totalCost: 0,
      advancePaid: 0,
      remainingBalance: 0,
      footnote: 'Garantía de 30 días en piezas reemplazadas. No nos hacemos responsables por equipos olvidados después de 60 días.',
      createdAt: new Date().toISOString()
    };

    setRepairs(prev => [newOrder, ...prev]);
    setSelectedRepairId(nextNumericId);
    setCurrentView('repairs');
    showToast('Nueva Orden', `Se inició folio #${nextNumericId} para edición.`, 'info');
  };

  // Handle updates inside repair forms
  const handleUpdateRepair = (id: string, updatedFields: Partial<RepairOrder>) => {
    setRepairs(prev => prev.map(r => r.id === id ? { ...r, ...updatedFields } : r));
  };

  // Finalize/Save the repair order, registering progress
  const handleSaveRepairOrder = (id: string) => {
    const orderRef = repairs.find(r => r.id === id);
    if (!orderRef) return;

    if (!orderRef.clientName?.trim()) {
      showToast('Falta nombre', 'Por favor llena el nombre del cliente.', 'error');
      return;
    }

    // Accumulate Log registers if there was an advance paid that we want to track
    if (orderRef.advancePaid > 0) {
      // Avoid duplicate logs if possible, or just generate a new log track
      const advanceLog: LogEntry = {
        id: 'log_adv_' + Date.now(),
        time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        type: 'Repair Advance',
        description: `Ticket #R-${orderRef.id}: ${orderRef.deviceBrand} ${orderRef.deviceModel} Deposit`,
        amount: orderRef.advancePaid,
        status: 'Advance'
      };
      setLogs(prev => [advanceLog, ...prev]);
    }

    showToast('¡Guardado Perfecto!', `Orden de servicio #${orderRef.id} actualizada correctamente.`, 'success');
  };

  // Perform delete on selected repair
  const handleDeleteCurrentRepair = () => {
    if (confirm(`¿Seguro que deseas eliminar permanentemente el folio #${selectedRepairId}?`)) {
      setRepairs(prev => prev.filter(r => r.id !== selectedRepairId));
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
  const handleCompletePOSCheckout = (cash: number, card: number, usd: number) => {
    const subtotalCost = cart.reduce((acc, c) => acc + (c.price * c.qty), 0);
    const taxCharge = subtotalCost * 0.16;
    const totalCost = subtotalCost + taxCharge;

    const itemsDesc = cart.map(c => `${c.qty}x ${c.name}`).join(', ');

    // Register sale log
    const saleLog: LogEntry = {
      id: 'log_pos_' + Date.now(),
      time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      type: 'POS Sale',
      description: itemsDesc.length > 55 ? itemsDesc.slice(0, 52) + '...' : itemsDesc,
      amount: totalCost,
      status: 'Paid'
    };

    setLogs(prev => [saleLog, ...prev]);
    setCart([]); // Clear cart
    showToast('Venta Exitosa', `Venta procesada correctamente por $${totalCost.toFixed(2)}.`, 'success');
  };

  // Register cash registry movement
  const handleRegisterCashMovement = (type: 'in' | 'out', amount: number, note: string) => {
    const cleanAmount = type === 'out' ? -amount : amount;
    
    const cashEntry: CashRegistryMovement = {
      id: 'move_' + Date.now(),
      type,
      amount: amount,
      note,
      time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    };

    const sysLog: LogEntry = {
      id: 'log_cash_' + Date.now(),
      time: cashEntry.time,
      type: 'Cash Movement',
      description: note.length > 55 ? note.slice(0, 52) + '...' : note,
      amount: cleanAmount,
      status: type === 'out' ? 'Outflow' : 'Paid'
    };

    setCashMovements(prev => [cashEntry, ...prev]);
    setLogs(prev => [sysLog, ...prev]);
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

  return (
    <div className="min-h-screen bg-surface-bright flex antialiased select-none font-sans">
      
      {/* Sidebar navigation */}
      <Sidebar
        activeView={currentView}
        onViewChange={setCurrentView}
        onCreateNewRepair={handleCreateNewRepair}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main interactive workspace panels wrapper */}
      <div className={`flex-1 flex flex-col ${user ? 'ml-64' : 'ml-0'}`}>
        
        {/* Top bar header */}
        <Header
          activeView={currentView}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          user={user}
          onOpenSearchModal={() => setSearchModalOpen(true)}
          onCreateNewRepair={handleCreateNewRepair}
          onDeleteCurrentRepair={handleDeleteCurrentRepair}
          onReprintCurrentRepair={handleReprintCurrentRepair}
          onClearRepairForm={handleClearRepairForm}
        />

        {/* Dynamic page routes rendering canvas */}
        <main className={`flex-1 p-6 ${user ? 'mt-16' : 'mt-0'} overflow-y-auto bg-surface-container-lowest h-[calc(100vh-4rem)]`}>
          <div className="max-w-7xl mx-auto h-full flex flex-col">
            
            {currentView === 'login' && (
              <LoginView onLoginSuccess={handleLoginSuccess} />
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
              <SettingsView user={user} showToast={showToast} />
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
