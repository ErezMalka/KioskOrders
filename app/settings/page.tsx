// app/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// Type definitions
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface RoleTemplate {
  name: string;
  permissions: string[];
}

export default function UsersManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: '',
    permissions: [] as string[],
    send_email: true
  });

  // Role templates
  const roleTemplates: Record<string, RoleTemplate> = {
    admin: {
      name: 'מנהל ראשי',
      permissions: ['view_customers', 'edit_customers', 'add_customers', 'delete_customers', 
                   'view_products', 'edit_products', 'add_products', 'delete_products',
                   'create_quotes', 'approve_quotes', 'give_discounts', 'view_reports', 
                   'manage_users', 'system_settings']
    },
    sales_manager: {
      name: 'מנהל מכירות',
      permissions: ['view_customers', 'edit_customers', 'add_customers', 'view_products', 
                   'create_quotes', 'approve_quotes', 'give_discounts', 'view_reports']
    },
    senior_sales: {
      name: 'סוכן מכירות בכיר',
      permissions: ['view_customers', 'edit_customers', 'add_customers', 'view_products', 
                   'create_quotes', 'give_discounts']
    },
    junior_sales: {
      name: 'סוכן מכירות חדש',
      permissions: ['view_customers', 'view_products', 'create_quotes']
    },
    viewer: {
      name: 'צופה בלבד',
      permissions: ['view_customers', 'view_products']
    }
  };

  // Available permissions
  const availablePermissions = [
    { id: 'view_customers', name: 'צפייה בלקוחות', category: 'customers' },
    { id: 'edit_customers', name: 'עריכת לקוחות', category: 'customers' },
    { id: 'add_customers', name: 'הוספת לקוחות', category: 'customers' },
    { id: 'delete_customers', name: 'מחיקת לקוחות', category: 'customers' },
    { id: 'view_products', name: 'צפייה במוצרים', category: 'products' },
    { id: 'edit_products', name: 'עריכת מוצרים', category: 'products' },
    { id: 'add_products', name: 'הוספת מוצרים', category: 'products' },
    { id: 'delete_products', name: 'מחיקת מוצרים', category: 'products' },
    { id: 'create_quotes', name: 'יצירת הצעות מחיר', category: 'quotes' },
    { id: 'approve_quotes', name: 'אישור הצעות מחיר', category: 'quotes' },
    { id: 'give_discounts', name: 'מתן הנחות', category: 'quotes' },
    { id: 'view_reports', name: 'צפייה בדוחות', category: 'reports' },
    { id: 'export_reports', name: 'ייצוא דוחות', category: 'reports' },
    { id: 'manage_users', name: 'ניהול משתמשים', category: 'system' },
    { id: 'system_settings', name: 'הגדרות מערכת', category: 'system' },
    { id: 'whatsapp_send', name: 'שליחת הודעות WhatsApp', category: 'communication' }
  ];

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user has permission to manage users
      const { data: profile } = await supabase
        .from('profiles')
        .select('permissions')
        .eq('id', user.id)
        .single();

      if (!profile?.permissions?.includes('manage_users')) {
        showMessage('אין לך הרשאות לצפות בדף זה', 'error');
        setTimeout(() => router.push('/dashboard'), 2000);
        return;
      }

      loadUsers();
    } catch (error) {
      console.error('Error checking auth:', error);
      router.push('/login');
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      showMessage('שגיאה בטעינת המשתמשים', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  const handleRoleChange = (role: string) => {
    setFormData({
      ...formData,
      role,
      permissions: roleTemplates[role]?.permissions || []
    });
  };

  const handlePermissionToggle = (permissionId: string) => {
    const newPermissions = formData.permissions.includes(permissionId)
      ? formData.permissions.filter(p => p !== permissionId)
      : [...formData.permissions, permissionId];
    
    setFormData({ ...formData, permissions: newPermissions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('profiles')
          .update({
            name: formData.name,
            phone: formData.phone,
            role: formData.role,
            permissions: formData.permissions,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingUser.id);

        if (error) throw error;
        showMessage('המשתמש עודכן בהצלחה', 'success');
      } else {
        // For new users, you'll need to create a Supabase Edge Function
        // For now, we'll just update the profile
        showMessage('ליצירת משתמש חדש יש צורך ב-Edge Function', 'info');
      }

      setShowModal(false);
      loadUsers();
      resetForm();
    } catch (error) {
      console.error('Error saving user:', error);
      showMessage('שגיאה בשמירת המשתמש', 'error');
    }
  };

  const toggleUserStatus = async (user: User) => {
    if (!confirm(`האם ${user.is_active ? 'להשבית' : 'להפעיל'} את המשתמש?`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);

      if (error) throw error;
      showMessage(`המשתמש ${!user.is_active ? 'הופעל' : 'הושבת'} בהצלחה`, 'success');
      loadUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      showMessage('שגיאה בשינוי סטטוס המשתמש', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: '',
      permissions: [],
      send_email: true
    });
    setEditingUser(null);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      role: user.role,
      permissions: user.permissions || [],
      send_email: false
    });
    setShowModal(true);
  };

  const showMessage = (text: string, type: string) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>טוען נתונים...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px', fontSize: '2.5em', display: 'flex', alignItems: 'center', gap: '10px' }}>
        👥 ניהול משתמשים והרשאות
      </h1>

      {message.text && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          backgroundColor: message.type === 'error' ? '#ffebee' : '#e8f5e9',
          color: message.type === 'error' ? '#c62828' : '#2e7d32',
          borderRadius: '8px',
          border: `1px solid ${message.type === 'error' ? '#ef5350' : '#66bb6a'}`
        }}>
          {message.text}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{users.length}</div>
          <div>סה"כ משתמשים</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{users.filter(u => u.is_active).length}</div>
          <div>משתמשים פעילים</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{users.filter(u => u.role?.includes('sales')).length}</div>
          <div>סוכני מכירות</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{users.filter(u => u.role === 'admin').length}</div>
          <div>מנהלים</div>
        </div>
      </div>

      {/* Search Box */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 חיפוש לפי שם, אימייל או תפקיד..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            borderRadius: '8px',
            border: '2px solid #e0e0e0'
          }}
        />
      </div>

      {/* Users Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {filteredUsers.map(user => (
          <div key={user.id} style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            opacity: user.is_active ? 1 : 0.7
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <div>
                <h3>{user.name || 'ללא שם'}</h3>
                <p style={{ color: '#666', fontSize: '0.9em' }}>{user.email}</p>
              </div>
              <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.85em',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white'
              }}>
                {roleTemplates[user.role]?.name || user.role || 'משתמש'}
              </span>
            </div>
            
            <span style={{
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '0.8em',
              backgroundColor: user.is_active ? '#c8e6c9' : '#ffcdd2',
              color: user.is_active ? '#2e7d32' : '#c62828'
            }}>
              {user.is_active ? 'פעיל' : 'לא פעיל'}
            </span>

            {user.permissions && user.permissions.length > 0 && (
              <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e0e0e0' }}>
                <h4>הרשאות:</h4>
                <div style={{ marginTop: '10px' }}>
                  {user.permissions.slice(0, 3).map(perm => (
                    <div key={perm} style={{ fontSize: '0.9em', marginBottom: '5px' }}>
                      ✅ {availablePermissions.find(p => p.id === perm)?.name || perm}
                    </div>
                  ))}
                  {user.permissions.length > 3 && (
                    <div style={{ fontSize: '0.9em', color: '#666' }}>
                      ועוד {user.permissions.length - 3} הרשאות...
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button
                onClick={() => openEditModal(user)}
                style={{
                  padding: '8px 16px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                ✏️ עריכה
              </button>
              <button
                onClick={() => toggleUserStatus(user)}
                style={{
                  padding: '8px 16px',
                  background: user.is_active ? '#ef5350' : '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                {user.is_active ? '🚫 השבתה' : '✅ הפעלה'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add User Button */}
      <button
        onClick={() => {
          resetForm();
          setShowModal(true);
        }}
        style={{
          position: 'fixed',
          bottom: '30px',
          left: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 5px 20px rgba(102, 126, 234, 0.4)'
        }}
      >
        ➕
      </button>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2>{editingUser ? 'עריכת משתמש' : 'הוספת משתמש חדש'}</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                ✖
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  שם מלא *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #e0e0e0',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  אימייל *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={!!editingUser}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #e0e0e0',
                    fontSize: '16px',
                    backgroundColor: editingUser ? '#f5f5f5' : 'white'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  טלפון
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #e0e0e0',
                    fontSize: '16px'
                  }}
                />
              </div>

              {!editingUser && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    סיסמה זמנית *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    placeholder="סיסמה תישלח למשתמש באימייל"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #e0e0e0',
                      fontSize: '16px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    style={{
                      marginTop: '10px',
                      padding: '8px 16px',
                      background: '#9e9e9e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    🔑 צור סיסמה אוטומטית
                  </button>
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  בחר תפקיד
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #e0e0e0',
