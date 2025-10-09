// app/settings/fields/page.tsx
'use client'

import CustomFieldsManager from '../../components/CustomFieldsManager'
import { ArrowLeft, Database, Info, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function FieldsSettingsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">הגדרות שדות מותאמים</h1>
            </div>
            <Link 
              href="/settings"
              className="text-sm text-blue-500 hover:text-blue-700 transition-colors"
            >
              חזרה להגדרות
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-500 text-white p-3 rounded-lg">
              <Info className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-blue-900 text-lg mb-2">
                מערכת שדות מותאמים אישית
              </h3>
              <p className="text-blue-800 mb-3">
                הוסף שדות מותאמים אישית לכרטיסי הלקוחות שלך. 
                השדות יופיעו אוטומטית בטפסים ובדוחות.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <span className="text-lg">📝</span>
                  <span>11 סוגי שדות שונים</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <span className="text-lg">✅</span>
                  <span>ולידציות מותאמות אישית</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <span className="text-lg">📊</span>
                  <span>7 קטגוריות לארגון</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <span className="text-lg">🔍</span>
                  <span>חיפוש אוטומטי בשדות</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <span className="text-lg">📜</span>
                  <span>היסטוריית שינויים מלאה</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <span className="text-lg">💾</span>
                  <span>ייצוא וייבוא הגדרות</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Component */}
        <CustomFieldsManager />

        {/* Technical Info */}
        <div className="bg-gray-100 rounded-xl p-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-700">מידע טכני</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-lg p-3">
              <span className="font-medium text-gray-600">אחסון:</span>
              <span className="block text-gray-800 mt-1">PostgreSQL JSONB</span>
            </div>
            <div className="bg-white rounded-lg p-3">
              <span className="font-medium text-gray-600">ביצועים:</span>
              <span className="block text-gray-800 mt-1">אינדקס GIN לחיפוש מהיר</span>
            </div>
            <div className="bg-white rounded-lg p-3">
              <span className="font-medium text-gray-600">גיבוי:</span>
              <span className="block text-gray-800 mt-1">שמירה אוטומטית</span>
            </div>
            <div className="bg-white rounded-lg p-3">
              <span className="font-medium text-gray-600">מגבלות:</span>
              <span className="block text-gray-800 mt-1">עד 100 שדות מותאמים</span>
            </div>
            <div className="bg-white rounded-lg p-3">
              <span className="font-medium text-gray-600">סטטוס:</span>
              <span className="block text-green-600 mt-1">פעיל ✓</span>
            </div>
            <div className="bg-white rounded-lg p-3">
              <span className="font-medium text-gray-600">גרסה:</span>
              <span className="block text-gray-800 mt-1">1.0.0</span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-6">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-yellow-600" />
            <div className="text-sm">
              <span className="font-medium text-yellow-800">הערת אבטחה:</span>
              <span className="text-yellow-700 mr-2">
                השדות המותאמים מוגנים ב-RLS ונשמרים באופן מאובטח. 
                רק משתמשים מורשים יכולים לערוך הגדרות.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
