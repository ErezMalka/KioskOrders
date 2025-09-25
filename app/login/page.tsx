'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Get user role after successful login
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, name')
        .eq('id', data.user.id)
        .single();

      // Redirect based on role
      if (profile?.role === 'SUPER_ADMIN') {
        router.push('/admin/users');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError('שם משתמש או סיסמה שגויים');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      
      setError('נשלח אימייל לאיפוס סיסמה');
      setShowForgotPassword(false);
    } catch (error: any) {
      setError('שגיאה בשליחת אימייל איפוס');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '1rem',
    },
    card: {
      backgroundColor: 'white',
      padding: '2.5rem',
      borderRadius: '16px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
      width: '100%',
      maxWidth: '420px',
    },
    logo: {
      textAlign: 'center' as const,
      marginBottom: '2rem',
    },
    logoIcon: {
      fontSize: '4rem',
      marginBottom: '0.5rem',
    },
    title: {
      fontSize: '2rem',
      fontWeight: 'bold',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '0.5rem',
    },
    subtitle: {
      color: '#7f8c8d',
      fontSize: '0.9rem',
    },
    form: {
      marginTop: '2rem',
    },
    inputGroup: {
      marginBottom: '1.2rem',
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      color: '#2c3e50',
      fontSize: '0.9rem',
      fontWeight: '600',
    },
    input: {
      width: '100%',
      padding: '0.9rem',
      border: '2px solid #ecf0f1',
      borderRadius: '8px',
      fontSize: '1rem',
      transition: 'all 0.3s',
      outline: 'none',
    },
    inputFocus: {
      borderColor: '#667eea',
      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
    },
    button: {
      width: '100%',
      padding: '1rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1.1rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s',
      marginTop: '1.5rem',
    },
    buttonHover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 20px rgba(102, 126, 234, 0.3)',
    },
    buttonDisabled: {
      opacity: 0.7,
      cursor: 'not-allowed',
    },
    error: {
      backgroundColor: '#fee',
      color: '#c33',
      padding: '0.75rem',
      borderRadius: '6px',
      fontSize: '0.9rem',
      marginBottom: '1rem',
      textAlign: 'center' as const,
      border: '1px solid #fcc',
    },
    info: {
      backgroundColor: '#e3f2fd',
      color: '#1976d2',
      padding: '0.75rem',
      borderRadius: '6px',
      fontSize: '0.9rem',
      marginBottom: '1rem',
      textAlign: 'center' as const,
      border: '1px solid #90caf9',
    },
    forgotPassword: {
      textAlign: 'center' as const,
      marginTop: '1.5rem',
    },
    link: {
      color: '#667eea',
      textDecoration: 'none',
      fontSize: '0.9rem',
      cursor: 'pointer',
      transition: 'color 0.3s',
    },
    linkHover: {
      color: '#764ba2',
      textDecoration: 'underline',
    },
    divider: {
      textAlign: 'center' as const,
      margin: '1.5rem 0',
      position: 'relative' as const,
      color: '#95a5a6',
    },
    dividerLine: {
      position: 'absolute' as const,
      top: '50%',
      left: 0,
      right: 0,
      height: '1px',
      backgroundColor: '#ecf0f1',
    },
    dividerText: {
      position: 'relative' as const,
      backgroundColor: 'white',
      padding: '0 1rem',
      fontSize: '0.85rem',
    },
    footer: {
      textAlign: 'center' as const,
      marginTop: '2rem',
      paddingTop: '1.5rem',
      borderTop: '1px solid #ecf0f1',
      color: '#95a5a6',
      fontSize: '0.85rem',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>🏪</div>
          <h1 style={styles.title}>מערכת ניהול קיוסק</h1>
          <p style={styles.subtitle}>התחבר כדי להמשיך</p>
        </div>

        {error && (
          <div style={error.includes('אימייל') ? styles.info : styles.error}>
            {error}
          </div>
        )}

        {!showForgotPassword ? (
          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>כתובת אימייל</label>
              <input
                type="email"
                style={styles.input}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#ecf0f1';
                  e.target.style.boxShadow = 'none';
                }}
                required
                disabled={loading}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>סיסמה</label>
              <input
                type="password"
                style={styles.input}
                placeholder="הכנס סיסמה"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#ecf0f1';
                  e.target.style.boxShadow = 'none';
                }}
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              style={{
                ...styles.button,
                ...(loading ? styles.buttonDisabled : {}),
              }}
              disabled={loading}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(102, 126, 234, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {loading ? '⏳ מתחבר...' : '🔐 התחבר'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>הכנס את כתובת האימייל שלך</label>
              <input
                type="email"
                style={styles.input}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              style={{
                ...styles.button,
                ...(loading ? styles.buttonDisabled : {}),
              }}
              disabled={loading}
            >
              {loading ? 'שולח...' : 'שלח קישור לאיפוס סיסמה'}
            </button>

            <div style={styles.forgotPassword}>
              <a
                onClick={() => setShowForgotPassword(false)}
                style={styles.link}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#764ba2';
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#667eea';
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                חזור להתחברות
              </a>
            </div>
          </form>
        )}

        {!showForgotPassword && (
          <>
            <div style={styles.forgotPassword}>
              <a
                onClick={() => setShowForgotPassword(true)}
                style={styles.link}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#764ba2';
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#667eea';
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                שכחת סיסמה?
              </a>
            </div>

            <div style={styles.footer}>
              <p>🔒 מערכת מאובטחת</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                גישה למורשים בלבד
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
