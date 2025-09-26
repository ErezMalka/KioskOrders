'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface Product {
  id: string
  name: string
  price: number
  category: string
  active: boolean
  created_at: string
  updated_at?: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    active: true
  })

  useEffect(() => {
    fetchProducts()
  }, [])

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
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        active: formData.active,
        updated_at: new Date().toISOString()
      }

      if (editingProduct) {
        // עדכון מוצר קיים
        console.log('Updating product:', editingProduct.id, productData)
        
        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
          .select()
          .single()

        if (error) {
          console.error('Update error details:', error)
          throw error
        }

        console.log('Update successful:', data)
      } else {
        // הוספת מוצר חדש
        const newProduct = {
          ...productData,
          created_at: new Date().toISOString()
        }

        console.log('Creating new product:', newProduct)
        
        const { data, error } = await supabase
          .from('products')
          .insert(newProduct)
          .select()
          .single()

        if (error) {
          console.error('Insert error details:', error)
          throw error
        }

        console.log('Insert successful:', data)
      }

      // רענון הרשימה
      await fetchProducts()
      
      // איפוס הטופס
      setFormData({ name: '', price: '', category: '', active: true })
      setShowForm(false)
      setEditingProduct(null)
      
      alert(editingProduct ? 'המוצר עודכן בהצלחה!' : 'המוצר נוסף בהצלחה!')
      
    } catch (error: any) {
      console.error('Error saving product:', error)
      
      // הצגת הודעת שגיאה מפורטת
      let errorMessage = 'שגיאה בשמירת המוצר'
      
      if (error?.message) {
        errorMessage += ': ' + error.message
      }
      
      if (error?.details) {
        errorMessage += '\nפרטים: ' + error.details
      }
      
      if (error?.hint) {
        errorMessage += '\nהצעה: ' + error.hint
      }
      
      alert(errorMessage)
    }
  }

  async function handleDelete(id: string, productName: string) {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את המוצר "${productName}"?`)) return

    try {
      console.log('Deleting product:', id)
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Delete error:', error)
        throw error
      }
      
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
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      active: product.active
    })
    setShowForm(true)
  }

  function handleCancel() {
    setShowForm(false)
    setEditingProduct(null)
    setFormData({ name: '', price: '', category: '', active: true })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-2xl">טוען מוצרים...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">ניהול מוצרים</h1>
        <button
          onClick={() => {
            setShowForm(!showForm)
            if (!showForm) {
              setEditingProduct(null)
              setFormData({ name: '', price: '', category: '', active: true })
            }
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          <span>הוסף מוצר</span>
        </button>
      </div>

      {/* טופס הוספה/עריכה */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-bold mb-4">
            {editingProduct ? 'עריכת מוצר' : 'מוצר חדש'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                שם המוצר <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="לדוגמה: המבורגר"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                מחיר <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                קטגוריה <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium">מוצר פעיל</span>
              </label>
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                {editingProduct ? 'עדכן מוצר' : 'הוסף מוצר'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      )}

      {/* טבלת מוצרים */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">שם</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">מחיר</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">קטגוריה</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">סטטוס</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">נוצר בתאריך</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    ₪{product.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      product.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.active ? 'פעיל' : 'לא פעיל'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(product.created_at).toLocaleDateString('he-IL')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:text-blue-800 ml-4"
                      title="ערוך"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className="text-red-600 hover:text-red-800"
                      title="מחק"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    אין מוצרים להצגה
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* סטטיסטיקה */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-blue-600 text-sm">סה"כ מוצרים</div>
          <div className="text-2xl font-bold text-blue-800">{products.length}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-green-600 text-sm">מוצרים פעילים</div>
          <div className="text-2xl font-bold text-green-800">
            {products.filter(p => p.active).length}
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="text-yellow-600 text-sm">מוצרים לא פעילים</div>
          <div className="text-2xl font-bold text-yellow-800">
            {products.filter(p => !p.active).length}
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-purple-600 text-sm">קטגוריות</div>
          <div className="text-2xl font-bold text-purple-800">
            {[...new Set(products.map(p => p.category))].length}
          </div>
        </div>
      </div>
    </div>
  )
}
