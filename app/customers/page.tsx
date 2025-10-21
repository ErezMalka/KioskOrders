'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CustomersPage() {
  const [name, setName] = useState('לקוח ניסיון')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // נסה להוסיף לקוח פשוט
    const { data, error } = await supabase
      .from('customers')
      .insert({ name })
      .select()

    if (error) {
      alert('שגיאה: ' + error.message)
      console.error(error)
    } else {
      alert('לקוח נוסף בהצלחה!')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">בדיקה פשוטה</h1>
        
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {loading ? 'מוסיף...' : 'הוסף לקוח ניסיון'}
        </button>
        
        <button
          onClick={() => router.push('/')}
          className="mr-2 bg-gray-300 px-4 py-2 rounded"
        >
          חזור
        </button>
      </div>
    </div>
  )
}
