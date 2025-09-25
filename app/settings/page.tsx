'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface UserSettings {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  green_api_instance?: string;
  green_api_token?: string;
  whatsapp_number?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  
  const [settings, setSettings] = useState<UserSettings>({
    id: '',
    name: '',
    email: '',
    phone: '',
    role: '',
    green_api_instance: '',
    green_api_token: '',
    whatsapp_number: ''
  });

  const [showApiToken, setShowApiToken] = useState(false);

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Load user profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        setMessage('שגיאה בטעינת ההגדרות');
        setMessageType('error');
      } else if (profile) {
        setSettings({
          id: profile.id,
          name: profile.name || '',
          email: user.email || '',
          phone: profile.phone || '',
          role: profile.role || '',
          green_api_instance: profile.green_api_instance || '',
          green_api_token: profile.green_api_token || '',
          whatsapp_number: profile.whatsapp_number || ''
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('שגיאה בטעינת ההגדרות');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: settings.name,
          phone: settings.phone,
          green_api_instance: settings.green_api_instance || null,
          green_api_token: settings.green_api_token || null,
          whatsapp_number: settings.whatsapp_number || null
        })
        .eq('id', settings.id);

      if (error) {
        console.error('Error saving settings:', error);
        setMessage('שגיאה בשמירת ההגדרות');
        setMessageType('error');
      } else {
        setMessage('ההגדרות נשמרו בהצלחה!');
        setMessageType('success');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('שגיאה בשמירת ההגדרות');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const testWhatsAppConnection = async () => {
    if (!settings.green_api_instance || !settings.green_api_token) {
      setMessage('נא להזין Instance ID ו-Token לפני הבדיקה');
      setMessageType('error');
      return;
    }

    setTestingWhatsApp(true);
    setMessage('');

    try {
      // Test the Green API connection
      const response = await fetch(
        `https://api.green-api.com/waInstance${settings.green_api_instance}/getStateInstance/${settings.green_api_token}`,
        {
          method: 'GET',
        }
      );

      const data = await response.json();

      if (response.ok && data.stateInstance === 'authorized') {
        setMessage('החיבור ל-WhatsApp פעיל! ✅');
        setMessageType('success');
        
        // Try to send a test message to self
        if (settings.whatsapp_number) {
          await sendTestMessage();
        }
      } else {
        setMessage(`החיבור ל-WhatsApp לא פעיל. סטטוס: ${data.stateInstance || 'לא מחובר'}`);
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error testing WhatsApp:', error);
      setMessage('שגיאה בבדיקת החיבור ל-WhatsApp');
      setMessageType('error');
    } finally {
      setTestingWhatsApp(false);
    }
  };

  const sendTestMessage = async () => {
    try {
      let phoneNumber = settings.whatsapp_number.replace(/\D/g, '');
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '972' + phoneNumber.substring(1);
      }

      const response = await fetch(
        `https://api.green-api.com/waInstance${settings.green_api_instance}/sendMessage/${settings.green_api_token}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatId: `${phoneNumber}@c.us`,
            message: `🔧 *הודעת בדיקה*\n\nהחיבור ל-WhatsApp הוגדר בהצלחה!\n\nשם הסוכן: ${settings.name}\nזמן: ${new Date().toLocaleString('he-IL')}`
          }),
        }
      );

      if (response.ok) {
        setMessage('החיבור פעיל! הודעת בדיקה נשלחה למספר שלך 📱');
        setMessageType('success');
      }
    } catch (error) {
      console.error('Error sending test message:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>טוען הגדרות...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ marginBottom: '30px' }}>⚙️ הגדרות חשבון</h1>

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

      {/* Personal Information */}
      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px'
      }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>👤 פרטים אישיים</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              שם מלא
            </label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
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
              טלפון
            </label>
            <input
              type="tel"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
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
              אימייל
            </label>
            <input
              type="email"
              value={settings.email}
              disabled
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                backgroundColor: '#f0f0f0',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              תפקיד
            </label>
            <input
              type="text"
              value={settings.role}
              disabled
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                backgroundColor: '#f0f0f0',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>
      </div>

      {/* WhatsApp Configuration */}
      <div style={{
        backgroundColor: '#e8f5e9',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px',
        border: '1px solid #4CAF50'
      }}>
        <h2 style={{ marginBottom: '20px', color: '#2e7d32' }}>
          📱 הגדרות WhatsApp (Green API)
        </h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Instance ID
          </label>
          <input
            type="text"
            placeholder="לדוגמה: 7103914530"
            value={settings.green_api_instance}
            onChange={(e) => setSettings({ ...settings, green_api_instance: e.target.value })}
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

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            API Token
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showApiToken ? 'text' : 'password'}
              placeholder="הכנס את ה-API Token שלך"
              value={settings.green_api_token}
              onChange={(e) => setSettings({ ...settings, green_api_token: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                paddingLeft: '50px',
                fontSize: '16px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="button"
              onClick={() => setShowApiToken(!showApiToken)}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '20px'
              }}
            >
              {showApiToken ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            מספר WhatsApp (לבדיקות)
          </label>
          <input
            type="tel"
            placeholder="050-1234567"
            value={settings.whatsapp_number}
            onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
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

        <button
          onClick={testWhatsAppConnection}
          disabled={testingWhatsApp}
          style={{
            padding: '10px 20px',
            backgroundColor: '#25D366',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: testingWhatsApp ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            marginTop: '10px'
          }}
        >
          {testingWhatsApp ? 'בודק חיבור...' : '🔌 בדוק חיבור WhatsApp'}
        </button>

        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#fff3cd',
          borderRadius: '5px',
          border: '1px solid #ffc107'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>📝 הוראות הגדרה:</h4>
          <ol style={{ margin: '5px 0', paddingRight: '20px', color: '#856404' }}>
            <li>הירשם ב-<a href="https://green-api.com" target="_blank" rel="noopener noreferrer">Green API</a></li>
            <li>צור Instance חדש וסרוק את קוד ה-QR עם WhatsApp</li>
            <li>העתק את ה-Instance ID וה-API Token</li>
            <li>הדבק אותם בשדות למעלה ולחץ על "בדוק חיבור"</li>
          </ol>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '12px 40px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '18px',
            fontWeight: 'bold'
          }}
        >
          {saving ? 'שומר...' : '💾 שמור הגדרות'}
        </button>
        
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            padding: '12px 40px',
            backgroundColor: '#9e9e9e',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '18px'
          }}
        >
          ביטול
        </button>
      </div>
    </div>
  );
}
