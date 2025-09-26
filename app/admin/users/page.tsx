'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  created_at: string;
}

export default function UserManagement() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [createdUserDetails, setCreatedUserDetails] = useState<any>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'SALES_AGENT'
  });

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

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'SUPER_ADMIN') {
        alert('אין לך הרשאה לעמוד זה');
        router.push('/dashboard');
        return;
      }

      setCurrentUser(profile);
      fetchUsers();
    } catch (error) {
      console.error('Error:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewUser({ ...newUser, password });
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setCreating(true);
    setCreatedUserDetails(null);
    
    try {
      // Call API to create user
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      // Success - show the credentials
      setCreatedUserDetails({
        email: newUser.email,
        password: newUser.password,
        name: newUser.name,
        role: newUser.role
      });
      
      setMessage('✅ המשתמש נוצר בהצלחה!');
      
      // Reset form
      setNewUser({ email: '', password: '', name: '', phone: '', role: 'SALES_AGENT' });
      
      // Refresh users list
      fetchUsers();
      
    } catch (error: any) {
      setMessage(`❌ שגיאה: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      setMessage('✅ התפקיד עודכן');
      fetchUsers();
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(`❌ שגיאה: ${error.message}`);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setMessage(`📋 ${type} הועתק ללוח`);
    setTimeout(() => setMessage(''), 2000);
  };

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '2rem auto',
      padding: '0 1rem',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
      flexWrap: 'wrap' as const,
      gap: '1rem',
    },
    title: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#333',
    },
    button: {
      padding: '0.75rem 1.5rem',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: 'bold',
      transition: 'background-color 0.3s',
    },
    secondaryButton: {
      padding: '0.5rem 1rem',
      backgroundColor: '#2196F3',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.9rem',
    },
    table: {
      width: '100%',
      backgroundColor: 'white',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      overflowX: 'auto' as const,
    },
    th: {
      backgroundColor: '#f5f5f5',
      padding: '1rem',
      textAlign: 'right' as const,
      fontWeight: 'bold',
      borderBottom: '2px solid #ddd',
      whiteSpace: 'nowrap' as const,
    },
    td: {
      padding: '1rem',
      borderBottom: '1px solid #eee',
    },
    modal: {
      position: 'fixed' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      zIndex: 1000,
      width: '90%',
      maxWidth: '500px',
      maxHeight: '90vh',
      overflowY: 'auto' as const,
    },
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 999,
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1rem',
    },
    input: {
      padding: '0.75rem',
      border: '1px solid #ddd',
      borderRadius: '6px',
      fontSize: '1rem',
      width: '100%',
    },
    select: {
      padding: '0.75rem',
      border: '1px solid #ddd',
      borderRadius: '6px',
      fontSize: '1rem',
      width: '100%',
    },
    label: {
      fontSize: '0.9rem',
      fontWeight: 'bold',
      color: '#555',
      marginBottom: '0.25rem',
    },
    roleTag: {
      padding: '0.25rem 0.75rem',
      borderRadius: '12px',
      fontSize: '0.85rem',
      fontWeight: 'bold',
      display: 'inline-block',
    },
    message: {
      padding: '1rem',
      borderRadius: '6px',
      marginBottom: '1rem',
      textAlign: 'center' as const,
      fontWeight: 'bold',
    },
    successBox: {
      backgroundColor: '#e8f5e9',
      border: '1px solid #4CAF50',
      borderRadius: '8px',
      padding: '1.5rem',
      marginTop: '1rem',
    },
    credentialsDisplay: {
      backgroundColor: '#f5f5f5',
      padding: '1rem',
      borderRadius: '6px',
      marginTop: '1rem',
      fontFamily: 'monospace',
    },
    copyButton: {
      padding: '0.25rem 0.5rem',
      backgroundColor: '#607d8b',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.8rem',
      marginRight: '0.5rem',
    },
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { backgroundColor: '#ff6b6b', color: 'white' };
      case 'ADMIN':
        return { backgroundColor: '#4ecdc4', color: 'white' };
      case 'SALES_AGENT':
        return { backgroundColor: '#45b7d1', color: 'white' };
      default:
        return { backgroundColor: '#95a5a6', color: 'white' };
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem' }}>⏳</div>
          <p>טוען...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🔐 ניהול משתמשים</h1>
        <button onClick={() => setShowAddUser(true)} style={styles.button}>
          ➕ הוסף משתמש חדש
        </button>
      </div>

      {message && !createdUserDetails && (
        <div style={{
          ...styles.message,
          backgroundColor: message.includes('✅') || message.includes('📋') ? '#d4edda' : '#f8d7da',
          color: message.includes('✅') || message.includes('📋') ? '#155724' : '#721c24',
          border: message.includes('✅') || message.includes('📋') ? '1px solid #c3e6cb' : '1px solid #f5c6cb',
        }}>
          {message}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>שם</th>
              <th style={styles.th}>אימייל</th>
              <th style={styles.th}>טלפון</th>
              <th style={styles.th}>תפקיד</th>
              <th style={styles.th}>נוצר בתאריך</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td style={styles.td}>{user.name || '-'}</td>
                <td style={styles.td}>{user.email}</td>
                <td style={styles.td}>{user.phone || '-'}</td>
                <td style={styles.td}>
                  {currentUser?.id === user.id ? (
                    <span style={{ ...styles.roleTag, ...getRoleColor(user.role) }}>
                      {user.role} (אתה)
                    </span>
                  ) : (
                    <select
                      value={user.role || 'VIEWER'}
                      onChange={(e) => updateUserRole(user.id, e.target.value)}
                      style={{ ...styles.select, width: 'auto' }}
                    >
                      <option value="VIEWER">צופה</option>
                      <option value="SALES_AGENT">סוכן מכירות</option>
                      <option value="ADMIN">מנהל</option>
                      <option value="SUPER_ADMIN">סופר אדמין</option>
                    </select>
                  )}
                </td>
                <td style={styles.td}>
                  {new Date(user.created_at).toLocaleDateString('he-IL')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddUser && (
        <>
          <div style={styles.overlay} onClick={() => !creating && setShowAddUser(false)} />
          <div style={styles.modal}>
            <h2 style={{ marginBottom: '1.5rem' }}>➕ הוסף משתמש חדש</h2>
            
            {createdUserDetails ? (
              <div style={styles.successBox}>
                <h3 style={{ color: '#2e7d32', marginBottom: '1rem' }}>
                  ✅ המשתמש נוצר בהצלחה!
                </h3>
                <p style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
                  שמור את הפרטים הבאים ושלח למשתמש:
                </p>
                <div style={styles.credentialsDisplay}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <button 
                      onClick={() => copyToClipboard(createdUserDetails.email, 'אימייל')}
                      style={styles.copyButton}
                    >
                      📋 העתק
                    </button>
                    <strong>אימייל:</strong> {createdUserDetails.email}
                  </div>
                  <div>
                    <button 
                      onClick={() => copyToClipboard(createdUserDetails.password, 'סיסמה')}
                      style={styles.copyButton}
                    >
                      📋 העתק
                    </button>
                    <strong>סיסמה:</strong> {createdUserDetails.password}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCreatedUserDetails(null);
                    setShowAddUser(false);
                  }}
                  style={{ ...styles.button, width: '100%', marginTop: '1rem' }}
                >
                  סגור
                </button>
              </div>
            ) : (
              <form onSubmit={createUser} style={styles.form}>
                <div>
                  <label style={styles.label}>שם מלא *</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    required
                    disabled={creating}
                    placeholder="ישראל ישראלי"
                  />
                </div>

                <div>
                  <label style={styles.label}>אימייל *</label>
                  <input
                    type="email"
                    style={styles.input}
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                    disabled={creating}
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label style={styles.label}>סיסמה * (לפחות 6 תווים)</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      style={{ ...styles.input, flex: 1 }}
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      required
                      minLength={6}
                      disabled={creating}
                      placeholder="********"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={styles.secondaryButton}
                    >
                      {showPassword ? '🔒' : '👁️'}
                    </button>
                    <button
                      type="button"
                      onClick={generatePassword}
                      style={styles.secondaryButton}
                    >
                      🎲 צור
                    </button>
                  </div>
                </div>

                <div>
                  <label style={styles.label}>טלפון (אופציונלי)</label>
                  <input
                    type="tel"
                    style={styles.input}
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    disabled={creating}
                    placeholder="050-1234567"
                  />
                </div>

                <div>
                  <label style={styles.label}>תפקיד *</label>
                  <select
                    style={styles.select}
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    disabled={creating}
                  >
                    <option value="VIEWER">צופה - צפייה בלבד</option>
                    <option value="SALES_AGENT">סוכן מכירות - יצירת הזמנות</option>
                    <option value="ADMIN">מנהל - ניהול מלא</option>
                    <option value="SUPER_ADMIN">סופר אדמין - הרשאות מלאות</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  style={{
                    ...styles.button,
                    width: '100%',
                    opacity: creating ? 0.7 : 1,
                    cursor: creating ? 'not-allowed' : 'pointer',
                  }}
                  disabled={creating}
                >
                  {creating ? '⏳ יוצר משתמש...' : '✅ צור משתמש'}
                </button>
                
                <button
                  type="button"
                  onClick={() => !creating && setShowAddUser(false)}
                  style={{ 
                    ...styles.button, 
                    backgroundColor: '#95a5a6',
                    width: '100%',
                  }}
                  disabled={creating}
                >
                  ביטול
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}
