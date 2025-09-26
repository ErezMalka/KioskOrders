'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AddUser from '@/components/AddUser'

interface User {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: string
  created_at: string
  updated_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  // טעינת רשימת המשתמשים
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

  // טעינה ראשונית
  useEffect(() => {
    fetchUsers()
  }, [])

  // מחיקת משתמש
  const handleDelete = async (userId: string, userEmail: string) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את ${userEmail}?`)) return

    try {
      // מחק מ-profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profileError) throw profileError

      // רענן את הרשימה
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('שגיאה במחיקת המשתמש')
    }
  }

  // פורמט תאריך
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // מיפוי תפקידים לעברית
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
      {/* כותרת ולחצן הוספה */}
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

      {/* טופס הוספת משתמש */}
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

      {/* טבלת משתמשים */}
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

      {/* סטטיסטיקה */}
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
