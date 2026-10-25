// src/admin/orders/AdminOrdersPage.jsx
// Orders manager: real-time list, status/date filters, text search,
// and the OrderDetailPanel slide-over for status updates.

import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Search, Filter, ChevronRight } from 'lucide-react';
import OrderDetailPanel from './OrderDetailPanel';

/* ── Constants ───────────────────────────────────────────────────────── */
const ALL_STATUSES = ['', 'pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];

const STATUS_LABELS = {
  '':          'All statuses',
  pending:     'Pending',
  confirmed:   'Confirmed',
  packed:      'Packed',
  shipped:     'Shipped',
  delivered:   'Delivered',
  cancelled:   'Cancelled',
};

const STATUS_CSS = {
  pending:   'status-pending',
  confirmed: 'status-confirmed',
  packed:    'status-packed',
  shipped:   'status-shipped',
  delivered: 'status-delivered',
  cancelled: 'status-cancelled',
};

/* ── Helpers ─────────────────────────────────────────────────────────── */
function fmtRs(n) {
  return n != null ? `Rs. ${Number(n).toLocaleString('en-LK')}` : '-';
}

function formatDate(ts) {
  if (!ts) return '-';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-LK', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function toDateObj(ts) {
  if (!ts) return null;
  return ts.toDate ? ts.toDate() : new Date(ts);
}

/* ── Component ───────────────────────────────────────────────────────── */
export default function AdminOrdersPage() {
  const [orders,        setOrders]        = useState([]);
  const [loading,       setLoading]       = useState(true);

  // Filters
  const [statusFilter,  setStatusFilter]  = useState('');
  const [dateFrom,      setDateFrom]      = useState('');
  const [dateTo,        setDateTo]        = useState('');
  const [search,        setSearch]        = useState('');

  // Detail panel
  const [selected,      setSelected]      = useState(null);

  /* ── Real-time snapshot — fetch latest 200, filter client-side ── */
  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc'),
      limit(200)
    );

    const unsub = onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(docs);
      setLoading(false);

      // Keep selected order in sync with live updates
      setSelected(prev => {
        if (!prev) return null;
        const fresh = docs.find(o => o.id === prev.id);
        return fresh ?? prev;
      });
    }, err => {
      console.error('orders snapshot:', err);
      setLoading(false);
    });

    return unsub;
  }, []);

  /* ── Client-side filtering ─────────────────────────────────────── */
  const filtered = useMemo(() => {
    let result = orders;

    // Status
    if (statusFilter) {
      result = result.filter(o => o.status === statusFilter);
    }

    // Date from
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter(o => {
        const d = toDateObj(o.createdAt);
        return d && d >= from;
      });
    }

    // Date to
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(o => {
        const d = toDateObj(o.createdAt);
        return d && d <= to;
      });
    }

    // Text search: order number or phone
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(o =>
        o.orderNumber?.toLowerCase().includes(q) ||
        o.customer?.phone?.toLowerCase().includes(q) ||
        o.customer?.name?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [orders, statusFilter, dateFrom, dateTo, search]);

  /* ── Totals by status for quick overview ──────────────────────── */
  const counts = useMemo(() => {
    const map = {};
    for (const o of orders) {
      map[o.status] = (map[o.status] || 0) + 1;
    }
    return map;
  }, [orders]);

  return (
    <div className="adm-page">
      {/* ── Page header ────────────────────────────────────── */}
      <div className="adm-page-header">
        <div>
          <div className="adm-page-eyebrow">Fulfilment</div>
          <h1 className="adm-page-title">Orders</h1>
        </div>
        <div className="adm-order-stat-pills">
          {['pending', 'confirmed', 'packed', 'shipped'].map(s => (
            counts[s] > 0 && (
              <button
                key={s}
                className={`adm-stat-pill ${STATUS_CSS[s]}`}
                onClick={() => setStatusFilter(prev => prev === s ? '' : s)}
              >
                {STATUS_LABELS[s]} <strong>{counts[s]}</strong>
              </button>
            )
          ))}
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────── */}
      <div className="adm-filters-row">
        {/* Search */}
        <div className="adm-search-row" style={{ flex: 1, minWidth: 220, marginBottom: 0 }}>
          <Search size={14} className="adm-search-icon" />
          <input
            className="adm-search-input"
            placeholder="Search order number, name, phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Status */}
        <select
          className="form-input adm-select adm-filter-select"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ minWidth: 150 }}
          aria-label="Filter by status"
        >
          {ALL_STATUSES.map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>

        {/* Date from */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={13} style={{ color: 'var(--adm-muted)', flexShrink: 0 }} />
          <input
            type="date"
            className="form-input adm-date-input"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            aria-label="From date"
            title="From date"
          />
          <span style={{ color: 'var(--adm-muted)', fontSize: 12 }}>-</span>
          <input
            type="date"
            className="form-input adm-date-input"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            aria-label="To date"
            title="To date"
          />
        </div>

        {(statusFilter || dateFrom || dateTo || search) && (
          <button
            className="adm-btn-secondary"
            onClick={() => { setStatusFilter(''); setDateFrom(''); setDateTo(''); setSearch(''); }}
            style={{ whiteSpace: 'nowrap' }}
          >
            Clear filters
          </button>
        )}

        <span className="adm-count">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Orders table ───────────────────────────────────── */}
      {loading ? (
        <div className="adm-loading">Loading orders…</div>
      ) : filtered.length === 0 ? (
        <div className="adm-empty">
          {search || statusFilter || dateFrom || dateTo
            ? 'No orders match your filters.'
            : 'No orders yet.'}
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Payment</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr
                  key={order.id}
                  className={`adm-order-row ${selected?.id === order.id ? 'adm-row-selected' : ''}`}
                  onClick={() => setSelected(order)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <span className="adm-order-num">{order.orderNumber}</span>
                    {order.totalMismatch && (
                      <span className="adm-mismatch-dot" title="Total mismatch">!</span>
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--adm-muted)' }}>
                    {formatDate(order.createdAt)}
                  </td>
                  <td>
                    <div className="adm-product-name">{order.customer?.name || '-'}</div>
                    <div className="adm-product-desc">{order.customer?.phone || ''}</div>
                  </td>
                  <td style={{ color: 'var(--adm-muted)', fontSize: 12 }}>
                    {order.items?.length ?? 0} item{order.items?.length !== 1 ? 's' : ''}
                  </td>
                  <td>
                    <span className="adm-pay-method">
                      {order.paymentMethod === 'bank_transfer' ? 'Bank' : 'COD'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--adm-gold)', fontWeight: 500 }}>
                    {fmtRs(order.total)}
                  </td>
                  <td>
                    <span className={`status-badge ${STATUS_CSS[order.status]}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </td>
                  <td>
                    <ChevronRight size={14} style={{ color: 'var(--adm-muted)' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Detail panel ───────────────────────────────────── */}
      {selected && (
        <OrderDetailPanel
          order={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
