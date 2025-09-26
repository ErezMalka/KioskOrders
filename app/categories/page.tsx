'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Category {
  id: string;
  name: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    display_order: 1,
    is_active: true
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // First try to get categories from database
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order');

      if (error) {
        console.log('Categories table might not exist, creating default categories...');
        await createCategoriesTable();
      } else if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error:', error);
      // Use local default categories if database fails
      setCategories([
        { id: '1', name: 'מנות ראשונות', description: 'מנות פתיחה', display_order: 1, is_active: true },
        { id: '2', name: 'מנות עיקריות', description: 'מנות עיקריות', display_order: 2, is_active: true },
        { id: '3', name: 'קינוחים', description: 'קינוחים', display_order: 3, is_active: true },
        { id: '4', name: 'שתייה', description: 'משקאות', display_order: 4, is_active: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const createCategoriesTable = async () => {
    // Try to create the table and insert default data
    const defaultCategories = [
      { name: 'מנות ראשונות', description: 'מנות פתיחה', display_order: 1, is_active: true },
      { name: 'מנות עיקריות', description: 'מנות עיקריות', display_order: 2, is_active: true },
      { name: 'קינוחים', description: 'קינוחים', display_order: 3, is_active: true },
      { name: 'שתייה', description: 'משקאות', display_order: 4, is_active: true }
    ];

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(defaultCategories)
        .select();

      if (!error && data) {
        setCategories(data);
      }
    } catch (err) {
      console.error('Could not create default categories:', err);
    }
  };

  const openForm = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        display_order: category.display_order || 1,
        is_active: category.is_active !== undefined ? category.is_active : true
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        display_order: categories.length + 1,
        is_active: true
      });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        // Update existing category
        const { data, error } = await supabase
          .from('categories')
          .update({
            name: formData.name,
            description: formData.description,
            display_order: formData.display_order,
            is_active: formData.is_active
          })
          .eq('id', editingCategory.id)
          .select();

        if (error) throw error;
        
        if (data) {
          setCategories(categories.map(cat => 
            cat.id === editingCategory.id ? data[0] : cat
          ));
        }
      } else {
        // Create new category
        const { data, error } = await supabase
          .from('categories')
          .insert([{
            name: formData.name,
            description: formData.description,
            display_order: formData.display_order,
            is_active: formData.is_active
          }])
          .select();

        if (error) throw error;
        
        if (data) {
          setCategories([...categories, data[0]]);
        }
      }
      
      setShowForm(false);
      alert(editingCategory ? 'הקטגוריה עודכנה בהצלחה!' : 'הקטגוריה נוספה בהצלחה!');
    } catch (error) {
      console.error('Error saving category:', error);
      alert('שגיאה בשמירת הקטגוריה');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הקטגוריה?')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCategories(categories.filter(cat => cat.id !== id));
      alert('הקטגוריה נמחקה בהצלחה!');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('שגיאה במחיקת הקטגוריה. ייתכן שיש מוצרים בקטגוריה זו.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', direction: 'rtl' }}>
        <h2>טוען...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', direction: 'rtl' }}>
      <h1>ניהול קטגוריות</h1>
      
      {/* Add Category Button */}
      <button
        onClick={() => openForm()}
        style={{
          marginBottom: '20px',
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        + הוסף קטגוריה חדשה
      </button>

      {/* Categories Table */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>שם</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>תיאור</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>סדר</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>סטטוס</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category, index) => (
              <tr key={category.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>
                  <strong>{category.name}</strong>
                </td>
                <td style={{ padding: '12px', color: '#666' }}>
                  {category.description || '-'}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  {category.display_order || index + 1}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    backgroundColor: category.is_active ? '#d4edda' : '#f8d7da',
                    color: category.is_active ? '#155724' : '#721c24'
                  }}>
                    {category.is_active ? 'פעיל' : 'לא פעיל'}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button
                    onClick={() => openForm(category)}
                    style={{
                      padding: '5px 10px',
                      marginLeft: '5px',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    ערוך
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    מחק
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  אין קטגוריות
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h2>{editingCategory ? 'ערוך קטגוריה' : 'קטגוריה חדשה'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                  שם הקטגוריה *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                  תיאור
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px',
                    minHeight: '80px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                  סדר תצוגה
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    style={{ marginLeft: '10px' }}
                  />
                  קטגוריה פעילה
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  {editingCategory ? 'עדכן' : 'צור'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
