'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Define proper types for OrderLink
interface OrderLink {
  id: string;
  order_id: string;
  link_type: 'deal' | 'quote' | 'order';
  link_id: string;
  created_at: string;
  // Add the deal property with optional chaining support
  deal?: {
    id?: string;
    lead?: {
      id?: string;
      business_name?: string;
      contact_name?: string;
      phone?: string;
      email?: string;
    };
    amount_before_vat?: number;
    vat_amount?: number;
    total_amount?: number;
    status?: string;
    created_at?: string;
  };
  quote?: {
    id?: string;
    quote_number?: string;
    total_amount?: number;
    status?: string;
  };
  order?: {
    id?: string;
    order_number?: string;
    total_amount?: number;
    status?: string;
  };
}

interface Deal {
  id: string;
  lead_id: string;
  stage: string;
  amount_before_vat: number;
  vat_amount: number;
  total_amount: number;
  probability: number;
  expected_close_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  lead?: {
    id: string;
    business_name: string;
    contact_name: string;
    phone: string;
    email: string;
    address?: string;
    city?: string;
    notes?: string;
    source?: string;
    status: string;
    created_at: string;
  };
}

interface Lead {
  id: string;
  business_name: string;
  contact_name: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  notes?: string;
  source?: string;
  status: string;
  created_at: string;
}

