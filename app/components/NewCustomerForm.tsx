'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface NewCustomerFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isEdit?: boolean;
  allowCustomFields?: boolean;
}

export default function NewCustomerForm({
  initialData = {},
  onSubmit,
  onCancel,
  isEdit = false,
  allowCustomFields = false
}: NewCustomerFormProps) {
  // Form state - שדות בסיסיים
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    legal_id: initialData.legal_id || '',
    contact_name: initialData.contact_name || '',
    address: initialData.address || '',
    notes: initialData.notes || '',
    // שדות חדשים
    status_id: initialData.status_id || '',
    brand_id: initialData.brand_id || '',
    pos_vendor_id: initialData.pos_vendor_id || '',
    region: initialData.region || '',
    branch_admin_code: initialData.branch_admin_code || '',
    brand_admin_code: initialData.brand_admin_code || '',
    brand_display_name: initialData.brand_display_name || '',
    invoice_business_name: initialData.invoice_business_name || '',
    vat_number: initialData.vat_number || '',
    owner_id_number: initialData.owner_id_number || '',
    branch_phone: initialData.branch_phone || '',
    manager_mobile: initialData.manager_mobile || '',
    payment_mandate_url: initialData.payment_mandate_url || '',
    accounting_notes: initialData.accounting_notes || ''
  });

  // States for dropdown options
  const [statuses, setStatuses] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [posVendors, setPosVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    loadDropdownData();
  }, []);

  const loadDropdownData = async () => {
    try {
      // טוען סטטוסים
      const { data: statusData } = await supabase
        .from('statuses')
        .select('*')
        .order('name');
      
      // טוען מותגים
      const { data: brandData } = await supabase
        .from('brands')
        .select('*')
        .order('name');
      
      // טוען ספקי POS
      const { data: posData } = await supabase
        .from('pos_vendors')
        .select('*')
        .order('name');

      setStatuses(statusData || []);
      setBrands(brandData || []);
      setPosVendors(posData || []);
    } catch (error) {
      console.error('Error loading dropdown data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // מסנן שדות ריקים
    const dataToSubmit = Object.entries(formData).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    onSubmit(dataToSubmit);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const regions = [
    'צפון',
    'חיפה',
    'מרכז',
    'תל אביב',
    'ירושלים',
    'דרום',
    'יהודה ושומרון'
  ];

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center'
      }}>
        <div>טוען נתונים...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '30px',
      maxHeight: '80vh',
      overflow: 'auto',
      direction: 'rtl'
    }}>
      <h2 style={{ marginBottom: '25px', fontSize: '24px', fontWeight: 'bold' }}>
        {isEdit ? 'עריכת לקוח' : 'הוספת לקוח חדש'}
      </h2>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #e0e0e0',
        marginBottom: '20px',
        gap: '10px'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('basic')}
          style={{
            padding: '10px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'basic' ? '3px solid #007bff' : 'none',
            color: activeTab === 'basic' ? '#007bff' : '#666',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'basic' ? 'bold' : 'normal'
          }}
        >
          פרטים בסיסיים
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('business')}
          style={{
            padding: '10px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'business' ? '3px solid #007bff' : 'none',
            color: activeTab === 'business' ? '#007bff' : '#666',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'business' ? 'bold' : 'normal'
          }}
        >
          פרטים עסקיים
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('technical')}
          style={{
            padding: '10px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'technical' ? '3px solid #007bff' : 'none',
            color: activeTab === 'technical' ? '#007bff' : '#666',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'technical' ? 'bold' : 'normal'
          }}
        >
          פרטים טכניים
        </button>
      </div>

      {/* Basic Tab */}
      {activeTab === 'basic' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {/* שם */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                שם הלקוח *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>

            {/* סטטוס */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                סטטוס
              </label>
              <select
                name="status_id"
                value={formData.status_id}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  backgroundColor: 'white'
                }}
              >
                <option value="">בחר סטטוס</option>
                {statuses.map(status => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>

            {/* אימייל */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                אימייל
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>

            {/* טלפון */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                טלפון
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>

            {/* איש קשר */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                שם איש קשר
              </label>
              <input
                type="text"
                name="contact_name"
                value={formData.contact_name}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>

            {/* נייד מנהל */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                נייד מנהל
              </label>
              <input
                type="tel"
                name="manager_mobile"
                value={formData.manager_mobile}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>

            {/* כתובת */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                כתובת
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>

            {/* אזור */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                אזור
              </label>
              <select
                name="region"
                value={formData.region}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  backgroundColor: 'white'
                }}
              >
                <option value="">בחר אזור</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            {/* טלפון סניף */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                טלפון סניף
              </label>
              <input
                type="tel"
                name="branch_phone"
                value={formData.branch_phone}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>

            {/* הערות */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                הערות כלליות
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Business Tab */}
      {activeTab === 'business' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {/* ח.פ/ע.מ */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                ח.פ / עוסק מורשה
              </label>
              <input
                type="text"
                name="legal_id"
                value={formData.legal_id}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>

            {/* מספר עוסק */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                מספר עוסק (VAT)
              </label>
              <input
                type="text"
                name="vat_number"
                value={formData.vat_number}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>

            {/* שם לחשבונית */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                שם עסק לחשבונית
              </label>
              <input
                type="text"
                name="invoice_business_name"
                value={formData.invoice_business_name}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>

            {/* ת.ז בעלים */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                ת.ז בעלים
              </label>
              <input
                type="text"
                name="owner_id_number"
                value={formData.owner_id_number}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>

            {/* מותג */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                מותג
              </label>
              <select
                name="brand_id"
                value={formData.brand_id}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  backgroundColor: 'white'
                }}
              >
                <option value="">בחר מותג</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            {/* שם תצוגה מותג */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                שם תצוגה של המותג
              </label>
              <input
                type="text"
                name="brand_display_name"
                value={formData.brand_display_name}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>

            {/* קישור הרשאת תשלום */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                קישור להרשאת תשלום
              </label>
              <input
                type="url"
                name="payment_mandate_url"
                value={formData.payment_mandate_url}
                onChange={handleChange}
                placeholder="https://..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  direction: 'ltr'
                }}
              />
            </div>

            {/* הערות הנהח"ש */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                הערות להנהלת חשבונות
              </label>
              <textarea
                name="accounting_notes"
                value={formData.accounting_notes}
                onChange={handleChange}
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Technical Tab */}
      {activeTab === 'technical' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {/* ספק POS */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                ספק קופה (POS)
              </label>
              <select
                name="pos_vendor_id"
                value={formData.pos_vendor_id}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  backgroundColor: 'white'
                }}
              >
                <option value="">בחר ספק קופה</option>
                {posVendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>

            {/* קוד מנהל סניף */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                קוד מנהל סניף
              </label>
              <input
                type="text"
                name="branch_admin_code"
                value={formData.branch_admin_code}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>

            {/* קוד מנהל מותג */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                קוד מנהל מותג
              </label>
              <input
                type="text"
                name="brand_admin_code"
                value={formData.brand_admin_code}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        marginTop: '25px',
        paddingTop: '20px',
        borderTop: '1px solid #e0e0e0'
      }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ביטול
        </button>
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {isEdit ? 'עדכן לקוח' : 'הוסף לקוח'}
        </button>
      </div>
    </form>
  );
}
