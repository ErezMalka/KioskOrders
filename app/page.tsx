export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">מערכת CRM</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">ברוך הבא למערכת</h2>
        <p className="text-gray-600">
          המערכת בבנייה - נתחיל להוסיף פונקציונליות בהדרגה
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">0</div>
          <div className="text-sm text-gray-600 mt-2">לקוחות</div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-green-600">0</div>
          <div className="text-sm text-gray-600 mt-2">לידים</div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-purple-600">0</div>
          <div className="text-sm text-gray-600 mt-2">משימות</div>
        </div>
      </div>
    </div>
  )
}
