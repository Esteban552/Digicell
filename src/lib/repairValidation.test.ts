import { describe, it, expect, vi, afterEach } from 'vitest';
import { validateRepair } from './repairValidation';

afterEach(() => {
  vi.restoreAllMocks();
});

function validOrder() {
  return {
    clientName: 'Juan Pérez',
    clientPhone: '5512345678',
    clientEmail: 'juan@example.com',
    deviceModel: 'iPhone 12',
    problemReported: 'No enciende',
    totalCost: 500,
    advancePaid: 200,
    abonosPaid: 0,
    deliveryDate: '2099-12-31',
    warrantyEnd: '2099-12-31',
  };
}

describe('validateRepair', () => {
  it('returns no errors for a valid order', () => {
    expect(validateRepair(validOrder())).toEqual([]);
  });

  it('requires client name', () => {
    const errs = validateRepair({ ...validOrder(), clientName: '' });
    expect(errs).toContain('El nombre del cliente es obligatorio.');
  });

  it('validates phone format (10 digits)', () => {
    const errs = validateRepair({ ...validOrder(), clientPhone: '123' });
    expect(errs).toContain('El teléfono debe tener 10 dígitos.');
  });

  it('allows empty phone', () => {
    const errs = validateRepair({ ...validOrder(), clientPhone: '' });
    expect(errs).not.toContain('El teléfono debe tener 10 dígitos.');
  });

  it('validates email format', () => {
    const errs = validateRepair({ ...validOrder(), clientEmail: 'notanemail' });
    expect(errs).toContain('El correo electrónico no es válido.');
  });

  it('allows empty email', () => {
    const errs = validateRepair({ ...validOrder(), clientEmail: '' });
    expect(errs).not.toContain('El correo electrónico no es válido.');
  });

  it('rejects negative totalCost', () => {
    const errs = validateRepair({ ...validOrder(), totalCost: -10 });
    expect(errs).toContain('El costo total no puede ser negativo.');
  });

  it('rejects negative advancePaid', () => {
    const errs = validateRepair({ ...validOrder(), advancePaid: -5 });
    expect(errs).toContain('El anticipo no puede ser negativo.');
  });

  it('rejects advancePaid > totalCost', () => {
    const errs = validateRepair({ ...validOrder(), totalCost: 100, advancePaid: 150 });
    expect(errs).toContain('El anticipo no puede superar el costo total.');
  });

  it('rejects negative abonosPaid', () => {
    const errs = validateRepair({ ...validOrder(), abonosPaid: -1 });
    expect(errs).toContain('Los abonos no pueden ser negativos.');
  });

  it('rejects advance + abonos > totalCost', () => {
    const errs = validateRepair({ ...validOrder(), totalCost: 100, advancePaid: 60, abonosPaid: 50 });
    expect(errs).toContain('La suma de anticipo + abonos no puede superar el costo total.');
  });

  it('requires model when totalCost > 0', () => {
    const errs = validateRepair({ ...validOrder(), totalCost: 100, deviceModel: '' });
    expect(errs).toContain('Si hay costo, indicá el modelo del equipo.');
  });

  it('allows empty model when totalCost is 0', () => {
    const errs = validateRepair({ ...validOrder(), totalCost: 0, deviceModel: '' });
    expect(errs).not.toContain('Si hay costo, indicá el modelo del equipo.');
  });

  it('allows past deliveryDate', () => {
    const errs = validateRepair({ ...validOrder(), deliveryDate: '2020-01-01' });
    expect(errs).not.toContain('La fecha de entrega');
  });

  it('requires deliveryDate', () => {
    const errs = validateRepair({ ...validOrder(), deliveryDate: '' });
    expect(errs).toContain('La fecha de entrega es obligatoria.');
  });

  it('requires warrantyEnd', () => {
    const errs = validateRepair({ ...validOrder(), warrantyEnd: '' });
    expect(errs).toContain('La fecha de fin de garantía es obligatoria.');
  });

  it('rejects past warrantyEnd', () => {
    const errs = validateRepair({ ...validOrder(), warrantyEnd: '2020-01-01' });
    expect(errs).toContain('La fecha de garantía no puede ser pasada.');
  });

  it('requires problemReported', () => {
    const errs = validateRepair({ ...validOrder(), problemReported: '' });
    expect(errs).toContain('El detalle del problema es obligatorio.');
  });

  it('rejects delivery if remaining balance > 0', () => {
    const errs = validateRepair({ ...validOrder(), status: 'delivered', totalCost: 500, advancePaid: 100, abonosPaid: 0 });
    expect(errs).toContain('El saldo pendiente debe ser $0 para entregar la orden.');
  });

  it('allows delivery if remaining balance is 0', () => {
    const errs = validateRepair({ ...validOrder(), status: 'delivered', totalCost: 500, advancePaid: 300, abonosPaid: 200 });
    expect(errs).not.toContain('El saldo pendiente');
  });
});