export default function SalesDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDeals: 0,
    totalValue: 0,
    wonDeals: 0,
    lostDeals: 0,
    pendingDeals: 0,
    conversionRate: 0,
    avgDealSize: 0,
    totalLeads: 0,
    newLeads: 0,
    qualifiedLeads: 0,
  });
  const [recentDeals, setRecentDeals] = useState<Deal[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [orderLinks, setOrderLinks] = useState<OrderLink[]>([]);
  const [pipelineData, setPipelineData] = useState<any[]>([]);
  const [selectedView, setSelectedView] = useState<'overview' | 'pipeline' | 'leads' | 'reports'>('overview');

  useEffect(() => {
    checkUser();
    loadDashboardData();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/login');
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadRecentDeals(),
        loadRecentLeads(),
        loadOrderLinks(),
        loadPipelineData()
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Load deals stats
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('*');

      if (dealsError) throw dealsError;

      if (deals) {
        const wonDeals = deals.filter(d => d.stage === 'won');
        const lostDeals = deals.filter(d => d.stage === 'lost');
        const pendingDeals = deals.filter(d => !['won', 'lost'].includes(d.stage));

        const totalValue = deals.reduce((sum, d) => sum + (d.total_amount || 0), 0);
        const avgDealSize = deals.length > 0 ? totalValue / deals.length : 0;
        const conversionRate = deals.length > 0 
          ? (wonDeals.length / deals.length) * 100 
          : 0;

        // Load leads stats
        const { data: leads } = await supabase
          .from('leads')
          .select('*');

        const today = new Date();
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const newLeads = leads?.filter(l => 
          new Date(l.created_at) > lastWeek
        ).length || 0;

        const qualifiedLeads = leads?.filter(l => 
          l.status === 'qualified'
        ).length || 0;

        setStats({
          totalDeals: deals.length,
          totalValue,
          wonDeals: wonDeals.length,
          lostDeals: lostDeals.length,
          pendingDeals: pendingDeals.length,
          conversionRate,
          avgDealSize,
          totalLeads: leads?.length || 0,
          newLeads,
          qualifiedLeads
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentDeals = async () => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          lead:leads(*)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentDeals(data || []);
    } catch (error) {
      console.error('Error loading recent deals:', error);
    }
  };

  const loadRecentLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentLeads(data || []);
    } catch (error) {
      console.error('Error loading recent leads:', error);
    }
  };

  const loadOrderLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('order_links')
        .select(`
          *,
          deal:deals(
            *,
            lead:leads(*)
          ),
          quote:quotes(*),
          order:orders(*)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setOrderLinks(data || []);
    } catch (error) {
      console.error('Error loading order links:', error);
    }
  };

  const loadPipelineData = async () => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('stage, total_amount');

      if (error) throw error;

      const stages = ['lead', 'qualification', 'proposal', 'negotiation', 'won', 'lost'];
      const pipelineByStage = stages.map(stage => {
        const stageDeals = data?.filter(d => d.stage === stage) || [];
        const totalValue = stageDeals.reduce((sum, d) => sum + (d.total_amount || 0), 0);
        return {
          stage,
          count: stageDeals.length,
          value: totalValue
        };
      });

      setPipelineData(pipelineByStage);
    } catch (error) {
      console.error('Error loading pipeline data:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      lead: '#9CA3AF',
      qualification: '#60A5FA',
      proposal: '#A78BFA',
      negotiation: '#FBBF24',
      won: '#34D399',
      lost: '#F87171'
    };
    return colors[stage] || '#9CA3AF';
  };

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      lead: 'ליד',
      qualification: 'בדיקת התאמה',
      proposal: 'הצעת מחיר',
      negotiation: 'משא ומתן',
      won: 'סגירה מוצלחת',
      lost: 'אבוד'
    };
    return labels[stage] || stage;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: '#60A5FA',
      contacted: '#A78BFA',
      qualified: '#34D399',
      unqualified: '#F87171'
    };
    return colors[status] || '#9CA3AF';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: 'חדש',
      contacted: 'נוצר קשר',
      qualified: 'מתאים',
      unqualified: 'לא מתאים'
    };
    return labels[status] || status;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#F3F4F6'
      }}>
        <div style={{ 
          fontSize: '24px', 
          color: '#6B7280',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '5px solid #E5E7EB',
            borderTop: '5px solid #3B82F6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span>טוען נתונים...</span>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#F3F4F6',
      direction: 'rtl'
    }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #E5E7EB',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold',
              color: '#1F2937',
              margin: 0
            }}>
              📊 לוח בקרה - מכירות
            </h1>
            <nav style={{ display: 'flex', gap: '20px' }}>
              <button
                onClick={() => setSelectedView('overview')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selectedView === 'overview' ? '#3B82F6' : 'transparent',
                  color: selectedView === 'overview' ? 'white' : '#6B7280',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                סקירה כללית
              </button>
              <button
                onClick={() => setSelectedView('pipeline')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selectedView === 'pipeline' ? '#3B82F6' : 'transparent',
                  color: selectedView === 'pipeline' ? 'white' : '#6B7280',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                צינור מכירות
              </button>
              <button
                onClick={() => setSelectedView('leads')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selectedView === 'leads' ? '#3B82F6' : 'transparent',
                  color: selectedView === 'leads' ? 'white' : '#6B7280',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                לידים
              </button>
              <button
                onClick={() => setSelectedView('reports')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selectedView === 'reports' ? '#3B82F6' : 'transparent',
                  color: selectedView === 'reports' ? 'white' : '#6B7280',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                דוחות
              </button>
            </nav>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => router.push('/sales/leads/new')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              + ליד חדש
            </button>
            <button
              onClick={() => router.push('/sales/deals/new')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              + עסקה חדשה
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 20px',
                backgroundColor: '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              יציאה
            </button>
          </div>
        </div>
      </header>

      <main style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '30px 20px'
      }}>
        {/* Overview View */}
        {selectedView === 'overview' && (
          <>
            {/* Stats Cards */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                borderRight: '4px solid #3B82F6'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 8px 0' }}>סה"כ עסקאות</p>
                    <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#1F2937' }}>
                      {stats.totalDeals}
                    </p>
                    <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '8px' }}>
                      {stats.pendingDeals} פתוחות
                    </p>
                  </div>
                  <div style={{ fontSize: '30px' }}>📊</div>
                </div>
              </div>

              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                borderRight: '4px solid #10B981'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 8px 0' }}>שווי כולל</p>
                    <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#1F2937' }}>
                      {formatCurrency(stats.totalValue)}
                    </p>
                    <p style={{ color: '#10B981', fontSize: '14px', marginTop: '8px' }}>
                      +12% מהחודש שעבר
                    </p>
                  </div>
                  <div style={{ fontSize: '30px' }}>💰</div>
                </div>
              </div>

              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                borderRight: '4px solid #A78BFA'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 8px 0' }}>אחוז המרה</p>
                    <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#1F2937' }}>
                      {stats.conversionRate.toFixed(1)}%
                    </p>
                    <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '8px' }}>
                      {stats.wonDeals} סגירות מוצלחות
                    </p>
                  </div>
                  <div style={{ fontSize: '30px' }}>🎯</div>
                </div>
              </div>

              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                borderRight: '4px solid #FBBF24'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <p style={{ color: '#6B7280', fontSize: '14px', margin: '0 0 8px 0' }}>גודל עסקה ממוצע</p>
                    <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#1F2937' }}>
                      {formatCurrency(stats.avgDealSize)}
                    </p>
                    <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '8px' }}>
                      מתוך {stats.totalDeals} עסקאות
                    </p>
                  </div>
                  <div style={{ fontSize: '30px' }}>📈</div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '30px'
            }}>
              {/* Recent Deals */}
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
                  עסקאות אחרונות
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {recentDeals.map((deal) => (
                    <div
                      key={deal.id}
                      style={{
                        padding: '15px',
                        backgroundColor: '#F9FAFB',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => router.push(`/sales/deals/${deal.id}`)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <p style={{ fontWeight: '500', margin: '0 0 4px 0' }}>
                            {deal.lead?.business_name || 'לקוח'}
                          </p>
                          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
                            {formatCurrency(deal.total_amount)}
                          </p>
                        </div>
                        <span style={{
                          padding: '4px 12px',
                          backgroundColor: getStageColor(deal.stage),
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {getStageLabel(deal.stage)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Leads */}
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
                  לידים חדשים
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {recentLeads.map((lead) => (
                    <div
                      key={lead.id}
                      style={{
                        padding: '15px',
                        backgroundColor: '#F9FAFB',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => router.push(`/sales/leads/${lead.id}`)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <p style={{ fontWeight: '500', margin: '0 0 4px 0' }}>
                            {lead.business_name}
                          </p>
                          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
                            {lead.contact_name} • {lead.phone}
                          </p>
                        </div>
                        <span style={{
                          padding: '4px 12px',
                          backgroundColor: getStatusColor(lead.status),
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {getStatusLabel(lead.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Links */}
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
                קישורים להזמנות
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {orderLinks.map((link) => (
                  <div
                    key={link.id}
                    style={{
                      padding: '15px',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: '500', margin: '0 0 4px 0' }}>
                        {link.deal?.lead?.business_name || 
                         link.quote?.quote_number || 
                         link.order?.order_number || 
                         'לא ידוע'}
                      </p>
                      <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                        סכום: {formatCurrency(
                          link.deal?.amount_before_vat || 
                          link.quote?.total_amount || 
                          link.order?.total_amount || 
                          0
                        )} | 
                        סוג: {link.link_type === 'deal' ? 'עסקה' : 
                              link.link_type === 'quote' ? 'הצעת מחיר' : 'הזמנה'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (link.link_type === 'deal' && link.deal?.id) {
                          router.push(`/sales/deals/${link.deal.id}`);
                        } else if (link.link_type === 'quote' && link.quote?.id) {
                          router.push(`/sales/quotes/${link.quote.id}`);
                        } else if (link.link_type === 'order' && link.order?.id) {
                          router.push(`/orders/${link.order.id}`);
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#3B82F6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      צפייה
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Pipeline View */}
        {selectedView === 'pipeline' && (
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px' }}>
              צינור המכירות
            </h2>
            <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px' }}>
              {pipelineData.map((stage) => (
                <div
                  key={stage.stage}
                  style={{
                    minWidth: '200px',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '12px',
                    padding: '20px',
                    borderTop: `4px solid ${getStageColor(stage.stage)}`
                  }}
                >
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '10px'
                  }}>
                    {getStageLabel(stage.stage)}
                  </h3>
                  <div style={{ marginBottom: '15px' }}>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0' }}>
                      {stage.count}
                    </p>
                    <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0 0' }}>
                      עסקאות
                    </p>
                  </div>
                  <div style={{
                    paddingTop: '15px',
                    borderTop: '1px solid #E5E7EB'
                  }}>
                    <p style={{ fontSize: '14px', color: '#6B7280', margin: '0' }}>
                      ערך כולל
                    </p>
                    <p style={{ fontSize: '18px', fontWeight: '600', margin: '4px 0 0 0' }}>
                      {formatCurrency(stage.value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leads View */}
        {selectedView === 'leads' && (
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '30px'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>
                ניהול לידים
              </h2>
              <button
                onClick={() => router.push('/sales/leads')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                כל הלידים
              </button>
            </div>
            
            {/* Lead Stats */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{
                padding: '20px',
                backgroundColor: '#EFF6FF',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: '#3B82F6' }}>
                  {stats.totalLeads}
                </p>
                <p style={{ color: '#6B7280', margin: '8px 0 0 0' }}>סה"כ לידים</p>
              </div>
              <div style={{
                padding: '20px',
                backgroundColor: '#F0FDF4',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: '#10B981' }}>
                  {stats.newLeads}
                </p>
                <p style={{ color: '#6B7280', margin: '8px 0 0 0' }}>לידים חדשים השבוע</p>
              </div>
              <div style={{
                padding: '20px',
                backgroundColor: '#FEF3C7',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: '#F59E0B' }}>
                  {stats.qualifiedLeads}
                </p>
                <p style={{ color: '#6B7280', margin: '8px 0 0 0' }}>לידים מתאימים</p>
              </div>
            </div>

            {/* Recent Leads Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#6B7280' }}>שם העסק</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#6B7280' }}>איש קשר</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#6B7280' }}>טלפון</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#6B7280' }}>סטטוס</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#6B7280' }}>תאריך</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#6B7280' }}>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map((lead) => (
                    <tr key={lead.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '12px', fontWeight: '500' }}>{lead.business_name}</td>
                      <td style={{ padding: '12px' }}>{lead.contact_name}</td>
                      <td style={{ padding: '12px' }}>{lead.phone}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 12px',
                          backgroundColor: getStatusColor(lead.status),
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {getStatusLabel(lead.status)}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#6B7280' }}>
                        {formatDate(lead.created_at)}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button
                          onClick={() => router.push(`/sales/leads/${lead.id}`)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#3B82F6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          צפייה
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reports View */}
        {selectedView === 'reports' && (
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px' }}>
              דוחות ואנליטיקס
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '20px'
            }}>
              <div style={{
                padding: '20px',
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>
                  📈 דוח ביצועים חודשי
                </h3>
                <p style={{ color: '#6B7280', marginBottom: '15px' }}>
                  סקירת ביצועי המכירות לחודש הנוכחי
                </p>
                <button style={{
                  padding: '8px 16px',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}>
                  הצג דוח
                </button>
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>
                  👥 דוח לקוחות
                </h3>
                <p style={{ color: '#6B7280', marginBottom: '15px' }}>
                  ניתוח מעמיק של בסיס הלקוחות
                </p>
                <button style={{
                  padding: '8px 16px',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}>
                  הצג דוח
                </button>
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>
                  💰 דוח הכנסות
                </h3>
                <p style={{ color: '#6B7280', marginBottom: '15px' }}>
                  פירוט הכנסות לפי תקופה ומוצר
                </p>
                <button style={{
                  padding: '8px 16px',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}>
                  הצג דוח
                </button>
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>
                  🎯 דוח יעדים
                </h3>
                <p style={{ color: '#6B7280', marginBottom: '15px' }}>
                  מעקב אחר עמידה ביעדים
                </p>
                <button style={{
                  padding: '8px 16px',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}>
                  הצג דוח
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
