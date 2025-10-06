'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Search, Eye, Edit, Trash2, Plus, X } from 'lucide-react';

/* -------------------- Types -------------------- */
interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
}

interface ProductLite {
  id: string;
  name: string;
  sku?: string | null;
}

interface OrderLine {
  id: string;
  order_id: string;
  product_id: string | null;
  description?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  // אחרי נרמול: תמיד null או אובייקט בודד
  products: ProductLite | null;
}

interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  total_amount: number;
  status: string;
  payment_method: string;
  payment_terms: string;
  notes?: string | null;
  created_at: string;
  customers?: Customer | null;
}

/* --------------- Normalizers & helpers --------------- */
// Supabase עשוי להחזיר products כמערך; כאן נוודא שהקליינט יקבל אובייקט יחיד או null.
function normalizeOrderLines(lines: unknown): OrderLine[] {
  const arr = Array.isArray(lines) ? lines : [];
  return arr.map((ln: any): OrderLine => {
    const rawProd = Array.isArray(ln?.products) ? (ln.products[0] ?? null) : (ln?.products ?? null);
    const prod: ProductLite | null = rawProd
      ? {
          id: String(rawProd.id),
          name: String(rawProd.name),
          sku: rawProd.sku ?? null,
        }
      : null;

    const qty = Number(ln?.quantity ?? 0);
    const unit = Number(ln?.unit_price ?? 0);
    const total = Number(ln?.total_price ?? qty * unit);

    return {
      id: String(ln.id),
      order_id: String(ln.order_id),
      product_id: ln.product_id ?? null,
      description: ln.description ?? null,
      quantity: qty,
      unit_price: unit,
      total_price: total,
      products: prod,
    };
  });
}

function getProductDisplayName(ln: OrderLine): string {
  if (!ln.products) return '—';
  return ln.products.name || ln.products.sku || '—';
}

function getStatusBadgeColor(status: string) {
  switch (status) {
    case 'DRAFT': return { bg: '#fef3c7', text: '#92400e', label: 'טיוטה' };
    case 'CONFIRMED': return { bg: '#dbeafe', text: '#1e40af', label: 'אושרה' };
    case 'IN_PROGRESS': return { bg: '#e0e7ff', text: '#4338ca', label: 'בתהליך' };
    case 'COMPLETED': return { bg: '#d1fae5', text: '#065f46', label: 'הושלמה' };
    case 'CANCELLED': return { bg: '#fee2e2', text: '#991b1b', label: 'בוטלה' };
    default: return { bg: '#f3f4f6', text: '#374151', label: status };
  }
}

function getPaymentMethodLabel(method: string) {
  switch (method) {
    case 'cash': return 'מזומן';
    case 'credit': return 'אשראי';
    case 'bank_transfer': return 'העברה בנקאית';
    case 'check': return 'שיק';
    default: return method;
  }
}

