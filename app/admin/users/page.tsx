'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface User {
  id: string;
  email: string;
  created_at: string;
  profile?: {
    name: string;
    phone: string;
    role: string;
    org_id: string;
  };
}

interface NewUser {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [currentUserRole, setCurrentUserRole] = useState('');
  
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'SALES_AGENT'
  });

  const roles = [
    { value: 'SUPER_ADMIN', label: 'סופר אדמין', color: '#e74c3c' },
    { value: 'ADMIN', label: 'מנהל', color: '#f39c12' },
    { value: 'SALES_AGENT', label: 'סוכן מכירות', color: '#3498db' },
    { value: 'VIEWER', label: 'צופה', color: '#95a5a6' }
  ];

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // בדוק הרשאות
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'SUPER_ADMIN') {
        setMessage('אין לך הרשאות לצפות בדף זה');
        setMessageType('error');
        setTimeout(() => router.push('/dashboard'), 2000);
        return;
      }

      setCurrentUserRole(profile.role);
      loadUsers();
    } catch (error) {
      console.error('Error checking permissions:', error);
      router.push('/dashboard');
    }
  };

  const loadUsers = async () => {
    try {
      // טען את כל המשתמשים עם הפרופילים שלהם
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // מיפוי הנתונים
      const usersWithProfiles = profiles?.map(profile => ({
        id: profile.id,
        email: '', // נטען בנפרד
        created_at: profile.created_at,
        profile: {
          name: profile.name,
          phone: profile.phone,
          role: profile.role,
          org_id: profile.org_id
        }
      })) || [];

      setUsers(usersWithProfiles);
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage('שגיאה בטעינת משתמשים');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      // Step 1: Create auth user via API route (כי אי אפשר ליצור משתמש מהclient)
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          name: newUser.name,
          phone: newUser.phone,
          role: newUser.role
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'שגיאה ביצירת משתמש');
      }

      setMessage('המשתמש נוצר בהצלחה!');
      setMessageType('success');
      setShowAddForm(false);
      setNewUser({
        email: '',
        password: '',
        name: '',
        phone: '',
        role: 'SALES_AGENT'
      });
      
      // רענן את הרשימה
      loadUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      setMessage(error.message || 'שגיאה ביצירת משתמש');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setMessage('התפקיד עודכן בהצלחה');
      setMessageType('success');
      loadUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      setMessage('שגיאה בעדכון תפקיד');
      setMessageType('error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק משתמש זה?')) return;

    try {
      // מחיקת פרופיל
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setMessage('המשתמש נמחק בהצלחה');
      setMessageType('success');
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage('שגיאה במחיקת משתמש');
      setMessageType('error');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>טוען משתמשים...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ marginBottom: '30px' }}>👥 ניהול משתמשים</h1>

      {message && (
        <div style={{
          padding: '15px',
          backgroundColor: messageType === 'error' ? '#ffebee' : '#e8f5e9',
          color: messageType === 'error' ? '#c62828' : '#2e7d32',
          borderRadius: '5px',
          marginBottom: '20px',
          border: `1px solid ${messageType === 'error' ? '#ef5350' : '#66bb6a'}`
        }}>
          {message}
        </div>
      )}

      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {showAddForm ? 'ביטול' : '➕ הוסף משתמש חדש'}
        </button>
      </div>

      {showAddForm && (
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '30px'
        }}>
          <h2>משתמש חדש</h2>
          <form onSubmit={handleCreateUser}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  אימייל *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '16px',
                    borderRadius: '5px',
                    border: '1px solid #ddd',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  סיסמה *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '16px',
                    borderRadius: '5px',
                    border: '1px solid #ddd',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  שם מלא *
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '16px',
                    borderRadius: '5px',
                    border: '1px solid #ddd',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  טלפון
                </label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '16px',
                    borderRadius: '5px',
                    border: '1px solid #ddd',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  תפקיד *
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '16px',
                    borderRadius: '5px',
                    border: '1px solid #ddd'
                  }}
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                marginTop: '20px',
                padding: '10px 30px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
            >
              {saving ? 'יוצר משתמש...' : 'צור משתמש'}
            </button>
          </form>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: 'white',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>שם</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>טלפון</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>תפקיד</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>נוצר ב</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>{user.profile?.name || 'ללא שם'}</td>
                <td style={{ padding: '12px' }}>{user.profile?.phone || '-'}</td>
                <td style={{ padding: '12px' }}>
                  <select
                    value={user.profile?.role || 'VIEWER'}
                    onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                    disabled={user.id === currentUserRole}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '5px',
                      border: '1px solid #ddd',
                      backgroundColor: roles.find(r => r.value === user.profile?.role)?.color || '#95a5a6',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: '12px' }}>
                  {new Date(user.created_at).toLocaleDateString('he-IL')}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={user.id === currentUserRole}
                    style={{
                      padding: '5px 15px',
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      opacity: user.id === currentUserRole ? 0.5 : 1
                    }}
                  >
                    מחק
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
