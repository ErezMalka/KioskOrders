'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Plus, Trash2, Edit, Save, X, FileSpreadsheet, 
  Download, Search, Building2, User, Mail, Phone, MapPin, 
  Globe, Hash, Briefcase, CreditCard, Calendar, FileText, 
  Star, Check, AlertCircle, Sparkles, Users, Trophy, Zap, 
  Shield, TrendingUp, Target, Smartphone, Package
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
  const [isSuccess, setIsSuccess] = useState(false);
  const [touchedFields, setTouchedFields] = useState(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
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
    status: 'active',
    creditLimit: '',
    paymentTerms: '30',
    rating: 0
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
      customer.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm)
    );

    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => {
        if (statusFilter === 'פעיל') return customer.status === 'active' || customer.status === 'פעיל';
        if (statusFilter === 'לא פעיל') return customer.status === 'inactive' || customer.status === 'לא פעיל';
        if (statusFilter === 'פוטנציאלי') return customer.status === 'potential' || customer.status === 'פוטנציאלי';
        return false;
      });
    }

    setFilteredCustomers(filtered);
  }, [searchTerm, customers, statusFilter]);

  // ולידציה
  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };
    
    switch(name) {
      case 'businessName':
        if (!value) newErrors.businessName = 'חובה להזין שם עסק';
        else delete newErrors.businessName;
        break;
      case 'contactName':
        if (!value) newErrors.contactName = 'חובה להזין שם איש קשר';
        else delete newErrors.contactName;
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'כתובת אימייל לא תקינה';
        } else delete newErrors.email;
        break;
      case 'phone':
        if (value && !/^[0-9-+()]*$/.test(value)) {
          newErrors.phone = 'מספר טלפון לא תקין';
        } else delete newErrors.phone;
        break;
    }
    
    setErrors(newErrors);
  };

  const handleFieldTouch = (fieldName: string) => {
    setTouchedFields(prev => new Set([...prev, fieldName]));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touchedFields.has(name)) {
      validateField(name, value);
    }
  };

  // שמירת לקוחות ל-localStorage
  const saveCustomers = (newCustomers: any[]) => {
    localStorage.setItem('customers', JSON.stringify(newCustomers));
    setCustomers(newCustomers);
  };

  // הוספת לקוח חדש
  const addCustomer = () => {
    if (!formData.businessName || !formData.contactName) {
      setErrors({
        ...(!formData.businessName && { businessName: 'חובה להזין שם עסק' }),
        ...(!formData.contactName && { contactName: 'חובה להזין שם איש קשר' })
      });
      return;
    }
    
    const newCustomer = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString()
    };
    
    saveCustomers([...customers, newCustomer]);
    
    // הצגת אנימציית הצלחה
    setIsSuccess(true);
    setTimeout(() => {
      setShowAddModal(false);
      setIsSuccess(false);
      setCurrentStep(1);
      resetForm();
    }, 2000);
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
      status: 'active',
      creditLimit: '',
      paymentTerms: '30',
      rating: 0
    });
    setErrors({});
    setTouchedFields(new Set());
  };

  // עדכון לקוח
  const updateCustomer = (id: string) => {
    if (!formData.businessName || !formData.contactName) {
      setErrors({
        ...(!formData.businessName && { businessName: 'חובה להזין שם עסק' }),
        ...(!formData.contactName && { contactName: 'חובה להזין שם איש קשר' })
      });
      return;
    }
    
    const customerIndex = customers.findIndex(c => c.id === id);
    if (customerIndex !== -1) {
      const updatedCustomers = [...customers];
      updatedCustomers[customerIndex] = {
        ...updatedCustomers[customerIndex],
        ...formData
      };
      saveCustomers(updatedCustomers);
      
      setIsSuccess(true);
      setTimeout(() => {
        setShowAddModal(false);
        setEditingId(null);
        setIsSuccess(false);
        resetForm();
      }, 2000);
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
              status: values[14] || 'active',
              creditLimit: values[15] || '',
              paymentTerms: values[16] || '30',
              rating: 0,
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

  const nextStep = () => {
    if (currentStep === 1 && !formData.businessName) {
      setErrors({ businessName: 'חובה להזין שם עסק' });
      setTouchedFields(new Set(['businessName']));
      return;
    }
    if (currentStep === 2 && !formData.contactName) {
      setErrors({ contactName: 'חובה להזין שם איש קשר' });
      setTouchedFields(new Set(['contactName']));
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const businessTypes = [
    { value: 'tech', label: 'טכנולוגיה', icon: Zap, color: 'from-blue-500 to-cyan-500' },
    { value: 'retail', label: 'קמעונאות', icon: Package, color: 'from-purple-500 to-pink-500' },
    { value: 'services', label: 'שירותים', icon: Users, color: 'from-green-500 to-emerald-500' },
    { value: 'manufacturing', label: 'ייצור', icon: Building2, color: 'from-orange-500 to-red-500' },
    { value: 'finance', label: 'פיננסים', icon: TrendingUp, color: 'from-indigo-500 to-purple-500' },
    { value: 'other', label: 'אחר', icon: Briefcase, color: 'from-gray-500 to-gray-600' }
  ];

  const statusOptions = [
    { value: 'active', label: 'פעיל', icon: Check, color: 'bg-green-500' },
    { value: 'potential', label: 'פוטנציאלי', icon: Target, color: 'bg-yellow-500' },
    { value: 'inactive', label: 'לא פעיל', icon: X, color: 'bg-gray-400' }
  ];

  // קומפוננטת כרטיס לקוח
  const CustomerCard = ({ customer }: { customer: any }) => {
    const displayStatus = customer.status === 'active' ? 'פעיל' : 
                         customer.status === 'inactive' ? 'לא פעיל' : 
                         customer.status === 'potential' ? 'פוטנציאלי' : 
                         customer.status;
    
    return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {customer.businessName?.charAt(0) || '?'}
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800">{customer.businessName}</h3>
              <p className="text-sm text-gray-500">{customer.businessType || 'לא צוין'}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            (customer.status === 'active' || customer.status === 'פעיל') ? 'bg-green-100 text-green-700' :
            (customer.status === 'inactive' || customer.status === 'לא פעיל') ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {displayStatus}
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
  };

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
                {customers.length} לקוחות במערכת • {customers.filter(c => c.status === 'active' || c.status === 'פעיל').length} פעילים
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
                className="group relative px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-medium text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-3">
                  <Sparkles className="w-5 h-5" />
                  <span>הוסף לקוח חדש</span>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
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
                    filteredCustomers.map((customer, index) => {
                      const displayStatus = customer.status === 'active' ? 'פעיל' : 
                                          customer.status === 'inactive' ? 'לא פעיל' : 
                                          customer.status === 'potential' ? 'פוטנציאלי' : 
                                          customer.status;
                      
                      return (
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
                                {customer.businessName?.charAt(0) || '?'}
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
                              (customer.status === 'active' || customer.status === 'פעיל') ? 'bg-green-100 text-green-700' :
                              (customer.status === 'inactive' || customer.status === 'לא פעיל') ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {displayStatus}
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
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* מודל הוספת/עריכת לקוח מעוצב */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isSuccess && setShowAddModal(false)}
            />

            <div className={`relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl transform transition-all duration-500 ${showAddModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
              {isSuccess && (
                <div className="absolute inset-0 bg-white rounded-3xl z-50 flex flex-col items-center justify-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-bounce">
                    <Check className="w-16 h-16 text-white" strokeWidth={3} />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 mt-6">מעולה!</h3>
                  <p className="text-gray-600 mt-2">
                    {editingId ? 'הלקוח עודכן בהצלחה' : 'הלקוח נוסף בהצלחה למערכת'}
                  </p>
                </div>
              )}

              <div className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-600 p-8 rounded-t-3xl">
                <button
                  onClick={() => {
                    if (!isSuccess) {
                      setShowAddModal(false);
                      setEditingId(null);
                      resetForm();
                      setCurrentStep(1);
                    }
                  }}
                  className="absolute top-6 left-6 w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>

                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur rounded-2xl mb-4">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {editingId ? 'עריכת לקוח' : 'לקוח חדש'}
                  </h2>
                  <p className="text-white/80">מלא את הפרטים כדי {editingId ? 'לעדכן' : 'להוסיף'} את הלקוח</p>
                </div>

                {!editingId && (
                  <>
                    <div className="flex items-center justify-center mt-8 gap-3">
                      {[1, 2, 3].map((step) => (
                        <div key={step} className="flex items-center">
                          <div 
                            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                              currentStep >= step 
                                ? 'bg-white text-indigo-600 scale-110' 
                                : 'bg-white/20 text-white/60 scale-100'
                            }`}
                          >
                            {currentStep > step ? <Check className="w-5 h-5" /> : step}
                          </div>
                          {step < 3 && (
                            <div className={`w-20 h-1 mx-2 rounded-full transition-all duration-300 ${
                              currentStep > step ? 'bg-white' : 'bg-white/30'
                            }`} />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="text-center mt-4">
                      <p className="text-white/90 font-medium">
                        {currentStep === 1 && 'פרטי העסק'}
                        {currentStep === 2 && 'איש קשר'}
                        {currentStep === 3 && 'פרטים נוספים'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto">
                {/* Step 1: Business Details */}
                {(currentStep === 1 || editingId) && (
                  <div className="space-y-6">
                    {editingId && (
                      <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                        פרטי העסק
                      </h3>
                    )}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        שם העסק *
                      </label>
                      <input
                        type="text"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleChange}
                        onBlur={() => handleFieldTouch('businessName')}
                        className={`w-full px-5 py-4 text-lg border-2 rounded-2xl focus:outline-none transition-all duration-300 ${
                          errors.businessName && touchedFields.has('businessName')
                            ? 'border-red-300 bg-red-50 focus:border-red-500' 
                            : 'border-gray-200 hover:border-gray-300 focus:border-indigo-500 focus:bg-indigo-50/30'
                        }`}
                        placeholder="לדוגמה: חברת הייטק בע״מ"
                      />
                      {errors.businessName && touchedFields.has('businessName') && (
                        <p className="mt-2 text-red-500 text-sm flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.businessName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                        <Briefcase className="w-4 h-4 text-indigo-600" />
                        סוג העסק
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {businessTypes.map((type) => {
                          const Icon = type.icon;
                          return (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => setFormData({...formData, businessType: type.value})}
                              className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                                formData.businessType === type.value
                                  ? 'border-indigo-500 bg-gradient-to-br ' + type.color + ' text-white shadow-lg scale-105'
                                  : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
                              }`}
                            >
                              <Icon className={`w-6 h-6 mx-auto mb-2 ${
                                formData.businessType === type.value ? 'text-white' : 'text-gray-600'
                              }`} />
                              <p className={`text-sm font-medium ${
                                formData.businessType === type.value ? 'text-white' : 'text-gray-700'
                              }`}>
                                {type.label}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                          <Hash className="w-4 h-4 text-indigo-600" />
                          ח.פ / ע.מ
                        </label>
                        <input
                          type="text"
                          name="taxId"
                          value={formData.taxId}
                          onChange={handleChange}
                          className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-2xl hover:border-gray-300 focus:outline-none focus:border-indigo-500 focus:bg-indigo-50/30 transition-all duration-300"
                          placeholder="514234567"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                          <Globe className="w-4 h-4 text-indigo-600" />
                          אתר אינטרנט
                        </label>
                        <input
                          type="url"
                          name="website"
                          value={formData.website}
                          onChange={handleChange}
                          className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-2xl hover:border-gray-300 focus:outline-none focus:border-indigo-500 focus:bg-indigo-50/30 transition-all duration-300"
                          placeholder="www.example.com"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Contact Details */}
                {(currentStep === 2 || editingId) && (
                  <div className="space-y-6">
                    {editingId && (
                      <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2 mt-6">
                        <User className="w-5 h-5 text-indigo-600" />
                        פרטי איש קשר
                      </h3>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                          <User className="w-4 h-4 text-indigo-600" />
                          שם מלא *
                        </label>
                        <input
                          type="text"
                          name="contactName"
                          value={formData.contactName}
                          onChange={handleChange}
                          onBlur={() => handleFieldTouch('contactName')}
                          className={`w-full px-5 py-4 text-lg border-2 rounded-2xl focus:outline-none transition-all duration-300 ${
                            errors.contactName && touchedFields.has('contactName')
                              ? 'border-red-300 bg-red-50 focus:border-red-500' 
                              : 'border-gray-200 hover:border-gray-300 focus:border-indigo-500 focus:bg-indigo-50/30'
                          }`}
                          placeholder="ישראל ישראלי"
                        />
                        {errors.contactName && touchedFields.has('contactName') && (
                          <p className="mt-2 text-red-500 text-sm flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.contactName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                          <Briefcase className="w-4 h-4 text-indigo-600" />
                          תפקיד
                        </label>
                        <input
                          type="text"
                          name="contactTitle"
                          value={formData.contactTitle}
                          onChange={handleChange}
                          className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-2xl hover:border-gray-300 focus:outline-none focus:border-indigo-500 focus:bg-indigo-50/30 transition-all duration-300"
                          placeholder="מנכ״ל / סמנכ״ל מכירות"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                        <Mail className="w-4 h-4 text-indigo-600" />
                        כתובת אימייל
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={() => handleFieldTouch('email')}
                        className={`w-full px-5 py-4 text-lg border-2 rounded-2xl focus:outline-none transition-all duration-300 ${
                          errors.email && touchedFields.has('email')
                            ? 'border-red-300 bg-red-50 focus:border-red-500' 
                            : 'border-gray-200 hover:border-gray-300 focus:border-indigo-500 focus:bg-indigo-50/30'
                        }`}
                        placeholder="israel@company.com"
                        dir="ltr"
                      />
                      {errors.email && touchedFields.has('email') && (
                        <p className="mt-2 text-red-500 text-sm flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                          <Phone className="w-4 h-4 text-indigo-600" />
                          טלפון משרד
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          onBlur={() => handleFieldTouch('phone')}
                          className={`w-full px-5 py-4 text-lg border-2 rounded-2xl focus:outline-none transition-all duration-300 ${
                            errors.phone && touchedFields.has('phone')
                              ? 'border-red-300 bg-red-50 focus:border-red-500' 
                              : 'border-gray-200 hover:border-gray-300 focus:border-indigo-500 focus:bg-indigo-50/30'
                          }`}
                          placeholder="03-1234567"
                          dir="ltr"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                          <Smartphone className="w-4 h-4 text-indigo-600" />
                          טלפון נייד
                        </label>
                        <input
                          type="tel"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleChange}
                          className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-2xl hover:border-gray-300 focus:outline-none focus:border-indigo-500 focus:bg-indigo-50/30 transition-all duration-300"
                          placeholder="050-1234567"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
                      <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-indigo-600" />
                        כתובת
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          className="md:col-span-2 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 focus:outline-none focus:border-indigo-500 transition-all duration-300"
                          placeholder="רחוב ומספר"
                        />
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 focus:outline-none focus:border-indigo-500 transition-all duration-300"
                          placeholder="עיר"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Additional Details */}
                {(currentStep === 3 || editingId) && (
                  <div className="space-y-6">
                    {editingId && (
                      <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2 mt-6">
                        <Package className="w-5 h-5 text-indigo-600" />
                        פרטים נוספים
                      </h3>
                    )}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                        <Shield className="w-4 h-4 text-indigo-600" />
                        סטטוס לקוח
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {statusOptions.map((status) => {
                          const Icon = status.icon;
                          return (
                            <button
                              key={status.value}
                              type="button"
                              onClick={() => setFormData({...formData, status: status.value})}
                              className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                                formData.status === status.value
                                  ? 'border-indigo-500 bg-indigo-50 shadow-md scale-105'
                                  : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                              }`}
                            >
                              <div className={`w-8 h-8 ${status.color} rounded-full mx-auto mb-2 flex items-center justify-center`}>
                                <Icon className="w-4 h-4 text-white" />
                              </div>
                              <p className="text-sm font-medium text-gray-700">{status.label}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                        <Star className="w-4 h-4 text-indigo-600" />
                        דירוג לקוח
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFormData({...formData, rating: star})}
                            className="transition-all duration-300 transform hover:scale-110"
                          >
                            <Star 
                              className={`w-10 h-10 ${
                                formData.rating >= star 
                                  ? 'text-yellow-400 fill-yellow-400' 
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                          תנאי תשלום
                        </label>
                        <select
                          name="paymentTerms"
                          value={formData.paymentTerms}
                          onChange={handleChange}
                          className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-2xl hover:border-gray-300 focus:outline-none focus:border-indigo-500 focus:bg-indigo-50/30 transition-all duration-300 cursor-pointer"
                        >
                          <option value="0">מזומן</option>
                          <option value="30">שוטף + 30</option>
                          <option value="45">שוטף + 45</option>
                          <option value="60">שוטף + 60</option>
                          <option value="90">שוטף + 90</option>
                        </select>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                          <CreditCard className="w-4 h-4 text-indigo-600" />
                          מסגרת אשראי
                        </label>
                        <input
                          type="number"
                          name="creditLimit"
                          value={formData.creditLimit}
                          onChange={handleChange}
                          className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-2xl hover:border-gray-300 focus:outline-none focus:border-indigo-500 focus:bg-indigo-50/30 transition-all duration-300"
                          placeholder="50,000 ₪"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        הערות
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-2xl hover:border-gray-300 focus:outline-none focus:border-indigo-500 focus:bg-indigo-50/30 transition-all duration-300 resize-none"
                        placeholder="הערות נוספות על הלקוח..."
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-8 border-t border-gray-100">
                {!editingId ? (
                  <>
                    <button
                      onClick={prevStep}
                      disabled={currentStep === 1}
                      className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
                        currentStep === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md transform hover:scale-105'
                      }`}
                    >
                      הקודם
                    </button>

                    <div className="flex items-center gap-2">
                      {[1, 2, 3].map((dot) => (
                        <div
                          key={dot}
                          className={`transition-all duration-300 ${
                            currentStep === dot
                              ? 'w-8 h-2 bg-indigo-600 rounded-full'
                              : 'w-2 h-2 bg-gray-300 rounded-full'
                          }`}
                        />
                      ))}
                    </div>

                    {currentStep < 3 ? (
                      <button
                        onClick={nextStep}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-medium hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                      >
                        הבא
                      </button>
                    ) : (
                      <button
                        onClick={addCustomer}
                        className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-medium hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                      >
                        <Check className="w-5 h-5" />
                        סיים והוסף
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
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-2xl font-medium hover:bg-gray-300 hover:shadow-md transform hover:scale-105 transition-all duration-300"
                    >
                      ביטול
                    </button>
                    
                    <button
                      onClick={() => updateCustomer(editingId)}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-medium hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      שמור שינויים
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
