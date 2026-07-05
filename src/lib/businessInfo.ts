export interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  warrantyText: string;
}

const DEFAULTS: BusinessInfo = {
  name: 'Digicell',
  address: 'Av. Rodríguez 1234, San Luis Río Colorado, Sonora',
  phone: '(653) 555-5555',
  warrantyText:
    'Garantía de 30 días en piezas reemplazadas. No nos hacemos responsables por equipos olvidados después de 60 días.',
};

/**
 * Returns business info, using overrides from settings if available.
 * Falls back to defaults for any missing value.
 */
export function getBusinessInfo(settings: Record<string, string> = {}): BusinessInfo {
  return {
    name: settings.business_name || DEFAULTS.name,
    address: settings.business_address || DEFAULTS.address,
    phone: settings.business_phone || DEFAULTS.phone,
    warrantyText: settings.warranty_text || DEFAULTS.warrantyText,
  };
}
