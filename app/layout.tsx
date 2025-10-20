import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CRM System',
  description: 'Customer Relationship Management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  )
}
