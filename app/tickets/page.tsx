'use client'

import { useState } from 'react'
import { useTickets } from '../hooks/useTickets'
import { Ticket } from '../../lib/types-tickets'
import { 
  Plus, Loader2, Search, Filter, ChevronDown, 
  Clock, AlertCircle, CheckCircle, XCircle,
  User, Calendar, MessageSquare, MoreVertical,
  TrendingUp, TrendingDown, Minus
} from 'lucide-react'
import Link from 'next/link'

export default function TicketsPage() {
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    search: '',
  })
  
  const [selectedTickets, setSelectedTickets] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'status'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // שימוש ב-hook לטעינת טיקטים
  const { data: tickets, isLoading, error, refetch } = useTickets({
    status: filters.status === 'all' ? undefined : filters.status as any,
    priority: filters.priority === 'all' ? undefined : filters.priority as any,
  })

  // סינון טיקטים לפי חיפוש
  const filteredTickets = tickets?.filter(ticket => {
    if (!filters.search) return true
    const searchLower = filters.search.toLowerCase()
    return (
      ticket.title.toLowerCase().includes(searchLower) ||
      ticket.description?.toLowerCase().includes(searchLower) ||
      ticket.ticket_number.toLowerCase().includes(searchLower) ||
      ticket.customer?.name?.toLowerCase().includes(searchLower)
    )
  })

  // מיון טיקטים
  const sortedTickets = [...(filteredTickets || [])].sort((a, b) => {
    const modifier = sortOrder === 'asc' ? 1 : -1
    
    switch (sortBy) {
      case 'date':
        return modifier * (new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case 'priority':
        const priorityOrder = { urgent: 3, high: 2, medium: 1, low: 0 }
        return modifier * (priorityOrder[b.priority] - priorityOrder[a.priority])
      case 'status':
        return modifier * a.status.localeCompare(b.status)
      default:
        return 0
    }
  })

  // פונקציות עזר לסטטוס וpriorty
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'in_progress': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'resolved': return 'bg-green-100 text-green-700 border-green-200'
      case 'closed': return 'bg-gray-100 text-gray-700 border-gray-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Clock className="w-4 h-4" />
      case 'in_progress': return <AlertCircle className="w-4 h-4" />
      case 'resolved': return <CheckCircle className="w-4 h-4" />
      case 'closed': return <XCircle className="w-4 h-4" />
      default: return <Minus className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <TrendingUp className="w-4 h-4" />
      case 'high': return <TrendingUp className="w-4 h-4" />
      case 'medium': return <Minus className="w-4 h-4" />
      case 'low': return <TrendingDown className="w-4 h-4" />
      default: return <Minus className="w-4 h-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'חדש'
      case 'in_progress': return 'בטיפול'
      case 'resolved': return 'נפתר'
      case 'closed': return 'סגור'
      default: return status
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'דחוף'
      case 'high': return 'גבוה'
      case 'medium': return 'בינוני'
      case 'low': return 'נמוך'
      default: return priority
    }
  }

  const handleSelectAll = () => {
    if (selectedTickets.length === sortedTickets.length) {
      setSelectedTickets([])
    } else {
      setSelectedTickets(sortedTickets.map(t => t.id))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* כותרת ומידע כללי */}
      <div className="mb-6 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">מרכז תמיכה</h1>
            <p className="text-gray-600">ניהול פניות ובקשות לקוחות</p>
            
            {/* סטטיסטיקות מהירות */}
            <div className="flex gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  {tickets?.filter(t => t.status === 'new').length || 0} חדשים
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  {tickets?.filter(t => t.status === 'in_progress').length || 0} בטיפול
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  {tickets?.filter(t => t.status === 'resolved').length || 0} נפתרו
                </span>
              </div>
            </div>
          </div>
          
          <Link
            href="/tickets/new"
            className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all transform hover:scale-105 shadow-md"
          >
            <Plus className="w-5 h-5 ml-2" />
            טיקט חדש
          </Link>
        </div>
      </div>

      {/* שורת חיפוש ופילטרים */}
      <div className="mb-6 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex gap-4 items-center">
          {/* חיפוש */}
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש לפי מספר טיקט, כותרת או לקוח..."
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>

          {/* פילטרים */}
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">כל הסטטוסים</option>
            <option value="new">חדש</option>
            <option value="in_progress">בטיפול</option>
            <option value="resolved">נפתר</option>
            <option value="closed">סגור</option>
          </select>

          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
          >
            <option value="all">כל העדיפויות</option>
            <option value="urgent">דחוף</option>
            <option value="high">גבוה</option>
            <option value="medium">בינוני</option>
            <option value="low">נמוך</option>
          </select>

          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* טבלת טיקטים בסגנון Monday */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-red-600 font-medium">שגיאה בטעינת טיקטים</p>
            <button 
              onClick={() => refetch()} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              נסה שוב
            </button>
          </div>
        ) : !sortedTickets?.length ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">אין טיקטים להצגה</h3>
            <p className="text-gray-500 mb-6">צור טיקט חדש כדי להתחיל</p>
            <Link
              href="/tickets/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5 ml-2" />
              יצירת טיקט ראשון
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right">
                    <input
                      type="checkbox"
                      checked={selectedTickets.length === sortedTickets.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    מספר
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    כותרת
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    לקוח
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    סטטוס
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    עדיפות
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    נוצר
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedTickets.map((ticket, index) => (
                  <tr 
                    key={ticket.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/tickets/${ticket.id}`}
                  >
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedTickets.includes(ticket.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTickets([...selectedTickets, ticket.id])
                          } else {
                            setSelectedTickets(selectedTickets.filter(id => id !== ticket.id))
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        #{ticket.ticket_number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                          {ticket.title}
                        </p>
                        {ticket.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {ticket.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {ticket.customer?.name || 'לקוח לא ידוע'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {ticket.customer?.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                        {getStatusIcon(ticket.status)}
                        {getStatusText(ticket.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {getPriorityIcon(ticket.priority)}
                        {getPriorityText(ticket.priority)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {new Date(ticket.created_at).toLocaleDateString('he-IL')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(ticket.created_at).toLocaleTimeString('he-IL', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* פוטר עם מידע */}
      {sortedTickets?.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          מציג {sortedTickets.length} טיקטים
          {selectedTickets.length > 0 && (
            <span className="mr-2">
              • {selectedTickets.length} נבחרו
            </span>
          )}
        </div>
      )}
    </div>
  )
}
