'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  category: string
  base_price: number
  price?: number
  description?: string
  image_url?: string
  active?: boolean
  created_at?: string
  updated_at?: string
  organization_id?: string
}

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    base_price: '',
    price: '',
    description: '',
    image_url: '',
    active: true
  })

  useEffect(() => {
    checkUser()
    fetchProducts()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
    } catch (error) {
      console.error('Error checking user:', error)
    }
  }

  async function fetchProducts() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching products:', error)
        throw error
      }
      
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      alert('שגיאה בטעינת המוצרים')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      const productData = {
        name: formData.name.trim(),
        category: formData.category,
        base_price: parseFloat(formData.base_price) || 0,
        price: formData.price ? parseFloat(formData.price) : parseFloat(formData.base_price) || 0,
        description: formData.description || null,
        image_url: formData.image_url || null,
        active: formData.active,
        updated_at: new Date().toISOString()
      }

      if (editingProduct) {
        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
          .select()

        if (error) throw error
      } else {
        const newProduct = {
          ...productData,
          created_at: new Date().toISOString()
        }
        
        const { data, error } = await supabase
          .from('products')
          .insert([newProduct])
          .select()

        if (error) throw error
      }

      await fetchProducts()
      
      setFormData({ 
        name: '', 
        category: '', 
        base_price: '',
        price: '',
        description: '',
        image_url: '',
        active: true 
      })
      setShowForm(false)
      setEditingProduct(null)
      
      alert(editingProduct ? 'המוצר עודכן בהצלחה!' : 'המוצר נוסף בהצלחה!')
      
    } catch (error: any) {
      console.error('Error saving product:', error)
      alert('שגיאה בשמירת המוצר: ' + (error.message || 'שגיאה לא ידועה'))
    }
  }

  async function handleDelete(id: string, productName: string) {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את המוצר "${productName}"?`)) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      await fetchProducts()
      alert('המוצר נמחק בהצלחה')
    } catch (error: any) {
      console.error('Error deleting product:', error)
      alert('שגיאה במחיקת המוצר: ' + (error.message || 'שגיאה לא ידועה'))
    }
  }

  function handleEdit(product: Product) {
    setEditingProduct(product)
    setFormData({
      name: product.name || '',
      category: product.category || '',
      base_price: product.base_price?.toString() || '',
      price: product.price?.toString() || '',
      description: product.description || '',
      image_url: product.image_url || '',
      active: product.active ?? true
    })
    setShowForm(true)
  }

  function handleCancel() {
    setShowForm(false)
    setEditingProduct(null)
    setFormData({ 
      name: '', 
      category: '', 
      base_price: '',
      price: '',
      description: '',
      image_url: '',
      active: true 
    })
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        direction: 'rtl'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <h2>טוען מוצרים...</h2>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      direction: 'rtl'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ 
            margin: 0,
            fontSize: '24px',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            📦 ניהול מוצרים
          </h1>
          
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
          >
            <span>➕</span>
            <span>הוסף מוצר חדש</span>
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* Form Section */}
        {showForm && (
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            marginBottom: '30px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{
              fontSize: '20px',
              marginBottom: '20px',
              color: '#333',
              paddingBottom: '10px',
              borderBottom: '2px solid #4CAF50'
            }}>
              {editingProduct ? '✏️ עריכת מוצר' : '➕ מוצר חדש'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                    שם המוצר <span style={{ color: '#dc3545' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 15px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '15px'
                    }}
                    placeholder="לדוגמה: המבורגר"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                    קטגוריה <span style={{ color: '#dc3545' }}>*</span>
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 15px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '15px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="">בחר קטגוריה</option>
                    <option value="ארוחות">ארוחות</option>
                    <option value="משקאות">משקאות</option>
                    <option value="קינוחים">קינוחים</option>
                    <option value="תוספות">תוספות</option>
                    <option value="סלטים">סלטים</option>
                    <option value="מנות ראשונות">מנות ראשונות</option>
                    <option value="מבצעים">מבצעים</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                    מחיר בסיס <span style={{ color: '#dc3545' }}>*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.base_price}
                    onChange={(e) => setFormData({...formData, base_price: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 15px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '15px'
                    }}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                    מחיר מכירה
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 15px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '15px'
                    }}
                    placeholder="אופציונלי"
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                    תיאור המוצר
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 15px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '15px',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                    placeholder="תיאור קצר של המוצר..."
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                    קישור לתמונה
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 15px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '15px'
                    }}
                    placeholder="https://..."
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({...formData, active: e.target.checked})}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ color: '#666', fontWeight: '500' }}>מוצר פעיל</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    padding: '12px 30px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  💾 {editingProduct ? 'עדכן מוצר' : 'שמור מוצר'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    backgroundColor: '#e0e0e0',
                    color: '#333',
                    padding: '12px 30px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        )}



        {/* Table Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th style={{ padding: '15px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#666', borderBottom: '2px solid #e0e0e0' }}>שם המוצר</th>
                  <th style={{ padding: '15px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#666', borderBottom: '2px solid #e0e0e0' }}>קטגוריה</th>
                  <th style={{ padding: '15px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#666', borderBottom: '2px solid #e0e0e0' }}>מחיר בסיס</th>
                  <th style={{ padding: '15px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#666', borderBottom: '2px solid #e0e0e0' }}>מחיר מכירה</th>
                  <th style={{ padding: '15px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#666', borderBottom: '2px solid #e0e0e0' }}>תיאור</th>
                  <th style={{ padding: '15px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#666', borderBottom: '2px solid #e0e0e0' }}>סטטוס</th>
                  <th style={{ padding: '15px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#666', borderBottom: '2px solid #e0e0e0' }}>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '15px', fontSize: '14px', color: '#333' }}>
                      <strong>{product.name}</strong>
                    </td>
                    <td style={{ padding: '15px', fontSize: '14px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: '#9C27B0',
                        color: 'white'
                      }}>
                        {product.category}
                      </span>
                    </td>
                    <td style={{ padding: '15px', fontSize: '14px', color: '#333' }}>
                      ₪{(product.base_price ?? 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '15px', fontSize: '14px' }}>
                      {product.price ? (
                        <span style={{ fontWeight: '600', color: '#2e7d2e' }}>
                          ₪{product.price.toFixed(2)}
                        </span>
                      ) : (
                        <span style={{ color: '#999' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '15px', fontSize: '14px', color: '#333' }}>
                      <span title={product.description || ''}>
                        {product.description ? 
                          (product.description.length > 50 ? 
                            product.description.substring(0, 50) + '...' : 
                            product.description) : 
                          '-'}
                      </span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: product.active ? '#d4f8d4' : '#ffd4d4',
                        color: product.active ? '#2e7d2e' : '#c62828'
                      }}>
                        {product.active ? 'פעיל' : 'לא פעיל'}
                      </span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => handleEdit(product)}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '18px',
                            cursor: 'pointer',
                            padding: '5px'
                          }}
                          title="ערוך"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '18px',
                            cursor: 'pointer',
                            padding: '5px'
                          }}
                          title="מחק"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ 
                      textAlign: 'center', 
                      padding: '60px 20px',
                      color: '#999'
                    }}>
                      <div style={{ fontSize: '64px', marginBottom: '20px' }}>📦</div>
                      <div>אין מוצרים להצגה</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
