export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tickets: {
        Row: {
          id: string
          ticket_number: string
          customer_id: string
          subject: string
          description: string
          status: string
          priority: string
          assigned_to: string | null
          org_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ticket_number: string
          customer_id: string
          subject: string
          description: string
          status?: string
          priority?: string
          assigned_to?: string | null
          org_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ticket_number?: string
          customer_id?: string
          subject?: string
          description?: string
          status?: string
          priority?: string
          assigned_to?: string | null
          org_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string
          legal_id: string | null
          contact_name: string | null
          address: string | null
          notes: string | null
          org_id: string
          status_id: string | null
          brand_id: string | null
          pos_vendor_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone: string
          legal_id?: string | null
          contact_name?: string | null
          address?: string | null
          notes?: string | null
          org_id: string
          status_id?: string | null
          brand_id?: string | null
          pos_vendor_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string
          legal_id?: string | null
          contact_name?: string | null
          address?: string | null
          notes?: string | null
          org_id?: string
          status_id?: string | null
          brand_id?: string | null
          pos_vendor_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          base_price: number
          description: string | null
          category: string | null
          org_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          base_price: number
          description?: string | null
          category?: string | null
          org_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          base_price?: number
          description?: string | null
          category?: string | null
          org_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_id: string
          org_id: string
          total_amount: number
          status: string
          payment_method: string
          payment_terms: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          customer_id: string
          org_id: string
          total_amount: number
          status?: string
          payment_method: string
          payment_terms: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          customer_id?: string
          org_id?: string
          total_amount?: number
          status?: string
          payment_method?: string
          payment_terms?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_lines: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          discount: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          discount?: number
          total_price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          discount?: number
          total_price?: number
          created_at?: string
        }
      }
      statuses: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      brands: {
        Row: {
          id: string
          name: string
          description: string | null
          logo_url: string | null
          website: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          logo_url?: string | null
          website?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          logo_url?: string | null
          website?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      pos_vendors: {
        Row: {
          id: string
          name: string
          description: string | null
          contact_info: string | null
          api_endpoint: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          contact_info?: string | null
          api_endpoint?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          contact_info?: string | null
          api_endpoint?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          org_id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          role: string | null
          github_username: string | null
          gitlab_username: string | null
          skills: string[] | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: string | null
          github_username?: string | null
          gitlab_username?: string | null
          skills?: string[] | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: string | null
          github_username?: string | null
          gitlab_username?: string | null
          skills?: string[] | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}