'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  max_discount: number;
  product_options?: ProductOption[];
}

interface ProductOption {
  id: string;
  product_id: string;
  name: string;
  price: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const router = useRouter();

  // State for new product form
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    base_price: 0,
    max_discount: 20
  });

  useEffect(() => {
    checkAuth();
    fetchProducts();
    updateCartCount();
  }, []);

  const updateCartCount = () => {
    const cart = JSON.parse(sessionStorage.getItem('orderCart') || '[]');
    setCartCount(cart.length);
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
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

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([newProduct])
        .select()
        .single();

      if (error) throw error;

      setProducts([...products, { ...data, product_options: [] }]);
      setShowAddForm(false);
      setNewProduct({ name: '', description: '', base_price: 0, max_discount: 20 });
    } catch (error) {
      console.error('Error adding product:', error);
      alert('שגיאה בהוספת מוצר');
    }
  };

  const handleAddToOrder = (product: Product) => {
    // יצירת אובייקט פריט להוספה
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
      timestamp: Date.now() // להבדיל בין פריטים זהים
    };

    // קבלת העגלה הקיימת
    const existingCart = JSON.parse(sessionStorage.getItem('orderCart') || '[]');
    
    // הוספת הפריט החדש לעגלה
    existingCart.push(orderItem);
    
    // שמירה בחזרה
    sessionStorage.setItem('orderCart', JSON.stringify(existingCart));
    
    // עדכון מונה העגלה
    setCartCount(existingCart.length);
    
    // הצגת הודעת הצלחה
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
    
    // איפוס הבחירות
    setSelectedProduct(null);
    setSelectedOptions(new Set());
    setQuantity(1);
    setDiscount(0);
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

  const goToCart = () => {
    router.push('/orders/create');
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
      {/* Header with cart */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0 }}>ניהול מוצרים</h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {cartCount > 0 && (
            <button
              onClick={goToCart}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                position: 'relative'
              }}
            >
              🛒 לעגלה ({cartCount} פריטים)
            </button>
          )}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
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
            {showAddForm ? 'ביטול' : '+ הוסף מוצר חדש'}
          </button>
        </div>
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
          zIndex: 2000,
          animation: 'slideDown 0.3s ease'
        }}>
          ✓ המוצר נוסף לעגלה בהצלחה!
        </div>
      )}

      {showAddForm && (
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '30px'
        }}>
          <h2>הוסף מוצר חדש</h2>
          <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input
              type="text"
              placeholder="שם המוצר"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              required
              style={{ padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ddd' }}
            />
            <textarea
              placeholder="תיאור המוצר"
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              style={{ padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ddd', minHeight: '100px' }}
            />
            <input
              type="number"
              placeholder="מחיר בסיס"
              value={newProduct.base_price}
              onChange={(e) => setNewProduct({ ...newProduct, base_price: parseFloat(e.target.value) })}
              required
              style={{ padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ddd' }}
            />
            <input
              type="number"
              placeholder="הנחה מקסימלית (%)"
              value={newProduct.max_discount}
              onChange={(e) => setNewProduct({ ...newProduct, max_discount: parseFloat(e.target.value) })}
              style={{ padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ddd' }}
            />
            <button
              type="submit"
              style={{
                padding: '10px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              שמור מוצר
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {products.map((product) => (
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
            <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#2196F3' }}>
              ₪{product.base_price.toFixed(2)}
            </p>
            {product.max_discount > 0 && (
              <p style={{ color: '#4CAF50', fontSize: '14px' }}>
                הנחה מקסימלית: {product.max_discount}%
              </p>
            )}
            
            {product.product_options && product.product_options.length > 0 && (
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>תוספות זמינות:</p>
                {product.product_options.map((option) => (
                  <div key={option.id} style={{ fontSize: '14px', color: '#666', marginBottom: '3px' }}>
                    • {option.name} (+₪{option.price})
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                setSelectedProduct(product);
                setSelectedOptions(new Set());
                setQuantity(1);
                setDiscount(0);
              }}
              style={{
                marginTop: '15px',
                width: '100%',
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
          </div>
        ))}
      </div>

      {/* Modal for product configuration */}
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
