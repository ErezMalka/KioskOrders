'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Lead {
  id: string;
  created_at: string;
  source: string;
  business_name: string;
  city: string;
  sector: string;
  owner_id: string;
  score: number;
  first_touch_at: string;
  is_returning: boolean;
}

interface Quote {
  id: string;
  lead_id: string;
  sent_at: string;
  amount_before_vat: number;
  status: 'sent' | 'opened' | 'won' | 'lost';
  reason_lost?: string;
  opened_at?: string;
  decided_at?: string;
}

interface Deal {
  id: string;
  lead_id: string;
  lead?: Lead;
  closed_at?: string;
  amount_before_vat: number;
  commission_rate: number;
  probability: number;
  stage: string;
  expected_close_date: string;
  created_at: string;
}

interface Activity {
  id: string;
  lead_id: string;
  type: 'visit' | 'call' | 'whatsapp' | 'email' | 'meeting';
  at: string;
  duration_min?: number;
  notes?: string;
  lat?: number;
  lon?: number;
  status: 'completed' | 'pending' | 'cancelled';
  business_name?: string;
  city?: string;
}

interface Commission {
  id: string;
  deal_id: string;
  approved_amount: number;
  deductions: number;
  status: 'expected' | 'approved' | 'paid';
}

export default function SalesAgentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [includeVat, setIncludeVat] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  
  // KPI States
  const [kpiData, setKpiData] = useState({
    leads: { new: 0, returning: 0, total: 0 },
    meetings: 0,
    quotes: { sent: 0, won: 0, winRate: 0 },
    sales: { amount: 0, avgDealSize: 0, target: 150000, attainment: 0 },
    salesCycle: 0,
    commission: { approved: 0, expected: 0, deductions: 0 },
    pipeline: { 
      value: 0, 
      weighted: 0,
      stages: [
        { name: 'לידים', count: 0, value: 0, color: '#3B82F6' },
        { name: 'פגישות', count: 0, value: 0, color: '#10B981' },
        { name: 'הצעות', count: 0, value: 0, color: '#F59E0B' },
        { name: 'סגירות', count: 0, value: 0, color: '#8B5CF6' }
      ]
    }
  });

  const [nextActions, setNextActions] = useState<any[]>([]);
  const [todayVisits, setTodayVisits] = useState<Activity[]>([]);
  const [pipelineDeals, setPipelineDeals] = useState<Deal[]>([]);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, selectedPeriod]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user found, redirecting to login');
        router.push('/login');
        return;
      }

      setUser(user);
      console.log('User loaded:', user.email);
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const getPeriodDates = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDate = today;
    let endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 1);

    switch (selectedPeriod) {
      case 'today':
        startDate = today;
        break;
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay());
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
    }

    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
  };

  const loadDashboardData = async () => {
    setDataLoading(true);
    try {
      const { startDate, endDate } = getPeriodDates();
      
      // Load Leads
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('owner_id', user.id)
        .gte('created_at', startDate)
        .lt('created_at', endDate);

      if (leadsError) console.error('Error loading leads:', leadsError);

      const newLeads = leads?.filter(l => !l.is_returning).length || 0;
      const returningLeads = leads?.filter(l => l.is_returning).length || 0;

      // Load Quotes
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select('*')
        .gte('sent_at', startDate)
        .lt('sent_at', endDate);

      if (quotesError) console.error('Error loading quotes:', quotesError);

      const wonQuotes = quotes?.filter(q => q.status === 'won').length || 0;
      const sentQuotes = quotes?.length || 0;
      const winRate = sentQuotes > 0 ? Math.round((wonQuotes / sentQuotes) * 100) : 0;

      // Load Deals
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select(`
          *,
          lead:leads(business_name, city, sector)
        `)
        .eq('owner_id', user.id);

      if (dealsError) console.error('Error loading deals:', dealsError);

      const closedDeals = deals?.filter(d => 
        d.closed_at && 
        new Date(d.closed_at) >= new Date(startDate) && 
        new Date(d.closed_at) < new Date(endDate)
      ) || [];

      const totalSales = closedDeals.reduce((sum, d) => sum + d.amount_before_vat, 0);
      const avgDealSize = closedDeals.length > 0 ? totalSales / closedDeals.length : 0;

      // Load Activities for meetings count
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .eq('owner_id', user.id)
        .eq('type', 'meeting')
        .gte('at', startDate)
        .lt('at', endDate);

      if (activitiesError) console.error('Error loading activities:', activitiesError);

      const meetings = activities?.length || 0;

      // Load Today's Visits
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: todayActivities, error: todayError } = await supabase
        .from('activities')
        .select(`
          *,
          lead:leads(business_name, city)
        `)
        .eq('owner_id', user.id)
        .in('type', ['visit', 'meeting'])
        .gte('at', today.toISOString())
        .lt('at', tomorrow.toISOString())
        .order('at', { ascending: true });

      if (todayError) console.error('Error loading today activities:', todayError);

      // Load Commissions
      const { data: commissions, error: commissionsError } = await supabase
        .from('commissions')
        .select('*')
        .in('deal_id', closedDeals.map(d => d.id));

      if (commissionsError) console.error('Error loading commissions:', commissionsError);

      const approvedCommission = commissions?.filter(c => c.status === 'approved')
        .reduce((sum, c) => sum + c.approved_amount - c.deductions, 0) || 0;
      const expectedCommission = commissions?.filter(c => c.status === 'expected')
        .reduce((sum, c) => sum + c.approved_amount, 0) || 0;

      // Calculate Pipeline
      const openDeals = deals?.filter(d => !d.closed_at) || [];
      const pipelineValue = openDeals.reduce((sum, d) => sum + d.amount_before_vat, 0);
      const weightedPipeline = openDeals.reduce((sum, d) => 
        sum + (d.amount_before_vat * d.probability / 100), 0
      );

      // Calculate Sales Cycle
      const completedWithCycle = closedDeals.filter(d => d.created_at && d.closed_at);
      const avgSalesCycle = completedWithCycle.length > 0 
        ? completedWithCycle.reduce((sum, d) => {
            const created = new Date(d.created_at);
            const closed = new Date(d.closed_at!);
            const days = Math.floor((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / completedWithCycle.length
        : 0;

      // Calculate stages
      const stages = [
        { 
          name: 'לידים', 
          count: leads?.length || 0, 
          value: 0, 
          color: '#3B82F6' 
        },
        { 
          name: 'פגישות', 
          count: openDeals.filter(d => d.stage === 'meeting').length, 
          value: openDeals.filter(d => d.stage === 'meeting')
            .reduce((sum, d) => sum + d.amount_before_vat, 0), 
          color: '#10B981' 
        },
        { 
          name: 'הצעות', 
          count: openDeals.filter(d => d.stage === 'quote').length, 
          value: openDeals.filter(d => d.stage === 'quote')
            .reduce((sum, d) => sum + d.amount_before_vat, 0), 
          color: '#F59E0B' 
        },
        { 
          name: 'סגירות', 
          count: closedDeals.length, 
          value: totalSales, 
          color: '#8B5CF6' 
        }
      ];

      // Calculate target attainment
      const targetAmount = 150000; // This should come from a settings table
      const attainment = (totalSales / targetAmount) * 100;

      // Set KPI Data
      setKpiData({
        leads: { 
          new: newLeads, 
          returning: returningLeads, 
          total: leads?.length || 0 
        },
        meetings,
        quotes: { 
          sent: sentQuotes, 
          won: wonQuotes, 
          winRate 
        },
        sales: { 
          amount: totalSales, 
          avgDealSize, 
          target: targetAmount, 
          attainment 
        },
        salesCycle: Math.round(avgSalesCycle),
        commission: { 
          approved: approvedCommission, 
          expected: expectedCommission, 
          deductions: 0 
        },
        pipeline: { 
          value: pipelineValue, 
          weighted: weightedPipeline,
          stages 
        }
      });

      // Set Today's Visits
      setTodayVisits(todayActivities || []);

      // Set Pipeline Deals (top 10 by probability)
      setPipelineDeals(
        openDeals
          .sort((a, b) => b.probability - a.probability)
          .slice(0, 10)
      );

      // Calculate Next Actions
      const actions = [];
      
      // Check for quotes without response
      const oldQuotes = quotes?.filter(q => 
        q.status === 'sent' && 
        new Date(q.sent_at) < new Date(Date.now() - 72 * 60 * 60 * 1000)
      );
      if (oldQuotes && oldQuotes.length > 0) {
        actions.push({
          type: 'urgent',
          text: `${oldQuotes.length} הצעות ללא מענה מעל 72 שעות`,
          icon: '⚠️',
          priority: 'high'
        });
      }

      // Check for hot leads
      const hotLeads = leads?.filter(l => l.score > 70 && !l.first_touch_at);
      if (hotLeads && hotLeads.length > 0) {
        actions.push({
          type: 'lead',
          text: `${hotLeads.length} לידים חמים ממתינים לתגובה`,
          icon: '🔥',
          priority: 'high'
        });
      }

      // Check for stuck deals
      const stuckDeals = openDeals.filter(d => {
        const age = Math.floor((Date.now() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24));
        return age > 14;
      });
      if (stuckDeals.length > 0) {
        actions.push({
          type: 'followup',
          text: `${stuckDeals.length} עסקאות תקועות מעל 14 יום`,
          icon: '⏰',
          priority: 'medium'
        });
      }

      setNextActions(actions);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const formatCurrency = (amount: number) => {
    const displayAmount = includeVat ? amount * 1.17 : amount;
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0
    }).format(displayAmount);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return '#10B981';
    if (percentage >= 70) return '#F59E0B';
    if (percentage >= 50) return '#EF4444';
    return '#6B7280';
  };

  const getAgeColor = (days: number) => {
    if (days > 14) return '#EF4444';
    if (days > 7) return '#F59E0B';
    return '#10B981';
  };

  const calculateDealAge = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
        direction: 'rtl'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <h2 style={{ fontSize: '20px', color: '#6B7280' }}>טוען נתונים...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F9FAFB',
      direction: 'rtl',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #E5E7EB',
        padding: '16px 0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                💼 דאשבורד סוכן מכירות
              </h1>
              <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                {user?.email?.split('@')[0]} | {new Date().toLocaleDateString('he-IL')}
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="today">היום</option>
                <option value="week">השבוע</option>
                <option value="month">החודש</option>
                <option value="quarter">רבעון</option>
              </select>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeVat}
                  onChange={(e) => setIncludeVat(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                כולל מע״מ
              </label>

              <button
                onClick={() => loadDashboardData()}
                disabled={dataLoading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: dataLoading ? '#9CA3AF' : '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: dataLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {dataLoading ? '⏳' : '🔄'} רענן
              </button>

              <button
                onClick={handleLogout}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                יציאה
              </button>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>
        {/* KPI Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '16px', 
          marginBottom: '24px' 
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderRight: '4px solid #3B82F6'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>לידים בתקופה</p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0' }}>
                  {kpiData.leads.total}
                </p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <span style={{
                    fontSize: '12px',
                    backgroundColor: '#D1FAE5',
                    color: '#065F46',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}>
                    חדש: {kpiData.leads.new}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    backgroundColor: '#DBEAFE',
                    color: '#1E40AF',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}>
                    חוזר: {kpiData.leads.returning}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '32px' }}>👥</span>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderRight: '4px solid #10B981'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>מכירות נטו</p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0' }}>
                  {formatCurrency(kpiData.sales.amount)}
                </p>
                <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>
                  ממוצע לעסקה: {formatCurrency(kpiData.sales.avgDealSize)}
                </p>
              </div>
              <span style={{ fontSize: '32px' }}>💰</span>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderRight: '4px solid #F59E0B'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Win Rate</p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0' }}>
                  {kpiData.quotes.winRate}%
                </p>
                <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>
                  {kpiData.quotes.won}/{kpiData.quotes.sent} הצעות
                </p>
              </div>
              <span style={{ fontSize: '32px' }}>🎯</span>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            borderRight: '4px solid #8B5CF6'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>עמלות החודש</p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0' }}>
                  {formatCurrency(kpiData.commission.approved)}
                </p>
                <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>
                  צפוי: {formatCurrency(kpiData.commission.expected)}
                </p>
              </div>
              <span style={{ fontSize: '32px' }}>💵</span>
            </div>
          </div>
        </div>

        {/* Target Progress */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>התקדמות יעד חודשי</h3>
            <span style={{ fontSize: '14px', color: '#6B7280' }}>
              יעד: {formatCurrency(kpiData.sales.target)}
            </span>
          </div>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <div style={{
              width: '100%',
              backgroundColor: '#E5E7EB',
              borderRadius: '9999px',
              height: '32px',
              overflow: 'hidden'
            }}>
              <div 
                style={{ 
                  width: `${Math.min(kpiData.sales.attainment, 100)}%`,
                  backgroundColor: getProgressColor(kpiData.sales.attainment),
                  height: '100%',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'width 0.5s ease-in-out'
                }}
              >
                {kpiData.sales.attainment.toFixed(1)}%
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ color: '#10B981' }}>
              הושג: {formatCurrency(kpiData.sales.amount)}
            </span>
            <span style={{ color: '#EF4444' }}>
              נותר: {formatCurrency(Math.max(0, kpiData.sales.target - kpiData.sales.amount))}
            </span>
            <span style={{ fontWeight: '600', color: '#3B82F6' }}>
              Forecast: {formatCurrency(kpiData.sales.amount + kpiData.pipeline.weighted)}
            </span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px',
          marginBottom: '24px'
        }}>
          {/* Sales Funnel */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>משפך מכירות</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {kpiData.pipeline.stages.map((stage, index) => (
                <div key={index}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{stage.name}</span>
                    <span style={{ fontSize: '14px', color: '#6B7280' }}>{stage.count}</span>
                  </div>
                  <div style={{
                    width: '100%',
                    backgroundColor: '#E5E7EB',
                    borderRadius: '4px',
                    height: '24px',
                    overflow: 'hidden'
                  }}>
                    <div 
                      style={{ 
                        width: kpiData.pipeline.stages[0].count > 0 
                          ? `${(stage.count / kpiData.pipeline.stages[0].count) * 100}%`
                          : '0%',
                        backgroundColor: stage.color,
                        height: '100%',
                        transition: 'width 0.3s ease-in-out'
                      }}
                    />
                  </div>
                  {stage.value > 0 && (
                    <span style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px', display: 'block' }}>
                      {formatCurrency(stage.value)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Today's Visits */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>ביקורים היום</h3>
              <button
                onClick={() => router.push('/sales/visits/new')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                + ביקור חדש
              </button>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxHeight: '280px',
              overflowY: 'auto'
            }}>
              {todayVisits.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#6B7280', padding: '20px' }}>
                  אין ביקורים מתוכננים להיום
                </p>
              ) : (
                todayVisits.map((visit) => (
                  <div key={visit.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '12px', 
                    backgroundColor: '#F9FAFB', 
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '14px', color: '#6B7280' }}>
                        {formatTime(visit.at)}
                      </span>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '500', margin: 0 }}>
                          {visit.business_name || visit.lead?.business_name || 'ללא שם'}
                        </p>
                        <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                          {visit.city || visit.lead?.city || 'ללא עיר'}
                        </p>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: visit.status === 'completed' ? '#D1FAE5' : '#FEF3C7',
                      color: visit.status === 'completed' ? '#065F46' : '#92400E'
                    }}>
                      {visit.status === 'completed' ? 'בוצע' : 'ממתין'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Next Best Actions */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
              📋 מה לעשות עכשיו
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {nextActions.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#10B981', padding: '20px' }}>
                  ✅ אין משימות דחופות - מצוין!
                </p>
              ) : (
                nextActions.map((action, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '12px', 
                    padding: '12px', 
                    backgroundColor: action.priority === 'high' ? '#FEF2F2' : '#FEF3C7', 
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    border: `1px solid ${action.priority === 'high' ? '#FCA5A5' : '#FCD34D'}`
                  }}>
                    <span style={{ fontSize: '20px' }}>{action.icon}</span>
                    <p style={{ fontSize: '14px', color: '#374151', margin: 0 }}>{action.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <button
            onClick={() => router.push('/sales/activities/call')}
            style={{
              padding: '16px',
              backgroundColor: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>📞</span>
            <span>רישום שיחה</span>
          </button>
          
          <button
            onClick={() => router.push('/sales/visits/new')}
            style={{
              padding: '16px',
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>📍</span>
            <span>רישום ביקור</span>
          </button>
          
          <button
            onClick={() => router.push('/sales/quotes/new')}
            style={{
              padding: '16px',
              backgroundColor: '#8B5CF6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>📝</span>
            <span>הצעת מחיר</span>
          </button>
          
          <button
            onClick={() => router.push('/sales/reports')}
            style={{
              padding: '16px',
              backgroundColor: '#F59E0B',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>📊</span>
            <span>דוחות</span>
          </button>
        </div>

        {/* Pipeline Table */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>צנרת פעילה</h3>
            <span style={{ fontSize: '14px', color: '#6B7280' }}>
              סה״כ משוקלל: {formatCurrency(kpiData.pipeline.weighted)}
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontWeight: '600', color: '#374151' }}>
                    לקוח
                  </th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontWeight: '600', color: '#374151' }}>
                    שלב
                  </th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontWeight: '600', color: '#374151' }}>
                    סכום
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px 8px', fontWeight: '600', color: '#374151' }}>
                    הסתברות
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px 8px', fontWeight: '600', color: '#374151' }}>
                    גיל (ימים)
                  </th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontWeight: '600', color: '#374151' }}>
                    צפי סגירה
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px 8px', fontWeight: '600', color: '#374151' }}>
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody>
                {pipelineDeals.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                      אין עסקאות פעילות בצנרת
                    </td>
                  </tr>
                ) : (
                  pipelineDeals.map((deal) => {
                    const age = calculateDealAge(deal.created_at);
                    return (
                      <tr key={deal.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '12px 8px', fontWeight: '500' }}>
                          {deal.lead?.business_name || 'ללא שם'}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{
                            fontSize: '12px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: 
                              deal.stage === 'negotiation' ? '#D1FAE5' : 
                              deal.stage === 'quote' ? '#DBEAFE' : '#FEF3C7',
                            color: 
                              deal.stage === 'negotiation' ? '#065F46' : 
                              deal.stage === 'quote' ? '#1E40AF' : '#92400E'
                          }}>
                            {deal.stage === 'negotiation' ? 'משא ומתן' : 
                             deal.stage === 'quote' ? 'הצעה' : 
                             deal.stage === 'meeting' ? 'פגישה' : deal.stage}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', fontWeight: '500' }}>
                          {formatCurrency(deal.amount_before_vat)}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <span style={{
                            fontWeight: '600',
                            color: 
                              deal.probability >= 70 ? '#10B981' : 
                              deal.probability >= 40 ? '#F59E0B' : '#EF4444'
                          }}>
                            {deal.probability}%
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <span style={{ fontWeight: '600', color: getAgeColor(age) }}>
                            {age}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          {new Date(deal.expected_close_date).toLocaleDateString('he-IL')}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <button
                            onClick={() => router.push(`/sales/deals/${deal.id}`)}
                            style={{
                              padding: '4px 12px',
                              backgroundColor: 'transparent',
                              color: '#3B82F6',
                              border: '1px solid #3B82F6',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          >
                            עדכון
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
