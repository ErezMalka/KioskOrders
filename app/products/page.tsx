'use client'

import { useState, useEffect, useRef } from 'react'
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('הכל')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    base_price: '',
    price: '',
    description: '',
    image_url: '',
    active: true
  })

  const categories = ['הכל', 'ארוחות', 'משקאות', 'קינוחים', 'תוספות', 'סלטים', 'מנות ראשונות', 'מבצעים']

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

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      // יצירת שם ייחודי לקובץ
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `products/${fileName}`

      // העלאה ל-Storage
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (error) {
        throw error
      }

      // קבלת URL ציבורי
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      setFormData({ ...formData, image_url: publicUrl })
      setImagePreview(publicUrl)
      
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('שגיאה בהעלאת התמונה')
    } finally {
      setUploadingImage(false)
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
      setImagePreview('')
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
    setImagePreview(product.image_url || '')
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
    setImagePreview('')
  }

  const filteredProducts = selectedCategory === 'הכל' 
    ? products 
    : products.filter(p => p.category === selectedCategory)

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
                    {categories.slice(1).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
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
                    תמונת מוצר
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    style={{
                      width: '100%',
                      padding: '10px 15px',
                      border: '2px dashed #ddd',
                      borderRadius: '6px',
                      fontSize: '15px',
                      backgroundColor: uploadingImage ? '#f0f0f0' : 'white',
                      cursor: uploadingImage ? 'wait' : 'pointer',
                      color: '#666'
                    }}
                  >
                    {uploadingImage ? '⏳ מעלה תמונה...' : '📷 העלה תמונה'}
                  </button>
                  {imagePreview && (
                    <div style={{ marginTop: '10px' }}>
                      <img 
                        src={imagePreview} 
                        alt="תצוגה מקדימה" 
                        style={{ 
                          width: '100px', 
                          height: '100px', 
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid #ddd'
                        }} 
                      />
                    </div>
                  )}
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

        {/* Category Tabs */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
          overflowX: 'auto',
          padding: '5px 0'
        }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '10px 20px',
                backgroundColor: selectedCategory === cat ? '#4CAF50' : 'white',
                color: selectedCategory === cat ? 'white' : '#666',
                border: selectedCategory === cat ? 'none' : '1px solid #ddd',
                borderRadius: '25px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                transition: 'all 0.3s',
                boxShadow: selectedCategory === cat ? '0 2px 8px rgba(76, 175, 80, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== cat) {
                  e.currentTarget.style.backgroundColor = '#f0f0f0'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== cat) {
                  e.currentTarget.style.backgroundColor = 'white'
                }
              }}
            >
              {cat}
              {cat !== 'הכל' && (
                <span style={{ 
                  marginRight: '5px', 
                  opacity: 0.7 
                }}>
                  ({products.filter(p => p.category === cat).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'all 0.3s',
                cursor: 'pointer',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              {/* Product Image */}
              <div style={{
                width: '100%',
                height: '200px',
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '64px', color: '#ccc' }}>🍽️</span>
                )}
                
                {/* Status Badge */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  padding: '4px 10px',
                  borderRadius: '15px',
                  fontSize: '11px',
                  fontWeight: '500',
                  backgroundColor: product.active ? '#4CAF50' : '#f44336',
                  color: 'white'
                }}>
                  {product.active ? 'פעיל' : 'לא פעיל'}
                </div>
              </div>

              {/* Product Details */}
              <div style={{ padding: '15px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '8px'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '16px',
                    color: '#333',
                    fontWeight: '600'
                  }}>
                    {product.name}
                  </h3>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    backgroundColor: '#9C27B0',
                    color: 'white',
                    fontWeight: '500'
                  }}>
                    {product.category}
                  </span>
                </div>

                {product.description && (
                  <p style={{
                    margin: '0 0 10px 0',
                    fontSize: '13px',
                    color: '#666',
                    lineHeight: '1.4'
                  }}>
                    {product.description.length > 60 
                      ? product.description.substring(0, 60) + '...' 
                      : product.description}
                  </p>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '15px',
                  paddingTop: '15px',
                  borderTop: '1px solid #f0f0f0'
                }}>
                  <div>
                    {product.price && product.price !== product.base_price ? (
                      <div>
                        <span style={{
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: '#4CAF50'
                        }}>
                          ₪{product.price.toFixed(2)}
                        </span>
                        <span style={{
                          fontSize: '14px',
                          color: '#999',
                          textDecoration: 'line-through',
                          marginRight: '8px'
                        }}>
                          ₪{(product.base_price ?? 0).toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#333'
                      }}>
                        ₪{(product.base_price ?? 0).toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(product)
                      }}
                      style={{
                        background: '#2196F3',
                        border: 'none',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px'
                      }}
                      title="ערוך"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(product.id, product.name)
                      }}
                      style={{
                        background: '#f44336',
                        border: 'none',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px'
                      }}
                      title="מחק"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '60px 20px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📦</div>
            <h3 style={{ color: '#333', marginBottom: '10px' }}>אין מוצרים להצגה</h3>
            <p style={{ color: '#666' }}>
              {selectedCategory !== 'הכל' 
                ? `אין מוצרים בקטגוריה "${selectedCategory}"` 
                : 'לחץ על "הוסף מוצר חדש" כדי להתחיל'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
