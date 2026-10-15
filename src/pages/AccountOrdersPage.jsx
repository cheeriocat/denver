// src/pages/AccountOrdersPage.jsx
// Customer's order history with real-time updates via onSnapshot.
// Shows status timeline, courier info, and tracking button.

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import StoreNav from '../components/StoreNav';

const STATUS_STEPS = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];

const STATUS_LABELS = {
  pending:   'Pending',
  confirmed: 'Confirmed',
  packed:    'Packed',
  shipped:   'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function StatusTimeline({ status }) {
  const isCancelled = status === 'cancelled';
  const currentIdx  = STATUS_STEPS.indexOf(status);

  return (
    <div className="order-timeline">
      {STATUS_STEPS.map((step, idx) => {
        const isActive    = !isCancelled && idx <= currentIdx;
        const isCancStep  = isCancelled && idx === 0;
        return (
          <div
            key={step}
            className={`timeline-step ${isActive || isCancStep ? (isCancelled ? 'cancelled' : 'active') : ''}`}
            style={{ flex: 1 }}
          >
            {/* Connector line to the left */}
            {idx > 0 && (
              <div
                className="timeline-connector"
                style={{
                  position: 'absolute',
                  top: '5px',
                  left: 'calc(-50% + 6px)',
                  right: 'calc(50% + 6px)',
                  height: '2px',
                  background: (!isCancelled && idx <= currentIdx) ? 'var(--gold)' : 'var(--border)',
                }}
              />
            )}
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="timeline-dot" />
              <div className="timeline-label">{STATUS_LABELS[step]}</div>
            </div>
          </div>
        );
      })}
      {isCancelled && (
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' }}>
          <div className="timeline-dot cancelled" />
          <div className="timeline-label" style={{ color: '#fc8181' }}>Cancelled</div>
        </div>
      )}
    </div>
  );
}

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AccountOrdersPage() {
  const { currentUser, userProfile, logout } = useAuth();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(30)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error('orders snapshot error:', err);
        setError('Could not load orders. Please refresh.');
        setLoading(false);
      }
    );

    return unsub;
  }, [currentUser]);

  const fmtRs = (n) => `Rs. ${Number(n).toLocaleString('en-LK')}`;

  return (
    <>
      <StoreNav backLabel="Back to Shop" backTo="/" />

      <div className="account-page">
        <div className="container">

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div className="account-page-title">My Account</div>
              <h1 className="account-page-heading" style={{ marginBottom: '4px' }}>My Orders</h1>
              <p style={{ fontFamily: 'var(--font-primary)', fontSize: '13px', color: 'var(--white-muted)', letterSpacing: '0.05em' }}>
                {currentUser?.email}
                {userProfile?.name && ` · ${userProfile.name}`}
              </p>
            </div>
            <button
              className="btn-outline"
              style={{ fontSize: '11px', padding: '10px 20px' }}
              onClick={logout}
            >
              Sign Out
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'var(--font-primary)', color: 'var(--white-muted)', letterSpacing: '0.2em' }}>
              Loading orders…
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="auth-error-banner">{error}</div>
          )}

          {/* Empty */}
          {!loading && !error && orders.length === 0 && (
            <div className="orders-empty">
              <span className="orders-empty-icon">🛍</span>
              <p className="orders-empty-text">You haven't placed any orders yet.</p>
              <a href="/" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', fontSize: '11px', padding: '14px 32px' }}>
                Start Shopping
              </a>
            </div>
          )}

          {/* Order list */}
          {!loading && !error && orders.length > 0 && (
            <div className="orders-list">
              {orders.map(order => (
                <div key={order.id} className="order-card">

                  {/* Header row */}
                  <div className="order-card-header">
                    <div>
                      <div className="order-card-number">{order.orderNumber}</div>
                      <div className="order-card-date">{formatDate(order.createdAt)}</div>
                    </div>
                    <span className={`status-badge status-${order.status}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="order-card-items">
                    {(order.items || []).map((item, i) => (
                      <div key={i} className="order-card-item">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="order-card-item-img"
                          />
                        )}
                        <span style={{ flex: 1 }}>{item.name} — {item.size}</span>
                        <span>×{item.qty}</span>
                        <span style={{ color: 'var(--gold)', marginLeft: '12px' }}>
                          {fmtRs(item.unitPrice * item.qty)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="order-card-totals">
                    <span>
                      Shipping: {order.shipping === 0 ? 'Free' : fmtRs(order.shipping)}
                    </span>
                    <span className="total">
                      Total: {fmtRs(order.total)}
                    </span>
                  </div>

                  {/* Status timeline */}
                  <StatusTimeline status={order.status} />

                  {/* Courier info */}
                  {(order.courierName || order.trackingNumber) && (
                    <div className="order-card-courier">
                      {order.courierName && <span>Courier: <strong>{order.courierName}</strong></span>}
                      {order.trackingNumber && (
                        <span style={{ marginLeft: order.courierName ? '16px' : 0 }}>
                          Tracking: <strong>{order.trackingNumber}</strong>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="order-card-actions">
                    {order.trackingUrl && (
                      <a
                        id={`track-btn-${order.orderNumber}`}
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-track"
                      >
                        Open Courier Tracking ↗
                      </a>
                    )}
                    <span style={{
                      fontFamily: 'var(--font-primary)',
                      fontSize: '11px',
                      color: 'var(--white-muted)',
                      letterSpacing: '0.1em',
                      alignSelf: 'center',
                    }}>
                      {order.paymentMethod === 'bank_transfer' ? '🏦 Bank Transfer' : '💵 Cash on Delivery'}
                    </span>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
