'use client'

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Phone, 
  Mail, 
  Building2,
  MapPin,
  Calendar,
  FileText,
  Tag,
  User,
  Hash,
  ChevronDown,
  ChevronUp,
  Filter,
  Download,
  Upload,
  MoreVertical,
  X,
  Check,
  AlertCircle
} from 'lucide-react';

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
  'ליד חדש': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'בתהליך': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  'לקוח פעיל': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'לא פעיל': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  'VIP': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' }
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
  
  const supabase = createClient();

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
    // In a real app, load from database
    // For now, using localStorage as example
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
      // מכין את הנתונים לשמירה - שולח רק שדות שקיימים בטבלה
      const dataToSave: any = {
        name: formData.name || null,
        legal_id: formData.legal_id || null,
        contact_name: formData.contact_name || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        notes: formData.notes || null
      };

      // אם העמודות החדשות קיימות, נוסיף אותן
      // נבדוק אם הן קיימות בלקוח קיים
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">ניהול לקוחות</h1>
                <p className="text-blue-100">
                  {customers.length} לקוחות רשומים במערכת
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={exportCustomers}
                  className="bg-white/20 backdrop-blur text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all flex items-center gap-2"
                >
                  <Download size={20} />
                  ייצוא
                </button>
                <button
                  onClick={() => setShowFieldManager(true)}
                  className="bg-white/20 backdrop-blur text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all flex items-center gap-2"
                >
                  <Tag size={20} />
                  שדות מותאמים
                </button>
                <button
                  onClick={() => {
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
                    setShowForm(true);
                  }}
                  className="bg-white text-blue-600 px-6 py-3 rounded-xl hover:bg-blue-50 transition-all flex items-center gap-2 font-medium shadow-lg"
                >
                  <Plus size={20} />
                  לקוח חדש
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="p-6 bg-gray-50 border-t">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="חיפוש לפי שם, טלפון, אימייל או ח.פ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors bg-white"
              >
                <option value="all">כל הסטטוסים</option>
                {Object.keys(statusColors).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-4 text-right font-medium text-gray-700">שם החברה</th>
                  <th className="p-4 text-right font-medium text-gray-700">ח.פ/ע.מ</th>
                  <th className="p-4 text-right font-medium text-gray-700">איש קשר</th>
                  <th className="p-4 text-right font-medium text-gray-700">טלפון</th>
                  <th className="p-4 text-right font-medium text-gray-700">אימייל</th>
                  <th className="p-4 text-right font-medium text-gray-700">סטטוס</th>
                  <th className="p-4 text-right font-medium text-gray-700">תאריך יצירה</th>
                  <th className="p-4 text-center font-medium text-gray-700">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <>
                    <tr 
                      key={customer.id} 
                      className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => toggleRowExpansion(customer.id)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {customer.name?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{customer.name}</div>
                            {customer.address && (
                              <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <MapPin size={14} />
                                {customer.address}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Hash size={16} />
                          {customer.legal_id || '-'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User size={16} />
                          {customer.contact_name || '-'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone size={16} />
                          {customer.phone || '-'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail size={16} />
                          {customer.email || '-'}
                        </div>
                      </td>
                      <td className="p-4">
                        {customer.status && (
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[customer.status]?.bg} ${statusColors[customer.status]?.text} ${statusColors[customer.status]?.border}`}>
                            {customer.status}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          {new Date(customer.created_at).toLocaleDateString('he-IL')}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleEdit(customer)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            {expandedRows.has(customer.id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Row */}
                    {expandedRows.has(customer.id) && (
                      <tr key={`${customer.id}-expanded`}>
                        <td colSpan={8} className="p-6 bg-gray-50 border-b">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {customer.notes && (
                              <div>
                                <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                                  <FileText size={18} />
                                  הערות
                                </h4>
                                <p className="text-gray-600 bg-white p-4 rounded-lg">
                                  {customer.notes}
                                </p>
                              </div>
                            )}
                            
                            {/* Custom Fields */}
                            {customFields.length > 0 && (
                              <div>
                                <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                                  <Tag size={18} />
                                  שדות מותאמים
                                </h4>
                                <div className="bg-white p-4 rounded-lg space-y-2">
                                  {customFields.map(field => (
                                    <div key={field.id} className="flex justify-between">
                                      <span className="text-gray-600">{field.name}:</span>
                                      <span className="font-medium">
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
                  </>
                ))}
              </tbody>
            </table>

            {filteredCustomers.length === 0 && (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                  <User size={40} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">אין לקוחות להצגה</h3>
                <p className="text-gray-500">
                  {searchTerm || selectedStatus !== 'all' 
                    ? 'נסה לשנות את הסינון או החיפוש'
                    : 'התחל להוסיף לקוחות חדשים למערכת'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">
                    {editingCustomer ? 'עריכת לקוח' : 'לקוח חדש'}
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
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      שם החברה/לקוח *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="הזן שם חברה או לקוח"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ח.פ / ע.מ
                    </label>
                    <input
                      type="text"
                      value={formData.legal_id}
                      onChange={(e) => setFormData({...formData, legal_id: e.target.value})}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="מספר חברה או עוסק מורשה"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      איש קשר
                    </label>
                    <input
                      type="text"
                      value={formData.contact_name}
                      onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="שם איש הקשר"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      טלפון
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="מספר טלפון"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      אימייל
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="כתובת אימייל"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      כתובת
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="כתובת מלאה"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      סטטוס
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors bg-white"
                    >
                      {Object.keys(statusColors).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    הערות
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    placeholder="הערות נוספות..."
                  />
                </div>

                {/* Custom Fields */}
                {customFields.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-4">שדות מותאמים</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {customFields.map(field => (
                        <div key={field.id}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
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
                              className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors bg-white"
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
                              className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg"
                  >
                    {editingCustomer ? 'עדכן לקוח' : 'הוסף לקוח'}
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
                    className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">ניהול שדות מותאמים</h2>
                  <button
                    onClick={() => setShowFieldManager(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Add New Field */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-medium text-gray-700 mb-4">הוסף שדה חדש</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="שם השדה"
                      value={newField.name}
                      onChange={(e) => setNewField({...newField, name: e.target.value})}
                      className="px-4 py-2 border-2 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                    <select
                      value={newField.type}
                      onChange={(e) => setNewField({...newField, type: e.target.value as any})}
                      className="px-4 py-2 border-2 rounded-lg focus:outline-none focus:border-purple-500 bg-white"
                    >
                      <option value="text">טקסט</option>
                      <option value="number">מספר</option>
                      <option value="date">תאריך</option>
                      <option value="select">רשימה</option>
                    </select>
                  </div>
                  
                  {newField.type === 'select' && (
                    <div className="mt-4">
                      <input
                        type="text"
                        placeholder="אפשרויות (מופרדות בפסיקים)"
                        onChange={(e) => setNewField({
                          ...newField, 
                          options: e.target.value.split(',').map(o => o.trim())
                        })}
                        className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  )}
                  
                  <div className="mt-4 flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newField.required}
                        onChange={(e) => setNewField({...newField, required: e.target.checked})}
                        className="w-4 h-4 text-purple-600"
                      />
                      <span className="text-gray-700">שדה חובה</span>
                    </label>
                    
                    <button
                      onClick={saveCustomField}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      הוסף שדה
                    </button>
                  </div>
                </div>

                {/* Existing Fields */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-4">שדות קיימים</h3>
                  {customFields.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">אין שדות מותאמים</p>
                  ) : (
                    <div className="space-y-2">
                      {customFields.map(field => (
                        <div key={field.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <span className="font-medium text-gray-700">{field.name}</span>
                            <span className="text-gray-500 text-sm mr-2">({field.type})</span>
                            {field.required && (
                              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded mr-2">
                                חובה
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => deleteCustomField(field.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
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
      </div>
    </div>
  );
}
