// הוסף את הפונקציות האלה לקובץ supabaseClient.ts הקיים שלך:

// =========== הוסף את הפונקציות האלה לסוף הקובץ ===========

// פונקציות עזר לקבלת נתוני משתמש וארגון
// כרגע מחזירים mock data - להחליף ב-authentication אמיתי בהמשך

export function getCurrentOrgId(): string {
  // TODO: להחליף בלוגיקה אמיתית לקבלת org_id מהמשתמש המחובר
  return 'org_1' // ערך דמה לבדיקות
}

export function getCurrentUser() {
  // TODO: להחליף בלוגיקה אמיתית לקבלת פרטי המשתמש המחובר
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
