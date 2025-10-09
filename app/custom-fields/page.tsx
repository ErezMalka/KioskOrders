// app/custom-fields/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase, FieldDefinition, FieldType, FieldCategory } from '../../lib/supabaseClient'
import { Plus, Edit2, Trash2, Settings, Save, X, GripVertical, Home } from 'lucide-react'
import Link from 'next/link'

const FIELD_TYPES = [
  { value: 'text', label: 'טקסט', icon: '📝' },
  { value: 'number', label: 'מספר', icon: '🔢' },
  { value: 'currency', label: 'מטבע', icon: '💰' },
  { value: 'date', label: 'תאריך', icon: '📅' },
  { value: 'boolean', label: 'כן/לא', icon: '✅' },
  { value: 'select', label: 'בחירה יחידה', icon: '📋' },
  { value: 'multiselect', label: 'בחירה מרובה', icon: '📑' },
  { value: 'email', label: 'אימייל', icon: '📧' },
  { value: 'phone', label: 'טלפון', icon: '📱' },
  { value: 'url', label: 'קישור', icon: '🔗' },
  { value: 'textarea', label: 'טקסט ארוך', icon: '📄' }
]

const FIELD_CATEGORIES = [
  { value: 'general', label: 'כללי' },
  { value: 'financial', label: 'פיננסי' },
  { value: 'legal', label: 'משפטי' },
  { value: 'project', label: 'פרויקט' },
  { value: 'sales', label: 'מכירות' },
  { value: 'technical', label: 'טכני' },
  { value: 'marketing', label: 'שיווק' }
]

export default function CustomFieldsPage() {
  const [fields, setFields] = useState<FieldDefinition[]>([])
  const [isAddingField, setIsAddingField] = useState(false)
  const [newField, setNewField] = useState<Partial<FieldDefinition>>({
    field_type: 'text' as FieldType,
    field_category: 'general' as FieldCategory,
    is_required: false,
    is_searchable: true,
    is_visible: true
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadFields()
  }, [])

  const loadFields = async () => {
    const { data, error } = await supabase
      .from('custom_field_definitions')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('field_category', { ascending: true })

    if (data && !error) {
      setFields(data)
    }
  }

  const handleAddField = async () => {
    if (!newField.field_name || !newField.display_name) {
      alert('שם השדה ושם התצוגה הם חובה')
      return
    }

    setLoading(true)
    const fieldToAdd = {
      ...newField,
      field_name: newField.field_name!.toLowerCase().replace(/\s+/g, '_'),
      sort_order: fields.length,
      org_id: '11111111-1111-1111-1111-111111111111'
    }

    if ((fieldToAdd.field_type === 'select' || fieldToAdd.field_type === 'multiselect') 
        && typeof fieldToAdd.options === 'string') {
      fieldToAdd.options = { 
        options: (fieldToAdd.options as string).split(',').map(o => o.trim()) 
      } as any
    }

    const { error } = await supabase
      .from('custom_field_definitions')
      .insert([fieldToAdd])

    if (!error) {
      await loadFields()
      setIsAddingField(false)
      setNewField({
        field_type: 'text' as FieldType,
        field_category: 'general' as FieldCategory,
        is_required: false,
        is_searchable: true,
        is_visible: true
      })
    } else {
      alert('שגיאה בהוספת השדה: ' + error.message)
    }
    setLoading(false)
  }

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('האם אתה בטוח? פעולה זו תמחק את השדה לצמיתות')) {
      return
    }

    const { error } = await supabase
      .from('custom_field_definitions')
      .delete()
      .eq('id', fieldId)

    if (!error) {
      await loadFields()
    }
  }

  const groupedFields = fields.reduce((acc, field) => {
    if (!acc[field.field_category]) {
      acc[field.field_category] = []
    }
    acc[field.field_category].push(field)
    return acc
  }, {} as Record<string, FieldDefinition[]>)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">ניהול שדות מותאמים</h1>
          <Link href="/" className="text-blue-500 hover:text-blue-700 flex items-center gap-1">
            <Home className="w-4 h-4" />
            דף הבית
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Settings className="w-6 h-6" />
                ניהול שדות מותאמים אישית
              </h2>
              <button
                onClick={() => setIsAddingField(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                הוסף שדה חדש
              </button>
            </div>
          </div>

          {/* טופס הוספת שדה חדש */}
          {isAddingField && (
            <div className="p-6 bg-blue-50 border-b">
              <h3 className="text-lg font-semibold mb-4">הוספת שדה חדש</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">שם השדה (באנגלית)</label>
                  <input
                    type="text"
                    value={newField.field_name || ''}
                    onChange={(e) => setNewField({...newField, field_name: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="field_name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">שם תצוגה</label>
                  <input
                    type="text"
                    value={newField.display_name || ''}
                    onChange={(e) => setNewField({...newField, display_name: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="שם השדה בעברית"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">סוג השדה</label>
                  <select
                    value={newField.field_type}
                    onChange={(e) => setNewField({...newField, field_type: e.target.value as FieldType})}
                    className="w-full p-2 border rounded"
                  >
                    {FIELD_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">קטגוריה</label>
                  <select
                    value={newField.field_category}
                    onChange={(e) => setNewField({...newField, field_category: e.target.value as FieldCategory})}
                    className="w-full p-2 border rounded"
                  >
                    {FIELD_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {(newField.field_type === 'select' || newField.field_type === 'multiselect') && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">אפשרויות (מופרדות בפסיק)</label>
                    <input
                      type="text"
                      value={(newField.options as any) || ''}
                      onChange={(e) => setNewField({...newField, options: e.target.value as any})}
                      className="w-full p-2 border rounded"
                      placeholder="אופציה 1, אופציה 2, אופציה 3"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">ערך ברירת מחדל</label>
                  <input
                    type="text"
                    value={newField.default_value || ''}
                    onChange={(e) => setNewField({...newField, default_value: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div className="col-span-2 md:col-span-3 flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newField.is_required}
                      onChange={(e) => setNewField({...newField, is_required: e.target.checked})}
                    />
                    שדה חובה
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newField.is_searchable}
                      onChange={(e) => setNewField({...newField, is_searchable: e.target.checked})}
                    />
                    ניתן לחיפוש
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newField.is_visible}
                      onChange={(e) => setNewField({...newField, is_visible: e.target.checked})}
                    />
                    גלוי
                  </label>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleAddField}
                  disabled={loading}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  שמור
                </button>
                <button
                  onClick={() => {
                    setIsAddingField(false)
                    setNewField({
                      field_type: 'text' as FieldType,
                      field_category: 'general' as FieldCategory,
                      is_required: false,
                      is_searchable: true,
                      is_visible: true
                    })
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  ביטול
                </button>
              </div>
            </div>
          )}

          {/* רשימת השדות */}
          <div className="p-6">
            {Object.entries(groupedFields).map(([category, categoryFields]) => (
              <div key={category} className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                  {FIELD_CATEGORIES.find(c => c.value === category)?.label || category}
                </h3>
                <div className="space-y-2">
                  {categoryFields.map(field => (
                    <div
                      key={field.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                        <div>
                          <div className="font-medium">
                            {field.display_name}
                            {field.is_required && <span className="text-red-500 ml-1">*</span>}
