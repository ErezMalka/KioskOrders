// app/products/page.tsx - מערכת ניהול מוצרים ותמחור
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types
interface ProductOption {
  id: string;
  name: string;
  price: number;
  type: 'addition' | 'upgrade' | 'accessory';
  required: boolean;
}

interface Product {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  description: string;
  options: ProductOption[];
  image?: string;
  active: boolean;
}

interface PaymentPlan {
  id: string;
  name: string;
  payments: number;
  type: 'credit' | 'installments' | 'financing';
  interestRate?: number;
  description: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([
    { id: '1', name: 'מזומן', payments: 1, type: 'credit', description: 'תשלום מיידי' },
    { id: '2', name: '3 תשלומים', payments: 3, type: 'credit', description: 'ללא ריבית' },
    { id: '3', name: '6 תשלומים', payments: 6, type: 'credit', description: 'ללא ריבית' },
    { id: '4', name: '12 תשלומים', payments: 12, type: 'installments', description: 'ללא ריבית' },
    { id: '5', name: '24 תשלומים', payments: 24, type: 'installments', interestRate: 2.5, description: 'עם ריבית 2.5%' },
    { id: '6', name: '36 תשלומים במימון', payments: 36, type: 'financing', interestRate: 4.5, description: 'מימון חיצוני' }
  ]);

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // Form states
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'kiosk',
    basePrice: 0,
    description: '',
    active: true
  });

  const [optionForm, setOptionForm] = useState({
    name: '',
    price: 0,
    type: 'addition' as const,
    required: false
  });

  const [tempOptions, setTempOptions] = useState<ProductOption[]>([]);

  // Sample products for demo
  useEffect(() => {
    const sampleProducts: Product[] = [
      {
        id: '1',
        name: 'קיוסק 22 אינץ\' ווינטק',
        category: 'kiosk',
        basePrice: 8000,
        description: 'קיוסק מתקדם עם מסך מגע 22 אינץ\'',
        active: true,
        options: [
          { id: 'opt1', name: 'התקנה מקצועית', price: 500, type: 'addition', required: false },
          { id: 'opt2', name: 'רגל מתכווננת', price: 699, type: 'accessory', required: false },
          { id: 'opt3', name: 'מכשיר סליקה מובנה', price: 799, type: 'accessory', required: false },
          { id: 'opt4', name: 'מדפסת תרמית', price: 450, type: 'accessory', required: false },
          { id: 'opt5', name: 'סורק ברקוד', price: 350, type: 'accessory', required: false }
        ]
      },
      {
        id: '2',
        name: 'קיוסק 32 אינץ\' Premium',
        category: 'kiosk',
        basePrice: 12000,
        description: 'קיוסק פרימיום עם מסך גדול במיוחד',
        active: true,
        options: [
          { id: 'opt6', name: 'התקנה מקצועית', price: 500, type: 'addition', required: false },
          { id: 'opt7', name: 'עמדה מעוצבת', price: 1200, type: 'upgrade', required: false },
          { id: 'opt8', name: 'מערכת קול מובנית', price: 650, type: 'accessory', required: false }
        ]
      }
    ];
    setProducts(sampleProducts);
  }, []);

  const handleAddOption = () => {
    if (optionForm.name && optionForm.price > 0) {
      const newOption: ProductOption = {
        id: Date.now().toString(),
        ...optionForm
      };
      setTempOptions([...tempOptions, newOption]);
      setOptionForm({ name: '', price: 0, type: 'addition', required: false });
    }
  };

  const handleRemoveOption = (optionId: string) => {
    setTempOptions(tempOptions.filter(opt => opt.id !== optionId));
  };

  const handleSaveProduct = () => {
    const newProduct: Product = {
      id: Date.now().toString(),
      ...productForm,
      options: tempOptions
    };

    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? newProduct : p));
      setEditingProduct(null);
    } else {
      setProducts([...products, newProduct]);
    }

    // Reset form
    setProductForm({ name: '', category: 'kiosk', basePrice: 0, description: '', active: true });
    setTempOptions([]);
    setShowAddProduct(false);
  };

  const calculateTotal = (product: Product, selectedOpts: string[]) => {
    let total = product.basePrice;
    product.options.forEach(opt => {
      if (selectedOpts.includes(opt.id)) {
        total += opt.price;
      }
    });
    return total;
  };

  const calculatePayment = (total: number, plan: PaymentPlan) => {
    if (plan.interestRate) {
      const interest = total * (plan.interestRate / 100);
      return Math.round((total + interest) / plan.payments);
    }
    return Math.round(total / plan.payments);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      direction: 'rtl',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#333' }}>
            📦 ניהול מוצרים ותמחור
          </h1>
          <button
            onClick={() => setShowAddProduct(true)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ➕ הוסף מוצר חדש
          </button>
        </div>
      </header>

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '25px'
      }}>
        {/* Product Cards */}
        {products.map(product => (
          <div key={product.id} style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          onClick={() => setSelectedProduct(product)}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
              marginBottom: '15px'
            }}>
              <h3 style={{ margin: 0, fontSize: '20px', color: '#333' }}>
                {product.name}
              </h3>
              <span style={{
                backgroundColor: product.active ? '#4CAF50' : '#f44336',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px'
              }}>
                {product.active ? 'פעיל' : 'לא פעיל'}
              </span>
            </div>
            
            <p style={{ color: '#666', marginBottom: '15px' }}>
              {product.description}
            </p>
            
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#4CAF50',
              marginBottom: '15px'
            }}>
              ₪{product.basePrice.toLocaleString()}
              <span style={{ fontSize: '14px', color: '#999', marginRight: '8px' }}>
                מחיר בסיס
              </span>
            </div>

            {product.options.length > 0 && (
              <div style={{
                borderTop: '1px solid #eee',
                paddingTop: '15px'
              }}>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                  תוספות אפשריות:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {product.options.slice(0, 3).map(opt => (
                    <span key={opt.id} style={{
                      backgroundColor: '#f0f0f0',
                      padding: '4px 10px',
                      borderRadius: '15px',
                      fontSize: '12px'
                    }}>
                      {opt.name} (+₪{opt.price})
                    </span>
                  ))}
                  {product.options.length > 3 && (
                    <span style={{
                      backgroundColor: '#e3f2fd',
                      padding: '4px 10px',
                      borderRadius: '15px',
                      fontSize: '12px',
                      color: '#2196F3'
                    }}>
                      +{product.options.length - 3} נוספים
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add/Edit Product Modal */}
      {showAddProduct && (
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
            borderRadius: '16px',
            padding: '30px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginTop: 0 }}>
              {editingProduct ? 'ערוך מוצר' : 'הוסף מוצר חדש'}
            </h2>

            <div style={{ display: 'grid', gap: '20px' }}>
              {/* Product Basic Info */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  שם המוצר
                </label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '15px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    קטגוריה
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '15px'
                    }}
                  >
                    <option value="kiosk">קיוסק</option>
                    <option value="pos">קופה רושמת</option>
                    <option value="accessory">אביזר</option>
                    <option value="software">תוכנה</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    מחיר בסיס (₪)
                  </label>
                  <input
                    type="number"
                    value={productForm.basePrice}
                    onChange={(e) => setProductForm({...productForm, basePrice: Number(e.target.value)})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '15px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  תיאור
                </label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '15px',
                    minHeight: '80px'
                  }}
                />
              </div>

              {/* Options Section */}
              <div style={{
                borderTop: '2px solid #f0f0f0',
                paddingTop: '20px'
              }}>
                <h3>תוספות ואפשרויות</h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr auto auto',
                  gap: '10px',
                  alignItems: 'end',
                  marginBottom: '20px'
                }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                      שם התוספת
                    </label>
                    <input
                      type="text"
                      value={optionForm.name}
                      onChange={(e) => setOptionForm({...optionForm, name: e.target.value})}
                      placeholder="לדוגמה: התקנה מקצועית"
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                      מחיר (₪)
                    </label>
                    <input
                      type="number"
                      value={optionForm.price}
                      onChange={(e) => setOptionForm({...optionForm, price: Number(e.target.value)})}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                      סוג
                    </label>
                    <select
                      value={optionForm.type}
                      onChange={(e) => setOptionForm({...optionForm, type: e.target.value as any})}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '6px'
                      }}
                    >
                      <option value="addition">תוספת</option>
                      <option value="upgrade">שדרוג</option>
                      <option value="accessory">אביזר</option>
                    </select>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input
                      type="checkbox"
                      checked={optionForm.required}
                      onChange={(e) => setOptionForm({...optionForm, required: e.target.checked})}
                    />
                    <label style={{ fontSize: '14px' }}>חובה</label>
                  </div>
                  
                  <button
                    onClick={handleAddOption}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    הוסף
                  </button>
                </div>

                {/* Options List */}
                {tempOptions.length > 0 && (
                  <div style={{
                    backgroundColor: '#f9f9f9',
                    borderRadius: '8px',
                    padding: '15px'
                  }}>
                    <h4 style={{ marginTop: 0, marginBottom: '15px' }}>תוספות שהוגדרו:</h4>
                    {tempOptions.map(opt => (
                      <div key={opt.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px',
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        marginBottom: '8px'
                      }}>
                        <div>
                          <span style={{ fontWeight: '500' }}>{opt.name}</span>
                          <span style={{ color: '#666', marginRight: '10px' }}>
                            ₪{opt.price}
                          </span>
                          <span style={{
                            backgroundColor: opt.type === 'addition' ? '#e3f2fd' : 
                                          opt.type === 'upgrade' ? '#fff3e0' : '#f3e5f5',
                            color: opt.type === 'addition' ? '#1976d2' : 
                                   opt.type === 'upgrade' ? '#ef6c00' : '#7b1fa2',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            marginRight: '10px'
                          }}>
                            {opt.type === 'addition' ? 'תוספת' : 
                             opt.type === 'upgrade' ? 'שדרוג' : 'אביזר'}
                          </span>
                          {opt.required && (
                            <span style={{
                              backgroundColor: '#ffebee',
                              color: '#c62828',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '12px'
                            }}>
                              חובה
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveOption(opt.id)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          הסר
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '20px'
              }}>
                <button
                  onClick={() => {
                    setShowAddProduct(false);
                    setEditingProduct(null);
                    setProductForm({ name: '', category: 'kiosk', basePrice: 0, description: '', active: true });
                    setTempOptions([]);
                  }}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '15px'
                  }}
                >
                  ביטול
                </button>
                <button
                  onClick={handleSaveProduct}
                  disabled={!productForm.name || productForm.basePrice <= 0}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: productForm.name && productForm.basePrice > 0 ? '#4CAF50' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: productForm.name && productForm.basePrice > 0 ? 'pointer' : 'not-allowed',
                    fontSize: '15px'
                  }}
                >
                  {editingProduct ? 'עדכן מוצר' : 'שמור מוצר'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Details & Calculator Modal */}
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
            borderRadius: '16px',
            padding: '30px',
            width: '90%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
              marginBottom: '25px'
            }}>
              <div>
                <h2 style={{ margin: 0, marginBottom: '10px' }}>
                  {selectedProduct.name}
                </h2>
                <p style={{ color: '#666', margin: 0 }}>
                  {selectedProduct.description}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setSelectedOptions([]);
                }}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '30px'
            }}>
              {/* Options Selection */}
              <div>
                <h3 style={{ marginBottom: '20px' }}>בחר תוספות:</h3>
                
                <div style={{
                  backgroundColor: '#f0f8ff',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontWeight: '500' }}>מחיר בסיס</span>
                    <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
                      ₪{selectedProduct.basePrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                {selectedProduct.options.map(option => (
                  <div key={option.id} style={{
                    padding: '15px',
                    backgroundColor: selectedOptions.includes(option.id) ? '#e8f5e9' : '#f9f9f9',
                    border: `2px solid ${selectedOptions.includes(option.id) ? '#4CAF50' : '#e0e0e0'}`,
                    borderRadius: '8px',
                    marginBottom: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => {
                    if (selectedOptions.includes(option.id)) {
                      setSelectedOptions(selectedOptions.filter(id => id !== option.id));
                    } else {
                      setSelectedOptions([...selectedOptions, option.id]);
                    }
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="checkbox"
                          checked={selectedOptions.includes(option.id)}
                          onChange={() => {}}
                          style={{ width: '20px', height: '20px' }}
                        />
                        <div>
                          <div style={{ fontWeight: '500' }}>{option.name}</div>
                          {option.required && (
                            <span style={{
                              fontSize: '12px',
                              color: '#f44336',
                              marginTop: '4px',
                              display: 'inline-block'
                            }}>
                              * חובה
                            </span>
                          )}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#4CAF50'
                      }}>
                        +₪{option.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment Calculator */}
              <div>
                <h3 style={{ marginBottom: '20px' }}>סיכום ותשלומים:</h3>
                
                <div style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  marginBottom: '25px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}>סה"כ לתשלום</div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
                    ₪{calculateTotal(selectedProduct, selectedOptions).toLocaleString()}
                  </div>
                </div>

                <h4 style={{ marginBottom: '15px' }}>אפשרויות תשלום:</h4>
                
                <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                  {paymentPlans.map(plan => {
                    const total = calculateTotal(selectedProduct, selectedOptions);
                    const payment = calculatePayment(total, plan);
                    const totalWithInterest = plan.interestRate ? 
                      Math.round(total * (1 + plan.interestRate / 100)) : total;
                    
                    return (
                      <div key={plan.id} style={{
                        padding: '15px',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '8px',
                        marginBottom: '12px',
                        border: '1px solid #e0e0e0'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'start',
                          marginBottom: '8px'
                        }}>
                          <div>
                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                              {plan.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {plan.description}
                            </div>
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{
                              fontSize: '20px',
                              fontWeight: 'bold',
                              color: '#333'
                            }}>
                              ₪{payment.toLocaleString()}
                            </div>
                            {plan.payments > 1 && (
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                לתשלום
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {plan.interestRate && (
                          <div style={{
                            paddingTop: '8px',
                            borderTop: '1px solid #e0e0e0',
                            fontSize: '12px',
                            color: '#666'
                          }}>
                            סה"כ עם ריבית: ₪{totalWithInterest.toLocaleString()}
                            <span style={{ marginRight: '10px' }}>
                              ({plan.interestRate}% ריבית)
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  style={{
                    width: '100%',
                    padding: '15px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    marginTop: '20px'
                  }}
                  onClick={() => {
                    // Navigate to create order page
                    window.location.href = '/orders/create';
                  }}
                >
                  🛒 הוסף להזמנה
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
