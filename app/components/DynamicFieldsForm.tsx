// app/components/DynamicFieldsForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase, customFieldsHelpers } from '../../lib/supabaseClient'
import { Calendar, DollarSign, Link2, Mail, Phone, Hash } from 'lucide-react'

// הגדרת types מקומיים שכוללים את currency
type ExtendedFieldType = 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'boolean' | 'email' | 'phone' | 'url' | 'textarea' | 'currency'

interface FieldDefinition {
  id?: string
  org_id?: string
  field_name: string
  field_type: ExtendedFieldType  // משתמש ב-type המורחב
  field_label: string
  display_name?: string
  is_required: boolean
  is_active: boolean
  is_searchable?: boolean
  is_visible?: boolean
  field_options?: string[] | null
  options?: any
  sort_order?: number
  default_value?: any
  field_category: string
  display_order?: number
  validation_rules?: any
  created_at?: string
  updated_at?: string
}

interface DynamicFieldsFormProps {
  customerId?: string
  customFields: Record<string, any>
  onChange: (fields: Record<string, any>) => void
  category?: string
  readonly?: boolean
}

export default function DynamicFieldsForm({ 
  customerId, 
  customFields, 
  onChange, 
  category,
  readonly = false 
}: DynamicFieldsFormProps) {
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>([])
  const [localValues, setLocalValues] = useState<Record<string, any>>(customFields || {})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadFieldDefinitions()
  }, [])

  useEffect(() => {
    setLocalValues(customFields || {})
  }, [customFields])

  const loadFieldDefinitions = async () => {
    let query = supabase
      .from('custom_field_definitions')
      .select('*')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true })

    if (category) {
      query = query.eq('field_category', category)
    }

    const { data, error } = await query

    if (data && !error) {
      setFieldDefinitions(data)
      
      // הגדר ערכי ברירת מחדל
      const defaultValues: Record<string, any> = {}
      data.forEach(field => {
        if (field.default_value && !localValues[field.field_name]) {
          defaultValues[field.field_name] = field.default_value
        }
      })
      
      if (Object.keys(defaultValues).length > 0) {
        const newValues = { ...localValues, ...defaultValues }
        setLocalValues(newValues)
        onChange(newValues)
      }
    }
  }

  const validateField = (field: FieldDefinition, value: any): string | null => {
    const result = customFieldsHelpers.validateField(field as any, value)
    return result.valid ? null : result.error || null
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    const field = fieldDefinitions.find(f => f.field_name === fieldName)
    if (field) {
      const error = validateField(field, value)
      setErrors(prev => ({
        ...prev,
        [fieldName]: error || ''
      }))
    }

    const newValues = {
      ...localValues,
      [fieldName]: value
    }
    setLocalValues(newValues)
    onChange(newValues)
  }

  const renderField = (field: FieldDefinition) => {
    const value = localValues[field.field_name] || ''
    const error = errors[field.field_name]

    const inputClasses = `w-full p-2 border rounded-lg ${
      error ? 'border-red-500' : 'border-gray-300'
    } ${readonly ? 'bg-gray-100' : ''}`

    switch (field.field_type) {
      case 'text':
        return (
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
              className={inputClasses}
              disabled={readonly}
              placeholder={field.display_name}
            />
          </div>
        )

      case 'number':
        return (
          <div className="relative">
            <Hash className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
              className={`${inputClasses} pl-8`}
              disabled={readonly}
              placeholder="0"
            />
          </div>
        )

      case 'currency':  // עכשיו זה יעבוד!
        return (
          <div className="relative">
            <DollarSign className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
              className={`${inputClasses} pl-8`}
              disabled={readonly}
              step="0.01"
              placeholder="0.00"
            />
          </div>
        )

      case 'date':
        return (
          <div className="relative">
            <Calendar className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
              className={`${inputClasses} pl-8`}
              disabled={readonly}
            />
          </div>
        )

      case 'boolean':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => handleFieldChange(field.field_name, e.target.checked)}
              disabled={readonly}
              className="w-4 h-4"
            />
            <span className="text-sm">{field.display_name}</span>
          </label>
        )

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            className={inputClasses}
            disabled={readonly}
          >
            <option value="">בחר {field.display_name}</option>
            {field.options?.options?.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )

      case 'multiselect':
        return (
          <div className="space-y-2">
            {field.options?.options?.map((option: string) => (
              <label key={option} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(value as string[] || []).includes(option)}
                  onChange={(e) => {
                    const currentValues = (value as string[]) || []
                    if (e.target.checked) {
                      handleFieldChange(field.field_name, [...currentValues, option])
                    } else {
                      handleFieldChange(field.field_name, currentValues.filter(v => v !== option))
                    }
                  }}
                  disabled={readonly}
                  className="w-4 h-4"
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'email':
        return (
          <div className="relative">
            <Mail className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={value}
              onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
              className={`${inputClasses} pl-8`}
              disabled={readonly}
              placeholder="email@example.com"
            />
          </div>
        )

      case 'phone':
        return (
          <div className="relative">
            <Phone className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="tel"
              value={value}
              onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
              className={`${inputClasses} pl-8`}
              disabled={readonly}
              placeholder="050-0000000"
            />
          </div>
        )

      case 'url':
        return (
          <div className="relative">
            <Link2 className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="url"
              value={value}
              onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
              className={`${inputClasses} pl-8`}
              disabled={readonly}
              placeholder="https://example.com"
            />
          </div>
        )

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            className={inputClasses}
            disabled={readonly}
            rows={3}
            placeholder={field.display_name}
          />
        )

      default:
        return null
    }
  }

  // קיבוץ שדות לפי קטגוריה
  const groupedFields = fieldDefinitions.reduce((acc, field) => {
    if (!acc[field.field_category]) {
      acc[field.field_category] = []
    }
    acc[field.field_category].push(field)
    return acc
  }, {} as Record<string, FieldDefinition[]>)

  const CATEGORY_LABELS: Record<string, string> = {
    general: 'כללי',
    financial: 'פיננסי',
    legal: 'משפטי',
    project: 'פרויקט',
    sales: 'מכירות',
    technical: 'טכני',
    marketing: 'שיווק'
  }

  if (fieldDefinitions.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedFields).map(([categoryName, fields]) => (
        <div key={categoryName} className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">
            {CATEGORY_LABELS[categoryName] || categoryName}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(field => (
              <div key={field.id} className={field.field_type === 'textarea' ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-medium mb-1">
                  {field.display_name}
                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(field)}
                {errors[field.field_name] && (
                  <p className="text-red-500 text-sm mt-1">{errors[field.field_name]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// קומפוננטה להצגת השדות הדינמיים בתצוגה בלבד
export function DynamicFieldsDisplay({ 
  customFields 
}: { 
  customFields: Record<string, any> 
}) {
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>([])

  useEffect(() => {
    loadFieldDefinitions()
  }, [])

  const loadFieldDefinitions = async () => {
    const { data } = await supabase
      .from('custom_field_definitions')
      .select('*')
      .eq('is_visible', true)
      .order('field_category', { ascending: true })
      .order('sort_order', { ascending: true })

    if (data) {
      setFieldDefinitions(data as FieldDefinition[])
    }
  }

  const formatValue = (field: FieldDefinition, value: any) => {
    if (!value && value !== false) return '-'

    switch (field.field_type) {
      case 'boolean':
        return value ? '✅ כן' : '❌ לא'
      case 'currency':
        return `₪${parseFloat(value).toLocaleString('he-IL')}`
      case 'date':
        return new Date(value).toLocaleDateString('he-IL')
      case 'multiselect':
        return (value as string[]).join(', ')
      case 'url':
        return (
          <a href={value} target="_blank" rel="noopener noreferrer" 
             className="text-blue-500 hover:underline">
            {value}
          </a>
        )
      case 'email':
        return (
          <a href={`mailto:${value}`} className="text-blue-500 hover:underline">
            {value}
          </a>
        )
      case 'phone':
        return (
          <a href={`tel:${value}`} className="text-blue-500 hover:underline">
            {value}
          </a>
        )
      default:
        return value
    }
  }

  const visibleFields = fieldDefinitions.filter(field => 
    customFields && customFields[field.field_name] !== undefined
  )

  if (visibleFields.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">שדות מותאמים אישית</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {visibleFields.map(field => (
          <div key={field.id} className="flex flex-col">
            <span className="text-sm text-gray-600">{field.display_name}</span>
            <span className="font-medium">
              {formatValue(field, customFields[field.field_name])}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
