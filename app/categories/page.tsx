'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface Category {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  products_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface Product {
  id: string;
  name: string;
  category_id?: string;
  base_price: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [targetCategory, setTargetCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const router = useRouter();

  // Form state for category
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    display_order: 0,
    is_active: true
  });

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    try {
      await checkAuth();
      await fetchCategories();
      await fetchProducts();
    } catch (error) {
      console.error('Error initializing page:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/login');
    }
  };

  const fetchCategories = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('display_order');

      if (categoriesError) throw categoriesError;

      // Get products count for each category
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('category_id');

      if (!productsError && productsData) {
        const categoriesWithCount = (categoriesData || []).map(cat => {
          const count = productsData.filter(p => p.category_id === cat.id).length;
          return { ...cat, products_count: count };
        });
        setCategories(categoriesWithCount);
      } else {
        setCategories(categoriesData || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // If table doesn't exist, create default categories
      await createDefaultCategories();
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category_id, base_price')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const createDefaultCategories = async () => {
    const defaultCategories = [
      { name: 'מנות ראשונות', description: 'מנות פתיחה ומתאבנים', display_order: 1 },
      { name: 'מנות עיקריות', description: 'מנות עיקריות', display_order: 2 },
      { name: 'קינוחים', description: 'קינוחים ומתוקים', display_order: 3 },
      { name: 'שתייה', description: 'משקאות חמים וקרים', display_order: 4 }
    ];

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(defaultCategories)
        .select();

      if (!error && data) {
        setCategories(data.map(cat => ({ ...cat, products_count: 0, is_active: true })));
      }
    } catch (error) {
      console.error('Error creating default categories:', error);
    }
  };

  const openCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        display_order: category.display_order,
        is_active: category.is_active
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        description: '',
        display_order: categories.length + 1,
        is_active: true
      });
    }
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update({
            name: categoryForm.name,
            description: categoryForm.description,
            display_order: categoryForm.display_order,
            is_active: categoryForm.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        // Create new category
        const { error } = await supabase
          .from('categories')
          .insert([{
            name: categoryForm.name,
            description: categoryForm.description,
            display_order: categoryForm.display_order,
            is_active: categoryForm.is_active
          }]);

        if (error) throw error;
      }

      await fetchCategories();
      setShowCategoryModal(false);
    } catch (error) {
      console.error('Error saving category:', error);
      alert('שגיאה בשמירת הקטגוריה');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    // Check if category has products
    if (category.products_count && category.products_count > 0) {
      alert(`לא ניתן למחוק קטגוריה עם ${category.products_count} מוצרים. יש להעביר או למחוק את המוצרים קודם.`);
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      await fetchCategories();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('שגיאה במחיקת הקטגוריה');
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
      alert(`${selectedProducts.size} מוצרים הועברו בהצלחה`);
    } catch (error) {
      console.error('Error moving products:', error);
      alert('שגיאה בהעברת המוצרים');
    }
  };

  const moveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex(c => c.id === categoryId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    const updatedCategories = [...categories];
    const temp = updatedCategories[currentIndex];
    updatedCategories[currentIndex] = updatedCategories[newIndex];
    updatedCategories[newIndex] = temp;

    // Update display_order
    updatedCategories[currentIndex].display_order = currentIndex + 1;
    updatedCategories[newIndex].display_order = newIndex + 1;

    try {
      // Update both categories in database
      await Promise.all([
        supabase
          .from('categories')
          .update({ display_order: updatedCategories[currentIndex].display_order })
          .eq('id', updatedCategories[currentIndex].id),
        supabase
          .from('categories')
          .update({ display_order: updatedCategories[newIndex].display_order })
          .eq('id', updatedCategories[newIndex].id)
      ]);

      setCategories(updatedCategories);
    } catch (error) {
      console.error('Error reordering categories:', error);
    }
  };

  const toggleCategoryStatus = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !category.is_active })
        .eq('id', categoryId);

      if (error) throw error;
      await fetchCategories();
    } catch (error) {
      console.error('Error toggling category status:', error);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProductsByCategory = (categoryId: string) => {
    return products.filter(p => p.category_id === categoryId);
  };

  const getUncategorizedProducts = () => {
    return products.filter(p => !p.category_id);
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>טוען קטגוריות...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', direction: 'rtl' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1>ניהול קטגוריות</h1>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={() => openCategoryModal()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ➕ קטגוריה חדשה
          </button>
          <button
            onClick={() => setShowMoveModal(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🔄 העבר מוצרים
          </button>
          <button
            onClick={() => router.push('/products')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            📦 לניהול מוצרים
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '30px'
      }}>
        <div style={{
          padding: '15px',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>{categories.length}</h3>
          <p style={{ margin: 0, color: '#666' }}>קטגוריות</p>
        </div>
        <div style={{
          padding: '15px',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>{products.length}</h3>
          <p style={{ margin: 0, color: '#666' }}>מוצרים</p>
        </div>
        <div style={{
          padding: '15px',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>{categories.filter(c => c.is_active).length}</h3>
          <p style={{ margin: 0, color: '#666' }}>קטגוריות פעילות</p>
        </div>
        <div style={{
          padding: '15px',
          backgroundColor: '#fff3cd',
          borderRadius: '8px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>{getUncategorizedProducts().length}</h3>
          <p style={{ margin: 0, color: '#856404' }}>מוצרים ללא קטגוריה</p>
        </div>
      </div>

      {/* Categories List */}
      <div style={{ marginBottom: '30px' }}>
        <h2>קטגוריות</h2>
        <div style={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
          {categories.map((category, index) => (
            <div
              key={category.id}
              style={{
                padding: '15px',
                borderBottom: index < categories.length - 1 ? '1px solid #eee' : 'none',
                opacity: category.is_active ? 1 : 0.6
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {category.name}
                    {!category.is_active && (
                      <span style={{
                        padding: '2px 8px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        לא פעיל
                      </span>
                    )}
                    <span style={{
                      padding: '2px 8px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      {category.products_count || 0} מוצרים
                    </span>
                  </h3>
                  {category.description && (
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{category.description}</p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  {/* Move buttons */}
                  <button
                    onClick={() => moveCategory(category.id, 'up')}
                    disabled={index === 0}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: index === 0 ? '#ccc' : '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: index === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveCategory(category.id, 'down')}
                    disabled={index === categories.length - 1}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: index === categories.length - 1 ? '#ccc' : '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: index === categories.length - 1 ? 'not-allowed' : 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ↓
                  </button>

                  {/* Action buttons */}
                  <button
                    onClick={() => toggleCategoryStatus(category.id)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: category.is_active ? '#ffc107' : '#28a745',
                      color: category.is_active ? '#000' : 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {category.is_active ? '⏸️ השהה' : '▶️ הפעל'}
                  </button>
                  <button
                    onClick={() => openCategoryModal(category)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ✏️ ערוך
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(category.id)}
                    disabled={category.products_count && category.products_count > 0}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: category.products_count && category.products_count > 0 ? '#ccc' : '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: category.products_count && category.products_count > 0 ? 'not-allowed' : 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    🗑️ מחק
                  </button>
                </div>
              </div>

              {/* Delete confirmation */}
              {showDeleteConfirm === category.id && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#fff3cd',
                  borderRadius: '5px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>האם אתה בטוח שברצונך למחוק את הקטגוריה?</span>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      style={{
                        padding: '5px 15px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      מחק
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      style={{
                        padding: '5px 15px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              )}

              {/* Products preview */}
              {category.products_count && category.products_count > 0 && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '5px'
                }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#666' }}>
                    מוצרים בקטגוריה:
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {getProductsByCategory(category.id).slice(0, 5).map(product => (
                      <span
                        key={product.id}
                        style={{
                          padding: '2px 8px',
                          backgroundColor: 'white',
                          border: '1px solid #dee2e6',
                          borderRadius: '3px',
                          fontSize: '12px'
                        }}
                      >
                        {product.name} (₪{product.base_price})
                      </span>
                    ))}
                    {getProductsByCategory(category.id).length > 5 && (
                      <span style={{
                        padding: '2px 8px',
                        color: '#6c757d',
                        fontSize: '12px'
                      }}>
                        +{getProductsByCategory(category.id).length - 5} נוספים...
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Uncategorized Products */}
      {getUncategorizedProducts().length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2>מוצרים ללא קטגוריה ({getUncategorizedProducts().length})</h2>
          <div style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            padding: '15px'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {getUncategorizedProducts().map(product => (
                <div
                  key={product.id}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '14px'
                  }}
                >
                  {product.name} (₪{product.base_price})
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
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
            maxWidth: '500px',
            width: '90%'
          }}>
            <h2>{editingCategory ? 'ערוך קטגוריה' : 'קטגוריה חדשה'}</h2>
            
            <form onSubmit={handleSaveCategory}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>שם הקטגוריה *</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>תיאור</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    minHeight: '80px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>סדר תצוגה</label>
                <input
                  type="number"
                  value={categoryForm.display_order}
                  onChange={(e) => setCategoryForm({ ...categoryForm, display_order: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={categoryForm.is_active}
                    onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                  />
                  קטגוריה פעילה
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  {editingCategory ? 'עדכן' : 'צור'}
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2>העברת מוצרים בין קטגוריות</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>חיפוש מוצר</label>
              <input
                type="text"
                placeholder="הקלד שם מוצר..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                בחר מוצרים ({selectedProducts.size} נבחרו)
              </label>
              <div style={{
                border: '1px solid #ddd',
                borderRadius: '5px',
                maxHeight: '200px',
                overflow: 'auto',
                padding: '10px'
              }}>
                {filteredProducts.map(product => (
                  <label
                    key={product.id}
                    style={{
                      display: 'block',
                      padding: '5px',
                      cursor: 'pointer',
                      backgroundColor: selectedProducts.has(product.id) ? '#e7f3ff' : 'transparent'
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
                      style={{ marginLeft: '10px' }}
                    />
                    {product.name} - 
                    <span style={{ color: '#666', fontSize: '12px', marginRight: '5px' }}>
                      {product.category_id
                        ? categories.find(c => c.id === product.category_id)?.name
                        : 'ללא קטגוריה'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>העבר לקטגוריה</label>
              <select
                value={targetCategory}
                onChange={(e) => setTargetCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px'
                }}
              >
                <option value="">בחר קטגוריה...</option>
                {categories.filter(c => c.is_active).map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowMoveModal(false);
                  setSelectedProducts(new Set());
                  setTargetCategory('');
                  setSearchTerm('');
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                ביטול
              </button>
              <button
                onClick={handleMoveProducts}
                disabled={selectedProducts.size === 0 || !targetCategory}
                style={{
                  padding: '10px 20px',
                  backgroundColor: selectedProducts.size === 0 || !targetCategory ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: selectedProducts.size === 0 || !targetCategory ? 'not-allowed' : 'pointer'
                }}
              >
                העבר {selectedProducts.size} מוצרים
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
