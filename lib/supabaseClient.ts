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

// Customer - מעודכן עם כל השדות החדשים + שדות דינמיים
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
  // שדות דינמיים - חדש!
  custom_fields?: Record<string, any> | null;
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

// =====================================================
// Dynamic Fields System Types (חדש!)
// =====================================================

export type FieldType = 
  | 'text' 
  | 'number' 
  | 'date' 
  | 'boolean' 
  | 'select' 
  | 'multiselect' 
  | 'email' 
  | 'phone' 
  | 'url' 
  | 'textarea' 
  | 'currency';

export type FieldCategory = 
  | 'general'
  | 'financial'
  | 'legal'
  | 'project'
  | 'sales'
  | 'technical'
  | 'marketing';

export interface FieldDefinition {
  id: string;
  org_id: string;
  field_name: string;
  display_name: string;
  field_type: FieldType;
  field_category: FieldCategory;
  options?: { options: string[] } | null;
  validation_rules?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    required?: boolean;
    pattern?: string;
  } | null;
  default_value?: string | null;
  is_required: boolean;
  is_searchable: boolean;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface CustomFieldsAudit {
  id: string;
  customer_id: string;
  field_name: string;
  old_value?: any;
  new_value?: any;
  changed_by?: string | null;
  changed_at: string;
  change_type: 'create' | 'update' | 'delete';
}

export interface CustomFieldStats {
  total_fields: number;
  fields_by_category: Record<string, number>;
  fields_by_type: Record<string, number>;
  most_used_fields?: Array<{
    field_name: string;
    display_name: string;
    usage_count: number;
    usage_percentage: number;
  }> | null;
  unused_fields?: string[] | null;
}

// =====================================================
// Helper Functions for Dynamic Fields (חדש!)
// =====================================================

export const customFieldsHelpers = {
  // עדכון שדה דינמי בודד
  async updateCustomField(
    customerId: string,
    fieldName: string,
    fieldValue: any,
    userId?: string
  ) {
    const { data, error } = await supabase
      .rpc('update_custom_field', {
        p_customer_id: customerId,
        p_field_name: fieldName,
        p_field_value: JSON.stringify(fieldValue),
        p_user_id: userId
      });
    
    if (error) throw error;
    return data;
  },

  // עדכון מרובה של שדות
  async updateMultipleCustomFields(
    customerId: string,
    fields: Record<string, any>,
    userId?: string
  ) {
    const { data, error } = await supabase
      .rpc('update_multiple_custom_fields', {
        p_customer_id: customerId,
        p_fields: fields,
        p_user_id: userId
      });
    
    if (error) throw error;
    return data;
  },

  // מחיקת שדה דינמי
  async deleteCustomField(
    customerId: string,
    fieldName: string,
    userId?: string
  ) {
    const { data, error } = await supabase
      .rpc('delete_custom_field', {
        p_customer_id: customerId,
        p_field_name: fieldName,
        p_user_id: userId
      });
    
    if (error) throw error;
    return data;
  },

  // חיפוש בשדות דינמיים
  async searchCustomFields(searchTerm: string, orgId?: string) {
    const { data, error } = await supabase
      .rpc('search_custom_fields', {
        p_search_term: searchTerm,
        p_org_id: orgId || '11111111-1111-1111-1111-111111111111'
      });
    
    if (error) throw error;
    return data;
  },

  // קבלת שדות דינמיים של לקוח
  async getCustomerCustomFields(customerId: string) {
    const { data, error } = await supabase
      .rpc('get_customer_custom_fields', {
        p_customer_id: customerId
      });
    
    if (error) throw error;
    return data;
  },

  // קבלת סטטיסטיקות
  async getCustomFieldsStats(orgId?: string): Promise<CustomFieldStats> {
    const { data, error } = await supabase
      .rpc('get_custom_fields_stats', {
        p_org_id: orgId || '11111111-1111-1111-1111-111111111111'
      });
    
    if (error) throw error;
    return data;
  },

  // ייצוא הגדרות שדות
  async exportFieldDefinitions(orgId?: string) {
    const { data, error } = await supabase
      .rpc('export_field_definitions', {
        p_org_id: orgId || '11111111-1111-1111-1111-111111111111'
      });
    
    if (error) throw error;
    return data;
  },

  // ייבוא הגדרות שדות
  async importFieldDefinitions(
    definitions: any[],
    orgId?: string,
    userId?: string
  ) {
    const { data, error } = await supabase
      .rpc('import_field_definitions', {
        p_definitions: definitions,
        p_org_id: orgId || '11111111-1111-1111-1111-111111111111',
        p_user_id: userId
      });
    
    if (error) throw error;
    return data;
  },

  // עזר לולידציה של שדה
  validateField(
    field: FieldDefinition,
    value: any
  ): { valid: boolean; error?: string } {
    if (field.is_required && !value) {
      return { valid: false, error: `${field.display_name} הוא שדה חובה` };
    }

    const rules = field.validation_rules;
    if (!rules) return { valid: true };

    if (field.field_type === 'text' || field.field_type === 'textarea') {
      if (rules.minLength && value && value.length < rules.minLength) {
        return { 
          valid: false, 
          error: `${field.display_name} חייב להכיל לפחות ${rules.minLength} תווים` 
        };
      }
      if (rules.maxLength && value && value.length > rules.maxLength) {
        return { 
          valid: false, 
          error: `${field.display_name} יכול להכיל עד ${rules.maxLength} תווים` 
        };
      }
    }

    if (field.field_type === 'number' || field.field_type === 'currency') {
      const numValue = parseFloat(value);
      if (rules.min !== undefined && numValue < rules.min) {
        return { 
          valid: false, 
          error: `${field.display_name} חייב להיות לפחות ${rules.min}` 
        };
      }
      if (rules.max !== undefined && numValue > rules.max) {
        return { 
          valid: false, 
          error: `${field.display_name} יכול להיות עד ${rules.max}` 
        };
      }
    }

    if (field.field_type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return { 
          valid: false, 
          error: `${field.display_name} חייב להיות כתובת אימייל תקינה` 
        };
      }
    }

    if (field.field_type === 'phone' && value) {
      const phoneRegex = /^[\d\-\+\(\)\s]+$/;
      if (!phoneRegex.test(value)) {
        return { 
          valid: false, 
          error: `${field.display_name} חייב להיות מספר טלפון תקין` 
        };
      }
    }

    if (field.field_type === 'url' && value) {
      try {
        new URL(value);
      } catch {
        return { 
          valid: false, 
          error: `${field.display_name} חייב להיות כתובת URL תקינה` 
        };
      }
    }

    return { valid: true };
  }
};

// =====================================================
// Default Organization ID
// =====================================================
export const DEFAULT_ORG_ID = '11111111-1111-1111-1111-111111111111';
