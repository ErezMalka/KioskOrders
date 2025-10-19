// =================== ENUMS & CONSTANTS ===================

export const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  WAITING_FOR_CUSTOMER: 'waiting_for_customer',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
} as const

export const TICKET_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
} as const

export const TICKET_SOURCE = {
  EMAIL: 'email',
  PHONE: 'phone',
  WHATSAPP: 'whatsapp',
  WEB: 'web',
  MANUAL: 'manual'
} as const

export const MESSAGE_SENDER_TYPE = {
  CUSTOMER: 'customer',
  AGENT: 'agent',
  SYSTEM: 'system'
} as const

// =================== TYPE DEFINITIONS ===================

export type TicketStatus = typeof TICKET_STATUS[keyof typeof TICKET_STATUS]
export type TicketPriority = typeof TICKET_PRIORITY[keyof typeof TICKET_PRIORITY]
export type TicketSource = typeof TICKET_SOURCE[keyof typeof TICKET_SOURCE]
export type MessageSenderType = typeof MESSAGE_SENDER_TYPE[keyof typeof MESSAGE_SENDER_TYPE]

// =================== INTERFACES ===================

// טבלת customers (לקוחות) - ייבוא מהמערכת הקיימת
export interface Customer {
  id: string
  org_id: string
  name: string
  email?: string
  phone?: string
  created_at: string
  updated_at: string
  // שדות נוספים מהמערכת הקיימת
  [key: string]: any
}

// טבלת profiles (פרופילים של משתמשי מערכת)
export interface Profile {
  id: string
  email: string
  display_name?: string
  avatar_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// טבלת organizations (ארגונים)
export interface Organization {
  id: string
  name: string
  slug: string
  logo_url?: string
  settings?: Record<string, any>
  created_at: string
  updated_at: string
}

// טבלת ticket_categories (קטגוריות טיקטים)
export interface TicketCategory {
  id: string
  org_id: string
  name: string
  description?: string
  color?: string
  icon?: string
  parent_id?: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// טבלת tickets (טיקטים)
export interface Ticket {
  id: string
  org_id: string
  ticket_number: string
  title: string
  description?: string
  status: TicketStatus
  priority: TicketPriority
  source: TicketSource
  customer_id?: string
  assigned_to?: string
  category_id?: string
  tags?: string[]
  metadata?: Record<string, any>
  resolved_at?: string
  closed_at?: string
  created_by: string
  created_at: string
  updated_at: string
  
  // Relations
  customer?: Customer
  agent?: Profile
  category?: TicketCategory
  messages?: TicketMessage[]
  message_count?: number
}

// טבלת ticket_messages (הודעות בטיקט)
export interface TicketMessage {
  id: string
  ticket_id: string
  content: string
  sender_type: MessageSenderType
  sender_id?: string
  is_internal: boolean
  attachments?: TicketAttachment[]
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  
  // Relations
  ticket?: Ticket
  agent?: Profile
  customer?: Customer
}

// טבלת ticket_attachments (קבצים מצורפים)
export interface TicketAttachment {
  id: string
  message_id?: string
  ticket_id: string
  file_name: string
  file_size: number
  file_type: string
  file_url: string
  uploaded_by: string
  created_at: string
}

// טבלת agent_profiles (פרופילים של נציגי שירות)
export interface AgentProfile {
  id: string
  user_id: string
  org_id: string
  display_name: string
  role: 'agent' | 'supervisor' | 'admin'
  departments?: string[]
  skills?: string[]
  max_tickets?: number
  is_available: boolean
  working_hours?: WorkingHours
  created_at: string
  updated_at: string
  
  // Relations
  profile?: Profile
}

// טבלת response_templates (תבניות תגובה)
export interface ResponseTemplate {
  id: string
  org_id: string
  title: string
  content: string
  category?: string
  shortcuts?: string[]
  variables?: string[]
  is_active: boolean
  usage_count: number
  created_by: string
  created_at: string
  updated_at: string
}

// טבלת kb_articles (מאמרי Knowledge Base)
export interface KBArticle {
  id: string
  org_id: string
  title: string
  slug: string
  content: string
  summary?: string
  category_id?: string
  tags?: string[]
  is_published: boolean
  is_featured: boolean
  views_count: number
  helpful_count: number
  not_helpful_count: number
  author_id: string
  published_at?: string
  created_at: string
  updated_at: string
  
  // Relations
  category?: KBCategory
  author?: Profile
}

// טבלת kb_categories (קטגוריות Knowledge Base)
export interface KBCategory {
  id: string
  org_id: string
  name: string
  slug: string
  description?: string
  icon?: string
  parent_id?: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Relations
  articles?: KBArticle[]
}

// טבלת kb_faqs (שאלות נפוצות)
export interface KBFAQ {
  id: string
  org_id: string
  question: string
  answer: string
  category_id?: string
  sort_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

// =================== HELPER TYPES ===================

export interface WorkingHours {
  sunday?: { start: string; end: string }
  monday?: { start: string; end: string }
  tuesday?: { start: string; end: string }
  wednesday?: { start: string; end: string }
  thursday?: { start: string; end: string }
  friday?: { start: string; end: string }
  saturday?: { start: string; end: string }
}

export interface CreateTicketInput {
  title: string
  description?: string
  priority: TicketPriority
  source: TicketSource
  customer_id?: string
  category_id?: string
  assigned_to?: string
  tags?: string[]
  metadata?: Record<string, any>
}

export interface UpdateTicketInput {
  title?: string
  description?: string
  status?: TicketStatus
  priority?: TicketPriority
  assigned_to?: string | null
  category_id?: string | null
  tags?: string[]
  metadata?: Record<string, any>
}

export interface TicketFilters {
  status?: TicketStatus | TicketStatus[]
  priority?: TicketPriority | TicketPriority[]
  assigned_to?: string
  customer_id?: string
  category_id?: string
  source?: TicketSource
  date_from?: string
  date_to?: string
  search?: string
  tags?: string[]
}

export interface TicketStats {
  total: number
  open: number
  in_progress: number
  waiting_for_customer: number
  resolved: number
  closed: number
  urgent_count: number
  avg_resolution_time?: number
  avg_first_response_time?: number
}

// =================== UTILITY FUNCTIONS ===================

export const getStatusColor = (status: TicketStatus): string => {
  const colors = {
    open: 'blue',
    in_progress: 'yellow',
    waiting_for_customer: 'purple',
    resolved: 'green',
    closed: 'gray'
  }
  return colors[status] || 'gray'
}

export const getPriorityColor = (priority: TicketPriority): string => {
  const colors = {
    low: 'gray',
    medium: 'blue',
    high: 'orange',
    urgent: 'red'
  }
  return colors[priority] || 'gray'
}

export const getStatusLabel = (status: TicketStatus): string => {
  const labels = {
    open: 'פתוח',
    in_progress: 'בטיפול',
    waiting_for_customer: 'ממתין ללקוח',
    resolved: 'נפתר',
    closed: 'סגור'
  }
  return labels[status] || status
}

export const getPriorityLabel = (priority: TicketPriority): string => {
  const labels = {
    low: 'נמוכה',
    medium: 'בינונית',
    high: 'גבוהה',
    urgent: 'דחוף'
  }
  return labels[priority] || priority
}
