'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-red-600 mb-4">משהו השתבש!</h2>
        <p className="text-gray-600 mb-6">
          אירעה שגיאה בטעינת הדף. נסה לרענן או חזור מאוחר יותר.
        </p>
        <button
          onClick={reset}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          נסה שוב
        </button>
      </div>
    </div>
  )
}
