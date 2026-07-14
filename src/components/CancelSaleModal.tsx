import React, { useState, useEffect, useCallback } from 'react';
import type { Sale } from '../lib/supabase-types';
import { useRefunds } from '../hooks/useRefunds';

interface CancelSaleModalProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  onRefundComplete: () => void;
  showToast: (title: string, desc: string, type: 'success' | 'info' | 'error') => void;
}

export default function CancelSaleModal({
  open,
  onClose,
  userName,
  onRefundComplete,
  showToast,
}: CancelSaleModalProps) {
  const { searchSaleById, listSalesByDate, createRefund, isRefunded, loading } = useRefunds();

  // ── Today's sales ──
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [todaySalesLoading, setTodaySalesLoading] = useState(false);

  // ── Search by number ──
  const [searchId, setSearchId] = useState('');
  const [searchedSale, setSearchedSale] = useState<Sale | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchDone, setSearchDone] = useState(false);

  // ── Confirm refund ──
  const [confirmingSale, setConfirmingSale] = useState<Sale | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/Tijuana',
  });

  const todayISO = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Tijuana' });

  // ── Load today's sales ──
  const loadToday = useCallback(async () => {
    setTodaySalesLoading(true);
    const sales = await listSalesByDate(todayISO);
    // Filter out already-refunded
    const filtered: Sale[] = [];
    for (const s of sales) {
      const refunded = await isRefunded(s.id);
      if (!refunded) filtered.push(s);
    }
    setTodaySales(filtered);
    setTodaySalesLoading(false);
  }, [listSalesByDate, isRefunded, todayISO]);

  useEffect(() => {
    if (open) {
      loadToday();
      setSearchId('');
      setSearchedSale(null);
      setSearchDone(false);
      setConfirmingSale(null);
      setRefundReason('');
    }
  }, [open, loadToday]);

  // ── Search handler ──
  const handleSearch = async () => {
    const id = parseInt(searchId, 10);
    if (isNaN(id) || id <= 0) {
      showToast('Buscar Ticket', 'Ingresá un número de ticket válido.', 'error');
      return;
    }
    setSearchLoading(true);
    setSearchDone(false);
    const sale = await searchSaleById(id);
    setSearchedSale(sale);
    setSearchDone(true);
    setSearchLoading(false);

    if (sale) {
      const refunded = await isRefunded(sale.id);
      if (refunded) {
        showToast('Ticket ya reembolsado', `El Ticket #${id} ya fue cancelado anteriormente.`, 'info');
        setSearchedSale(null);
      }
    }
  };

  // ── Confirm refund handler ──
  const handleConfirmRefund = async () => {
    if (!confirmingSale) return;
    setProcessing(true);

    const refund = await createRefund(confirmingSale, refundReason, userName);
    if (refund) {
      showToast(
        'Venta Cancelada',
        `Ticket #${confirmingSale.id} — Reembolso de $${confirmingSale.total.toFixed(2)} registrado.`,
        'success',
      );
      setConfirmingSale(null);
      setRefundReason('');
      setSearchedSale(null);
      setSearchId('');
      setSearchDone(false);
      onRefundComplete();
      loadToday();
    } else {
      showToast('Error', 'No se pudo procesar el reembolso.', 'error');
    }
    setProcessing(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div
        className="bg-white rounded-xl border border-outline-variant shadow-xl w-[640px] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-3">
          <div>
            <h3 className="text-lg font-sans font-bold text-on-surface">Cancelar Venta</h3>
            <p className="text-xs font-sans text-on-surface-variant font-semibold mt-0.5">{today}</p>
          </div>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-md hover:bg-surface-container-low text-on-surface-variant outline-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-5">

          {/* ── Search by ticket number ── */}
          <div>
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider font-sans mb-1.5 block">
              Buscar por número de ticket
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Ej: 42"
                className="flex-1 h-10 border border-outline rounded px-3 focus:border-tertiary outline-none text-sm font-sans"
                step="any"
              />
              <button
                onClick={handleSearch}
                disabled={searchLoading}
                className="h-10 px-4 bg-primary hover:bg-primary-container disabled:opacity-50 text-white rounded-md text-sm font-bold font-sans shadow-sm outline-none cursor-pointer disabled:cursor-not-allowed"
              >
                {searchLoading ? (
                  <span className="animate-spin material-symbols-outlined text-[18px]">progress_activity</span>
                ) : 'Buscar'}
              </button>
            </div>

            {/* Search result */}
            {searchDone && !searchLoading && (
              <div className="mt-2">
                {searchedSale ? (
                  <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    <div className="text-sm font-sans">
                      <span className="font-bold">Ticket #{searchedSale.id}</span>
                      <span className="text-on-surface-variant ml-2">
                        ${searchedSale.total.toFixed(2)} — {searchedSale.description}
                      </span>
                    </div>
                    <button
                      onClick={() => setConfirmingSale(searchedSale)}
                      className="h-8 px-3 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-bold font-sans shadow-sm outline-none cursor-pointer"
                    >
                      Cancelar Venta
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-sans text-red-600 font-semibold">Ticket no encontrado.</p>
                )}
              </div>
            )}
          </div>

          {/* ── Divider ── */}
          <div className="border-t border-outline-variant" />

          {/* ── Today's sales ── */}
          <div>
            <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider font-sans mb-2">
              Ventas de Hoy
            </h4>

            {todaySalesLoading ? (
              <div className="flex items-center justify-center py-8">
                <span className="animate-spin material-symbols-outlined text-on-surface-variant">progress_activity</span>
              </div>
            ) : todaySales.length === 0 ? (
              <p className="text-sm font-sans text-on-surface-variant text-center py-4">
                No hay ventas hoy o todas están canceladas.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                {todaySales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-sans text-on-surface bg-surface-container-high px-1.5 py-0.5 rounded">
                          #{sale.id}
                        </span>
                        <span className="text-sm font-bold font-sans text-on-surface">
                          ${sale.total.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-[11px] font-sans text-on-surface-variant truncate mt-0.5">
                        {sale.description}
                      </p>
                    </div>
                    <button
                      onClick={() => setConfirmingSale(sale)}
                      className="ml-3 h-8 px-3 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-bold font-sans shadow-sm outline-none cursor-pointer shrink-0"
                    >
                      Cancelar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Dialog */}
        {confirmingSale && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl border border-outline-variant shadow-xl w-[420px] p-6">
              <h4 className="text-base font-bold font-sans text-on-surface">¿Estás seguro?</h4>
              <p className="text-sm font-sans text-on-surface-variant mt-2 leading-relaxed">
                Se va a <strong>cancelar el Ticket #{confirmingSale.id}</strong> por{' '}
                <strong>${confirmingSale.total.toFixed(2)}</strong>.
              </p>
              <p className="text-sm font-sans text-on-surface-variant mt-1">
                Efectivo: ${confirmingSale.cash_amount.toFixed(2)}
                {confirmingSale.card_amount > 0 && ` · Tarjeta: $${confirmingSale.card_amount.toFixed(2)}`}
                {confirmingSale.usd_amount > 0 && ` · USD: $${confirmingSale.usd_amount.toFixed(2)}`}
              </p>
              <p className="text-xs font-sans text-red-600 font-semibold mt-2">
                El registro de la venta original NO se elimina. Se agregará un reembolso en los reportes.
              </p>

              <div className="mt-4">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider font-sans block mb-1">
                  Motivo (opcional)
                </label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Cliente devolvió producto"
                  className="w-full h-10 border border-outline rounded px-3 focus:border-tertiary outline-none text-sm font-sans"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setConfirmingSale(null); setRefundReason(''); }}
                  disabled={processing}
                  className="flex-1 h-10 border border-outline-variant rounded-md text-sm font-semibold font-sans outline-none cursor-pointer disabled:opacity-50"
                >
                  No, cancelar
                </button>
                <button
                  onClick={handleConfirmRefund}
                  disabled={processing}
                  className="flex-1 h-10 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-md text-sm font-bold font-sans shadow-sm outline-none cursor-pointer disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <span className="animate-spin material-symbols-outlined text-[18px]">progress_activity</span>
                  ) : 'Sí, reembolsar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
