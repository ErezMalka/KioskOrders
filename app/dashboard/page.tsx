// הוסף את הקוד הזה בחלק של "פעולות מהירות" ב-dashboard/page.tsx

// מצא את החלק הזה ב-dashboard:
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '15px'
}}>
  {/* הוסף כפתור חדש למוצרים */}
  <button 
    onClick={() => window.location.href = '/products'}
    style={{
      padding: '15px',
      backgroundColor: '#FF5722',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'background-color 0.2s'
    }}
    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E64A19'}
    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF5722'}
  >
    📦 ניהול מוצרים
  </button>
  
  <button 
    onClick={() => alert('יצירת הזמנה חדשה - בפיתוח')}
    style={{
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
