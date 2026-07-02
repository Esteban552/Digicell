export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id'>>;
      };
      repair_orders: {
        Row: RepairOrder;
        Insert: Omit<RepairOrder, 'id' | 'remaining_balance' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<RepairOrder, 'id' | 'remaining_balance'>>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Product, 'id'>>;
      };
      sales: {
        Row: Sale;
        Insert: Omit<Sale, 'id' | 'created_at'>;
        Update: Partial<Omit<Sale, 'id'>>;
      };
      sale_items: {
        Row: SaleItem;
        Insert: Omit<SaleItem, 'id'>;
        Update: Partial<Omit<SaleItem, 'id'>>;
      };
      cash_movements: {
        Row: CashMovement;
        Insert: Omit<CashMovement, 'id' | 'created_at'>;
        Update: Partial<Omit<CashMovement, 'id'>>;
      };
      settings: {
        Row: Setting;
        Insert: Setting;
        Update: Partial<Setting>;
      };
    };
    Views: {
      activity_logs: {
        Row: ActivityLogEntry;
      };
    };
    Functions: {
      set_updated_at: {
        Args: Record<string, never>;
        Returns: unknown;
      };
      handle_new_user: {
        Args: Record<string, never>;
        Returns: unknown;
      };
    };
  };
}

export interface Profile {
  id: string;
  display_name: string;
  role: 'admin' | 'technician';
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export interface RepairOrder {
  id: number;
  client_name: string;
  client_phone: string;
  client_email: string;
  device_brand: string;
  device_model: string;
  device_serial: string;
  device_password: string;
  device_color: string;
  powers_on: 'Yes' | 'No';
  battery_percent: string;
  charger_left: boolean;
  cover_left: boolean;
  receiving_condition: string;
  problem_reported: string;
  internal_notes: string;
  status: 'in_review' | 'waiting_parts' | 'repaired' | 'delivered';
  technician: string;
  delivery_date: string;
  warranty_end: string;
  total_cost: number;
  advance_paid: number;
  abonos_paid: number;
  remaining_balance: number;
  footnote: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: number;
  description: string;
  cash_amount: number;
  card_amount: number;
  usd_amount: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  created_by: string | null;
  created_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_name: string;
  qty: number;
  price: number;
}

export interface CashMovement {
  id: number;
  type: 'in' | 'out';
  amount: number;
  note: string;
  created_by: string | null;
  created_at: string;
}

export interface Setting {
  key: string;
  value: string;
  updated_at: string;
}

export interface ActivityLogEntry {
  id: string;
  time: string;
  type: string;
  description: string;
  amount: number;
  status: string;
  created_at: string;
}
