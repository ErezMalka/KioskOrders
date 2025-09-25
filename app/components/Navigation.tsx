'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    checkUser();
  }, [pathname]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Don't show navigation on login page
  if (pathname === '/login' || pathname === '/setup') {
    return null;
  }

  const menuItems = [
    { path: '/dashboard', label: '🏠 לוח בקרה', icon: '🏠' },
    { path: '/orders/create', label: '➕ הזמנה חדשה', icon: '➕' },
    { path: '/orders', label: '📋 הזמנות', icon: '📋' },
    { path: '/products', label: '📦 מוצרים', icon: '📦' },
    { path: '/customers', label: '👥 לקוחות', icon: '👥' },
    { path: '/reports', label: '📊 דוחות', icon: '📊' },
  ];

  return (
    <nav style={{
      backgroundColor: '#2c3e50',
      padding: '0',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      direction: 'rtl'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px'
      }}>
        {/* Logo/Title */}
        <div style={{
          color: 'white',
          fontSize: '20px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
        onClick={() => router.push('/dashboard')}
        >
          🏪 מערכת ניהול הזמנות
        </div>

        {/* Desktop Menu */}
        <div style={{
          display: 'flex',
          gap: '5px',
          alignItems: 'center',
          '@media (max-width: 768px)': {
            display: 'none'
          }
        }}>
          {menuItems.map(item => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              style={{
                padding: '8px 16px',
                backgroundColor: pathname === item.path ? '#34495e' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background-color 0.3s',
                whiteSpace: 'nowrap'
              }}
              onMouseOver={(e) => {
                if (pathname !== item.path) {
                  e.currentTarget.style.backgroundColor = '#34495e';
                }
              }}
              onMouseOut={(e) => {
                if (pathname !== item.path) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {item.label}
            </button>
          ))}
          
          {/* User info & Logout */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginRight: '20px',
            paddingRight: '20px',
            borderRight: '1px solid #34495e'
          }}>
            {user && (
              <span style={{ color: '#ecf0f1', fontSize: '14px' }}>
                {user.email}
              </span>
            )}
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              יציאה
            </button>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'none',
            padding: '8px',
            backgroundColor: 'transparent',
            color: 'white',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            '@media (max-width: 768px)': {
              display: 'block'
            }
          }}
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{
          backgroundColor: '#34495e',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px'
        }}>
          {menuItems.map(item => (
            <button
              key={item.path}
              onClick={() => {
                router.push(item.path);
                setMenuOpen(false);
              }}
              style={{
                padding: '10px',
                backgroundColor: pathname === item.path ? '#2c3e50' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                textAlign: 'right'
              }}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={handleLogout}
            style={{
              padding: '10px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              marginTop: '10px'
            }}
          >
            יציאה
          </button>
        </div>
      )}
    </nav>
  );
}
