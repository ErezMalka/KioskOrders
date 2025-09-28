'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Download, Filter, TrendingUp, Users, Package, DollarSign, BarChart3, PieChart as PieChartIcon, Activity, ChevronDown, Eye, Search, Printer, FileText, ArrowUp, ArrowDown, Loader2, ShieldCheck, UserCheck } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

// Auth hook - התאם למערכת שלך
// import { useSession } from 'next-auth/react';
// import { useAuth } from '@/hooks/useAuth';
// import { useUser } from '@clerk/nextjs';

export default function ReportsPage() {
  // === מערכת אימות - בחר את האופציה המתאימה לך ===
  
  // אופציה 1: Next-Auth
  // const { data: session, status } = useSession();
  // const isLoading = status === 'loading';
  // const userRole = session?.user?.role || 'agent';
  // const currentUserId = session?.user?.id;
  // const userName = session?.user?.name;
  
  // אופציה 2: Custom Auth Hook
  // const { user, isLoading } = useAuth();
  // const userRole = user?.role || 'agent';
  // const currentUserId = user?.id;
  // const userName = user?.name;
  
  // אופציה 3: Clerk
  // const { user, isLoaded } = useUser();
  // const isLoading = !isLoaded;
  // const userRole = user?.publicMetadata?.role || 'agent';
  // const currentUserId = user?.id;
  // const userName = user?.firstName;

  // כרגע - מצב דמו
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'agent'>('admin');
  const [currentUserId] = useState('agent-123');
  const [userName] = useState('דוד כהן');
  
  // Filters state
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [reportType, setReportType] = useState<'summary' | 'agents' | 'products' | 'detailed'>('summary');
  const [searchTerm, setSearchTerm] = useState('');

  // Theme colors
  const chartColors = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#8B5CF6',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#06B6D4'
  };

  // Sample data - החלף עם API call
  const [salesData, setSalesData] = useState([
    { id: 1, date: '2024-01-15', agent: 'agent-123', agentName: 'דוד כהן', product: 'מוצר A', quantity: 5, amount: 2500, customer: 'לקוח 1', status: 'completed' },
    { id: 2, date: '2024-01-16', agent: 'agent-456', agentName: 'שרה לוי', product: 'מוצר B', quantity: 3, amount: 1800, customer: 'לקוח 2', status: 'completed' },
    { id: 3, date: '2024-01-17', agent: 'agent-123', agentName: 'דוד כהן', product: 'מוצר C', quantity: 2, amount: 3200, customer: 'לקוח 3', status: 'pending' },
    { id: 4, date: '2024-01-18', agent: 'agent-789', agentName: 'יוסי אברהם', product: 'מוצר A', quantity: 7, amount: 3500, customer: 'לקוח 4', status: 'completed' },
    { id: 5, date: '2024-01-19', agent: 'agent-123', agentName: 'דוד כהן', product: 'מוצר B', quantity: 4, amount: 2400, customer: 'לקוח 5', status: 'completed' },
    { id: 6, date: '2024-01-20', agent: 'agent-456', agentName: 'שרה לוי', product: 'מוצר D', quantity: 6, amount: 4200, customer: 'לקוח 6', status: 'completed' },
    { id: 7, date: '2024-01-21', agent: 'agent-789', agentName: 'יוסי אברהם', product: 'מוצר C', quantity: 3, amount: 4800, customer: 'לקוח 7', status: 'completed' },
    { id: 8, date: '2024-01-22', agent: 'agent-123', agentName: 'דוד כהן', product: 'מוצר A', quantity: 8, amount: 4000, customer: 'לקוח 8', status: 'completed' },
  ]);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // החלף עם ה-API שלך
        // const response = await fetch('/api/sales', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     startDate: dateRange.start,
        //     endDate: dateRange.end,
        //     agent: selectedAgent,
        //     product: selectedProduct
        //   })
        // });
        // const data = await response.json();
        // setSalesData(data);
        
        // סימולציה של טעינה
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dateRange, selectedAgent, selectedProduct]);

  const agents = [
    { id: 'agent-123', name: 'דוד כהן' },
    { id: 'agent-456', name: 'שרה לוי' },
    { id: 'agent-789', name: 'יוסי אברהם' }
  ];

  const products = ['מוצר A', 'מוצר B', 'מוצר C', 'מוצר D'];

  // Filter data based on user role and selected filters
  const filteredData = useMemo(() => {
    let filtered = [...salesData];
    
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
    
    const previousTotal = totalSales * 0.8;
    const trend = ((totalSales - previousTotal) / previousTotal * 100).toFixed(1);
    
    return {
      totalSales,
      totalOrders: completed.length,
      totalQuantity,
      avgOrderValue,
      trend: parseFloat(trend),
      conversionRate: (completed.length / filteredData.length * 100).toFixed(1)
    };
  }, [filteredData]);

  // Prepare chart data
  const chartData = useMemo(() => {
    // Sales by date
    const salesByDate = filteredData.reduce((acc: any[], item) => {
      const existing = acc.find(d => d.date === item.date);
      if (existing) {
        existing.sales += item.amount;
        existing.orders += 1;
      } else {
        acc.push({
          date: item.date,
          sales: item.amount,
          orders: 1,
          day: new Date(item.date).toLocaleDateString('he-IL', { weekday: 'short' })
        });
      }
      return acc;
    }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Product distribution for pie chart
    const productDistribution = products.map(product => {
      const productSales = filteredData
        .filter(item => item.product === product && item.status === 'completed')
        .reduce((sum, item) => sum + item.amount, 0);
      return {
        name: product,
        value: productSales,
        percentage: ((productSales / stats.totalSales) * 100).toFixed(1)
      };
    }).filter(item => item.value > 0);

    return {
      salesByDate,
      productDistribution
    };
  }, [filteredData, stats.totalSales]);

  // Agent performance
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
      ...data,
      average: data.orders > 0 ? data.sales / data.orders : 0
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
      ...data,
      average: data.quantity > 0 ? data.sales / data.quantity : 0
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
      item.status === 'completed' ? 'הושלם' : 'ממתין'
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4" dir="rtl">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">מערכת דוחות מכירות</h1>
            <p className="text-gray-600">
              {userRole === 'admin' ? 'ניהול וניתוח ביצועי מכירות' : `ביצועי המכירות שלך, ${userName}`}
            </p>
          </div>
          <div className="flex gap-2">
            {/* User Role Indicator */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
              {userRole === 'admin' ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">מנהל</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">סוכן</span>
                </>
              )}
            </div>
            
            {/* Toggle Role for Demo */}
            <button
              onClick={() => setUserRole(userRole === 'admin' ? 'agent' : 'admin')}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-2 shadow-md"
            >
              <Users className="w-4 h-4" />
              החלף תצוגה
            </button>
            
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center gap-2 shadow-md"
            >
              <Download className="w-4 h-4" />
              ייצוא
            </button>
            
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              הדפסה
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Filter className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold">סינון וחיפוש</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">מתאריך</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">עד תאריך</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          
          {userRole === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">סוכן</label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur">
              <DollarSign className="w-6 h-6" />
            </div>
            {stats.trend > 0 ? (
              <span className="flex items-center text-sm bg-white/20 px-2 py-1 rounded-full">
                <ArrowUp className="w-3 h-3" />
                {stats.trend}%
              </span>
            ) : (
              <span className="flex items-center text-sm bg-white/20 px-2 py-1 rounded-full">
                <ArrowDown className="w-3 h-3" />
                {Math.abs(stats.trend)}%
              </span>
            )}
          </div>
          <h3 className="text-green-100 text-sm">סך המכירות</h3>
          <p className="text-2xl font-bold">₪{stats.totalSales.toLocaleString()}</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur">
              <Package className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-blue-100 text-sm">הזמנות</h3>
          <p className="text-2xl font-bold">{stats.totalOrders}</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-purple-100 text-sm">כמות מוצרים</h3>
          <p className="text-2xl font-bold">{stats.totalQuantity}</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-orange-100 text-sm">ממוצע הזמנה</h3>
          <p className="text-2xl font-bold">₪{stats.avgOrderValue.toFixed(0)}</p>
        </div>

        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-cyan-100 text-sm">שיעור המרה</h3>
          <p className="text-2xl font-bold">{stats.conversionRate}%</p>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="bg-white rounded-xl shadow-lg mb-6 border border-gray-100">
        <div className="border-b border-gray-200">
          <div className="flex gap-8 px-6 pt-4">
            <button
              onClick={() => setReportType('summary')}
              className={`pb-4 px-2 border-b-2 font-medium text-sm transition-all duration-200 ${
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
                className={`pb-4 px-2 border-b-2 font-medium text-sm transition-all duration-200 ${
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
              className={`pb-4 px-2 border-b-2 font-medium text-sm transition-all duration-200 ${
                reportType === 'products'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              ביצועי מוצרים
            </button>
            <button
              onClick={() => setReportType('detailed')}
              className={`pb-4 px-2 border-b-2 font-medium text-sm transition-all duration-200 ${
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
                {/* Sales Line Chart */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">מכירות לפי ימים</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={chartData.salesByDate}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="day" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip 
                        formatter={(value: any) => `₪${value.toLocaleString()}`}
                        labelFormatter={(label) => `יום: ${label}`}
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="sales" 
                        stroke={chartColors.primary}
                        strokeWidth={2}
                        fill="url(#colorSales)"
                        name="מכירות"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Product Pie Chart */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">התפלגות מוצרים</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={chartData.productDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name} (${entry.percentage}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.productDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={Object.values(chartColors)[index % Object.values(chartColors).length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `₪${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart for Agent Performance */}
              {userRole === 'admin' && agentPerformance.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-6 mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">השוואת ביצועי סוכנים</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={agentPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="name" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip 
                        formatter={(value: any) => `₪${value.toLocaleString()}`}
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="sales" fill={chartColors.primary} radius={[8, 8, 0, 0]} name="מכירות" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
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
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ביצועים</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {agentPerformance.map((agent, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold ml-3">
                              {agent.name.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{agent.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₪{agent.sales.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agent.orders}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agent.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₪{agent.average.toFixed(0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full ml-3">
                              <div 
                                className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                                style={{ width: `${(agent.sales / Math.max(...agentPerformance.map(a => a.sales))) * 100}%` }}
                              />
                            </div>
                          </div>
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
              
              {/* Product Performance Chart */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={productPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="name" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      formatter={(value: any) => `₪${value.toLocaleString()}`}
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="sales" fill={chartColors.secondary} radius={[8, 8, 0, 0]} name="מכירות" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">מוצר</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">מכירות</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">כמות</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ממוצע ליחידה</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">נתח שוק</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {productPerformance.map((product, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full ml-3`} 
                                 style={{ backgroundColor: Object.values(chartColors)[index % Object.values(chartColors).length] }} />
                            <span className="text-sm font-medium text-gray-900">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₪{product.sales.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₪{product.average.toFixed(0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-600 ml-2">
                              {((product.sales / stats.totalSales) * 100).toFixed(1)}%
                            </span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full">
                              <div 
                                className="h-2 bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                                style={{ width: `${(product.sales / stats.totalSales) * 100}%` }}
                              />
                            </div>
                          </div>
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
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(item.date).toLocaleDateString('he-IL')}
                        </td>
                        {userRole === 'admin' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.agentName}</td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.customer}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.product}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₪{item.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status === 'completed' ? 'הושלם' : 'ממתין'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button className="text-blue-600 hover:text-blue-900 transition-colors duration-150">
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
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">פעולות מהירות</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center gap-2 group">
            <FileText className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
            <span className="group-hover:text-blue-600">דוח חודשי</span>
          </button>
          <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 flex items-center justify-center gap-2 group">
            <BarChart3 className="w-5 h-5 text-gray-600 group-hover:text-purple-600" />
            <span className="group-hover:text-purple-600">ניתוח מגמות</span>
          </button>
          <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 flex items-center justify-center gap-2 group">
            <Users className="w-5 h-5 text-gray-600 group-hover:text-green-600" />
            <span className="group-hover:text-green-600">השוואת סוכנים</span>
          </button>
        </div>
      </div>
    </div>
  );
}
