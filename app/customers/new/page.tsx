// app/customers/new/page.tsx
// דוגמה לשילוב שדות דינמיים בטופס הלקוח

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, DEFAULT_ORG_ID } from '../../../lib/supabaseClient'
import DynamicFieldsForm from '../../components/DynamicFieldsForm'
import { Save, X, User, Building, Settings, Star } from 'lucide-react'

export default function NewCustomerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  
  // State לשדות הרגילים
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    vat_number: '',
    contact_name: '',
    notes: ''
  })
  
  // State לשדות הדינמיים
  const [customFields, setCustomFields] = useState<Record<string, any>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const customerData = {
        ...formData,
        custom_fields: customFields, // הוסף את השדות הדינמיים
        org_id: DEFAULT_ORG_ID
      }

      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()

      if (error) throw error

      alert('הלקוח נוסף בהצלחה!')
      router.push('/customers')
    } catch (error) {
      console.error('Error:', error)
      alert('שגיאה בהוספת הלקוח')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6" />
            הוספת לקוח חדש
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          {/* טאבים */}
          <div className="flex border-b">
            <button
              type="button"
              onClick={() => setActiveTab('basic')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'basic' 
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                פרטים בסיסיים
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => setActiveTab('business')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'business' 
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                פרטים עסקיים
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`px-6 py-3 font-medium transition-all ${
                activeTab === 'custom' 
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                שדות מותאמים
                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                  חדש
                </span>
              </div>
            </button>
          </div>

          <div className="p-6">
            {/* תוכן הטאבים */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">פרטים בסיסיים</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      שם הלקוח <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      טלפון <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      אימייל
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      איש קשר
                    </label>
                    <input
                      type="text"
                      name="contact_name"
                      value={formData.contact_name}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      כתובת
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      הערות
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'business' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">פרטים עסקיים</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      מספר עוסק מורשה / ח.פ
                    </label>
                    <input
                      type="text"
                      name="vat_number"
                      value={formData.vat_number}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  
                  {/* הוסף כאן עוד שדות עסקיים לפי הצורך */}
                </div>
              </div>
            )}

            {activeTab === 'custom' && (
              <div>
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-1">שדות מותאמים אישית</h3>
                  <p className="text-sm text-blue-700">
                    כאן תוכל למלא שדות נוספים שהוגדרו במערכת. 
                    שדות עם כוכבית (*) הם שדות חובה.
                  </p>
                </div>
                
                <DynamicFieldsForm
                  customFields={customFields}
                  onChange={setCustomFields}
                  readonly={false}
                />
                
                {Object.keys(customFields).length > 0 && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      <span className="font-medium">שדות שמולאו:</span> {Object.keys(customFields).length}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* כפתורים */}
          <div className="p-6 border-t bg-gray-50 flex justify-between">
            <button
              type="button"
              onClick={() => router.push('/customers')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              ביטול
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'שומר...' : 'שמור לקוח'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
