'use client'

import { useState, useEffect } from 'react'
import { Ticket } from '../../../lib/types-tickets'
import { 
  X, 
  Send, 
  Paperclip,
  User,
  Calendar,
  Tag,
  AlertCircle,
  Clock,
  CheckCircle,
  MessageSquare,
  ChevronDown,
  MoreVertical,
  Edit2,
  Trash2,
  UserPlus
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { he } from 'date-fns/locale'
import { useTicket, useAddMessage, useUpdateTicketStatus } from '../../hooks/useTickets'

interface TicketDetailsProps {
  ticket: Ticket
  isOpen: boolean
  onClose: () => void
}

export default function TicketDetails({ ticket: initialTicket, isOpen, onClose }: TicketDetailsProps) {
  const [message, setMessage] = useState('')
  const [selectedStatus, setSelectedStatus] = useState(initialTicket.status)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  
  // טעינת פרטי טיקט מלאים
  const { data: ticket, isLoading } = useTicket(initialTicket.id)
  const addMessage = useAddMessage()
  const updateStatus = useUpdateTicketStatus()

  const currentTicket = ticket || initialTicket

  // סטטוסים אפשריים
  const statuses = [
    { value: 'open', label: 'פתוח', color: 'bg-blue-100 text-blue-700' },
    { value: 'in_progress', label: 'בטיפול', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'waiting_for_customer', label: 'ממתין ללקוח', color: 'bg-purple-100 text-purple-700' },
    { value: 'resolved', label: 'נפתר', color: 'bg-green-100 text-green-700' },
    { value: 'closed', label: 'סגור', color: 'bg-gray-100 text-gray-700' },
  ]

  const currentStatus = statuses.find(s => s.value === selectedStatus) || statuses[0]

  const handleSendMessage = async () => {
    if (!message.trim()) return
    
    try {
      await addMessage.mutateAsync({
        ticketId: currentTicket.id,
        content: message,
        isInternal: false
      })
      setMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus.mutateAsync({
        ticketId: currentTicket.id,
        status: newStatus as any
      })
      setSelectedStatus(newStatus as any)
      setShowStatusDropdown(false)
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-full sm:w-96 bg-white shadow-xl transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="h-full flex flex-col">
        {/* כותרת */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">פרטי טיקט</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-sm opacity-90">#{currentTicket.ticket_number}</div>
        </div>

        {/* פרטים עיקריים */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-900 mb-2">{currentTicket.title}</h3>
          
          {/* סטטוס ועדיפות */}
          <div className="flex gap-2 mb-3">
            {/* סטטוס עם dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${currentStatus.color} hover:opacity-80 transition-opacity`}
              >
                {currentStatus.label}
                <ChevronDown className="w-3 h-3 mr-1" />
              </button>
              
              {showStatusDropdown && (
                <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[150px]">
                  {statuses.map(status => (
                    <button
                      key={status.value}
                      onClick={() => handleStatusChange(status.value)}
                      className="w-full px-3 py-2 text-right text-sm hover:bg-gray-50 flex items-center justify-between"
                    >
                      <span>{status.label}</span>
                      {status.value === selectedStatus && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* עדיפות */}
            <span className={`
              inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
              ${currentTicket.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                currentTicket.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                currentTicket.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'}
            `}>
              {currentTicket.priority === 'urgent' && <AlertCircle className="w-3 h-3 ml-1" />}
              {currentTicket.priority === 'urgent' ? 'דחוף' :
               currentTicket.priority === 'high' ? 'גבוהה' :
               currentTicket.priority === 'medium' ? 'בינונית' : 'נמוכה'}
            </span>
          </div>

          {/* פרטים נוספים */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-gray-600">
              <User className="w-4 h-4 ml-2 text-gray-400" />
              <span className="text-gray-500">לקוח:</span>
              <span className="font-medium mr-2">{currentTicket.customer?.name || 'לא מזוהה'}</span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <Calendar className="w-4 h-4 ml-2 text-gray-400" />
              <span className="text-gray-500">נפתח:</span>
              <span className="font-medium mr-2">
                {format(new Date(currentTicket.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
              </span>
            </div>

            {currentTicket.category && (
              <div className="flex items-center text-gray-600">
                <Tag className="w-4 h-4 ml-2 text-gray-400" />
                <span className="text-gray-500">קטגוריה:</span>
                <span className="font-medium mr-2">{currentTicket.category.name}</span>
              </div>
            )}

            {currentTicket.agent && (
              <div className="flex items-center text-gray-600">
                <User className="w-4 h-4 ml-2 text-gray-400" />
                <span className="text-gray-500">נציג מטפל:</span>
                <span className="font-medium mr-2">{currentTicket.agent.display_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* תיאור */}
        {currentTicket.description && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">תיאור</h4>
            <p className="text-sm text-gray-600">{currentTicket.description}</p>
          </div>
        )}

        {/* הודעות */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">היסטוריית הודעות</h4>
          
          {currentTicket.messages && currentTicket.messages.length > 0 ? (
            <div className="space-y-3">
              {currentTicket.messages.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`rounded-lg p-3 ${
                    msg.sender_type === 'agent' 
                      ? 'bg-blue-50 mr-8' 
                      : 'bg-gray-50 ml-8'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-medium text-gray-700">
                      {msg.sender_type === 'agent' ? msg.agent?.display_name : currentTicket.customer?.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: he })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800">{msg.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">אין הודעות עדיין</p>
          )}
        </div>

        {/* שליחת הודעה */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="הקלד הודעה..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || addMessage.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
