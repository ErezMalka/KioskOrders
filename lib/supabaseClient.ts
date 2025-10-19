import { createBrowserClient } from '@supabase/ssr'

// יצירת ה-client
const supabaseClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Export בשמות שונים כדי לתמוך בכל השימושים
export const supabase = supabaseClient
export { supabaseClient }
export default supabaseClient

// קבועים נוספים שהמערכת מחפשת
export const DEFAULT_ORG_ID = 'org_1'

// Helper functions שהמערכת משתמשת בהן
export const customFieldsHelpers = {
  // פונקציות עזר לשדות מותאמים אישית
  getCustomFields: async (orgId: string) => {
    const { data, error } = await supabase
      .from('custom_fields')
      .select('*')
      .eq('org_id', orgId)
    
    if (error) throw error
    return data
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
  }
}

// פונקציות נוספות למערכת הטיקטים
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
