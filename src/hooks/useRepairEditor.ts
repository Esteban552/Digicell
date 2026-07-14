import { useState, useEffect, useCallback } from 'react';
import { RepairOrder, ActiveView } from '../types';
import { supabase } from '../lib/supabase';
import { validateRepair } from '../lib/repairValidation';
import { useRepairOrders } from './useRepairOrders';
import { getBusinessInfo } from '../lib/businessInfo';
import { printHTML, repairReceiptHTML } from '../lib/printIframe';
import type { ToastMessage } from './useToast';

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
    footnote: getBusinessInfo().warrantyText,
    createdAt: new Date().toISOString(),
  };
}

export function useRepairEditor(
  showToast: (title: string, desc: string, type?: ToastMessage['type']) => void,
  refetchLogs: () => void,
  refetchCashMovements: () => void,
  onNavigate: (view: ActiveView) => void,
  confirm?: (opts: { title: string; message: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean }) => Promise<boolean>,
) {
  const {
    data: dbRepairs,
    loading: repairsLoading,
    error: repairsError,
    update: syncRepairToDb,
    remove: removeRepairFromDb,
    refetch: refetchRepairs,
  } = useRepairOrders();

  const [repairs, setRepairs] = useState<RepairOrder[]>([]);
  useEffect(() => {
    if (!repairsLoading) setRepairs(dbRepairs);
  }, [dbRepairs, repairsLoading]);

  const [draftRepair, setDraftRepair] = useState<RepairOrder>(blankRepair);
  const [selectedRepairId, setSelectedRepairId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (repairs.length > 0 && !selectedRepairId) {
      setSelectedRepairId(repairs[0].id);
    }
  }, [repairs, selectedRepairId]);

  const handleCreateNewRepair = useCallback(() => {
    setDraftRepair(blankRepair());
    setSelectedRepairId(DRAFT_ID);
    onNavigate('repairs');
    showToast('Nueva Nota', 'Completá los datos y guardá para asignar el folio.', 'info');
  }, [showToast, onNavigate]);

  const handleUpdateRepair = useCallback((id: string, updatedFields: Partial<RepairOrder>) => {
    if (id === DRAFT_ID) {
      setDraftRepair(prev => ({ ...prev, ...updatedFields }));
    } else {
      setRepairs(prev => prev.map(r => r.id === id ? { ...r, ...updatedFields } : r));
    }
  }, []);

  const handleSaveRepairOrder = useCallback(async (id: string, extraPayment = 0): Promise<boolean> => {
    setIsSaving(true);
    try {
    let orderRef = id === DRAFT_ID ? draftRepair : repairs.find(r => r.id === id);
    if (!orderRef) return false;

    if (extraPayment > 0) {
      const remaining = Math.max(0, orderRef.totalCost - orderRef.advancePaid - orderRef.abonosPaid);
      const addToAbonos = Math.min(extraPayment, remaining);
      orderRef = { ...orderRef, abonosPaid: orderRef.abonosPaid + addToAbonos, remainingBalance: 0 };
    }

    if (orderRef.status === 'delivered' && !orderRef.warrantyEnd) {
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      orderRef = { ...orderRef, warrantyEnd: thirtyDaysFromNow };
    }

    const errors = validateRepair(orderRef);

    if (errors.length > 0) {
      showToast('Corregí los errores', errors.join(' '), 'error');
      return false;
    }

    if (id === DRAFT_ID) {
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
        status: orderRef.status,
        technician: orderRef.technician,
        delivery_date: orderRef.deliveryDate,
        warranty_end: orderRef.warrantyEnd,
        total_cost: orderRef.totalCost,
        advance_paid: orderRef.advancePaid,
        abonos_paid: orderRef.abonosPaid,
        footnote: orderRef.footnote,
        created_by: user?.id ?? null,
      };
      const { data: row, error: err } = await supabase
        .from('repair_orders')
        .insert(payload)
        .select()
        .single();

      if (err || !row) {
        showToast('Error', 'No se pudo guardar la orden.', 'error');
        return false;
      }

      const newRepair: RepairOrder = {
        id: String(row.id),
        clientName: orderRef.clientName,
        clientPhone: orderRef.clientPhone,
        clientEmail: orderRef.clientEmail,
        deviceBrand: orderRef.deviceBrand,
        deviceModel: orderRef.deviceModel,
        deviceSerial: orderRef.deviceSerial,
        devicePassword: orderRef.devicePassword,
        deviceColor: orderRef.deviceColor,
        powersOn: orderRef.powersOn,
        batteryPercent: orderRef.batteryPercent,
        chargerLeft: orderRef.chargerLeft,
        coverLeft: orderRef.coverLeft,
        receivingCondition: orderRef.receivingCondition,
        problemReported: orderRef.problemReported,
        internalNotes: orderRef.internalNotes,
        status: orderRef.status,
        technician: orderRef.technician,
        deliveryDate: orderRef.deliveryDate,
        warrantyEnd: orderRef.warrantyEnd,
        totalCost: orderRef.totalCost,
        advancePaid: orderRef.advancePaid,
        abonosPaid: orderRef.abonosPaid,
        remainingBalance: orderRef.remainingBalance,
        footnote: orderRef.footnote,
        createdAt: row.created_at,
      };

      setRepairs(prev => [newRepair, ...prev]);
      setSelectedRepairId(newRepair.id);

      const { data: { user: u1 } } = await supabase.auth.getUser();
      const newInserts: { type: 'in'; amount: number; note: string; created_by: string | null }[] = [];
      if (orderRef.advancePaid > 0) newInserts.push({ type: 'in', amount: orderRef.advancePaid, note: `Anticipo Reparación #${newRepair.id}`, created_by: u1?.id ?? null });
      if (orderRef.abonosPaid > 0) newInserts.push({ type: 'in', amount: orderRef.abonosPaid, note: `Abono Reparación #${newRepair.id}`, created_by: u1?.id ?? null });
      if (newInserts.length > 0) {
        const { error: insertErr } = await supabase.from('cash_movements').insert(newInserts);
        if (insertErr) console.error('Error insertando movimientos:', insertErr);
      }

      refetchLogs();
      refetchCashMovements();
      showToast('Nota Guardada', `Folio #${newRepair.id} asignado correctamente.`, 'success');
      return true;
    } else {
      const { data: oldData } = await supabase
        .from('repair_orders')
        .select('advance_paid, abonos_paid')
        .eq('id', Number(id))
        .single();

      await syncRepairToDb(id, orderRef);

      const oldAdvance = (oldData as { advance_paid: number } | null)?.advance_paid ?? 0;
      const oldAbonos = (oldData as { abonos_paid: number } | null)?.abonos_paid ?? 0;
      const advDelta = orderRef.advancePaid - oldAdvance;
      const aboDelta = orderRef.abonosPaid - oldAbonos;

      if (advDelta > 0 || aboDelta > 0) {
        const { data: { user: u2 } } = await supabase.auth.getUser();
        const updates: { type: 'in'; amount: number; note: string; created_by: string | null }[] = [];
        if (advDelta > 0) updates.push({ type: 'in', amount: advDelta, note: `Anticipo Reparación #${id}`, created_by: u2?.id ?? null });
        if (aboDelta > 0) updates.push({ type: 'in', amount: aboDelta, note: `Abono Reparación #${id}`, created_by: u2?.id ?? null });
        const { error: insertErr } = await supabase.from('cash_movements').insert(updates);
        if (insertErr) console.error('Error insertando movimientos:', insertErr);
      }

      refetchLogs();
      refetchCashMovements();
      showToast('Nota Actualizada', `Orden #${orderRef.id} guardada correctamente.`, 'success');
      return true;
    }
    } finally {
      setIsSaving(false);
    }
  }, [draftRepair, repairs, showToast, refetchLogs, refetchCashMovements, syncRepairToDb]);

  const handleDeleteCurrentRepair = useCallback(async () => {
    if (selectedRepairId === DRAFT_ID) {
      setDraftRepair(blankRepair());
      setSelectedRepairId(repairs.length > 0 ? repairs[0].id : '');
      showToast('Borrador descartado', 'La nota nueva se ha descartado.', 'info');
      return;
    }
    const ok = confirm
      ? await confirm({ title: 'Eliminar Orden', message: `¿Seguro que deseas eliminar permanentemente el folio #${selectedRepairId}?`, confirmLabel: 'Eliminar', danger: true })
      : window.confirm(`¿Seguro que deseas eliminar permanentemente el folio #${selectedRepairId}?`);
    if (!ok) return;
    setIsSaving(true);
    await removeRepairFromDb(selectedRepairId);
    setRepairs(prev => prev.filter(r => r.id !== selectedRepairId));
    refetchLogs();
    refetchCashMovements();
    showToast('Registro eliminado', `Se descartó el folio #${selectedRepairId} del registro.`, 'error');
    setIsSaving(false);

    const remaining = repairs.filter(r => r.id !== selectedRepairId);
    if (remaining.length > 0) {
      setSelectedRepairId(remaining[0].id);
    } else {
      handleCreateNewRepair();
    }
  }, [selectedRepairId, repairs, showToast, refetchLogs, refetchCashMovements, removeRepairFromDb, handleCreateNewRepair]);

  const handleReprintCurrentRepair = useCallback(() => {
    const id = selectedRepairId;
    if (!id) {
      showToast('Sin selección', 'No hay ninguna orden seleccionada.', 'error');
      return;
    }
    const order = id === DRAFT_ID ? draftRepair : repairs.find(r => r.id === id);
    if (!order) {
      showToast('No encontrada', `No se encontró la orden #${id}.`, 'error');
      return;
    }
    const remaining = Math.max(0, order.totalCost - order.advancePaid - order.abonosPaid);
    const bizInfo = getBusinessInfo();
    const html = repairReceiptHTML(order, remaining, bizInfo);
    printHTML(html);
    showToast('Reimprimiendo', `Enviando comprobante #${id} a la impresora...`, 'success');
  }, [selectedRepairId, draftRepair, repairs, showToast]);

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
      onNavigate('repairs');
      showToast('Orden encontrada', `Folio #${folioNumber} cargado.`, 'success');
    } else {
      showToast('No encontrada', `No existe orden con folio #${folioNumber}.`, 'error');
    }
  }, [repairs, showToast, onNavigate]);

  const handleDeleteCompletedRepairs = useCallback(async (count: number) => {
    setIsSaving(true);
    try {
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
    } finally {
      setIsSaving(false);
    }
  }, [showToast, refetchRepairs]);

  const handleClearRepairForm = useCallback(() => {
    if (selectedRepairId === DRAFT_ID) {
      setDraftRepair(blankRepair());
    } else {
      handleCreateNewRepair();
    }
  }, [selectedRepairId, handleCreateNewRepair]);

  return {
    repairs,
    setRepairs,
    repairsError,
    repairsLoading,
    isSaving,
    draftRepair,
    selectedRepairId,
    setSelectedRepairId,
    DRAFT_ID,
    handleCreateNewRepair,
    handleUpdateRepair,
    handleSaveRepairOrder,
    handleDeleteCurrentRepair,
    handleReprintCurrentRepair,
    handleJumpToRepair,
    handleDeleteCompletedRepairs,
    handleClearRepairForm,
    refetchRepairs,
  };
}
