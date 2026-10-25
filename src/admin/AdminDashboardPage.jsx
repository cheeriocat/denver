// src/admin/AdminDashboardPage.jsx
// Executive dashboard: KPI cards (orders today & this month, revenue, profit, items sold),
// date range filter with Firestore limits (no unbounded collection scans),
// low-stock alerts table with size breakdown, and recent orders in range.

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEFAULT_SETTINGS } from '../hooks/useSettings';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Calendar,
  AlertTriangle,
  Package,
  Clock,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

/* ── Status badges helper ─────────────────────────────────────────────── */
const STATUS_LABELS = {
  pending:   'Pending',
  confirmed: 'Confirmed',
  packed:    'Packed',
  shipped:   'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_CSS = {
  pending:   'status-pending',
  confirmed: 'status-confirmed',
  packed:    'status-packed',
  shipped:   'status-shipped',
  delivered: 'status-delivered',
  cancelled: 'status-cancelled',
};

function fmtRs(n) {
  if (n == null || isNaN(n)) return 'Rs. 0';
  return `Rs. ${Math.round(Number(n)).toLocaleString('en-LK')}`;
}

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-LK', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toDateObj(ts) {
  if (!ts) return null;
  return ts.toDate ? ts.toDate() : new Date(ts);
}

function toISODate(d) {
  const year  = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day   = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AdminDashboardPage() {
  const [preset, setPreset] = useState('this_month'); // 'this_month' | 'today' | 'last_7_days' | 'last_30_days' | 'custom'
  
  // Custom date range state (defaults to start of month to today)
  const now = new Date();
  const [customFrom, setCustomFrom] = useState(() => toISODate(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [customTo, setCustomTo]     = useState(() => toISODate(now));

  // Orders data
  const [orders, setOrders]                     = useState([]);
  const [ordersLoading, setOrdersLoading]       = useState(true);
  const [ordersError, setOrdersError]           = useState('');
  
  // Persistent metrics for Today & This Month
  const [todayCount, setTodayCount]             = useState(0);
  const [monthCount, setMonthCount]             = useState(0);

  // Low stock products
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [lowStockLoading, setLowStockLoading]   = useState(true);
  const [stockThreshold, setStockThreshold]     = useState(DEFAULT_SETTINGS.lowStockThreshold);

  // ── Calculate Date Range ──────────────────────────────────────────────────
  const range = useMemo(() => {
    const current = new Date();
    const endOfToday = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 23, 59, 59, 999);

    if (preset === 'today') {
      const startOfToday = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 0, 0, 0, 0);
      return { from: startOfToday, to: endOfToday, label: 'Today' };
    }
    if (preset === 'last_7_days') {
      const start = new Date(current.getFullYear(), current.getMonth(), current.getDate() - 6, 0, 0, 0, 0);
      return { from: start, to: endOfToday, label: 'Last 7 Days' };
    }
    if (preset === 'last_30_days') {
      const start = new Date(current.getFullYear(), current.getMonth(), current.getDate() - 29, 0, 0, 0, 0);
      return { from: start, to: endOfToday, label: 'Last 30 Days' };
    }
    if (preset === 'custom') {
      const [fy, fm, fd] = customFrom.split('-').map(Number);
      const [ty, tm, td] = customTo.split('-').map(Number);
      const start = new Date(fy || current.getFullYear(), (fm ? fm - 1 : current.getMonth()), fd || 1, 0, 0, 0, 0);
      const end   = new Date(ty || current.getFullYear(), (tm ? tm - 1 : current.getMonth()), td || current.getDate(), 23, 59, 59, 999);
      return { from: start, to: end, label: `${customFrom} to ${customTo}` };
    }

    // Default: 'this_month'
    const startOfMonth = new Date(current.getFullYear(), current.getMonth(), 1, 0, 0, 0, 0);
    return { from: startOfMonth, to: endOfToday, label: 'This Month' };
  }, [preset, customFrom, customTo]);

  // ── 1. Fetch Orders for Selected Range (capped at limit 500) ──────────────
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError('');
    try {
      const startTs = Timestamp.fromDate(range.from);
      const endTs   = Timestamp.fromDate(range.to);

      const q = query(
        collection(db, 'orders'),
        where('createdAt', '>=', startTs),
        where('createdAt', '<=', endTs),
        orderBy('createdAt', 'desc'),
        limit(500)
      );

      const snap = await getDocs(q);
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(fetched);

      // If we queried 'this_month', we can immediately compute today and month counts
      const currentDate = new Date();
      const startOfToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0, 0);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1, 0, 0, 0, 0);

      if (preset === 'this_month') {
        setMonthCount(fetched.length);
        const tCount = fetched.filter(o => {
          const d = toDateObj(o.createdAt);
          return d && d >= startOfToday;
        }).length;
        setTodayCount(tCount);
      } else {
        // Query today and month counts separately with small limit if outside this_month
        const monthQuery = query(
          collection(db, 'orders'),
          where('createdAt', '>=', Timestamp.fromDate(startOfMonth)),
          orderBy('createdAt', 'desc'),
          limit(500)
        );
        getDocs(monthQuery).then(mSnap => {
          setMonthCount(mSnap.docs.length);
          const tCount = mSnap.docs.filter(d => {
            const date = toDateObj(d.data().createdAt);
            return date && date >= startOfToday;
          }).length;
          setTodayCount(tCount);
        }).catch(console.warn);
      }

    } catch (err) {
      console.error('Failed to load dashboard orders:', err);
      setOrdersError('Unable to load orders for this date range.');
    } finally {
      setOrdersLoading(false);
    }
  }, [range, preset]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── 2. Fetch Low Stock Products & Store Settings ──────────────────────────
  const fetchLowStock = useCallback(async () => {
    setLowStockLoading(true);
    try {
      // Get settings for lowStockThreshold
      let threshold = DEFAULT_SETTINGS.lowStockThreshold;
      const settingsSnap = await getDoc(doc(db, 'settings', 'store'));
      if (settingsSnap.exists()) {
        const s = settingsSnap.data();
        if (s.lowStockThreshold != null) {
          threshold = Number(s.lowStockThreshold) || 5;
        }
      }
      setStockThreshold(threshold);

      // Fetch products (limit 200)
      const prodSnap = await getDocs(query(collection(db, 'products'), limit(200)));
      const items = [];

      prodSnap.forEach(d => {
        const p = { id: d.id, ...d.data() };
        if (p.stock && typeof p.stock === 'object') {
          const entries = Object.entries(p.stock);
          const lowSizes = entries.filter(([, qty]) => Number(qty) <= threshold);
          const totalStock = entries.reduce((s, [, qty]) => s + (Number(qty) || 0), 0);

          if (lowSizes.length > 0 || totalStock <= threshold) {
            items.push({
              ...p,
              totalStock,
              lowSizes, // Array of [size, qty]
            });
          }
        }
      });

      // Sort: products with 0 stock on any size or lowest total stock first
      items.sort((a, b) => {
        const aHasZero = a.lowSizes.some(([, q]) => Number(q) <= 0);
        const bHasZero = b.lowSizes.some(([, q]) => Number(q) <= 0);
        if (aHasZero && !bHasZero) return -1;
        if (!aHasZero && bHasZero) return 1;
        return a.totalStock - b.totalStock;
      });

      setLowStockProducts(items);
    } catch (err) {
      console.error('Failed to load low stock products:', err);
    } finally {
      setLowStockLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLowStock();
  }, [fetchLowStock]);

  // ── 3. Metrics Aggregation for Selected Range ─────────────────────────────
  const metrics = useMemo(() => {
    let revenue       = 0;
    let itemsSold     = 0;
    let netProfit     = 0;
    let confirmedCount = 0;
    let pendingCount  = 0;
    let cancelledCount = 0;

    for (const order of orders) {
      if (order.status === 'cancelled') {
        cancelledCount++;
        continue;
      }
      if (order.status === 'pending') {
        pendingCount++;
      }

      // Non-cancelled revenue & items sold
      revenue += (Number(order.total) || 0);

      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          itemsSold += (Number(item.qty) || 1);
        }
      }

      // Profit only for confirmed, packed, shipped, or delivered orders
      const isConfirmed = ['confirmed', 'packed', 'shipped', 'delivered'].includes(order.status);
      if (isConfirmed) {
        confirmedCount++;
        if (Array.isArray(order.items)) {
          for (const item of order.items) {
            const unitPrice = Number(item.unitPrice) || 0;
            const unitCost  = Number(item.unitCost)  || 0;
            const qty       = Number(item.qty)       || 1;
            netProfit += (unitPrice - unitCost) * qty;
          }
        }
      }
    }

    const nonCancelledOrders = orders.length - cancelledCount;
    const aov = nonCancelledOrders > 0 ? Math.round(revenue / nonCancelledOrders) : 0;

    return {
      revenue,
      itemsSold,
      netProfit,
      totalOrders: orders.length,
      confirmedCount,
      pendingCount,
      cancelledCount,
      aov,
    };
  }, [orders]);

  return (
    <div className="adm-page">
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="adm-page-header">
        <div>
          <div className="adm-page-eyebrow">Overview</div>
          <h1 className="adm-page-title">Executive Dashboard</h1>
        </div>

        <div className="adm-page-actions">
          <button
            className="adm-btn-secondary"
            onClick={() => { fetchOrders(); fetchLowStock(); }}
            disabled={ordersLoading || lowStockLoading}
            title="Refresh dashboard data"
          >
            <RefreshCw size={13} className={ordersLoading ? 'adm-spin' : ''} />
            Refresh
          </button>
          <Link to="/admin/orders" className="adm-btn-primary">
            <ShoppingBag size={13} />
            View Orders
          </Link>
        </div>
      </div>

      {/* ── Date Range Controls ─────────────────────────────────── */}
      <div className="adm-date-bar">
        <div className="adm-date-presets">
          {[
            ['this_month',   'This Month'],
            ['today',        'Today'],
            ['last_7_days',  'Last 7 Days'],
            ['last_30_days', 'Last 30 Days'],
            ['custom',       'Custom Range'],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`adm-preset-btn ${preset === key ? 'active' : ''}`}
              onClick={() => setPreset(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="adm-custom-range">
            <div className="adm-date-input-group">
              <label>From:</label>
              <input
                type="date"
                className="adm-date-input"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
              />
            </div>
            <div className="adm-date-input-group">
              <label>To:</label>
              <input
                type="date"
                className="adm-date-input"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="adm-range-label">
          <Calendar size={13} />
          <span>{range.label} &middot; Max 500 records query</span>
        </div>
      </div>

      {ordersError && (
        <div className="admin-error-banner" style={{ marginBottom: '20px' }}>
          {ordersError}
        </div>
      )}

      {/* ── KPI Cards ───────────────────────────────────────────── */}
      <div className="adm-stat-cards">
        {/* Orders Today */}
        <div className="adm-stat-card">
          <div className="adm-stat-card-eyebrow">
            <Clock size={13} />
            Orders Today
          </div>
          <div className="adm-stat-card-value">{todayCount}</div>
          <div className="adm-stat-card-sub">Placed since midnight</div>
        </div>

        {/* Orders This Month */}
        <div className="adm-stat-card">
          <div className="adm-stat-card-eyebrow">
            <Calendar size={13} />
            Orders This Month
          </div>
          <div className="adm-stat-card-value">{monthCount}</div>
          <div className="adm-stat-card-sub">Total month volume</div>
        </div>

        {/* Revenue (in selected range) */}
        <div className="adm-stat-card highlight">
          <div className="adm-stat-card-eyebrow">
            <DollarSign size={13} />
            Revenue ({range.label})
          </div>
          <div className="adm-stat-card-value" style={{ color: 'var(--adm-gold)' }}>
            {ordersLoading ? '…' : fmtRs(metrics.revenue)}
          </div>
          <div className="adm-stat-card-sub">
            {metrics.totalOrders - metrics.cancelledCount} active orders &middot; AOV {fmtRs(metrics.aov)}
          </div>
        </div>

        {/* Net Profit (in selected range) */}
        <div className="adm-stat-card highlight">
          <div className="adm-stat-card-eyebrow">
            <TrendingUp size={13} />
            Est. Net Profit
          </div>
          <div className="adm-stat-card-value" style={{ color: '#86efac' }}>
            {ordersLoading ? '…' : fmtRs(metrics.netProfit)}
          </div>
          <div className="adm-stat-card-sub">
            From {metrics.confirmedCount} confirmed orders
          </div>
        </div>

        {/* Items Sold (in selected range) */}
        <div className="adm-stat-card">
          <div className="adm-stat-card-eyebrow">
            <Package size={13} />
            Items Sold
          </div>
          <div className="adm-stat-card-value">
            {ordersLoading ? '…' : metrics.itemsSold}
          </div>
          <div className="adm-stat-card-sub">Total garments dispatched / ordered</div>
        </div>
      </div>

      {/* ── Low Stock Alerts Section ────────────────────────────── */}
      <div className="adm-dashboard-section" style={{ marginTop: '36px' }}>
        <div className="adm-section-header">
          <div>
            <div className="adm-section-eyebrow" style={{ color: '#f87171' }}>
              <AlertTriangle size={12} style={{ display: 'inline', marginRight: '5px', verticalAlign: '-1px' }} />
              Inventory Alert
            </div>
            <h2 className="adm-section-title">
              Low Stock Products ({lowStockProducts.length})
            </h2>
            <p className="adm-section-desc">
              Products with size inventory at or below threshold ({stockThreshold} units). Configure threshold in{' '}
              <Link to="/admin/settings" style={{ color: 'var(--adm-gold)', textDecoration: 'underline' }}>
                Store Settings
              </Link>.
            </p>
          </div>
          <Link to="/admin/products" className="adm-btn-secondary-sm">
            Manage All Products
            <ArrowRight size={12} />
          </Link>
        </div>

        {lowStockLoading ? (
          <div className="adm-loading-state">Checking inventory levels…</div>
        ) : lowStockProducts.length === 0 ? (
          <div className="adm-empty-box">
            <div style={{ color: '#86efac', marginBottom: '4px' }}>✓ All inventory levels healthy</div>
            <div style={{ color: 'var(--adm-muted)', fontSize: '12px' }}>
              No products are currently at or below the {stockThreshold}-unit threshold.
            </div>
          </div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th style={{ width: '56px' }}>Image</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Total Stock</th>
                  <th>Low / Depleted Sizes</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map(p => {
                  const imageSrc = (p.images && p.images.length > 0)
                    ? p.images[0]
                    : (p.image || '/tshirt_black.jpg');
                  const hasZeroStock = p.lowSizes.some(([, q]) => Number(q) <= 0);

                  return (
                    <tr key={p.id}>
                      <td>
                        <img src={imageSrc} alt={p.name} className="adm-product-thumb" />
                      </td>
                      <td>
                        <div className="adm-product-name">{p.name}</div>
                        <div className="adm-product-desc">Rs. {p.price?.toLocaleString('en-LK')}</div>
                      </td>
                      <td>
                        <span className="adm-category-badge">{p.category}</span>
                      </td>
                      <td>
                        <span className={`adm-stock ${p.totalStock === 0 ? 'adm-stock-zero' : ''}`}>
                          {p.totalStock} units
                        </span>
                      </td>
                      <td>
                        <div className="adm-stock-sizes">
                          {p.lowSizes.map(([sz, qty]) => {
                            const isZero = Number(qty) <= 0;
                            return (
                              <span
                                key={sz}
                                className={`adm-stock-tag ${isZero ? 'adm-tag-danger' : 'adm-tag-warning'}`}
                                title={isZero ? 'Out of stock' : `Low: ${qty} left`}
                              >
                                {sz}: {qty} {isZero ? '(Out)' : ''}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to="/admin/products"
                          className="adm-btn-sm"
                          style={{ textDecoration: 'none' }}
                        >
                          Restock
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Recent Orders in Selected Range ──────────────────────── */}
      <div className="adm-dashboard-section" style={{ marginTop: '40px' }}>
        <div className="adm-section-header">
          <div>
            <div className="adm-section-eyebrow">Activity</div>
            <h2 className="adm-section-title">
              Orders in Period ({orders.length})
            </h2>
            <p className="adm-section-desc">
              Recent orders within {range.label}. Click any order to open in Orders Manager.
            </p>
          </div>
          <Link to="/admin/orders" className="adm-btn-secondary-sm">
            View All in Orders Manager
            <ArrowRight size={12} />
          </Link>
        </div>

        {ordersLoading ? (
          <div className="adm-loading-state">Loading period orders…</div>
        ) : orders.length === 0 ? (
          <div className="adm-empty-box">
            <div style={{ color: 'var(--adm-muted)', fontSize: '13px' }}>
              No orders found for {range.label}.
            </div>
          </div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 15).map(order => (
                  <tr key={order.id}>
                    <td>
                      <Link
                        to="/admin/orders"
                        className="adm-order-num"
                        style={{ textDecoration: 'none', color: 'var(--adm-gold)', fontWeight: '600' }}
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{order.customer?.name || 'Guest'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--adm-muted)' }}>
                        {order.customer?.phone || ''}
                      </div>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--adm-muted)' }}>
                      {formatDate(order.createdAt)}
                    </td>
                    <td>
                      {order.items?.length || 0} item{(order.items?.length !== 1) ? 's' : ''}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {fmtRs(order.total)}
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--adm-muted)' }}>
                        {order.paymentMethod === 'cod' ? 'COD' : 'Bank Transfer'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${STATUS_CSS[order.status] || ''}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
