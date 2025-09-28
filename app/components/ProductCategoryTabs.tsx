'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ProductCategoryTabs() {
  const router = useRouter()
  const pathname = usePathname()
  const activeTab = pathname.includes('categories') ? 'categories' : 'products'
  const [counts, setCounts] = useState({ products: 0, categories: 0 })

  useEffect(() => {
    fetchCounts()
  }, [])

  const fetchCounts = async () => {
    try {
      const [productsResult, categoriesResult] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true })
      ])

      setCounts({
        products: productsResult.count || 0,
        categories: categoriesResult.count || 0
      })
    } catch (error) {
      console.error('Error fetching counts:', error)
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      marginBottom: '30px',
      marginTop: '-10px'
    }}>
      <div style={{
        display: 'flex',
        gap: '10px',
        backgroundColor: '#f0f0f0',
        padding: '5px',
        borderRadius: '10px'
      }}>
        <button
          onClick={() => router.push('/products')}
          style={{
            padding: '10px 24px',
            backgroundColor: activeTab === 'products' ? '#4CAF50' : 'transparent',
            color: activeTab === 'products' ? 'white' : '#666',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'products') {
              e.currentTarget.style.backgroundColor = '#f9f9f9'
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'products') {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        >
          📦 מוצרים
          {counts.products > 0 && (
            <span style={{
              backgroundColor: activeTab === 'products' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '14px'
            }}>
              {counts.products}
            </span>
          )}
        </button>
        
        <button
          onClick={() => router.push('/categories')}
          style={{
            padding: '10px 24px',
            backgroundColor: activeTab === 'categories' ? '#9C27B0' : 'transparent',
            color: activeTab === 'categories' ? 'white' : '#666',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'categories') {
              e.currentTarget.style.backgroundColor = '#f9f9f9'
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'categories') {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        >
          📁 קטגוריות
          {counts.categories > 0 && (
            <span style={{
              backgroundColor: activeTab === 'categories' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '14px'
            }}>
              {counts.categories}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
