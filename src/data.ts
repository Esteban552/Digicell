/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RepairOrder, CartItem, LogEntry, CashRegistryMovement } from './types';

export const INITIAL_REPAIRS: RepairOrder[] = [
  {
    id: '10041',
    clientName: 'Carlos Ruiz',
    clientPhone: '(555) 443-8821',
    clientEmail: 'carlos.ruiz@gmail.com',
    deviceBrand: 'Samsung',
    deviceModel: 'Galaxy S21 Ultra',
    deviceSerial: '354897102958471',
    devicePassword: 'PIN 4821',
    deviceColor: 'Phantom Black',
    powersOn: 'Yes',
    batteryPercent: '45',
    chargerLeft: false,
    coverLeft: true,
    receivingCondition: 'Estalladura de cristal posterior, ligeros rayones en pantalla principal.',
    problemReported: 'El dispositivo se reinicia solo al conectarlo al cargador original.',
    status: 'in_review',
    technician: 'Tech Alex',
    deliveryDate: '2026-06-10',
    warrantyEnd: '2026-09-10',
    totalCost: 150.00,
    advancePaid: 50.00,
    remainingBalance: 100.00,
    footnote: 'Garantía de 30 días en piezas reemplazadas. No nos hacemos responsables por equipos olvidados después de 60 días.',
    createdAt: '2026-06-05T12:30:00Z'
  },
  {
    id: '10042',
    clientName: 'Jane Smith',
    clientPhone: '(555) 321-9541',
    clientEmail: 'janesmith@yahoo.com',
    deviceBrand: 'Apple',
    deviceModel: 'iPhone 12 Pro',
    deviceSerial: 'G07Z9Y2001A8',
    devicePassword: 'No tiene contraseña',
    deviceColor: 'Pacific Blue',
    powersOn: 'Yes',
    batteryPercent: '88',
    chargerLeft: true,
    coverLeft: true,
    receivingCondition: 'Pantalla frontal rota en la esquina inferior izquierda. Marco sin abolladuras.',
    problemReported: 'Cambio de cristal frontal/pantalla completa con sensor táctil.',
    status: 'repaired',
    technician: 'Tech Maria',
    deliveryDate: '2026-06-08',
    warrantyEnd: '2026-09-08',
    totalCost: 180.00,
    advancePaid: 100.00,
    remainingBalance: 80.00,
    footnote: 'Garantía de 30 días en piezas reemplazadas. No nos hacemos responsables por equipos olvidados después de 60 días.',
    createdAt: '2026-06-05T14:45:00Z'
  },
  {
    id: '10043',
    clientName: 'Alejandro Ramos',
    clientPhone: '(555) 555-0199',
    clientEmail: 'aleramos@hotmail.com',
    deviceBrand: 'Motorola',
    deviceModel: 'Moto G200',
    deviceSerial: 'ZY22DBSN821',
    devicePassword: 'Patrón en L',
    deviceColor: 'Verde Glaciar',
    powersOn: 'No',
    batteryPercent: '0',
    chargerLeft: false,
    coverLeft: false,
    receivingCondition: 'No enciende. Moctezuma en el puerto de carga tipo C. Entrada sulfatada.',
    problemReported: 'Mantenimiento preventivo por humedad interna, cambio de pin de carga.',
    status: 'waiting_parts',
    technician: 'Tech Alex',
    deliveryDate: '2026-06-12',
    warrantyEnd: '2026-09-12',
    totalCost: 90.00,
    advancePaid: 0.00,
    remainingBalance: 90.00,
    footnote: 'Garantía de 30 días en piezas reemplazadas.',
    createdAt: '2026-06-06T10:15:00Z'
  },
  {
    id: '10044',
    clientName: 'Lucía Torres',
    clientPhone: '(555) 789-0123',
    clientEmail: 'lucia.t@outlook.com',
    deviceBrand: 'Xiaomi',
    deviceModel: 'Redmi Note 11',
    deviceSerial: '864219502847253',
    devicePassword: 'PIN 1111',
    deviceColor: 'Star Blue',
    powersOn: 'Yes',
    batteryPercent: '61',
    chargerLeft: true,
    coverLeft: false,
    receivingCondition: 'Cámara trasera rota en el lente principal.',
    problemReported: 'Reemplazo del cristal de cámara exterior.',
    status: 'delivered',
    technician: 'Tech Maria',
    deliveryDate: '2026-06-06',
    warrantyEnd: '2026-09-06',
    totalCost: 45.00,
    advancePaid: 45.00,
    remainingBalance: 0.00,
    footnote: 'Garantía de 30 días en piezas reemplazadas.',
    createdAt: '2026-06-06T11:00:00Z'
  }
];

