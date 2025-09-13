// app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// יצירת Supabase client
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
  const [success, setSuccess] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  // בדיקת סשן קיים - אם המשתמש כבר מחובר, העבר לדשבורד
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('Active session found, redirecting to dashboard...');
        router.push('/dashboard');
      }
    };
    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        // רישום משתמש חדש
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data?.user) {
          setSuccess('נרשמת בהצלחה! כעת תוכל להתחבר עם הפרטים שיצרת.');
          setIsSignUp(false);
          // נקה את השדות אחרי רישום מוצלח
          setEmail('');
          setPassword('');
        }
      } else {
        // התחברות למערכת
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data?.user) {
          console.log('Login successful! User:', data.user.email);
          setSuccess('התחברת בהצלחה! מעביר לדשבורד...');
          
          // המתן רגע כדי שהמשתמש יראה את ההודעה
          setTimeout(() => {
            router.push('/dashboard');
            router.refresh();
          }, 1000);
        }
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      
      // הודעות שגיאה ידידותיות
      if (error.message.includes('Invalid login credentials')) {
        setError('אימייל או סיסמה שגויים');
      } else if (error.message.includes('Email not confirmed')) {
        setError('יש לאמת את כתובת האימייל לפני התחברות');
      } else if (error.message.includes('User already registered')) {
        setError('משתמש עם אימייל זה כבר קיים במערכת');
      } else {
        setError(error.message || 'שגיאה בהתחברות');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('נא להזין כתובת אימייל');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) throw error;
      
      setSuccess('קישור לאיפוס סיסמה נשלח לאימייל שלך');
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
      direction: 'rtl',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.06)',
        width: '100%',
        maxWidth: '420px',
        margin: '20px'
      }}>
        {/* Logo and Title */}
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>🛒</div>
          <h1 style={{ 
            color: '#1a1a1a',
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '8px',
            margin: '0'
          }}>
            מערכת ניהול הזמנות
          </h1>
          <p style={{ 
            color: '#666',
            fontSize: '14px',
            margin: '0'
          }}>
            Kiosk Order Management System
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '12px 16px',
            marginBottom: '20px',
            borderRadius: '8px',
            backgroundColor: '#fee',
            color: '#c00',
            fontSize: '14px',
            borderRight: '4px solid #c00'
          }}>
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div style={{
            padding: '12px 16px',
            marginBottom: '20px',
            borderRadius: '8px',
            backgroundColor: '#e6f7e6',
            color: '#2e7d2e',
            fontSize: '14px',
            borderRight: '4px solid #4CAF50'
          }}>
            {success}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#444',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              כתובת אימייל
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '15px',
                direction: 'ltr',
                outline: 'none',
                transition: 'all 0.2s',
                backgroundColor: loading ? '#f5f5f5' : 'white',
                cursor: loading ? 'not-allowed' : 'text'
              }}
              onFocus={(e) => {
                if (!loading) e.target.style.borderColor = '#4CAF50';
              }}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#444',
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
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '15px',
                direction: 'ltr',
                outline: 'none',
                transition: 'all 0.2s',
                backgroundColor: loading ? '#f5f5f5' : 'white',
                cursor: loading ? 'not-allowed' : 'text'
              }}
              onFocus={(e) => {
                if (!loading) e.target.style.borderColor = '#4CAF50';
              }}
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
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              marginBottom: '16px'
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#45a049';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#4CAF50';
            }}
          >
            {loading ? '⏳ מעבד...' : (isSignUp ? '📝 הרשמה' : '🔐 התחברות')}
          </button>

          {/* Secondary Actions */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            paddingTop: '16px',
            borderTop: '1px solid #eee'
          }}>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccess(null);
              }}
              disabled={loading}
              style={{
                background: 'none',
                border: 'none',
                color: loading ? '#999' : '#4CAF50',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                padding: '4px 0'
              }}
            >
              {isSignUp ? '← חזרה להתחברות' : '➕ יצירת חשבון חדש'}
            </button>

            {!isSignUp && (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: loading ? '#999' : '#666',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  padding: '4px 0'
                }}
              >
                שכחתי סיסמה
              </button>
            )}
          </div>
        </form>

        {/* Test Credentials Info */}
        <div style={{
          marginTop: '30px',
          padding: '16px',
          backgroundColor: '#f0f8ff',
          borderRadius: '8px',
          border: '1px solid #b3d9ff',
          fontSize: '13px',
          color: '#004085'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '8px',
            fontWeight: '600'
          }}>
            <span style={{ marginLeft: '6px' }}>🔑</span>
            <span>פרטי גישה לבדיקה:</span>
          </div>
          <div style={{ 
            fontFamily: 'monospace',
            backgroundColor: 'white',
            padding: '8px',
            borderRadius: '4px',
            marginTop: '8px',
            direction: 'ltr'
          }}>
            <div>Email: admin@test.com</div>
            <div>Password: Test1234!</div>
          </div>
          <div style={{ 
            marginTop: '10px',
            fontSize: '12px',
            opacity: '0.8'
          }}>
            💡 טיפ: אם המשתמש לא קיים, השתמש בכפתור "יצירת חשבון חדש"
          </div>
        </div>

        {/* System Status */}
        <div style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          fontSize: '11px',
          color: '#666',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '4px' }}>
            🟢 סטטוס מערכת: {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}
          </div>
          <div>
            {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ מחובר ל-Supabase' : '❌ לא מחובר ל-Supabase'}
          </div>
        </div>
      </div>
    </div>
  );
}
