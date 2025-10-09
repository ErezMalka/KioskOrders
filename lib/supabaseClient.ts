import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

// Export createClient function for compatibility
export { createClient };

// Helper function for compatibility with old code
export function createClientComponentClient() {
  return supabase;
}

// =====================================================
// Type definitions for existing tables (תאימות לאחור)
// =====================================================

export interface Profile {
  id: string;
  name: string;
  role: string;
  organization_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  customer_id: string;
  organization_id: string;
  total_amount: number;
  status: 'pending' | 'approved' | 'in_production' | 'delivered' | 'cancelled';
  payment_plan_id?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderLine {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  total_price: number;
  selected_options?: any;
}

export interface ProductOption {
  id: string;
  product_id: string;
  name: string;
  price: number;
}

export interface PaymentPlan {
  id: string;
  name: string;
  months: number;
  interest_rate: number;
  down_payment_percentage: number;
}

// =====================================================
// Updated Customer Management System Types
// =====================================================

// Customer - מעודכן עם כל השדות החדשים
export interface Customer {
  id: string;
  org_id: string; // שינוי מ-organization_id
  name: string;
  email?: string | null;
  phone: string;
  address?: string | null;
  legal_id?: string | null;
  contact_name?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string | null;
  // שדות חדשים
  brand_id?: string | null;
  status_id?: string | null;
  region?: string | null;
  branch_admin_code?: string | null;
  brand_admin_code?: string | null;
  brand_display_name?: string | null;
  invoice_business_name?: string | null;
  vat_number?: string | null;
  owner_id_number?: string | null;
  branch_phone?: string | null;
  manager_mobile?: string | null;
  pos_vendor_id?: string | null;
  payment_mandate_url?: string | null;
  accounting_notes?: string | null;
}

// Product - מעודכן למערכת החדשה
export interface Product {
  id: string;
  org_id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
}

// Status - חדש
export interface Status {
  id: string;
  org_id: string;
  name: string;
  color?: string | null;
  is_system: boolean;
  created_at: string;
}

// Brand - חדש
export interface Brand {
  id: string;
  org_id: string;
  name: string;
  admin_code?: string | null;
  invoice_name?: string | null;
  created_at: string;
}

// POSVendor - חדש
export interface POSVendor {
  id: string;
  org_id: string;
  name: string;
  note?: string | null;
  created_at: string;
}

// PaymentProcessor - חדש
export interface PaymentProcessor {
  id: string;
  org_id: string;
  name: string;
  type: 'acquirer' | 'gateway';
  created_at: string;
}

// CardBrand - חדש
export interface CardBrand {
  id: string;
  name: string;
  created_at: string;
}

// CustomerProduct - חדש
export interface CustomerProduct {
  customer_id: string;
  product_id: string;
  start_date?: string | null;
  end_date?: string | null;
  status?: 'active' | 'paused' | 'ended' | null;
  notes?: string | null;
  created_at?: string;
}

// CustomerEmail - חדש
export interface CustomerEmail {
  id: string;
  customer_id: string;
  email: string;
  purpose: 'invoices' | 'updates' | 'both';
  is_primary: boolean;
  created_at: string;
}

// CustomerManager - חדש
export interface CustomerManager {
  id: string;
  customer_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  permissions: Record<string, any>;
  created_at: string;
}

// CustomerPaymentRoute - חדש
export interface CustomerPaymentRoute {
  id: string;
  customer_id: string;
  processor_id: string;
  card_brand_id: string;
  supplier_number: string;
  notes?: string | null;
  created_at: string;
}

// CustomerLink - חדש
export interface CustomerLink {
  id: string;
  customer_id: string;
  title: string;
  url: string;
  created_at: string;
}

// CustomerHardwareAsset - חדש
export interface CustomerHardwareAsset {
  id: string;
  customer_id: string;
  name: string;
  model?: string | null;
  serial?: string | null;
  purchase_date?: string | null;
  notes?: string | null;
  created_at: string;
}

// CustomerStatusHistory - חדש
export interface CustomerStatusHistory {
  id: string;
  customer_id: string;
  status_id?: string | null;
  changed_at: string;
  changed_by?: string | null;
  note?: string | null;
}

// CustomerBillingLine - חדש
export interface CustomerBillingLine {
  id: string;
  customer_id: string;
  item_name: string;
  amount_monthly: number;
  amount_one_time: number;
  discount_percent: number;
  notes?: string | null;
  created_at: string;
}

// CustomerOverview - מה-VIEW
export interface CustomerOverview extends Customer {
  status_name?: string | null;
  status_color?: string | null;
  brand_name?: string | null;
  pos_vendor_name?: string | null;
  products_count: number;
  emails_count: number;
  hardware_count: number;
  billing_lines_count: number;
  monthly_billing_total: number;
  one_time_billing_total: number;
}
