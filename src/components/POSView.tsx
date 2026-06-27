import React, { useState, useMemo } from 'react';
import type { CartItem } from '../types';
import type { Product } from '../lib/supabase-types';
import InventoryPanel from './InventoryPanel';
import DenominationPad from './DenominationPad';
import { DENOMS, emptyCounts, calcTotal, calcChange } from '../lib/denominations';
import type { DenomCounts } from '../lib/denominations';

function getCartQtyForProduct(cart: CartItem[], productId: number) {
  return cart
    .filter(i => i.productId === productId)
    .reduce((sum, i) => sum + i.qty, 0);
}

interface POSViewProps {
  cart: CartItem[];
  onSetCart: (cart: CartItem[] | ((p: CartItem[]) => CartItem[])) => void;
  onCompleteCheckout: (amountLocal: number, amountCard: number, amountUsd: number) => void;
  onRegisterCashMovement: (type: 'in' | 'out', amount: number, note: string) => void;
  showToast: (title: string, desc: string, type: 'success' | 'info' | 'error') => void;
  products: Product[];
  onRefetchProducts: () => Promise<void>;
  taxRate: number;
  exchangeRate: number;
}

export default function POSView({
  cart,
  onSetCart,
  onCompleteCheckout,
  onRegisterCashMovement,
  showToast,
  products,
  taxRate,
  exchangeRate,
  onRefetchProducts
}: POSViewProps) {
  // Quick adder states
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>(undefined);
  const [nameError, setNameError] = useState('');
  const [qtyError, setQtyError] = useState('');
  const [priceError, setPriceError] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState<'venta' | 'inventario'>('venta');

  // Modals state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [cashModalOpen, setCashModalOpen] = useState(false);

  // Pay modal inputs
  const [cashLocal, setCashLocal] = useState('0.00');
  const [cardLocal, setCardLocal] = useState('0.00');
  const [cashUsd, setCashUsd] = useState('0.00');
  const [calcCounts, setCalcCounts] = useState<DenomCounts>(emptyCounts);

  // Cash movement inputs
  const [cashMoveType, setCashMoveType] = useState<'in' | 'out'>('in');
  const [cashMoveAmount, setCashMoveAmount] = useState('');
  const [cashMoveNote, setCashMoveNote] = useState('');
  const [cashMoveCounts, setCashMoveCounts] = useState<DenomCounts>(emptyCounts);

  // Stock validation helper
  const stockInfo = useMemo(() => {
    if (!selectedProductId) return { stock: Infinity, inCart: 0, available: Infinity };
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return { stock: Infinity, inCart: 0, available: Infinity };
    const inCart = getCartQtyForProduct(cart, selectedProductId);
    return { stock: product.stock, inCart, available: product.stock - inCart };
  }, [selectedProductId, products, cart]);

  // Auto-suggestions calculation
  const suggestions = useMemo(() => {
    if (!itemName) return [];
    return products.filter(p =>
      p.name.toLowerCase().includes(itemName.toLowerCase())
    ).slice(0, 4);
  }, [itemName, products]);

  // Totals calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  }, [cart]);

  const effectiveTaxRate = taxRate; // ya viene parseado desde App

  const tax = useMemo(() => {
    return subtotal * (effectiveTaxRate / 100);
  }, [subtotal, effectiveTaxRate]);

  const total = useMemo(() => {
    return subtotal + tax;
  }, [subtotal, tax]);

  const totalUsd = useMemo(() => {
    return exchangeRate > 0 ? total / exchangeRate : 0;
  }, [total, exchangeRate]);

  // Handle click on suggestion
  const selectSuggestion = (name: string, price: number, productId?: number) => {
    setItemName(name);
    setItemPrice(String(price));
    setSelectedProductId(productId);
    setShowSuggestions(false);
  };

  // Add Item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    if (!itemName?.trim()) {
      setNameError('El nombre del producto es obligatorio');
      hasError = true;
    } else {
      setNameError('');
    }

    const finalPrice = Math.max(0, Number(itemPrice) || 0);
    if (finalPrice <= 0) {
      setPriceError('El precio debe ser mayor a 0');
      hasError = true;
    } else {
      setPriceError('');
    }

    if (selectedProductId && itemQty > stockInfo.available) {
      setQtyError(`Stock insuficiente: solo hay ${stockInfo.available} disponibles (${stockInfo.inCart} en carro de ${stockInfo.stock})`);
      hasError = true;
    } else {
      setQtyError('');
    }

    if (hasError) return;
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
          price: finalPrice,
          productId: selectedProductId,
        }];
      }
    });

    setItemName('');
    setItemPrice('');
    setItemQty(1);
    setSelectedProductId(undefined);
    setQtyError('');
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
        let nextQty = dir === 'up' ? item.qty + 1 : Math.max(1, item.qty - 1);
        if (dir === 'up' && item.productId) {
          const product = products.find(p => p.id === item.productId);
          if (product && nextQty > product.stock) {
            showToast('Stock insuficiente', `Solo hay ${product.stock} disponibles de "${item.name}".`, 'error');
            nextQty = item.qty;
          }
        }
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
    setCashLocal('0.00');
    setCardLocal('0.00');
    setCashUsd('0.00');
    setCalcCounts(emptyCounts());
    setPayModalOpen(true);
  };

  const closePayModal = () => {
    setPayModalOpen(false);
  };

  const handleProcessPay = () => {
    const cash = Math.max(0, Number(cashLocal) || 0);
    const card = Math.max(0, Number(cardLocal) || 0);
    const usd = Math.max(0, Number(cashUsd) || 0);
    const usdValue = usd * exchangeRate;
    const sumPay = cash + card + usdValue;
    if (sumPay < total) {
      showToast('Pago insuficiente', `Faltan $${(total - sumPay).toFixed(2)} para cubrir el total.`, 'error');
      return;
    }
    onCompleteCheckout(cash, card, usd);
    closePayModal();
  };

  const openCashModal = () => {
    setCashModalOpen(true);
  };

  const closeCashModal = () => {
    setCashModalOpen(false);
  };

  const handleCashMovement = () => {
    const amount = Math.max(0, Number(cashMoveAmount) || 0);
    if (amount <= 0) {
      showToast('Cantidad Inválida', 'El monto debe ser mayor a 0.', 'error');
      return;
    }
    const parts = DENOMS
      .filter(d => (cashMoveCounts[d.value] || 0) > 0)
      .map(d => `${cashMoveCounts[d.value]}× ${d.label}`)
      .join(', ');
    const noteWithDenoms = cashMoveNote.trim() + (parts ? ` | ${parts}` : '');
    if (!cashMoveNote.trim()) {
      showToast('Falta Nota', 'Describí el motivo del movimiento.', 'error');
      return;
    }
    onRegisterCashMovement(cashMoveType, amount, noteWithDenoms);
    setCashMoveAmount('');
    setCashMoveNote('');
    setCashMoveCounts(emptyCounts());
    closeCashModal();
  };

  return (
    <div className="flex-1 flex flex-col gap-4 select-none h-full">
      {/* Header Label */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-on-surface tracking-tight font-sans">Punto de Venta</h2>
          <p className="text-xs font-sans text-on-surface-variant font-medium mt-1">Registrar cobros y movimientos de caja.</p>
        </div>
        <div className="flex gap-1 bg-surface-container-high rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('venta')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold font-sans transition-all outline-none cursor-pointer ${activeTab === 'venta' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Venta
          </button>
          <button
            onClick={() => setActiveTab('inventario')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold font-sans transition-all outline-none cursor-pointer ${activeTab === 'inventario' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Inventario
          </button>
        </div>
      </div>

      {activeTab === 'venta' ? (
        /* Main Layout Caja-Carrito */
        <div className="flex-1 flex gap-5 min-h-0">
          
          {/* LEFT Panel: Quick add + Products grid */}
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
            {/* Quick Add Form */}
            <form onSubmit={handleAddItem} className="bg-white border border-outline-variant rounded-md p-4 shadow-sm relative">
              <div className="grid grid-cols-5 gap-2">
                <div className="relative col-span-2">
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const cleaned = raw.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9\s]/g, '').slice(0, 25);
                      setItemName(cleaned);
                      setNameError('');
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Nombre del producto"
                    className={`h-10 w-full border ${nameError ? 'border-error' : 'border-outline'} rounded px-3 focus:border-tertiary outline-none text-sm font-sans`}
                    autoComplete="off"
                    maxLength={25}
                  />
                  {nameError && (
                    <p className="text-[10px] font-sans text-error font-semibold mt-0.5">{nameError}</p>
                  )}
                  {/* Suggestions dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 top-full mt-1 w-full bg-white border border-outline-variant rounded-md shadow-lg z-20">
                      {suggestions.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onMouseDown={() => selectSuggestion(p.name, p.price, p.id)}
                          className="w-full text-left px-3 py-2 hover:bg-surface-container-low text-xs font-sans font-semibold flex justify-between items-center outline-none cursor-pointer"
                        >
                          <span className="truncate">{p.name}</span>
                          <span className="font-sans text-tertiary font-bold ml-2 shrink-0">${p.price.toFixed(2)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <input
                    type="number"
                    value={itemQty || ''}
                    onChange={(e) => {
                      const raw = Number(e.target.value);
                      const val = Math.max(1, raw || 1);
                      setItemQty(val);
                      if (selectedProductId && val > stockInfo.available) {
                        setQtyError(`Stock disponible: ${stockInfo.available} (${stockInfo.inCart} en carro de ${stockInfo.stock})`);
                      } else {
                        setQtyError('');
                      }
                    }}
                    placeholder="Cant."
                    className={`h-10 w-full border ${qtyError ? 'border-error' : 'border-outline'} rounded px-3 focus:border-tertiary outline-none text-sm font-sans`}
                    min="1"
                  />
                  {qtyError && (
                    <p className="text-[10px] font-sans text-error font-semibold mt-0.5">{qtyError}</p>
                  )}
                </div>
                <div>
                  <input
                    type="number"
                    value={itemPrice}
                    onChange={(e) => {
                      setItemPrice(e.target.value);
                      setPriceError('');
                    }}
                    placeholder="$ Precio"
                    className={`h-10 w-full border ${priceError ? 'border-error' : 'border-outline'} rounded px-3 focus:border-tertiary outline-none text-sm font-sans`}
                    step="0.01"
                  />
                  {priceError && (
                    <p className="text-[10px] font-sans text-error font-semibold mt-0.5">{priceError}</p>
                  )}
                </div>
                <div>
                  <button
                    type="submit"
                    className="h-10 w-full bg-primary hover:bg-primary-container text-white rounded font-sans text-xs font-semibold shadow-sm flex items-center justify-center gap-1 outline-none cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
                    Agregar
                  </button>
                </div>
              </div>
            </form>

            {/* Products Grid */}
            <div className="bg-white border border-outline-variant rounded-md p-4 shadow-sm flex-1 min-h-0 overflow-y-auto">
              {products.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs font-sans text-on-surface-variant font-medium">No hay productos en el catálogo.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {products.map(p => {
                    const outOfStock = p.stock <= 0;
                    const inCart = getCartQtyForProduct(cart, p.id);
                    const remaining = p.stock - inCart;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          if (outOfStock) {
                            showToast('Sin stock', `"${p.name}" no tiene unidades disponibles.`, 'error');
                            return;
                          }
                          setItemName(p.name);
                          setItemPrice(String(p.price));
                          setSelectedProductId(p.id);
                          setQtyError('');
                        }}
                        className={`border rounded-md p-3 text-left transition-all outline-none ${outOfStock ? 'border-error/30 opacity-50 cursor-not-allowed' : 'border-outline-variant hover:bg-surface-container-low hover:border-primary cursor-pointer'}`}
                      >
                        <h4 className="text-xs font-bold text-on-surface truncate font-sans">{p.name}</h4>
                        <p className="font-sans text-tertiary font-bold text-xs mt-1">${p.price.toFixed(2)}</p>
                        <p className="text-[10px] font-sans text-on-surface-variant mt-0.5">{p.category}</p>
                        <p className={`text-[10px] font-sans ${remaining <= 0 ? 'text-error font-bold' : p.stock <= 5 ? 'text-orange-500 font-semibold' : 'text-on-surface-variant'}`}>
                          {outOfStock ? 'Sin stock' : remaining === p.stock ? `${p.stock} en stock` : `${remaining} disp. (${inCart} en carro)`}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT Panel: Cart */}
          <div className="w-[380px] shrink-0 bg-white border border-outline-variant rounded-md shadow-sm flex flex-col">
            
            {/* Cart header */}
            <div className="px-4 py-2 border-b border-outline-variant flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-on-surface font-sans flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">shopping_cart</span>
                Carro ({cart.length})
              </h3>
              <button
                onClick={handleCancelSale}
                className="text-[11px] font-sans font-semibold bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 transition-all outline-none cursor-pointer"
              >
                Cancelar Venta
              </button>
            </div>

            {/* Items scrolling list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <span className="material-symbols-outlined text-4xl text-outline-variant">add_circle</span>
                  <p className="font-sans text-xs text-on-surface-variant text-center max-w-[240px] font-medium leading-relaxed">
                    Utiliza la barra superior para buscar productos cargados en el inventario o escanea códigos.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 py-2 px-2 rounded hover:bg-surface-container-low group">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-sans text-xs font-bold text-on-surface truncate">{item.name}</h4>
                      <p className="font-sans text-[11px] text-on-surface-variant font-semibold">${item.price.toFixed(2)} c/u</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleChangeQty(item.id, 'down')}
                        className="w-7 h-7 rounded border border-outline-variant flex items-center justify-center hover:bg-surface-container-low font-sans text-sm font-bold outline-none cursor-pointer"
                      >-</button>
                      <span className="w-8 text-center font-sans text-xs font-bold">{item.qty}</span>
                      <button
                        onClick={() => handleChangeQty(item.id, 'up')}
                        className="w-7 h-7 rounded border border-outline-variant flex items-center justify-center hover:bg-surface-container-low font-sans text-sm font-bold outline-none cursor-pointer"
                      >+</button>
                    </div>
                    <p className="w-16 text-right font-sans text-xs font-bold text-on-surface">${(item.price * item.qty).toFixed(2)}</p>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 rounded hover:bg-error-container text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-all outline-none cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Totals + Action Buttons */}
            <div className="border-t border-outline-variant p-4 space-y-2">
              <div className="flex justify-between text-xs font-sans">
                <span className="text-on-surface-variant font-semibold">Subtotal</span>
                <span className="font-bold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-sans">
                <span className="text-on-surface-variant font-semibold">IVA ({effectiveTaxRate}%)</span>
                <span className="font-bold">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-sans pt-2 border-t border-outline-variant">
                <span className="font-bold text-on-surface">Total</span>
                <span className="font-bold text-primary text-lg">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-sans text-on-surface-variant font-semibold">
                <span>{`Tipo de Cambio (USD 1.00 = MX$${exchangeRate.toFixed(2)})`}</span>
                <span>≈ ${totalUsd.toFixed(2)} USD</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={openCashModal}
                  className="flex-1 h-10 border border-outline-variant rounded-md text-xs font-semibold font-sans hover:bg-surface-container-low transition-all outline-none cursor-pointer"
                >
                  Movimiento de Caja
                </button>
                <button
                  onClick={openPayModal}
                  className="flex-1 h-10 bg-primary hover:bg-primary-container text-white rounded-md text-xs font-bold font-sans shadow-sm shadow-primary/20 outline-none cursor-pointer"
                >
                  Cobrar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <InventoryPanel
            products={products}
            onRefetchProducts={onRefetchProducts}
            showToast={showToast}
          />
        </div>
      )}

      {/* Payment Modal Overlay */}
      {payModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={closePayModal}>
          <div className="bg-white rounded-xl border border-outline-variant shadow-xl w-[560px] p-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-sans font-bold text-on-surface">Procesar Pago</h3>
            <p className="text-sm font-sans text-on-surface-variant font-semibold mt-1.5">Total a cobrar: <span className="text-primary font-bold text-base">${total.toFixed(2)}</span></p>

            {/* OXXO-style denomination pad */}
            <div className="mt-5">
              <DenominationPad counts={calcCounts} onChange={(c) => {
                setCalcCounts(c);
                setCashLocal(String(calcTotal(c)));
              }} />
              {(() => {
                const recv = calcTotal(calcCounts);
                const { change, short } = calcChange(recv + Math.max(0, Number(cardLocal) || 0) + (Math.max(0, Number(cashUsd) || 0) * exchangeRate), total);
                return (
                  <div className="mt-3 space-y-1.5 text-sm font-sans border-t border-outline-variant pt-3">
                    {recv > 0 && (
                      <div className="flex justify-between font-semibold text-on-surface-variant">
                        <span>Efectivo recibido</span>
                        <span className="font-bold text-on-surface">${recv.toFixed(2)}</span>
                      </div>
                    )}
                    {short > 0 ? (
                      <div className="flex justify-between text-error font-bold">
                        <span>Saldo pendiente</span>
                        <span>${short.toFixed(2)}</span>
                      </div>
                    ) : change > 0 ? (
                      <div className="flex justify-between text-tertiary font-bold">
                        <span>Cambio a entregar</span>
                        <span>${change.toFixed(2)}</span>
                      </div>
                    ) : null}
                  </div>
                );
              })()}
            </div>

            {/* Card and USD secondary inputs */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <InputField label="Tarjeta (MXN)" value={cardLocal} onChange={setCardLocal} />
              <InputField label="Dólares (USD)" value={cashUsd} onChange={setCashUsd} />
            </div>

            {(() => {
              const cash = Math.max(0, Number(cashLocal) || 0);
              const card = Math.max(0, Number(cardLocal) || 0);
              const usdValue = Math.max(0, Number(cashUsd) || 0) * exchangeRate;
              const sumPay = cash + card + usdValue;
              const change = sumPay - total;
              return (
                <div className="mt-4 pt-3 border-t border-outline-variant space-y-1 text-xs font-sans">
                  <div className="flex justify-between text-on-surface-variant font-semibold">
                    <span>Total cobrado</span>
                    <span>${sumPay.toFixed(2)}</span>
                  </div>
                  {change >= 0 && (
                    <div className="flex justify-between text-tertiary font-bold">
                      <span>Cambio</span>
                      <span>${change.toFixed(2)}</span>
                    </div>
                  )}
                  {change < 0 && (
                    <div className="flex justify-between text-red-600 font-bold">
                      <span>Faltante</span>
                      <span>${Math.abs(change).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="flex gap-3 mt-6">
              <button onClick={closePayModal} className="flex-1 h-12 border border-outline-variant rounded-md text-sm font-semibold font-sans outline-none cursor-pointer">
                Cancelar
              </button>
              <button onClick={handleProcessPay} className="flex-1 h-12 bg-primary hover:bg-primary-container text-white rounded-md text-sm font-bold font-sans shadow-sm outline-none cursor-pointer">
                Confirmar Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cash Movement Modal */}
      {cashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={closeCashModal}>
          <div className="bg-white rounded-xl border border-outline-variant shadow-xl w-[380px] p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-sans font-bold text-on-surface">Movimiento de Caja</h3>
            <p className="text-xs font-sans text-on-surface-variant font-semibold mt-1">Registrar entrada o salida de efectivo.</p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider font-sans">Tipo</label>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => setCashMoveType('in')}
                    className={`flex-1 h-10 rounded-md border text-xs font-semibold font-sans transition-all outline-none cursor-pointer ${cashMoveType === 'in' ? 'bg-success-container text-success border-success' : 'border-outline-variant'}`}
                  >
                    Entrada
                  </button>
                  <button
                    onClick={() => setCashMoveType('out')}
                    className={`flex-1 h-10 rounded-md border text-xs font-semibold font-sans transition-all outline-none cursor-pointer ${cashMoveType === 'out' ? 'bg-error-container text-error border-error' : 'border-outline-variant'}`}
                  >
                    Salida
                  </button>
                </div>
              </div>
              <div className="border border-outline-variant rounded-md p-3">
                <p className="text-[10px] font-bold font-sans text-on-surface-variant uppercase tracking-wider mb-2">Desglose por denominación</p>
                <DenominationPad counts={cashMoveCounts} onChange={(c) => {
                  setCashMoveCounts(c);
                  setCashMoveAmount(String(calcTotal(c)));
                }} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider font-sans">Nota</label>
                <input
                  type="text"
                  value={cashMoveNote}
                  onChange={(e) => setCashMoveNote(e.target.value)}
                  placeholder="Motivo del movimiento"
                  className="h-10 border border-outline rounded px-3 focus:border-tertiary outline-none text-sm font-sans"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={closeCashModal} className="flex-1 h-10 border border-outline-variant rounded-md text-xs font-semibold font-sans outline-none cursor-pointer">
                Cancelar
              </button>
              <button
                onClick={handleCashMovement}
                className="flex-1 h-10 bg-primary hover:bg-primary-container text-white rounded-md text-xs font-bold font-sans shadow-sm outline-none cursor-pointer"
              >
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InputField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider font-sans">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 border border-outline rounded px-3 focus:border-tertiary outline-none text-sm font-sans"
        step="0.01"
      />
    </div>
  );
}
