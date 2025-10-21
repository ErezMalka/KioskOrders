'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AddCustomerPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('customers')
        .insert({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null
        })

      if (error) throw error

      setMessage('✅ לקוח נוסף בהצלחה!')
      
      // נקה את הטופס
      setFormData({ name: '', email: '', phone: '' })
      
      // עבור לרשימה אחרי 2 שניות
      setTimeout(() => {
        router.push('/customers/list')
      }, 2000)
      
    } catch (error: any) {
      setMessage('❌ שגיאה: ' + error.message)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">הוספת לקוח חדש</h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                שם מלא <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="ישראל ישראלי"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                אימייל
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                טלפון
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="050-1234567"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={loading || !formData.name}
                className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'שומר...' : 'שמור לקוח'}
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/customers/list')}
                className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400"
              >
                ביטול
              </button>
            </div>
          </form>

          {message && (
            <div className={`mt-4 p-3 rounded text-center ${
              message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
