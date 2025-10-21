'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    customers: 0
  })
  const router = useRouter()

  useEffect(() => {
    checkUser()
    loadStats()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadStats = async () => {
    const { count } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
    
    setStats({
      customers: count || 0
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* כותרת */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">מערכת CRM</h1>
            {user && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  התנתק
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* תוכן ראשי */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* כרטיס סטטיסטיקה */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                סה"כ לקוחות
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {stats.customers}
              </dd>
            </div>
          </div>

          {/* תפריט ניווט */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            
            <button
              onClick={() => router.push('/customers/list')}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="text-blue-600 text-2xl mb-2">📋</div>
              <h3 className="text-lg font-medium text-gray-900">רשימת לקוחות</h3>
              <p className="mt-1 text-sm text-gray-500">צפה וניהול לקוחות קיימים</p>
            </button>

            <button
              onClick={() => router.push('/test-db')}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="text-green-600 text-2xl mb-2">➕</div>
              <h3 className="text-lg font-medium text-gray-900">הוסף לקוח</h3>
              <p className="mt-1 text-sm text-gray-500">צור כרטיס לקוח חדש</p>
            </button>

            <div className="bg-gray-100 p-6 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-gray-400 text-2xl mb-2">🔜</div>
              <h3 className="text-lg font-medium text-gray-500">בקרוב</h3>
              <p className="mt-1 text-sm text-gray-400">פיצ'רים נוספים</p>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
