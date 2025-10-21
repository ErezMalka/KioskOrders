'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
    } catch (error) {
      console.error('Error:', error)
    }
    setLoading(false)
  }

  const handleLogin = async () => {
    const email = 'erez@bite.co.il'
    const password = prompt('הכנס סיסמה:')
    
    if (!password) return
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      alert('שגיאה: ' + error.message)
    } else {
      checkUser()
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">טוען...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">מערכת CRM</h1>
        
        {!user ? (
          <div>
            <p className="mb-4">לא מחובר</p>
            <button
              onClick={handleLogin}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              התחבר עם erez@bite.co.il
            </button>
          </div>
        ) : (
          <div>
            <div className="bg-green-50 p-4 rounded mb-4">
              <p className="font-bold">✅ מחובר בהצלחה!</p>
              <p className="text-sm mt-2">שם: {profile?.full_name}</p>
              <p className="text-sm">תפקיד: {profile?.role}</p>
              <p className="text-sm">אימייל: {user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              התנתק
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
