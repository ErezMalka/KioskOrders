'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function CustomersPage() {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // פשוט ננסה להוסיף לקוח בלי שום בדיקות
      const { data, error } = await supabase
        .from('customers')
        .insert({ 
          name: name || 'לקוח ללא שם'
        })
        .select()

      if (error) throw error

      setMessage('✅ הלקוח נוסף בהצלחה!')
      setName('')
      
      // רענן את רשימת הלקוחות
      const { data: customers } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      
      console.log('לקוחות אחרונים:', customers)
      
    } catch (error: any) {
      setMessage('❌ שגיאה: ' + error.message)
      console.error('Error details:', error)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">הוספת לקוח</h1>
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">שם הלקוח</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="הכנס שם לקוח"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'שומר...' : 'הוסף לקוח'}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-4 rounded ${
            message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-4">
          <a href="/" className="text-blue-500 hover:underline">
            ← חזור לדף הבית
          </a>
        </div>
      </div>
    </div>
  )
}
