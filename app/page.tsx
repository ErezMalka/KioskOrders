'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const router = useRouter()
  
  // Redirect to dashboard after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
    return () => clearTimeout(timer)
  }, [router])
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">
          מערכת ניהול הזמנות קיוסק
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          מעביר לדשבורד...
        </p>
        <div className="space-y-4">
          <Link 
            href="/dashboard" 
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            לדשבורד
          </Link>
          <br />
          <Link 
            href="/login" 
            className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            התחברות
          </Link>
        </div>
        <div className="mt-8 text-sm text-gray-500">
          <Link href="/api/health" className="underline">
            בדיקת מערכת (Health Check)
          </Link>
        </div>
      </div>
    </div>
  )
}