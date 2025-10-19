// במקום השורה בעייתית ב-app/components/tickets/TicketCard.tsx:
// import { Ticket } from '../../lib/types-tickets'

// נסה אחת מהאפשרויות:

// אופציה 1 - אם lib בתוך app:
import { Ticket } from '../../lib/types-tickets'

// אופציה 2 - אם lib ברמה הראשית:
import { Ticket } from '../../../lib/types-tickets'

// אופציה 3 - הגדרה מקומית זמנית (פתרון מיידי):
// במקום לייבא, הגדר את ה-interface ישירות בקובץ:

interface Ticket {
  id: string
  org_id: string
  ticket_number: string
  title: string
  description?: string
  status: 'open' | 'in_progress' | 'waiting_for_customer' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  source: 'email' | 'phone' | 'whatsapp' | 'web' | 'manual'
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
  customer?: any
  agent?: any
  category?: any
  messages?: any[]
  message_count?: number
}

// ואז תמשיך עם שאר הקוד...
