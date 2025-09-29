import { useState, useEffect } from 'react'

interface NewCustomerFormProps {
  onSubmit: (customerData: any) => void
  onCancel: () => void
  initialData?: CustomerFormData
  isEdit?: boolean
}

interface CustomerFormData {
  name: string
  phone: string
  email: string
  legal_id: string
  contact_name: string
  address: string
  notes: string
}

interface CustomField {
  id: string
  label: string
  value: string
}

export default function NewCustomerForm({ onSubmit, onCancel, initialData, isEdit = false }: NewCustomerFormProps) {
  const [formData, setFormData] = useState<CustomerFormData>(
    initialData || {
      name: '',
      phone: '',
      email: '',
      legal_id: '',
      contact_name: '',
      address: '',
      notes: ''
    }
  )

  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // עדכון הטופס אם initialData משתנה
  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    }
  }, [initialData])

  const addCustomField = () => {
    const newField: CustomField = {
      id: `custom_${Date.now()}`,
      label: '',
      value: ''
    }
    setCustomFields([...customFields, newField])
  }

  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter(field => field.id !== id))
    const newFormData = { ...formData }
    delete newFormData[id]
    setFormData(newFormData)
  }

  const updateCustomField = (id: string, label: string, value: string) => {
    setCustomFields(customFields.map(field => 
      field.id === id ? { ...field, label, value } : field
    ))
    setFormData({ ...formData, [id]: value })
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.name.trim()) {
      newErrors.name = 'שם הלקוח הוא שדה חובה'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'מספר טלפון הוא שדה חובה'
    } else if (!/^[\d\-\+\s()]+$/.test(formData.phone)) {
      newErrors.phone = 'מספר טלפון לא תקין'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'כתובת אימייל לא תקינה'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      // הפרדה בין שדות רגילים לשדות מותאמים
      const standardFields = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        legal_id: formData.legal_id,
        contact_name: formData.contact_name,
        address: formData.address,
        notes: formData.notes
      }

      // יצירת אובייקט של שדות מותאמים
      const customFieldsData: { [key: string]: { label: string; value: string } } = {}
      customFields.forEach(field => {
        if (field.label.trim()) {
          customFieldsData[field.id] = {
            label: field.label,
            value: field.value
          }
        }
      })

      // שליחת הנתונים עם custom_fields נפרד
      const finalData = {
        ...standardFields,
        custom_fields: Object.keys(customFieldsData).length > 0 ? customFieldsData : null
      }

      onSubmit(finalData)
    }
  }

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    setFormData({ ...formData, [field]: value })
    // מנקה שגיאות בזמן הקלדה
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ 
        marginBottom: '25px', 
        fontSize: '22px',
        color: '#333',
        fontWeight: '600'
      }}>
        פרטי לקוח חדש
      </h3>
      
      <form onSubmit={handleSubmit}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '20px', 
          marginBottom: '25px' 
        }}>
          {/* שם הלקוח */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              שם הלקוח <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="שם הלקוח"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                borderRadius: '8px',
                border: `2px solid ${errors.name ? '#dc3545' : '#ddd'}`,
                boxSizing: 'border-box',
                transition: 'border-color 0.3s'
              }}
              onFocus={(e) => {
                if (!errors.name) e.currentTarget.style.borderColor = '#4CAF50'
              }}
              onBlur={(e) => {
                if (!errors.name) e.currentTarget.style.borderColor = '#ddd'
              }}
            />
            {errors.name && (
              <span style={{ 
                display: 'block',
                marginTop: '5px',
                fontSize: '13px', 
                color: '#dc3545' 
              }}>
                {errors.name}
              </span>
            )}
          </div>

          {/* טלפון */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              טלפון <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <input
              type="tel"
              placeholder="050-1234567"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                borderRadius: '8px',
                border: `2px solid ${errors.phone ? '#dc3545' : '#ddd'}`,
                boxSizing: 'border-box',
                transition: 'border-color 0.3s'
              }}
              onFocus={(e) => {
                if (!errors.phone) e.currentTarget.style.borderColor = '#4CAF50'
              }}
              onBlur={(e) => {
                if (!errors.phone) e.currentTarget.style.borderColor = '#ddd'
              }}
            />
            {errors.phone && (
              <span style={{ 
                display: 'block',
                marginTop: '5px',
                fontSize: '13px', 
                color: '#dc3545' 
              }}>
                {errors.phone}
              </span>
            )}
          </div>

          {/* אימייל */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              אימייל
            </label>
            <input
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                borderRadius: '8px',
                border: `2px solid ${errors.email ? '#dc3545' : '#ddd'}`,
                boxSizing: 'border-box',
                transition: 'border-color 0.3s'
              }}
              onFocus={(e) => {
                if (!errors.email) e.currentTarget.style.borderColor = '#4CAF50'
              }}
              onBlur={(e) => {
                if (!errors.email) e.currentTarget.style.borderColor = '#ddd'
              }}
            />
            {errors.email && (
              <span style={{ 
                display: 'block',
                marginTop: '5px',
                fontSize: '13px', 
                color: '#dc3545' 
              }}>
                {errors.email}
              </span>
            )}
          </div>

          {/* ח.פ / ת.ז */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              ח.פ / ת.ז
            </label>
            <input
              type="text"
              placeholder="123456789"
              value={formData.legal_id}
              onChange={(e) => handleInputChange('legal_id', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '2px solid #ddd',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#4CAF50'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#ddd'}
            />
          </div>

          {/* שם איש קשר */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              שם איש קשר
            </label>
            <input
              type="text"
              placeholder="שם איש קשר"
              value={formData.contact_name}
              onChange={(e) => handleInputChange('contact_name', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '2px solid #ddd',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#4CAF50'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#ddd'}
            />
          </div>

          {/* כתובת */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              כתובת
            </label>
            <input
              type="text"
              placeholder="רחוב, עיר"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '2px solid #ddd',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#4CAF50'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#ddd'}
            />
          </div>

          {/* הערות */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              הערות
            </label>
            <textarea
              placeholder="הערות נוספות..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '2px solid #ddd',
                minHeight: '100px',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                transition: 'border-color 0.3s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#4CAF50'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#ddd'}
            />
          </div>

          {/* שדות מותאמים אישית */}
          {customFields.map((field) => (
            <div key={field.id} style={{ gridColumn: 'span 2' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '200px 1fr auto', 
                gap: '10px',
                alignItems: 'end'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    שם השדה
                  </label>
                  <input
                    type="text"
                    placeholder="לדוגמה: מספר פקס"
                    value={field.label}
                    onChange={(e) => updateCustomField(field.id, e.target.value, field.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      borderRadius: '8px',
                      border: '2px solid #ddd',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    ערך
                  </label>
                  <input
                    type="text"
                    placeholder="ערך השדה..."
                    value={field.value}
                    onChange={(e) => updateCustomField(field.id, field.label, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      borderRadius: '8px',
                      border: '2px solid #ddd',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeCustomField(field.id)}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}
                  title="הסר שדה"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          {/* כפתור הוספת שדה */}
          <div style={{ gridColumn: 'span 2' }}>
            <button
              type="button"
              onClick={addCustomField}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: '2px dashed #2196F3',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1976D2'
                e.currentTarget.style.borderColor = '#1976D2'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2196F3'
                e.currentTarget.style.borderColor = '#2196F3'
              }}
            >
              <span style={{ fontSize: '18px' }}>+</span>
              הוסף שדה מותאם אישית
            </button>
          </div>
        </div>

        {/* כפתורים */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '25px' }}>
          <button
            type="submit"
            style={{
              padding: '14px 32px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.3s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#45a049'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#4CAF50'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            ✓ צור לקוח
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '14px 32px',
              backgroundColor: '#757575',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.3s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#616161'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#757575'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            ✕ ביטול
          </button>
        </div>
      </form>
    </div>
  )
}
