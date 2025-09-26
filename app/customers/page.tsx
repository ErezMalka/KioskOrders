'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Plus, Trash2, Edit, Save, X, FileSpreadsheet, 
  Download, Search, Filter, Building2, User, Mail, 
  Phone, MapPin, FileText, Package, Calendar, CheckCircle,
  AlertCircle, Clock, ChevronDown, Users, Eye
} from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [currentStep, setCurrentStep] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    // פרטי עסק
    businessName: '',
    businessType: '',
    taxId: '',
    website: '',
    
    // פרטי איש קשר
    contactName: '',
    contactTitle: '',
    email: '',
    phone: '',
    mobile: '',
    
    // כתובת
    address: '',
    city: '',
    zipCode: '',
    
    // פרטים נוספים
    products: '',
    notes: '',
    status: 'פעיל',
    creditLimit: '',
    paymentTerms: '30',
  });

  const [errors, setErrors] = useState<any>({});

  // טעינת לקוחות מ-localStorage
  useEffect(() => {
    const savedCustomers = localStorage.getItem('customers');
    if (savedCustomers) {
      const parsed = JSON.parse(savedCustomers);
      setCustomers(parsed);
      setFilteredCustomers(parsed);
    }
  }, []);

  // חיפוש וסינון
  useEffect(() => {
    let filtered = customers.filter(customer => 
      customer.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
    );

    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }

    setFilteredCustomers(filtered);
  }, [searchTerm, customers, statusFilter]);

  // ולידציה
  const validateForm = () => {
    const newErrors: any = {};
    
    if (!formData.businessName) newErrors.businessName = 'שם העסק הוא שדה חובה';
    if (!formData.contactName) newErrors.contactName = 'שם איש הקשר הוא שדה חובה';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'כתובת אימייל לא תקינה';
    }
    if (formData.phone && !/^[0-9-+()]*$/.test(formData.phone)) {
      newErrors.phone = 'מספר טלפון לא תקין';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // שמירת לקוחות ל-localStorage
  const saveCustomers = (newCustomers: any[]) => {
    localStorage.setItem('customers', JSON.stringify(newCustomers));
    setCustomers(newCustomers);
  };

  // הוספת לקוח חדש
  const addCustomer = () => {
    if (!validateForm()) {
      return;
    }
    
    const newCustomer = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString()
    };
    
    saveCustomers([...customers, newCustomer]);
    resetForm();
    setShowAddModal(false);
    setCurrentStep(1);
  };

  // איפוס טופס
  const resetForm = () => {
    setFormData({
      businessName: '',
      businessType: '',
      taxId: '',
      website: '',
      contactName: '',
      contactTitle: '',
      email: '',
      phone: '',
      mobile: '',
      address: '',
      city: '',
      zipCode: '',
      products: '',
      notes: '',
      status: 'פעיל',
      creditLimit: '',
      paymentTerms: '30',
    });
    setErrors({});
  };

  // עדכון לקוח
  const updateCustomer = (id: string) => {
    if (!validateForm()) return;
    
    const customerIndex = customers.findIndex(c => c.id === id);
    if (customerIndex !== -1) {
      const updatedCustomers = [...customers];
      updatedCustomers[customerIndex] = {
        ...updatedCustomers[customerIndex],
        ...formData
      };
      saveCustomers(updatedCustomers);
      setEditingId(null);
      resetForm();
    }
  };

  // מחיקת לקוח
  const deleteCustomer = (id: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק לקוח זה?')) {
      saveCustomers(customers.filter(c => c.id !== id));
    }
  };

  // מחיקת לקוחות מרובים
  const deleteSelectedCustomers = () => {
    if (selectedCustomers.length === 0) return;
    
    if (window.confirm(`האם אתה בטוח שברצונך למחוק ${selectedCustomers.length} לקוחות?`)) {
      saveCustomers(customers.filter(c => !selectedCustomers.includes(c.id)));
      setSelectedCustomers([]);
    }
  };

  // התחלת עריכה
  const startEdit = (customer: any) => {
    setFormData(customer);
    setShowAddModal(true);
    setEditingId(customer.id);
  };

  // קריאת קובץ אקסל
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        
        const newCustomers: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim());
            const customer = {
              id: Date.now().toString() + i,
              businessName: values[0] || '',
              businessType: values[1] || '',
              taxId: values[2] || '',
              website: values[3] || '',
              contactName: values[4] || '',
              contactTitle: values[5] || '',
              email: values[6] || '',
              phone: values[7] || '',
              mobile: values[8] || '',
              address: values[9] || '',
              city: values[10] || '',
              zipCode: values[11] || '',
              products: values[12] || '',
              notes: values[13] || '',
              status: values[14] || 'פעיל',
              creditLimit: values[15] || '',
              paymentTerms: values[16] || '30',
              createdAt: new Date().toISOString()
            };
            newCustomers.push(customer);
          }
        }
        
        if (newCustomers.length > 0) {
          saveCustomers([...customers, ...newCustomers]);
          alert(`נוספו ${newCustomers.length} לקוחות בהצלחה!`);
        }
      } catch (error) {
        alert('שגיאה בקריאת הקובץ. נא לוודא שהקובץ בפורמט CSV');
      }
    };
    
    reader.readAsText(file);
    e.target.value = '';
  };

  // ייצוא לאקסל
  const exportToExcel = () => {
    const headers = [
      'שם עסק', 'סוג עסק', 'ח.פ/ע.מ', 'אתר', 'איש קשר', 'תפקיד',
      'אימייל', 'טלפון', 'נייד', 'כתובת', 'עיר', 'מיקוד',
      'מוצרים', 'הערות', 'סטטוס', 'מסגרת אשראי', 'תנאי תשלום'
    ];
    const csvContent = [
      headers.join(','),
      ...customers.map(c => [
        c.businessName, c.businessType, c.taxId, c.website,
        c.contactName, c.contactTitle, c.email, c.phone, c.mobile,
        c.address, c.city, c.zipCode, c.products, c.notes,
        c.status, c.creditLimit, c.paymentTerms
      ].join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // בחירת לקוח
  const toggleSelectCustomer = (id: string) => {
    setSelectedCustomers(prev => 
      prev.includes(id) 
        ? prev.filter(cId => cId !== id)
        : [...prev, id]
    );
  };

  // בחירת כל הלקוחות
  const toggleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    }
  };

  // קומפוננטת כרטיס לקוח
  const CustomerCard = ({ customer }: { customer: any }) => (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {customer.businessName.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-800">{customer.businessName}</h3>
            <p className="text-sm text-gray-500">{customer.businessType || 'לא צוין'}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          customer.status === 'פעיל' ? 'bg-green-100 text-green-700' :
          customer.status === 'לא פעיל' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {customer.status}
        </span>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User size={14} />
          <span>{customer.contactName}</span>
          {customer.contactTitle && <span className="text-gray-400">• {customer.contactTitle}</span>}
        </div>
        {customer.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail size={14} />
            <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
              {customer.email}
            </a>
          </div>
        )}
        {customer.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone size={14} />
            <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">
              {customer.phone}
            </a>
          </div>
        )}
        {customer.city && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={14} />
            <span>{customer.city}</span>
          </div>
        )}
      </div>
      
      <div className="flex gap-2 pt-3 border-t">
        <button
          onClick={() => startEdit(customer)}
          className="flex-1 bg-blue-50 text-blue-600 py-2 px-3 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
        >
          עריכה
        </button>
        <button
          onClick={() => deleteCustomer(customer.id)}
          className="flex-1 bg-red-50 text-red-600 py-2 px-3 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
        >
          מחיקה
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* כותרת ראשית */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                ניהול לקוחות
              </h1>
              <p className="text-gray-500">
                {customers.length} לקוחות במערכת • {filteredCustomers.filter(c => c.status === 'פעיל').length} פעילים
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                title={viewMode === 'grid' ? 'תצוגת טבלה' : 'תצוגת כרטיסים'}
              >
                {viewMode === 'grid' ? '☰' : '⊞'}
              </button>
            </div>
          </div>
          
          {/* כלי עבודה */}
          <div className="flex flex-wrap gap-3 mb-6 items-center justify-between">
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg"
              >
                <Plus size={20} />
                לקוח חדש
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg"
              >
                <Upload size={20} />
                ייבוא מאקסל
              </button>
              
              <button
                onClick={exportToExcel}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg"
              >
                <Download size={20} />
                ייצוא לאקסל
              </button>
              
              {selectedCustomers.length > 0 && (
                <button
                  onClick={deleteSelectedCustomers}
                  className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg"
                >
                  <Trash2 size={20} />
                  מחק נבחרים ({selectedCustomers.length})
                </button>
              )}
            </div>
            
            {/* חיפוש וסינון */}
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="all">כל הסטטוסים</option>
                <option value="פעיל">פעיל</option>
                <option value="לא פעיל">לא פעיל</option>
                <option value="פוטנציאלי">פוטנציאלי</option>
              </select>
              
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="חיפוש לקוחות..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 pl-4 py-3 border-2 rounded-xl w-64 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleExcelUpload}
            className="hidden"
          />
        </div>
        
        {/* תצוגת כרטיסים */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Users size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-xl text-gray-500">אין לקוחות במערכת</p>
                <p className="text-gray-400 mt-2">התחל בהוספת לקוח חדש או ייבוא מאקסל</p>
              </div>
            ) : (
              filteredCustomers.map(customer => (
                <CustomerCard key={customer.id} customer={customer} />
              ))
            )}
          </div>
        ) : (
          /* טבלת לקוחות */
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <tr>
                    <th className="p-4 text-right">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                        onChange={toggleSelectAll}
                        className="w-5 h-5 rounded"
                      />
                    </th>
                    <th className="p-4 text-right font-semibold text-gray-700">שם העסק</th>
                    <th className="p-4 text-right font-semibold text-gray-700">איש קשר</th>
                    <th className="p-4 text-right font-semibold text-gray-700">אימייל</th>
                    <th className="p-4 text-right font-semibold text-gray-700">טלפון</th>
                    <th className="p-4 text-right font-semibold text-gray-700">עיר</th>
                    <th className="p-4 text-right font-semibold text-gray-700">סטטוס</th>
                    <th className="p-4 text-right font-semibold text-gray-700">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center p-12">
                        <Users size={64} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-xl text-gray-500">אין לקוחות במערכת</p>
                        <p className="text-gray-400 mt-2">התחל בהוספת לקוח חדש או ייבוא מאקסל</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer, index) => (
                      <tr key={customer.id} className={`border-b hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedCustomers.includes(customer.id)}
                            onChange={() => toggleSelectCustomer(customer.id)}
                            className="w-5 h-5 rounded"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                              {customer.businessName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">{customer.businessName}</div>
                              {customer.businessType && (
                                <div className="text-xs text-gray-500">{customer.businessType}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>{customer.contactName}</div>
                          {customer.contactTitle && (
                            <div className="text-xs text-gray-500">{customer.contactTitle}</div>
                          )}
                        </td>
                        <td className="p-4">
                          {customer.email && (
                            <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                              {customer.email}
                            </a>
                          )}
                        </td>
                        <td className="p-4">
                          {customer.phone && (
                            <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">
                              {customer.phone}
                            </a>
                          )}
                        </td>
                        <td className="p-4">{customer.city || '-'}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            customer.status === 'פעיל' ? 'bg-green-100 text-green-700' :
                            customer.status === 'לא פעיל' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {customer.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(customer)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="עריכה"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => deleteCustomer(customer.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="מחיקה"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* מודל הוספת/עריכת לקוח */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* כותרת המודל */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white">
                    {editingId ? 'עריכת לקוח' : 'הוספת לקוח חדש'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingId(null);
                      resetForm();
                      setCurrentStep(1);
                    }}
                    className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                {/* מעקב שלבים */}
                {!editingId && (
                  <div className="flex items-center justify-center mt-6 gap-4">
                    <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-white' : 'text-white/50'}`}>
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${currentStep >= 1 ? 'bg-white text-blue-600 border-white' : 'border-white/50'}`}>
                        1
                      </div>
                      <span>פרטי עסק</span>
                    </div>
                    <div className={`h-px w-16 ${currentStep >= 2 ? 'bg-white' : 'bg-white/30'}`} />
                    <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-white' : 'text-white/50'}`}>
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${currentStep >= 2 ? 'bg-white text-blue-600 border-white' : 'border-white/50'}`}>
                        2
                      </div>
                      <span>איש קשר</span>
                    </div>
                    <div className={`h-px w-16 ${currentStep >= 3 ? 'bg-white' : 'bg-white/30'}`} />
                    <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-white' : 'text-white/50'}`}>
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${currentStep >= 3 ? 'bg-white text-blue-600 border-white' : 'border-white/50'}`}>
                        3
                      </div>
                      <span>פרטים נוספים</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* תוכן המודל */}
              <div className="p-6">
                {/* שלב 1: פרטי עסק */}
                {(currentStep === 1 || editingId) && (
                  <div className={editingId ? '' : 'space-y-6'}>
                    <div className={editingId ? 'mb-6' : ''}>
                      <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <Building2 size={20} />
                        פרטי העסק
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            שם העסק *
                          </label>
                          <input
                            type="text"
                            value={formData.businessName}
                            onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors ${errors.businessName ? 'border-red-500' : 'border-gray-200'}`}
                            placeholder="הזן שם עסק"
                          />
                          {errors.businessName && (
                            <p className="text-red-500 text-xs mt-1">{errors.businessName}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            סוג העסק
                          </label>
                          <select
                            value={formData.businessType}
                            onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                            className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors border-gray-200"
                          >
                            <option value="">בחר סוג עסק</option>
                            <option value="חברה פרטית">חברה פרטית</option>
                            <option value="חברה ציבורית">חברה ציבורית</option>
                            <option value="עוסק מורשה">עוסק מורשה</option>
                            <option value="עמותה">עמותה</option>
                            <option value="אחר">אחר</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ח.פ / ע.מ
                          </label>
                          <input
                            type="text"
                            value={formData.taxId}
                            onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                            className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors border-gray-200"
                            placeholder="הזן מספר ח.פ או ע.מ"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            אתר אינטרנט
                          </label>
                          <input
                            type="url"
                            value={formData.website}
                            onChange={(e) => setFormData({...formData, website: e.target.value})}
                            className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors border-gray-200"
                            placeholder="https://www.example.com"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* שלב 2: איש קשר */}
                {(currentStep === 2 || editingId) && (
                  <div className={editingId ? 'mb-6' : ''}>
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <User size={20} />
                      פרטי איש קשר
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          שם מלא *
                        </label>
                        <input
                          type="text"
                          value={formData.contactName}
                          onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors ${errors.contactName ? 'border-red-500' : 'border-gray-200'}`}
                          placeholder="הזן שם איש קשר"
                        />
                        {errors.contactName && (
                          <p className="text-red-500 text-xs mt-1">{errors.contactName}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          תפקיד
                        </label>
                        <input
                          type="text"
                          value={formData.contactTitle}
                          onChange={(e) => setFormData({...formData, contactTitle: e.target.value})}
                          className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors border-gray-200"
                          placeholder="מנכ״ל, סמנכ״ל מכירות..."
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
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors ${errors.email ? 'border-red-500' : 'border-gray-200'}`}
                          placeholder="example@company.com"
                        />
                        {errors.email && (
                          <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          טלפון
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors ${errors.phone ? 'border-red-500' : 'border-gray-200'}`}
                          placeholder="03-1234567"
                        />
                        {errors.phone && (
                          <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          נייד
                        </label>
                        <input
                          type="tel"
                          value={formData.mobile}
                          onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                          className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors border-gray-200"
                          placeholder="050-1234567"
                        />
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 mt-6 flex items-center gap-2">
                      <MapPin size={20} />
                      כתובת
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          רחוב ומספר
                        </label>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors border-gray-200"
                          placeholder="רחוב הרצל 1"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          עיר
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({...formData, city: e.target.value})}
                          className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors border-gray-200"
                          placeholder="תל אביב"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          מיקוד
                        </label>
                        <input
                          type="text"
                          value={formData.zipCode}
                          onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                          className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors border-gray-200"
                          placeholder="6100101"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* שלב 3: פרטים נוספים */}
                {(currentStep === 3 || editingId) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <Package size={20} />
                      פרטים עסקיים
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          מוצרים/שירותים קיימים
                        </label>
                        <textarea
                          value={formData.products}
                          onChange={(e) => setFormData({...formData, products: e.target.value})}
                          className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors border-gray-200 resize-none"
                          rows={3}
                          placeholder="פרט מוצרים או שירותים שהלקוח רוכש"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          הערות
                        </label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({...formData, notes: e.target.value})}
                          className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors border-gray-200 resize-none"
                          rows={3}
                          placeholder="הערות נוספות על הלקוח"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          סטטוס
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                          className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors border-gray-200"
                        >
                          <option value="פעיל">פעיל</option>
                          <option value="לא פעיל">לא פעיל</option>
                          <option value="פוטנציאלי">פוטנציאלי</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          תנאי תשלום
                        </label>
                        <select
                          value={formData.paymentTerms}
                          onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}
                          className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors border-gray-200"
                        >
                          <option value="0">מזומן</option>
                          <option value="30">שוטף + 30</option>
                          <option value="45">שוטף + 45</option>
                          <option value="60">שוטף + 60</option>
                          <option value="90">שוטף + 90</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          מסגרת אשראי
                        </label>
                        <input
                          type="number"
                          value={formData.creditLimit}
                          onChange={(e) => setFormData({...formData, creditLimit: e.target.value})}
                          className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-colors border-gray-200"
                          placeholder="50000"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* כפתורי ניווט */}
                <div className="flex justify-between mt-8">
                  {!editingId ? (
                    <>
                      <button
                        onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                        disabled={currentStep === 1}
                        className={`px-6 py-3 rounded-xl font-medium transition-all ${
                          currentStep === 1 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        הקודם
                      </button>
                      
                      {currentStep < 3 ? (
                        <button
                          onClick={() => {
                            if (currentStep === 1 && !formData.businessName) {
                              setErrors({ businessName: 'שם העסק הוא שדה חובה' });
                              return;
                            }
                            if (currentStep === 2 && !formData.contactName) {
                              setErrors({ contactName: 'שם איש הקשר הוא שדה חובה' });
                              return;
                            }
                            setErrors({});
                            setCurrentStep(currentStep + 1);
                          }}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                        >
                          הבא
                        </button>
                      ) : (
                        <button
                          onClick={addCustomer}
                          className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all flex items-center gap-2"
                        >
                          <CheckCircle size={20} />
                          סיים והוסף לקוח
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setShowAddModal(false);
                          setEditingId(null);
                          resetForm();
                        }}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-all"
                      >
                        ביטול
                      </button>
                      
                      <button
                        onClick={() => updateCustomer(editingId)}
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2"
                      >
                        <Save size={20} />
                        שמור שינויים
                      </button>
                    </>
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
