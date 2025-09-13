export default function DashboardPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        לוח בקרה
      </h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1rem' 
      }}>
        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: 'white', 
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3>סה"כ הזמנות</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>156</p>
        </div>
        
        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: 'white', 
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3>הזמנות ממתינות</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>23</p>
        </div>
        
        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: 'white', 
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3>הושלמו</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>133</p>
        </div>
      </div>
    </div>
  )
}
