export interface RepairValidationInput {
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  deviceModel?: string;
  deliveryDate?: string;
  warrantyEnd?: string;
  problemReported?: string;
  totalCost: number;
  advancePaid: number;
  abonosPaid: number;
}

export function validateRepair(order: RepairValidationInput): string[] {
  const errors: string[] = [];

  if (!order.clientName?.trim()) errors.push('El nombre del cliente es obligatorio.');

  if (order.clientPhone && !/^\d{10}$/.test(order.clientPhone.replace(/\D/g, ''))) {
    errors.push('El teléfono debe tener 10 dígitos.');
  }

  if (order.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.clientEmail)) {
    errors.push('El correo electrónico no es válido.');
  }

  if (order.totalCost < 0) errors.push('El costo total no puede ser negativo.');
  if (order.advancePaid < 0) errors.push('El anticipo no puede ser negativo.');
  if (order.advancePaid > order.totalCost) errors.push('El anticipo no puede superar el costo total.');
  if (order.abonosPaid < 0) errors.push('Los abonos no pueden ser negativos.');

  if ((order.abonosPaid || 0) + order.advancePaid > order.totalCost) {
    errors.push('La suma de anticipo + abonos no puede superar el costo total.');
  }

  if (order.totalCost > 0 && !order.deviceModel?.trim()) {
    errors.push('Si hay costo, indicá el modelo del equipo.');
  }

  if (!order.deliveryDate?.trim()) {
    errors.push('La fecha de entrega es obligatoria.');
  } else {
    const todayStr = new Date().toISOString().split('T')[0];
    if (order.deliveryDate < todayStr) errors.push('La fecha de entrega no puede ser pasada.');
  }

  if (!order.warrantyEnd?.trim()) {
    errors.push('La fecha de fin de garantía es obligatoria.');
  } else {
    const todayStr = new Date().toISOString().split('T')[0];
    if (order.warrantyEnd < todayStr) errors.push('La fecha de garantía no puede ser pasada.');
  }

  if (!order.problemReported?.trim()) errors.push('El detalle del problema es obligatorio.');

  return errors;
}
