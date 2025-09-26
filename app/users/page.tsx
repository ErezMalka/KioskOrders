'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

// קומפוננטת AddUser מובנית בתוך הקובץ
function AddUser({ onSuccess }: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            phone: formData.phone
          }
        }
      })

      if (error) throw error

      await new Promise(resolve => setTimeout(resolve, 1000))

      if (data.user && (formData.full_name || formData.phone)) {
        await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.user.id)
      }

      setMessage({
        type: 'success',
        text: `✅ המשתמש ${formData.email} נוצר בהצלחה!`
      })

      setFormData({
        email: '',
        password: '',
        full_name: '',
        phone: ''
      })

      if (onSuccess) onSuccess()

    } catch (error: any) {
      console.error('Error:', error)
      setMessage({
        type: 'error',
        text: error.message || 'שגיאה ביצירת המשתמש'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">הוספת משתמש חדש</h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-300' 
            : 'bg-red-100 text-red-800 border border-red-300'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              אימייל <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="user@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              סיסמה <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="מינימום 6 תווים"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              שם מלא
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ישראל ישראלי"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              טלפון
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="050-1234567"
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'מוסיף משתמש...' : 'הוסף משתמש'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ממשק למשתמש
interface User {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: string
  created_at: string
  updated_at: string
}

// קומפוננטה ראשית
export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleDelete = async (userId: string, userEmail: string) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את ${userEmail}?`)) return

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profileError) throw profileError
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('שגיאה במחיקת המשתמש')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const roleLabels: Record<string, string> = {
    'user': 'משתמש',
    'admin': 'מנהל',
    'SUPER_ADMIN': 'מנהל ראשי',
    'SALES_AGENT': 'סוכן מכירות',
    'BACK_OFFICE': 'משרד אחורי',
    'SUPPLIER_ADMIN': 'מנהל ספק',
    'SUPPLIER_TECH': 'טכנאי ספק',
    'CUSTOMER_VIEW': 'צפייה בלבד'
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">ניהול משתמשים</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          {showAddForm ? (
            <>
              <span>✕</span>
              <span>סגור</span>
            </>
          ) : (
            <>
              <span>+</span>
              <span>הוסף משתמש</span>
            </>
          )}
        </button>
      </div>

      {showAddForm && (
        <div className="mb-8">
          <AddUser 
            onSuccess={() => {
              fetchUsers()
              setShowAddForm(false)
            }} 
          />
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="text-2xl">טוען משתמשים...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">אימייל</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">שם מלא</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">טלפון</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">תפקיד</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">נוצר בתאריך</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.full_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.phone || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleDelete(user.id, user.email)}
                        className="text-red-600 hover:text-red-800"
                        title="מחק משתמש"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      אין משתמשים להצגה
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-4">
        <div className="bg-blue-50 rounded-lg p-4 flex-1">
          <div className="text-blue-600 text-sm">סה"כ משתמשים</div>
          <div className="text-2xl font-bold text-blue-800">{users.length}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 flex-1">
          <div className="text-green-600 text-sm">נוספו היום</div>
          <div className="text-2xl font-bold text-green-800">
            {users.filter(u => new Date(u.created_at).toDateString() === new Date().toDateString()).length}
          </div>
        </div>
      </div>
    </div>
  )
}
