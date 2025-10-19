import { QueryProvider } from '@/providers/QueryProvider'
import TicketsNavigation from '@/components/tickets/TicketsNavigation'

export default function TicketsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <div className="flex h-screen overflow-hidden">
          {/* תפריט צד */}
          <TicketsNavigation />
          
          {/* תוכן ראשי */}
          <main className="flex-1 overflow-y-auto">
            <div className="py-6 px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </QueryProvider>
  )
}
