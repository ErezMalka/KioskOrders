import { supabase } from './supabaseClient';

// ה-org_id הקבוע שלך
const FIXED_ORG_ID = '11111111-1111-1111-1111-111111111111';

// Cache למניעת קריאות מיותרות
let cachedOrgId: string | null = null;

/**
 * Get the organization ID for the current user
 * כרגע מחזיר org_id קבוע
 * בעתיד אפשר לשנות כדי לקחת מה-JWT או מטבלת profiles
 */
export async function getUserOrgId(): Promise<string | null> {
  // Return cached value if available
  if (cachedOrgId) {
    return cachedOrgId;
  }

  try {
    // אפשרות 1: החזר את ה-org_id הקבוע (נוכחי)
    cachedOrgId = FIXED_ORG_ID;
    return cachedOrgId;

    // אפשרות 2: בעתיד - קח מה-session (uncomment כשיהיה מוכן)
    /*
    const { data: { session }, error } = await supabase.auth.getSession();
    if (session?.user?.app_metadata?.org_id) {
      cachedOrgId = session.user.app_metadata.org_id;
      return cachedOrgId;
    }
    */

    // אפשרות 3: בעתיד - קח מטבלת profiles (uncomment כשיהיה מוכן)
    /*
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();
      
      if (profile?.org_id) {
        cachedOrgId = profile.org_id;
        return cachedOrgId;
      }
    }
    */
  } catch (error) {
    console.error('Error getting org_id:', error);
    // Fallback to fixed org_id
    return FIXED_ORG_ID;
  }
}

/**
 * Clear the org_id cache (call on logout)
 */
export function clearOrgIdCache() {
  cachedOrgId = null;
}

/**
 * Get the fixed org_id (for development/testing)
 */
export function getFixedOrgId(): string {
  return FIXED_ORG_ID;
}
