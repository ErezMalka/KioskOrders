'use client';

import React, { useState, useMemo } from 'react';
import { Download, Filter, TrendingUp, Package, DollarSign, BarChart3, UserCheck, Briefcase, ShoppingBag, ArrowUp, ArrowDown, Printer, FileText } from 'lucide-react';

export default function AgentReportsPage() {
  const currentUserId = 'agent-123';
  
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [salesData] = useState([
    { id: 1, date: '2024-06-15', agent: 'agent-123', agentName: 'דוד כהן', customer: 'לקוח 1', commission: 500, setupFee: 1200, physicalProducts: 2500, digitalProducts: 1800, totalSale: 6000, status: 'completed' },
    { id: 2, date: '2024-06-16', agent: 'agent-123', agentName: 'דוד כהן', customer: 'לקוח 2', commission: 450, setupFee: 1500, physicalProducts: 3200, digitalProducts: 2100, totalSale: 7250, status: 'completed' },
    { id: 3, date: '2024-06-17', agent: 'agent-456', agentName: 'שרה לוי', customer: 'לקוח 3', commission: 600, setupFee: 1000, physicalProducts: 1800, digitalProducts: 1500, totalSale: 4900, status: 'completed' },
    { id: 4, date: '2024-06-18', agent: 'agent-123', agentName: 'דוד כהן', customer: 'לקוח 4', commission: 700, setupFee: 2000, physicalProducts: 4200, digitalProducts: 2800, totalSale: 9700, status: 'completed' },
    { id: 5, date: '2024-06-19', agent: 'agent-456', agentName: 'שרה לוי', customer: 'לקוח 5', commission: 550, setupFee: 1800, physicalProducts: 2900, digitalProducts: 1900, totalSale: 7150, status: 'pending' },
    { id: 6, date: '2024-06-20', agent: 'agent-789', agentName: 'יוסי אברהם', customer: 'לקוח 6', commission: 800, setupFee: 2500, physicalProducts: 5000, digitalProducts: 3500, totalSale: 11800, status: 'completed' },
    { id: 7, date: '2024-06-21', agent: 'agent-123', agentName: 'דוד כהן', customer: 'לקוח 7', commission: 650, setupFee: 1600, physicalProducts: 3500, digitalProducts: 2200, totalSale: 7950, status: 'completed' },
  ]);

  const filteredData = useMemo(() => {
    let filtered = salesData.filter(item => item.agent === currentUserId);
    
    filtered = filtered.filter(item => {
      const itemDate = new Date(item.date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      return itemDate >= startDate && itemDate <= endDate;
    });
    
    return filtered;
  }, [salesData, currentUserId, dateRange]);

  const stats = useMemo(() => {
    const completed = filteredData.filter(item => item.status === 'completed');
    
    const totalCustomers = completed.length;
    const totalCommissions = completed.reduce((sum, item) => sum + item.commission, 0);
    const totalSetupFees = completed.reduce((sum, item) => sum + item.setupFee, 0);
    const totalPhysicalProducts = completed.reduce((sum, item) => sum + item.physicalProducts, 0);
    const totalDigitalProducts = completed.reduce((sum, item) => sum + item.digitalProducts, 0);
    const totalSales = completed.reduce((sum, item) => sum + item.totalSale, 0);
    const avgSalePerCustomer = totalCustomers > 0 ? totalSales / totalCustomers : 0;
    
    const prevCommissions = totalCommissions * 0.85;
    const commissionTrend = prevCommissions > 0 ? ((totalCommissions - prevCommissions) / prevCommissions * 100) : 0;
    
    return {
      totalCustomers,
      totalCommissions,
      totalSetupFees,
      totalPhysicalProducts,
      totalDigitalProducts,
      totalSales,
      avgSalePerCustomer,
      commissionTrend: commissionTrend.toFixed(1),
      pendingDeals: filteredData.filter(item => item.status === 'pending').length
    };
  }, [filteredData]);

  const exportToCSV = () => {
    const headers = ['תאריך', 'לקוח', 'עמלה', 'דמי הקמה', 'מוצרים פיזיים', 'מוצרים דיגיטליים', 'סה"כ', 'סטטוס'];
    const rows = filteredData.map(item => [
      item.date,
      item.customer,
      item.commission,
      item.setupFee,
      item.physicalProducts,
      item.digitalProducts,
      item.totalSale,
      item.status === 'completed' ? 'הושלם' : 'ממתין'
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agent_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '1.5rem', direction: 'rtl' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>דוחות מכירות</h1>
            <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>ניתוח הביצועים שלך</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              onClick={exportToCSV}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Download style={{ width: '1rem', height: '1rem' }} />
              ייצוא
            </button>
            <button
              onClick={() => window.print()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Printer style={{ width: '1rem', height: '1rem' }} />
              הדפסה
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Filter style={{ width: '1.25rem', height: '1.25rem', color: '#6366f1' }} />
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>בחירת טווח תאריכים</h2>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>מתאריך</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              style={{
                width: '96%',
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem',
                direction: 'ltr',
                textAlign: 'right'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>עד תאריך</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              style={{
                width: '96%',
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem',
                direction: 'ltr',
                textAlign: 'right'
              }}
            />
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1.5rem'
      }}>
        {/* Total Customers */}
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: '1rem',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <UserCheck style={{ width: '1.8rem', height: '1.8rem', opacity: 0.8 }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 500 }}>סה"כ לקוחות</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.25rem' }}>{stats.totalCustomers}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>בתקופה שנבחרה</div>
        </div>

        {/* Total Commissions */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: '1rem',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <DollarSign style={{ width: '1.8rem', height: '1.8rem', opacity: 0.8 }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 500 }}>סה"כ עמלות</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.25rem' }}>₪{stats.totalCommissions.toLocaleString()}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem' }}>
            {parseFloat(stats.commissionTrend) > 0 ? (
              <>
                <ArrowUp style={{ width: '0.65rem', height: '0.65rem' }} />
                <span>+{stats.commissionTrend}%</span>
              </>
            ) : (
              <>
                <ArrowDown style={{ width: '0.65rem', height: '0.65rem' }} />
                <span>{stats.commissionTrend}%</span>
              </>
            )}
          </div>
        </div>

        {/* Setup Fees */}
        <div style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: '1rem',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <Briefcase style={{ width: '1.8rem', height: '1.8rem', opacity: 0.8 }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 500 }}>דמי הקמה</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.25rem' }}>₪{stats.totalSetupFees.toLocaleString()}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>סה"כ בתקופה</div>
        </div>

        {/* Physical Products */}
        <div style={{
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: '1rem',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <ShoppingBag style={{ width: '1.8rem', height: '1.8rem', opacity: 0.8 }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 500 }}>מוצרים פיזיים</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.25rem' }}>₪{stats.totalPhysicalProducts.toLocaleString()}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>סה"כ מכירות</div>
        </div>

        {/* Digital Products */}
        <div style={{
          background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: '1rem',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <Package style={{ width: '1.8rem', height: '1.8rem', opacity: 0.8 }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 500 }}>מוצרים דיגיטליים</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.25rem' }}>₪{stats.totalDigitalProducts.toLocaleString()}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>סה"כ מכירות</div>
        </div>

        {/* Total Sales */}
        <div style={{
          background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: '1rem',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <TrendingUp style={{ width: '1.8rem', height: '1.8rem', opacity: 0.8 }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 500 }}>סה"כ מכירות</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.25rem' }}>₪{stats.totalSales.toLocaleString()}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>כולל כל הרכיבים</div>
        </div>

        {/* Average per Customer */}
        <div style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: '1rem',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <BarChart3 style={{ width: '1.8rem', height: '1.8rem', opacity: 0.8 }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 500 }}>ממוצע ללקוח</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.25rem' }}>₪{stats.avgSalePerCustomer.toFixed(0)}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>ערך עסקה ממוצע</div>
        </div>

        {/* Pending Deals */}
        <div style={{
          background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: '1rem',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <FileText style={{ width: '1.8rem', height: '1.8rem', opacity: 0.8 }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 500 }}>עסקאות ממתינות</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.25rem' }}>{stats.pendingDeals}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>ממתינים לסגירה</div>
        </div>
      </div>

      {/* Detailed Transactions Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>עסקאות מפורטות</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase' }}>תאריך</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase' }}>לקוח</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase' }}>עמלה</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase' }}>דמי הקמה</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase' }}>מוצרים פיזיים</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase' }}>מוצרים דיגיטליים</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase' }}>סה"כ</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase' }}>סטטוס</th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: 'white' }}>
              {filteredData.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#111827' }}>
                    {new Date(item.date).toLocaleDateString('he-IL')}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>{item.customer}</td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#10b981' }}>₪{item.commission.toLocaleString()}</td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#111827' }}>₪{item.setupFee.toLocaleString()}</td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#111827' }}>₪{item.physicalProducts.toLocaleString()}</td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#111827' }}>₪{item.digitalProducts.toLocaleString()}</td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>₪{item.totalSale.toLocaleString()}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      borderRadius: '9999px',
                      backgroundColor: item.status === 'completed' ? '#d1fae5' : '#fef3c7',
                      color: item.status === 'completed' ? '#065f46' : '#92400e'
                    }}>
                      {item.status === 'completed' ? 'הושלם' : 'ממתין'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredData.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <FileText style={{ margin: '0 auto', height: '3rem', width: '3rem', color: '#9ca3af' }} />
              <h3 style={{ marginTop: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>אין נתונים להצגה</h3>
              <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#6b7280' }}>לא נמצאו עסקאות בטווח התאריכים שנבחר</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}