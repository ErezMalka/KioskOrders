import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kiosk Order Management',
  description: 'Order management system for kiosk installations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui' }}>
        {children}
      </body>
    </html>
  )
}
