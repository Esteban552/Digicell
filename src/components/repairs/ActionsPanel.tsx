import type { RepairOrder } from '../../types';

interface ActionsPanelProps {
  repair: RepairOrder;
  isDraft: boolean;
  isDelivered: boolean;
  deliveryConfirmPending: boolean;
  remainingCalculated: number;
  onUpdateField: (key: keyof RepairOrder, value: string | number | boolean) => void;
  onSave: () => void;
  onConfirmDelivery: () => void;
  onPrint: () => void;
  onWhatsApp: () => void;
  isSaving?: boolean;
}

export default function ActionsPanel({
  repair,
  isDraft,
  isDelivered,
  deliveryConfirmPending,
  onUpdateField,
  onSave,
  onConfirmDelivery,
  onPrint,
  onWhatsApp,
  isSaving,
}: ActionsPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={onWhatsApp}
        className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-sans text-xs font-bold py-3 px-4 rounded-md transition-colors shadow-sm shadow-[#25D366]/10 outline-none cursor-pointer"
      >
        <svg className="w-4 h-4 fill-current select-none" viewBox="0 0 24 24">
          <path d="M12.031 0C5.385 0 .002 5.385.002 12.031c0 2.124.553 4.195 1.603 6.012L.002 24l6.115-1.605c1.761.968 3.753 1.481 5.912 1.481 6.646 0 12.029-5.385 12.029-12.031S18.677 0 12.031 0zm0 21.84c-1.802 0-3.565-.483-5.112-1.4l-.367-.217-3.799.996.996-3.704-.239-.38C2.553 15.534 2.034 13.805 2.034 12.031c0-5.524 4.496-10.02 10.02-10.02 5.524 0 10.02 4.496 10.02 10.02 0 5.524-4.496 10.02-10.02 10.02zm5.503-7.519c-.302-.151-1.782-.879-2.059-.979-.277-.1-.478-.151-.679.151-.201.302-.779.979-.955 1.18-.176.201-.352.226-.654.075-2.022-1.01-3.415-2.827-3.83-3.551-.237-.417-.037-.629.112-.779.123-.124.277-.302.415-.453.139-.151.185-.252.277-.415.093-.163.046-.314-.029-.465-.075-.151-.679-1.636-.929-2.241-.242-.588-.488-.508-.679-.517-.176-.008-.377-.008-.578-.008-.201 0-.528.075-.805.377-.277.302-1.056 1.032-1.056 2.518 0 1.486 1.082 2.923 1.233 3.125.151.201 2.131 3.253 5.163 4.56.723.311 1.286.497 1.724.636.726.231 1.387.198 1.91.12.585-.088 1.782-.729 2.034-1.433.252-.704.252-1.308.176-1.433-.075-.125-.277-.2-.578-.352z" />
        </svg>
        Enviar por WhatsApp
      </button>

      <div className="flex flex-col gap-1.5 select-none font-sans">
        <label className="text-[11px] font-bold text-on-surface-variant font-sans flex justify-between">
          <span>Nota del Ticket</span>
          <span className="text-slate-400 font-semibold">{repair.footnote?.length || 0}/150</span>
        </label>
        <textarea
          readOnly={!isDraft}
          maxLength={150}
          value={repair.footnote}
          onChange={(e) => onUpdateField('footnote', e.target.value)}
          placeholder="Ej: 30 días de garantía en piezas reemplazadas."
          className="w-full border border-outline-variant rounded disabled:bg-surface-container-low/40 disabled:cursor-default bg-[#ffffff] text-xs p-2.5 h-16 focus:border-tertiary outline-none resize-none leading-relaxed font-sans"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-2 pt-4 border-t border-outline-variant/60">
        <button
          type="button"
          onClick={onPrint}
          className="w-full bg-white border border-outline text-on-surface text-xs font-bold py-2.5 rounded hover:bg-slate-50 transition-colors cursor-pointer outline-none"
        >
          Vista Previa
        </button>

        {isDelivered ? (
          <div className="w-full flex items-center justify-center gap-1 text-xs text-emerald-700 font-bold bg-emerald-50 py-2.5 rounded border border-emerald-200 select-none">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            Entregado
          </div>
        ) : deliveryConfirmPending ? (
          <button
            type="button"
            onClick={onConfirmDelivery}
            disabled={isSaving}
            className="w-full bg-error hover:bg-error/90 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed outline-none animate-pulse"
          >
            <span className="material-symbols-outlined text-[16px]">warning</span>
            Confirmar Entrega
          </button>
        ) : (
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="w-full bg-primary hover:bg-primary-container disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed outline-none"
          >
            {isSaving ? (
              <span className="animate-spin material-symbols-outlined text-[16px]">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[16px]">save</span>
            )}
            {isDraft ? 'Guardar Nota' : 'Guardar Cambios'}
          </button>
        )}
      </div>
    </div>
  );
}
