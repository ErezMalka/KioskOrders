'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ProductCategoryTabs from '../components/ProductCategoryTabs';

interface Category {
  id: string;
  name: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
  products_count?: number;
  icon?: string;
  color?: string;
}

interface Product {
  id: string;
  name: string;
  category_id?: string;
  base_price: number;
}

// אייקונים וצבעים ברירת מחדל לקטגוריות
const categoryDefaults = {
  'מנות ראשונות': { icon: '🥗', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  'מנות עיקריות': { icon: '🍖', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  'קינוחים': { icon: '🍰', color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  'שתייה': { icon: '🥤', color: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
  'תוספות': { icon: '➕', color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  'default': { icon: '📦', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [targetCategory, setTargetCategory] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    display_order: 1,
    is_active: true,
    icon: '📦',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  });

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order');

      if (error) {
        console.log('Creating default categories...');
        await createCategoriesTable();
      } else if (data) {
        // חישוב מספר מוצרים לכל קטגוריה
        const { data: productsData } = await supabase
          .from('products')
          .select('category_id');

        const categoriesWithCount = data.map(cat => {
          const count = productsData?.filter(p => p.category_id === cat.id).length || 0;
          const defaults = categoryDefaults[cat.name as keyof typeof categoryDefaults] || categoryDefaults.default;
          return { 
            ...cat, 
            products_count: count,
            icon: cat.icon || defaults.icon,
            color: cat.color || defaults.color
          };
        });
        setCategories(categoriesWithCount);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category_id, base_price')
        .order('name');

      if (!error && data) {
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const createCategoriesTable = async () => {
    const defaultCategories = [
      { name: 'מנות ראשונות', description: 'מנות פתיחה ומתאבנים', display_order: 1, is_active: true },
      { name: 'מנות עיקריות', description: 'מנות עיקריות', display_order: 2, is_active: true },
      { name: 'קינוחים', description: 'קינוחים ומתוקים', display_order: 3, is_active: true },
      { name: 'שתייה', description: 'משקאות חמים וקרים', display_order: 4, is_active: true }
    ];

    try {
      const { data } = await supabase
        .from('categories')
        .insert(defaultCategories)
        .select();

      if (data) {
        setCategories(data.map(cat => {
          const defaults = categoryDefaults[cat.name as keyof typeof categoryDefaults] || categoryDefaults.default;
          return { ...cat, products_count: 0, ...defaults };
        }));
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
        is_active: category.is_active !== undefined ? category.is_active : true,
        icon: category.icon || '📦',
        color: category.color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        display_order: categories.length + 1,
        is_active: true,
        icon: '📦',
        color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({
            name: formData.name,
            description: formData.description,
            display_order: formData.display_order,
            is_active: formData.is_active
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([{
            name: formData.name,
            description: formData.description,
            display_order: formData.display_order,
            is_active: formData.is_active
          }]);

        if (error) throw error;
      }
      
      await fetchCategories();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving category:', error);
      alert('שגיאה בשמירת הקטגוריה');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchCategories();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('שגיאה במחיקת הקטגוריה. ייתכן שיש מוצרים בקטגוריה זו.');
    }
  };

  const moveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    const index = categories.findIndex(c => c.id === categoryId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    const updatedCategories = [...categories];
    [updatedCategories[index], updatedCategories[newIndex]] = 
    [updatedCategories[newIndex], updatedCategories[index]];

    // עדכון סדר התצוגה
    updatedCategories.forEach((cat, idx) => {
      cat.display_order = idx + 1;
    });

    setCategories(updatedCategories);

    // עדכון בדאטאבייס
    try {
      await Promise.all(updatedCategories.map(cat =>
        supabase
          .from('categories')
          .update({ display_order: cat.display_order })
          .eq('id', cat.id)
      ));
    } catch (error) {
      console.error('Error reordering:', error);
      fetchCategories(); // טען מחדש במקרה של שגיאה
    }
  };

  const handleMoveProducts = async () => {
    if (selectedProducts.size === 0 || !targetCategory) {
      alert('יש לבחור מוצרים וקטגוריית יעד');
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ category_id: targetCategory })
        .in('id', Array.from(selectedProducts));

      if (error) throw error;

      await fetchCategories();
      await fetchProducts();
      setSelectedProducts(new Set());
      setTargetCategory('');
      setShowMoveModal(false);
    } catch (error) {
      console.error('Error moving products:', error);
      alert('שגיאה בהעברת המוצרים');
    }
  };

  const getProductsByCategory = (categoryId: string) => {
    return products.filter(p => p.category_id === categoryId);
  };

  const getUncategorizedProducts = () => {
    return products.filter(p => !p.category_id);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '48px',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>📁</div>
          <h2 style={{ marginTop: '20px', color: '#333' }}>טוען קטגוריות...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #f8f9fa, #e9ecef)',
      direction: 'rtl',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #dee2e6',
        padding: '30px 0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 20px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div>
              <h1 style={{
                fontSize: '36px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: '0 0 10px 0'
              }}>
                ניהול קטגוריות
              </h1>
              <p style={{
                color: '#6c757d',
                fontSize: '16px',
                margin: 0
              }}>
                ארגון וניהול קטגוריות המוצרים במערכת
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => openForm()}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.3s ease',
                  transform: 'translateY(0)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(102, 126, 234, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(102, 126, 234, 0.4)';
                }}
              >
                <span style={{ fontSize: '20px' }}>➕</span>
                קטגוריה חדשה
              </button>

              <button
                onClick={() => setShowMoveModal(true)}
                style={{
                  padding: '12px 24px',
                  background: 'white',
                  color: '#495057',
                  border: '2px solid #e9ecef',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.color = '#667eea';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e9ecef';
                  e.currentTarget.style.color = '#495057';
                }}
              >
                <span style={{ fontSize: '20px' }}>🔄</span>
                העבר מוצרים
              </button>
            </div>
          </div>
        </div>
      </div>

      <ProductCategoryTabs />

      {/* Statistics Cards */}
      <div style={{
        maxWidth: '1400px',
        margin: '30px auto',
        padding: '0 20px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          {[
            { 
              title: 'סה"כ קטגוריות', 
              value: categories.length, 
              icon: '📁', 
              color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
            },
            { 
              title: 'קטגוריות פעילות', 
              value: categories.filter(c => c.is_active).length, 
              icon: '✅', 
              color: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)' 
            },
            { 
              title: 'סה"כ מוצרים', 
              value: products.length, 
              icon: '📦', 
              color: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)' 
            },
            { 
              title: 'מוצרים ללא קטגוריה', 
              value: getUncategorizedProducts().length, 
              icon: '⚠️', 
              color: 'linear-gradient(135deg, #f2994a 0%, #f2c94c 100%)' 
            }
          ].map((stat, index) => (
            <div
              key={index}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.04)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.04)';
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-20px',
                left: '-20px',
                width: '80px',
                height: '80px',
                background: stat.color,
                borderRadius: '50%',
                opacity: 0.1
              }} />
              
              <div style={{ position: 'relative' }}>
                <div style={{
                  fontSize: '32px',
                  marginBottom: '12px',
                  display: 'inline-block',
                  background: stat.color,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {stat.icon}
                </div>
                <h3 style={{
                  fontSize: '40px',
                  fontWeight: '700',
                  margin: '0 0 8px 0',
                  background: stat.color,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {stat.value}
                </h3>
                <p style={{
                  color: '#6c757d',
                  fontSize: '14px',
                  margin: 0,
                  fontWeight: '500'
                }}>
                  {stat.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories Grid */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto 40px',
        padding: '0 20px'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          marginBottom: '20px',
          color: '#212529'
        }}>
          רשימת קטגוריות
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {categories.map((category, index) => (
            <div
              key={category.id}
              style={{
                background: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 6px rgba(0,0,0,0.04)',
                transition: 'all 0.3s ease',
                opacity: category.is_active ? 1 : 0.7
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.04)';
              }}
            >
              {/* Category Header */}
              <div style={{
                background: category.color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '20px',
                position: 'relative'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      fontSize: '36px',
                      background: 'rgba(255,255,255,0.2)',
                      width: '60px',
                      height: '60px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {category.icon || '📦'}
                    </span>
                    <div>
                      <h3 style={{
                        margin: 0,
                        fontSize: '20px',
                        fontWeight: '600',
                        color: 'white'
                      }}>
                        {category.name}
                      </h3>
                      <p style={{
                        margin: '4px 0 0',
                        fontSize: '14px',
                        color: 'rgba(255,255,255,0.8)'
                      }}>
                        {category.description || 'ללא תיאור'}
                      </p>
                    </div>
                  </div>
                  
                  {!category.is_active && (
                    <span style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      background: 'rgba(255,255,255,0.9)',
                      color: '#dc3545',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      לא פעיל
                    </span>
                  )}
                </div>
              </div>

              {/* Category Body */}
              <div style={{ padding: '20px' }}>
                {/* Stats */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #e9ecef'
                }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#495057' }}>
                      {category.products_count || 0}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6c757d' }}>מוצרים</p>
                  </div>
                  <div style={{ width: '1px', background: '#e9ecef' }} />
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#495057' }}>
                      #{category.display_order || index + 1}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6c757d' }}>מיקום</p>
                  </div>
                </div>

                {/* Products Preview */}
                {category.products_count && category.products_count > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{
                      fontSize: '12px',
                      color: '#6c757d',
                      marginBottom: '8px',
                      fontWeight: '500'
                    }}>
                      מוצרים בקטגוריה:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {getProductsByCategory(category.id).slice(0, 3).map(product => (
                        <span
                          key={product.id}
                          style={{
                            padding: '4px 10px',
                            background: '#f8f9fa',
                            borderRadius: '20px',
                            fontSize: '12px',
                            color: '#495057'
                          }}
                        >
                          {product.name}
                        </span>
                      ))}
                      {getProductsByCategory(category.id).length > 3 && (
                        <span style={{
                          padding: '4px 10px',
                          background: '#e9ecef',
                          borderRadius: '20px',
                          fontSize: '12px',
                          color: '#6c757d',
                          fontWeight: '500'
                        }}>
                          +{getProductsByCategory(category.id).length - 3} נוספים
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  gap: '8px'
                }}>
                  {/* Move buttons */}
                  <button
                    onClick={() => moveCategory(category.id, 'up')}
                    disabled={index === 0}
                    style={{
                      padding: '8px',
                      background: index === 0 ? '#e9ecef' : '#f8f9fa',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: index === 0 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      color: index === 0 ? '#adb5bd' : '#495057'
                    }}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveCategory(category.id, 'down')}
                    disabled={index === categories.length - 1}
                    style={{
                      padding: '8px',
                      background: index === categories.length - 1 ? '#e9ecef' : '#f8f9fa',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: index === categories.length - 1 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      color: index === categories.length - 1 ? '#adb5bd' : '#495057'
                    }}
                  >
                    ↓
                  </button>

                  <button
                    onClick={() => openForm(category)}
                    style={{
                      flex: 1,
                      padding: '8px 16px',
                      background: '#f8f9fa',
                      color: '#495057',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#e9ecef';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f8f9fa';
                    }}
                  >
                    ✏️ ערוך
                  </button>

                  <button
                    onClick={() => setShowDeleteConfirm(category.id)}
                    disabled={category.products_count && category.products_count > 0}
                    style={{
                      padding: '8px 16px',
                      background: category.products_count && category.products_count > 0 ? '#e9ecef' : '#fff5f5',
                      color: category.products_count && category.products_count > 0 ? '#adb5bd' : '#dc3545',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: category.products_count && category.products_count > 0 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    🗑️
                  </button>
                </div>

                {/* Delete Confirmation */}
                {showDeleteConfirm === category.id && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: '#fff5f5',
                    borderRadius: '8px',
                    border: '1px solid #f5c2c7'
                  }}>
                    <p style={{
                      margin: '0 0 12px',
                      fontSize: '14px',
                      color: '#842029'
                    }}>
                      האם אתה בטוח שברצונך למחוק את הקטגוריה?
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleDelete(category.id)}
                        style={{
                          flex: 1,
                          padding: '6px 12px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        מחק
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        style={{
                          flex: 1,
                          padding: '6px 12px',
                          background: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Uncategorized Products */}
      {getUncategorizedProducts().length > 0 && (
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto 40px',
          padding: '0 20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #f2994a 0%, #f2c94c 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white'
          }}>
            <h3 style={{
              margin: '0 0 16px',
              fontSize: '20px',
              fontWeight: '600'
            }}>
              ⚠️ מוצרים ללא קטגוריה ({getUncategorizedProducts().length})
            </h3>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              {getUncategorizedProducts().map(product => (
                <span
                  key={product.id}
                  style={{
                    padding: '6px 14px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '20px',
                    fontSize: '14px',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  {product.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

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
          zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '24px',
              color: 'white'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '600'
              }}>
                {editingCategory ? 'עריכת קטגוריה' : 'קטגוריה חדשה'}
              </h2>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#495057'
                }}>
                  שם הקטגוריה *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '10px',
                    fontSize: '16px',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e9ecef';
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#495057'
                }}>
                  תיאור
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '10px',
                    fontSize: '16px',
                    minHeight: '100px',
                    resize: 'vertical',
                    transition: 'all 0.2s',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e9ecef';
                  }}
                />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#495057'
                  }}>
                    סדר תצוגה
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e9ecef',
                      borderRadius: '10px',
                      fontSize: '16px',
                      transition: 'all 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#667eea';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e9ecef';
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#495057'
                  }}>
                    אייקון
                  </label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e9ecef',
                      borderRadius: '10px',
                      fontSize: '16px',
                      transition: 'all 0.2s',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="🥗">🥗 סלטים</option>
                    <option value="🍖">🍖 בשרים</option>
                    <option value="🍰">🍰 קינוחים</option>
                    <option value="🥤">🥤 משקאות</option>
                    <option value="🍕">🍕 פיצה</option>
                    <option value="🍔">🍔 המבורגר</option>
                    <option value="🍜">🍜 מרקים</option>
                    <option value="📦">📦 אחר</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#495057'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    style={{
                      width: '20px',
                      height: '20px',
                      marginLeft: '10px',
                      cursor: 'pointer'
                    }}
                  />
                  קטגוריה פעילה
                </label>
              </div>

              {/* Form Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {editingCategory ? 'עדכן קטגוריה' : 'צור קטגוריה'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: '#f8f9fa',
                    color: '#495057',
                    border: '2px solid #e9ecef',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e9ecef';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f8f9fa';
                  }}
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Move Products Modal */}
      {showMoveModal && (
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
          zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
              padding: '24px',
              color: 'white'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '600'
              }}>
                העברת מוצרים בין קטגוריות
              </h2>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Search */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#495057'
                }}>
                  חיפוש מוצר
                </label>
                <input
                  type="text"
                  placeholder="הקלד שם מוצר..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '10px',
                    fontSize: '16px'
                  }}
                />
              </div>

              {/* Products List */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#495057'
                }}>
                  בחר מוצרים ({selectedProducts.size} נבחרו)
                </label>
                <div style={{
                  border: '2px solid #e9ecef',
                  borderRadius: '10px',
                  maxHeight: '200px',
                  overflow: 'auto',
                  padding: '12px'
                }}>
                  {filteredProducts.map(product => (
                    <label
                      key={product.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: selectedProducts.has(product.id) ? '#e7f5ff' : 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (!selectedProducts.has(product.id)) {
                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!selectedProducts.has(product.id)) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedProducts);
                          if (e.target.checked) {
                            newSelected.add(product.id);
                          } else {
                            newSelected.delete(product.id);
                          }
                          setSelectedProducts(newSelected);
                        }}
                        style={{
                          width: '18px',
                          height: '18px',
                          marginLeft: '12px',
                          cursor: 'pointer'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: '500' }}>{product.name}</span>
                        <span style={{
                          marginRight: '8px',
                          fontSize: '12px',
                          color: '#6c757d'
                        }}>
                          {product.category_id
                            ? categories.find(c => c.id === product.category_id)?.name
                            : 'ללא קטגוריה'}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Target Category */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#495057'
                }}>
                  העבר לקטגוריה
                </label>
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '10px',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">בחר קטגוריה...</option>
                  {categories.filter(c => c.is_active).map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleMoveProducts}
                  disabled={selectedProducts.size === 0 || !targetCategory}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: selectedProducts.size === 0 || !targetCategory
                      ? '#e9ecef'
                      : 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
                    color: selectedProducts.size === 0 || !targetCategory ? '#6c757d' : 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: selectedProducts.size === 0 || !targetCategory ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  העבר {selectedProducts.size} מוצרים
                </button>
                <button
                  onClick={() => {
                    setShowMoveModal(false);
                    setSelectedProducts(new Set());
                    setTargetCategory('');
                    setSearchTerm('');
                  }}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: '#f8f9fa',
                    color: '#495057',
                    border: '2px solid #e9ecef',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
