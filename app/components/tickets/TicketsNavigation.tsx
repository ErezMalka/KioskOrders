'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Ticket, 
  Inbox, 
  Users, 
  FileText, 
  Settings, 
  BarChart3,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  BookOpen
} from 'lucide-react'

const navigation = [
  { name: 'לוח בקרה', href: '/tickets', icon: BarChart3 },
  { name: 'כל הטיקטים', href: '/tickets/all', icon: Inbox },
  { name: 'הטיקטים שלי', href: '/tickets/my', icon: Ticket },
  { name: 'ממתינים', href: '/tickets/pending', icon: Clock },
  { name: 'דחופים', href: '/tickets/urgent', icon: AlertCircle },
  { name: 'פתורים', href: '/tickets/resolved', icon: CheckCircle },
]

const secondaryNavigation = [
  { name: 'Knowledge Base', href: '/tickets/kb', icon: BookOpen },
  { name: 'תבניות תשובה', href: '/tickets/templates', icon: FileText },
  { name: 'נציגים', href: '/tickets/agents', icon: Users },
  { name: 'הגדרות', href: '/tickets/settings', icon: Settings },
]

export default function TicketsNavigation() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-white border-l border-gray-200">
      {/* לוגו/כותרת */}
      <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="flex items-center">
          <MessageSquare className="w-8 h-8 text-white ml-2" />
          <span className="text-xl font-bold text-white">מערכת טיקטים</span>
        </div>
      </div>

      {/* תפריט ראשי */}
      <nav className="flex-1 px-2 py-4 bg-white">
        <div className="space-y-1">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            ניהול טיקטים
          </h3>
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <item.icon
                  className={`
                    ml-3 h-5 w-5 flex-shrink-0
                    ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}
        </div>

        {/* תפריט משני */}
        <div className="mt-8 space-y-1">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            כלים וניהול
          </h3>
          {secondaryNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <item.icon
                  className={`
                    ml-3 h-5 w-5 flex-shrink-0
                    ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* סטטיסטיקות מהירות */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">24</div>
            <div className="text-xs text-gray-500">פתוחים</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">8</div>
            <div className="text-xs text-gray-500">פתרו היום</div>
          </div>
        </div>
      </div>
    </div>
  )
}
