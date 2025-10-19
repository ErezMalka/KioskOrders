'use client'

import { useState } from 'react'
import { useTickets } from '../../hooks/useTickets'
import TicketFilters from '../components/tickets/TicketFilters'
import TicketCard from '../components/tickets/TicketCard'
import TicketDetails from '../components/tickets/TicketDetails'
import { Ticket } from '../../lib/types-tickets'
import { Plus, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function TicketsPage() {
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    search: '',
  })
  
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  
  // שימוש ב-hook לטעינת טיקטים
  const { data: tickets, isLoading, error } = useTickets({
    status: filters.status === 'all' ? undefined : filters.status as any,
    priority: filters.priority === 'all' ? undefined : filters.priority as any,
  })

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setIsDetailsOpen(true)
  }

  const handleCloseDetails = () => {
    setIsDetailsOpen(false)
    setTimeout(() => setSelectedTicket(null), 300)
  }

  // סינון טיקטים לפי חיפוש
  const filteredTickets = tickets?.filter(ticket => {
    if (!filters.search) return true
    const searchLower = filters.search.toLowerCase()
    return (
      ticket.title.toLowerCase().includes(searchLower) ||
      ticket.description?.toLowerCase().includes(searchLower) ||
      ticket.ticket_number.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="h-full">
      {/* כותרת וכפתור חדש */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">טיקטים</h1>
          <p className="mt-1 text-sm text-gray-500">
            ניהול פניות ובקשות לקוחות
          </p>
        </div>
        <Link
          href="/tickets/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5 ml-2" />
          טיקט חדש
        </Link>
      </div>

      {/* פילטרים */}
      <TicketFilters filters={filters} onFiltersChange={setFilters} />

      {/* רשימת טיקטים */}
      <div className="mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">שגיאה בטעינת טיקטים</p>
          </div>
        ) : !filteredTickets?.length ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">אין טיקטים להצגה</p>
            <p className="text-sm text-gray-400 mt-1">
              נסה לשנות את הפילטרים או צור טיקט חדש
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTickets.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onClick={handleTicketClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* פאנל פרטי טיקט */}
      {selectedTicket && (
        <TicketDetails
          ticket={selectedTicket}
          isOpen={isDetailsOpen}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  )
}
