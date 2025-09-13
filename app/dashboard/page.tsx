// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user found, redirecting to login');
        router.push('/login');
        return;
      }

      setUser(user);
      console.log('User loaded:', user.email);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        direction: 'rtl'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <h2>טוען...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      direction: 'rtl'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ 
            margin: 0,
            fontSize: '24px',
            color: '#333'
          }}>
            🛒 לוח בקרה - מערכת ניהול הזמנות
          </h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ color: '#666' }}>
              👤 {user?.email}
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              יציאה
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '40px auto',
        padding: '0 20px'
      }}>
        {/* Welcome Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            fontSize: '28px',
            marginBottom: '10px',
            color: '#333'
          }}>
            ברוך הבא למערכת! 👋
          </h2>
          <p style={{ 
            fontSize: '16px',
            color: '#666'
          }}>
            התחברת בהצלחה למערכת ניהול ההזמנות של Kiosk
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {/* הזמנות */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderRight: '4px solid #4CAF50'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📦</div>
            <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#333' }}>הזמנות</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#4CAF50', margin: 0 }}>0</p>
            <p style={{ fontSize: '14px', color: '#999', marginTop: '5px' }}>סה"כ הזמנות במערכת</p>
          </div>

          {/* לקוחות */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderRight: '4px solid #2196F3'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>👥</div>
            <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#333' }}>לקוחות</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#2196F3', margin: 0 }}>0</p>
            <p style={{ fontSize: '14px', color: '#999', marginTop: '5px' }}>לקוחות פעילים</p>
          </div>

          {/* ספקים */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderRight: '4px solid #FF9800'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🚚</div>
            <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#333' }}>ספקים</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#FF9800', margin: 0 }}>0</p>
            <p style={{ fontSize: '14px', color: '#999', marginTop: '5px' }}>ספקים במערכת</p>
          </div>

          {/* מוצרים */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderRight: '4px solid #9C27B0'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📋</div>
            <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#333' }}>מוצרים</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#9C27B0', margin: 0 }}>0</p>
            <p style={{ fontSize: '14px', color: '#999', marginTop: '5px' }}>מוצרים בקטלוג</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            fontSize: '20px',
            marginBottom: '20px',
            color: '#333'
          }}>
            פעולות מהירות
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            <button style={{
              padding: '15px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              ➕ הזמנה חדשה
            </button>
            
            <button style={{
              padding: '15px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              👤 לקוח חדש
            </button>
            
            <button style={{
              padding: '15px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              📊 דוחות
            </button>
            
            <button style={{
              padding: '15px',
              backgroundColor: '#9C27B0',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              ⚙️ הגדרות
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
