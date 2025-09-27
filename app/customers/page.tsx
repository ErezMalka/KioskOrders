'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  created_at: string;
}

export default function CustomersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: ''
  });

  useEffect(() => {
    checkUser();
    fetchCustomers();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user found, redirecting to login');
        router.push('/login');
        return;
      }

      setUser(user);
      console.log('User loaded:', user.email);
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  async function fetchCustomers() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(formData)
          .eq('id', editingCustomer.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([formData]);

        if (error) throw error;
      }

      await fetchCustomers();
      setShowForm(false);
      setEditingCustomer(null);
      setFormData({ name: '', email: '', phone: '', address: '', city: '' });
      
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('שגיאה בשמירת הלקוח');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הלקוח?')) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('שגיאה במחיקת הלקוח');
    }
  }

  function handleEdit(customer: Customer) {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || ''
    });
    setShowForm(true);
  }

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchQuery.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(searchQuery) ||
      customer.city?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        direction: 'rtl'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <h2>טוען לקוחות...</h2>
        </div>
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
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ 
            margin: 0,
            fontSize: '24px',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            👥 ניהול לקוחות
          </h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              חזרה לדשבורד
            </button>
            <span style={{ color: '#666' }}>
              👤 {user?.email}
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              יציאה
            </button>
          </div>
        </div>
      </header>

      <main style={{
        maxWidth: '1200px',
        margin: '40px auto',
        padding: '0 20px'
      }}>
        {/* Action Bar */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div style={{ flex: 1, minWidth: '250px', maxWidth: '500px' }}>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '20px'
              }}>
                🔍
              </span>
              <input
                type="text"
                placeholder="חיפוש לפי שם, אימייל, טלפון או עיר..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
          
          <button
            onClick={() => {
              setShowForm(!showForm);
              if (!showForm) {
                setEditingCustomer(null);
                setFormData({ name: '', email: '', phone: '', address: '', city: '' });
              }
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ➕ לקוח חדש
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            marginBottom: '30px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ 
              fontSize: '20px',
              marginBottom: '20px',
              color: '#333'
            }}>
              {editingCustomer ? 'עריכת לקוח' : 'הוספת לקוח חדש'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#666'
                  }}>
                    👤 שם הלקוח *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#666'
                  }}>
                    📧 אימייל
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#666'
                  }}>
                    📞 טלפון
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#666'
                  }}>
                    📍 כתובת
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#666'
                  }}>
                    🏢 עיר
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {editingCustomer ? '💾 עדכן' : '➕ הוסף'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCustomer(null);
                    setFormData({ name: '', email: '', phone: '', address: '', city: '' });
                  }}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Statistics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderRight: '4px solid #2196F3'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>👥</div>
            <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#333' }}>סה״כ לקוחות</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#2196F3', margin: 0 }}>
              {customers.length}
            </p>
            <p style={{ fontSize: '14px', color: '#999', marginTop: '5px' }}>לקוחות רשומים במערכת</p>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderRight: '4px solid #4CAF50'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📅</div>
            <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#333' }}>לקוחות החודש</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#4CAF50', margin: 0 }}>
              {customers.filter(c => {
                const createdDate = new Date(c.created_at);
                const now = new Date();
                return createdDate.getMonth() === now.getMonth() && 
                       createdDate.getFullYear() === now.getFullYear();
              }).length}
            </p>
            <p style={{ fontSize: '14px', color: '#999', marginTop: '5px' }}>נוספו החודש</p>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderRight: '4px solid #FF9800'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📧</div>
            <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#333' }}>עם אימייל</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#FF9800', margin: 0 }}>
              {customers.filter(c => c.email).length}
            </p>
            <p style={{ fontSize: '14px', color: '#999', marginTop: '5px' }}>כתובות אימייל</p>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderRight: '4px solid #9C27B0'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📞</div>
            <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#333' }}>עם טלפון</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#9C27B0', margin: 0 }}>
              {customers.filter(c => c.phone).length}
            </p>
            <p style={{ fontSize: '14px', color: '#999', marginTop: '5px' }}>מספרי טלפון</p>
          </div>
        </div>

        {/* Customers Grid */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            fontSize: '20px',
            marginBottom: '20px',
            color: '#333'
          }}>
            רשימת לקוחות
          </h3>

          {filteredCustomers.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {filteredCustomers.map((customer) => (
                <div key={customer.id} style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '20px',
                  border: '1px solid #e9ecef',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    display: 'flex',
                    gap: '5px'
                  }}>
                    <button
                      onClick={() => handleEdit(customer)}
                      style={{
                        padding: '5px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                      title="עריכה"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      style={{
                        padding: '5px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                      title="מחיקה"
                    >
                      🗑️
                    </button>
                  </div>

                  <h4 style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    marginBottom: '15px',
                    color: '#333',
                    paddingLeft: '60px'
                  }}>
                    {customer.name}
                  </h4>

                  <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.8' }}>
                    {customer.email && (
                      <div style={{ marginBottom: '8px' }}>
                        📧 {customer.email}
                      </div>
                    )}
                    {customer.phone && (
                      <div style={{ marginBottom: '8px' }}>
                        📞 {customer.phone}
                      </div>
                    )}
                    {customer.city && (
                      <div style={{ marginBottom: '8px' }}>
                        🏢 {customer.city}
                      </div>
                    )}
                    {customer.address && (
                      <div style={{ marginBottom: '8px' }}>
                        📍 {customer.address}
                      </div>
                    )}
                    <div style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid #dee2e6',
                      fontSize: '12px',
                      color: '#999'
                    }}>
                      📅 {new Date(customer.created_at).toLocaleDateString('he-IL')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#999'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>👥</div>
              <p style={{ fontSize: '18px' }}>
                {searchQuery ? 'לא נמצאו לקוחות התואמים לחיפוש' : 'אין לקוחות להצגה'}
              </p>
              {!searchQuery && (
                <p style={{ fontSize: '14px', marginTop: '10px' }}>
                  לחץ על "לקוח חדש" כדי להוסיף את הלקוח הראשון
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
