import { useState, useEffect, useCallback } from 'react';
import { RepairOrder, ActiveView } from '../types';
import { supabase } from '../lib/supabase';
import { validateRepair } from '../lib/repairValidation';
import { useRepairOrders } from './useRepairOrders';
import { getBusinessInfo } from '../lib/businessInfo';
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

  const handleSaveRepairOrder = useCallback(async (id: string) => {
    setIsSaving(true);
    try {
    let orderRef = id === DRAFT_ID ? draftRepair : repairs.find(r => r.id === id);
    if (!orderRef) return;

    if (orderRef.status === 'delivered') {
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      if (id === DRAFT_ID) {
        setDraftRepair(prev => ({ ...prev, warrantyEnd: thirtyDaysFromNow }));
      } else {
        setRepairs(prev => prev.map(r => r.id === id ? { ...r, warrantyEnd: thirtyDaysFromNow } : r));
      }
      orderRef = { ...orderRef, warrantyEnd: thirtyDaysFromNow };

      const remaining = Math.max(0, orderRef.totalCost - orderRef.advancePaid - orderRef.abonosPaid);
      if (remaining > 0) {
        const newAbonos = orderRef.abonosPaid + remaining;
        if (id === DRAFT_ID) {
          setDraftRepair(prev => ({ ...prev, abonosPaid: newAbonos }));
        } else {
          setRepairs(prev => prev.map(r => r.id === id ? { ...r, abonosPaid: newAbonos } : r));
        }
        orderRef = { ...orderRef, abonosPaid: newAbonos };
      }
    }

    const errors = validateRepair(orderRef);

    if (errors.length > 0) {
      showToast('Corregí los errores', errors.join(' '), 'error');
      return;
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

      const { data: { user: u1 } } = await supabase.auth.getUser();
      const newInserts: { type: 'in'; amount: number; note: string; created_by: string | null }[] = [];
      if (orderRef.advancePaid > 0) newInserts.push({ type: 'in', amount: orderRef.advancePaid, note: `Anticipo Reparación #${newRepair.id}`, created_by: u1?.id ?? null });
      if (orderRef.abonosPaid > 0) newInserts.push({ type: 'in', amount: orderRef.abonosPaid, note: `Abono Reparación #${newRepair.id}`, created_by: u1?.id ?? null });
      if (newInserts.length > 0) await supabase.from('cash_movements').insert(newInserts);

      refetchLogs();
      showToast('Nota Guardada', `Folio #${newRepair.id} asignado correctamente.`, 'success');
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
        await supabase.from('cash_movements').insert(updates);
      }

      refetchLogs();
      showToast('Nota Actualizada', `Orden #${orderRef.id} guardada correctamente.`, 'success');
    }
    } finally {
      setIsSaving(false);
    }
  }, [draftRepair, repairs, showToast, refetchLogs, syncRepairToDb]);

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
    showToast('Registro eliminado', `Se descartó el folio #${selectedRepairId} del registro.`, 'error');
    setIsSaving(false);

    const remaining = repairs.filter(r => r.id !== selectedRepairId);
    if (remaining.length > 0) {
      setSelectedRepairId(remaining[0].id);
    } else {
      handleCreateNewRepair();
    }
  }, [selectedRepairId, repairs, showToast, refetchLogs, removeRepairFromDb, handleCreateNewRepair]);

  const handleReprintCurrentRepair = useCallback(() => {
    showToast('Reimprimir Comprobante', `Generando ticket de carga térmica para folio #${selectedRepairId}...`, 'info');
  }, [selectedRepairId, showToast]);

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
