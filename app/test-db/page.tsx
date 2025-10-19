'use client'

import { useEffect, useState } from 'react'

export default function TestDBPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Using environment variables (with fallback to direct values)
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dboriwezpayxvtuxlihj.supabase.co'
        const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRib3Jpd2V6cGF5eHZ0dXhsaWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYyMjg3NjAsImV4cCI6MjA0MTgwNDc2MH0.v0F9Sku9oHkjezcmR2HiRqr5fazs0RLMVUmQ09zcink'

        console.log('🔄 Connecting to Supabase...')

        // Helper function for fetch
        const fetchFromSupabase = async (table: string, params = '') => {
          const response = await fetch(
            `${SUPABASE_URL}/rest/v1/${table}?${params}`,
            {
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          )
          return await response.json()
        }

        // Fetch all data
        const [profiles, tasks, teams, orgs, worklogs, sprints] = await Promise.all([
          fetchFromSupabase('profiles', 'select=*'),
          fetchFromSupabase('dev_tasks', 'select=*&limit=10'),
          fetchFromSupabase('teams', 'select=*'),
          fetchFromSupabase('orgs', 'select=*'),
          fetchFromSupabase('worklogs', 'select=*&limit=5'),
          fetchFromSupabase('sprints', 'select=*')
        ])

        console.log('✅ Data fetched successfully')

        setData({
          profiles: Array.isArray(profiles) ? profiles : [],
          tasks: Array.isArray(tasks) ? tasks : [],
          teams: Array.isArray(teams) ? teams : [],
          orgs: Array.isArray(orgs) ? orgs : [],
          worklogs: Array.isArray(worklogs) ? worklogs : [],
          sprints: Array.isArray(sprints) ? sprints : [],
          summary: {
            profileCount: Array.isArray(profiles) ? profiles.length : 0,
            taskCount: Array.isArray(tasks) ? tasks.length : 0,
            teamCount: Array.isArray(teams) ? teams.length : 0,
            orgCount: Array.isArray(orgs) ? orgs.length : 0,
            worklogCount: Array.isArray(worklogs) ? worklogs.length : 0,
            sprintCount: Array.isArray(sprints) ? sprints.length : 0,
          }
        })
      } catch (err: any) {
        console.error('❌ Error:', err)
        setError(err.message || 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ 
          textAlign: 'center',
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            border: '4px solid #f3f4f6', 
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <h2 style={{ marginTop: '20px', color: '#374151', fontWeight: '600' }}>
            Loading Bite Developer System...
          </h2>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          padding: '30px',
          marginBottom: '20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🚀 Bite Developer Department
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            Database Connection Test & System Overview
          </p>
        </div>
        
        {error && (
          <div style={{ 
            backgroundColor: '#fef2f2', 
            border: '2px solid #fecaca',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h3 style={{ color: '#dc2626', marginBottom: '10px' }}>❌ Connection Error</h3>
            <p style={{ color: '#7f1d1d' }}>{error}</p>
            <p style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>
              Please check your .env.local file and ensure the database is set up correctly.
            </p>
          </div>
        )}
        
        {data && (
          <>
            {/* Success Banner */}
            <div style={{ 
              backgroundColor: '#f0fdf4', 
              border: '2px solid #bbf7d0',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h3 style={{ color: '#14532d', marginBottom: '5px' }}>
                ✅ Database Connected Successfully!
              </h3>
              <p style={{ color: '#166534', fontSize: '14px' }}>
                All systems operational • Project: dboriwezpayxvtuxlihj
              </p>
            </div>

            {/* Stats Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
              gap: '20px',
              marginBottom: '20px'
            }}>
              {[
                { label: 'Users', value: data.summary.profileCount, color: '#3b82f6', icon: '👥' },
                { label: 'Tasks', value: data.summary.taskCount, color: '#10b981', icon: '📋' },
                { label: 'Teams', value: data.summary.teamCount, color: '#8b5cf6', icon: '👨‍👩‍👧' },
                { label: 'Worklogs', value: data.summary.worklogCount, color: '#f59e0b', icon: '⏱️' },
                { label: 'Sprints', value: data.summary.sprintCount, color: '#ef4444', icon: '🏃' },
                { label: 'Organizations', value: data.summary.orgCount, color: '#6366f1', icon: '🏢' }
              ].map((stat, index) => (
                <div key={index} style={{ 
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  transition: 'transform 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ fontSize: '28px', marginBottom: '10px' }}>{stat.icon}</div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: stat.color }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '5px' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Users Table */}
            <div style={{ 
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '30px',
              marginBottom: '20px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
                👥 Team Members
              </h2>
              {data.profiles && data.profiles.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                        <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontSize: '14px' }}>Name</th>
                        <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontSize: '14px' }}>Email</th>
                        <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontSize: '14px' }}>Role</th>
                        <th style={{ textAlign: 'center', padding: '12px', color: '#6b7280', fontSize: '14px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.profiles.map((p: any) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '16px', fontWeight: '500' }}>
                            {p.full_name || 'N/A'}
                          </td>
                          <td style={{ padding: '16px', color: '#6b7280' }}>
                            {p.email}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span style={{
                              padding: '6px 14px',
                              borderRadius: '20px',
                              fontSize: '13px',
                              fontWeight: '600',
                              display: 'inline-block',
                              backgroundColor: 
                                p.role === 'admin' ? '#fee2e2' : 
                                p.role === 'manager' ? '#dbeafe' : 
                                p.role === 'developer' ? '#fef3c7' : 
                                '#f3f4f6',
                              color: 
                                p.role === 'admin' ? '#dc2626' : 
                                p.role === 'manager' ? '#2563eb' : 
                                p.role === 'developer' ? '#d97706' : 
                                '#374151'
                            }}>
                              {p.role?.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <span style={{ 
                              fontSize: '20px',
                              display: 'inline-block'
                            }}>
                              {p.is_active !== false ? '🟢' : '🔴'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px'
                }}>
                  <p style={{ color: '#6b7280', marginBottom: '10px' }}>
                    No users found in the database
                  </p>
                  <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                    Run the SQL setup scripts to populate the database
                  </p>
                </div>
              )}
            </div>
            
            {/* Tasks Section */}
            <div style={{ 
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '30px',
              marginBottom: '20px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
                📋 Recent Tasks
              </h2>
              {data.tasks && data.tasks.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data.tasks.slice(0, 5).map((t: any) => (
                    <div key={t.id} style={{ 
                      padding: '16px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid #e5e7eb',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6'
                      e.currentTarget.style.borderColor = '#d1d5db'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb'
                      e.currentTarget.style.borderColor = '#e5e7eb'
                    }}>
                      <div>
                        <span style={{ 
                          fontWeight: '600', 
                          color: '#374151',
                          fontSize: '16px'
                        }}>
                          #{t.task_number || '?'}
                        </span>
                        <span style={{ 
                          marginLeft: '12px', 
                          color: '#4b5563' 
                        }}>
                          {t.title}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {t.priority && (
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: 
                              t.priority === 'critical' ? '#fee2e2' :
                              t.priority === 'high' ? '#fed7aa' :
                              t.priority === 'medium' ? '#fef3c7' :
                              '#f3f4f6',
                            color: 
                              t.priority === 'critical' ? '#dc2626' :
                              t.priority === 'high' ? '#ea580c' :
                              t.priority === 'medium' ? '#ca8a04' :
                              '#6b7280'
                          }}>
                            {t.priority.toUpperCase()}
                          </span>
                        )}
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: 
                            t.status === 'done' ? '#dcfce7' :
                            t.status === 'in_progress' ? '#fef3c7' :
                            t.status === 'in_review' ? '#e9d5ff' :
                            t.status === 'blocked' ? '#fee2e2' :
                            t.status === 'ready' ? '#dbeafe' :
                            '#f3f4f6',
                          color: 
                            t.status === 'done' ? '#166534' :
                            t.status === 'in_progress' ? '#713f12' :
                            t.status === 'in_review' ? '#6b21a8' :
                            t.status === 'blocked' ? '#991b1b' :
                            t.status === 'ready' ? '#1e40af' :
                            '#374151'
                        }}>
                          {t.status?.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px'
                }}>
                  <p style={{ color: '#6b7280' }}>
                    No tasks found. Create some in the database.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ 
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '30px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
                🚀 Quick Actions
              </h2>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <a href="/dev" style={{ textDecoration: 'none' }}>
                  <button style={{
                    padding: '12px 24px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a67d8'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#667eea'}>
                    Open Developer Dashboard
                  </button>
                </a>
                <a href="/" style={{ textDecoration: 'none' }}>
                  <button style={{
                    padding: '12px 24px',
                    backgroundColor: 'white',
                    color: '#667eea',
                    border: '2px solid #667eea',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#667eea'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white'
                    e.currentTarget.style.color = '#667eea'
                  }}>
                    Back to Kiosk Orders
                  </button>
                </a>
              </div>
              <p style={{ marginTop: '20px', color: '#6b7280', fontSize: '14px' }}>
                💡 <strong>Tip:</strong> Install the Supabase packages to enable the full dashboard
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
