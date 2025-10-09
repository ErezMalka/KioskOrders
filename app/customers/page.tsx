'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import NewCustomerForm from '@/app/components/NewCustomerForm';

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

// Fixed org_id
const FIXED_ORG_ID = '11111111-1111-1111-1111-111111111111';

// Updated Types to match customers_overview
interface Customer {
  id: string;
  org_id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  legal_id?: string;
  contact_name?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  // New fields from customers_overview
  brand_id?: string;
  status_id?: string;
  region?: string;
  branch_admin_code?: string;
  brand_admin_code?: string;
  brand_display_name?: string;
  invoice_business_name?: string;
  vat_number?: string;
  owner_id_number?: string;
  branch_phone?: string;
  manager_mobile?: string;
  pos_vendor_id?: string;
  payment_mandate_url?: string;
  accounting_notes?: string;
  // Joined fields from VIEW
  status_name?: string;
  status_color?: string;
  brand_name?: string;
  pos_vendor_name?: string;
  // Aggregated counts
  products_count?: number;
  emails_count?: number;
  hardware_count?: number;
  billing_lines_count?: number;
  monthly_billing_total?: string;
  one_time_billing_total?: string;
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

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      await loadCustomers();

    } catch (error) {
      console.error('Auth check error:', error);
      setError('שגיאה בבדיקת הרשאות');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      console.log('Loading customers from customers_overview');

      // טוען מ-customers_overview במקום מ-customers
      const { data, error } = await supabase
        .from('customers_overview')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading customers:', error);
        if (error.code !== 'PGRST116') {
          setError(`שגיאה בטעינת לקוחות: ${error.message}`);
        }
        return;
      }

      console.log('Customers loaded:', data?.length, 'customers');
      setCustomers(data || []);

    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAddCustomer = async (customerData: any) => {
    setError(null);

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          org_id: FIXED_ORG_ID, // משתמש ב-org_id קבוע
          ...customerData
        }])
        .select();

      if (error) {
        console.error('Error adding customer:', error);
        setError(`שגיאה בהוספת לקוח: ${error.message}`);
        return;
      }

      console.log('Customer added successfully:', data);
      
      // אם יש status_id, הוסף להיסטוריית סטטוסים
      if (data && data[0] && customerData.status_id) {
        await supabase
          .from('customer_status_history')
          .insert([{
            customer_id: data[0].id,
            status_id: customerData.status_id,
            note: 'סטטוס ראשוני'
          }]);
      }
      
      setShowAddModal(false);
      await loadCustomers();
      alert('הלקוח נוסף בהצלחה!');
    } catch (error: any) {
      console.error('Error adding customer:', error);
      setError(`שגיאה בהוספת לקוח: ${error?.message || 'שגיאה לא ידועה'}`);
    }
  };

  const handleEditCustomer = async (customerData: any) => {
    if (!selectedCustomer) return;

    setError(null);

    try {
      console.log('Updating customer:', selectedCustomer.id, customerData);

      const { data, error } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', selectedCustomer.id)
        .select();

      if (error) {
        console.error('Error updating customer:', error);
        setError(`שגיאה בעדכון לקוח: ${error.message}`);
        return;
      }

      console.log('Customer updated successfully:', data);
      
      // אם הסטטוס השתנה, הוסף להיסטוריה
      if (customerData.status_id && customerData.status_id !== selectedCustomer.status_id) {
        await supabase
          .from('customer_status_history')
          .insert([{
            customer_id: selectedCustomer.id,
            status_id: customerData.status_id,
            note: 'עדכון סטטוס'
          }]);
      }
      
      setShowEditModal(false);
      setSelectedCustomer(null);
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

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setError(null);
    setShowEditModal(true);
  };

  const filteredCustomers = customers
    .filter(customer => {
      const search = searchTerm.toLowerCase();
      return (
        (customer.name && customer.name.toLowerCase().includes(search)) ||
        (customer.email && customer.email.toLowerCase().includes(search)) ||
        (customer.phone && customer.phone.includes(searchTerm)) ||
        (customer.address && customer.address.toLowerCase().includes(search)) ||
        (customer.legal_id && customer.legal_id.includes(searchTerm)) ||
        (customer.contact_name && customer.contact_name.toLowerCase().includes(search))
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'he'));

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
            placeholder="חיפוש לפי שם, אימייל, טלפון, ח.פ, איש קשר או כתובת..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              width: '450px',
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
                <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>סטטוס</th>
                <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>אימייל</th>
                <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>טלפון</th>
                <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>כתובת</th>
                <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>ח.פ/ע.מ</th>
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
                    <td style={{ padding: '15px', fontWeight: '500' }}>
                      {customer.name}
                      {customer.brand_name && (
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                          מותג: {customer.brand_name}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '15px' }}>
                      {customer.status_name ? (
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: customer.status_color || '#e0e0e0',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {customer.status_name}
                        </span>
                      ) : (
                        <span style={{ color: '#999' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '15px' }}>{customer.email || '-'}</td>
                    <td style={{ padding: '15px', direction: 'ltr', textAlign: 'right' }}>{customer.phone || '-'}</td>
                    <td style={{ padding: '15px' }}>{customer.address || '-'}</td>
                    <td style={{ padding: '15px' }}>{customer.legal_id || '-'}</td>
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

        {/* Debug Button - הסר אחרי שהכל עובד */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            onClick={async () => {
              const { data, error } = await supabase
                .from('customers_overview')
                .select('*');
              console.log('Debug - Customers Data:', data);
              console.log('Debug - Error:', error);
              alert(`נמצאו ${data?.length || 0} לקוחות. בדוק את הקונסול לפרטים.`);
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              opacity: 0.5
            }}
          >
            🔧 בדיקת חיבור לנתונים
          </button>
        </div>
      </main>

      {/* Add Modal */}
      {showAddModal && (
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
          zIndex: 1000,
          overflow: 'auto',
          padding: '20px'
        }}>
          <div style={{ maxWidth: '600px', width: '100%' }}>
            <NewCustomerForm
              onSubmit={handleAddCustomer}
              onCancel={() => {
                setShowAddModal(false);
                setError(null);
              }}
              allowCustomFields={true}
            />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedCustomer && (
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
          zIndex: 1000,
          overflow: 'auto',
          padding: '20px'
        }}>
          <div style={{ maxWidth: '600px', width: '100%' }}>
            <NewCustomerForm
              initialData={{
                name: selectedCustomer.name,
                email: selectedCustomer.email || '',
                phone: selectedCustomer.phone || '',
                legal_id: selectedCustomer.legal_id || '',
                contact_name: selectedCustomer.contact_name || '',
                address: selectedCustomer.address || '',
                notes: selectedCustomer.notes || '',
                // שדות חדשים
                status_id: selectedCustomer.status_id || '',
                brand_id: selectedCustomer.brand_id || '',
                pos_vendor_id: selectedCustomer.pos_vendor_id || '',
                region: selectedCustomer.region || '',
                branch_admin_code: selectedCustomer.branch_admin_code || '',
                brand_admin_code: selectedCustomer.brand_admin_code || '',
                brand_display_name: selectedCustomer.brand_display_name || '',
                invoice_business_name: selectedCustomer.invoice_business_name || '',
                vat_number: selectedCustomer.vat_number || '',
                owner_id_number: selectedCustomer.owner_id_number || '',
                branch_phone: selectedCustomer.branch_phone || '',
                manager_mobile: selectedCustomer.manager_mobile || '',
                payment_mandate_url: selectedCustomer.payment_mandate_url || '',
                accounting_notes: selectedCustomer.accounting_notes || ''
              }}
              onSubmit={handleEditCustomer}
              onCancel={() => {
                setShowEditModal(false);
                setSelectedCustomer(null);
                setError(null);
              }}
              isEdit={true}
              allowCustomFields={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
