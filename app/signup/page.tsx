'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function SignUp() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validations
    if (!formData.email || !formData.password || !formData.name) {
      setError('אנא מלא את כל השדות החובה');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      setLoading(false);
      return;
    }

    try {
      // Step 1: Try to sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: formData.phone
          }
        }
      });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        
        // אם יש שגיאה של אישור אימייל, ננסה להתחבר
        if (signUpError.message.includes('confirm') || 
            signUpError.message.includes('verification')) {
          
          // נסה להתחבר - אולי המשתמש כבר נוצר
          const { data: loginData, error: loginError } = 
            await supabase.auth.signInWithPassword({
              email: formData.email,
              password: formData.password
            });
          
          if (!loginError && loginData.user) {
            // אם ההתחברות הצליחה, המשתמש קיים ומאושר
            await createProfileAndOrg(loginData.user.id);
            setSuccess(true);
            setTimeout(() => router.push('/dashboard'), 1500);
            return;
          }
        }
        
        throw signUpError;
      }

      // Step 2: Create profile and organization
      if (signUpData.user) {
        await createProfileAndOrg(signUpData.user.id);
        
        // Step 3: Try to sign in immediately
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (signInError) {
          // אם ההתחברות נכשלה, כנראה צריך אישור אימייל
          setSuccess(true);
          setError('');
          alert(`
            ההרשמה הושלמה! 
            
            ⚠️ אם קיבלת אימייל אישור - לחץ על הקישור באימייל.
            אם לא - נסה להתחבר עוד כמה דקות.
          `);
        } else {
          // הכל עבד!
          setSuccess(true);
          alert('✅ ההרשמה הושלמה בהצלחה!');
          setTimeout(() => router.push('/dashboard'), 1500);
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // טיפול בשגיאות ספציפיות
      if (error.message?.includes('already registered')) {
        setError('משתמש עם אימייל זה כבר קיים - נסה להתחבר');
      } else if (error.message?.includes('Invalid email')) {
        setError('כתובת אימייל לא תקינה');
      } else if (error.message?.includes('Password')) {
        setError('הסיסמה חלשה מדי');
      } else {
        setError(error.message || 'שגיאה ביצירת חשבון');
      }
    } finally {
      setLoading(false);
    }
  };

  const createProfileAndOrg = async (userId: string) => {
    try {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: 'SALES_AGENT',
          organization_id: userId
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }

      // Create organization
      const { error: orgError } = await supabase
        .from('organizations')
        .upsert({
          id: userId,
          name: `${formData.name} - ארגון`,
          contact_email: formData.email
        });

      if (orgError) {
        console.error('Organization creation error:', orgError);
      }
    } catch (error) {
      console.error('Error creating profile/org:', error);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      padding: '1rem',
    },
    card: {
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      width: '100%',
      maxWidth: '450px',
    },
    header: {
      textAlign: 'center' as const,
      marginBottom: '2rem',
    },
    title: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: '0.5rem',
    },
    subtitle: {
      color: '#7f8c8d',
      fontSize: '0.9rem',
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1.2rem',
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.4rem',
    },
    label: {
      fontSize: '0.9rem',
      fontWeight: '600',
      color: '#2c3e50',
    },
    required: {
      color: '#e74c3c',
    },
    input: {
      padding: '0.75rem',
      border: '2px solid #ecf0f1',
      borderRadius: '6px',
      fontSize: '1rem',
      transition: 'all 0.3s',
      outline: 'none',
    },
    inputFocus: {
      borderColor: '#3498db',
    },
    button: {
      padding: '0.9rem',
      backgroundColor: '#27ae60',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '1rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      marginTop: '0.5rem',
      transition: 'background-color 0.3s',
    },
    buttonHover: {
      backgroundColor: '#229954',
    },
    error: {
      backgroundColor: '#ffebee',
      color: '#c62828',
      padding: '0.75rem',
      borderRadius: '6px',
      fontSize: '0.9rem',
      marginBottom: '1rem',
      textAlign: 'center' as const,
      border: '1px solid #ffcdd2',
    },
    success: {
      backgroundColor: '#e8f5e9',
      color: '#2e7d32',
      padding: '0.75rem',
      borderRadius: '6px',
      fontSize: '0.9rem',
      marginBottom: '1rem',
      textAlign: 'center' as const,
      border: '1px solid #a5d6a7',
    },
    footer: {
      marginTop: '1.5rem',
      textAlign: 'center' as const,
      fontSize: '0.9rem',
      color: '#7f8c8d',
    },
    link: {
      color: '#3498db',
      textDecoration: 'none',
      fontWeight: '600',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>🚀 הצטרף למערכת</h1>
          <p style={styles.subtitle}>צור חשבון חדש ותתחיל לנהל הזמנות</p>
        </div>
        
        {error && <div style={styles.error}>⚠️ {error}</div>}
        {success && (
          <div style={styles.success}>
            ✅ ההרשמה הושלמה! מעביר אותך למערכת...
          </div>
        )}
        
        <form onSubmit={handleSignUp} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              שם מלא <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="name"
              style={styles.input}
              placeholder="ישראל ישראלי"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              אימייל <span style={styles.required}>*</span>
            </label>
            <input
              type="email"
              name="email"
              style={styles.input}
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              טלפון
            </label>
            <input
              type="tel"
              name="phone"
              style={styles.input}
              placeholder="050-1234567"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              סיסמה <span style={styles.required}>*</span>
            </label>
            <input
              type="password"
              name="password"
              style={styles.input}
              placeholder="לפחות 6 תווים"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              אישור סיסמה <span style={styles.required}>*</span>
            </label>
            <input
              type="password"
              name="confirmPassword"
              style={styles.input}
              placeholder="הכנס את הסיסמה שוב"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            disabled={loading}
          >
            {loading ? '⏳ נרשם...' : '🚀 הירשם עכשיו'}
          </button>
        </form>

        <div style={styles.footer}>
          כבר יש לך חשבון?{' '}
          <Link href="/login" style={styles.link}>
            התחבר כאן
          </Link>
        </div>
      </div>
    </div>
  );
}
