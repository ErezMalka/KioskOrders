'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Plus, Trash2, Edit, Save, X, FileSpreadsheet, 
  Download, Search, Building2, User, Mail, Phone, MapPin, 
  Globe, Hash, Briefcase, CreditCard, Calendar, FileText, 
  Star, Check, AlertCircle, Sparkles, Users, Trophy, Zap, 
  Shield, TrendingUp, Target, Smartphone, Package, Filter,
  ChevronRight, Activity, Award, Layers, Command, Grid3x3,
  BarChart3, PieChart, TrendingDown, ArrowUpRight, Gem,
  Rocket, Crown, Flame, Heart, MessageCircle, Bell, Settings
} from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState('all');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);

  // טעינת לקוחות מ-localStorage
  useEffect(() => {
    const savedCustomers = localStorage.getItem('customers');
    if (savedCustomers) {
      const parsed = JSON.parse(savedCustomers);
      setCustomers(parsed);
      setFilteredCustomers(parsed);
    }
  }, []);

  // חיפוש וסינון
  useEffect(() => {
    let filtered = customers.filter(customer => 
      customer.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => {
        if (statusFilter === 'active') return customer.status === 'active' || customer.status === 'פעיל';
        if (statusFilter === 'inactive') return customer.status === 'inactive' || customer.status === 'לא פעיל';
        if (statusFilter === 'potential') return customer.status === 'potential' || customer.status === 'פוטנציאלי';
        return false;
      });
    }

    setFilteredCustomers(filtered);
  }, [searchTerm, customers, statusFilter]);

  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active' || c.status === 'פעיל').length,
    potential: customers.filter(c => c.status === 'potential' || c.status === 'פוטנציאלי').length,
    inactive: customers.filter(c => c.status === 'inactive' || c.status === 'לא פעיל').length,
    growth: 12.5 // אחוז צמיחה
  };

  const CustomerCard = ({ customer, index }: { customer: any; index: number }) => {
    const isHovered = hoveredCard === customer.id;
    const displayStatus = customer.status === 'active' ? 'פעיל' : 
                         customer.status === 'inactive' ? 'לא פעיל' : 
                         customer.status === 'potential' ? 'פוטנציאלי' : 
                         customer.status;
    
    return (
      <div
        onMouseEnter={() => setHoveredCard(customer.id)}
        onMouseLeave={() => setHoveredCard(null)}
        style={{
          animationDelay: `${index * 0.05}s`
        }}
        className={`
          relative group bg-white rounded-3xl p-8 
          border-2 border-gray-100 hover:border-transparent
          transform transition-all duration-500 ease-out animate-fadeInUp
          ${isHovered ? 'scale-[1.02] -translate-y-2' : ''}
          hover:shadow-[0_20px_70px_-15px_rgba(0,0,0,0.3)]
          before:absolute before:inset-0 before:rounded-3xl before:p-[2px]
          before:bg-gradient-to-br before:from-violet-500 before:via-pink-500 before:to-orange-500
          before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500
          before:-z-10 after:absolute after:inset-[2px] after:bg-white after:rounded-[22px] after:-z-10
        `}
      >
        {/* נקודת סטטוס מהבהבת */}
        <div className="absolute top-6 right-6">
          <div className={`relative flex items-center justify-center`}>
            <span className={`
              absolute inline-flex h-3 w-3 rounded-full opacity-75 animate-ping
              ${(customer.status === 'active' || customer.status === 'פעיל') ? 'bg-emerald-400' :
                (customer.status === 'potential' || customer.status === 'פוטנציאלי') ? 'bg-amber-400' :
                'bg-gray-400'}
            `}></span>
            <span className={`
              relative inline-flex rounded-full h-3 w-3
              ${(customer.status === 'active' || customer.status === 'פעיל') ? 'bg-emerald-500' :
                (customer.status === 'potential' || customer.status === 'פוטנציאלי') ? 'bg-amber-500' :
                'bg-gray-500'}
            `}></span>
          </div>
        </div>

        {/* תוכן הכרטיס */}
        <div className="flex items-start gap-5 mb-6">
          <div className={`
            relative w-16 h-16 rounded-2xl
            bg-gradient-to-br from-violet-500 via-pink-500 to-orange-500
            flex items-center justify-center text-white font-bold text-2xl
            transform transition-all duration-500
            ${isHovered ? 'rotate-12 scale-110' : ''}
          `}>
            <span className="transform transition-transform duration-500 group-hover:scale-125">
              {customer.businessName?.charAt(0) || '?'}
            </span>
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-pink-600 transition-all duration-300">
              {customer.businessName}
            </h3>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <Briefcase className="w-3 h-3" />
              {customer.businessType || 'לא צוין'}
            </p>
          </div>
        </div>

        {/* פרטי קשר */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-sm text-gray-600 group/item hover:text-violet-600 transition-colors cursor-pointer">
            <User className="w-4 h-4 group-hover/item:scale-110 transition-transform" />
            <span>{customer.contactName}</span>
          </div>
          {customer.email && (
            <div className="flex items-center gap-3 text-sm text-gray-600 group/item hover:text-violet-600 transition-colors cursor-pointer">
              <Mail className="w-4 h-4 group-hover/item:scale-110 transition-transform" />
              <span className="truncate">{customer.email}</span>
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center gap-3 text-sm text-gray-600 group/item hover:text-violet-600 transition-colors cursor-pointer">
              <Phone className="w-4 h-4 group-hover/item:scale-110 transition-transform" />
              <span>{customer.phone}</span>
            </div>
          )}
        </div>

        {/* כפתורי פעולה */}
        <div className={`
          flex gap-3 transform transition-all duration-500
          ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}
        `}>
          <button className="
            flex-1 py-3 px-4 rounded-2xl font-medium text-sm
            bg-gradient-to-r from-violet-500 to-pink-500 text-white
            hover:from-violet-600 hover:to-pink-600
            transform hover:scale-105 transition-all duration-300
            shadow-lg hover:shadow-xl
          ">
            עריכה
          </button>
          <button className="
            py-3 px-4 rounded-2xl font-medium text-sm
            bg-gray-100 text-gray-700
            hover:bg-red-500 hover:text-white
            transform hover:scale-105 transition-all duration-300
          ">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* תג סטטוס */}
        <div className={`
          absolute bottom-6 left-6 px-3 py-1 rounded-full text-xs font-medium
          transform transition-all duration-500
          ${isHovered ? 'scale-110' : ''}
          ${(customer.status === 'active' || customer.status === 'פעיל') ? 'bg-emerald-100 text-emerald-700' :
            (customer.status === 'potential' || customer.status === 'פוטנציאלי') ? 'bg-amber-100 text-amber-700' :
            'bg-gray-100 text-gray-700'}
        `}>
          {displayStatus}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-pink-50" dir="rtl">
      {/* Navigation Bar */}
      <div className="sticky top-0 z-40 backdrop-blur-2xl bg-white/70 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-pink-600 rounded-2xl blur-lg opacity-70 animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-violet-600 to-pink-600 text-white px-4 py-2 rounded-2xl font-bold text-xl">
                    CRM
                  </div>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  ניהול לקוחות
                </h1>
              </div>
            </div>

            {/* כפתורי ניווט עליונים */}
            <div className="flex items-center gap-3">
              <button className="relative p-3 rounded-2xl bg-white border border-gray-200 hover:border-violet-300 hover:shadow-lg transition-all duration-300 group">
                <Bell className="w-5 h-5 text-gray-600 group-hover:text-violet-600 transition-colors" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>
              <button className="p-3 rounded-2xl bg-white border border-gray-200 hover:border-violet-300 hover:shadow-lg transition-all duration-300 group">
                <MessageCircle className="w-5 h-5 text-gray-600 group-hover:text-violet-600 transition-colors" />
              </button>
              <button className="p-3 rounded-2xl bg-white border border-gray-200 hover:border-violet-300 hover:shadow-lg transition-all duration-300 group">
                <Settings className="w-5 h-5 text-gray-600 group-hover:text-violet-600 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="group relative bg-white rounded-3xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {stats.growth}%
                </span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.total}</h3>
              <p className="text-sm text-gray-500">סה״כ לקוחות</p>
            </div>
          </div>

          <div className="group relative bg-white rounded-3xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white">
                  <Activity className="w-6 h-6" />
                </div>
                <Crown className="w-5 h-5 text-yellow-500" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.active}</h3>
              <p className="text-sm text-gray-500">לקוחות פעילים</p>
            </div>
          </div>

          <div className="group relative bg-white rounded-3xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                  <Target className="w-6 h-6" />
                </div>
                <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.potential}</h3>
              <p className="text-sm text-gray-500">פוטנציאליים</p>
            </div>
          </div>

          <div className="group relative bg-white rounded-3xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-600 text-white">
                  <TrendingDown className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.inactive}</h3>
              <p className="text-sm text-gray-500">לא פעילים</p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-3xl p-6 mb-8 border border-gray-100 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* כפתורי פעולה */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="
                  group relative px-8 py-4 
                  bg-gradient-to-r from-violet-600 to-pink-600 
                  text-white font-semibold text-sm
                  rounded-2xl overflow-hidden
                  transform hover:scale-105 transition-all duration-300
                  shadow-lg hover:shadow-2xl
                  before:absolute before:inset-0
                  before:bg-gradient-to-r before:from-pink-600 before:to-violet-600
                  before:opacity-0 hover:before:opacity-100
                  before:transition-opacity before:duration-500
                "
              >
                <span className="relative flex items-center gap-3">
                  <div className="relative">
                    <Sparkles className="w-5 h-5" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                  </div>
                  לקוח חדש
                </span>
              </button>

              <button className="
                relative px-6 py-4 
                bg-white border-2 border-gray-200
                text-gray-700 font-semibold text-sm
                rounded-2xl overflow-hidden
                transform hover:scale-105 transition-all duration-300
                hover:border-blue-400 hover:text-blue-600
                hover:shadow-lg group
              ">
                <span className="flex items-center gap-3">
                  <Upload className="w-5 h-5 group-hover:animate-bounce" />
                  ייבוא
                </span>
              </button>

              <button className="
                relative px-6 py-4 
                bg-white border-2 border-gray-200
                text-gray-700 font-semibold text-sm
                rounded-2xl overflow-hidden
                transform hover:scale-105 transition-all duration-300
                hover:border-purple-400 hover:text-purple-600
                hover:shadow-lg group
              ">
                <span className="flex items-center gap-3">
                  <Download className="w-5 h-5 group-hover:animate-bounce" />
                  ייצוא
                </span>
              </button>
            </div>

            {/* חיפוש וסינון */}
            <div className="flex items-center gap-3">
              {/* סינון סטטוס */}
              <div className="relative group">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="
                    appearance-none px-6 py-3 pr-12
                    bg-gray-50 border-2 border-gray-200
                    rounded-2xl font-medium text-sm
                    hover:border-violet-300 focus:border-violet-500
                    focus:outline-none transition-all duration-300
                    cursor-pointer hover:shadow-lg
                  "
                >
                  <option value="all">כל הסטטוסים</option>
                  <option value="active">פעילים</option>
                  <option value="potential">פוטנציאליים</option>
                  <option value="inactive">לא פעילים</option>
                </select>
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>

              {/* תיבת חיפוש */}
              <div className="relative group">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="חיפוש לקוחות..."
                  className="
                    w-80 px-6 py-3 pr-12
                    bg-gray-50 border-2 border-gray-200
                    rounded-2xl font-medium text-sm
                    hover:border-violet-300 focus:border-violet-500
                    focus:outline-none transition-all duration-300
                    placeholder:text-gray-400
                    hover:shadow-lg focus:shadow-xl
                  "
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-violet-600 transition-colors" />
              </div>

              {/* כפתורי תצוגה */}
              <div className="flex items-center bg-gray-100 rounded-2xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`
                    p-3 rounded-xl transition-all duration-300
                    ${viewMode === 'grid' 
                      ? 'bg-white shadow-lg text-violet-600' 
                      : 'text-gray-500 hover:text-gray-700'}
                  `}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`
                    p-3 rounded-xl transition-all duration-300
                    ${viewMode === 'table' 
                      ? 'bg-white shadow-lg text-violet-600' 
                      : 'text-gray-500 hover:text-gray-700'}
                  `}
                >
                  <Layers className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`
                    p-3 rounded-xl transition-all duration-300
                    ${viewMode === 'list' 
                      ? 'bg-white shadow-lg text-violet-600' 
                      : 'text-gray-500 hover:text-gray-700'}
                  `}
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* תצוגת כרטיסים */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-24">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-pink-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                  <Users className="relative w-24 h-24 text-gray-300" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">אין לקוחות במערכת</h3>
                <p className="text-gray-500 mb-8">התחל בהוספת לקוח חדש או ייבוא מאקסל</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="
                    px-8 py-4 
                    bg-gradient-to-r from-violet-600 to-pink-600 
                    text-white font-semibold
                    rounded-2xl transform hover:scale-105 
                    transition-all duration-300 shadow-xl hover:shadow-2xl
                  "
                >
                  הוסף לקוח ראשון
                </button>
              </div>
            ) : (
              filteredCustomers.map((customer, index) => (
                <CustomerCard key={customer.id} customer={customer} index={index} />
              ))
            )}
          </div>
        )}

        {/* הוסף תצוגת טבלה או רשימה כאן בהתאם */}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
