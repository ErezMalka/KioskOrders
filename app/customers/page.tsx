'use client'

import { useState, useEffect } from 'react'
import { 
  Search, Plus, Edit2, Trash2, Phone, Mail, MapPin, Building, 
  User, Calendar, DollarSign, Package, FileText, Download, Upload,
  Star, Check, AlertCircle, Sparkles, Users, Trophy, Zap, 
  Shield, TrendingUp, Target, Smartphone, Filter,
  ChevronRight, Activity, Award, Layers, Command,
  BarChart3, PieChart, TrendingDown, ArrowUpRight, Gem,
  Rocket, Crown, Flame, Heart, MessageCircle, Bell, Settings,
  Grid, LayoutGrid, Table
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  created_at: string
  [key: string]: any
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: ''
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  async function fetchCustomers() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(formData)
          .eq('id', editingCustomer.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([formData])

        if (error) throw error
      }

      await fetchCustomers()
      setShowForm(false)
      setEditingCustomer(null)
      setFormData({ name: '', email: '', phone: '', address: '', city: '' })
      
    } catch (error) {
      console.error('Error saving customer:', error)
      alert('שגיאה בשמירת הלקוח')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הלקוח?')) return

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchCustomers()
    } catch (error) {
      console.error('Error deleting customer:', error)
      alert('שגיאה במחיקת הלקוח')
    }
  }

  function handleEdit(customer: Customer) {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || ''
    })
    setShowForm(true)
  }

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchQuery.toLowerCase()
    return (
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(searchQuery) ||
      customer.city?.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-2xl">טוען לקוחות...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="w-8 h-8" />
          ניהול לקוחות
        </h1>
        <button
          onClick={() => {
            setShowForm(!showForm)
            if (!showForm) {
              setEditingCustomer(null)
              setFormData({ name: '', email: '', phone: '', address: '', city: '' })
            }
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          הוסף לקוח
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="חיפוש לפי שם, אימייל, טלפון או עיר..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-bold mb-4">
            {editingCustomer ? 'עריכת לקוח' : 'לקוח חדש'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <User className="inline w-4 h-4 ml-1" />
                שם הלקוח *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Mail className="inline w-4 h-4 ml-1" />
                אימייל
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Phone className="inline w-4 h-4 ml-1" />
                טלפון
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <MapPin className="inline w-4 h-4 ml-1" />
                כתובת
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Building className="inline w-4 h-4 ml-1" />
                עיר
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
              >
                {editingCustomer ? 'עדכן' : 'הוסף'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingCustomer(null)
                  setFormData({ name: '', email: '', phone: '', address: '', city: '' })
                }}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-5">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(customer)}
                  className="text-blue-600 hover:text-blue-800 p-1"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(customer.id)}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {customer.email && (
                <div className="flex items-center text-gray-600">
                  <Mail className="w-4 h-4 ml-2" />
                  {customer.email}
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center text-gray-600">
                  <Phone className="w-4 h-4 ml-2" />
                  {customer.phone}
                </div>
              )}
              {customer.city && (
                <div className="flex items-center text-gray-600">
                  <Building className="w-4 h-4 ml-2" />
                  {customer.city}
                </div>
              )}
              {customer.address && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 ml-2" />
                  {customer.address}
                </div>
              )}
              <div className="flex items-center text-gray-500 text-xs pt-2 border-t">
                <Calendar className="w-3 h-3 ml-1" />
                {new Date(customer.created_at).toLocaleDateString('he-IL')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">
            {searchQuery ? 'לא נמצאו לקוחות התואמים לחיפוש' : 'אין לקוחות להצגה'}
          </p>
        </div>
      )}

      {/* Statistics */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-blue-600 text-sm">סה"כ לקוחות</div>
          <div className="text-2xl font-bold text-blue-800">{customers.length}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-green-600 text-sm">לקוחות החודש</div>
          <div className="text-2xl font-bold text-green-800">
            {customers.filter(c => {
              const createdDate = new Date(c.created_at)
              const now = new Date()
              return createdDate.getMonth() === now.getMonth() && 
                     createdDate.getFullYear() === now.getFullYear()
            }).length}
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="text-yellow-600 text-sm">עם אימייל</div>
          <div className="text-2xl font-bold text-yellow-800">
            {customers.filter(c => c.email).length}
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-purple-600 text-sm">עם טלפון</div>
          <div className="text-2xl font-bold text-purple-800">
            {customers.filter(c => c.phone).length}
          </div>
        </div>
      </div>
    </div>
  )
}
