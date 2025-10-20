// Basic types for CRM system

export interface Organization {
  id: string
  name: string
  created_at: string
}

export interface Profile {
  id: string
  org_id: string | null
  email: string | null
  full_name: string | null
  role: 'owner' | 'admin' | 'manager' | 'agent' | 'viewer'
  created_at: string
}

export interface Customer {
  id: string
  org_id: string | null
  type: 'individual' | 'company'
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  created_at: string
}

export interface Lead {
  id: string
  org_id: string | null
  customer_id: string | null
  title: string
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
  value: number | null
  assigned_to: string | null
  created_at: string
}

export interface Activity {
  id: string
  org_id: string | null
  entity_type: string | null
  entity_id: string | null
  type: string | null
  title: string | null
  description: string | null
  created_by: string | null
  created_at: string
}
