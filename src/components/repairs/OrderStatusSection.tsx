import type { RepairOrder, RepairStatus } from '../../types';

interface OrderStatusSectionProps {
  repair: RepairOrder;
  isDraft: boolean;
  isDelivered: boolean;
  today: string;
  errors: Record<string, string>;
  onUpdateField: (key: keyof RepairOrder, value: string | number | boolean) => void;
  onClearError: (field: string) => void;
  onSetError: (field: string, msg: string) => void;
  onDeliveryConfirm: (pending: boolean) => void;
}

export default function OrderStatusSection({
  repair,
  isDraft,
  isDelivered,
  today,
  errors,
  onUpdateField,
  onClearError,
  onSetError,
  onDeliveryConfirm,
}: OrderStatusSectionProps) {
  return (
    <div className="bg-white border border-outline-variant rounded-md p-5 select-none hover:shadow-sm transition-all shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
      <h3 className="text-sm font-bold text-on-surface border-b border-outline-variant/60 pb-3 mb-4 flex items-center gap-2 flex-wrap">
        <span className="material-symbols-outlined text-primary text-[20px]">manage_history</span>
        Estado de la Orden
      </h3>
      <div className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-on-surface-variant font-sans">Estado</label>
          <select
            disabled={isDelivered}
            value={repair.status}
            onChange={(e) => {
              const newStatus = e.target.value as RepairStatus;
              onUpdateField('status', newStatus);
              onDeliveryConfirm(newStatus === 'delivered');
            }}
            className="h-10 w-full px-2.5 border border-outline-variant rounded disabled:bg-surface-container-low/40 disabled:cursor-default bg-white text-xs font-bold text-primary focus:border-tertiary outline-none cursor-pointer font-sans"
          >
            <option value="in_review">En Revisión</option>
            <option value="waiting_parts">Esperando Piezas</option>
            <option value="repaired">Reparado</option>
            <option value="delivered">Entregado</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-on-surface-variant font-sans">Técnico Asignado</label>
          <select
            disabled={!isDraft || isDelivered}
            value={repair.technician}
            onChange={(e) => onUpdateField('technician', e.target.value)}
            className="h-10 w-full px-2.5 border border-outline-variant rounded disabled:bg-surface-container-low/40 disabled:cursor-default bg-white text-xs text-on-surface focus:border-tertiary outline-none cursor-pointer font-sans font-medium"
          >
            <option value="Unassigned">Sin Asignar</option>
            <option value="Tech Alex">Tech Alex</option>
            <option value="Tech Maria">Tech Maria</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-on-surface-variant font-sans">
            Fecha de Entrega <span className="text-error">*</span>
          </label>
          <input
            type="date"
            value={repair.deliveryDate}
            readOnly={!isDraft || isDelivered}
            onChange={(e) => {
              onUpdateField('deliveryDate', e.target.value);
              if (errors.deliveryDate) onClearError('deliveryDate');
            }}
            onBlur={() => {
              if (!repair.deliveryDate?.trim()) onSetError('deliveryDate', 'La fecha de entrega es obligatoria');
              else onClearError('deliveryDate');
            }}
            className={`h-10 w-full px-3 border rounded disabled:bg-surface-container-low/40 disabled:cursor-default bg-white text-xs font-medium text-on-surface focus:border-tertiary outline-none font-sans ${errors.deliveryDate ? 'border-error' : 'border-outline-variant'}`}
          />
          {errors.deliveryDate && <p className="text-[10px] font-sans text-error font-semibold">{errors.deliveryDate}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-on-surface-variant font-sans">
            Fin de Garantía <span className="text-error">*</span>
          </label>
          <input
            type="date"
            value={repair.warrantyEnd}
            readOnly={isDelivered}
            min={today}
            onChange={(e) => {
              onUpdateField('warrantyEnd', e.target.value);
              if (errors.warrantyEnd) onClearError('warrantyEnd');
            }}
            onBlur={() => {
              if (!repair.warrantyEnd?.trim()) onSetError('warrantyEnd', 'La fecha de garantía es obligatoria');
              else if (repair.warrantyEnd < today) onSetError('warrantyEnd', 'No puede ser una fecha pasada');
              else onClearError('warrantyEnd');
            }}
            className={`h-10 w-full px-3 border rounded disabled:bg-surface-container-low/40 disabled:cursor-default bg-white text-xs text-on-surface focus:border-tertiary outline-none font-sans ${errors.warrantyEnd ? 'border-error' : 'border-outline-variant'}`}
          />
          {errors.warrantyEnd && <p className="text-[10px] font-sans text-error font-semibold">{errors.warrantyEnd}</p>}
        </div>
      </div>
    </div>
  );
}
