import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f3f4f6'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          מערכת ניהול הזמנות קיוסק
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#6b7280', marginBottom: '2rem' }}>
          ברוך הבא למערכת
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link 
            href="/dashboard" 
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.5rem'
            }}
          >
            לדשבורד
          </Link>
          <Link 
            href="/api/health" 
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6b7280',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.5rem'
            }}
          >
            בדיקת מערכת
          </Link>
        </div>
      </div>
    </div>
  )
}
