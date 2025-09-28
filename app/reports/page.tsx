'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Download, Filter, TrendingUp, Users, Package, DollarSign, BarChart3, PieChart, Activity, ChevronDown, Eye, Search, Printer, FileText, ArrowUp, ArrowDown } from 'lucide-react';

export default function ReportsPage() {
  // User role - in production this would come from auth context
  const [userRole, setUserRole] = useState<'admin' | 'agent'>('admin');
  const [currentUserId] = useState('agent-123');
  
  // Filters state
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [reportType, setReportType] = useState<'summary' | 'agents' | 'products' | 'detailed'>('summary');
  const [searchTerm, setSearchTerm] = useState('');

  // Sample data - replace with API call
  const [salesData] = useState([
    { id: 1, date: '2024-01-15', agent: 'agent-123', agentName: 'דוד כהן', product: 'מוצר A', quantity: 5, amount: 2500, customer: 'לקוח 1', status: 'completed' },
    { id: 2, date: '2024-01-16', agent: 'agent-456', agentName: 'שרה לוי', product: 'מוצר B', quantity: 3, amount: 1800, customer: 'לקוח 2', status: 'completed' },
    { id: 3, date: '2024-01-17', agent: 'agent-123', agentName: 'דוד כהן', product: 'מוצר C', quantity: 2, amount: 3200, customer: 'לקוח 3', status: 'pending' },
    { id: 4, date: '2024-01-18', agent: 'agent-789', agentName: 'יוסי אברהם', product: 'מוצר A', quantity: 7, amount: 3500, customer: 'לקוח 4', status: 'completed' },
    { id: 5, date: '2024-01-19', agent: 'agent-123', agentName: 'דוד כהן', product: 'מוצר B', quantity: 4, amount: 2400, customer: 'לקוח 5', status: 'completed' },
    { id: 6, date: '2024-01-20', agent: 'agent-456', agentName: 'שרה לוי', product: 'מוצר D', quantity: 6, amount: 4200, customer: 'לקוח 6', status: 'completed' },
  ]);

  const agents = [
    { id: 'agent-123', name: 'דוד כהן' },
    { id: 'agent-456', name: 'שרה לוי' },
    { id: 'agent-789', name: 'יוסי אברהם' }
  ];

  const products = ['מוצר A', 'מוצר B', 'מוצר C', 'מוצר D'];

  // Filter data based on user role and selected filters
  const filteredData = useMemo(() => {
    let filtered = [...salesData];
    
    // If agent, only show their own data
    if (userRole === 'agent') {
      filtered = filtered.filter(item => item.agent === currentUserId);
    } else if (selectedAgent !== 'all') {
      filtered = filtered.filter(item => item.agent === selectedAgent);
    }
    
    if (selectedProduct !== 'all') {
      filtered = filtered.filter(item => item.product === selectedProduct);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.agentName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [salesData, userRole, currentUserId, selectedAgent, selectedProduct, searchTerm]);

  // Calculate statistics
  const stats = useMemo(() => {
    const completed = filteredData.filter(item => item.status === 'completed');
    const totalSales = completed.reduce((sum, item) => sum + item.amount, 0);
    const totalQuantity = completed.reduce((sum, item) => sum + item.quantity, 0);
    const avgOrderValue = completed.length > 0 ? totalSales / completed.length : 0;
    
    // Calculate trend (comparing to previous period)
    const previousTotal = totalSales * 0.8; // Sample calculation
    const trend = ((totalSales - previousTotal) / previousTotal * 100).toFixed(1);
    
    return {
      totalSales,
      totalOrders: completed.length,
      totalQuantity,
      avgOrderValue,
      trend: parseFloat(trend)
    };
  }, [filteredData]);

  // Group data by agent for admin view
  const agentPerformance = useMemo(() => {
    if (userRole !== 'admin') return [];
    
    const grouped: Record<string, { sales: number; orders: number; quantity: number }> = {};
    filteredData.forEach(item => {
      if (!grouped[item.agentName]) {
        grouped[item.agentName] = { sales: 0, orders: 0, quantity: 0 };
      }
      if (item.status === 'completed') {
        grouped[item.agentName].sales += item.amount;
        grouped[item.agentName].orders += 1;
        grouped[item.agentName].quantity += item.quantity;
      }
    });
    
    return Object.entries(grouped).map(([name, data]) => ({
      name,
      ...data
    })).sort((a, b) => b.sales - a.sales);
  }, [filteredData, userRole]);

  // Product performance
  const productPerformance = useMemo(() => {
    const grouped: Record<string, { sales: number; quantity: number }> = {};
    filteredData.forEach(item => {
      if (!grouped[item.product]) {
        grouped[item.product] = { sales: 0, quantity: 0 };
      }
      if (item.status === 'completed') {
        grouped[item.product].sales += item.amount;
        grouped[item.product].quantity += item.quantity;
      }
    });
    
    return Object.entries(grouped).map(([name, data]) => ({
      name,
      ...data
    })).sort((a, b) => b.sales - a.sales);
  }, [filteredData]);

  const exportToCSV = () => {
    const headers = ['תאריך', 'סוכן', 'מוצר', 'כמות', 'סכום', 'לקוח', 'סטטוס'];
    const rows = filteredData.map(item => [
      item.date,
      item.agentName,
      item.product,
      item.quantity,
      item.amount,
      item.customer,
      item.status
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">מערכת דוחות מכירות</h1>
            <p className="text-gray-600 mt-2">
              {userRole === 'admin' ? 'ניהול וניתוח ביצועי מכירות' : 'ביצועי המכירות שלך'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setUserRole(userRole === 'admin' ? 'agent' : 'admin')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              {userRole === 'admin' ? 'מצב אדמין' : 'מצב סוכן'}
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              ייצוא לאקסל
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              הדפסה
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold">סינון וחיפוש</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">מתאריך</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">עד תאריך</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {userRole === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">סוכן</label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">כל הסוכנים</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">מוצר</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">כל המוצרים</option>
              {products.map(product => (
                <option key={product} value={product}>{product}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">חיפוש</label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="חפש לפי לקוח, מוצר..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-10 h-10 text-green-500 bg-green-100 rounded-lg p-2" />
            {stats.trend > 0 ? (
              <span className="flex items-center text-green-600 text-sm">
                <ArrowUp className="w-4 h-4" />
                {stats.trend}%
              </span>
            ) : (
              <span className="flex items-center text-red-600 text-sm">
                <ArrowDown className="w-4 h-4" />
                {Math.abs(stats.trend)}%
              </span>
            )}
          </div>
          <h3 className="text-gray-600 text-sm">סך המכירות</h3>
          <p className="text-2xl font-bold text-gray-900">₪{stats.totalSales.toLocaleString()}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <Package className="w-10 h-10 text-blue-500 bg-blue-100 rounded-lg p-2" />
          </div>
          <h3 className="text-gray-600 text-sm">הזמנות</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="w-10 h-10 text-purple-500 bg-purple-100 rounded-lg p-2" />
          </div>
          <h3 className="text-gray-600 text-sm">כמות מוצרים</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.totalQuantity}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-10 h-10 text-orange-500 bg-orange-100 rounded-lg p-2" />
          </div>
          <h3 className="text-gray-600 text-sm">ממוצע הזמנה</h3>
          <p className="text-2xl font-bold text-gray-900">₪{stats.avgOrderValue.toFixed(0)}</p>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <div className="flex gap-8 px-6 pt-4">
            <button
              onClick={() => setReportType('summary')}
              className={`pb-4 px-2 border-b-2 font-medium text-sm ${
                reportType === 'summary'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              סיכום מכירות
            </button>
            {userRole === 'admin' && (
              <button
                onClick={() => setReportType('agents')}
                className={`pb-4 px-2 border-b-2 font-medium text-sm ${
                  reportType === 'agents'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                ביצועי סוכנים
              </button>
            )}
            <button
              onClick={() => setReportType('products')}
              className={`pb-4 px-2 border-b-2 font-medium text-sm ${
                reportType === 'products'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              ביצועי מוצרים
            </button>
            <button
              onClick={() => setReportType('detailed')}
              className={`pb-4 px-2 border-b-2 font-medium text-sm ${
                reportType === 'detailed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              דוח מפורט
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="p-6">
          {reportType === 'summary' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">סיכום פעילות</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Chart Placeholder */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">מכירות לפי ימים</h4>
                  <div className="h-48 flex items-center justify-center text-gray-400">
                    <Activity className="w-8 h-8" />
                    <span className="mr-2">גרף מכירות</span>
                  </div>
                </div>
                
                {/* Product Distribution */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">התפלגות מוצרים</h4>
                  <div className="h-48 flex items-center justify-center text-gray-400">
                    <PieChart className="w-8 h-8" />
                    <span className="mr-2">גרף עוגה</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {reportType === 'agents' && userRole === 'admin' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">ביצועי סוכנים</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סוכן</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">מכירות</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">הזמנות</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">כמות</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ממוצע</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {agentPerformance.map((agent, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{agent.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₪{agent.sales.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agent.orders}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agent.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₪{agent.orders > 0 ? (agent.sales / agent.orders).toFixed(0) : 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportType === 'products' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">ביצועי מוצרים</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">מוצר</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">מכירות</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">כמות</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ממוצע ליחידה</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {productPerformance.map((product, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₪{product.sales.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₪{product.quantity > 0 ? (product.sales / product.quantity).toFixed(0) : 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportType === 'detailed' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">דוח מפורט</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תאריך</th>
                      {userRole === 'admin' && (
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סוכן</th>
                      )}
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">לקוח</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">מוצר</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">כמות</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סכום</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סטטוס</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.date}</td>
                        {userRole === 'admin' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.agentName}</td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.customer}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.product}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₪{item.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status === 'completed' ? 'הושלם' : 'ממתין'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">פעולות מהירות</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" />
            <span>דוח חודשי</span>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <span>ניתוח מגמות</span>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            <span>השוואת סוכנים</span>
          </button>
        </div>
      </div>
    </div>
  );
}
