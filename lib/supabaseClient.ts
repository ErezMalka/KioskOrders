import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function for compatibility with old code
export function createClientComponentClient() {
  return supabase;
}

// Type definitions for database tables
export interface Profile {
  id: string;
  name: string;
  role: string;
  organization_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  company?: string;
  organization_id: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  max_discount: number;
  product_options?: ProductOption[];
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
