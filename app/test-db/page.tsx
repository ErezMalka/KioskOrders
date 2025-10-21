'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestDBPage() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  
  const testDirect = async () => {
    setLoading(true)
    setResult('בודק...')
    
    try {
      // ניסיון ישיר עם Supabase client
      const { data, error } = await supabase
        .from('customers')
        .insert({ name: 'לקוח בדיקה ' + new Date().toLocaleTimeString() })
        .select()
      
      if (error) throw error
      
      setResult('✅ הצלחה! הלקוח נוסף:\n' + JSON.stringify(data, null, 2))
    } catch (error: any) {
      setResult('❌ שגיאה: ' + error.message)
    }
    
    setLoading(false)
  }
  
  return (
    <div className="min-h-screen p-8 bg-gray-50" dir="rtl">
      <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">בדיקת Database</h1>
        
        <button 
          onClick={testDirect}
          disabled={loading}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'מוסיף...' : 'הוסף לקוח בדיקה'}
        </button>
        
        <pre className="mt-4 p-4 bg-gray-100 rounded text-xs overflow-auto">
          {result || 'לחץ להוספת לקוח'}
        </pre>
      </div>
    </div>
  )
}
