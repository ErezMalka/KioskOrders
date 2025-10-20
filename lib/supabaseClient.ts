import { createBrowserClient } from '@supabase/ssr'

// =================== TypeScript Types ===================
// הוספנו את 'currency' כאן!
export type FieldType = 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'boolean' | 'email' | 'phone' | 'url' | 'textarea' | 'currency'
export type FieldCategory = 'customer' | 'product' | 'order' | 'general'

export interface FieldDefinition {
  id?: string
  org_id?: string
  field_name: string
  field_type: FieldType
  field_label: string
  display_name?: string
  is_required: boolean
  is_active: boolean
  is_searchable?: boolean
  is_visible?: boolean
  field_options?: string[] | null
  options?: any
  sort_order?: number
  field_category: FieldCategory
  default_value?: any
  validation_rules?: any
  created_at?: string
  updated_at?: string
}

// =================== Constants ===================
export const DEFAULT_ORG_ID = 'default-org-id' // ערך ברירת מחדל לארגון

// =================== Supabase Client ===================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
)

// =================== Helper Functions ===================
export const customFieldsHelpers = {
  // Get active fields for an organization
  getActiveFields: async (orgId: string): Promise<FieldDefinition[]> => {
    const { data, error } = await supabase
      .from('custom_fields')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // Create new custom field
  createField: async (field: Partial<FieldDefinition>): Promise<FieldDefinition> => {
    const { data, error } = await supabase
      .from('custom_fields')
      .insert([field])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update custom field
  updateField: async (fieldId: string, updates: Partial<FieldDefinition>): Promise<FieldDefinition> => {
    const { data, error } = await supabase
      .from('custom_fields')
      .update(updates)
      .eq('id', fieldId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete custom field (soft delete - set is_active to false)
  deleteField: async (fieldId: string): Promise<void> => {
    const { error } = await supabase
      .from('custom_fields')
      .update({ is_active: false })
      .eq('id', fieldId)
    
    if (error) throw error
  },

  // Validate field value based on field type
  validateFieldValue: (field: FieldDefinition, value: any): boolean => {
    if (field.is_required && !value) return false
    
    switch (field.field_type) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      case 'phone':
        return /^[\d\s\-\+\(\)]+$/.test(value)
      case 'url':
        try {
          new URL(value)
          return true
        } catch {
          return false
        }
      case 'number':
      case 'currency':  // currency מטופל כמו number
        return !isNaN(value)
      default:
        return true
    }
  },

  // New validateField function that returns an object
  validateField: (field: FieldDefinition, value: any): { valid: boolean; error?: string } => {
    if (field.is_required && !value) {
      return { valid: false, error: 'שדה חובה' }
    }
    
    switch (field.field_type) {
      case 'email':
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        return isValidEmail ? { valid: true } : { valid: false, error: 'כתובת אימייל לא תקינה' }
      
      case 'phone':
        const isValidPhone = /^[\d\s\-\+\(\)]+$/.test(value)
        return isValidPhone ? { valid: true } : { valid: false, error: 'מספר טלפון לא תקין' }
      
      case 'url':
        try {
          new URL(value)
          return { valid: true }
        } catch {
          return { valid: false, error: 'כתובת URL לא תקינה' }
        }
      
      case 'number':
      case 'currency':  // currency מטופל כמו number
        const isValidNumber = !isNaN(value)
        return isValidNumber ? { valid: true } : { valid: false, error: 'ערך מספרי לא תקין' }
      
      default:
        return { valid: true }
    }
  }
}

// =================== Export Everything ===================
export default supabase
