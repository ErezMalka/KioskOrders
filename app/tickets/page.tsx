'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Plus, Search, Filter, Clock, AlertCircle, CheckCircle, XCircle, User, Calendar, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Ticket {
  id: string
  ticket_number: string
  title: string
  description?: string
  status: string
  priority: string
  category?: string
  customer_id?: string
  created_at: string
  updated_at: string
  customer?: {
    name: string
    email: string
  }
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          customer:customers(name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTickets(data || [])
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = searchTerm === '' || 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusStyle = (status: string) => {
    const styles: Record<string, React.CSSProperties> = {
      new: { backgroundColor: '#EBF5FF', color: '#1E40AF', border: '1px solid #BFDBFE' },
      in_progress: { backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D' },
      resolved: { backgroundColor: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7' },
      closed: { backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB' }
    }
    return styles[status] || styles.closed
  }

  const getPriorityStyle = (priority: string) => {
    const styles: Record<string, React.CSSProperties> = {
      urgent: { backgroundColor: '#FEE2E2', color: '#991B1B' },
      high: { backgroundColor: '#FED7AA', color: '#9A3412' },
      medium: { backgroundColor: '#FEF3C7', color: '#92400E' },
      low: { backgroundColor: '#D1FAE5', color: '#065F46' }
    }
    return styles[priority] || styles.low
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Clock size={16} />
      case 'in_progress': return <AlertCircle size={16} />
      case 'resolved': return <CheckCircle size={16} />
      case 'closed': return <XCircle size={16} />
      default: return null
    }
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      new: 'חדש',
      in_progress: 'בטיפול',
      resolved: 'נפתר',
      closed: 'סגור'
    }
    return texts[status] || status
  }

  const getPriorityText = (priority: string) => {
    const texts: Record<string, string> = {
      urgent: 'דחוף',
      high: 'גבוה',
      medium: 'בינוני',
      low: 'נמוך'
    }
    return texts[priority] || priority
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#F9FAFB', minHeight: '100vh', direction: 'rtl' }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        padding: '24px', 
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
              מרכז תמיכה
            </h1>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>
              ניהול פניות ובקשות לקוחות
            </p>
            
            <div style={{ display: 'flex', gap: '24px', marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3B82F6' }}></div>
                <span style={{ fontSize: '14px', color: '#6B7280' }}>
                  {tickets.filter(t => t.status === 'new').length} חדשים
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#EAB308' }}></div>
                <span style={{ fontSize: '14px', color: '#6B7280' }}>
                  {tickets.filter(t => t.status === 'in_progress').length} בטיפול
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10B981' }}></div>
                <span style={{ fontSize: '14px', color: '#6B7280' }}>
                  {tickets.filter(t => t.status === 'resolved').length} נפתרו
                </span>
              </div>
            </div>
          </div>
          
          <Link href="/tickets/new" style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              <Plus size={20} />
              טיקט חדש
            </button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        padding: '16px', 
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              type="text"
              placeholder="חיפוש לפי מספר טיקט, כותרת או לקוח..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 40px 8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '8px 16px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="all">כל הסטטוסים</option>
            <option value="new">חדש</option>
            <option value="in_progress">בטיפול</option>
            <option value="resolved">נפתר</option>
            <option value="closed">סגור</option>
          </select>
          
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{
              padding: '8px 16px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="all">כל העדיפויות</option>
            <option value="urgent">דחוף</option>
            <option value="high">גבוה</option>
            <option value="medium">בינוני</option>
            <option value="low">נמוך</option>
          </select>
          
          <button
            onClick={fetchTickets}
            style={{
              padding: '8px 16px',
              backgroundColor: '#F3F4F6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <Loader2 size={32} style={{ margin: '0 auto' }} />
            <p style={{ marginTop: '16px', color: '#6B7280' }}>טוען טיקטים...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ fontSize: '18px', color: '#374151', marginBottom: '8px' }}>אין טיקטים להצגה</p>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>צור טיקט חדש או שנה את הפילטרים</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>
                  מספר
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>
                  כותרת
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>
                  לקוח
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>
                  סטטוס
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>
                  עדיפות
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>
                  נוצר
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map(ticket => (
                <tr 
                  key={ticket.id}
                  style={{ 
                    borderBottom: '1px solid #E5E7EB',
                    cursor: 'pointer'
                  }}
                  onClick={() => window.location.href = `/tickets/${ticket.id}`}
                >
                  <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                    #{ticket.ticket_number}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                        {ticket.title}
                      </p>
                      {ticket.description && (
                        <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                          {ticket.description.substring(0, 50)}...
                        </p>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667EEA, #764BA2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <User size={16} color="white" />
                      </div>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                          {ticket.customer?.name || 'לקוח לא ידוע'}
                        </p>
                        <p style={{ fontSize: '12px', color: '#6B7280' }}>
                          {ticket.customer?.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{
                      ...getStatusStyle(ticket.status),
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '500',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {getStatusIcon(ticket.status)}
                      {getStatusText(ticket.status)}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{
                      ...getPriorityStyle(ticket.priority),
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {getPriorityText(ticket.priority)}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontSize: '14px', color: '#374151' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={14} />
                        {new Date(ticket.created_at).toLocaleDateString('he-IL')}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                        {new Date(ticket.created_at).toLocaleTimeString('he-IL', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
