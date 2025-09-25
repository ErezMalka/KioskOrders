import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navigation from './components/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'מערכת ניהול הזמנות - Kiosk',
  description: 'מערכת ניהול הזמנות לעמדות קיוסק',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={inter.className} style={{ margin: 0, padding: 0 }}>
        <Navigation />
        <main style={{ minHeight: 'calc(100vh - 60px)' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
