'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = 'he' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  dir: 'rtl' | 'ltr'
}

const translations = {
  he: {
    common: { loading: 'טוען...' },
    auth: { login: 'התחברות', email: 'דוא"ל', password: 'סיסמה', loginError: 'שגיאה בהתחברות' },
    dashboard: { welcome: 'ברוך הבא', title: 'לוח בקרה', totalOrders: 'סה"כ הזמנות', pendingOrders: 'הזמנות ממתינות', completedOrders: 'הזמנות שהושלמו', revenue: 'הכנסות' }
  },
  en: {
    common: { loading: 'Loading...' },
    auth: { login: 'Login', email: 'Email', password: 'Password', loginError: 'Login error' },
    dashboard: { welcome: 'Welcome', title: 'Dashboard', totalOrders: 'Total Orders', pendingOrders: 'Pending Orders', completedOrders: 'Completed Orders', revenue: 'Revenue' }
  }
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('he')

  useEffect(() => {
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr'
    document.documentElement.lang = language
  }, [language])

  const t = (key: string) => {
    const keys = key.split('.')
    let value: any = translations[language]
    for (const k of keys) {
      value = value?.[k]
    }
    return value || key
  }

  const dir = language === 'he' ? 'rtl' : 'ltr'

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
