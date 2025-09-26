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
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      if (editingProduct) {
        // עדכון מוצר קיים
        const { error } = await supabase
          .from('products')
          .update({
            name: formData.name,
            price: parseFloat(formData.price),
            category: formData.category,
            active: formData.active
          })
          .eq('id', editingProduct.id)

        if (error) throw error
      } else {
        // הוספת מוצר חדש
        const { error } = await supabase
          .from('products')
          .insert({
            name: formData.name,
            price: parseFloat(formData.price),
            category: formData.category,
            active: formData.active
          })

        if (error) throw error
      }

      // רענון הרשימה
      fetchProducts()
      
      // איפוס הטופס
      setFormData({ name: '', price: '', category: '', active: true })
      setShowForm(false)
      setEditingProduct(null)
      
    } catch (error) {
      console.error('Error saving product:', error)
      alert('שגיאה בשמירת המוצר')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('האם אתה בטוח שברצונך למחוק את המוצר?')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('שגיאה במחיקת המוצר')
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
            setEditingProduct(null)
            setFormData({ name: '', price: '', category: '', active: true })
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
              <label className="block text-sm font-medium mb-2">שם המוצר</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-2 border rounded-lg"
                placeholder="לדוגמה: המבורגר"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">מחיר</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full p-2 border rounded-lg"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">קטגוריה</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">בחר קטגוריה</option>
                <option value="ארוחות">ארוחות</option>
                <option value="משקאות">משקאות</option>
                <option value="קינוחים">קינוחים</option>
                <option value="תוספות">תוספות</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  className="w-4 h-4"
                />
                <span>מוצר פעיל</span>
              </label>
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
              >
                {editingProduct ? 'עדכן' : 'הוסף'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingProduct(null)
                  setFormData({ name: '', price: '', category: '', active: true })
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      )}

      {/* טבלת מוצרים */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">שם</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">מחיר</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">קטגוריה</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">סטטוס</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {product.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  ₪{product.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {product.category}
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
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() => handleEdit(product)}
                    className="text-blue-600 hover:text-blue-800 ml-4"
                    title="ערוך"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
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
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  אין מוצרים להצגה
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
