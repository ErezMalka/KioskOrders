'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CustomersPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    // בדיקת משתמש מחובר
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      alert('אתה צריך להתחבר קודם!')
      router.push('/')
      return
    }
    
    setUser(user)
    
    // בדיקה אם המשתמש הוא אדמין
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role === 'admin') {
      setIsAdmin(true)
    } else {
      alert('רק אדמין יכול להוסיף לקוחות!')
      router.push('/')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isAdmin) {
      alert('אין לך הרשאות!')
      return
    }
    
    setLoading(true)

    const { data, error } = await supabase
      .from('customers')
      .insert({
        name,
        email: email || null,
        phone: phone || null,
        created_by: user.id
      })
      .select()

    if (error) {
      console.error('Error details:', error)
      alert('שגיאה: ' + error.message)
    } else {
      alert('לקוח נוסף בהצלחה!')
      setName('')
      setEmail('')
      setPhone('')
    }
    
    setLoading(false)
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">בודק הרשאות...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <div className="max-w-md mx-auto">
        <div className="mb-4 bg-green-50 p-3 rounded">
          <p className="text-sm">מחובר כ: {user.email}</p>
          <p className="text-sm font-bold">סטטוס: אדמין ✓</p>
        </div>
        
        <h1 className="text-2xl font-bold mb-6">הוספת לקוח חדש</h1>
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">שם לקוח *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">אימייל</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">טלפון</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !name}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'שומר...' : 'הוסף לקוח'}
            </button>
            
            <button
              type="button"
              onClick={() => router.push('/')}
              className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            >
              חזור
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
