import type { RepairOrder } from '../../types';

export interface SectionProps {
  repair: RepairOrder;
  isDraft: boolean;
  isDelivered: boolean;
  errors: Record<string, string>;
  onUpdateField: (key: keyof RepairOrder, value: string | number | boolean) => void;
  onClearError: (field: string) => void;
  onSetError: (field: string, msg: string) => void;
}
