'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    checkUser();
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [pathname]);

  const checkMobile = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user);
    
    // Get user profile with role
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        setUserProfile(profile);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Don't show navigation on login page
  if (pathname === '/login' || pathname === '/setup' || pathname === '/signup') {
    return null;
  }

  // Base menu items 
  let menuItems = [
    { path: '/dashboard', label: '🏠 לוח בקרה', icon: '🏠' },
    { path: '/orders/create', label: '➕ הזמנה חדשה', icon: '➕' },
    { path: '/orders', label: '📋 הזמנות', icon: '📋' },
    { path: '/products', label: '📦 מוצרים', icon: '📦' },
    { path: '/customers', label: '👥 לקוחות', icon: '👥' },
    { path: '/reports', label: '📊 דוחות', icon: '📊' },
    { path: '/settings', label: '⚙️ הגדרות', icon: '⚙️' },
  ];

  // Filter menu items based on role
  if (userProfile?.role === 'VIEWER') {
    menuItems = menuItems.filter(item => 
      ['/dashboard', '/orders', '/reports'].includes(item.path)
    );
  } else if (userProfile?.role === 'SALES_AGENT') {
    menuItems = menuItems.filter(item => 
      item.path !== '/settings'
    );
  }

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { text: 'סופר אדמין', color: '#ff6b6b' };
      case 'ADMIN':
        return { text: 'מנהל', color: '#4ecdc4' };
      case 'SALES_AGENT':
        return { text: 'סוכן', color: '#45b7d1' };
      case 'VIEWER':
        return { text: 'צופה', color: '#95a5a6' };
      default:
        return { text: '', color: '' };
    }
  };

  const roleDisplay = getRoleDisplay(userProfile?.role || '');

  return (
    <>
      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-menu {
            display: none !important;
          }
          .mobile-menu-button {
            display: block !important;
          }
          .role-tag-desktop {
            display: none !important;
          }
        }
        @media (min-width: 769px) {
          .desktop-menu {
            display: flex !important;
          }
          .mobile-menu-button {
            display: none !important;
          }
        }
      `}</style>

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
          <div 
            className="desktop-menu"
            style={{
              display: 'flex',
              gap: '5px',
              alignItems: 'center'
            }}
          >
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

            {/* Admin Button - Only for Super Admin */}
            {userProfile?.role === 'SUPER_ADMIN' && (
              <>
                {/* Divider */}
                <div style={{
                  width: '1px',
                  height: '30px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  margin: '0 10px'
                }} />
                
                <button
                  onClick={() => router.push('/admin/users')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: pathname === '/admin/users' ? '#c0392b' : '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#c0392b';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = pathname === '/admin/users' ? '#c0392b' : '#e74c3c';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                  }}
                >
                  🔐 ניהול משתמשים
                </button>
              </>
            )}
            
            {/* User info & Logout */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginRight: '20px',
              paddingRight: '20px',
              borderRight: '1px solid #34495e'
            }}>
              {/* Role Tag */}
              {roleDisplay.text && (
                <span 
                  className="role-tag-desktop"
                  style={{ 
                    backgroundColor: roleDisplay.color,
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                >
                  {roleDisplay.text}
                </span>
              )}
              
              {user && (
                <span style={{ color: '#ecf0f1', fontSize: '14px' }}>
                  {userProfile?.name || user.email}
                </span>
              )}
              
              <button
                onClick={handleLogout}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#7f8c8d';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#95a5a6';
                }}
              >
                יציאה
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: 'none',
              padding: '8px',
              backgroundColor: 'transparent',
              color: 'white',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer'
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
            {/* User Info in Mobile */}
            <div style={{
              padding: '10px',
              backgroundColor: '#2c3e50',
              borderRadius: '5px',
              marginBottom: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px'
            }}>
              <span style={{ color: 'white', fontSize: '14px' }}>
                {userProfile?.name || user?.email}
              </span>
              {roleDisplay.text && (
                <span style={{ 
                  backgroundColor: roleDisplay.color,
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  alignSelf: 'flex-start'
                }}>
                  {roleDisplay.text}
                </span>
              )}
            </div>

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
            
            {/* Admin Button in Mobile - Only for Super Admin */}
            {userProfile?.role === 'SUPER_ADMIN' && (
              <>
                <div style={{
                  height: '1px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  margin: '10px 0'
                }} />
                
                <button
                  onClick={() => {
                    router.push('/admin/users');
                    setMenuOpen(false);
                  }}
                  style={{
                    padding: '10px',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '5px'
                  }}
                >
                  🔐 ניהול משתמשים
                </button>
              </>
            )}
            
            <button
              onClick={handleLogout}
              style={{
                padding: '10px',
                backgroundColor: '#95a5a6',
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
    </>
  );
}
