'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';

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
  const [debugInfo, setDebugInfo] = useState('');
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
      await fetchUsers();
    } catch (error) {
      console.error('Error:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    console.log('Fetching users...');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      setMessage(`❌ שגיאה בטעינת משתמשים: ${error.message}`);
    } else {
      console.log('Users loaded:', data?.length);
      setUsers(data || []);
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
    setDebugInfo('');
    
    try {
      console.log('Creating user with:', newUser);
      
      // יצירת Supabase client חדש
      const tempSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          }
        }
      );

      // Step 1: יצירת משתמש
      const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            name: newUser.name,
            phone: newUser.phone,
            role: newUser.role
          }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('לא נוצר משתמש');
      }

      console.log('User created in auth:', authData.user.id);
      setDebugInfo(prev => prev + `\n✅ משתמש נוצר ב-auth: ${authData.user.id}`);

      // Step 2: המתן רגע לפני יצירת הפרופיל
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: יצירת פרופיל - נסה insert ואז upsert אם נכשל
      console.log('Creating profile...');
      const profileData = {
        id: authData.user.id,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone || null,
        role: newUser.role,
        organization_id: currentUser?.organization_id || currentUser?.id,
        created_at: new Date().toISOString()
      };

      const { data: profileResult, error: profileError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (profileError) {
        console.error('Profile insert error:', profileError);
        setDebugInfo(prev => prev + `\n⚠️ שגיאה ביצירת פרופיל: ${profileError.message}`);
        
        // נסה upsert
        console.log('Trying upsert...');
        const { data: upsertResult, error: upsertError } = await supabase
          .from('profiles')
          .upsert(profileData)
          .select()
          .single();

        if (upsertError) {
          console.error('Profile upsert error:', upsertError);
          setDebugInfo(prev => prev + `\n❌ שגיאה ב-upsert: ${upsertError.message}`);
        } else {
          console.log('Profile created via upsert:', upsertResult);
          setDebugInfo(prev => prev + `\n✅ פרופיל נוצר דרך upsert`);
        }
      } else {
        console.log('Profile created:', profileResult);
        setDebugInfo(prev => prev + `\n✅ פרופיל נוצר בהצלחה`);
      }

      // Step 4: בדוק שהפרופיל נוצר
      const { data: checkProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (checkError || !checkProfile) {
        console.error('Profile not found after creation:', checkError);
        setDebugInfo(prev => prev + `\n❌ הפרופיל לא נמצא אחרי היצירה`);
        
        // נסיון אחרון - צור ישירות
        const { error: finalError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role
          });
          
        if (finalError) {
          console.error('Final attempt failed:', finalError);
        }
      } else {
        console.log('Profile verified:', checkProfile);
        setDebugInfo(prev => prev + `\n✅ פרופיל אומת: ${checkProfile.email}`);
      }

      // Step 5: רענן את רשימת המשתמשים
      console.log('Refreshing users list...');
      await fetchUsers();

      // הצלחה - הצג את הפרטים
      setCreatedUserDetails({
        email: newUser.email,
        password: newUser.password,
        name: newUser.name,
        role: newUser.role,
        debug: debugInfo
      });
      
      setMessage('✅ המשתמש נוצר בהצלחה!');
      setNewUser({ email: '', password: '', name: '', phone: '', role: 'SALES_AGENT' });
      
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      if (error.message?.includes('already registered')) {
        setMessage('❌ משתמש עם אימייל זה כבר קיים');
      } else if (error.message?.includes('duplicate key')) {
        setMessage('❌ משתמש זה כבר קיים במערכת');
      } else {
        setMessage(`❌ שגיאה: ${error.message}`);
      }
      
      setDebugInfo(prev => prev + `\n❌ שגיאה כללית: ${error.message}`);
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

  const refreshList = async () => {
    setMessage('🔄 מרענן רשימה...');
    await fetchUsers();
    setMessage('✅ הרשימה עודכנה');
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
    },
    th: {
      backgroundColor: '#f5f5f5',
      padding: '1rem',
      textAlign: 'right' as const,
      fontWeight: 'bold',
      borderBottom: '2px solid #ddd',
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
    debugBox: {
      backgroundColor: '#f0f0f0',
      padding: '0.5rem',
      borderRadius: '4px',
      marginTop: '0.5rem',
      fontSize: '0.8rem',
      fontFamily: 'monospace',
      whiteSpace: 'pre-wrap' as const,
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

  const getRoleText = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'סופר אדמין';
      case 'ADMIN': return 'מנהל';
      case 'SALES_AGENT': return 'סוכן מכירות';
      case 'VIEWER': return 'צופה';
      default: return role;
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
        <h1 style={styles.title}>🔐 ניהול משתמשים ({users.length})</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={refreshList} style={{ ...styles.button, backgroundColor: '#ff9800' }}>
            🔄 רענן רשימה
          </button>
          <button onClick={() => setShowAddUser(true)} style={styles.button}>
            ➕ הוסף משתמש
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '1rem',
          borderRadius: '6px',
          marginBottom: '1rem',
          textAlign: 'center',
          fontWeight: 'bold',
          backgroundColor: message.includes('✅') || message.includes('📋') ? '#d4edda' : '#f8d7da',
          color: message.includes('✅') || message.includes('📋') ? '#155724' : '#721c24',
        }}>
          {message}
        </div>
      )}

      {debugInfo && (
        <div style={styles.debugBox}>
          <strong>Debug Info:</strong>
          {debugInfo}
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
              <th style={styles.th}>ID</th>
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
                    <span style={{ 
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      ...getRoleColor(user.role) 
                    }}>
                      {getRoleText(user.role)} (אתה)
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
                <td style={{ ...styles.td, fontSize: '0.8rem', color: '#999' }}>
                  {user.id.substring(0, 8)}...
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
                  שמור את הפרטים הבאים:
                </p>
                <div style={styles.credentialsDisplay}>
                  <div><strong>אימייל:</strong> {createdUserDetails.email}</div>
                  <div><strong>סיסמה:</strong> {createdUserDetails.password}</div>
                  <div><strong>תפקיד:</strong> {getRoleText(createdUserDetails.role)}</div>
                </div>
                {createdUserDetails.debug && (
                  <div style={styles.debugBox}>
                    {createdUserDetails.debug}
                  </div>
                )}
                <button
                  onClick={() => {
                    setCreatedUserDetails(null);
                    setShowAddUser(false);
                    setDebugInfo('');
                    fetchUsers(); // רענן שוב את הרשימה
                  }}
                  style={{ ...styles.button, width: '100%', marginTop: '1rem' }}
                >
                  סגור ורענן
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
                  />
                </div>

                <div>
                  <label style={styles.label}>סיסמה *</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      style={{ ...styles.input, flex: 1 }}
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      required
                      minLength={6}
                      disabled={creating}
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
                      🎲
                    </button>
                  </div>
                </div>

                <div>
                  <label style={styles.label}>טלפון</label>
                  <input
                    type="tel"
                    style={styles.input}
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    disabled={creating}
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
                    <option value="VIEWER">צופה</option>
                    <option value="SALES_AGENT">סוכן מכירות</option>
                    <option value="ADMIN">מנהל</option>
                    <option value="SUPER_ADMIN">סופר אדמין</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  style={{
                    ...styles.button,
                    width: '100%',
                    opacity: creating ? 0.7 : 1,
                  }}
                  disabled={creating}
                >
                  {creating ? '⏳ יוצר משתמש...' : '✅ צור משתמש'}
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
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
