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
  const [currentUserId, setCurrentUserId] = useState('');
  
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

      setCurrentUserId(user.id);

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

      loadUsers();
    } catch (error) {
      console.error('Error checking permissions:', error);
      router.push('/dashboard');
    }
  };

  const loadUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const usersWithProfiles = profiles?.map(profile => ({
        id: profile.id,
        email: '',
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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            name: newUser.name
          }
        }
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          name: newUser.name,
          phone: newUser.phone,
          role: newUser.role,
          org_id: '11111111-1111-1111-1111-111111111111',
          created_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error('Failed to create user profile');
      }

      setMessage('המשתמש נוצר בהצלחה! יש לאשר את האימייל כדי להתחבר.');
      setMessageType('success');
      setShowAddForm(false);
      setNewUser({
        email: '',
        password: '',
        name: '',
        phone: '',
        role: 'SALES_AGENT'
      });
      
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
                <label styl
