'use client'

import { useState } from 'react'

export default function TestDBPage() {
  const [result, setResult] = useState('')
  
  const testDirect = async () => {
    try {
      const SUPABASE_URL = 'https://dboriwezpayxvtuxlihj.supabase.co'
      const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/customers`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ name: 'Test Customer' })
      })
      
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
      
    } catch (error: any) {
      setResult('Error: ' + error.message)
    }
  }
  
  return (
    <div className="p-8" dir="rtl">
      <h1 className="text-2xl mb-4">בדיקת חיבור ישיר</h1>
      <button 
        onClick={testDirect}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        בדוק חיבור
      </button>
      <pre className="mt-4 p-4 bg-gray-100 rounded">
        {result || 'לחץ לבדיקה'}
      </pre>
    </div>
  )
}
