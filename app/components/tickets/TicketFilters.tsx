'use client'

import { Search, Filter, X } from 'lucide-react'

interface TicketFiltersProps {
  filters: {
    status: string
    priority: string
    category: string
    search: string
  }
  onFiltersChange: (filters: any) => void
}

export default function TicketFilters({ filters, onFiltersChange }: TicketFiltersProps) {
  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => value !== 'all' && value !== ''
  ).length

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex flex-wrap gap-4">
        {/* חיפוש */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש לפי מספר, כותרת או תוכן..."
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            {filters.search && (
              <button
                onClick={() => handleFilterChange('search', '')}
                className="absolute left-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* סטטוס */}
        <div className="min-w-[150px]">
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">כל הסטטוסים</option>
            <option value="open">פתוח</option>
            <option value="in_progress">בטיפול</option>
            <option value="waiting_for_customer">ממתין ללקוח</option>
            <option value="resolved">נפתר</option>
            <option value="closed">סגור</option>
          </select>
        </div>

        {/* עדיפות */}
        <div className="min-w-[150px]">
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
          >
            <option value="all">כל העדיפויות</option>
            <option value="low">נמוכה</option>
            <option value="medium">בינונית</option>
            <option value="high">גבוהה</option>
            <option value="urgent">דחוף</option>
          </select>
        </div>

        {/* קטגוריה */}
        <div className="min-w-[150px]">
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="all">כל הקטגוריות</option>
            <option value="technical">תמיכה טכנית</option>
            <option value="billing">חיוב ותשלומים</option>
            <option value="general">כללי</option>
            <option value="feature">בקשת פיצ'ר</option>
            <option value="bug">באג</option>
          </select>
        </div>

        {/* איפוס פילטרים */}
        {activeFiltersCount > 0 && (
          <button
            onClick={() => onFiltersChange({
              status: 'all',
              priority: 'all',
              category: 'all',
              search: ''
            })}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center">
              <X className="w-4 h-4 ml-1" />
              נקה פילטרים ({activeFiltersCount})
            </div>
          </button>
        )}
      </div>
    </div>
  )
}
