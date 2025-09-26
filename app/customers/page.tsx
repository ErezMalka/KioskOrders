'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, Plus, Trash2, Edit, Save, X, FileSpreadsheet, Download, Search, Filter } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    products: '',
    notes: '',
    status: 'פעיל'
  });

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
    const filtered = customers.filter(customer => 
      customer.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  // שמירת לקוחות ל-localStorage
  const saveCustomers = (newCustomers: any[]) => {
    localStorage.setItem('customers', JSON.stringify(newCustomers));
    setCustomers(newCustomers);
  };

  // הוספת לקוח חדש
  const addCustomer = () => {
    if (!formData.businessName || !formData.contactName) {
      alert('נא למלא שם עסק ושם איש קשר');
      return;
    }
    
    const newCustomer = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString()
    };
    
    saveCustomers([...customers, newCustomer]);
    setFormData({
      businessName: '',
      contactName: '',
      email: '',
      phone: '',
      address: '',
      taxId: '',
      products: '',
      notes: '',
      status: 'פעיל'
    });
    setShowAddForm(false);
  };

  // עדכון לקוח
  const updateCustomer = (id: string) => {
    const customerIndex = customers.findIndex(c => c.id === id);
    if (customerIndex !== -1) {
      const updatedCustomers = [...customers];
      updatedCustomers[customerIndex] = {
        ...updatedCustomers[customerIndex],
        ...formData
      };
      saveCustomers(updatedCustomers);
      setEditingId(null);
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
    setEditingId(customer.id);
    setFormData({
      businessName: customer.businessName,
      contactName: customer.contactName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      taxId: customer.taxId,
      products: customer.products,
      notes: customer.notes,
      status: customer.status
    });
  };

  // ביטול עריכה
  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      businessName: '',
      contactName: '',
      email: '',
      phone: '',
      address: '',
      taxId: '',
      products: '',
      notes: '',
      status: 'פעיל'
    });
  };

  // קריאת קובץ אקסל
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        // כאן בדרך כלל משתמשים בספריית XLSX, אבל לצורך הדוגמה נעשה פרסור פשוט של CSV
        const text = event.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const newCustomers: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim());
            const customer = {
              id: Date.now().toString() + i,
              businessName: values[0] || '',
              contactName: values[1] || '',
              email: values[2] || '',
              phone: values[3] || '',
              address: values[4] || '',
              taxId: values[5] || '',
              products: values[6] || '',
              notes: values[7] || '',
              status: values[8] || 'פעיל',
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
    e.target.value = ''; // איפוס הקלט
  };

  // ייצוא לאקסל (CSV)
  const exportToExcel = () => {
    const headers = ['שם עסק', 'איש קשר', 'אימייל', 'טלפון', 'כתובת', 'ח.פ/ע.מ', 'מוצרים', 'הערות', 'סטטוס'];
    const csvContent = [
      headers.join(','),
      ...customers.map(c => [
        c.businessName,
        c.contactName,
        c.email,
        c.phone,
        c.address,
        c.taxId,
        c.products,
        c.notes,
        c.status
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">ניהול לקוחות</h1>
          
          {/* כלי עבודה */}
          <div className="flex flex-wrap gap-3 mb-6 items-center justify-between">
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus size={20} />
                לקוח חדש
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Upload size={20} />
                ייבוא מאקסל
              </button>
              
              <button
                onClick={exportToExcel}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Download size={20} />
                ייצוא לאקסל
              </button>
              
              {selectedCustomers.length > 0 && (
                <button
                  onClick={deleteSelectedCustomers}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Trash2 size={20} />
                  מחק נבחרים ({selectedCustomers.length})
                </button>
              )}
            </div>
            
            {/* חיפוש */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="חיפוש לקוחות..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 pl-4 py-2 border rounded-lg w-64"
              />
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleExcelUpload}
            className="hidden"
          />
          
          {/* טופס הוספת לקוח */}
          {showAddForm && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-bold text-lg mb-4">הוספת לקוח חדש</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="שם העסק *"
                  value={formData.businessName}
                  onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="שם איש קשר *"
                  value={formData.contactName}
                  onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="email"
                  placeholder="אימייל"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="tel"
                  placeholder="טלפון"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="כתובת"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="ח.פ / ע.מ"
                  value={formData.taxId}
                  onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="מוצרים קיימים"
                  value={formData.products}
                  onChange={(e) => setFormData({...formData, products: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="הערות"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                />
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="פעיל">פעיל</option>
                  <option value="לא פעיל">לא פעיל</option>
                  <option value="פוטנציאלי">פוטנציאלי</option>
                </select>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={addCustomer}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Save size={20} />
                  שמור
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({
                      businessName: '',
                      contactName: '',
                      email: '',
                      phone: '',
                      address: '',
                      taxId: '',
                      products: '',
                      notes: '',
                      status: 'פעיל'
                    });
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <X size={20} />
                  ביטול
                </button>
              </div>
            </div>
          )}
          
          {/* טבלת לקוחות */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-right">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-3 text-right font-semibold">שם העסק</th>
                  <th className="p-3 text-right font-semibold">איש קשר</th>
                  <th className="p-3 text-right font-semibold">אימייל</th>
                  <th className="p-3 text-right font-semibold">טלפון</th>
                  <th className="p-3 text-right font-semibold">כתובת</th>
                  <th className="p-3 text-right font-semibold">מוצרים</th>
                  <th className="p-3 text-right font-semibold">סטטוס</th>
                  <th className="p-3 text-right font-semibold">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center p-8 text-gray-500">
                      אין לקוחות במערכת
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map(customer => (
                    <tr key={customer.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={() => toggleSelectCustomer(customer.id)}
                        />
                      </td>
                      <td className="p-3">
                        {editingId === customer.id ? (
                          <input
                            type="text"
                            value={formData.businessName}
                            onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                            className="px-2 py-1 border rounded"
                          />
                        ) : (
                          <span className="font-medium">{customer.businessName}</span>
                        )}
                      </td>
                      <td className="p-3">
                        {editingId === customer.id ? (
                          <input
                            type="text"
                            value={formData.contactName}
                            onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                            className="px-2 py-1 border rounded"
                          />
                        ) : (
                          customer.contactName
                        )}
                      </td>
                      <td className="p-3">
                        {editingId === customer.id ? (
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="px-2 py-1 border rounded"
                          />
                        ) : (
                          <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                            {customer.email}
                          </a>
                        )}
                      </td>
                      <td className="p-3">
                        {editingId === customer.id ? (
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="px-2 py-1 border rounded"
                          />
                        ) : (
                          <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">
                            {customer.phone}
                          </a>
                        )}
                      </td>
                      <td className="p-3">
                        {editingId === customer.id ? (
                          <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            className="px-2 py-1 border rounded"
                          />
                        ) : (
                          customer.address
                        )}
                      </td>
                      <td className="p-3">
                        {editingId === customer.id ? (
                          <input
                            type="text"
                            value={formData.products}
                            onChange={(e) => setFormData({...formData, products: e.target.value})}
                            className="px-2 py-1 border rounded"
                          />
                        ) : (
                          <span className="text-sm">{customer.products}</span>
                        )}
                      </td>
                      <td className="p-3">
                        {editingId === customer.id ? (
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                            className="px-2 py-1 border rounded"
                          >
                            <option value="פעיל">פעיל</option>
                            <option value="לא פעיל">לא פעיל</option>
                            <option value="פוטנציאלי">פוטנציאלי</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            customer.status === 'פעיל' ? 'bg-green-100 text-green-800' :
                            customer.status === 'לא פעיל' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {customer.status}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          {editingId === customer.id ? (
                            <>
                              <button
                                onClick={() => updateCustomer(customer.id)}
                                className="text-green-600 hover:text-green-800"
                              >
                                <Save size={18} />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="text-gray-600 hover:text-gray-800"
                              >
                                <X size={18} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(customer)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => deleteCustomer(customer.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* הוראות שימוש */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-bold text-lg mb-3 text-blue-900">הוראות שימוש:</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• להוספת לקוח חדש - לחץ על "לקוח חדש" ומלא את הפרטים</p>
              <p>• לייבוא לקוחות מאקסל - הכן קובץ CSV עם העמודות: שם עסק, איש קשר, אימייל, טלפון, כתובת, ח.פ/ע.מ, מוצרים, הערות, סטטוס</p>
              <p>• לעריכת לקוח - לחץ על כפתור העריכה ליד הלקוח</p>
              <p>• למחיקת מספר לקוחות - סמן את הלקוחות ולחץ על "מחק נבחרים"</p>
              <p>• לחיפוש - הקלד בשדה החיפוש שם עסק, איש קשר, אימייל או טלפון</p>
              <p>• לייצוא הנתונים - לחץ על "ייצוא לאקסל" לקבלת קובץ CSV</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
