'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// Types
interface Category {
  id: string;
  name: string;
  description?: string;
}

interface ProductOption {
  id: string;
  product_id?: string;
  name: string;
  price: number;
  is_required?: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  max_discount: number;
  category_id?: string;
  main_image?: string;
  additional_images?: string[];
  product_options?: ProductOption[];
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEditForm, setShowAddEditForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: 0,
    max_discount: 20,
    category_id: '',
    main_image: '',
    additional_images: [] as string[],
    product_options: [] as ProductOption[]
  });

  const [newOption, setNewOption] = useState({
    name: '',
    price: 0,
    is_required: false
  });

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    try {
      await checkAuth();
      await fetchCategories();
      await fetchProducts();
      updateCartCount();
    } catch (error) {
      console.error('Error initializing page:', error);
    }
  };

  const updateCartCount = () => {
    try {
      const cart = JSON.parse(sessionStorage.getItem('orderCart') || '[]');
      setCartCount(cart.length);
    } catch (error) {
      console.error('Error updating cart count:', error);
      setCartCount(0);
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
    // Use default categories for now
    const defaultCategories = [
      { id: '1', name: 'מנות ראשונות', description: 'מנות פתיחה' },
      { id: '2', name: 'מנות עיקריות', description: 'מנות עיקריות' },
      { id: '3', name: 'קינוחים', description: 'קינוחים' },
      { id: '4', name: 'שתייה', description: 'משקאות' }
    ];
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order');

      if (!error && data && data.length > 0) {
        setCategories(data);
      } else {
        setCategories(defaultCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories(defaultCategories);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_options (*)
        `)
        .order('name');

      if (error) {
        console.error('Error fetching products:', error);
      } else {
        setProducts(data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        base_price: formData.base_price,
        max_discount: formData.max_discount,
        category_id: formData.category_id || null,
        main_image: formData.main_image || null,
        additional_images: formData.additional_images.length > 0 ? formData.additional_images : null
      };

      if (editingProduct) {
        // Update product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();

        if (error) throw error;

        // Add options if any
        if (data && formData.product_options.length > 0) {
          const optionsToInsert = formData.product_options.map(opt => ({
            product_id: data.id,
            name: opt.name,
            price: opt.price,
            is_required: opt.is_required || false
          }));

          await supabase
            .from('product_options')
            .insert(optionsToInsert);
        }
      }

      await fetchProducts();
      setShowAddEditForm(false);
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('שגיאה בשמירת המוצר');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      base_price: 0,
      max_discount: 20,
      category_id: '',
      main_image: '',
      additional_images: [],
      product_options: []
    });
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את המוצר?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('שגיאה במחיקת המוצר');
    }
  };

  const handleAddToOrder = (product: Product) => {
    try {
      const orderItem = {
        product: {
          id: product.id,
          name: product.name,
          base_price: product.base_price,
          max_discount: product.max_discount
        },
        selectedOptions: Array.from(selectedOptions).map(optionId => {
          const option = product.product_options?.find(o => o.id === optionId);
          return option ? { id: option.id, name: option.name, price: option.price } : null;
        }).filter(Boolean),
        quantity: quantity,
        discount: discount,
        timestamp: Date.now()
      };

      const existingCart = JSON.parse(sessionStorage.getItem('orderCart') || '[]');
      existingCart.push(orderItem);
      sessionStorage.setItem('orderCart', JSON.stringify(existingCart));
      
      setCartCount(existingCart.length);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      
      setSelectedProduct(null);
      setSelectedOptions(new Set());
      setQuantity(1);
      setDiscount(0);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('שגיאה בהוספה לעגלה');
    }
  };

  const calculateTotalPrice = (product: Product) => {
    let total = product.base_price;
    selectedOptions.forEach(optionId => {
      const option = product.product_options?.find(o => o.id === optionId);
      if (option) total += option.price;
    });
    total = total * quantity * (1 - discount / 100);
    return total;
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category_id === selectedCategory);

  const openAddEditForm = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        base_price: product.base_price,
        max_discount: product.max_discount,
        category_id: product.category_id || '',
        main_image: product.main_image || '',
        additional_images: product.additional_images || [],
        product_options: product.product_options || []
      });
    } else {
      resetForm();
    }
    setShowAddEditForm(true);
  };

  const addOptionToProduct = () => {
    if (newOption.name) {
      const option: ProductOption = {
        id: `temp_${Date.now()}`,
        name: newOption.name,
        price: newOption.price,
        is_required: newOption.is_required
      };
      setFormData({
        ...formData,
        product_options: [...formData.product_options, option]
      });
      setNewOption({ name: '', price: 0, is_required: false });
    }
  };

  const removeOption = (optionId: string) => {
    setFormData({
      ...formData,
      product_options: formData.product_options.filter(o => o.id !== optionId)
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>טוען מוצרים...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', direction: 'rtl' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0 }}>ניהול מוצרים</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {cartCount > 0 && (
            <button
              onClick={() => router.push('/orders/create')}
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
              🛒 לעגלה ({cartCount})
            </button>
          )}
          <button
            onClick={() => openAddEditForm()}
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
            + הוסף מוצר חדש
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div style={{ marginBottom: '20px' }}>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '5px',
            border: '1px solid #ddd',
            fontSize: '14px'
          }}
        >
          <option value="all">כל הקטגוריות</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Success message */}
      {showSuccessMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '15px 30px',
          backgroundColor: '#4CAF50',
          color: 'white',
          borderRadius: '5px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 2000
        }}>
          ✓ המוצר נוסף לעגלה בהצלחה!
        </div>
      )}

      {/* Products Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '10px',
              padding: '20px',
              backgroundColor: 'white',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
            }}
          >
            <h3>{product.name}</h3>
            <p style={{ color: '#666' }}>{product.description}</p>
            
            {product.category_id && categories.find(c => c.id === product.category_id) && (
              <span style={{
                display: 'inline-block',
                padding: '4px 8px',
                backgroundColor: '#f0f0f0',
                borderRadius: '15px',
                fontSize: '12px',
                marginBottom: '10px'
              }}>
                {categories.find(c => c.id === product.category_id)?.name}
              </span>
            )}

            <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#2196F3' }}>
              ₪{product.base_price.toFixed(2)}
            </p>
            
            {product.max_discount > 0 && (
              <p style={{ color: '#4CAF50', fontSize: '14px' }}>
                הנחה מקסימלית: {product.max_discount}%
              </p>
            )}
            
            {product.product_options && product.product_options.length > 0 && (
              <div style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: '#f9f9f9',
                borderRadius: '5px'
              }}>
                <p style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>
                  {product.product_options.length} תוספות זמינות
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button
                onClick={() => {
                  setSelectedProduct(product);
                  setSelectedOptions(new Set());
                  setQuantity(1);
                  setDiscount(0);
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#FF9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                הוסף להזמנה
              </button>
              <button
                onClick={() => openAddEditForm(product)}
                style={{
                  padding: '10px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                ✏️
              </button>
              <button
                onClick={() => handleDeleteProduct(product.id)}
                style={{
                  padding: '10px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Product Modal */}
      {showAddEditForm && (
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
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2>{editingProduct ? 'ערוך מוצר' : 'הוסף מוצר חדש'}</h2>
            
            <form onSubmit={handleSaveProduct}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>שם המוצר</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                <label style={{ display: 'block', marginBottom: '5px' }}>קטגוריה</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                >
                  <option value="">בחר קטגוריה</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>תיאור</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    minHeight: '80px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>מחיר (₪)</label>
                  <input
                    type="number"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '5px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>הנחה מקסימלית (%)</label>
                  <input
                    type="number"
                    value={formData.max_discount}
                    onChange={(e) => setFormData({ ...formData, max_discount: parseFloat(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '5px'
                    }}
                  />
                </div>
              </div>

              {/* Product Options */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>תוספות למוצר</label>
                <div style={{
                  backgroundColor: '#f9f9f9',
                  padding: '10px',
                  borderRadius: '5px',
                  marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="שם התוספת"
                      value={newOption.name}
                      onChange={(e) => setNewOption({ ...newOption, name: e.target.value })}
                      style={{ flex: 2, padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}
                    />
                    <input
                      type="number"
                      placeholder="מחיר"
                      value={newOption.price}
                      onChange={(e) => setNewOption({ ...newOption, price: parseFloat(e.target.value) || 0 })}
                      style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input
                        type="checkbox"
                        checked={newOption.is_required}
                        onChange={(e) => setNewOption({ ...newOption, is_required: e.target.checked })}
                      />
                      חובה
                    </label>
                    <button
                      type="button"
                      onClick={addOptionToProduct}
                      style={{
                        padding: '8px 15px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      הוסף
                    </button>
                  </div>
                </div>

                {formData.product_options.length > 0 && (
                  <div>
                    {formData.product_options.map(option => (
                      <div
                        key={option.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px',
                          backgroundColor: 'white',
                          border: '1px solid #ddd',
                          borderRadius: '5px',
                          marginBottom: '5px'
                        }}
                      >
                        <span>{option.name} - ₪{option.price}</span>
                        <button
                          type="button"
                          onClick={() => removeOption(option.id)}
                          style={{
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            padding: '4px 8px',
                            cursor: 'pointer'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddEditForm(false);
                    resetForm();
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f0f0f0',
                    color: '#333',
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
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  {editingProduct ? 'עדכן' : 'הוסף'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Configuration Modal */}
      {selectedProduct && (
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
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2>{selectedProduct.name}</h2>
            
            {selectedProduct.product_options && selectedProduct.product_options.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3>בחר תוספות:</h3>
                {selectedProduct.product_options.map((option) => (
                  <label key={option.id} style={{ display: 'block', marginBottom: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedOptions.has(option.id)}
                      onChange={(e) => {
                        const newOptions = new Set(selectedOptions);
                        if (e.target.checked) {
                          newOptions.add(option.id);
                        } else {
                          newOptions.delete(option.id);
                        }
                        setSelectedOptions(newOptions);
                      }}
                      style={{ marginLeft: '10px' }}
                    />
                    {option.name} (+₪{option.price})
                  </label>
                ))}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label>
                כמות:
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  style={{
                    marginRight: '10px',
                    padding: '5px',
                    width: '80px',
                    fontSize: '16px'
                  }}
                />
              </label>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label>
                הנחה (%):
                <input
                  type="number"
                  min="0"
                  max={selectedProduct.max_discount}
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  style={{
                    marginRight: '10px',
                    padding: '5px',
                    width: '80px',
                    fontSize: '16px'
                  }}
                />
              </label>
            </div>

            <div style={{
              padding: '15px',
              backgroundColor: '#f0f0f0',
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              <h3>סה"כ: ₪{calculateTotalPrice(selectedProduct).toFixed(2)}</h3>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handleAddToOrder(selectedProduct)}
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
                הוסף לעגלה ✓
              </button>
              <button
                onClick={() => setSelectedProduct(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#f44336',
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
          </div>
        </div>
      )}
    </div>
  );
}
