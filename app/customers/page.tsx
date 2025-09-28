'use client'

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Customer {
  id: string;
  name: string;
  legal_id?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
  notes?: string;
  created_at: string;
  custom_fields?: any;
}

interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[];
  required?: boolean;
}

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  'ליד חדש': { bg: '#E3F2FD', text: '#1976D2', border: '#90CAF9' },
  'בתהליך': { bg: '#FFF3E0', text: '#F57C00', border: '#FFCC80' },
  'לקוח פעיל': { bg: '#E8F5E9', text: '#388E3C', border: '#A5D6A7' },
  'לא פעיל': { bg: '#FAFAFA', text: '#616161', border: '#E0E0E0' },
  'VIP': { bg: '#F3E5F5', text: '#7B1FA2', border: '#CE93D8' }
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [showFieldManager, setShowFieldManager] = useState(false);
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [formData, setFormData] = useState({
    name: '',
    legal_id: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    status: 'ליד חדש',
    notes: '',
    custom_fields: {}
  });

  const [newField, setNewField] = useState<Partial<CustomField>>({
    name: '',
    type: 'text',
    options: [],
    required: false
  });

  useEffect(() => {
    fetchCustomers();
    loadCustomFields();
  }, []);

  async function fetchCustomers() {
    try {
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

  async function loadCustomFields() {
    const savedFields = localStorage.getItem('customFields');
    if (savedFields) {
      setCustomFields(JSON.parse(savedFields));
    }
  }

  async function saveCustomField() {
    if (!newField.name) return;

    const field: CustomField = {
      id: Date.now().toString(),
      name: newField.name,
      type: newField.type || 'text',
      options: newField.options,
      required: newField.required
    };

    const updatedFields = [...customFields, field];
    setCustomFields(updatedFields);
    localStorage.setItem('customFields', JSON.stringify(updatedFields));
    
    setNewField({
      name: '',
      type: 'text',
      options: [],
      required: false
    });
  }

  async function deleteCustomField(fieldId: string) {
    const updatedFields = customFields.filter(f => f.id !== fieldId);
    setCustomFields(updatedFields);
    localStorage.setItem('customFields', JSON.stringify(updatedFields));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      const dataToSave: any = {
        name: formData.name || null,
        legal_id: formData.legal_id || null,
        contact_name: formData.contact_name || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        notes: formData.notes || null
      };

      if (customers.length > 0 && 'status' in customers[0]) {
        dataToSave.status = formData.status || 'ליד חדש';
        dataToSave.custom_fields = formData.custom_fields || {};
      }

      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(dataToSave)
          .eq('id', editingCustomer.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([dataToSave]);

        if (error) throw error;
      }

      await fetchCustomers();
      setShowForm(false);
      setEditingCustomer(null);
      setFormData({ 
        name: '',
        legal_id: '',
        contact_name: '',
        email: '', 
        phone: '',
        address: '',
        status: 'ליד חדש',
        notes: '',
        custom_fields: {}
      });
      
      alert(editingCustomer ? 'הלקוח עודכן בהצלחה!' : 'הלקוח נוסף בהצלחה!');
      
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('שגיאה בשמירת הלקוח');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('האם אתה בטוח שברצונך למחוק לקוח זה?')) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchCustomers();
      alert('הלקוח נמחק בהצלחה');
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('שגיאה במחיקת הלקוח');
    }
  }

  function handleEdit(customer: Customer) {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      legal_id: customer.legal_id || '',
      contact_name: customer.contact_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      status: customer.status || 'ליד חדש',
      notes: customer.notes || '',
      custom_fields: customer.custom_fields || {}
    });
    setShowForm(true);
  }

  function toggleRowExpansion(customerId: string) {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
    }
    setExpandedRows(newExpanded);
  }

  async function exportCustomers() {
    const csvContent = [
      ['שם', 'ח.פ/ע.מ', 'איש קשר', 'טלפון', 'אימייל', 'כתובת', 'סטטוס', 'תאריך יצירה'],
      ...filteredCustomers.map(c => [
        c.name,
        c.legal_id || '',
        c.contact_name || '',
        c.phone || '',
        c.email || '',
        c.address || '',
        c.status || '',
        new Date(c.created_at).toLocaleDateString('he-IL')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = searchTerm === '' || 
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.legal_id?.includes(searchTerm) ||
      customer.contact_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || customer.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
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
        padding: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
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
            <p style={{ 
              margin: '5px 0 0 0', 
              color: '#666',
              fontSize: '14px'
            }}>
              {customers.length} לקוחות רשומים במערכת
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={exportCustomers}
              style={{
                backgroundColor: 'white',
                color: '#666',
                padding: '10px 20px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f0f0'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              <span>📥</span>
              <span>ייצוא</span>
            </button>
            
            <button
              onClick={() => setShowFieldManager(true)}
              style={{
                backgroundColor: 'white',
                color: '#666',
                padding: '10px 20px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f0f0'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              <span>🏷️</span>
              <span>שדות מותאמים</span>
            </button>
            
            <button
              onClick={() => setShowForm(true)}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
            >
              <span>➕</span>
              <span>לקוח חדש</span>
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* Search and Filter Section */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                placeholder="🔍 חיפוש לפי שם, טלפון, אימייל או ח.פ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 15px',
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
                backgroundColor: 'white',
                minWidth: '150px'
              }}
            >
              <option value="all">כל הסטטוסים</option>
              {Object.keys(statusColors).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
            }}>
              <div style={{
                padding: '25px',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#4CAF50',
                color: 'white',
                borderRadius: '12px 12px 0 0'
              }}>
                <h2 style={{ margin: 0, fontSize: '20px' }}>
                  {editingCustomer ? '✏️ עריכת לקוח' : '➕ לקוח חדש'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingCustomer(null);
                    setFormData({ 
                      name: '',
                      legal_id: '',
                      contact_name: '',
                      email: '', 
                      phone: '',
                      address: '',
                      status: 'ליד חדש',
                      notes: '',
                      custom_fields: {}
                    });
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    fontSize: '24px',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ padding: '25px' }}>
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
                      color: '#666',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      שם החברה/לקוח <span style={{ color: '#dc3545' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      placeholder="הזן שם חברה או לקוח"
                    />
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      color: '#666',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      ח.פ / ע.מ
                    </label>
                    <input
                      type="text"
                      value={formData.legal_id}
                      onChange={(e) => setFormData({...formData, legal_id: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      placeholder="מספר חברה או עוסק מורשה"
                    />
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      color: '#666',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      איש קשר
                    </label>
                    <input
                      type="text"
                      value={formData.contact_name}
                      onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      placeholder="שם איש הקשר"
                    />
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      color: '#666',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      טלפון
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      placeholder="מספר טלפון"
                    />
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      color: '#666',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      אימייל
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      placeholder="כתובת אימייל"
                    />
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      color: '#666',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      כתובת
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      placeholder="כתובת מלאה"
                    />
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      color: '#666',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      סטטוס
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: 'white'
                      }}
                    >
                      {Object.keys(statusColors).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      color: '#666',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      הערות
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        resize: 'vertical'
                      }}
                      placeholder="הערות נוספות..."
                    />
                  </div>
                </div>

                {/* Custom Fields */}
                {customFields.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: '600',
                      color: '#333',
                      marginBottom: '15px'
                    }}>
                      שדות מותאמים
                    </h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '15px'
                    }}>
                      {customFields.map(field => (
                        <div key={field.id}>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '8px', 
                            color: '#666',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}>
                            {field.name} {field.required && '*'}
                          </label>
                          {field.type === 'select' && field.options ? (
                            <select
                              value={formData.custom_fields[field.id] || ''}
                              onChange={(e) => setFormData({
                                ...formData,
                                custom_fields: {
                                  ...formData.custom_fields,
                                  [field.id]: e.target.value
                                }
                              })}
                              required={field.required}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                fontSize: '14px',
                                backgroundColor: 'white'
                              }}
                            >
                              <option value="">בחר...</option>
                              {field.options.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type}
                              value={formData.custom_fields[field.id] || ''}
                              onChange={(e) => setFormData({
                                ...formData,
                                custom_fields: {
                                  ...formData.custom_fields,
                                  [field.id]: e.target.value
                                }
                              })}
                              required={field.required}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                fontSize: '14px'
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ 
                  display: 'flex', 
                  gap: '15px',
                  paddingTop: '20px',
                  borderTop: '1px solid #e0e0e0'
                }}>
                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      padding: '12px 30px',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '15px',
                      fontWeight: '500'
                    }}
                  >
                    💾 {editingCustomer ? 'עדכן לקוח' : 'שמור לקוח'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingCustomer(null);
                      setFormData({ 
                        name: '',
                        legal_id: '',
                        contact_name: '',
                        email: '', 
                        phone: '',
                        address: '',
                        status: 'ליד חדש',
                        notes: '',
                        custom_fields: {}
                      });
                    }}
                    style={{
                      backgroundColor: '#e0e0e0',
                      color: '#333',
                      padding: '12px 30px',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '15px',
                      fontWeight: '500'
                    }}
                  >
                    ביטול
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Custom Fields Manager Modal */}
        {showFieldManager && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
            }}>
              <div style={{
                padding: '25px',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#9C27B0',
                color: 'white',
                borderRadius: '12px 12px 0 0'
              }}>
                <h2 style={{ margin: 0, fontSize: '20px' }}>🏷️ ניהול שדות מותאמים</h2>
                <button
                  onClick={() => setShowFieldManager(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    fontSize: '24px',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: '25px' }}>
                {/* Add New Field */}
                <div style={{
                  backgroundColor: '#f9f9f9',
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '25px'
                }}>
                  <h3 style={{ 
                    margin: '0 0 15px 0',
                    fontSize: '16px',
                    color: '#333'
                  }}>
                    הוסף שדה חדש
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '15px',
                    marginBottom: '15px'
                  }}>
                    <input
                      type="text"
                      placeholder="שם השדה"
                      value={newField.name}
                      onChange={(e) => setNewField({...newField, name: e.target.value})}
                      style={{
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                    <select
                      value={newField.type}
                      onChange={(e) => setNewField({...newField, type: e.target.value as any})}
                      style={{
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="text">טקסט</option>
                      <option value="number">מספר</option>
                      <option value="date">תאריך</option>
                      <option value="select">רשימה</option>
                    </select>
                  </div>
                  
                  {newField.type === 'select' && (
                    <div style={{ marginBottom: '15px' }}>
                      <input
                        type="text"
                        placeholder="אפשרויות (מופרדות בפסיקים)"
                        onChange={(e) => setNewField({
                          ...newField, 
                          options: e.target.value.split(',').map(o => o.trim())
                        })}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  )}
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between'
                  }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={newField.required}
                        onChange={(e) => setNewField({...newField, required: e.target.checked})}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '14px', color: '#666' }}>שדה חובה</span>
                    </label>
                    
                    <button
                      onClick={saveCustomField}
                      style={{
                        backgroundColor: '#9C27B0',
                        color: 'white',
                        padding: '8px 20px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      הוסף שדה
                    </button>
                  </div>
                </div>

                {/* Existing Fields */}
                <div>
                  <h3 style={{ 
                    margin: '0 0 15px 0',
                    fontSize: '16px',
                    color: '#333'
                  }}>
                    שדות קיימים
                  </h3>
                  {customFields.length === 0 ? (
                    <p style={{ 
                      textAlign: 'center',
                      color: '#999',
                      padding: '30px',
                      backgroundColor: '#f9f9f9',
                      borderRadius: '8px'
                    }}>
                      אין שדות מותאמים
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {customFields.map(field => (
                        <div key={field.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 15px',
                          backgroundColor: '#f9f9f9',
                          borderRadius: '8px'
                        }}>
                          <div>
                            <span style={{ fontWeight: '500', color: '#333' }}>{field.name}</span>
                            <span style={{ 
                              color: '#666',
                              fontSize: '12px',
                              marginRight: '8px'
                            }}>
                              ({field.type})
                            </span>
                            {field.required && (
                              <span style={{
                                fontSize: '11px',
                                backgroundColor: '#9C27B0',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                marginRight: '8px'
                              }}>
                                חובה
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => deleteCustomField(field.id)}
                            style={{
                              backgroundColor: '#f44336',
                              color: 'white',
                              border: 'none',
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customers Table */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ 
                    padding: '15px',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: '#666',
                    fontSize: '14px',
                    borderBottom: '2px solid #e0e0e0'
                  }}>
                    שם החברה
                  </th>
                  <th style={{ 
                    padding: '15px',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: '#666',
                    fontSize: '14px',
                    borderBottom: '2px solid #e0e0e0'
                  }}>
                    ח.פ/ע.מ
                  </th>
                  <th style={{ 
                    padding: '15px',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: '#666',
                    fontSize: '14px',
                    borderBottom: '2px solid #e0e0e0'
                  }}>
                    איש קשר
                  </th>
                  <th style={{ 
                    padding: '15px',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: '#666',
                    fontSize: '14px',
                    borderBottom: '2px solid #e0e0e0'
                  }}>
                    טלפון
                  </th>
                  <th style={{ 
                    padding: '15px',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: '#666',
                    fontSize: '14px',
                    borderBottom: '2px solid #e0e0e0'
                  }}>
                    אימייל
                  </th>
                  <th style={{ 
                    padding: '15px',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: '#666',
                    fontSize: '14px',
                    borderBottom: '2px solid #e0e0e0'
                  }}>
                    סטטוס
                  </th>
                  <th style={{ 
                    padding: '15px',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: '#666',
                    fontSize: '14px',
                    borderBottom: '2px solid #e0e0e0'
                  }}>
                    תאריך יצירה
                  </th>
                  <th style={{ 
                    padding: '15px',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#666',
                    fontSize: '14px',
                    borderBottom: '2px solid #e0e0e0'
                  }}>
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <React.Fragment key={customer.id}>
                    <tr 
                      style={{ 
                        borderBottom: '1px solid #e0e0e0',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9f9f9'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                      onClick={() => toggleRowExpansion(customer.id)}
                    >
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '35px',
                            height: '35px',
                            backgroundColor: '#4CAF50',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '14px'
                          }}>
                            {customer.name?.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: '500', color: '#333' }}>
                              {customer.name}
                            </div>
                            {customer.address && (
                              <div style={{ 
                                fontSize: '12px',
                                color: '#999',
                                marginTop: '2px'
                              }}>
                                📍 {customer.address}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '15px', color: '#666', fontSize: '14px' }}>
                        {customer.legal_id || '-'}
                      </td>
                      <td style={{ padding: '15px', color: '#666', fontSize: '14px' }}>
                        {customer.contact_name || '-'}
                      </td>
                      <td style={{ padding: '15px', color: '#666', fontSize: '14px' }}>
                        {customer.phone || '-'}
                      </td>
                      <td style={{ padding: '15px', color: '#666', fontSize: '14px' }}>
                        {customer.email || '-'}
                      </td>
                      <td style={{ padding: '15px' }}>
                        {customer.status && (
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: statusColors[customer.status]?.bg || '#e0e0e0',
                            color: statusColors[customer.status]?.text || '#666',
                            border: `1px solid ${statusColors[customer.status]?.border || '#ccc'}`
                          }}>
                            {customer.status}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '15px', color: '#666', fontSize: '14px' }}>
                        {new Date(customer.created_at).toLocaleDateString('he-IL')}
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ 
                          display: 'flex',
                          gap: '8px',
                          justifyContent: 'center'
                        }}
                        onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleEdit(customer)}
                            style={{
                              backgroundColor: '#2196F3',
                              color: 'white',
                              border: 'none',
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px'
                            }}
                            title="ערוך"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            style={{
                              backgroundColor: '#f44336',
                              color: 'white',
                              border: 'none',
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px'
                            }}
                            title="מחק"
                          >
                            🗑️
                          </button>
                          <button
                            style={{
                              backgroundColor: '#9E9E9E',
                              color: 'white',
                              border: 'none',
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px'
                            }}
                            title={expandedRows.has(customer.id) ? 'סגור' : 'הרחב'}
                          >
                            {expandedRows.has(customer.id) ? '⬆️' : '⬇️'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Row */}
                    {expandedRows.has(customer.id) && (
                      <tr>
                        <td colSpan={8} style={{
                          padding: '20px',
                          backgroundColor: '#f9f9f9',
                          borderBottom: '1px solid #e0e0e0'
                        }}>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '20px'
                          }}>
                            {customer.notes && (
                              <div>
                                <h4 style={{
                                  margin: '0 0 10px 0',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  color: '#666',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}>
                                  📝 הערות
                                </h4>
                                <div style={{
                                  backgroundColor: 'white',
                                  padding: '12px',
                                  borderRadius: '8px',
                                  border: '1px solid #e0e0e0',
                                  fontSize: '14px',
                                  color: '#666'
                                }}>
                                  {customer.notes}
                                </div>
                              </div>
                            )}
                            
                            {customFields.length > 0 && (
                              <div>
                                <h4 style={{
                                  margin: '0 0 10px 0',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  color: '#666',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}>
                                  🏷️ שדות מותאמים
                                </h4>
                                <div style={{
                                  backgroundColor: 'white',
                                  padding: '12px',
                                  borderRadius: '8px',
                                  border: '1px solid #e0e0e0'
                                }}>
                                  {customFields.map(field => (
                                    <div key={field.id} style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      padding: '5px 0',
                                      borderBottom: '1px solid #f0f0f0'
                                    }}>
                                      <span style={{ color: '#666', fontSize: '14px' }}>
                                        {field.name}:
                                      </span>
                                      <span style={{ fontWeight: '500', fontSize: '14px' }}>
                                        {customer.custom_fields?.[field.id] || '-'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {/* Empty State */}
            {filteredCustomers.length === 0 && (
              <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                backgroundColor: 'white'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>👥</div>
                <h3 style={{ 
                  color: '#333',
                  marginBottom: '10px',
                  fontSize: '18px'
                }}>
                  אין לקוחות להצגה
                </h3>
                <p style={{ 
                  color: '#666',
                  fontSize: '14px'
                }}>
                  {searchTerm || selectedStatus !== 'all' 
                    ? 'נסה לשנות את הסינון או החיפוש'
                    : 'התחל להוסיף לקוחות חדשים למערכת'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
