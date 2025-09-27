'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, UserPlus, User, Save, X, Plus, Trash2, FileText, Calendar, Phone, Mail, MapPin, Building2, CreditCard, Package } from 'lucide-react';

export default function NewOrderPage() {
  const router = useRouter();
  
  // States for customer management
  const [customerType, setCustomerType] = useState(''); // 'new' or 'existing'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('name');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  
  // Customer form data
  const [customerData, setCustomerData] = useState({
    businessName: '',
    contactName: '',
    managerId: '',
    email: '',
    phone: '',
    mobile: '',
    address: '',
    city: '',
    taxId: '',
    notes: '',
    existingProducts: ''
  });

  // Order data
  const [orderItems, setOrderItems] = useState([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');

  // Mock customers data - בהמשך זה יגיע מהדאטאבייס
  const [customers, setCustomers] = useState([
    {
      id: 1,
      businessName: 'חברת טכנולוגיות מתקדמות בע"מ',
      contactName: 'יוסי כהן',
      email: 'yossi@tech.co.il',
      phone: '03-1234567',
      mobile: '050-1234567',
      city: 'תל אביב',
      managerId: 'אברהם לוי'
    },
    {
      id: 2,
      businessName: 'מפעלי פלסטיק ישראל',
      contactName: 'שרה גולד',
      email: 'sara@plastic.co.il',
      phone: '04-9876543',
      mobile: '052-9876543',
      city: 'חיפה',
      managerId: 'משה רבינוביץ'
    },
    {
      id: 3,
      businessName: 'סופר פארם סניף מרכז',
      contactName: 'דוד מזרחי',
      email: 'david@superpharm.co.il',
      phone: '02-5555555',
      mobile: '054-5555555',
      city: 'ירושלים',
      managerId: 'רחל אברהם'
    }
  ]);

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    switch(searchField) {
      case 'name':
        return customer.businessName.toLowerCase().includes(searchLower) ||
               customer.contactName.toLowerCase().includes(searchLower);
      case 'phone':
        return customer.phone.includes(searchQuery) || customer.mobile.includes(searchQuery);
      case 'email':
        return customer.email.toLowerCase().includes(searchLower);
      case 'city':
        return customer.city.toLowerCase().includes(searchLower);
      case 'manager':
        return customer.managerId.toLowerCase().includes(searchLower);
      default:
        return true;
    }
  });

  // Handle customer selection
  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerData({
      businessName: customer.businessName,
      contactName: customer.contactName,
      managerId: customer.managerId || '',
      email: customer.email,
      phone: customer.phone,
      mobile: customer.mobile,
      address: customer.address || '',
      city: customer.city,
      taxId: customer.taxId || '',
      notes: customer.notes || '',
      existingProducts: customer.existingProducts || ''
    });
  };

  // Add new order item
  const addOrderItem = () => {
    setOrderItems([
      ...orderItems,
      {
        id: Date.now(),
        productName: '',
        description: '',
        quantity: 1,
        price: 0,
        discount: 0,
        total: 0
      }
    ]);
  };

  // Update order item
  const updateOrderItem = (id, field, value) => {
    setOrderItems(orderItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        
        // Calculate total
        if (field === 'quantity' || field === 'price' || field === 'discount') {
          const quantity = field === 'quantity' ? value : updated.quantity;
          const price = field === 'price' ? value : updated.price;
          const discount = field === 'discount' ? value : updated.discount;
          updated.total = (quantity * price) * (1 - discount / 100);
        }
        
        return updated;
      }
      return item;
    }));
  };

  // Remove order item
  const removeOrderItem = (id) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  // Calculate total
  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  // Save order
  const saveOrder = async () => {
    if (!customerType) {
      alert('נא לבחור סוג לקוח');
      return;
    }

    if (customerType === 'existing' && !selectedCustomer) {
      alert('נא לבחור לקוח קיים');
      return;
    }

    if (customerType === 'new' && !customerData.businessName) {
      alert('נא למלא שם עסק');
      return;
    }

    if (orderItems.length === 0) {
      alert('נא להוסיף פריטים להזמנה');
      return;
    }

    // כאן תוסיף את הקוד לשמירה בדאטאבייס
    try {
      const orderData = {
        customer: customerData,
        items: orderItems,
        notes: orderNotes,
        deliveryDate,
        paymentTerms,
        total: calculateTotal(),
        createdAt: new Date().toISOString()
      };

      console.log('Saving order:', orderData);
      
      // TODO: Add Supabase integration here
      // const { data, error } = await supabase.from('orders').insert(orderData);
      
      alert('ההזמנה נשמרה בהצלחה!');
      router.push('/orders'); // או לעמוד אחר שתרצה
      
    } catch (error) {
      console.error('Error saving order:', error);
      alert('שגיאה בשמירת ההזמנה');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', direction: 'rtl', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px', borderBottom: '2px solid #2196F3', paddingBottom: '15px' }}>
        <h1 style={{ margin: 0, color: '#1976D2', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={32} />
          יצירת הזמנה חדשה
        </h1>
      </div>

      {/* Step 1: Customer Type Selection */}
      {!customerType && (
        <div style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '30px', 
          borderRadius: '10px',
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <h2 style={{ marginBottom: '20px', color: '#333' }}>בחר סוג לקוח</h2>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <button
              onClick={() => setCustomerType('existing')}
              style={{
                padding: '20px 40px',
                fontSize: '18px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <User size={24} />
              לקוח קיים
            </button>

            <button
              onClick={() => {
                setCustomerType('new');
                setShowNewCustomerForm(true);
              }}
              style={{
                padding: '20px 40px',
                fontSize: '18px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <UserPlus size={24} />
              לקוח חדש
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Customer Selection/Creation */}
      {customerType === 'existing' && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>חיפוש לקוח קיים</h2>
            <button
              onClick={() => setCustomerType('')}
              style={{
                padding: '5px 15px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              שנה בחירה
            </button>
          </div>

          {/* Search Controls */}
          <div style={{
            backgroundColor: '#f9f9f9',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                style={{
                  padding: '10px',
                  borderRadius: '5px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              >
                <option value="name">שם עסק / איש קשר</option>
                <option value="phone">טלפון</option>
                <option value="email">אימייל</option>
                <option value="city">עיר</option>
                <option value="manager">מנהל חשבון</option>
              </select>

              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="הקלד לחיפוש..."
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 10px',
                    borderRadius: '5px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
                <Search 
                  size={20} 
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#999'
                  }}
                />
              </div>
            </div>

            {/* Results */}
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              border: '1px solid #ddd',
              borderRadius: '5px',
              backgroundColor: 'white'
            }}>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map(customer => (
                  <div
                    key={customer.id}
                    onClick={() => handleSelectCustomer(customer)}
                    style={{
                      padding: '15px',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      backgroundColor: selectedCustomer?.id === customer.id ? '#e3f2fd' : 'white',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => {
                      if (selectedCustomer?.id !== customer.id) {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (selectedCustomer?.id !== customer.id) {
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      {customer.businessName}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      איש קשר: {customer.contactName} | 
                      טלפון: {customer.phone} | 
                      עיר: {customer.city}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  לא נמצאו תוצאות
                </div>
              )}
            </div>
          </div>

          {/* Selected Customer Details */}
          {selectedCustomer && (
            <div style={{
              backgroundColor: '#e8f5e9',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginTop: 0, color: '#2e7d32' }}>לקוח נבחר:</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                <div><strong>שם העסק:</strong> {selectedCustomer.businessName}</div>
                <div><strong>איש קשר:</strong> {selectedCustomer.contactName}</div>
                <div><strong>טלפון:</strong> {selectedCustomer.phone}</div>
                <div><strong>נייד:</strong> {selectedCustomer.mobile}</div>
                <div><strong>אימייל:</strong> {selectedCustomer.email}</div>
                <div><strong>עיר:</strong> {selectedCustomer.city}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Customer Form */}
      {customerType === 'new' && showNewCustomerForm && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>פרטי לקוח חדש</h2>
            <button
              onClick={() => {
                setCustomerType('');
                setShowNewCustomerForm(false);
                setCustomerData({
                  businessName: '',
                  contactName: '',
                  managerId: '',
                  email: '',
                  phone: '',
                  mobile: '',
                  address: '',
                  city: '',
                  taxId: '',
                  notes: '',
                  existingProducts: ''
                });
              }}
              style={{
                padding: '5px 15px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              שנה בחירה
            </button>
          </div>

          <div style={{
            backgroundColor: '#f9f9f9',
            padding: '25px',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  <Building2 size={16} style={{ marginLeft: '5px', verticalAlign: 'middle' }} />
                  שם העסק *
                </label>
                <input
                  type="text"
                  value={customerData.businessName}
                  onChange={(e) => setCustomerData({...customerData, businessName: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  <User size={16} style={{ marginLeft: '5px', verticalAlign: 'middle' }} />
                  שם איש קשר
                </label>
                <input
                  type="text"
                  value={customerData.contactName}
                  onChange={(e) => setCustomerData({...customerData, contactName: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  מנהל חשבון
                </label>
                <input
                  type="text"
                  value={customerData.managerId}
                  onChange={(e) => setCustomerData({...customerData, managerId: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  <Mail size={16} style={{ marginLeft: '5px', verticalAlign: 'middle' }} />
                  אימייל
                </label>
                <input
                  type="email"
                  value={customerData.email}
                  onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  <Phone size={16} style={{ marginLeft: '5px', verticalAlign: 'middle' }} />
                  טלפון
                </label>
                <input
                  type="tel"
                  value={customerData.phone}
                  onChange={(e) => setCustomerData({...customerData, phone: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  <Phone size={16} style={{ marginLeft: '5px', verticalAlign: 'middle' }} />
                  נייד
                </label>
                <input
                  type="tel"
                  value={customerData.mobile}
                  onChange={(e) => setCustomerData({...customerData, mobile: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  <MapPin size={16} style={{ marginLeft: '5px', verticalAlign: 'middle' }} />
                  כתובת
                </label>
                <input
                  type="text"
                  value={customerData.address}
                  onChange={(e) => setCustomerData({...customerData, address: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  עיר
                </label>
                <input
                  type="text"
                  value={customerData.city}
                  onChange={(e) => setCustomerData({...customerData, city: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  ח.פ / עוסק מורשה
                </label>
                <input
                  type="text"
                  value={customerData.taxId}
                  onChange={(e) => setCustomerData({...customerData, taxId: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  <Package size={16} style={{ marginLeft: '5px', verticalAlign: 'middle' }} />
                  מוצרים קיימים
                </label>
                <textarea
                  value={customerData.existingProducts}
                  onChange={(e) => setCustomerData({...customerData, existingProducts: e.target.value})}
                  placeholder="פרט מוצרים קיימים של הלקוח..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #ddd',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  הערות
                </label>
                <textarea
                  value={customerData.notes}
                  onChange={(e) => setCustomerData({...customerData, notes: e.target.value})}
                  placeholder="הערות נוספות..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #ddd',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Items Section */}
      {(customerType === 'new' || (customerType === 'existing' && selectedCustomer)) && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>פריטי הזמנה</h2>
            <button
              onClick={addOrderItem}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Plus size={20} />
              הוסף פריט
            </button>
          </div>

          {orderItems.length > 0 ? (
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid #ddd'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>מוצר</th>
                    <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>תיאור</th>
                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>כמות</th>
                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>מחיר</th>
                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>הנחה %</th>
                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>סה"כ</th>
                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #ddd' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item, index) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>
                        <input
                          type="text"
                          value={item.productName}
                          onChange={(e) => updateOrderItem(item.id, 'productName', e.target.value)}
                          placeholder="שם המוצר"
                          style={{
                            width: '100%',
                            padding: '5px',
                            border: '1px solid #ddd',
                            borderRadius: '3px'
                          }}
                        />
                      </td>
                      <td style={{ padding: '10px' }}>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateOrderItem(item.id, 'description', e.target.value)}
                          placeholder="תיאור"
                          style={{
                            width: '100%',
                            padding: '5px',
                            border: '1px solid #ddd',
                            borderRadius: '3px'
                          }}
                        />
                      </td>
                      <td style={{ padding: '10px', width: '100px' }}>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateOrderItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          min="0"
                          style={{
                            width: '100%',
                            padding: '5px',
                            border: '1px solid #ddd',
                            borderRadius: '3px',
                            textAlign: 'center'
                          }}
                        />
                      </td>
                      <td style={{ padding: '10px', width: '120px' }}>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateOrderItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          style={{
                            width: '100%',
                            padding: '5px',
                            border: '1px solid #ddd',
                            borderRadius: '3px',
                            textAlign: 'center'
                          }}
                        />
                      </td>
                      <td style={{ padding: '10px', width: '100px' }}>
                        <input
                          type="number"
                          value={item.discount}
                          onChange={(e) => updateOrderItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                          min="0"
                          max="100"
                          style={{
                            width: '100%',
                            padding: '5px',
                            border: '1px solid #ddd',
                            borderRadius: '3px',
                            textAlign: 'center'
                          }}
                        />
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                        ₪{item.total.toFixed(2)}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button
                          onClick={() => removeOrderItem(item.id)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <td colSpan={5} style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold', fontSize: '18px' }}>
                      סה"כ להזמנה:
                    </td>
                    <td colSpan={2} style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '18px', color: '#2196F3' }}>
                      ₪{calculateTotal().toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#f9f9f9',
              padding: '40px',
              textAlign: 'center',
              borderRadius: '8px',
              border: '1px dashed #ddd'
            }}>
              <p style={{ color: '#999', margin: 0 }}>אין פריטים בהזמנה. לחץ על "הוסף פריט" להתחיל.</p>
            </div>
          )}
        </div>
      )}

      {/* Additional Order Details */}
      {(customerType === 'new' || (customerType === 'existing' && selectedCustomer)) && orderItems.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ marginBottom: '20px' }}>פרטים נוספים</h2>
          
          <div style={{
            backgroundColor: '#f9f9f9',
            padding: '20px',
            borderRadius: '8px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                <Calendar size={16} style={{ marginLeft: '5px', verticalAlign: 'middle' }} />
                תאריך אספקה
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '5px',
                  border: '1px solid #ddd'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                <CreditCard size={16} style={{ marginLeft: '5px', verticalAlign: 'middle' }} />
                תנאי תשלום
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '5px',
                  border: '1px solid #ddd'
                }}
              >
                <option value="">בחר תנאי תשלום</option>
                <option value="cash">מזומן</option>
                <option value="credit">אשראי</option>
                <option value="net30">שוטף + 30</option>
                <option value="net60">שוטף + 60</option>
                <option value="net90">שוטף + 90</option>
              </select>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                הערות להזמנה
              </label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="הערות נוספות להזמנה..."
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '5px',
                  border: '1px solid #ddd',
                  minHeight: '100px',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {(customerType === 'new' || (customerType === 'existing' && selectedCustomer)) && orderItems.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          padding: '20px',
          borderTop: '2px solid #eee'
        }}>
          <button
            onClick={saveOrder}
            style={{
              padding: '15px 40px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <Save size={20} />
            שמור הזמנה
          </button>

          <button
            onClick={() => {
              if (window.confirm('האם אתה בטוח שברצונך לבטל את ההזמנה?')) {
                setCustomerType('');
                setSelectedCustomer(null);
                setOrderItems([]);
                setOrderNotes('');
                setDeliveryDate('');
                setPaymentTerms('');
                setCustomerData({
                  businessName: '',
                  contactName: '',
                  managerId: '',
                  email: '',
                  phone: '',
                  mobile: '',
                  address: '',
                  city: '',
                  taxId: '',
                  notes: '',
                  existingProducts: ''
                });
              }
            }}
            style={{
              padding: '15px 40px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <X size={20} />
            בטל הזמנה
          </button>
        </div>
      )}
    </div>
  );
}