/* -------------------- Page -------------------- */
export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      await loadOrders();
    } catch (error) {
      console.error('Auth check error:', error);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (
            id,
            name,
            phone,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data as Order[]) || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      alert('שגיאה בטעינת הזמנות');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את הזמנה ${orderNumber}?`)) return;

    try {
      const { error: linesError } = await supabase
        .from('order_lines')
        .delete()
        .eq('order_id', orderId);
      if (linesError) throw linesError;

      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
      if (orderError) throw orderError;

      setOrders(prev => prev.filter(o => o.id !== orderId));
      alert('ההזמנה נמחקה בהצלחה');
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('שגיאה במחיקת ההזמנה');
    }
  };

// צפייה בהזמנה (Modal)
const handleViewOrder = useCallback(async (orderId: string) => {
  try {
    setViewLoading(true);
    setIsModalOpen(true);
    setSelectedOrder(null);
    setOrderLines([]);

    // הזמנה + לקוח
    const { data: orderData, error: orderErr } = await supabase
      .from('orders')
      .select(`
        *,
        customers ( id, name, phone, email )
      `)
      .eq('id', orderId)
      .single();

    if (orderErr) throw orderErr;
    setSelectedOrder(orderData as Order);

    // שורות הזמנה + מוצר (בלי sku)
    const { data: linesData, error: linesErr } = await supabase
      .from('order_lines')
      .select(`
        *,
        products ( id, name )
      `)
      .eq('order_id', orderId)
      .order('id', { ascending: true });

    if (linesErr) throw linesErr;

    // טיפול ישיר בנתונים
    const normalizedLines: OrderLine[] = (linesData || []).map((line: any) => ({
      id: line.id,
      order_id: line.order_id,
      product_id: line.product_id,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unit_price,
      total_price: line.total_price,
      products: line.products ? {
        id: line.products.id,
        name: line.products.name,
        sku: null
      } : null
    }));

    setOrderLines(normalizedLines);
  } catch (error) {
    console.error('Error loading order details:', error);
    alert('שגיאה בטעינת פרטי ההזמנה');
    setIsModalOpen(false);
  } finally {
    setViewLoading(false);
  }
}, []);
  // פילטר לפי תאריך
  const filterOrdersByDate = (src: Order[]) => {
    if (dateFilter === 'ALL') return src;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return src.filter(order => {
      const orderDate = new Date(order.created_at);
      const orderDay = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
      switch (dateFilter) {
        case 'TODAY':
          return orderDay.getTime() === today.getTime();
        case 'WEEK': {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return orderDay >= weekAgo;
        }
        case 'MONTH': {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return orderDay >= monthAgo;
        }
        default:
          return true;
      }
    });
  };

  const filteredOrders = filterOrdersByDate(
    orders.filter(order => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        order.order_number.toLowerCase().includes(q) ||
        (order.customers?.name || '').toLowerCase().includes(q) ||
        (order.customers?.phone || '').includes(searchQuery);
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
  );

  const totalRevenue = filteredOrders
    .filter(o => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  if (loading) {
    return (
      <div style={loadingBox}>טוען הזמנות...</div>
    );
  }

  return (
    <div style={pageWrap}>
      {/* Header */}
      <div style={headerRow}>
        <div>
          <h1 style={{ margin: 0, marginBottom: 10, color: '#333' }}>ניהול הזמנות</h1>
          <div style={{ display: 'flex', gap: 30, fontSize: 14, color: '#666' }}>
            <span>סה״כ הזמנות: <strong>{filteredOrders.length}</strong></span>
            <span>סה״כ הכנסות: <strong style={{ color: '#4CAF50' }}>₪{totalRevenue.toFixed(2)}</strong></span>
          </div>
        </div>
        <button onClick={() => router.push('/orders/create')} style={btnCreate}>
          <Plus size={20} />
          הזמנה חדשה
        </button>
      </div>

      {/* Filters */}
      <div style={filtersCard}>
        <div style={filtersGrid}>
          <div style={{ position: 'relative' }}>
            <Search size={20} style={searchIcon} />
            <input
              type="text"
              placeholder="      חפש לפי מספר הזמנה, לקוח או טלפון..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={searchInput}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#4CAF50')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={selectBox}
          >
            <option value="ALL">כל הסטטוסים</option>
            <option value="DRAFT">טיוטה</option>
            <option value="CONFIRMED">אושרה</option>
            <option value="IN_PROGRESS">בתהליך</option>
            <option value="COMPLETED">הושלמה</option>
            <option value="CANCELLED">בוטלה</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            style={selectBox}
          >
            <option value="ALL">כל התאריכים</option>
            <option value="TODAY">היום</option>
            <option value="WEEK">שבוע אחרון</option>
            <option value="MONTH">חודש אחרון</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {filteredOrders.length === 0 ? (
        <div style={emptyCard}>
          <p style={{ fontSize: 18, marginBottom: 10 }}>לא נמצאו הזמנות</p>
          <p style={{ fontSize: 14 }}>נסה לשנות את הפילטרים או ליצור הזמנה חדשה</p>
        </div>
      ) : (
        <div style={tableWrap}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={th}>מספר הזמנה</th>
                  <th style={th}>לקוח</th>
                  <th style={th}>תאריך</th>
                  <th style={th}>סכום</th>
                  <th style={th}>תשלום</th>
                  <th style={th}>סטטוס</th>
                  <th style={{ ...th, textAlign: 'center' }}>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  const s = getStatusBadgeColor(order.status);
                  return (
                    <tr key={order.id} style={trHover}>
                      <td style={td}>{order.order_number}</td>
                      <td style={td}>
                        <div>
                          <div style={{ fontWeight: 500, marginBottom: 4 }}>
                            {order.customers?.name || 'לא ידוע'}
                          </div>
                          <div style={{ fontSize: 13, color: '#666' }}>
                            {order.customers?.phone}
                          </div>
                        </div>
                      </td>
                      <td style={{ ...td, color: '#666' }}>
                        {new Date(order.created_at).toLocaleDateString('he-IL')}
                      </td>
                      <td style={{ ...td, color: '#4CAF50', fontWeight: 600 }}>
                        ₪{(order.total_amount || 0).toFixed(2)}
                      </td>
                      <td style={td}>{getPaymentMethodLabel(order.payment_method)}</td>
                      <td style={td}>
                        <span style={{ padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: 500, background: s.bg, color: s.text }}>
                          {s.label}
                        </span>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <button
                          onClick={() => handleViewOrder(order.id)}
                          style={btnBlue}
                          title="צפייה"
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1976D2')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2196F3')}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id, order.order_number)}
                          style={btnRed}
                          title="מחיקה"
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#d32f2f')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f44336')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
          style={backdrop}
        >
          <div style={modal}>
            <div style={modalHeader}>
              <h2 style={{ margin: 0, fontSize: 18 }}>
                פרטי הזמנה {selectedOrder ? `#${selectedOrder.order_number}` : ''}
              </h2>
              <button onClick={() => setIsModalOpen(false)} aria-label="סגור" style={iconBtn}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 16, maxHeight: '65vh', overflowY: 'auto' }}>
              {viewLoading || !selectedOrder ? (
                <div style={{ textAlign: 'center', color: '#666' }}>טוען פרטים...</div>
              ) : (
                <>
                  {/* לקוח + פרטי הזמנה */}
                  <div style={twoCol}>
                    <div style={card}>
                      <div style={cardTitle}>פרטי הלקוח</div>
                      <div><strong>שם: </strong>{selectedOrder.customers?.name || '—'}</div>
                      <div><strong>טלפון: </strong>{selectedOrder.customers?.phone || '—'}</div>
                      <div><strong>אימייל: </strong>{selectedOrder.customers?.email || '—'}</div>
                    </div>
                    <div style={card}>
                      <div style={cardTitle}>פרטי הזמנה</div>
                      <div><strong>תאריך: </strong>{new Date(selectedOrder.created_at).toLocaleString('he-IL')}</div>
                      <div><strong>סטטוס: </strong>{getStatusBadgeColor(selectedOrder.status).label}</div>
                      <div><strong>תשלום: </strong>{getPaymentMethodLabel(selectedOrder.payment_method)}</div>
                      {selectedOrder.payment_terms && <div><strong>תנאי תשלום: </strong>{selectedOrder.payment_terms}</div>}
                      <div style={{ marginTop: 8, fontWeight: 700, color: '#065f46' }}>
                        סה״כ להזמנה: ₪{(selectedOrder.total_amount || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* שורות הזמנה */}
                  <div style={{ marginTop: 16 }}>
                    <div style={cardTitle}>שורות הזמנה</div>
                    {orderLines.length === 0 ? (
                      <div style={{ color: '#6b7280' }}>אין שורות להזמנה זו.</div>
                    ) : (
                      <div style={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: 10 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#f3f4f6' }}>
                              <th style={lineTh}>מוצר</th>
                              <th style={lineTh}>תיאור</th>
                              <th style={lineTh}>כמות</th>
                              <th style={lineTh}>מחיר יח'</th>
                              <th style={lineTh}>סה״כ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orderLines.map((ln) => (
                              <tr key={ln.id} style={{ borderTop: '1px solid #eee' }}>
                                <td style={lineTd}>{getProductDisplayName(ln)}</td>
                                <td style={lineTd}>{ln.description || '—'}</td>
                                <td style={lineTd}>{ln.quantity}</td>
                                <td style={lineTd}>₪{Number(ln.unit_price || 0).toFixed(2)}</td>
                                <td style={{ ...lineTd, fontWeight: 600 }}>₪{Number(ln.total_price || 0).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* הערות */}
                  {!!selectedOrder.notes && (
                    <div style={{ marginTop: 16, background: '#fff7ed', padding: 12, borderRadius: 10, border: '1px solid #fed7aa', color: '#7c2d12' }}>
                      <strong>הערות:</strong> {selectedOrder.notes}
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------- Styles -------------------- */
const pageWrap: React.CSSProperties = { padding: 20, maxWidth: 1400, margin: '0 auto', fontFamily: 'Arial, sans-serif', direction: 'rtl' };
const headerRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, flexWrap: 'wrap', gap: 20 };

const btnCreate: React.CSSProperties = { padding: '12px 24px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 };

const filtersCard: React.CSSProperties = { background: '#fff', padding: 20, borderRadius: 12, marginBottom: 20, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' };
const filtersGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 15 };
const searchIcon: React.CSSProperties = { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#999' };
const searchInput: React.CSSProperties = { width: '85%', padding: '12px 12px 12px 45px', fontSize: 14, borderRadius: 8, border: '2px solid #e0e0e0', outline: 'none', transition: 'border-color 0.3s' };
const selectBox: React.CSSProperties = { padding: 12, fontSize: 14, borderRadius: 8, border: '2px solid #e0e0e0', cursor: 'pointer', background: '#fff' };

const tableWrap: React.CSSProperties = { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' };
const th: React.CSSProperties = { padding: 15, textAlign: 'right', fontWeight: 600, color: '#333', borderBottom: '2px solid #e0e0e0' };
const td: React.CSSProperties = { padding: 15, textAlign: 'right', borderBottom: '1px solid #f0f0f0' };
const trHover: React.CSSProperties = { borderBottom: '1px solid #f0f0f0', transition: 'background-color 0.2s' };

const btnBlue: React.CSSProperties = { padding: 8, backgroundColor: '#2196F3', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', margin: '0 4px', transition: 'background-color 0.3s' };
const btnOrange: React.CSSProperties = { padding: 8, backgroundColor: '#FF9800', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', margin: '0 4px', transition: 'background-color 0.3s' };
const btnRed: React.CSSProperties = { padding: 8, backgroundColor: '#f44336', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', margin: '0 4px', transition: 'background-color 0.3s' };

const backdrop: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 16, zIndex: 1000, overflowY: 'auto' };
const modal: React.CSSProperties = { width: 'min(900px, 100%)', marginTop: 40, background: '#fff', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', overflow: 'hidden', direction: 'rtl' };
const modalHeader: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #eee', background: '#fafafa' };
const modalFooter: React.CSSProperties = { padding: '12px 16px', borderTop: '1px solid #eee', background: '#fafafa', display: 'flex', gap: 8, justifyContent: 'flex-end' };
const iconBtn: React.CSSProperties = { background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8 };

const twoCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 };
const card: React.CSSProperties = { background: '#f9fafb', borderRadius: 10, padding: 14, border: '1px solid #eef2f7' };
const cardTitle: React.CSSProperties = { fontWeight: 600, marginBottom: 8, color: '#374151' };

const lineTh: React.CSSProperties = { padding: 12, textAlign: 'right', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap' };
const lineTd: React.CSSProperties = { padding: 12, textAlign: 'right', color: '#111827', fontSize: 14 };

const btnLight: React.CSSProperties = { padding: '10px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 600 };
const btnWarn: React.CSSProperties = { padding: '10px 16px', borderRadius: 8, border: 'none', background: '#FF9800', color: '#fff', cursor: 'pointer', fontWeight: 600 };

const loadingBox: React.CSSProperties = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400, fontSize: 18, color: '#666' };
const emptyCard: React.CSSProperties = { background: '#fff', padding: '60px 20px', borderRadius: 12, textAlign: 'center', color: '#999' };
