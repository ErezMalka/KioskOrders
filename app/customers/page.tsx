'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status?: string;
  notes?: string;
  created_at: string;
  custom_fields?: any;
}

interface Status {
  id: string;
  name: string;
  color: string;
  order_index: number;
}

interface CustomField {
  id: string;
  name: string;
  field_type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  options?: string[];
  is_active: boolean;
  order_index: number;
}

export default function CustomersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([
    { id: '1', name: 'ליד חדש', color: '#4CAF50', order_index: 0 },
    { id: '2', name: 'פולואפ', color: '#2196F3', order_index: 1 },
    { id: '3', name: 'לא רלוונטי', color: '#9E9E9E', order_index: 2 },
    { id: '4', name: 'לקוח פעיל', color: '#FF9800', order_index: 3 },
    { id: '5', name: 'לקוח VIP', color: '#9C27B0', order_index: 4 }
  ]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'statuses' | 'fields'>('statuses');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'ליד חדש',
    notes: '',
    custom_fields: {}
  });

  const [newStatus, setNewStatus] = useState({ name: '', color: '#4CAF50' });
  const [newField, setNewField] = useState({ 
    name: '', 
    field_type: 'text' as const,
    options: []
  });

  useEffect(() => {
    checkUser();
    fetchCustomers();
    loadSettings();
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

  async function loadSettings() {
    // בעתיד נטען את ההגדרות מהדאטאבייס
    // כרגע נשתמש בערכי ברירת מחדל
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
      setFormData({ 
        name: '', 
        email: '', 
        phone: '', 
        status: 'ליד חדש',
        notes: '',
        custom_fields: {}
      });
      
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
      status: customer.status || 'ליד חדש',
      notes: customer.notes || '',
      custom_fields: customer.custom_fields || {}
    });
    setShowForm(true);
  }

  function addStatus() {
    if (!newStatus.name) return;
    const newId = Date.now().toString();
    setStatuses([...statuses, { 
      id: newId, 
      name: newStatus.name, 
      color: newStatus.color,
      order_index: statuses.length 
    }]);
    setNewStatus({ name: '', color: '#4CAF50' });
  }

  function removeStatus(id: string) {
    setStatuses(statuses.filter(s => s.id !== id));
  }

  function addCustomField() {
    if (!newField.name) return;
    const field: CustomField = {
      id: Date.now().toString(),
      name: newField.name,
      field_type: newField.field_type,
      options: newField.options,
      is_active: true,
      order_index: customFields.length
    };
    setCustomFields([...customFields, field]);
    setNewField({ name: '', field_type: 'text', options: [] });
  }

  function removeCustomField(id: string) {
    setCustomFields(customFields.filter(f => f.id !== id));
  }

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = customer.name?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(searchQuery) ||
      customer.notes?.toLowerCase().includes(searchLower);
    
    const matchesStatus = !selectedStatus || customer.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (statusName: string) => {
    const status = statuses.find(s => s.name === statusName);
    return status?.color || '#666';
  };

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
              onClick={() => setShowSettings(!showSettings)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#9C27B0',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ⚙️ הגדרות
            </button>
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
        {/* Settings Panel */}
        {showSettings && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            marginBottom: '30px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ fontSize: '20px', margin: 0, color: '#333' }}>
                ⚙️ הגדרות מערכת לקוחות
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#999'
                }}
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '20px',
              borderBottom: '1px solid #e0e0e0'
            }}>
              <button
                onClick={() => setActiveTab('statuses')}
                style={{
                  padding: '10px 20px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'statuses' ? '3px solid #2196F3' : 'none',
                  color: activeTab === 'statuses' ? '#2196F3' : '#666',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                סטטוסים
              </button>
              <button
                onClick={() => setActiveTab('fields')}
                style={{
                  padding: '10px 20px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'fields' ? '3px solid #2196F3' : 'none',
                  color: activeTab === 'fields' ? '#2196F3' : '#666',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                שדות מותאמים אישית
              </button>
            </div>

            {/* Statuses Tab */}
            {activeTab === 'statuses' && (
              <div>
                <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#666' }}>
                  ניהול סטטוסים
                </h3>
                
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <input
                      type="text"
                      placeholder="שם הסטטוס"
                      value={newStatus.name}
                      onChange={(e) => setNewStatus({...newStatus, name: e.target.value})}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px'
                      }}
                    />
                    <input
                      type="color"
                      value={newStatus.color}
                      onChange={(e) => setNewStatus({...newStatus, color: e.target.value})}
                      style={{
                        width: '50px',
                        padding: '4px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    />
                    <button
                      onClick={addStatus}
                      style={{
                        padding: '8px 20px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      הוסף סטטוס
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {statuses.map(status => (
                      <div
                        key={status.id}
                        style={{
                          padding: '8px 15px',
                          backgroundColor: status.color + '20',
                          borderRight: `4px solid ${status.color}`,
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <span style={{ color: status.color, fontWeight: 'bold' }}>
                          {status.name}
                        </span>
                        <button
                          onClick={() => removeStatus(status.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#999',
                            cursor: 'pointer',
                            fontSize: '16px'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Custom Fields Tab */}
            {activeTab === 'fields' && (
              <div>
                <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#666' }}>
                  שדות מותאמים אישית
                </h3>
                
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <input
                      type="text"
                      placeholder="שם השדה"
                      value={newField.name}
                      onChange={(e) => setNewField({...newField, name: e.target.value})}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px'
                      }}
                    />
                    <select
                      value={newField.field_type}
                      onChange={(e) => setNewField({...newField, field_type: e.target.value as any})}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px'
                      }}
                    >
                      <option value="text">טקסט</option>
                      <option value="number">מספר</option>
                      <option value="date">תאריך</option>
                      <option value="textarea">טקסט ארוך</option>
                      <option value="select">רשימה</option>
                    </select>
                    <button
                      onClick={addCustomField}
                      style={{
                        padding: '8px 20px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      הוסף שדה
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {customFields.map(field => (
                      <div
                        key={field.id}
                        style={{
                          padding: '12px',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <strong>{field.name}</strong>
                          <span style={{ marginRight: '10px', color: '#666', fontSize: '14px' }}>
                            ({field.field_type === 'text' ? 'טקסט' :
                              field.field_type === 'number' ? 'מספר' :
                              field.field_type === 'date' ? 'תאריך' :
                              field.field_type === 'textarea' ? 'טקסט ארוך' : 'רשימה'})
                          </span>
                        </div>
                        <button
                          onClick={() => removeCustomField(field.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc3545',
                            cursor: 'pointer',
                            fontSize: '16px'
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                    {customFields.length === 0 && (
                      <p style={{ color: '#999', textAlign: 'center' }}>
                        אין שדות מותאמים אישית. הוסף שדה חדש למעלה.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Bar */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', gap: '10px', flex: 1, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', minWidth: '250px' }}>
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
                  placeholder="חיפוש לקוח..."
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

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{
                  padding: '10px 15px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <option value="">כל הסטטוסים</option>
                {statuses.map(status => (
                  <option key={status.id} value={status.name}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (!showForm) {
                  setEditingCustomer(null);
                  setFormData({ 
                    name: '', 
                    email: '', 
                    phone: '', 
                    status: 'ליד חדש',
                    notes: '',
                    custom_fields: {}
                  });
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
                    👤 שם הלקוח
                  </label>
                  <input
                    type="text"
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
                    🏷️ סטטוס
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    {statuses.map(status => (
                      <option key={status.id} value={status.name}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Fields */}
                {customFields.map(field => (
                  <div key={field.id}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      color: '#666'
                    }}>
                      {field.name}
                    </label>
                    {field.field_type === 'textarea' ? (
                      <textarea
                        value={formData.custom_fields[field.id] || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          custom_fields: {
                            ...formData.custom_fields,
                            [field.id]: e.target.value
                          }
                        })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '14px',
                          minHeight: '80px'
                        }}
                      />
                    ) : (
                      <input
                        type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                        value={formData.custom_fields[field.id] || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          custom_fields: {
                            ...formData.custom_fields,
                            [field.id]: e.target.value
                          }
                        })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    )}
                  </div>
                ))}

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#666'
                  }}>
                    📝 הערות
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      minHeight: '100px'
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
                    setFormData({ 
                      name: '', 
                      email: '', 
                      phone: '', 
                      status: 'ליד חדש',
                      notes: '',
                      custom_fields: {}
                    });
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
            <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#666' }}>סה״כ לקוחות</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#2196F3', margin: 0 }}>
              {customers.length}
            </p>
          </div>

          {statuses.slice(0, 5).map(status => {
            const count = customers.filter(c => c.status === status.name).length;
            return (
              <div key={status.id} style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '25px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                borderRight: `4px solid ${status.color}`
              }}>
                <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#666' }}>
                  {status.name}
                </h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: status.color, margin: 0 }}>
                  {count}
                </p>
              </div>
            );
          })}
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
            רשימת לקוחות ({filteredCustomers.length})
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
                  position: 'relative',
                  borderRight: `4px solid ${getStatusColor(customer.status || 'ליד חדש')}`
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

                  {customer.status && (
                    <span style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      padding: '4px 10px',
                      backgroundColor: getStatusColor(customer.status) + '20',
                      color: getStatusColor(customer.status),
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {customer.status}
                    </span>
                  )}

                  <h4 style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    marginBottom: '15px',
                    marginTop: customer.status ? '30px' : '0',
                    color: '#333',
                    paddingLeft: '60px'
                  }}>
                    {customer.name || 'לקוח ללא שם'}
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
                    {customer.notes && (
                      <div style={{ 
                        marginBottom: '8px',
                        padding: '8px',
                        backgroundColor: '#fff',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}>
                        📝 {customer.notes.substring(0, 100)}
                        {customer.notes.length > 100 && '...'}
                      </div>
                    )}
                    <div style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid #dee2e6',
                      fontSize: '12px',
                      color: '#999',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>📅 {new Date(customer.created_at).toLocaleDateString('he-IL')}</span>
                      <span>{new Date(customer.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
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
                {searchQuery || selectedStatus ? 'לא נמצאו לקוחות התואמים לסינון' : 'אין לקוחות להצגה'}
              </p>
              {!searchQuery && !selectedStatus && (
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
