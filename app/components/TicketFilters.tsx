import React from 'react';

interface TicketFiltersProps {
  filters: {
    status: string;
    priority: string;
    category: string;
    search: string;
  };
  onFilterChange: (filters: any) => void;
}

const containerStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '20px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const filtersRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '15px',
  flexWrap: 'wrap' as const,
  alignItems: 'center'
};

const filterGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column' as const,
  minWidth: '150px'
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#666',
  marginBottom: '4px',
  fontWeight: '500'
};

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px',
  backgroundColor: '#fff',
  cursor: 'pointer',
  transition: 'border-color 0.3s',
  outline: 'none'
};

const searchInputStyle: React.CSSProperties = {
  ...selectStyle,
  minWidth: '250px'
};

const resetButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#f5f5f5',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'all 0.3s',
  marginTop: '20px'
};

const statsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
  marginTop: '15px',
  paddingTop: '15px',
  borderTop: '1px solid #f0f0f0'
};

const statItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const statLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#999'
};

const statValueStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#333'
};

export default function TicketFilters({ filters, onFilterChange }: TicketFiltersProps) {
  const handleFilterChange = (key: string, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  const handleReset = () => {
    onFilterChange({
      status: '',
      priority: '',
      category: '',
      search: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div style={containerStyle}>
      <div style={filtersRowStyle}>
        {/* Search */}
        <div style={{ ...filterGroupStyle, flex: 1 }}>
          <label style={labelStyle}>חיפוש</label>
          <input
            type="text"
            placeholder="חפש לפי כותרת או תיאור..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            style={searchInputStyle}
          />
        </div>

        {/* Status Filter */}
        <div style={filterGroupStyle}>
          <label style={labelStyle}>סטטוס</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            style={selectStyle}
          >
            <option value="">כל הסטטוסים</option>
            <option value="open">פתוח</option>
            <option value="in_progress">בטיפול</option>
            <option value="pending">בהמתנה</option>
            <option value="resolved">נפתר</option>
            <option value="closed">סגור</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div style={filterGroupStyle}>
          <label style={labelStyle}>עדיפות</label>
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            style={selectStyle}
          >
            <option value="">כל העדיפויות</option>
            <option value="low">נמוכה</option>
            <option value="medium">בינונית</option>
            <option value="high">גבוהה</option>
            <option value="urgent">דחוף</option>
          </select>
        </div>

        {/* Category Filter */}
        <div style={filterGroupStyle}>
          <label style={labelStyle}>קטגוריה</label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            style={selectStyle}
          >
            <option value="">כל הקטגוריות</option>
            <option value="support">תמיכה</option>
            <option value="bug">באג</option>
            <option value="feature">בקשת פיצ'ר</option>
            <option value="other">אחר</option>
          </select>
        </div>

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            style={resetButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e0e0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
          >
            נקה פילטרים
          </button>
        )}
      </div>

      {/* Quick Stats (Optional) */}
      <div style={statsStyle}>
        <div style={statItemStyle}>
          <span style={statLabelStyle}>פתוחים:</span>
          <span style={statValueStyle}>12</span>
        </div>
        <div style={statItemStyle}>
          <span style={statLabelStyle}>בטיפול:</span>
          <span style={statValueStyle}>5</span>
        </div>
        <div style={statItemStyle}>
          <span style={statLabelStyle}>דחופים:</span>
          <span style={{ ...statValueStyle, color: '#ff4444' }}>3</span>
        </div>
      </div>
    </div>
  );
}
