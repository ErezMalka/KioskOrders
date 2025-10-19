'use client'

import { Ticket } from '../../lib/types-tickets'
import { 
  Clock, 
  User, 
  MessageSquare, 
  AlertCircle,
  CheckCircle,
  Circle,
  ArrowRight,
  Calendar,
  Tag
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'

interface TicketCardProps {
  ticket: Ticket
  onClick: (ticket: Ticket) => void
}

export default function TicketCard({ ticket, onClick }: TicketCardProps) {
  // קביעת צבע לפי סטטוס
  const statusConfig = {
    open: { color: 'bg-blue-100 text-blue-700', icon: Circle, label: 'פתוח' },
    in_progress: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'בטיפול' },
    waiting_for_customer: { color: 'bg-purple-100 text-purple-700', icon: User, label: 'ממתין ללקוח' },
    resolved: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'נפתר' },
    closed: { color: 'bg-gray-100 text-gray-700', icon: CheckCircle, label: 'סגור' },
  }

  // קביעת צבע לפי עדיפות
  const priorityConfig = {
    low: { color: 'bg-gray-100 text-gray-600', label: 'נמוכה' },
    medium: { color: 'bg-blue-100 text-blue-600', label: 'בינונית' },
    high: { color: 'bg-orange-100 text-orange-600', label: 'גבוהה' },
    urgent: { color: 'bg-red-100 text-red-600', label: 'דחוף', icon: AlertCircle },
  }

  const status = statusConfig[ticket.status] || statusConfig.open
  const priority = priorityConfig[ticket.priority] || priorityConfig.medium
  const StatusIcon = status.icon

  return (
    <div
      onClick={() => onClick(ticket)}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer group"
    >
      {/* כותרת ומספר טיקט */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500 font-mono">
              #{ticket.ticket_number}
            </span>
            {ticket.priority === 'urgent' && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
          </div>
          <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
            {ticket.title}
          </h3>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
      </div>

      {/* תיאור */}
      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
        {ticket.description || 'אין תיאור'}
      </p>

      {/* מידע נוסף */}
      <div className="flex flex-wrap gap-2 mb-3">
        {/* סטטוס */}
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
          <StatusIcon className="w-3 h-3 ml-1" />
          {status.label}
        </span>

        {/* עדיפות */}
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priority.color}`}>
          {priority.label}
        </span>

        {/* קטגוריה */}
        {ticket.category && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <Tag className="w-3 h-3 ml-1" />
            {ticket.category.name}
          </span>
        )}
      </div>

      {/* תחתית - זמן ולקוח */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <div className="flex items-center gap-3">
          {/* לקוח */}
          <div className="flex items-center">
            <User className="w-3 h-3 ml-1" />
            <span>{ticket.customer?.name || 'לקוח לא מזוהה'}</span>
          </div>

          {/* הודעות */}
          <div className="flex items-center">
            <MessageSquare className="w-3 h-3 ml-1" />
            <span>{ticket.message_count || 0}</span>
          </div>
        </div>

        {/* זמן */}
        <div className="flex items-center">
          <Calendar className="w-3 h-3 ml-1" />
          <span>
            {formatDistanceToNow(new Date(ticket.created_at), {
              addSuffix: true,
              locale: he
            })}
          </span>
        </div>
      </div>

      {/* נציג מטפל */}
      {ticket.assigned_to && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">נציג מטפל:</span>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium">
                {ticket.agent?.display_name?.charAt(0) || '?'}
              </div>
              <span className="text-xs text-gray-700 mr-2">
                {ticket.agent?.display_name || 'לא הוקצה'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
