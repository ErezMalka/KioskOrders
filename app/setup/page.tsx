'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SetupPage() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('Test1234!');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const createUser = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      // צור משתמש חדש
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            name: 'Test User'
          }
        }
      });

      if (error) {
        setMessage(`שגיאה: ${error.message}`);
      } else {
        setMessage('המשתמש נוצר בהצלחה! בדוק את המייל לאישור או התחבר ישירות.');
        console.log('User created:', data);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('שגיאה ביצירת משתמש');
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        setMessage(`שגיאה בהתחברות: ${error.message}`);
      } else {
        setMessage('התחברת בהצלחה!');
        console.log('Logged in:', data);
        
        // בדוק אם יש פרופיל
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (profile) {
          setMessage(prev => prev + '\nפרופיל נמצא: ' + JSON.stringify(profile, null, 2));
        } else {
          setMessage(prev => prev + '\nלא נמצא פרופיל - צור אותו ידנית');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      // קבל את המשתמש הנוכחי
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setMessage('לא נמצא משתמש מחובר');
        return;
      }

      // צור פרופיל
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          name: 'Test User',
          role: 'SUPER_ADMIN',
          org_id: '11111111-1111-1111-1111-111111111111',
          phone: '050-1234567'
        })
        .select()
        .single();

      if (error) {
        setMessage(`שגיאה ביצירת פרופיל: ${error.message}`);
      } else {
        setMessage('פרופיל נוצר בהצלחה: ' + JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('שגיאה ביצירת פרופיל');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', direction: 'rtl' }}>
      <h1>הגדרת משתמש בדיקה</h1>
      
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '10px' }}>
        <h2>פרטי משתמש</h2>
        <div style={{ marginBottom: '15px' }}>
          <label>
            אימייל:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ 
                marginRight: '10px',
                padding: '8px',
                fontSize: '16px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                width: '300px'
              }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>
            סיסמה:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ 
                marginRight: '10px',
                padding: '8px',
                fontSize: '16px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                width: '300px'
              }}
            />
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <button
          onClick={createUser}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          1. צור משתמש חדש
        </button>
        
        <button
          onClick={testLogin}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          2. בדוק התחברות
        </button>
        
        <button
          onClick={createProfile}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          3. צור פרופיל (אם צריך)
        </button>
      </div>

      {message && (
        <div style={{
          padding: '15px',
          backgroundColor: message.includes('שגיאה') ? '#ffebee' : '#e8f5e9',
          color: message.includes('שגיאה') ? '#c62828' : '#2e7d32',
          borderRadius: '5px',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace'
        }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#fff3e0', borderRadius: '10px' }}>
        <h3>הוראות:</h3>
        <ol>
          <li>לחץ על "צור משתמש חדש" ליצירת משתמש</li>
          <li>לחץ על "בדוק התחברות" כדי להתחבר ולבדוק אם יש פרופיל</li>
          <li>אם אין פרופיל, לחץ על "צור פרופיל"</li>
          <li>אחרי שהכל עובד, לך ל-<a href="/login" style={{ color: '#2196F3' }}>עמוד ההתחברות</a></li>
        </ol>
      </div>
    </div>
  );
}
