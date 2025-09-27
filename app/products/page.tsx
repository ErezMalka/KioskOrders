<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ניהול מוצרים</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background-color: #f5f5f5;
            min-height: 100vh;
            direction: rtl;
        }

        /* Header */
        .header {
            background-color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 20px;
            margin-bottom: 30px;
        }

        .header-content {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .page-title {
            font-size: 24px;
            color: #333;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        /* Main Container */
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }

        /* Action Bar */
        .action-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }

        .btn-primary {
            background-color: #4CAF50;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .btn-primary:hover {
            background-color: #45a049;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        /* Form Section */
        .form-section {
            background-color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: none;
        }

        .form-section.active {
            display: block;
            animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
            from { 
                opacity: 0;
                transform: translateY(-20px);
            }
            to { 
                opacity: 1;
                transform: translateY(0);
            }
        }

        .form-title {
            font-size: 20px;
            margin-bottom: 20px;
            color: #333;
            padding-bottom: 10px;
            border-bottom: 2px solid #4CAF50;
        }

        .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }

        .form-group {
            display: flex;
            flex-direction: column;
        }

        .form-group.full-width {
            grid-column: 1 / -1;
        }

        .form-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 8px;
            font-weight: 500;
        }

        .required {
            color: #dc3545;
        }

        .form-input, .form-select, .form-textarea {
            padding: 10px 15px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 15px;
            transition: all 0.3s;
            background-color: white;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
            outline: none;
            border-color: #4CAF50;
            box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
        }

        .form-textarea {
            resize: vertical;
            min-height: 80px;
        }

        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 10px;
        }

        .checkbox {
            width: 20px;
            height: 20px;
            cursor: pointer;
        }

        .form-buttons {
            display: flex;
            gap: 15px;
            margin-top: 20px;
        }

        .btn-submit {
            background-color: #4CAF50;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s;
        }

        .btn-submit:hover {
            background-color: #45a049;
        }

        .btn-cancel {
            background-color: #e0e0e0;
            color: #333;
            padding: 12px 30px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s;
        }

        .btn-cancel:hover {
            background-color: #d0d0d0;
        }

        /* Table Section */
        .table-section {
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }

        .table-wrapper {
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        thead {
            background-color: #f8f9fa;
        }

        th {
            padding: 15px;
            text-align: right;
            font-size: 14px;
            font-weight: 600;
            color: #666;
            border-bottom: 2px solid #e0e0e0;
        }

        td {
            padding: 15px;
            border-bottom: 1px solid #f0f0f0;
            font-size: 14px;
            color: #333;
        }

        tbody tr {
            transition: background-color 0.2s;
        }

        tbody tr:hover {
            background-color: #f8f9fa;
        }

        .category-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            background-color: #9C27B0;
            color: white;
        }

        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
        }

        .status-badge.active {
            background-color: #d4f8d4;
            color: #2e7d2e;
        }

        .status-badge.inactive {
            background-color: #ffd4d4;
            color: #c62828;
        }

        .price-display {
            font-weight: 600;
            color: #2e7d2e;
        }

        .action-buttons {
            display: flex;
            gap: 10px;
        }

        .btn-edit, .btn-delete {
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            padding: 5px;
            transition: transform 0.2s;
        }

        .btn-edit:hover, .btn-delete:hover {
            transform: scale(1.2);
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #999;
        }

        .empty-state-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }

        /* Statistics Cards */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background-color: white;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: all 0.3s;
        }

        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .stat-card.blue {
            border-right: 4px solid #2196F3;
        }

        .stat-card.green {
            border-right: 4px solid #4CAF50;
        }

        .stat-card.orange {
            border-right: 4px solid #FF9800;
        }

        .stat-card.purple {
            border-right: 4px solid #9C27B0;
        }

        .stat-icon {
            font-size: 40px;
            margin-bottom: 10px;
        }

        .stat-label {
            font-size: 14px;
            color: #999;
            margin-bottom: 5px;
        }

        .stat-value {
            font-size: 32px;
            font-weight: bold;
        }

        .stat-card.blue .stat-value { color: #2196F3; }
        .stat-card.green .stat-value { color: #4CAF50; }
        .stat-card.orange .stat-value { color: #FF9800; }
        .stat-card.purple .stat-value { color: #9C27B0; }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="header-content">
            <h1 class="page-title">
                📦 ניהול מוצרים
            </h1>
            <button class="btn-primary" onclick="toggleForm()">
                <span>➕</span>
                <span>הוסף מוצר חדש</span>
            </button>
        </div>
    </header>

    <div class="container">
        <!-- Form Section -->
        <div class="form-section" id="productForm">
            <h2 class="form-title">➕ מוצר חדש</h2>
            <form>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">שם המוצר <span class="required">*</span></label>
                        <input type="text" class="form-input" placeholder="לדוגמה: המבורגר" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">קטגוריה <span class="required">*</span></label>
                        <select class="form-select" required>
                            <option value="">בחר קטגוריה</option>
                            <option value="ארוחות">ארוחות</option>
                            <option value="משקאות">משקאות</option>
                            <option value="קינוחים">קינוחים</option>
                            <option value="תוספות">תוספות</option>
                            <option value="סלטים">סלטים</option>
                            <option value="מנות ראשונות">מנות ראשונות</option>
                            <option value="מבצעים">מבצעים</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">מחיר בסיס <span class="required">*</span></label>
                        <input type="number" class="form-input" placeholder="0.00" step="0.01" min="0" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">מחיר מכירה</label>
                        <input type="number" class="form-input" placeholder="אופציונלי" step="0.01" min="0">
                    </div>
                    
                    <div class="form-group full-width">
                        <label class="form-label">תיאור המוצר</label>
                        <textarea class="form-textarea" placeholder="תיאור קצר של המוצר..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">קישור לתמונה</label>
                        <input type="url" class="form-input" placeholder="https://...">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">סטטוס</label>
                        <div class="checkbox-group">
                            <input type="checkbox" class="checkbox" id="activeStatus" checked>
                            <label for="activeStatus">מוצר פעיל</label>
                        </div>
                    </div>
                </div>
                
                <div class="form-buttons">
                    <button type="submit" class="btn-submit">💾 שמור מוצר</button>
                    <button type="button" class="btn-cancel" onclick="toggleForm()">ביטול</button>
                </div>
            </form>
        </div>

        <!-- Statistics Cards -->
        <div class="stats-grid">
            <div class="stat-card blue">
                <div class="stat-icon">📦</div>
                <div class="stat-label">סה״כ מוצרים</div>
                <div class="stat-value">24</div>
            </div>
            
            <div class="stat-card green">
                <div class="stat-icon">✅</div>
                <div class="stat-label">מוצרים פעילים</div>
                <div class="stat-value">22</div>
            </div>
            
            <div class="stat-card orange">
                <div class="stat-icon">⏸️</div>
                <div class="stat-label">מוצרים לא פעילים</div>
                <div class="stat-value">2</div>
            </div>
            
            <div class="stat-card purple">
                <div class="stat-icon">📋</div>
                <div class="stat-label">קטגוריות</div>
                <div class="stat-value">7</div>
            </div>
        </div>

        <!-- Table Section -->
        <div class="table-section">
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>שם המוצר</th>
                            <th>קטגוריה</th>
                            <th>מחיר בסיס</th>
                            <th>מחיר מכירה</th>
                            <th>תיאור</th>
                            <th>סטטוס</th>
                            <th>פעולות</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>המבורגר קלאסי</strong></td>
                            <td><span class="category-badge">ארוחות</span></td>
                            <td>₪45.00</td>
                            <td class="price-display">₪42.90</td>
                            <td>המבורגר 220 גרם עם חסה, עגבנייה ובצל</td>
                            <td><span class="status-badge active">פעיל</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-edit" title="ערוך">✏️</button>
                                    <button class="btn-delete" title="מחק">🗑️</button>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td><strong>קולה זירו</strong></td>
                            <td><span class="category-badge">משקאות</span></td>
                            <td>₪12.00</td>
                            <td>-</td>
                            <td>פחית 330 מ״ל</td>
                            <td><span class="status-badge active">פעיל</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-edit" title="ערוך">✏️</button>
                                    <button class="btn-delete" title="מחק">🗑️</button>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td><strong>סלט קיסר</strong></td>
                            <td><span class="category-badge">סלטים</span></td>
                            <td>₪38.00</td>
                            <td class="price-display">₪35.00</td>
                            <td>חסה רומית, קרוטונים, פרמז׳ן ורוטב קיסר</td>
                            <td><span class="status-badge active">פעיל</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-edit" title="ערוך">✏️</button>
                                    <button class="btn-delete" title="מחק">🗑️</button>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td><strong>טירמיסו</strong></td>
                            <td><span class="category-badge">קינוחים</span></td>
                            <td>₪28.00</td>
                            <td>-</td>
                            <td>עוגת טירמיסו איטלקית מסורתית</td>
                            <td><span class="status-badge inactive">לא פעיל</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-edit" title="ערוך">✏️</button>
                                    <button class="btn-delete" title="מחק">🗑️</button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
        function toggleForm() {
            const form = document.getElementById('productForm');
            form.classList.toggle('active');
        }

        // Demo interactions
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                toggleForm();
                document.querySelector('.form-title').textContent = '✏️ עריכת מוצר';
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                if(confirm('האם אתה בטוח שברצונך למחוק את המוצר?')) {
                    alert('המוצר נמחק בהצלחה!');
                }
            });
        });

        document.querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault();
            alert('המוצר נשמר בהצלחה!');
            toggleForm();
        });
    </script>
</body>
</html>
