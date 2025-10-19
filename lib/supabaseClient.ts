import { createBrowserClient } from '@supabase/ssr'

// =================== TypeScript Types ===================
export type FieldType = 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'boolean' | 'email' | 'phone' | 'url' | 'textarea'
export type FieldCategory = 'customer' | 'product' | 'order' | 'general'

export interface FieldDefinition {
  id?: string
  org_id?: string
  field_name: string
  field_type: FieldType
  field_label: string
  is_required: boolean
  is_active: boolean
  field_options?: string[] | null
  default_value?: any
  field_category: FieldCategory
  display_order?: number
  validation_rules?: any
  created_at?: string
  updated_at?: string
}

// =================== Supabase Client ===================
const supabaseClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Export בשמות שונים כדי לתמוך בכל השימושים
export const supabase = supabaseClient
export { supabaseClient }
export default supabaseClient

// =================== Constants ===================
export const DEFAULT_ORG_ID = 'org_1'

// =================== Helper Functions ===================
export const customFieldsHelpers = {
  // פונקציות עזר לשדות מותאמים אישית
  getCustomFields: async (orgId: string) => {
    const { data, error } = await supabase
      .from('custom_fields')
      .select('*')
      .eq('org_id', orgId)
    
    if (error) throw error
    return data as FieldDefinition[]
  },
  
  saveCustomFieldValues: async (entityId: string, values: any) => {
    const { data, error } = await supabase
      .from('custom_field_values')
      .upsert({
        entity_id: entityId,
        values: values,
        updated_at: new Date().toISOString()
      })
    
    if (error) throw error
    return data
  },
  
  getFieldsByCategory: async (orgId: string, category: FieldCategory) => {
    const { data, error } = await supabase
      .from('custom_fields')
      .select('*')
      .eq('org_id', orgId)
      .eq('field_category', category)
      .eq('is_active', true)
      .order('display_order')
    
    if (error) throw error
    return data as FieldDefinition[]
  },
  
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
        return !isNaN(value)
      default:
        return true
    }
  }
}

// פונקציות נוספות למערכת
export function getCurrentOrgId(): string {
  return DEFAULT_ORG_ID
}

export function getCurrentUser() {
  return {
    id: 'user_1',
    email: 'admin@example.com',
    display_name: 'מנהל מערכת',
    role: 'admin'
  }
}

// פונקציה לבדיקת חיבור
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('count', { count: 'exact' })
      .limit(1)
    
    if (error) {
      console.error('Supabase connection error:', error)
      return false
    }
    
    console.log('Supabase connected successfully')
    return true
  } catch (error) {
    console.error('Failed to connect to Supabase:', error)
    return false
  }
}
