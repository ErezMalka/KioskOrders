/**
 * פונקציות עזר לפורמט ולידציה
 */

// =====================================================
// פורמט תצוגה
// =====================================================

/**
 * פורמט מספר טלפון לתצוגה
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '-';
  
  // הסר כל תו שאינו ספרה
  const digits = phone.replace(/\D/g, '');
  
  // טלפון נייד ישראלי (10 ספרות עם 0 בהתחלה)
  if (digits.length === 10 && digits.startsWith('05')) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  // טלפון נייד ישראלי (9 ספרות בלי 0 בהתחלה)
  if (digits.length === 9 && digits.startsWith('5')) {
    return `0${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  
  // טלפון קווי עם קידומת אזור
  if (digits.length === 9 && digits.startsWith('0')) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  
  // טלפון קווי עם קידומת 3 ספרות
  if (digits.length === 10 && digits.startsWith('07')) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  return phone;
}

/**
 * פורמט סכום כסף לתצוגה
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '₪0';
  
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * פורמט תאריך לתצוגה
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '-';
  
  return d.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * פורמט תאריך ושעה לתצוגה
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '-';
  
  return d.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// =====================================================
// ולידציות
// =====================================================

/**
 * בדיקת תקינות כתובת אימייל
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * בדיקת תקינות מספר טלפון ישראלי
 */
export function isValidPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  // 9 או 10 ספרות, מתחיל ב-0
  const phoneRegex = /^0[0-9]{8,9}$/;
  return phoneRegex.test(cleanPhone);
}

/**
 * בדיקת תקינות מספר עוסק מורשה
 */
export function isValidVatNumber(vatNumber: string): boolean {
  if (!vatNumber) return true; // שדה אופציונלי
  const cleanVat = vatNumber.replace(/\D/g, '');
  return cleanVat.length === 9;
}

/**
 * בדיקת תקינות מספר ת"ז ישראלית
 */
export function isValidIdNumber(idNumber: string): boolean {
  if (!idNumber) return true; // שדה אופציונלי
  
  const cleanId = idNumber.replace(/\D/g, '');
  if (cleanId.length !== 9) return false;
  
  // אלגוריתם בדיקת ת"ז ישראלית
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let num = Number(cleanId[i]) * ((i % 2) + 1);
    sum += num > 9 ? Math.floor(num / 10) + (num % 10) : num;
  }
  
  return sum % 10 === 0;
}

/**
 * בדיקת תקינות URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// =====================================================
// המרות ומיפויים
// =====================================================

/**
 * קבלת שם אזור בעברית
 */
export function getRegionName(region: string | null | undefined): string {
  if (!region) return '-';
  
  const regions: Record<string, string> = {
    'north': 'צפון',
    'south': 'דרום',
    'center': 'מרכז',
    'sharon': 'שרון',
    'jerusalem': 'ירושלים',
    'tel-aviv': 'תל אביב',
    'haifa': 'חיפה',
    'other': 'אחר',
  };
  
  return regions[region] || region;
}

/**
 * קבלת class של Tailwind לפי צבע סטטוס
 */
export function getStatusColor(color: string | null | undefined): string {
  if (!color) return 'bg-gray-100 text-gray-800';
  
  const colorMap: Record<string, string> = {
    '#28a745': 'bg-green-100 text-green-800',
    '#dc3545': 'bg-red-100 text-red-800',
    '#ffc107': 'bg-yellow-100 text-yellow-800',
    '#17a2b8': 'bg-blue-100 text-blue-800',
    '#6c757d': 'bg-gray-100 text-gray-800',
  };
  
  return colorMap[color.toLowerCase()] || 'bg-gray-100 text-gray-800';
}

// =====================================================
// פונקציות עזר כלליות
// =====================================================

/**
 * Debounce function - השהיית קריאה לפונקציה
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * הצגת הודעת Toast
 * כרגע משתמש ב-alert, מומלץ להחליף ל-react-hot-toast או sonner
 */
export function showToast(
  message: string,
  type: 'success' | 'error' | 'info' | 'warning' = 'info'
) {
  // TODO: להחליף ל-toast library אמיתי
  if (type === 'error') {
    console.error(message);
    alert(`שגיאה: ${message}`);
  } else if (type === 'success') {
    console.log(message);
    alert(`הצלחה: ${message}`);
  } else if (type === 'warning') {
    console.warn(message);
    alert(`אזהרה: ${message}`);
  } else {
    console.log(message);
    alert(message);
  }
}

/**
 * קיצור טקסט ארוך
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * יצירת initials משם מלא
 */
export function getInitials(name: string): string {
  if (!name) return '';
  
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * בדיקה אם המכשיר הוא מובייל
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
}
