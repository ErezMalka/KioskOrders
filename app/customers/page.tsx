'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function CustomersPage() {
  const [message, setMessage] = useState('')

  const testAdd = async () => {
    setMessage('מנסה להוסיף...')
    
    // ניסיון פשוט להוסיף לקוח
    const { data, error } = await supabase
      .from('customers')
      .insert({ 
        name: 'לקוח ניסיון ' + new Date().toLocaleTimeString('he-IL')
      })
      .select()

    if (error) {
      setMessage('שגיאה: ' + error.message)
      console.error('Full error:', error)
    } else {
      setMessage('הצלחה! לקוח נוסף')
      console.log('Success:', data)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">בדיקת הוספת לקוח</h1>
        
        <button
          onClick={testAdd}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 mb-4"
        >
          הוסף לקוח ניסיון
        </button>
        
        {message && (
          <div className={`p-4 rounded ${
            message.includes('שגיאה') ? 'bg-red-100' : 'bg-green-100'
          }`}>
            {message}
          </div>
        )}
        
        <a href="/" className="block mt-4 text-blue-500 hover:underline">
          חזור לדף הבית
        </a>
      </div>
    </div>
  )
}
