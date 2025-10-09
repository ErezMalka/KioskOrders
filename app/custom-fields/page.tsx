'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function CustomFieldsPage() {
  const [fields, setFields] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [newField, setNewField] = useState({
    field_name: '',
    display_name: '',
    field_type: 'text',
    field_category: 'general',
    is_required: false,
    is_visible: true
  })

  useEffect(() => {
    loadFields()
  }, [])

  const loadFields = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_field_definitions')
        .select('*')
        .order('sort_order')

      if (data && !error) {
        setFields(data)
      }
    } catch (err) {
      console.error('Error loading fields:', err)
    }
  }

  const handleAddField = async () => {
    if (!newField.field_name || !newField.display_name) {
      alert('נא למלא שם שדה ושם תצוגה')
      return
    }

    setLoading(true)
    try {
      const fieldToAdd = {
        ...newField,
        field_name: newField.field_name.toLowerCase().replace(/\s+/g, '_'),
        org_id: '11111111-1111-1111-1111-111111111111',
        sort_order: fields.length
      }

      const { error } = await supabase
        .from('custom_field_definitions')
        .insert([fieldToAdd])

      if (!error) {
        await loadFields()
        setShowForm(false)
        setNewField({
          field_name: '',
          display_name: '',
          field_type: 'text',
          field_category: 'general',
          is_required: false,
          is_visible: true
        })
      } else {
        alert('שגיאה: ' + error.message)
      }
    } catch (err) {
      console.error('Error adding field:', err)
    }
    setLoading(false)
  }

  const handleDeleteField = async (id: string) => {
    if (!confirm('למחוק את השדה?')) return

    try {
      const { error } = await supabase
        .from('custom_field_definitions')
        .delete()
        .eq('id', id)

      if (!error) {
        await loadFields()
      }
    } catch (err) {
      console.error('Error deleting field:', err)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '20px' }}>ניהול שדות מותאמים</h1>
      
      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '20px' }}>שדות קיימים ({fields.length})</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {showForm ? 'ביטול' : '+ הוסף שדה חדש'}
          </button>
        </div>

        {showForm && (
          <div style={{ backgroundColor: '#F3F4F6', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>הוספת שדה חדש</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>שם השדה (אנגלית)</label>
                <input
                  type="text"
                  value={newField.field_name}
                  onChange={(e) => setNewField({...newField, field_name: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
                  placeholder="field_name"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>שם תצוגה</label>
                <input
                  type="text"
                  value={newField.display_name}
                  onChange={(e) => setNewField({...newField, display_name: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
                  placeholder="שם השדה בעברית"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>סוג השדה</label>
                <select
                  value={newField.field_type}
                  onChange={(e) => setNewField({...newField, field_type: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
                >
                  <option value="text">טקסט</option>
                  <option value="number">מספר</option>
                  <option value="date">תאריך</option>
                  <option value="boolean">כן/לא</option>
                  <option value="select">בחירה</option>
                  <option value="email">אימייל</option>
                  <option value="phone">טלפון</option>
                  <option value="url">קישור</option>
                  <option value="textarea">טקסט ארוך</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>קטגוריה</label>
                <select
                  value={newField.field_category}
                  onChange={(e) => setNewField({...newField, field_category: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #D1D5DB', borderRadius: '4px' }}
                >
                  <option value="general">כללי</option>
                  <option value="financial">פיננסי</option>
                  <option value="legal">משפטי</option>
                  <option value="sales">מכירות</option>
                  <option value="technical">טכני</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="checkbox"
                  checked={newField.is_required}
                  onChange={(e) => setNewField({...newField, is_required: e.target.checked})}
                />
                שדה חובה
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="checkbox"
                  checked={newField.is_visible}
                  onChange={(e) => setNewField({...newField, is_visible: e.target.checked})}
                />
                גלוי
              </label>
            </div>

            <button
              onClick={handleAddField}
              disabled={loading}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                backgroundColor: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? 'שומר...' : 'שמור שדה'}
            </button>
          </div>
        )}

        <div>
          {fields.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
              אין שדות מותאמים. לחץ על "הוסף שדה חדש" כדי להתחיל.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {fields.map((field) => (
                <div
                  key={field.id}
                  style={{
                    padding: '15px',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      {field.display_name}
                      {field.is_required && <span style={{ color: 'red', marginLeft: '5px' }}>*</span>}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6B7280' }}>
                      {field.field_name} • {field.field_type} • {field.field_category}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteField(field.id)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#EF4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    מחק
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
