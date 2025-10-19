import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, getCurrentOrgId, getCurrentUser } from '../lib/supabase'
import { 
  Ticket, 
  TicketMessage, 
  TicketStatus, 
  TicketPriority,
  CreateTicketInput,
  UpdateTicketInput 
} from '../lib/types-tickets'

// =================== QUERIES ===================

// Hook לטעינת רשימת טיקטים
export function useTickets(filters?: {
  status?: TicketStatus
  priority?: TicketPriority
  assignedTo?: string
  customerId?: string
  categoryId?: string
}) {
  const orgId = getCurrentOrgId()
  
  return useQuery({
    queryKey: ['tickets', orgId, filters],
    queryFn: async () => {
      let query = supabase
        .from('tickets')
        .select(`
          *,
          customer:customers(*),
          category:ticket_categories(*),
          agent:profiles!tickets_assigned_to_fkey(*),
          messages:ticket_messages(count)
        `)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority)
      }
      if (filters?.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo)
      }
      if (filters?.customerId) {
        query = query.eq('customer_id', filters.customerId)
      }
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }

      const { data, error } = await query

      if (error) throw error

      // Transform the data to include message count
      const ticketsWithCount = data?.map(ticket => ({
        ...ticket,
        message_count: ticket.messages?.[0]?.count || 0
      }))

      return ticketsWithCount as Ticket[]
    },
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Hook לטעינת טיקט בודד
export function useTicket(ticketId: string) {
  return useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          customer:customers(*),
          category:ticket_categories(*),
          agent:profiles!tickets_assigned_to_fkey(*),
          messages:ticket_messages(
            *,
            agent:profiles!ticket_messages_sender_id_fkey(*)
          )
        `)
        .eq('id', ticketId)
        .single()

      if (error) throw error
      return data as Ticket
    },
    enabled: !!ticketId,
  })
}

// Hook לטעינת הודעות של טיקט
export function useTicketMessages(ticketId: string) {
  return useQuery({
    queryKey: ['ticket-messages', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select(`
          *,
          agent:profiles!ticket_messages_sender_id_fkey(*)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as TicketMessage[]
    },
    enabled: !!ticketId,
  })
}

// Hook לטעינת קטגוריות
export function useTicketCategories() {
  const orgId = getCurrentOrgId()
  
  return useQuery({
    queryKey: ['ticket-categories', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_categories')
        .select('*')
        .eq('org_id', orgId)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return data
    },
  })
}

// =================== MUTATIONS ===================

// Hook ליצירת טיקט חדש
export function useCreateTicket() {
  const queryClient = useQueryClient()
  const orgId = getCurrentOrgId()
  
  return useMutation({
    mutationFn: async (input: CreateTicketInput) => {
      // יצירת מספר טיקט ייחודי
      const ticketNumber = `TK${Date.now()}`
      
      const { data, error } = await supabase
        .from('tickets')
        .insert({
          ...input,
          org_id: orgId,
          ticket_number: ticketNumber,
          status: 'open' as TicketStatus,
          created_by: getCurrentUser().id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

// Hook לעדכון סטטוס טיקט
export function useUpdateTicketStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      ticketId, 
      status 
    }: { 
      ticketId: string
      status: TicketStatus 
    }) => {
      const { data, error } = await supabase
        .from('tickets')
        .update({ status })
        .eq('id', ticketId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['ticket', data.id] })
    },
  })
}

// Hook להוספת הודעה לטיקט
export function useAddMessage() {
  const queryClient = useQueryClient()
  const user = getCurrentUser()
  
  return useMutation({
    mutationFn: async ({ 
      ticketId, 
      content, 
      isInternal = false 
    }: { 
      ticketId: string
      content: string
      isInternal?: boolean 
    }) => {
      const { data, error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          content,
          sender_type: 'agent', // או 'customer' בהתאם למשתמש
          sender_id: user.id,
          is_internal: isInternal,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', data.ticket_id] })
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', data.ticket_id] })
    },
  })
}

// Hook להקצאת טיקט לנציג
export function useAssignTicket() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      ticketId, 
      agentId 
    }: { 
      ticketId: string
      agentId: string | null 
    }) => {
      const { data, error } = await supabase
        .from('tickets')
        .update({ 
          assigned_to: agentId,
          status: agentId ? 'in_progress' : 'open'
        })
        .eq('id', ticketId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['ticket', data.id] })
    },
  })
}

// Hook לעדכון טיקט
export function useUpdateTicket() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      ticketId, 
      updates 
    }: { 
      ticketId: string
      updates: UpdateTicketInput 
    }) => {
      const { data, error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', ticketId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['ticket', data.id] })
    },
  })
}

// =================== REALTIME ===================

// Hook למעקב אחרי שינויים בזמן אמת
export function useRealtimeTickets() {
  const queryClient = useQueryClient()
  const orgId = getCurrentOrgId()

  // כאן ניתן להוסיף subscription ל-Supabase Realtime
  // לעדכונים בזמן אמת של טיקטים
  
  return null // TODO: implement realtime subscription
}
