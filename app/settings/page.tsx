'use client';

import React, { useState, useEffect } from 'react';
import { Users, Shield, UserPlus, Edit, Trash2, Check, X } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  created_at: string;
  last_sign_in_at?: string;
}

export default function SettingsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState<{ 
    email: string; 
    password: string; 
    name: string;
    phone: string;
    role: 'ADMIN' | 'USER' 
  }>({ 
    email: '', 
    password: '', 
    name: '',
    phone: '',
    role: 'USER' 
  });
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ 
    name: string; 
    phone: string; 
    role: 'SUPER_ADMIN' | 'ADMIN' | 'USER' 
  }>({ 
    name: '', 
    phone: '', 
    role: 'USER' 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // טעינת משתמשים
  useEffect(() => {
    fetchUsers();
    checkCurrentUserRole();
  }, []);

  const checkCurrentUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setCurrentUserRole(profile.role);
        }
      }
    } catch (err) {
      console.error('Error checking user role:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      // טעינת משתמשים מ-Supabase
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        setError('שגיאה בטעינת המשתמשים');
        return;
      }

      // טעינת נתוני auth למשתמשים
      const usersWithAuth: User[] = profiles?.map(profile => ({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
        role: profile.role,
        created_at: profile.created_at,
        last_sign_in_at: profile.last_sign_in_at
      })) || [];

      setUsers(usersWithAuth);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('שגיאה בטעינת המשתמשים');
    } finally {
      setLoading(false);
    }
  };

  // הוספת משתמש חדש
  const handleAddUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.name) {
      setError('יש למלא אימייל, סיסמה ושם');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // בדיקת תקינות אימייל
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      setError('כתובת אימייל לא תקינה');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // בדיקת אורך סיסמה
    if (newUser.password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // רענון רשימת המשתמשים
        await fetchUsers();
        
        // איפוס הטופס
        setNewUser({ 
          email: '', 
          password: '', 
          name: '', 
          phone: '',
          role: 'USER' 
        });
        
        setSuccess(`המשתמש ${data.user.name} נוצר בהצלחה! הסיסמה: ${data.user.password}`);
        setTimeout(() => setSuccess(''), 10000); // נשאיר יותר זמן להעתיק את הסיסמה
      } else {
        setError(data.error || 'שגיאה ביצירת המשתמש');
        setTimeout(() => setError(''), 5000);
      }
    } catch (err) {
      console.error('Error creating user:', err);
      setError('שגיאה בחיבור לשרת');
      setTimeout(() => setError(''), 3000);
    }
  };

  // מחיקת משתמש
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק משתמש זה? פעולה זו אינה ניתנת לביטול.')) {
      return;
    }

    try {
      // מחיקת הפרופיל (זה ימחק גם את המשתמש מ-auth)
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        setError('שגיאה במחיקת המשתמש');
        setTimeout(() => setError(''), 3000);
        return;
      }

      // עדכון הרשימה המקומית
      setUsers(users.filter(u => u.id !== userId));
      setSuccess('המשתמש נמחק בהצלחה');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('שגיאה במחיקת המשתמש');
      setTimeout(() => setError(''), 3000);
    }
  };

  // עדכון משתמש
  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: editForm.name,
          phone: editForm.phone,
          role: editForm.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser);

      if (updateError) {
        console.error('Update error:', updateError);
        setError('שגיאה בעדכון המשתמש');
        setTimeout(() => setError(''), 3000);
        return;
      }

      // עדכון הרשימה המקומית
      setUsers(users.map(u => 
        u.id === editingUser 
          ? { ...u, name: editForm.name, phone: editForm.phone, role: editForm.role }
          : u
      ));
      
      setEditingUser(null);
      setEditForm({ name: '', phone: '', role: 'USER' });
      setSuccess('המשתמש עודכן בהצלחה');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating user:', err);
      setError('שגיאה בעדכון המשתמש');
      setTimeout(() => setError(''), 3000);
    }
  };

  // התחלת עריכה
  const startEdit = (user: User) => {
    setEditingUser(user.id);
    setEditForm({
      name: user.name,
      phone: user.phone || '',
      role: user.role
    });
  };

  // ביטול עריכה
  const cancelEdit = () => {
    setEditingUser(null);
    setEditForm({ name: '', phone: '', role: 'USER' });
  };

  // פונקציה לתרגום תפקיד
  const getRoleDisplay = (role: string) => {
    switch(role) {
      case 'SUPER_ADMIN': return 'מנהל על';
      case 'ADMIN': return 'מנהל';
      case 'USER': return 'משתמש';
      default: return role;
    }
  };

  // פונקציה לקבלת צבע לתפקיד
  const getRoleColor = (role: string) => {
    switch(role) {
      case 'SUPER_ADMIN': return '#e74c3c';
      case 'ADMIN': return '#f39c12';
      case 'USER': return '#3498db';
      default: return '#95a5a6';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p>טוען...</p>
      </div>
    );
  }

  // בדיקת הרשאות - רק SUPER_ADMIN יכול לנהל משתמשים
  if (currentUserRole !== 'SUPER_ADMIN') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>אין לך הרשאות לצפות בדף זה</h2>
        <p>רק מנהלי על יכולים לנהל משתמשים</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px', fontSize: '2.5em', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Users size={40} />
        ניהול משתמשים והרשאות
      </h1>

      {/* הודעות */}
      {error && (
        <div style={{
          background: '#fee',
          color: '#c00',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #fcc'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: '#efe',
          color: '#060',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #cfc',
          whiteSpace: 'pre-line'
        }}>
          {success}
        </div>
      )}

      {/* הוספת משתמש חדש */}
      <div style={{
        background: '#f9f9f9',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '30px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserPlus size={24} />
          הוספת משתמש חדש
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <input
            type="email"
            placeholder="אימייל *"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            style={{
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              fontSize: '16px'
            }}
          />
          
          <input
            type="password"
            placeholder="סיסמה (מינימום 6 תווים) *"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            style={{
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              fontSize: '16px'
            }}
          />
          
          <input
            type="text"
            placeholder="שם מלא *"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            style={{
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              fontSize: '16px'
            }}
          />
          
          <input
            type="tel"
            placeholder="טלפון"
            value={newUser.phone}
            onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
            style={{
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              fontSize: '16px'
            }}
          />
          
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'ADMIN' | 'USER' })}
            style={{
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              fontSize: '16px'
            }}
          >
            <option value="USER">משתמש רגיל</option>
            <option value="ADMIN">מנהל</option>
          </select>
          
          <button
            onClick={handleAddUser}
            style={{
              padding: '10px 20px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              transition: 'background 0.3s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#45a049'}
            onMouseOut={(e) => e.currentTarget.style.background = '#4CAF50'}
          >
            <UserPlus size={20} />
            צור משתמש
          </button>
        </div>
      </div>

      {/* רשימת משתמשים */}
      <div style={{
        background: '#fff',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{
          padding: '20px',
          borderBottom: '1px solid #eee',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Shield size={24} />
          משתמשים רשומים ({users.length})
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '15px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>
                  אימייל
                </th>
                <th style={{ padding: '15px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>
                  שם
                </th>
                <th style={{ padding: '15px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>
                  טלפון
                </th>
                <th style={{ padding: '15px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>
                  תפקיד
                </th>
                <th style={{ padding: '15px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>
                  תאריך יצירה
                </th>
                <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                  {editingUser === user.id ? (
                    <>
                      <td style={{ padding: '15px' }}>
                        {user.email}
                      </td>
                      <td style={{ padding: '15px' }}>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          style={{
                            padding: '5px',
                            borderRadius: '3px',
                            border: '1px solid #ddd',
                            width: '100%'
                          }}
                        />
                      </td>
                      <td style={{ padding: '15px' }}>
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          style={{
                            padding: '5px',
                            borderRadius: '3px',
                            border: '1px solid #ddd',
                            width: '100%'
                          }}
                        />
                      </td>
                      <td style={{ padding: '15px' }}>
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'SUPER_ADMIN' | 'ADMIN' | 'USER' })}
                          style={{
                            padding: '5px',
                            borderRadius: '3px',
                            border: '1px solid #ddd'
                          }}
                        >
                          <option value="USER">משתמש</option>
                          <option value="ADMIN">מנהל</option>
                          {currentUserRole === 'SUPER_ADMIN' && (
                            <option value="SUPER_ADMIN">מנהל על</option>
                          )}
                        </select>
                      </td>
                      <td style={{ padding: '15px' }}>
                        {new Date(user.created_at).toLocaleDateString('he-IL')}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <button
                          onClick={handleUpdateUser}
                          style={{
                            padding: '5px 10px',
                            background: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            marginRight: '5px'
                          }}
                          title="שמור שינויים"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          style={{
                            padding: '5px 10px',
                            background: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                          title="בטל"
                        >
                          <X size={16} />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '15px' }}>
                        {user.email}
                      </td>
                      <td style={{ padding: '15px' }}>
                        {user.name}
                      </td>
                      <td style={{ padding: '15px' }}>
                        {user.phone || '-'}
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '15px',
                          background: getRoleColor(user.role),
                          color: 'white',
                          fontSize: '14px'
                        }}>
                          {getRoleDisplay(user.role)}
                        </span>
                      </td>
                      <td style={{ padding: '15px' }}>
                        {new Date(user.created_at).toLocaleDateString('he-IL')}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        {user.role !== 'SUPER_ADMIN' && (
                          <>
                            <button
                              onClick={() => startEdit(user)}
                              style={{
                                padding: '5px 10px',
                                background: '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                marginRight: '5px'
                              }}
                              title="ערוך"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              style={{
                                padding: '5px 10px',
                                background: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer'
                              }}
                              title="מחק"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #333;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
