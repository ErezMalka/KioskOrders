// app/orders/create/page.tsx - יצירת הזמנה חדשה
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Product {
  id: string;
  name: string;
  category: string;
  base_price: number;
  description: string;
}

interface ProductOption {
  id: string;
  product_id: string;
  name: string;
  price: number;
  type: string;
  required: boolean;
}

interface PaymentPlan {
  id: string;
  name: string;
  payments_count: number;
  type: string;
  interest_rate: number;
  description: string;
}

interface CartItem {
  product: Product;
  selectedOptions: ProductOption[];
  quantity: number;
  totalPrice: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
}

export default function CreateOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productOptions, setProductOptions] = useState<Record<string, ProductOption[]>>({});
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  
  // Order form state
  const [orderForm, setOrderForm] = useState({
    customer_id: '',
    payment_plan_id: '',
    notes: '',
    delivery_date: '',
    installation_required: false
  });

  // New customer form
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (productsData) {
        setProducts(productsData);
        
        // Load options for each product
        const optionsMap: Record<string, ProductOption[]> = {};
        for (const product of productsData) {
          const { data: optionsData } = await supabase
            .from('product_options')
            .select('*')
            .eq('product_id', product.id)
            .eq('active', true)
            .order('sort_order');
          
          if (optionsData) {
            optionsMap[product.id] = optionsData;
          }
        }
        setProductOptions(optionsMap);
      }

      // Load payment plans
      const { data: plansData } = await supabase
        .from('payment_plans')
        .select('*')
        .eq('active', true)
        .order('payments_count');
      
      if (plansData) {
        setPaymentPlans(plansData);
      }

      // Load customers
      const { data: customersData } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      
      if (customersData) {
        setCustomers(customersData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    const options = productOptions[selectedProduct.id] || [];
    const selectedOpts = options.filter(opt => selectedOptions.includes(opt.id));
    
    let totalPrice = Number(selectedProduct.base_price);
    selectedOpts.forEach(opt => {
      totalPrice += Number(opt.price);
    });

    const cartItem: CartItem = {
      product: selectedProduct,
      selectedOptions: selectedOpts,
      quantity: 1,
      totalPrice
    };

    setCart([...cart, cartItem]);
    setSelectedProduct(null);
    setSelectedOptions([]);
    setShowProductModal(false);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const calculateCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.totalPrice * item.quantity), 0);
  };

  const calculatePayment = (planId: string) => {
    const plan = paymentPlans.find(p => p.id === planId);
    if (!plan) return 0;
    
    const total = calculateCartTotal();
    if (plan.interest_rate > 0) {
      const totalWithInterest = total * (1 + plan.interest_rate / 100);
      return Math.round(totalWithInterest / plan.payments_count);
    }
    return Math.round(total / plan.payments_count);
  };

  const handleCreateCustomer = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([newCustomerForm])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCustomers([...customers, data]);
        setOrderForm({ ...orderForm, customer_id: data.id });
        setShowNewCustomer(false);
        setNewCustomerForm({ name: '', email: '', phone: '', company: '' });
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('שגיאה ביצירת לקוח');
    }
  };

  const handleSubmitOrder = async () => {
    if (!orderForm.customer_id) {
      alert('יש לבחור לקוח');
      return;
    }
    
    if (cart.length === 0) {
      alert('העגלה ריקה');
      return;
    }

    if (!orderForm.payment_plan_id) {
      alert('יש לבחור תוכנית תשלום');
      return;
    }

    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create order
      const orderNumber = `ORD-${Date.now()}`;
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: orderForm.customer_id,
          status: 'pending',
          total_amount: calculateCartTotal(),
          payment_plan_id: orderForm.payment_plan_id,
          notes: orderForm.notes,
          delivery_date: orderForm.delivery_date || null,
          installation_required: orderForm.installation_required,
          created_by: user.id
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order lines
      for (const item of cart) {
        const { error: lineError } = await supabase
          .from('order_lines')
          .insert({
            order_id: orderData.id,
            product_id: item.product.id,
            quantity: item.quantity,
            unit_price: item.product.base_price,
            total_price: item.totalPrice * item.quantity,
            options: item.selectedOptions.map(opt => ({
              id: opt.id,
              name: opt.name,
              price: opt.price
            }))
          });

        if (lineError) throw lineError;
      }

      // Create order event
      await supabase
        .from('order_events')
        .insert({
          order_id: orderData.id,
          event_type: 'created',
          description: 'הזמנה נוצרה',
          created_by: user.id
        });

      alert(`הזמנה ${orderNumber} נוצרה בהצלחה!`);
      router.push('/orders');
      
    } catch (error) {
      console.error('Error creating order:', error);
      alert('שגיאה ביצירת ההזמנה');
    } finally {
      setLoading(false);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        direction: 'rtl'
      }}>
        <h2>טוען...</h2>
      </div>
    );
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
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#333' }}>
            🛒 יצירת הזמנה חדשה
          </h1>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            חזרה לדשבורד
          </button>
        </div>
      </header>

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '30px'
      }}>
        {/* Main Section */}
        <div>
          {/* Customer Selection */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '25px',
            marginBottom: '25px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px' }}>פרטי לקוח</h2>
            
            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <select
                value={orderForm.customer_id}
                onChange={(e) => setOrderForm({...orderForm, customer_id: e.target.value})}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '15px'
                }}
              >
                <option value="">בחר לקוח קיים...</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.company && `(${customer.company})`}
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => setShowNewCustomer(true)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                + לקוח חדש
              </button>
            </div>
          </div>

          {/* Products Selection */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '25px',
            marginBottom: '25px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ margin: 0 }}>מוצרים</h2>
              <button
                onClick={() => setShowProductModal(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                + הוסף מוצר
              </button>
            </div>

            {cart.length === 0 ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#999'
              }}>
                לא נבחרו מוצרים עדיין
              </div>
            ) : (
              <div>
                {cart.map((item, index) => (
                  <div key={index} style={{
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    marginBottom: '15px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start'
                    }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 10px 0' }}>{item.product.name}</h4>
                        
                        {item.selectedOptions.length > 0 && (
                          <div style={{ marginBottom: '10px' }}>
                            <span style={{ fontSize: '14px', color: '#666' }}>תוספות: </span>
                            {item.selectedOptions.map(opt => (
                              <span key={opt.id} style={{
                                display: 'inline-block',
                                backgroundColor: '#e0e0e0',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                marginRight: '5px'
                              }}>
                                {opt.name} (+₪{opt.price})
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <div>
                            <label style={{ fontSize: '14px', marginLeft: '5px' }}>כמות:</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const newCart = [...cart];
                                newCart[index].quantity = parseInt(e.target.value) || 1;
                                setCart(newCart);
                              }}
                              style={{
                                width: '60px',
                                padding: '5px',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ textAlign: 'left' }}>
                        <div style={{
                          fontSize: '20px',
                          fontWeight: 'bold',
                          color: '#28a745',
                          marginBottom: '10px'
                        }}>
                          ₪{(item.totalPrice * item.quantity).toLocaleString()}
                        </div>
                        <button
                          onClick={() => removeFromCart(index)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#dc3545',
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional Details */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px' }}>פרטים נוספים</h2>
            
            <div style={{ display: 'grid', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  תאריך אספקה
                </label>
                <input
                  type="date"
                  value={orderForm.delivery_date}
                  onChange={(e) => setOrderForm({...orderForm, delivery_date: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  הערות
                </label>
                <textarea
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="installation"
                  checked={orderForm.installation_required}
                  onChange={(e) => setOrderForm({...orderForm, installation_required: e.target.checked})}
                />
                <label htmlFor="installation">נדרשת התקנה</label>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            position: 'sticky',
            top: '20px'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px' }}>סיכום הזמנה</h2>
            
            <div style={{
              padding: '20px',
              backgroundColor: '#28a745',
              color: 'white',
              borderRadius: '10px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', marginBottom: '5px' }}>סה"כ לתשלום</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                ₪{calculateCartTotal().toLocaleString()}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>
                תוכנית תשלום
              </label>
              <select
                value={orderForm.payment_plan_id}
                onChange={(e) => setOrderForm({...orderForm, payment_plan_id: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '15px'
                }}
              >
                <option value="">בחר תוכנית תשלום...</option>
                {paymentPlans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - {plan.description}
                  </option>
                ))}
              </select>
              
              {orderForm.payment_plan_id && (
                <div style={{
                  marginTop: '15px',
                  padding: '15px',
                  backgroundColor: '#f0f8ff',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>תשלום חודשי:</span>
                    <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
                      ₪{calculatePayment(orderForm.payment_plan_id).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={loading || cart.length === 0 || !orderForm.customer_id || !orderForm.payment_plan_id}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: loading || cart.length === 0 || !orderForm.customer_id || !orderForm.payment_plan_id ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading || cart.length === 0 || !orderForm.customer_id || !orderForm.payment_plan_id ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'יוצר הזמנה...' : 'צור הזמנה'}
            </button>
          </div>
        </div>
      </div>

      {/* Product Selection Modal */}
      {showProductModal && (
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
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px'
            }}>
              <h2 style={{ margin: 0 }}>בחר מוצר</h2>
              <button
                onClick={() => {
                  setShowProductModal(false);
                  setSelectedProduct(null);
                  setSelectedOptions([]);
                }}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {!selectedProduct ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '20px'
              }}>
                {products.map(product => (
                  <div
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    style={{
                      padding: '20px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#007bff';
                      e.currentTarget.style.transform = 'translateY(-5px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e0e0e0';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <h4 style={{ margin: '0 0 10px 0' }}>{product.name}</h4>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                      {product.description}
                    </p>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#28a745'
                    }}>
                      ₪{Number(product.base_price).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <button
                  onClick={() => {
                    setSelectedProduct(null);
                    setSelectedOptions([]);
                  }}
                  style={{
                    marginBottom: '20px',
                    padding: '8px 16px',
                    backgroundColor: '#f0f0f0',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  ← חזור לרשימת המוצרים
                </button>

                <h3>{selectedProduct.name}</h3>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                  {selectedProduct.description}
                </p>

                <div style={{
                  padding: '15px',
                  backgroundColor: '#f0f8ff',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>מחיר בסיס:</span>
                    <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
                      ₪{Number(selectedProduct.base_price).toLocaleString()}
                    </span>
                  </div>
                </div>

                <h4>תוספות אופציונליות:</h4>
                <div style={{ marginBottom: '20px' }}>
                  {(productOptions[selectedProduct.id] || []).map(option => (
                    <div
                      key={option.id}
                      onClick={() => {
                        if (selectedOptions.includes(option.id)) {
                          setSelectedOptions(selectedOptions.filter(id => id !== option.id));
                        } else {
                          setSelectedOptions([...selectedOptions, option.id]);
                        }
                      }}
                      style={{
                        padding: '12px',
                        marginBottom: '10px',
                        backgroundColor: selectedOptions.includes(option.id) ? '#e8f5e9' : '#f9f9f9',
                        border: `2px solid ${selectedOptions.includes(option.id) ? '#4CAF50' : '#e0e0e0'}`,
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
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
                          />
                          <span>{option.name}</span>
                          {option.required && (
                            <span style={{ color: 'red', fontSize: '12px' }}>*חובה</span>
                          )}
                        </div>
                        <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                          +₪{Number(option.price).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  padding: '20px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '14px', marginBottom: '5px' }}>סה"כ:</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                    ₪{(() => {
                      let total = Number(selectedProduct.base_price);
                      const options = productOptions[selectedProduct.id] || [];
                      options.forEach(opt => {
                        if (selectedOptions.includes(opt.id)) {
                          total += Number(opt.price);
                        }
                      });
                      return total.toLocaleString();
                    })()}
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  style={{
                    width: '100%',
                    padding: '15px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  הוסף לעגלה
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Customer Modal */}
      {showNewCustomer && (
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
            width: '500px'
          }}>
            <h2 style={{ marginTop: 0 }}>לקוח חדש</h2>
            
            <div style={{ display: 'grid', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>שם *</label>
                <input
                  type="text"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({...newCustomerForm, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>אימייל *</label>
                <input
                  type="email"
                  value={newCustomerForm.email}
                  onChange={(e) => setNewCustomerForm({...newCustomerForm, email: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>טלפון *</label>
                <input
                  type="tel"
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({...newCustomerForm, phone: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>חברה</label>
                <input
                  type="text"
                  value={newCustomerForm.company}
                  onChange={(e) => setNewCustomerForm({...newCustomerForm, company: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }}
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '10px',
              marginTop: '20px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowNewCustomer(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                ביטול
              </button>
              <button
                onClick={handleCreateCustomer}
                disabled={!newCustomerForm.name || !newCustomerForm.email || !newCustomerForm.phone}
                style={{
                  padding: '10px 20px',
                  backgroundColor: !newCustomerForm.name || !newCustomerForm.email || !newCustomerForm.phone ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: !newCustomerForm.name || !newCustomerForm.email || !newCustomerForm.phone ? 'not-allowed' : 'pointer'
                }}
              >
                צור לקוח
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
