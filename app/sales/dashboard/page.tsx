'use client'

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target,
  MapPin,
  Calendar,
  Clock,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart,
  Activity as ActivityIcon,
  Star,
  Award
} from 'lucide-react';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Activity {
  id: string;
  agent_id: string;
  business_name?: string;
  city?: string;
  visit_date: string;
  status: string;
  notes?: string;
  created_at: string;
  agent?: {
    name: string;
  };
}

interface Agent {
  id: string;
  name: string;
  phone: string;
  email: string;
  region: string;
  status: string;
  monthly_target: number;
  created_at: string;
}

interface Lead {
  id: string;
  business_name: string;
  contact_name: string;
  phone: string;
  email: string;
  city: string;
  status: string;
  assigned_agent: string;
  created_at: string;
  last_visit?: string;
  notes?: string;
  agent?: {
    name: string;
  };
}

export default function SalesDashboard() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedAgent, setSelectedAgent] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod, selectedAgent]);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [activitiesRes, agentsRes, leadsRes] = await Promise.all([
        supabase
          .from('sales_visits')
          .select('*, agent:sales_agents(name)')
          .order('visit_date', { ascending: false }),
        supabase
          .from('sales_agents')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('sales_leads')
          .select('*, agent:sales_agents(name)')
          .order('created_at', { ascending: false })
      ]);

      if (activitiesRes.error) throw activitiesRes.error;
      if (agentsRes.error) throw agentsRes.error;
      if (leadsRes.error) throw leadsRes.error;

      setActivities(activitiesRes.data || []);
      setAgents(agentsRes.data || []);
      setLeads(leadsRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Calculate statistics
  const stats = {
    totalVisits: activities.length,
    completedVisits: activities.filter(a => a.status === 'completed').length,
    scheduledVisits: activities.filter(a => a.status === 'scheduled').length,
    totalLeads: leads.length,
    convertedLeads: leads.filter(l => l.status === 'customer').length,
    activeAgents: agents.filter(a => a.status === 'active').length,
    conversionRate: leads.length > 0 
      ? ((leads.filter(l => l.status === 'customer').length / leads.length) * 100).toFixed(1)
      : '0'
  };

  // Get recent activities for timeline
  const recentActivities = activities.slice(0, 10);

  // Get top performing agents
  const agentPerformance = agents.map(agent => {
    const agentVisits = activities.filter(a => a.agent_id === agent.id);
    const completedVisits = agentVisits.filter(a => a.status === 'completed').length;
    const agentLeads = leads.filter(l => l.assigned_agent === agent.id);
    const convertedLeads = agentLeads.filter(l => l.status === 'customer').length;
    
    return {
      ...agent,
      totalVisits: agentVisits.length,
      completedVisits,
      conversionRate: agentLeads.length > 0 
        ? ((convertedLeads / agentLeads.length) * 100).toFixed(1)
        : '0',
      achievement: agent.monthly_target > 0 
        ? ((completedVisits / agent.monthly_target) * 100).toFixed(1)
        : '0'
    };
  }).sort((a, b) => parseFloat(b.achievement) - parseFloat(a.achievement));

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid white',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }} dir="rtl">
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .card {
          animation: slideIn 0.5s ease-out;
        }
      `}</style>

      {/* Header */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold',
              margin: '0',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              לוח בקרה - מערך מכירות
            </h1>
            <p style={{ color: '#6B7280', marginTop: '0.5rem' }}>
              ניהול ומעקב אחר פעילות סוכני השטח
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: '2px solid #E5E7EB',
                background: 'white',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              <option value="day">היום</option>
              <option value="week">השבוע</option>
              <option value="month">החודש</option>
              <option value="year">השנה</option>
            </select>
            
            <select 
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: '2px solid #E5E7EB',
                background: 'white',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              <option value="all">כל הסוכנים</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Total Visits Card */}
        <div className="card" style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '0' }}>סה״כ ביקורים</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                {stats.totalVisits}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10B981' }}>
                <TrendingUp size={16} />
                <span style={{ fontSize: '0.875rem' }}>+12% מהחודש שעבר</span>
              </div>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <MapPin size={24} />
            </div>
          </div>
        </div>

        {/* Completed Visits Card */}
        <div className="card" style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '0' }}>ביקורים שהושלמו</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                {stats.completedVisits}
              </p>
              <div style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                background: '#D1FAE5',
                color: '#065F46',
                borderRadius: '20px',
                fontSize: '0.875rem'
              }}>
                {stats.totalVisits > 0 ? ((stats.completedVisits / stats.totalVisits) * 100).toFixed(0) : 0}% השלמה
              </div>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <CheckCircle size={24} />
            </div>
          </div>
        </div>

        {/* Leads Card */}
        <div className="card" style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '0' }}>לידים פעילים</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                {stats.totalLeads}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#F59E0B' }}>
                <Users size={16} />
                <span style={{ fontSize: '0.875rem' }}>{stats.convertedLeads} הומרו ללקוחות</span>
              </div>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Target size={24} />
            </div>
          </div>
        </div>

        {/* Conversion Rate Card */}
        <div className="card" style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '0' }}>אחוז המרה</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                {stats.conversionRate}%
              </p>
              <div style={{
                width: '100%',
                height: '8px',
                background: '#E5E7EB',
                borderRadius: '4px',
                overflow: 'hidden',
                marginTop: '0.5rem'
              }}>
                <div style={{
                  width: `${stats.conversionRate}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #8B5CF6 0%, #7C3AED 100%)',
                  transition: 'width 1s ease'
                }}></div>
              </div>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Award size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Top Agents */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
              סוכנים מובילים
            </h2>
            <Star style={{ color: '#F59E0B' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {agentPerformance.slice(0, 5).map((agent, index) => (
              <div key={agent.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                background: index === 0 ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' : '#F9FAFB',
                borderRadius: '8px',
                border: index === 0 ? '2px solid #F59E0B' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: index === 0 ? '#F59E0B' : '#E5E7EB',
                    color: index === 0 ? 'white' : '#6B7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>
                    {index + 1}
                  </div>
                  <div>
                    <p style={{ fontWeight: '500', margin: 0 }}>{agent.name}</p>
                    <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0 }}>
                      {agent.region} | {agent.totalVisits} ביקורים
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 'bold', 
                    margin: 0,
                    color: parseFloat(agent.achievement) >= 100 ? '#10B981' : '#6B7280'
                  }}>
                    {agent.achievement}%
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0 }}>
                    מהיעד
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          maxHeight: '500px',
          overflow: 'auto'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
              פעילות אחרונה
            </h2>
            <ActivityIcon style={{ color: '#3B82F6' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentActivities.map((visit) => (
              <div key={visit.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem',
                borderRight: `3px solid ${
                  visit.status === 'completed' ? '#10B981' :
                  visit.status === 'scheduled' ? '#3B82F6' :
                  '#F59E0B'
                }`,
                background: '#F9FAFB',
                borderRadius: '4px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: visit.status === 'completed' ? '#10B981' :
                                visit.status === 'scheduled' ? '#3B82F6' :
                                '#F59E0B'
                  }}></div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '500', margin: 0 }}>
                      {visit.business_name || 'ללא שם'}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                      {visit.city || 'ללא עיר'}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                    {new Date(visit.visit_date).toLocaleDateString('he-IL')}
                  </p>
                  <p style={{ 
                    fontSize: '11px', 
                    color: visit.status === 'completed' ? '#10B981' :
                           visit.status === 'scheduled' ? '#3B82F6' :
                           '#F59E0B',
                    margin: 0,
                    fontWeight: '500'
                  }}>
                    {visit.status === 'completed' ? 'הושלם' :
                     visit.status === 'scheduled' ? 'מתוכנן' :
                     'בתהליך'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leads by Status */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
              סטטוס לידים
            </h2>
            <BarChart style={{ color: '#8B5CF6' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { label: 'ליד חדש', count: leads.filter(l => l.status === 'new').length, color: '#3B82F6' },
              { label: 'בקשר', count: leads.filter(l => l.status === 'contacted').length, color: '#F59E0B' },
              { label: 'פגישה נקבעה', count: leads.filter(l => l.status === 'meeting').length, color: '#8B5CF6' },
              { label: 'הצעת מחיר', count: leads.filter(l => l.status === 'proposal').length, color: '#EC4899' },
              { label: 'לקוח', count: leads.filter(l => l.status === 'customer').length, color: '#10B981' },
              { label: 'לא רלוונטי', count: leads.filter(l => l.status === 'lost').length, color: '#6B7280' }
            ].map((status) => (
              <div key={status.label}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ fontSize: '0.875rem', color: '#4B5563' }}>
                    {status.label}
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                    {status.count}
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: '#E5E7EB',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${leads.length > 0 ? (status.count / leads.length) * 100 : 0}%`,
                    height: '100%',
                    background: status.color,
                    transition: 'width 1s ease'
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regional Performance */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
              ביצועים לפי אזור
            </h2>
            <MapPin style={{ color: '#10B981' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {['צפון', 'מרכז', 'דרום', 'ירושלים', 'שרון'].map((region) => {
              const regionAgents = agents.filter(a => a.region === region);
              const regionVisits = activities.filter(a => 
                regionAgents.some(agent => agent.id === a.agent_id)
              );
              const completedVisits = regionVisits.filter(v => v.status === 'completed').length;
              
              return (
                <div key={region} style={{
                  padding: '1rem',
                  background: '#F9FAFB',
                  borderRadius: '8px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ fontWeight: '500' }}>{region}</span>
                    <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                      {regionAgents.length} סוכנים | {regionVisits.length} ביקורים
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        width: '100%',
                        height: '8px',
                        background: '#E5E7EB',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${regionVisits.length > 0 ? (completedVisits / regionVisits.length) * 100 : 0}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)'
                        }}></div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#10B981' }}>
                      {regionVisits.length > 0 ? ((completedVisits / regionVisits.length) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
