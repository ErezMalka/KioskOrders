'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/lib/database.types';
import TicketFilters from '@/app/components/TicketFilters';

type Ticket = Database['public']['Tables']['tickets']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];

const containerStyle: React.CSSProperties = {
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '20px'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '30px'
};

const titleStyle: React.CSSProperties = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#333'
};

const newTicketButtonStyle: React.CSSProperties = {
  backgroundColor: '#4CAF50',
  color: 'white',
  padding: '12px 24px',
  borderRadius: '6px',
  border: 'none',
  fontSize: '16px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.3s',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const tableContainerStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse' as const
};

const thStyle: React.CSSProperties = {
  backgroundColor: '#f5f5f5',
  padding: '12px',
  textAlign: 'right' as const,
  fontSize: '14px',
  fontWeight: '600',
  color: '#333',
  borderBottom: '2px solid #e0e0e0'
};

const tdStyle: React.CSSProperties = {
  padding: '12px',
  borderBottom: '1px solid #f0f0f0',
  fontSize: '14px'
};

const priorityBadgeStyle = (priority: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '4px 8px',
  borderRadius: '12px',
  fontSize: '11px',
  fontWeight: '500',
  backgroundColor: 
    priority === 'urgent' ? '#ffebee' :
    priority === 'high' ? '#fff3e0' :
    priority === 'medium' ? '#e3f2fd' : '#e8f5e9',
  color: 
    priority === 'urgent' ? '#c62828' :
    priority === 'high' ? '#e65100' :
    priority === 'medium' ? '#1565c0' : '#2e7d32'
});

const statusBadgeStyle = (status: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '4px 8px',
  borderRadius: '12px',
  fontSize: '11px',
  fontWeight: '500',
  backgroundColor: 
    status === 'open' ? '#e3f2fd' :
    status === 'in_progress' ? '#fff3e0' :
    status === 'resolved' ? '#e8f5e9' :
    status === 'closed' ? '#f5f5f5' : '#ffebee',
  color: 
    status === 'open' ? '#1565c0' :
    status === 'in_progress' ? '#e65100' :
    status === 'resolved' ? '#2e7d32' :
    status === 'closed' ? '#616161' : '#c62828'
});

const rowStyle: React.CSSProperties = {
  cursor: 'pointer',
  transition: 'background-color 0.2s'
};

const loadingStyle: React.CSSProperties = {
  textAlign: 'center' as const,
  padding: '50px',
  fontSize: '16px',
  color: '#666'
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center' as const,
  padding: '60px',
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
  margin: '20px 0'
};

const emptyStateIconStyle: React.CSSProperties = {
  fontSize: '48px',
  marginBottom: '20px'
};

const emptyStateTextStyle: React.CSSProperties = {
  fontSize: '18px',
  color: '#666',
  marginBottom: '20px'
};

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    search: ''
  });

  useEffect(() => {
    fetchTickets();
    fetchCustomers();
  }, []);

  async function fetchTickets() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCustomers() {
    const { data } = await supabase
      .from('customers')
      .select('*');
    
    if (data) {
      setCustomers(data);
    }
  }

  // Filter tickets based on current filters
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      // Status filter
      if (filters.status && ticket.status !== filters.status) {
        return false;
      }
      
      // Priority filter
      if (filters.priority && ticket.priority !== filters.priority) {
        return false;
      }
      
      // Category filter
      if (filters.category && ticket.category !== filters.category) {
        return false;
      }
      
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesTitle = ticket.title?.toLowerCase().includes(searchTerm);
        const matchesDescription = ticket.description?.toLowerCase().includes(searchTerm);
        const matchesId = ticket.id?.toString().includes(searchTerm);
        
        if (!matchesTitle && !matchesDescription && !matchesId) {
          return false;
        }
      }
      
      return true;
    });
  }, [tickets, filters]);

  const getCustomerName = (customerId: string | null) => {
    if (!customerId) return 'לא מוגדר';
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'לא ידוע';
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'דחוף';
      case 'high': return 'גבוה';
      case 'medium': return 'בינוני';
      case 'low': return 'נמוך';
      default: return priority;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'פתוח';
      case 'in_progress': return 'בטיפול';
      case 'pending': return 'בהמתנה';
      case 'resolved': return 'נפתר';
      case 'closed': return 'סגור';
      default: return status;
    }
  };

  const getCategoryText = (category: string | null) => {
    if (!category) return 'לא מוגדר';
    switch (category) {
      case 'support': return 'תמיכה';
      case 'bug': return 'באג';
      case 'feature': return 'בקשת פיצר';
      case 'other': return 'אחר';
      default: return category;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) {
      return 'לפני פחות משעה';
    } else if (diffHours < 24) {
      return `לפני ${diffHours} שעות`;
    } else if (diffDays === 1) {
      return 'אתמול';
    } else if (diffDays < 7) {
      return `לפני ${diffDays} ימים`;
    } else {
      return date.toLocaleDateString('he-IL');
    }
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>
          <div>טוען טיקטים...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>ניהול טיקטים</h1>
        <button
          onClick={() => router.push('/tickets/new')}
          style={newTicketButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#45a049';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#4CAF50';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={{ fontSize: '20px' }}>+</span>
          טיקט חדש
        </button>
      </div>

      {/* Filters */}
      <TicketFilters 
        filters={filters} 
        onFilterChange={setFilters}
      />

      {/* Tickets Table */}
      {filteredTickets.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={emptyStateIconStyle}>📋</div>
          <div style={emptyStateTextStyle}>
            {filters.search || filters.status || filters.priority || filters.category
              ? 'לא נמצאו טיקטים התואמים לחיפוש'
              : 'עדיין אין טיקטים במערכת'}
          </div>
          {!filters.search && !filters.status && !filters.priority && !filters.category && (
            <button
              onClick={() => router.push('/tickets/new')}
              style={{
                ...newTicketButtonStyle,
                margin: '0 auto'
              }}
            >
              צור את הטיקט הראשון
            </button>
          )}
        </div>
      ) : (
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>מס׳</th>
                <th style={thStyle}>כותרת</th>
                <th style={thStyle}>לקוח</th>
                <th style={thStyle}>קטגוריה</th>
                <th style={thStyle}>סטטוס</th>
                <th style={thStyle}>עדיפות</th>
                <th style={thStyle}>נוצר</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  style={rowStyle}
                  onClick={() => router.push(`/tickets/${ticket.id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <td style={tdStyle}>
                    <span style={{ color: '#666', fontSize: '12px' }}>
                      #{ticket.id.slice(0, 8)}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: '500' }}>
                    {ticket.title}
                  </td>
                  <td style={tdStyle}>
                    {getCustomerName(ticket.customer_id)}
                  </td>
                  <td style={tdStyle}>
                    {getCategoryText(ticket.category)}
                  </td>
                  <td style={tdStyle}>
                    <span style={statusBadgeStyle(ticket.status)}>
                      {getStatusText(ticket.status)}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={priorityBadgeStyle(ticket.priority)}>
                      {getPriorityText(ticket.priority)}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: '#666', fontSize: '13px' }}>
                    {formatDate(ticket.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Stats */}
      {tickets.length > 0 && (
        <div style={{ 
          marginTop: '20px', 
          textAlign: 'center' as const, 
          color: '#666',
          fontSize: '14px'
        }}>
          מציג {filteredTickets.length} מתוך {tickets.length} טיקטים
        </div>
      )}
    </div>
  );
}
