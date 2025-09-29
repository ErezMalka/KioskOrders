'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ChevronRight, ChevronLeft, Check, ShoppingCart, User, CreditCard, FileText } from 'lucide-react';
import NewCustomerForm from '@/app/components/NewCustomerForm';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  legal_id?: string;
  contact_name?: string;
  address?: string;
  notes?: string;
  org_id: string;
}

interface Product {
  id: string;
  name: string;
  base_price: number;
  description?: string;
  category?: string;
  org_id: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  selectedOptions?: any[];
}

export default function CreateOrderPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userOrgId, setUserOrgId] = useState<string | null>(null);

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    legal_id: '',
    contact_name: '',
    address: '',
    notes: ''
  });

  const [paymentInfo, setPaymentInfo] = useState({
    paymentMethod: 'cash',
    paymentTerms: 'immediate',
    notes: ''
  });

  const steps = [
    { number: 1, title: 'בחירת לקוח', icon: User },
    { number: 2, title: 'בחירת מוצרים', icon: ShoppingCart },
    { number: 3, title: 'פרטי תשלום', icon: CreditCard },
    { number: 4, title: 'סיכום הזמנה', icon: FileText }
  ];

  useEffect(() => {
    checkAuth();
    loadCartFromStorage();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      await loadCustomers();
      await loadProducts();

    } catch (error) {
      console.error('Auth check error:', error);
      setError('שגיאה בבדיקת הרשאות');
    }
  };

  const loadCustomers = async () => {
    try {
      console.log('Loading all customers');

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading customers:', error);
        if (error.code !== 'PGRST116') {
          setError(`שגיאה בטעינת לקוחות: ${error.message}`);
        }
        return;
      }

      console.log('Customers loaded:', data);
      setCustomers(data || []);

      if (data && data.length > 0 && data[0].org_id) {
        setUserOrgId(data[0].org_id);
        console.log('Set org_id from first customer:', data[0].org_id);
      } else {
        console.warn('No customers found or no org_id');
      }

    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadProducts = async () => {
    try {
      console.log('Loading products');

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading products:', error);
        return;
      }

      console.log('Products loaded:', data);
      setProducts(data || []);

    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadCartFromStorage = () => {
    const cart = JSON.parse(sessionStorage.getItem('orderCart') || '[]');
    setCartItems(cart);
  };

  const saveCartToStorage = (cart: CartItem[]) => {
    sessionStorage.setItem('orderCart', JSON.stringify(cart));
  };

  const generateOrderNumber = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('order_number')
        .eq('org_id', userOrgId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching last order:', error);
        return `ORD-${new Date().getFullYear()}-00001`;
      }

      let nextNumber = 1;

      if (data && data.length > 0 && data[0].order_number) {
        const lastOrderNumber = data[0].order_number;
        const match = lastOrderNumber.match(/(\d+)$/);

        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      const year = new Date().getFullYear();
      const paddedNumber = String(nextNumber).padStart(5, '0');

      return `ORD-${year}-${paddedNumber}`;

    } catch (error) {
      console.error('Error generating order number:', error);
      return `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userOrgId) {
      setError('לא נמצא ארגון - נא להתחבר מחדש');
      return;
    }

    if (!newCustomer.name || !newCustomer.phone) {
      setError('שם וטלפון הם שדות חובה');
      return;
    }

    try {
      console.log('Creating customer with org_id:', userOrgId);

      const customerData = {
        name: newCustomer.name.trim(),
        email: newCustomer.email.trim() || null,
        phone: newCustomer.phone.trim(),
        legal_id: newCustomer.legal_id.trim() || null,
        contact_name: newCustomer.contact_name.trim() || null,
        address: newCustomer.address.trim() || null,
        notes: newCustomer.notes.trim() || null,
        org_id: userOrgId
      };

      console.log('Customer data:', customerData);

      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (error) {
        console.error('Error creating customer:', error);
        setError(`שגיאה ביצירת לקוח: ${error.message}`);
        return;
      }

      console.log('Customer created:', data);

      setCustomers([...customers, data]);
      setSelectedCustomer(data.id);
      setShowNewCustomer(false);
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        legal_id: '',
        contact_name: '',
        address: '',
        notes: ''
      });

      alert('הלקוח נוצר בהצלחה!');

    } catch (error) {
      console.error('Error:', error);
      setError('שגיאה ביצירת לקוח');
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cartItems.find(item => item.product.id === product.id);

    let newCart: CartItem[];
    if (existingItem) {
      newCart = cartItems.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      newCart = [...cartItems, { product, quantity: 1, discount: 0, selectedOptions: [] }];
    }

    setCartItems(newCart);
    saveCartToStorage(newCart);
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    const newCart = [...cartItems];
    newCart[index].quantity = newQuantity;
    setCartItems(newCart);
    saveCartToStorage(newCart);
  };

  const updateDiscount = (index: number, discount: number) => {
    const newCart = [...cartItems];
    newCart[index].discount = Math.max(0, Math.min(100, discount));
    setCartItems(newCart);
    saveCartToStorage(newCart);
  };

  const removeFromCart = (index: number) => {
    const newCart = cartItems.filter((_, i) => i !== index);
    setCartItems(newCart);
    saveCartToStorage(newCart);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const itemTotal = (item.product.base_price +
        (item.selectedOptions?.reduce((sum: number, opt: any) => sum + (opt?.price || 0), 0) || 0)) *
        item.quantity *
        (1 - (item.discount || 0) / 100);
      return total + itemTotal;
    }, 0);
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return selectedCustomer !== '';
      case 2:
        return cartItems.length > 0;
      case 3:
        return paymentInfo.paymentMethod !== '';
      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (canProceedToNextStep()) {
      setCurrentStep(currentStep + 1);
      setError(null);
    } else {
      if (currentStep === 1) setError('נא לבחור לקוח או ליצור לקוח חדש');
      if (currentStep === 2) setError('נא להוסיף לפחות מוצר אחד להזמנה');
      if (currentStep === 3) setError('נא לבחור אמצעי תשלום');
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
    setError(null);
  };

  const handleSubmitOrder = async () => {
    if (!selectedCustomer || cartItems.length === 0 || !userOrgId) {
      alert('חסרים פרטים בהזמנה');
      return;
    }

    setLoading(true);
    try {
      const orderNumber = await generateOrderNumber();
      console.log('Generated order number:', orderNumber);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: orderNumber,
          customer_id: selectedCustomer,
          org_id: userOrgId,
          total_amount: calculateTotal(),
          status: 'DRAFT',
          payment_method: paymentInfo.paymentMethod,
          payment_terms: paymentInfo.paymentTerms,
          notes: paymentInfo.notes || null
        }])
        .select()
        .single();

      if (orderError) {
        console.error('Order error:', orderError);
        alert(`שגיאה ביצירת הזמנה: ${orderError.message}`);
        return;
      }

      console.log('Order created successfully:', order);

      const orderLines = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.base_price,
        discount: item.discount,
        total_price: (item.product.base_price +
          (item.selectedOptions?.reduce((sum: number, opt: any) => sum + (opt?.price || 0), 0) || 0)) *
          item.quantity *
          (1 - (item.discount || 0) / 100)
      }));

      const { error: linesError } = await supabase
        .from('order_lines')
        .insert(orderLines);

      if (linesError) {
        console.error('Order lines error:', linesError);
        alert(`שגיאה בשמירת פרטי ההזמנה: ${linesError.message}`);
        return;
      }

      sessionStorage.removeItem('orderCart');
      alert(`ההזמנה נוצרה בהצלחה!\nמספר הזמנה: ${orderNumber}`);
      router.push('/dashboard');

    } catch (error) {
      console.error('Unexpected error:', error);
      alert('שגיאה ביצירת ההזמנה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif', direction: 'rtl' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '40px', color: '#333' }}>יצירת הזמנה חדשה</h1>

      {/* Progress Bar (reworked: circle — connector — circle) */}
      <div style={{ marginBottom: '40px' }}>
        <div
          style={{
            direction: 'rtl',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '0 30px',
          }}
        >
          {steps.map((step, i) => {
            const StepIcon = step.icon;
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;

            return (
              <div
                key={step.number}
                style={{ display: 'contents' }} // מאפשר לשלב "עיגול" ואז "מחבר" בלי עטיפה מיותרת
              >
                {/* Circle */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: isCompleted ? '#4CAF50' : isCurrent ? '#2196F3' : 'white',
                      color: isCompleted || isCurrent ? 'white' : '#999',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '10px',
                      transition: 'all 0.3s',
                      border: isCompleted || isCurrent ? 'none' : '3px solid #e0e0e0',
                      boxShadow: isCurrent ? '0 0 0 4px rgba(33,150,243,0.2)' : 'none',
                    }}
                  >
                    {isCompleted ? <Check size={30} /> : <StepIcon size={30} />}
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: isCurrent ? 'bold' : 'normal',
                      color: isCurrent ? '#2196F3' : isCompleted ? '#4CAF50' : '#666',
                      textAlign: 'center',
                      maxWidth: '110px',
                    }}
                  >
                    {step.title}
                  </div>
                </div>

                {/* Connector (only between circles) */}
                {i < steps.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: '3px',
                      borderRadius: '2px',
                      backgroundColor:
                        // אם עברנו את העיגול הנוכחי -> הצבע ירוק, אחרת אפור
                        currentStep - 1 > i ? '#4CAF50' : '#e0e0e0',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div style={{ backgroundColor: '#f9f9f9', padding: '30px', borderRadius: '12px', minHeight: '400px', marginBottom: '30px' }}>

        {/* Step 1: Customer Selection */}
        {currentStep === 1 && (
          <div>
            <h2 style={{ marginBottom: '25px', color: '#333' }}>בחירת לקוח</h2>

            {!showNewCustomer && (
              <div>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>בחר לקוח קיים:</label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    borderRadius: '8px',
                    border: '2px solid #ddd',
                    marginBottom: '20px'
                  }}
                >
                  <option value="">-- בחר לקוח --</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                </select>

                {selectedCustomer && (
                  <div style={{
                    padding: '15px',
                    backgroundColor: '#e3f2fd',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: '1px solid #2196F3'
                  }}>
                    <h3 style={{ marginBottom: '10px' }}>פרטי הלקוח הנבחר:</h3>
                    {(() => {
                      const customer = customers.find(c => c.id === selectedCustomer);
                      return customer ? (
                        <div>
                          <p><strong>שם:</strong> {customer.name}</p>
                          <p><strong>טלפון:</strong> {customer.phone}</p>
                          {customer.email && <p><strong>אימייל:</strong> {customer.email}</p>}
                          {customer.address && <p><strong>כתובת:</strong> {customer.address}</p>}
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}

                <button
                  onClick={() => setShowNewCustomer(true)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  + יצירת לקוח חדש
                </button>
              </div>
            )}

            {showNewCustomer && (
              <NewCustomerForm
                onSubmit={async (customerData) => {
                  if (!userOrgId) {
                    setError('לא נמצא ארגון - נא להתחבר מחדש');
                    return;
                  }

                  try {
                    const { data, error } = await supabase
                      .from('customers')
                      .insert([{
                        ...customerData,
                        org_id: userOrgId
                      }])
                      .select()
                      .single();

                    if (error) {
                      console.error('Error creating customer:', error);
                      setError(`שגיאה ביצירת לקוח: ${error.message}`);
                      return;
                    }

                    setCustomers([...customers, data]);
                    setSelectedCustomer(data.id);
                    setShowNewCustomer(false);
                    alert('הלקוח נוצר בהצלחה!');
                  } catch (error) {
                    console.error('Error:', error);
                    setError('שגיאה ביצירת לקוח');
                  }
                }}
                onCancel={() => setShowNewCustomer(false)}
              />
            )}
          </div>
        )}

        {/* Step 2: Product Selection */}
        {currentStep === 2 && (
          <div>
            <h2 style={{ marginBottom: '25px', color: '#333' }}>בחירת מוצרים</h2>

            {products.length === 0 ? (
              <p>אין מוצרים זמינים. נא להוסיף מוצרים למערכת.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                {products.map(product => (
                  <div key={product.id} style={{
                    padding: '20px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '2px solid #e0e0e0',
                    transition: 'all 0.3s',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <h3 style={{ marginBottom: '10px' }}>{product.name}</h3>
                    {product.description && (
                      <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px', flex: '1' }}>{product.description}</p>
                    )}
                    <p style={{ fontWeight: 'bold', fontSize: '20px', color: '#4CAF50', marginBottom: '15px' }}>
                      ₪{product.base_price.toFixed(2)}
                    </p>
                    <button
                      onClick={() => addToCart(product)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        marginTop: 'auto'
                      }}
                    >
                      הוסף לעגלה
                    </button>
                  </div>
                ))}
              </div>
            )}

            {cartItems.length > 0 && (
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '2px solid #4CAF50' }}>
                <h3 style={{ marginBottom: '20px' }}>עגלת קניות ({cartItems.length} פריטים)</h3>
                {cartItems.map((item, index) => (
                  <div key={index} style={{
                    padding: '15px',
                    marginBottom: '10px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ flex: 1 }}>
                      <strong>{item.product.name}</strong>
                      <div style={{ display: 'flex', gap: '15px', marginTop: '10px', alignItems: 'center' }}>
                        <div>
                          <label style={{ fontSize: '14px', marginLeft: '5px' }}>כמות:</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                            style={{ width: '60px', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                            min="1"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '14px', marginLeft: '5px' }}>הנחה (%):</label>
                          <input
                            type="number"
                            value={item.discount}
                            onChange={(e) => updateDiscount(index, parseInt(e.target.value) || 0)}
                            style={{ width: '60px', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                            min="0"
                            max="100"
                          />
                        </div>
                        <div style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                          ₪{((item.product.base_price +
                            (item.selectedOptions?.reduce((sum: number, opt: any) => sum + (opt?.price || 0), 0) || 0)) *
                            item.quantity *
                            (1 - (item.discount || 0) / 100)).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(index)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      הסר
                    </button>
                  </div>
                ))}
                <div style={{ marginTop: '20px', fontSize: '24px', fontWeight: 'bold', textAlign: 'left', color: '#4CAF50' }}>
                  סה"כ: ₪{calculateTotal().toFixed(2)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Payment Information */}
        {currentStep === 3 && (
          <div>
            <h2 style={{ marginBottom: '25px', color: '#333' }}>פרטי תשלום</h2>

            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px' }}>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>אמצעי תשלום:</label>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  {[
                    { value: 'cash', label: 'מזומן' },
                    { value: 'credit', label: 'כרטיס אשראי' },
                    { value: 'bank_transfer', label: 'העברה בנקאית' },
                    { value: 'check', label: 'שיק' }
                  ].map(method => (
                    <label key={method.value} style={{
                      padding: '15px 25px',
                      border: `2px solid ${paymentInfo.paymentMethod === method.value ? '#4CAF50' : '#ddd'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: paymentInfo.paymentMethod === method.value ? '#e8f5e9' : 'white',
                      fontWeight: paymentInfo.paymentMethod === method.value ? 'bold' : 'normal'
                    }}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={paymentInfo.paymentMethod === method.value}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, paymentMethod: e.target.value })}
                        style={{ marginLeft: '8px' }}
                      />
                      {method.label}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>תנאי תשלום:</label>
                <select
                  value={paymentInfo.paymentTerms}
                  onChange={(e) => setPaymentInfo({ ...paymentInfo, paymentTerms: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    borderRadius: '8px',
                    border: '2px solid #ddd'
                  }}
                >
                  <option value="immediate">תשלום מיידי</option>
                  <option value="7days">7 ימים</option>
                  <option value="30days">30 יום</option>
                  <option value="60days">60 יום</option>
                  <option value="90days">90 יום</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>הערות תשלום:</label>
                <textarea
                  value={paymentInfo.notes}
                  onChange={(e) => setPaymentInfo({ ...paymentInfo, notes: e.target.value })}
                  placeholder="הערות נוספות על התשלום..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    borderRadius: '8px',
                    border: '2px solid #ddd',
                    minHeight: '100px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Order Summary */}
        {currentStep === 4 && (
          <div>
            <h2 style={{ marginBottom: '25px', color: '#333' }}>סיכום הזמנה</h2>

            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '15px', color: '#2196F3' }}>פרטי לקוח</h3>
              {(() => {
                const customer = customers.find(c => c.id === selectedCustomer);
                return customer ? (
                  <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                    <p><strong>שם:</strong> {customer.name}</p>
                    <p><strong>טלפון:</strong> {customer.phone}</p>
                    {customer.email && <p><strong>אימייל:</strong> {customer.email}</p>}
                    {customer.address && <p><strong>כתובת:</strong> {customer.address}</p>}
                  </div>
                ) : null;
              })()}
            </div>

            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '15px', color: '#2196F3' }}>פריטים בהזמנה</h3>
              {cartItems.map((item, index) => (
                <div key={index} style={{
                  padding: '15px',
                  marginBottom: '10px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <strong>{item.product.name}</strong>
                    <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                      כמות: {item.quantity} | מחיר יחידה: ₪{item.product.base_price.toFixed(2)}
                      {item.discount > 0 && ` | הנחה: ${item.discount}%`}
                    </div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                    ₪{((item.product.base_price +
                      (item.selectedOptions?.reduce((sum: number, opt: any) => sum + (opt?.price || 0), 0) || 0)) *
                      item.quantity *
                      (1 - (item.discount || 0) / 100)).toFixed(2)}
                  </div>
                </div>
              ))}
              <div style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#e8f5e9',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '20px', fontWeight: 'bold' }}>סה"כ לתשלום:</span>
                <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#4CAF50' }}>
                  ₪{calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>

            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '15px', color: '#2196F3' }}>פרטי תשלום</h3>
              <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <p><strong>אמצעי תשלום:</strong> {
                  paymentInfo.paymentMethod === 'cash' ? 'מזומן' :
                    paymentInfo.paymentMethod === 'credit' ? 'כרטיס אשראי' :
                      paymentInfo.paymentMethod === 'bank_transfer' ? 'העברה בנקאית' : 'שיק'
                }</p>
                <p><strong>תנאי תשלום:</strong> {
                  paymentInfo.paymentTerms === 'immediate' ? 'תשלום מיידי' :
                    paymentInfo.paymentTerms === '7days' ? '7 ימים' :
                      paymentInfo.paymentTerms === '30days' ? '30 יום' :
                        paymentInfo.paymentTerms === '60days' ? '60 יום' : '90 יום'
                }</p>
                {paymentInfo.notes && <p><strong>הערות:</strong> {paymentInfo.notes}</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {currentStep > 1 && (
            <button
              onClick={handlePrevStep}
              disabled={loading}
              style={{
                padding: '15px 30px',
                backgroundColor: '#757575',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <ChevronRight size={20} />
              חזור
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          {currentStep < 4 ? (
            <button
              onClick={handleNextStep}
              style={{
                padding: '15px 40px',
                backgroundColor: canProceedToNextStep() ? '#4CAF50' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: canProceedToNextStep() ? 'pointer' : 'not-allowed',
                fontSize: '18px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              המשך
              <ChevronLeft size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmitOrder}
              disabled={loading}
              style={{
                padding: '15px 40px',
                backgroundColor: loading ? '#ccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '18px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Check size={20} />
              {loading ? 'שומר...' : 'אשר הזמנה'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}