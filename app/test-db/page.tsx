'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function TestPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchData() {
      try {
        // בדיקת profiles
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('*')
        
        if (profileError) throw profileError

        // בדיקת tasks
        const { data: tasks, error: tasksError } = await supabase
          .from('dev_tasks')
          .select('*')
          .limit(5)
        
        if (tasksError) throw tasksError

        // בדיקת teams
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select('*')
        
        if (teamsError) throw teamsError

        // בדיקת current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        setData({
          profiles,
          tasks,
          teams,
          currentUser: user,
          summary: {
            profileCount: profiles?.length || 0,
            taskCount: tasks?.length || 0,
            teamCount: teams?.length || 0,
            isAuthenticated: !!user
          }
        })
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔧 Database Connection Test</h1>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
          </div>
        )}
        
        {data && (
          <div className="space-y-6">
            {/* Connection Status */}
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4">
              <p className="font-bold">✅ Connected to Supabase!</p>
              <p className="text-sm mt-1">Database is accessible</p>
            </div>
            
            {/* Summary */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">📊 Database Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{data.summary.profileCount}</div>
                  <div className="text-sm text-gray-600">Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{data.summary.taskCount}</div>
                  <div className="text-sm text-gray-600">Tasks</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{data.summary.teamCount}</div>
                  <div className="text-sm text-gray-600">Teams</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {data.summary.isAuthenticated ? '✅' : '❌'}
                  </div>
                  <div className="text-sm text-gray-600">Auth Status</div>
                </div>
              </div>
            </div>
            
            {/* Current User */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">👤 Current User</h2>
              {data.currentUser ? (
                <div className="space-y-2">
                  <p><span className="font-medium">Email:</span> {data.currentUser.email}</p>
                  <p><span className="font-medium">ID:</span> <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{data.currentUser.id}</code></p>
                </div>
              ) : (
                <p className="text-gray-500">Not authenticated</p>
              )}
            </div>
            
            {/* Users List */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">👥 Users in System</h2>
              {data.profiles && data.profiles.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left pb-2">Name</th>
                        <th className="text-left pb-2">Email</th>
                        <th className="text-left pb-2">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.profiles.map((p: any) => (
                        <tr key={p.id}>
                          <td className="py-2">{p.full_name}</td>
                          <td className="py-2">{p.email}</td>
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              p.role === 'admin' ? 'bg-red-100 text-red-700' :
                              p.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {p.role}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No users found</p>
              )}
            </div>
            
            {/* Tasks List */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">📋 Recent Tasks</h2>
              {data.tasks && data.tasks.length > 0 ? (
                <div className="space-y-2">
                  {data.tasks.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">#{t.task_number}:</span> {t.title}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        t.status === 'done' ? 'bg-green-100 text-green-700' :
                        t.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                        t.status === 'blocked' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No tasks found</p>
              )}
            </div>
            
            {/* Teams List */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">👨‍👩‍👧‍👦 Teams</h2>
              {data.teams && data.teams.length > 0 ? (
                <div className="space-y-2">
                  {data.teams.map((t: any) => (
                    <div key={t.id} className="p-3 bg-gray-50 rounded">
                      <div className="font-medium">{t.name}</div>
                      {t.description && (
                        <div className="text-sm text-gray-600 mt-1">{t.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No teams found</p>
              )}
            </div>
          </div>
        )}
        
        {/* Navigation Links */}
        <div className="mt-8 p-6 bg-white shadow rounded-lg">
          <h2 className="text-xl font-bold mb-4">🔗 Quick Links</h2>
          <div className="space-y-2">
            <a href="/auth/login" className="block text-blue-600 hover:underline">
              → Go to Login Page
            </a>
            <a href="/dev" className="block text-blue-600 hover:underline">
              → Go to Developer Dashboard
            </a>
            <a href="/" className="block text-blue-600 hover:underline">
              → Go to Home Page
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
