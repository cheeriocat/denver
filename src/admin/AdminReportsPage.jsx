// src/admin/AdminReportsPage.jsx
// Sales & Analytics Reports:
// - Sold items grouped by product (units, size breakdown, revenue, delivered profit)
// - Total revenue & Delivered profit by date range (Profit = sum of (unitPrice - unitCost) x qty over delivered orders)
// - Interactive SVG sales performance timeline chart (Revenue / Delivered Profit / Orders)
// - Full CSV export of orders within the selected date range.

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  BarChart2,
  Calendar,
  Download,
  TrendingUp,
  DollarSign,
  Package,
  CheckCircle,
  RefreshCw,
  Percent,
} from 'lucide-react';

/* ── Helpers ─────────────────────────────────────────────────────────── */
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
    year: 'numeric',
  });
}

function toISODate(d) {
  const year  = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day   = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toDateObj(ts) {
  if (!ts) return null;
  return ts.toDate ? ts.toDate() : new Date(ts);
}

export default function AdminReportsPage() {
  const [preset, setPreset] = useState('this_month'); // 'this_month' | 'today' | 'last_7_days' | 'last_30_days' | 'this_year' | 'custom'

  const now = new Date();
  const [customFrom, setCustomFrom] = useState(() => toISODate(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [customTo, setCustomTo]     = useState(() => toISODate(now));

  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [chartMetric, setChartMetric] = useState('revenue'); // 'revenue' | 'profit' | 'orders'
  const [hoveredPoint, setHoveredPoint] = useState(null);

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
    if (preset === 'this_year') {
      const start = new Date(current.getFullYear(), 0, 1, 0, 0, 0, 0);
      return { from: start, to: endOfToday, label: 'This Year' };
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

  // ── Fetch Orders for Date Range ───────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const startTs = Timestamp.fromDate(range.from);
      const endTs   = Timestamp.fromDate(range.to);

      const q = query(
        collection(db, 'orders'),
        where('createdAt', '>=', startTs),
        where('createdAt', '<=', endTs),
        orderBy('createdAt', 'desc'),
        limit(1000)
      );

      const snap = await getDocs(q);
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(fetched);
    } catch (err) {
      console.error('Failed to load orders for reports:', err);
      setError('Unable to fetch orders for the selected period.');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Compute Analytics & Product Breakdown ─────────────────────────────────
  const analytics = useMemo(() => {
    let totalRevenue      = 0;
    let deliveredRevenue  = 0;
    let deliveredProfit   = 0; // Explicitly: sum of (unitPrice - unitCost) * qty over delivered orders
    let totalItemsSold    = 0;
    let deliveredItemsSold = 0;
    let deliveredCount    = 0;
    let cancelledCount    = 0;

    const productMap = {};

    for (const order of orders) {
      if (order.status === 'cancelled') {
        cancelledCount++;
        continue;
      }

      const isDelivered = order.status === 'delivered';
      const orderTotal = Number(order.total) || 0;
      totalRevenue += orderTotal;

      if (isDelivered) {
        deliveredCount++;
        deliveredRevenue += orderTotal;
      }

      const items = Array.isArray(order.items) ? order.items : [];
      for (const item of items) {
        const qty       = Number(item.qty) || 1;
        const unitPrice = Number(item.unitPrice) || 0;
        const unitCost  = Number(item.unitCost)  || 0;

        totalItemsSold += qty;
        if (isDelivered) {
          deliveredItemsSold += qty;
          deliveredProfit += (unitPrice - unitCost) * qty;
        }

        // Aggregate by product
        const key = item.productId || item.name || 'unknown';
        if (!productMap[key]) {
          productMap[key] = {
            id: key,
            name: item.name || 'Unnamed Product',
            image: item.image || '/tshirt_black.jpg',
            unitsSold: 0,
            revenue: 0,
            deliveredUnits: 0,
            deliveredProfit: 0,
            sizes: {},
          };
        }

        productMap[key].unitsSold += qty;
        productMap[key].revenue   += unitPrice * qty;

        if (item.size) {
          productMap[key].sizes[item.size] = (productMap[key].sizes[item.size] || 0) + qty;
        }

        if (isDelivered) {
          productMap[key].deliveredUnits  += qty;
          productMap[key].deliveredProfit += (unitPrice - unitCost) * qty;
        }
      }
    }

    const activeOrders = orders.length - cancelledCount;
    const profitMargin = deliveredRevenue > 0
      ? Math.round((deliveredProfit / deliveredRevenue) * 100)
      : 0;

    const productList = Object.values(productMap).sort((a, b) => b.unitsSold - a.unitsSold);

    return {
      totalRevenue,
      deliveredRevenue,
      deliveredProfit,
      totalItemsSold,
      deliveredItemsSold,
      totalOrders: orders.length,
      activeOrders,
      deliveredCount,
      cancelledCount,
      profitMargin,
      productList,
    };
  }, [orders]);

  // ── Generate Daily Timeline Buckets for Chart ─────────────────────────────
  const chartData = useMemo(() => {
    if (orders.length === 0) return [];

    // Map day string "YYYY-MM-DD" -> stats
    const dayMap = {};

    // Build continuous date list between range.from and range.to (up to 60 days)
    const cur = new Date(range.from);
    const end = new Date(range.to);
    const dayDiff = Math.max(1, Math.round((end - cur) / (1000 * 60 * 60 * 24)));

    if (dayDiff <= 60) {
      while (cur <= end) {
        const key = toISODate(cur);
        const dayLabel = cur.toLocaleDateString('en-LK', { day: 'numeric', month: 'short' });
        dayMap[key] = { date: key, label: dayLabel, revenue: 0, profit: 0, orders: 0 };
        cur.setDate(cur.getDate() + 1);
      }
    }

    for (const order of orders) {
      if (order.status === 'cancelled') continue;
      const d = toDateObj(order.createdAt);
      if (!d) continue;

      const key = toISODate(d);
      if (!dayMap[key]) {
        const dayLabel = d.toLocaleDateString('en-LK', { day: 'numeric', month: 'short' });
        dayMap[key] = { date: key, label: dayLabel, revenue: 0, profit: 0, orders: 0 };
      }

      dayMap[key].revenue += (Number(order.total) || 0);
      dayMap[key].orders  += 1;

      if (order.status === 'delivered') {
        const items = Array.isArray(order.items) ? order.items : [];
        for (const item of items) {
          const qty       = Number(item.qty) || 1;
          const unitPrice = Number(item.unitPrice) || 0;
          const unitCost  = Number(item.unitCost)  || 0;
          dayMap[key].profit += (unitPrice - unitCost) * qty;
        }
      }
    }

    return Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [orders, range]);

  // Max value for chart scale
  const maxChartVal = useMemo(() => {
    if (chartData.length === 0) return 1000;
    const vals = chartData.map(d => d[chartMetric]);
    return Math.max(...vals, 1);
  }, [chartData, chartMetric]);

  // ── CSV Export ────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (orders.length === 0) {
      alert('No orders to export for the selected date range.');
      return;
    }

    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Customer Phone',
      'Customer Email',
      'Address',
      'City',
      'Status',
      'Payment Method',
      'Payment Status',
      'Courier',
      'Tracking Number',
      'Subtotal (LKR)',
      'Shipping (LKR)',
      'Total (LKR)',
      'Delivered Profit (LKR)',
      'Items Purchased',
    ];

    const rows = orders.map(order => {
      const dateStr = formatDate(order.createdAt);
      const isDelivered = order.status === 'delivered';

      let profit = 0;
      if (isDelivered) {
        for (const item of (order.items || [])) {
          const up = Number(item.unitPrice) || 0;
          const uc = Number(item.unitCost)  || 0;
          const q  = Number(item.qty)       || 1;
          profit += (up - uc) * q;
        }
      }

      const itemsStr = (order.items || [])
        .map(i => `${i.name || 'Item'} (${i.size || 'STD'} x${i.qty || 1})`)
        .join('; ');

      const fields = [
        order.orderNumber || '',
        dateStr,
        order.customer?.name || '',
        order.customer?.phone || '',
        order.customer?.email || '',
        order.customer?.address || '',
        order.customer?.city || '',
        order.status || '',
        order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Bank Transfer',
        order.paymentStatus || '',
        order.courierName || '',
        order.trackingNumber || '',
        order.subtotal ?? 0,
        order.shipping ?? 0,
        order.total ?? 0,
        isDelivered ? Math.round(profit) : '—',
        itemsStr,
      ];

      return fields
        .map(val => {
          const str = String(val ?? '');
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    const cleanFrom = toISODate(range.from);
    const cleanTo   = toISODate(range.to);
    link.download = `denver-orders-${cleanFrom}-to-${cleanTo}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="adm-page">
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="adm-page-header">
        <div>
          <div className="adm-page-eyebrow">Analytics</div>
          <h1 className="adm-page-title">Sales & Profit Reports</h1>
        </div>

        <div className="adm-page-actions">
          <button
            className="adm-btn-secondary"
            onClick={fetchOrders}
            disabled={loading}
            title="Refresh analytics data"
          >
            <RefreshCw size={13} className={loading ? 'adm-spin' : ''} />
            Refresh
          </button>

          <button
            className="adm-btn-primary"
            onClick={handleExportCSV}
            disabled={loading || orders.length === 0}
            title="Download CSV report of orders"
          >
            <Download size={14} />
            Export Orders (CSV)
          </button>
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
            ['this_year',    'This Year'],
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
          <span>{range.label} &middot; {orders.length} orders analyzed</span>
        </div>
      </div>

      {error && (
        <div className="admin-error-banner" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* ── KPI Summary Cards ───────────────────────────────────── */}
      <div className="adm-stat-cards">
        {/* Total Revenue */}
        <div className="adm-stat-card highlight">
          <div className="adm-stat-card-eyebrow">
            <DollarSign size={13} />
            Gross Revenue
          </div>
          <div className="adm-stat-card-value" style={{ color: 'var(--adm-gold)' }}>
            {loading ? '…' : fmtRs(analytics.totalRevenue)}
          </div>
          <div className="adm-stat-card-sub">
            From {analytics.activeOrders} active orders in period
          </div>
        </div>

        {/* Delivered Profit */}
        <div className="adm-stat-card highlight">
          <div className="adm-stat-card-eyebrow">
            <TrendingUp size={13} />
            Delivered Net Profit
          </div>
          <div className="adm-stat-card-value" style={{ color: '#86efac' }}>
            {loading ? '…' : fmtRs(analytics.deliveredProfit)}
          </div>
          <div className="adm-stat-card-sub">
            {analytics.deliveredCount} delivered orders &middot; Margin: {analytics.profitMargin}%
          </div>
        </div>

        {/* Total Items Sold */}
        <div className="adm-stat-card">
          <div className="adm-stat-card-eyebrow">
            <Package size={13} />
            Garments Sold
          </div>
          <div className="adm-stat-card-value">
            {loading ? '…' : analytics.totalItemsSold}
          </div>
          <div className="adm-stat-card-sub">
            {analytics.deliveredItemsSold} in completed delivered orders
          </div>
        </div>

        {/* Delivered Fulfillment Rate */}
        <div className="adm-stat-card">
          <div className="adm-stat-card-eyebrow">
            <CheckCircle size={13} />
            Delivered Orders
          </div>
          <div className="adm-stat-card-value">
            {loading ? '…' : `${analytics.deliveredCount} / ${analytics.totalOrders}`}
          </div>
          <div className="adm-stat-card-sub">
            {analytics.cancelledCount} cancelled orders excluded
          </div>
        </div>
      </div>

      {/* ── Performance Chart ────────────────────────────────────── */}
      <div className="adm-dashboard-section" style={{ marginBottom: '32px' }}>
        <div className="adm-section-header">
          <div>
            <div className="adm-section-eyebrow">Timeline</div>
            <h2 className="adm-section-title">Sales Performance Timeline</h2>
            <p className="adm-section-desc">
              Daily trajectory of sales revenue, delivered profit, and order counts.
            </p>
          </div>

          <div className="adm-chart-metric-selector">
            {[
              ['revenue', 'Revenue (Rs.)'],
              ['profit',  'Delivered Profit (Rs.)'],
              ['orders',  'Orders Count'],
            ].map(([k, label]) => (
              <button
                key={k}
                className={`adm-chart-tab ${chartMetric === k ? 'active' : ''}`}
                onClick={() => setChartMetric(k)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="adm-loading-state">Generating timeline chart…</div>
        ) : chartData.length === 0 ? (
          <div className="adm-empty-box">
            No order activity recorded within {range.label}.
          </div>
        ) : (
          <div className="adm-chart-container">
            {/* Tooltip Overlay */}
            {hoveredPoint && (
              <div className="adm-chart-tooltip">
                <div className="adm-tooltip-date">{hoveredPoint.label} ({hoveredPoint.date})</div>
                <div className="adm-tooltip-row">
                  <span>Revenue:</span>
                  <strong>{fmtRs(hoveredPoint.revenue)}</strong>
                </div>
                <div className="adm-tooltip-row">
                  <span>Delivered Profit:</span>
                  <strong style={{ color: '#86efac' }}>{fmtRs(hoveredPoint.profit)}</strong>
                </div>
                <div className="adm-tooltip-row">
                  <span>Orders:</span>
                  <strong>{hoveredPoint.orders}</strong>
                </div>
              </div>
            )}

            {/* Custom SVG Bar Chart */}
            <div className="adm-svg-chart-wrap">
              <svg
                viewBox={`0 0 ${Math.max(chartData.length * 40, 500)} 200`}
                className="adm-svg-chart"
                preserveAspectRatio="none"
              >
                {/* Horizontal reference grid lines */}
                <line x1="0" y1="40" x2="100%" y2="40" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="0" y1="100" x2="100%" y2="100" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="0" y1="160" x2="100%" y2="160" stroke="rgba(255,255,255,0.06)" />

                {chartData.map((d, i) => {
                  const totalBars = chartData.length;
                  const totalWidth = Math.max(totalBars * 40, 500);
                  const barWidth = Math.min(24, Math.max(8, (totalWidth / totalBars) * 0.55));
                  const x = (i * (totalWidth / totalBars)) + ((totalWidth / totalBars) - barWidth) / 2;

                  const val = d[chartMetric] || 0;
                  const barHeight = maxChartVal > 0 ? (val / maxChartVal) * 140 : 0;
                  const y = 160 - barHeight;

                  let barColor = 'var(--adm-gold)';
                  if (chartMetric === 'profit') barColor = '#86efac';
                  if (chartMetric === 'orders') barColor = '#60a5fa';

                  const isHovered = hoveredPoint?.date === d.date;

                  return (
                    <g
                      key={d.date}
                      onMouseEnter={() => setHoveredPoint(d)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Bar Background Track */}
                      <rect
                        x={x}
                        y={20}
                        width={barWidth}
                        height={140}
                        fill="rgba(255,255,255,0.02)"
                        rx={2}
                      />
                      {/* Bar Fill */}
                      <rect
                        x={x}
                        y={Math.max(20, y)}
                        width={barWidth}
                        height={Math.max(barHeight, val > 0 ? 3 : 0)}
                        fill={isHovered ? '#fff' : barColor}
                        opacity={isHovered ? 1 : 0.85}
                        rx={2}
                        className="adm-chart-bar"
                      />
                      {/* X-axis date labels */}
                      {(totalBars <= 15 || i % Math.ceil(totalBars / 12) === 0) && (
                        <text
                          x={x + barWidth / 2}
                          y={180}
                          textAnchor="middle"
                          fill="var(--adm-muted)"
                          fontSize="9"
                          fontFamily="var(--adm-font)"
                        >
                          {d.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="adm-chart-footer-legend">
              <span className="adm-legend-item">
                <span className="adm-legend-dot" style={{ background: chartMetric === 'profit' ? '#86efac' : chartMetric === 'orders' ? '#60a5fa' : 'var(--adm-gold)' }} />
                Showing {chartMetric === 'profit' ? 'Delivered Net Profit' : chartMetric === 'orders' ? 'Orders Placed' : 'Gross Sales Revenue'}
              </span>
              <span style={{ color: 'var(--adm-muted)', fontSize: '11px' }}>
                Peak: {chartMetric === 'orders' ? `${maxChartVal} orders` : fmtRs(maxChartVal)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Sold Items by Product Table ──────────────────────────── */}
      <div className="adm-dashboard-section">
        <div className="adm-section-header">
          <div>
            <div className="adm-section-eyebrow">Item Breakdown</div>
            <h2 className="adm-section-title">
              Sold Items by Product ({analytics.productList.length})
            </h2>
            <p className="adm-section-desc">
              Comprehensive units sold, sizes, gross revenue, and delivered profit by SKU in {range.label}.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="adm-loading-state">Analyzing product sales…</div>
        ) : analytics.productList.length === 0 ? (
          <div className="adm-empty-box">
            No product sales recorded in this date range.
          </div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th style={{ width: '56px' }}>Image</th>
                  <th>Product</th>
                  <th style={{ textAlign: 'center' }}>Units Sold</th>
                  <th>Sizes Purchased</th>
                  <th style={{ textAlign: 'right' }}>Gross Revenue</th>
                  <th style={{ textAlign: 'right' }}>Delivered Units</th>
                  <th style={{ textAlign: 'right' }}>Delivered Profit</th>
                </tr>
              </thead>
              <tbody>
                {analytics.productList.map(p => (
                  <tr key={p.id}>
                    <td>
                      <img src={p.image} alt={p.name} className="adm-product-thumb" />
                    </td>
                    <td>
                      <div className="adm-product-name">{p.name}</div>
                      <div className="adm-product-desc">ID: {p.id.slice(0, 10)}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--adm-text)' }}>
                        {p.unitsSold}
                      </span>
                    </td>
                    <td>
                      <div className="adm-stock-sizes">
                        {Object.entries(p.sizes).map(([sz, qty]) => (
                          <span key={sz} className="adm-stock-tag">
                            {sz}: <strong>{qty}</strong>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--adm-gold)' }}>
                      {fmtRs(p.revenue)}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--adm-muted)' }}>
                      {p.deliveredUnits} / {p.unitsSold}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#86efac' }}>
                      {p.deliveredUnits > 0 ? fmtRs(p.deliveredProfit) : '—'}
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
