'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// Create a singleton instance of Supabase client
let supabaseInstance: any = null;

function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseInstance;
}

const supabase = getSupabase();

// Types
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  created_at: string;
  updated_at?: string;
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: ''
  });

  useEffect(() => {
    checkAuth();
    loadCustomers();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
    }
  };

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading customers:', error);
        setError(`שגיאה בטעינת לקוחות: ${error.message}`);
        return;
      }
      
      setCustomers(data || []);
    } catch (error: any) {
      console.error('Error loading customers:', error);
      setError(`שגיאה בטעינת לקוחות: ${error?.message || 'שגיאה לא ידועה'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async () => {
    setError(null);
    
    // Validation
    if (!formData.name || !formData.email || !formData.phone) {
      setError('יש למלא את כל השדות החובה (שם, אימייל, טלפון)');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address || null,
          city: formData.city || null
        }])
        .select();

      if (error) {
        console.error('Error adding customer:', error);
        setError(`שגיאה בהוספת לקוח: ${error.message}`);
        return;
      }

      console.log('Customer added successfully:', data);
      setShowAddModal(false);
      resetForm();
      await loadCustomers();
      alert('הלקוח נוסף בהצלחה!');
    } catch (error: any) {
      console.error('Error adding customer:', error);
      setError(`שגיאה בהוספת לקוח: ${error?.message || 'שגיאה לא ידועה'}`);
    }
  };

  const handleEditCustomer = async () => {
    if (!selectedCustomer) return;
    
    setError(null);
    
    // Validation
    if (!formData.name || !formData.email || !formData.phone) {
      setError('יש למלא את כל השדות החובה (שם, אימייל, טלפון)');
      return;
    }

    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address || null,
        city: formData.city || null
      };

      console.log('Updating customer:', selectedCustomer.id, updateData);

      const { data, error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', selectedCustomer.id)
        .select();

      if (error) {
        console.error('Error updating customer:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        setError(`שגיאה בעדכון לקוח: ${error.message}`);
        return;
      }

      console.log('Customer updated successfully:', data);
      setShowEditModal(false);
      resetForm();
      await loadCustomers();
      alert('הלקוח עודכן בהצלחה!');
    } catch (error: any) {
      console.error('Error updating customer:', error);
      setError(`שגיאה בעדכון לקוח: ${error?.message || 'שגיאה לא ידועה'}`);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הלקוח?')) return;

    setError(null);
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting customer:', error);
        setError(`שגיאה במחיקת לקוח: ${error.message}`);
        return;
      }
      
      await loadCustomers();
      alert('הלקוח נמחק בהצלחה!');
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      setError(`שגיאה במחיקת לקוח: ${error?.message || 'שגיאה לא ידועה'}`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: ''
    });
    setSelectedCustomer(null);
    setError(null);
  };

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address || '',
      city: customer.city || ''
    });
    setError(null);
    setShowEditModal(true);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          textAlign: 'center'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            margin: '0 auto 20px',
            border: '4px solid #e0e0e0',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <div style={{ fontSize: '18px', color: '#666' }}>טוען לקוחות...</div>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
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
        padding: '20px',
        borderBottom: '1px solid #e0e0e0',
        marginBottom: '30px'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ fontSize: '28px', margin: 0 }}>ניהול לקוחות</h1>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            חזרה לדשבורד
          </button>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto 20px',
          padding: '15px 20px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '5px',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {/* Search and Add */}
        <div style={{ 
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <input
            type="text"
            placeholder="חיפוש לקוח..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              width: '300px',
              fontSize: '16px'
            }}
          />
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            + הוסף לקוח חדש
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>
              {customers.length}
            </div>
            <div style={{ color: '#666', marginTop: '5px' }}>סה"כ לקוחות</div>
          </div>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>
              {customers.filter(c => {
                const created = new Date(c.created_at);
                const now = new Date();
                const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 3600 * 24));
                return diffDays <= 30;
              }).length}
            </div>
            <div style={{ color: '#666', marginTop: '5px' }}>לקוחות חדשים החודש</div>
          </div>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffc107' }}>
              {filteredCustomers.length}
            </div>
            <div style={{ color: '#666', marginTop: '5px' }}>תוצאות חיפוש</div>
          </div>
        </div>

        {/* Customers Table */}
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>שם</th>
                <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>אימייל</th>
                <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>טלפון</th>
                <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>עיר</th>
                <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>תאריך הוספה</th>
                <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <React.Fragment key={customer.id}>
                  <tr style={{ 
                    borderBottom: '1px solid #e0e0e0',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '15px', fontWeight: '500' }}>{customer.name}</td>
                    <td style={{ padding: '15px' }}>{customer.email}</td>
                    <td style={{ padding: '15px', direction: 'ltr', textAlign: 'right' }}>{customer.phone}</td>
                    <td style={{ padding: '15px' }}>{customer.city || '-'}</td>
                    <td style={{ padding: '15px', color: '#666' }}>
                      {new Date(customer.created_at).toLocaleDateString('he-IL')}
                    </td>
                    <td style={{ padding: '15px' }}>
                      <button
                        onClick={() => openEditModal(customer)}
                        style={{
                          padding: '5px 15px',
                          marginLeft: '10px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        עריכה
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(customer.id)}
                        style={{
                          padding: '5px 15px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        מחיקה
                      </button>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {filteredCustomers.length === 0 && (
            <div style={{ 
              padding: '60px 40px', 
              textAlign: 'center',
              color: '#666'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>📋</div>
              <div style={{ fontSize: '18px' }}>
                {searchTerm ? 'לא נמצאו לקוחות התואמים לחיפוש' : 'אין לקוחות להצגה'}
              </div>
              {!searchTerm && (
                <button
                  onClick={() => setShowAddModal(true)}
                  style={{
                    marginTop: '20px',
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  הוסף את הלקוח הראשון
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            width: '500px',
            maxWidth: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ marginBottom: '20px' }}>
              {showAddModal ? 'הוסף לקוח חדש' : 'ערוך לקוח'}
            </h2>
            
            {error && (
              <div style={{
                padding: '10px',
                marginBottom: '20px',
                backgroundColor: '#f8d7da',
                color: '#721c24',
                borderRadius: '5px',
                border: '1px solid #f5c6cb'
              }}>
                {error}
              </div>
            )}
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                שם *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '16px'
                }}
                placeholder="הכנס שם לקוח"
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                אימייל *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '16px'
                }}
                placeholder="example@email.com"
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                טלפון *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '16px'
                }}
                placeholder="050-1234567"
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                כתובת
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '16px'
                }}
                placeholder="רחוב ומספר"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                עיר
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '16px'
                }}
                placeholder="עיר"
              />
            </div>

            <div style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
              * שדות חובה
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={showAddModal ? handleAddCustomer : handleEditCustomer}
                style={{
                  padding: '12px 30px',
                  backgroundColor: showAddModal ? '#28a745' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                {showAddModal ? 'הוסף' : 'עדכן'}
              </button>
              <button
                onClick={() => {
                  if (showAddModal) setShowAddModal(false);
                  if (showEditModal) setShowEditModal(false);
                  resetForm();
                }}
                style={{
                  padding: '12px 30px',
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
          </div>
        </div>
      )}
    </div>
  );
}
