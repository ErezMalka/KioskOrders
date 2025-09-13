export default function HomePage() {
  return (
    <div style={{ 
      padding: '2rem',
      textAlign: 'center',
      fontFamily: 'system-ui'
    }}>
      <h1>מערכת ניהול הזמנות קיוסק</h1>
      <p>ברוך הבא למערכת</p>
      
      <div style={{ marginTop: '2rem' }}>
        <a 
          href="/dashboard" 
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
            marginRight: '10px'
          }}
        >
          לדשבורד
        </a>
        
        <a 
          href="/api/health" 
          style={{
            padding: '10px 20px',
            backgroundColor: '#6b7280',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px'
          }}
        >
          בדיקת מערכת
        </a>
      </div>
      
      <div style={{ marginTop: '4rem' }}>
        <h2>סטטיסטיקות</h2>
        <p>סה"כ הזמנות: 156</p>
        <p>ממתינות: 23</p>
        <p>הושלמו: 133</p>
      </div>
    </div>
  )
}
