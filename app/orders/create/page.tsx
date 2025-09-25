'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

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
  max_discount: number;
}

interface PaymentPlan {
  id: string;
  name: string;
  months: number;
  interest_rate: number;
  down_payment_percentage: number;
}

export default function CreateOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState('');
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userOrgId, setUserOrgId] = useState<string | null>(null);
  
  // Form for new customer
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    legal_id: '',
    contact_name: '',
    address: '',
    notes: ''
  });

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

      // Get user's org_id (not organization_id!)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        setError('לא נמצא פרופיל משתמש');
        return;
      }

      if (!profile?.org_id) {
        console.error('No org_id found');
        setError('לא נמצא ארגון למשתמש');
        return;
      }

      console.log('User org_id:', profile.org_id);
      setUserOrgId(profile.org_id);
      
      // Load data after we have org_id
      await loadCustomers(profile.org_id);
      await loadPaymentPlans();
      
    } catch (error) {
      console.error('Auth check error:', error);
      setError('שגיאה בבדיקת הרשאות');
    }
  };

  const loadCustomers = async (orgId: string) => {
    try {
      console.log('Loading customers for org:', orgId);
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('org_id', orgId)
        .order('name');

      if (error) {
        console.error('Error loading customers:', error);
        // Don't show error if table is empty
        if (error.code !== 'PGRST116') {
          setError(`שגיאה בטעינת לקוחות: ${error.message}`);
        }
        return;
      }

      console.log('Customers loaded:', data);
      setCustomers(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadPaymentPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_plans')
        .select('*')
        .order('months');

      if (error) {
        console.error('Error loading payment plans:', error);
        return;
      }

      setPaymentPlans(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadCartFromStorage = () => {
    const cart = JSON.parse(sessionStorage.getItem('orderCart') || '[]');
    setCartItems(cart);
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
      
      // Add to customers list and select
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
      
      // Show success message
      alert('הלקוח נוצר בהצלחה!');
      
    } catch (error) {
      console.error('Error:', error);
      setError('שגיאה ביצירת לקוח');
    }
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

  const handleSubmitOrder = async () => {
    if (!selectedCustomer) {
      alert('נא לבחור לקוח');
      return;
    }

    if (cartItems.length === 0) {
      alert('העגלה ריקה');
      return;
    }

    if (!userOrgId) {
      alert('לא נמצא ארגון');
      return;
    }

    setLoading(true);
    try {
      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_id: selectedCustomer,
          org_id: userOrgId,  // Changed from organization_id to org_id
          total_amount: calculateTotal(),
          status: 'pending',
          payment_plan_id: selectedPaymentPlan || null
        }])
        .select()
        .single();

      if (orderError) {
        console.error('Order error:', orderError);
        alert(`שגיאה ביצירת הזמנה: ${orderError.message}`);
        return;
      }

      // Create order lines
      const orderLines = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.base_price,
        discount_percentage: item.discount || 0,
        total_price: (item.product.base_price + 
          (item.selectedOptions?.reduce((sum: number, opt: any) => sum + (opt?.price || 0), 0) || 0)) * 
          item.quantity * 
          (1 - (item.discount || 0) / 100),
        selected_options: item.selectedOptions || []
      }));

      const { error: linesError } = await supabase
        .from('order_lines')
        .insert(orderLines);

      if (linesError) {
        console.error('Order lines error:', linesError);
        alert('שגיאה בשמירת פרטי ההזמנה');
        return;
      }

      // Clear cart and redirect
      sessionStorage.removeItem('orderCart');
      alert('ההזמנה נוצרה בהצלחה!');
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Error:', error);
      alert('שגיאה ביצירת ההזמנה');
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = (index: number) => {
    const newCart = cartItems.filter((_, i) => i !== index);
    setCartItems(newCart);
    sessionStorage.setItem('orderCart', JSON.stringify(newCart));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', direction: 'rtl' }}>
      <h1>יצירת הזמנה חדשה</h1>

      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #ef5350'
        }}>
          {error}
        </div>
      )}

      {/* Customer Selection */}
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '10px' }}>
        <h2>פרטי לקוח</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>בחר לקוח קיים:</label>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '5px' }}
            disabled={showNewCustomer}
          >
            <option value="">-- בחר לקוח --</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name} - {customer.phone}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowNewCustomer(!showNewCustomer)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {showNewCustomer ? 'ביטול' : '+ לקוח חדש'}
        </button>

        {showNewCustomer && (
          <form onSubmit={handleCreateCustomer} style={{ marginTop: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <input
                type="text"
                placeholder="שם הלקוח *"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                required
                style={{ padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ddd' }}
              />
              <input
                type="tel"
                placeholder="טלפון *"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                required
                style={{ padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ddd' }}
              />
              <input
                type="email"
                placeholder="אימייל"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                style={{ padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ddd' }}
              />
              <input
                type="text"
                placeholder="ח.פ / ת.ז"
                value={newCustomer.legal_id}
                onChange={(e) => setNewCustomer({...newCustomer, legal_id: e.target.value})}
                style={{ padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ddd' }}
              />
              <input
                type="text"
                placeholder="שם איש קשר"
                value={newCustomer.contact_name}
                onChange={(e) => setNewCustomer({...newCustomer, contact_name: e.target.value})}
                style={{ padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ddd' }}
              />
              <input
                type="text"
                placeholder="כתובת"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                style={{ padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ddd' }}
              />
              <textarea
                placeholder="הערות"
                value={newCustomer.notes}
                onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})}
                style={{ 
                  gridColumn: 'span 2',
                  padding: '10px', 
                  fontSize: '16px', 
                  borderRadius: '5px', 
                  border: '1px solid #ddd',
                  minHeight: '80px'
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                marginTop: '15px',
                padding: '10px 30px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              צור לקוח
            </button>
          </form>
        )}
      </div>

      {/* Cart Items */}
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '10px' }}>
        <h2>פריטים בעגלה</h2>
        
        {cartItems.length === 0 ? (
          <p>העגלה ריקה. <a href="/products" style={{ color: '#2196F3' }}>לחץ כאן להוספת מוצרים</a></p>
        ) : (
          <div>
            {cartItems.map((item, index) => (
              <div key={index} style={{ 
                padding: '15px', 
                marginBottom: '10px', 
                backgroundColor: 'white', 
                borderRadius: '5px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <strong>{item.product.name}</strong>
                  <div>כמות: {item.quantity}</div>
                  {item.discount > 0 && <div>הנחה: {item.discount}%</div>}
                  <div>מחיר: ₪{((item.product.base_price + 
                    (item.selectedOptions?.reduce((sum: number, opt: any) => sum + (opt?.price || 0), 0) || 0)) * 
                    item.quantity * 
                    (1 - (item.discount || 0) / 100)).toFixed(2)}</div>
                </div>
                <button
                  onClick={() => removeFromCart(index)}
                  style={{
                    padding: '5px 15px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  הסר
                </button>
              </div>
            ))}
            
            <div style={{ marginTop: '20px', fontSize: '20px', fontWeight: 'bold' }}>
              סה"כ: ₪{calculateTotal().toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {/* Payment Plan */}
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '10px' }}>
        <h2>תוכנית תשלום</h2>
        <select
          value={selectedPaymentPlan}
          onChange={(e) => setSelectedPaymentPlan(e.target.value)}
          style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '5px' }}
        >
          <option value="">תשלום מלא</option>
          {paymentPlans.map(plan => (
            <option key={plan.id} value={plan.id}>
              {plan.name} - {plan.months} תשלומים, ריבית {plan.interest_rate}%
            </option>
          ))}
        </select>
      </div>

      {/* Submit Button */}
      <div style={{ display: 'flex', gap: '20px' }}>
        <button
          onClick={handleSubmitOrder}
          disabled={loading || !selectedCustomer || cartItems.length === 0}
          style={{
            padding: '15px 40px',
            backgroundColor: loading || !selectedCustomer || cartItems.length === 0 ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading || !selectedCustomer || cartItems.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: '18px',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'שומר...' : 'צור הזמנה'}
        </button>
        
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            padding: '15px 40px',
            backgroundColor: '#757575',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '18px'
          }}
        >
          ביטול
        </button>
      </div>
    </div>
  );
}