export const INITIAL_CART: CartItem[] = [
  {
    id: 'p1',
    name: 'Pantalla iPhone 13 Pro Max',
    qty: 1,
    price: 185.00
  },
  {
    id: 'p2',
    name: 'Protector Cristal Templado Universal',
    qty: 2,
    price: 15.00
  },
  {
    id: 'p3',
    name: 'Cable USB-C Carga Rápida 2M',
    qty: 1,
    price: 25.00
  }
];

export const INITIAL_LOGS: LogEntry[] = [
  {
    id: 'log1',
    time: '09:15 AM',
    type: 'Repair Advance',
    description: 'Ticket #R-4029: Depósito cambio de pantalla iPhone 13',
    amount: 80.00,
    status: 'Advance'
  },
  {
    id: 'log2',
    time: '09:42 AM',
    type: 'POS Sale',
    description: '2x Cristal Templado, 1x Cable USB-C',
    amount: 45.50,
    status: 'Paid'
  },
  {
    id: 'log3',
    time: '10:05 AM',
    type: 'Cash Movement',
    description: 'Retiro de efectivo para insumos',
    amount: -20.00,
    status: 'Outflow'
  },
  {
    id: 'log4',
    time: '11:30 AM',
    type: 'Repair Payment',
    description: 'Ticket #R-4015: Pago Final Batería Samsung',
    amount: 65.00,
    status: 'Paid'
  },
  {
    id: 'log5',
    time: '01:15 PM',
    type: 'POS Sale',
    description: '1x Audífonos Bluetooth (Sony)',
    amount: 120.00,
    status: 'Paid'
  }
];

export const INITIAL_CASH_MOVEMENTS: CashRegistryMovement[] = [
  {
    id: 'm1',
    type: 'out',
    amount: 20.00,
    note: 'Retiro de efectivo para insumos de limpieza',
    time: '10:05 AM'
  },
  {
    id: 'm2',
    type: 'in',
    amount: 100.00,
    note: 'Fondo inicial de caja',
    time: '08:00 AM'
  }
];

export const PRESET_INVENTORY = [
  { id: 'i1', name: 'Pantalla iPhone 13 Pro Max', price: 185.00, category: 'Pantallas' },
  { id: 'i2', name: 'Protector Cristal Templado Universal', price: 15.00, category: 'Accesorios' },
  { id: 'i3', name: 'Cable USB-C Carga Rápida 2M', price: 25.00, category: 'Cables' },
  { id: 'i4', name: 'Audífonos Bluetooth (Sony)', price: 120.00, category: 'Audio' },
  { id: 'i5', name: 'Pantalla Samsung Galaxy S21', price: 165.00, category: 'Pantallas' },
  { id: 'i6', name: 'Batería iPhone (X/11/12/13)', price: 60.00, category: 'Baterías' },
  { id: 'i7', name: 'Micro SD 128GB Kingston', price: 19.99, category: 'Almacenamiento' },
  { id: 'i8', name: 'Funda Reforzada iPhone 14/15', price: 35.00, category: 'Accesorios' }
];
