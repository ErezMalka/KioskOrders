'use client';

import React, { useState, useEffect } from 'react';
import { Users, Shield, UserPlus, Edit, Trash2, Check, X } from 'lucide-react';

interface User {
  id: string;
  username: string;
  password?: string;
  role: 'admin' | 'user';
  createdAt: Date;
  lastLogin?: Date;
}

export default function SettingsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' as const });
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ username: '', password: '', role: 'user' as const });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // טעינת משתמשים
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        setError('שגיאה בטעינת המשתמשים');
      }
    } catch (err) {
      setError('שגיאה בחיבור לשרת');
    } finally {
      setLoading(false);
    }
  };

  // הוספת משתמש חדש
  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) {
      setError('יש למלא שם משתמש וסיסמה');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      const data = await response.json();
      
      if (data.success) {
        setUsers([...users, data.user]);
        setNewUser({ username: '', password: '', role: 'user' });
        setSuccess('המשתמש נוסף בהצלחה');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'שגיאה בהוספת המשתמש');
      }
    } catch (err) {
      setError('שגיאה בחיבור לשרת');
    }
  };

  // מחיקת משתמש
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק משתמש זה?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        setUsers(users.filter(u => u.id !== userId));
        setSuccess('המשתמש נמחק בהצלחה');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'שגיאה במחיקת המשתמש');
      }
    } catch (err) {
      setError('שגיאה בחיבור לשרת');
    }
  };

  // עדכון משתמש
  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const updateData: any = {
        id: editingUser,
        username: editForm.username,
        role: editForm.role
      };

      if (editForm.password) {
        updateData.password = editForm.password;
      }

      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      
      if (data.success) {
        setUsers(users.map(u => u.id === editingUser ? { ...u, ...updateData } : u));
        setEditingUser(null);
        setEditForm({ username: '', password: '', role: 'user' });
        setSuccess('המשתמש עודכן בהצלחה');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'שגיאה בעדכון המשתמש');
      }
    } catch (err) {
      setError('שגיאה בחיבור לשרת');
    }
  };

  // התחלת עריכה
  const startEdit = (user: User) => {
    setEditingUser(user.id);
    setEditForm({
      username: user.username,
      password: '',
      role: user.role
    });
  };

  // ביטול עריכה
  const cancelEdit = () => {
    setEditingUser(null);
    setEditForm({ username: '', password: '', role: 'user' });
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p>טוען...</p>
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
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: '#efe',
          color: '#060',
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          {success}
        </div>
      )}

      {/* הוספת משתמש חדש */}
      <div style={{
        background: '#f9f9f9',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '30px'
      }}>
        <h2 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserPlus size={24} />
          הוספת משתמש חדש
        </h2>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="שם משתמש"
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            style={{
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              fontSize: '16px',
              minWidth: '150px'
            }}
          />
          
          <input
            type="password"
            placeholder="סיסמה"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            style={{
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              fontSize: '16px',
              minWidth: '150px'
            }}
          />
          
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'user' })}
            style={{
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              fontSize: '16px'
            }}
          >
            <option value="user">משתמש רגיל</option>
            <option value="admin">מנהל</option>
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
              gap: '5px'
            }}
          >
            <UserPlus size={20} />
            הוסף משתמש
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
          משתמשים קיימים
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '15px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>
                  שם משתמש
                </th>
                <th style={{ padding: '15px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>
                  תפקיד
                </th>
                <th style={{ padding: '15px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>
                  תאריך יצירה
                </th>
                <th style={{ padding: '15px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>
                  התחברות אחרונה
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
                        <input
                          type="text"
                          value={editForm.username}
                          onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
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
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'admin' | 'user' })}
                          style={{
                            padding: '5px',
                            borderRadius: '3px',
                            border: '1px solid #ddd'
                          }}
                        >
                          <option value="user">משתמש</option>
                          <option value="admin">מנהל</option>
                        </select>
                      </td>
                      <td style={{ padding: '15px' }}>
                        {new Date(user.createdAt).toLocaleDateString('he-IL')}
                      </td>
                      <td style={{ padding: '15px' }}>
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('he-IL') : '-'}
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
                        >
                          <X size={16} />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '15px' }}>
                        {user.username}
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '15px',
                          background: user.role === 'admin' ? '#ffeaa7' : '#74b9ff',
                          fontSize: '14px'
                        }}>
                          {user.role === 'admin' ? 'מנהל' : 'משתמש'}
                        </span>
                      </td>
                      <td style={{ padding: '15px' }}>
                        {new Date(user.createdAt).toLocaleDateString('he-IL')}
                      </td>
                      <td style={{ padding: '15px' }}>
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('he-IL') : '-'}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
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
                        >
                          <Trash2 size={16} />
                        </button>
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
