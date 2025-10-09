/**
 * TypeScript Types for Customer Management System
 * lib/types.ts
 */

// =====================================================
// Enums and Union Types
// =====================================================

export type Purpose = 'invoices' | 'updates' | 'both';
export type ProductStatus = 'active' | 'paused' | 'ended';
export type ProcessorType = 'acquirer' | 'gateway';
export type Region = 'north' | 'south' | 'center' | 'sharon' | 'jerusalem' | 'tel-aviv' | 'haifa' | 'other';

// =====================================================
// Master Data Types
// =====================================================

export interface Status {
  id: string;
  org_id: string;
  name: string;
  color?: string | null;
  is_system: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  org_id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface POSVendor {
  id: string;
  org_id: string;
  name: string;
  note?: string | null;
  created_at: string;
}

export interface PaymentProcessor {
  id: string;
  org_id: string;
  name: string;
  type: ProcessorType;
  created_at: string;
}

export interface CardBrand {
  id: string;
  name: string;
  created_at: string;
}

export interface Brand {
  id: string;
  org_id: string;
  name: string;
  admin_code?: string | null;
  invoice_name?: string | null;
  created_at: string;
}

// =====================================================
// Customer Types
// =====================================================

export interface Customer {
  id: string;
  org_id: string;
  name: string;
  email?: string | null;
  phone: string;
  address?: string | null;
  legal_id?: string | null;
  contact_name?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string | null;
  // Extended fields
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

// Customer Overview from View
export interface CustomerOverview extends Customer {
  // נתונים מטבלאות קשורות
  status_name?: string | null;
  status_color?: string | null;
  brand_name?: string | null;
  pos_vendor_name?: string | null;
  // ספירות
  products_count: number;
  emails_count: number;
  hardware_count: number;
  billing_lines_count: number;
  monthly_billing_total: number;
  one_time_billing_total: number;
}

// =====================================================
// Association Types
// =====================================================

export interface CustomerProduct {
  customer_id: string;
  product_id: string;
  start_date?: string | null;
  end_date?: string | null;
  status?: ProductStatus | null;
  notes?: string | null;
  created_at?: string;
  // For joins
  product?: Product;
}

export interface CustomerEmail {
  id: string;
  customer_id: string;
  email: string;
  purpose: Purpose;
  is_primary: boolean;
  created_at: string;
}

export interface CustomerManager {
  id: string;
  customer_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  permissions: {
    canApprove?: boolean;
    canRefund?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    [key: string]: any;
  };
  created_at: string;
}

export interface CustomerPaymentRoute {
  id: string;
  customer_id: string;
  processor_id: string;
  card_brand_id: string;
  supplier_number: string;
  notes?: string | null;
  created_at: string;
  // For joins
  processor?: PaymentProcessor;
  card_brand?: CardBrand;
}

export interface CustomerLink {
  id: string;
  customer_id: string;
  title: string;
  url: string;
  created_at: string;
}

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

export interface CustomerStatusHistory {
  id: string;
  customer_id: string;
  status_id?: string | null;
  changed_at: string;
  changed_by?: string | null;
  note?: string | null;
  // For joins
  status?: Status;
}

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

// =====================================================
// Form Data Types
// =====================================================

export interface CustomerFormData {
  name: string;
  email?: string;
  phone: string;
  address?: string;
  legal_id?: string;
  contact_name?: string;
  notes?: string;
  // Extended fields
  brand_id?: string;
  status_id?: string;
  region?: string;
  branch_admin_code?: string;
  brand_admin_code?: string;
  brand_display_name?: string;
  invoice_business_name?: string;
  vat_number?: string;
  owner_id_number?: string;
  branch_phone?: string;
  manager_mobile?: string;
  pos_vendor_id?: string;
  payment_mandate_url?: string;
  accounting_notes?: string;
}

export interface ProductFormData {
  name: string;
  description?: string;
  is_active: boolean;
}

export interface StatusFormData {
  name: string;
  color?: string;
  is_system: boolean;
}

export interface BrandFormData {
  name: string;
  admin_code?: string;
  invoice_name?: string;
}

export interface POSVendorFormData {
  name: string;
  note?: string;
}

export interface PaymentProcessorFormData {
  name: string;
  type: ProcessorType;
}

export interface CustomerProductFormData {
  product_id: string;
  start_date?: string;
  end_date?: string;
  status?: ProductStatus;
  notes?: string;
}

export interface CustomerEmailFormData {
  email: string;
  purpose: Purpose;
  is_primary: boolean;
}

export interface CustomerManagerFormData {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  permissions: Record<string, any>;
}

export interface CustomerPaymentRouteFormData {
  processor_id: string;
  card_brand_id: string;
  supplier_number: string;
