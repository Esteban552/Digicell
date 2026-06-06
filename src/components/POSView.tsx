/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { CartItem } from '../types';
import { PRESET_INVENTORY } from '../data';

interface POSViewProps {
  cart: CartItem[];
  onSetCart: (cart: CartItem[] | ((p: CartItem[]) => CartItem[])) => void;
  onCompleteCheckout: (amountLocal: number, amountCard: number, amountUsd: number) => void;
  onRegisterCashMovement: (type: 'in' | 'out', amount: number, note: string) => void;
  showToast: (title: string, desc: string, type: 'success' | 'info' | 'error') => void;
}

export default function POSView({
  cart,
  onSetCart,
  onCompleteCheckout,
  onRegisterCashMovement,
  showToast
}: POSViewProps) {
  // Quick adder states
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Modals state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [cashModalOpen, setCashModalOpen] = useState(false);

  // Pay modal inputs
  const [cashLocal, setCashLocal] = useState('300.00');
  const [cardLocal, setCardLocal] = useState('0.00');
  const [cashUsd, setCashUsd] = useState('0.00');

  // Cash movement inputs
  const [cashMoveType, setCashMoveType] = useState<'in' | 'out'>('in');
  const [cashMoveAmount, setCashMoveAmount] = useState('');
  const [cashMoveNote, setCashMoveNote] = useState('');

  // Auto-suggestions calculation
  const suggestions = useMemo(() => {
    if (!itemName) return [];
    return PRESET_INVENTORY.filter(p =>
      p.name.toLowerCase().includes(itemName.toLowerCase())
    ).slice(0, 4);
  }, [itemName]);

  // Totals calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  }, [cart]);

  const tax = useMemo(() => {
    return subtotal * 0.16;
  }, [subtotal]);

  const total = useMemo(() => {
    return subtotal + tax;
  }, [subtotal, tax]);

  const totalUsd = useMemo(() => {
    return total / 18.50;
  }, [total]);

  // Handle click on suggestion
  const selectSuggestion = (name: string, price: number) => {
    setItemName(name);
    setItemPrice(String(price));
    setShowSuggestions(false);
  };

  // Add Item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName?.trim()) return;
    const finalPrice = Math.max(0, Number(itemPrice) || 0);
    const finalQty = Math.max(1, itemQty || 1);

    onSetCart((prev) => {
      const existing = prev.find(i => i.name.toLowerCase() === itemName.trim().toLowerCase());
      if (existing) {
        return prev.map(i => i.name.toLowerCase() === itemName.trim().toLowerCase() 
          ? { ...i, qty: i.qty + finalQty } 
          : i
        );
      } else {
        return [...prev, {
          id: 'cart_' + Date.now(),
          name: itemName.trim(),
          qty: finalQty,
          price: finalPrice
        }];
      }
    });

    setItemName('');
    setItemPrice('');
    setItemQty(1);
    showToast('Artículo agregado', 'Se colocó en el carro de venta actual.', 'info');
  };

  // Delete cart item
  const handleDeleteItem = (id: string) => {
    onSetCart(prev => prev.filter(item => item.id !== id));
    showToast('Artículo eliminado', 'Se quitó el artículo del carro.', 'info');
  };

  // Change cart item quantity
  const handleChangeQty = (id: string, dir: 'up' | 'down') => {
    onSetCart(prev => prev.map(item => {
      if (item.id === id) {
        const nextQty = dir === 'up' ? item.qty + 1 : Math.max(1, item.qty - 1);
        return { ...item, qty: nextQty };
      }
      return item;
    }));
  };

  // Clear current cart completely
  const handleCancelSale = () => {
    if (cart.length === 0) return;
    if (confirm('¿Seguro que deseas cancelar y vaciar la venta actual?')) {
      onSetCart([]);
      showToast('Venta Cancelada', 'El carro ha sido regresado a cero.', 'error');
    }
  };

  // Pay checkout triggers
  const openPayModal = () => {
    if (cart.length === 0) {
      showToast('Estructura vacía', 'Agrega algún producto antes de cobrar.', 'error');
      return;
    }
    // Pre-populate cashLocal input with exact total rounded up to next 10 or fifty
    const rounded = Math.ceil(total / 10) * 10;
    setCashLocal(String(rounded));
    setCardLocal('0.00');
    setCashUsd('0.00');
    setPayModalOpen(true);
  };

  // Checkout modal calculations
  const totalTendered = useMemo(() => {
    const valCashLocal = Number(cashLocal) || 0;
    const valCardLocal = Number(cardLocal) || 0;
    const valCashUsd = Number(cashUsd) || 0;
    return valCashLocal + valCardLocal + (valCashUsd * 18.50);
  }, [cashLocal, cardLocal, cashUsd]);

  const changeDue = useMemo(() => {
    return Math.max(0, totalTendered - total);
  }, [totalTendered, total]);

  const isPaymentReady = useMemo(() => {
    return totalTendered >= (total - 0.01);
  }, [totalTendered, total]);

  const completeCheckoutHandler = () => {
    if (!isPaymentReady) {
      showToast('Monto insuficiente', 'El total pagado debe cubrir la deuda.', 'error');
      return;
    }
    onCompleteCheckout(Number(cashLocal) || 0, Number(cardLocal) || 0, Number(cashUsd) || 0);
    setPayModalOpen(false);
  };

  const saveCashMovementHandler = () => {
    const amountVal = Number(cashMoveAmount);
    if (!amountVal || amountVal <= 0) {
      alert('Por favor introduce un monto válido.');
      return;
    }
    onRegisterCashMovement(cashMoveType, amountVal, cashMoveNote.trim() || 'Movimiento manual de caja');
    setCashModalOpen(false);
    setCashMoveAmount('');
    setCashMoveNote('');
  };

  return (
    <div className="flex-1 grid grid-cols-12 gap-6 select-none font-sans">
      
      {/* Left Area: Cart & Tools (8 columns) */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
        
        {/* Quick Input Bar Form */}
        <form onSubmit={handleAddItem} className="relative bg-white border border-outline-variant rounded-md p-4 flex gap-3 items-end shadow-sm">
          
          <div className="flex-1 relative">
            <label className="block text-xs font-semibold text-on-surface mb-1.5 font-sans">Item Code / Name</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => {
                setItemName(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Scan or type..."
              className="w-full h-10 border border-outline rounded px-3 focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none text-sm font-sans"
              required
            />
            {/* Live Autocomplete Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-18 bg-white border border-outline rounded shadow-lg z-50 overflow-hidden flex flex-col">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectSuggestion(item.name, item.price)}
                    className="w-full px-4 py-2.5 hover:bg-slate-50 text-left text-xs font-sans text-on-surface border-b border-slate-100 last:border-0 flex justify-between items-center outline-none"
                  >
                    <span className="font-semibold">{item.name}</span>
                    <span className="text-primary font-bold">${item.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-20">
            <label className="block text-xs font-semibold text-on-surface mb-1.5 font-sans">Qty</label>
            <input
              type="number"
              min="1"
              value={itemQty}
              onChange={(e) => setItemQty(Math.max(1, Number(e.target.value) || 1))}
              className="w-full h-10 border border-outline rounded px-3 focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none text-center text-sm font-sans"
              required
            />
          </div>

          <div className="w-28">
            <label className="block text-xs font-semibold text-on-surface mb-1.5 font-sans">Price</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant font-sans">$</span>
              <input
                type="text"
                placeholder="0.00"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                className="w-full h-10 border border-outline rounded pl-6 pr-3 focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none text-right text-sm font-sans"
              />
            </div>
          </div>

          <button
            type="submit"
            className="h-10 px-4 bg-secondary hover:bg-primary text-white rounded font-sans font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors outline-none"
          >
            <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
            Add
          </button>
        </form>

        {/* Cart Table Container */}
        <div className="bg-white border border-outline-variant rounded-md flex-1 flex flex-col overflow-hidden shadow-sm min-h-[350px]">
          
          {/* Header row */}
          <div className="flex items-center justify-between p-4 border-b border-outline-variant bg-surface-container-low select-none">
            <h2 className="text-base font-bold text-on-surface font-sans">Current Sale</h2>
            
            <button
              type="button"
              onClick={() => setCashModalOpen(true)}
              className="text-tertiary hover:underline text-xs font-semibold flex items-center gap-1.5 outline-none cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">payments</span>
              Cash Movement
            </button>
          </div>

          {/* Cart items list */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <span className="material-symbols-outlined text-slate-300 text-[60px] select-none">
                  shopping_cart_checkout
                </span>
                <p className="text-sm font-sans text-on-surface-variant font-medium mt-3">
                  Carro de venta vacío.
                </p>
                <p className="text-xs font-sans text-slate-400 mt-1 max-w-xs leading-normal">
                  Utiliza la barra superior para buscar productos cargados en el inventario o escanea códigos.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse font-sans">
                <thead className="bg-[#ffffff] sticky top-0 border-b border-outline-variant/60 z-15">
                  <tr>
                    <th className="p-3 text-[11px] font-bold text-on-surface-variant font-sans w-12 text-center uppercase tracking-wider">#</th>
                    <th className="p-3 text-[11px] font-bold text-on-surface-variant font-sans uppercase tracking-wider">Item Description</th>
                    <th className="p-3 text-[11px] font-bold text-on-surface-variant font-sans w-24 text-center uppercase tracking-wider">Qty</th>
                    <th className="p-3 text-[11px] font-bold text-on-surface-variant font-sans w-24 text-right uppercase tracking-wider">Price</th>
                    <th className="p-3 text-[11px] font-bold text-on-surface-variant font-sans w-28 text-right uppercase tracking-wider">Subtotal</th>
                    <th className="p-3 text-[11px] font-bold text-on-surface-variant font-sans w-12 text-center uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-sm text-[#131b2e]">
                  {cart.map((item, idx) => (
                    <tr 
                      key={item.id} 
                      className="even:bg-surface-container-low/50 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-3 text-center text-xs text-on-surface-variant font-medium">{idx + 1}</td>
                      <td className="p-3 font-semibold text-xs leading-snug">{item.name}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleChangeQty(item.id, 'down')}
                            className="w-6 h-6 border border-slate-300 rounded flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer outline-none select-none text-xs"
                          >
                            -
                          </button>
                          <span className="font-semibold text-xs text-center w-6">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => handleChangeQty(item.id, 'up')}
                            className="w-6 h-6 border border-slate-300 rounded flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer outline-none select-none text-xs"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono text-xs text-on-surface-variant font-medium">
                        ${item.price.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-xs">
                        ${(item.price * item.qty).toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-error hover:text-red-700 p-1 rounded hover:bg-error-container/30 transition-colors outline-none cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* Right Area: Totals & Payments Panel (4 columns) */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        
        {/* Terminal Metadata Card */}
        <div className="bg-white border border-outline-variant rounded-md p-4 shadow-sm select-none font-sans text-xs">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-on-surface-variant font-medium">Terminal</span>
            <span className="font-semibold text-on-surface">POS-01</span>
          </div>
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-on-surface-variant font-medium">Cashier</span>
            <span className="font-semibold text-on-surface">J. Cashier</span>
          </div>
          <div className="flex justify-between items-center pt-2.5 border-t border-outline-variant/60">
            <span className="text-on-surface-variant font-medium">Exchange Rate (USD)</span>
            <span className="font-semibold text-on-surface">$1 = 18.50 MXN</span>
          </div>
        </div>

        {/* Financial Totals layout block */}
        <div className="bg-white border border-outline-variant rounded-md p-5 shadow-sm flex-1 flex flex-col justify-end min-h-[300px]">
          
          <div className="space-y-2.5 mb-5 pb-5 border-b border-slate-100 font-sans text-xs select-none">
            <div className="flex justify-between text-on-surface-variant">
              <span>Subtotal</span>
              <span className="font-semibold font-mono">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Tax (16%)</span>
              <span className="font-semibold font-mono">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Discount</span>
              <span className="font-semibold font-mono text-secondary">-$0.00</span>
            </div>
          </div>

          <div className="mb-8 select-none">
            <div className="flex justify-between items-end">
              <span className="text-sm font-bold text-on-surface font-sans uppercase">Total</span>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary tracking-tight font-sans">
                  ${total.toFixed(2)}
                </div>
                <div className="text-[10px] font-sans font-bold text-on-surface-variant mt-1">
                  USD Equiv: ${totalUsd.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Action trigger buttons */}
          <div className="grid grid-cols-2 gap-3 mt-auto">
            <button
              onClick={handleCancelSale}
              disabled={cart.length === 0}
              className="h-10 border border-outline text-on-surface rounded font-sans text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer outline-none"
            >
              <span className="material-symbols-outlined text-[16px]">cancel</span>
              Cancelar Cart
            </button>
            
            <button
              onClick={() => onSetCart([])}
              disabled={cart.length === 0}
              className="h-10 border border-outline text-on-surface rounded font-sans text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer outline-none"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
              Cerrar Venta
            </button>
            
            <button
              onClick={openPayModal}
              className="col-span-2 h-14 bg-primary hover:bg-primary-container text-white rounded font-sans text-base font-bold shadow-md shadow-primary/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-3 cursor-pointer outline-none"
            >
              <span className="material-symbols-outlined text-[20px]">point_of_sale</span>
              Pay Total (F5)
            </button>
          </div>

        </div>

      </div>

      {/* ================= MODAL: CHECKOUT PAYMENT (F5) ================= */}
      {payModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-outline-variant w-full max-w-xl shadow-2xl flex flex-col overflow-hidden">
            
            <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center select-none">
              <h3 className="text-base font-bold text-on-surface font-sans flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">payments</span>
                Checkout Payment (F5)
              </h3>
              <button 
                onClick={() => setPayModalOpen(false)}
                className="text-on-surface-variant hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
              {/* Payment inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1.5">Cash (Local MXN)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant">$</span>
                    <input
                      type="text"
                      value={cashLocal}
                      onChange={(e) => setCashLocal(e.target.value)}
                      className="w-full h-10 border border-outline rounded pl-6 pr-3 focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none text-right font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1.5">Credit/Debit Card</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant">$</span>
                    <input
                      type="text"
                      value={cardLocal}
                      onChange={(e) => setCardLocal(e.target.value)}
                      className="w-full h-10 border border-outline rounded pl-6 pr-3 focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none text-right font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1.5">Cash (USD Equiv)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant">US$</span>
                    <input
                      type="text"
                      value={cashUsd}
                      onChange={(e) => setCashUsd(e.target.value)}
                      className="w-full h-10 border border-outline rounded pl-8 pr-3 focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none text-right font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Balance summaries */}
              <div className="bg-surface-container-low border border-outline-variant rounded-md p-4 flex flex-col justify-center select-none font-sans text-xs">
                <div className="flex justify-between text-on-surface pb-2 border-b border-outline-variant/60">
                  <span>Total Due</span>
                  <span className="font-mono font-bold text-sm">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant py-2 border-b border-outline-variant/60">
                  <span>Tendered</span>
                  <span className="font-mono font-medium">${totalTendered.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="font-bold text-on-surface">Change Due</span>
                  <span className="font-mono font-bold text-lg text-primary">${changeDue.toFixed(2)}</span>
                </div>

                {isPaymentReady ? (
                  <div className="mt-3 p-2.5 bg-emerald-50 rounded border border-emerald-200 flex items-center gap-2 text-emerald-700">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span className="font-medium text-[10px]">Payment matches or exceeds. Ready to print receipts.</span>
                  </div>
                ) : (
                  <div className="mt-3 p-2.5 bg-amber-50 rounded border border-amber-200 flex items-center gap-2 text-amber-700">
                    <span className="material-symbols-outlined text-[16px]">info</span>
                    <span className="font-medium text-[10px]">Remaining Balance: ${(total - totalTendered).toFixed(2)} MXN</span>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-lowest flex justify-end gap-3 select-none">
              <button 
                onClick={() => setPayModalOpen(false)}
                className="px-4 h-10 border border-outline text-on-surface rounded font-sans text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={completeCheckoutHandler}
                disabled={!isPaymentReady}
                className="px-5 h-10 bg-primary hover:bg-primary-container text-white rounded font-sans text-xs font-bold shadow-md hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Complete Sale (F8)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL: REGISTER CASH MOVEMENT ================= */}
      {cashModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-outline-variant w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
            
            <div className="px-5 py-3.5 border-b border-outline-variant bg-surface-container-low flex justify-between items-center select-none">
              <h3 className="text-sm font-bold text-on-surface font-sans">Register Cash Movement</h3>
              <button 
                onClick={() => setCashModalOpen(false)}
                className="text-on-surface-variant hover:text-error transition-colors font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4 font-sans text-xs">
              <div className="flex gap-6 select-none font-sans">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="moveType" 
                    checked={cashMoveType === 'in'}
                    onChange={() => setCashMoveType('in')}
                    className="w-4 h-4 text-primary accent-primary cursor-pointer focus:ring-0"
                  />
                  <span className="font-semibold text-on-surface">Cash In (Pay-in)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="moveType" 
                    checked={cashMoveType === 'out'}
                    onChange={() => setCashMoveType('out')}
                    className="w-4 h-4 text-primary accent-primary cursor-pointer focus:ring-0"
                  />
                  <span className="font-semibold text-on-surface">Cash Out (Payout)</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">Amount</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant">$</span>
                  <input
                    type="text"
                    placeholder="0.00"
                    value={cashMoveAmount}
                    onChange={(e) => setCashMoveAmount(e.target.value)}
                    className="w-full h-10 border border-outline rounded pl-6 pr-3 focus:border-tertiary outline-none font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">Reason / Note</label>
                <textarea
                  value={cashMoveNote}
                  onChange={(e) => setCashMoveNote(e.target.value)}
                  placeholder="Enter reason for movement..."
                  className="w-full border border-outline rounded p-2.5 focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none text-sm h-24 resize-none font-sans leading-normal"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-outline-variant bg-surface-container-lowest flex justify-end gap-3 select-none">
              <button 
                onClick={() => setCashModalOpen(false)}
                className="px-4 h-10 border border-outline text-on-surface rounded font-sans text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveCashMovementHandler}
                className="px-4 h-10 bg-on-surface hover:opacity-90 text-white rounded font-sans text-xs font-bold transition-all"
              >
                Save Movement
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
