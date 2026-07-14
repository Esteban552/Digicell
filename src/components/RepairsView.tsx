import React, { useState, useMemo, useEffect } from 'react';
import type { RepairOrder } from '../types';
import ServiciosModal from './ServiciosModal';
import CustomerDetailsSection from './repairs/CustomerDetailsSection';
import DeviceInfoSection from './repairs/DeviceInfoSection';
import IntakeChecklistSection from './repairs/IntakeChecklistSection';
import ServiceDetailsSection from './repairs/ServiceDetailsSection';
import OrderStatusSection from './repairs/OrderStatusSection';
import FinancesSection from './repairs/FinancesSection';
import ActionsPanel from './repairs/ActionsPanel';
import SearchModal from './repairs/SearchModal';
import PrintModal from './repairs/PrintModal';
import DeliveryPaymentModal from './repairs/DeliveryPaymentModal';

interface RepairsViewProps {
  repairs: RepairOrder[];
  selectedId: string;
  onUpdateRepair: (id: string, updated: Partial<RepairOrder>) => void;
  onSaveRepairOrder: (id: string, extraPayment?: number) => Promise<boolean>;
  showToast: (title: string, desc: string, type: 'success' | 'info' | 'error') => void;
  searchModalOpen: boolean;
  onSetSearchModalOpen: (open: boolean) => void;
  serviciosModalOpen: boolean;
  onSetServiciosModalOpen: (open: boolean) => void;
  onDeleteCompletedRepairs: (count: number) => Promise<void>;
  draftRepair: RepairOrder;
  draftId: string;
  onSelectRepair: (id: string) => void;
  isSaving?: boolean;
  printModalOpen: boolean;
  onSetPrintModalOpen: (open: boolean) => void;
  onReprint?: () => void;
}

