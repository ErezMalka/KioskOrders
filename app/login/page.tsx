// app/login/page.tsx - גרסה ללא auth-helpers
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// יצירת Supabase client ישירות
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState('admin@test.com');
  const [password, setPassword] = useState('Test1234!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // רישום משתמש חדש
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data?.user) {
          setError('נרשמת בהצלחה! בדוק את האימייל שלך לאימות.');
          setIsSignUp(false);
        }
      } else {
        // התחברות
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data?.user) {
          // בדיקה אם יש פרופיל
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          // אם אין פרופיל, ניצור אחד
          if (!profile) {
            await supabase.from('profiles').insert({
              id: data.user.id,
              email: data.user.email,
              full_name: data.user.email?.split('@')[0],
              role: 'user',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }

          // הפניה לדשבורד
          router.push('/dashboard');
          router.refresh();
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || 'שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('נא להזין אימייל');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) throw error;
      
      setError('נשלח קישור לאיפוס סיסמה לאימייל שלך');
    } catch (error: any) {
      setError(error.message || 'שגיאה בשליחת איפוס סיסמה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      direction: 'rtl'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Logo/Title */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ 
            color: '#333',
            fontSize: '28px',
            marginBottom: '10px'
          }}>
            🛒 מערכת ניהול הזמנות
          </h1>
          <p style={{ 
            color: '#666',
            fontSize: '14px'
          }}>
            Kiosk Order Management System
          </p>
        </div>

        {/* Error/Success Message */}
        {error && (
          <div style={{
            padding: '12px',
            marginBottom: '20px',
            borderRadius: '5px',
            backgroundColor: error.includes('בהצלחה') ? '#d4edda' : '#f8d7da',
            color: error.includes('בהצלחה') ? '#155724' : '#721c24',
            border: `1px solid ${error.includes('בהצלחה') ? '#c3e6cb' : '#f5c6cb'}`,
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#555',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              אימייל
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px',
                direction: 'ltr',
                transition: 'border-color 0.3s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#555',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              סיסמה
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px',
                direction: 'ltr',
                transition: 'border-color 0.3s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s',
              marginBottom: '15px'
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#45a049')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#4CAF50')}
          >
            {loading ? 'מתחבר...' : (isSignUp ? 'הרשמה' : 'התחברות')}
          </button>

          {/* Toggle SignUp/Login */}
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              style={{
                background: 'none',
                border: 'none',
                color: '#4CAF50',
                cursor: 'pointer',
                fontSize: '14px',
                textDecoration: 'underline'
              }}
            >
              {isSignUp ? 'כבר יש לך חשבון? התחבר' : 'אין לך חשבון? הירשם'}
            </button>
          </div>

          {/* Forgot Password */}
          {!isSignUp && (
            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleForgotPassword}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '13px',
                  textDecoration: 'underline'
                }}
              >
                שכחת סיסמה?
              </button>
            </div>
          )}
        </form>

        {/* Test Credentials Info */}
        <div style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: '#f0f8ff',
          borderRadius: '5px',
          border: '1px solid #b3d9ff',
          fontSize: '13px',
          color: '#004085'
        }}>
          <strong>לבדיקה:</strong><br />
          Email: admin@test.com<br />
          Password: Test1234!
        </div>

        {/* Environment Info */}
        <div style={{
          marginTop: '15px',
          fontSize: '11px',
          color: '#999',
          textAlign: 'center'
        }}>
          Environment: {process.env.NODE_ENV}<br />
          Supabase: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Connected' : 'Not Connected'}
        </div>
      </div>
    </div>
  );
}