export default function RepairsView({
  repairs, selectedId, onUpdateRepair, onSaveRepairOrder, showToast,
  searchModalOpen, onSetSearchModalOpen, serviciosModalOpen, onSetServiciosModalOpen,
  onDeleteCompletedRepairs, draftRepair, draftId, onSelectRepair, isSaving,
  printModalOpen, onSetPrintModalOpen, onReprint,
}: RepairsViewProps) {
  const [deliveryConfirmPending, setDeliveryConfirmPending] = useState(false);
  const [deliveryPaymentOpen, setDeliveryPaymentOpen] = useState(false);

  useEffect(() => { setDeliveryConfirmPending(false); }, [selectedId]);

  const isDraft = selectedId === draftId;
  const activeRepair = useMemo(() => {
    if (selectedId === draftId) return draftRepair;
    return repairs.find((r) => r.id === selectedId) || repairs[0];
  }, [repairs, selectedId, draftId, draftRepair]);
  const isDelivered = !isDraft && activeRepair?.status === 'delivered' && !deliveryConfirmPending;

  const [errors, setErrors] = useState<Record<string, string>>({});
  const onSetError = (field: string, msg: string) => setErrors(p => ({ ...p, [field]: msg }));
  const onClearError = (field: string) => setErrors(p => { const n = { ...p }; delete n[field]; return n; });

  const remainingCalculated = useMemo(() => {
    if (!activeRepair) return 0;
    return Math.max(0, (activeRepair.totalCost || 0) - (activeRepair.advancePaid || 0) - (activeRepair.abonosPaid || 0));
  }, [activeRepair]);

  const today = new Date().toISOString().split('T')[0];

  if (!activeRepair) {
    return (
      <div className="p-8 text-center bg-white border border-outline-variant rounded-md shadow-sm select-none font-sans">
        <p className="text-on-surface-variant font-medium">
          Ninguna orden cargada. Presiona "+ Nueva Reparación" en la barra lateral para iniciar.
        </p>
      </div>
    );
  }

  const handleUpdateField = (key: keyof RepairOrder, value: string | number | boolean) => {
    if (isDelivered) return;
    onUpdateRepair(activeRepair.id, { [key]: value });
  };

  const triggerWhatsApp = () => {
    const phoneClean = activeRepair.clientPhone.replace(/\D/g, '');
    if (!phoneClean || phoneClean.length < 10) {
      showToast('WhatsApp no disponible', 'El cliente no tiene un número de teléfono válido.', 'error');
      return;
    }
    const text = encodeURIComponent(
      `Hola ${activeRepair.clientName}, de parte de Digicell Repairs. Su dispositivo ${activeRepair.deviceBrand} ${activeRepair.deviceModel} (Folio #${activeRepair.id}) está registrado bajo el estado: "${activeRepair.status.toUpperCase()}". Costo estimado: $${activeRepair.totalCost.toFixed(2)}, Anticipo: $${activeRepair.advancePaid.toFixed(2)}. Saldo pendiente: $${remainingCalculated.toFixed(2)}.`,
    );
    window.open(`https://api.whatsapp.com/send?phone=${phoneClean}&text=${text}`, '_blank', 'noreferrer');
    showToast('WhatsApp Preparado', 'Chat abierto con plantilla de entrega.', 'success');
  };

  /**
   * Saves the repair with an optional extra payment.
   * NEVER opens the modal — that's handled by the caller.
   */
  const confirmOrPay = async (paymentAmount = 0) => {
    const ok = await onSaveRepairOrder(activeRepair.id, paymentAmount);
    if (ok && deliveryConfirmPending) {
      setDeliveryConfirmPending(false);
      if (onReprint) onReprint();
    }
  };

  /** Handles the blue "Confirmar Entrega" button click. */
  const handleConfirmDelivery = () => {
    if (remainingCalculated > 0) {
      setDeliveryPaymentOpen(true);
      return;
    }
    // No remaining balance — save and deliver directly
    confirmOrPay(0);
  };

  /** Called by DeliveryPaymentModal when user clicks "Cobrar y Entregar" / "Entregar". */
  const handlePaymentConfirm = async (amount: number) => {
    setDeliveryPaymentOpen(false);
    await confirmOrPay(amount);
  };

  /** Handles the regular "Guardar Cambios" button click. */
  const handleSaveOrConfirm = async () => {
    if (activeRepair.status === 'delivered' && remainingCalculated > 0) {
      setDeliveryPaymentOpen(true);
      return;
    }
    await onSaveRepairOrder(activeRepair.id);
  };

  const sectionProps = {
    repair: activeRepair,
    isDraft,
    isDelivered,
    errors,
    onUpdateField: handleUpdateField,
    onClearError,
    onSetError,
  };

  return (
    <div className="flex-1 flex flex-col gap-6 font-sans">
      <div className="select-none mb-2">
        <h2 className="text-2xl font-bold text-on-surface font-sans tracking-tight">Formulario de Recepción</h2>
        <p className="text-[11px] font-semibold text-on-surface-variant tracking-wider uppercase mt-1 font-sans">
          Cargado actualmente: Folio #{activeRepair.id} — {activeRepair.clientName || 'Cliente sin nombre'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <CustomerDetailsSection {...sectionProps} />
          <DeviceInfoSection {...sectionProps} />
          <IntakeChecklistSection {...sectionProps} />
          <ServiceDetailsSection {...sectionProps} />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <OrderStatusSection
            {...sectionProps}
            today={today}
            onDeliveryConfirm={setDeliveryConfirmPending}
          />
          <FinancesSection
            repair={activeRepair}
            isDraft={isDraft}
            isDelivered={isDelivered}
            errors={errors}
            remainingCalculated={remainingCalculated}
            onClearError={onClearError}
            onSetError={onSetError}
            onDirectUpdate={onUpdateRepair}
          />
          <ActionsPanel
            repair={activeRepair}
            isDraft={isDraft}
            isDelivered={isDelivered}
            deliveryConfirmPending={deliveryConfirmPending}
            remainingCalculated={remainingCalculated}
            onUpdateField={handleUpdateField}
            onSave={handleSaveOrConfirm}
            onConfirmDelivery={handleConfirmDelivery}
            isSaving={isSaving}
            onPrint={() => onSetPrintModalOpen(true)}
            onWhatsApp={triggerWhatsApp}
          />
        </div>
      </div>

      <SearchModal
        open={searchModalOpen}
        repairs={repairs}
        onSelect={(id) => { onSelectRepair(id); onSetSearchModalOpen(false); }}
        onClose={() => onSetSearchModalOpen(false)}
      />

      <PrintModal
        open={printModalOpen}
        repair={activeRepair}
        remainingCalculated={remainingCalculated}
        onClose={() => onSetPrintModalOpen(false)}
      />

      <ServiciosModal
        open={serviciosModalOpen}
        onClose={() => onSetServiciosModalOpen(false)}
        repairs={repairs}
        onDeleteCompletedRepairs={onDeleteCompletedRepairs}
        onSelectRepair={onSelectRepair}
        isSaving={isSaving}
      />

      <DeliveryPaymentModal
        open={deliveryPaymentOpen}
        clientName={activeRepair.clientName || 'N/A'}
        remaining={remainingCalculated}
        onConfirm={handlePaymentConfirm}
        onClose={() => setDeliveryPaymentOpen(false)}
      />
    </div>
  );
}
