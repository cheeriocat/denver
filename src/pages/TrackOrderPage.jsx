// src/pages/TrackOrderPage.jsx
// Public order tracking page (no login needed).
// Fetches exclusively from orderTracking/{orderNumber} via a single document get.
// Shows status timeline, courier info, tracking URL link, or friendly not found notice.

import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import StoreNav from '../components/StoreNav';
import {
  Search,
  Truck,
  ExternalLink,
  AlertCircle,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const STATUS_STEPS = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];

const STATUS_LABELS = {
  pending:   'Order Placed',
  confirmed: 'Confirmed',
  packed:    'Packed',
  shipped:   'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-LK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusTimeline({ status }) {
  const isCancelled = status === 'cancelled';
  const currentIdx  = STATUS_STEPS.indexOf(status);

  return (
    <div className="order-timeline">
      {STATUS_STEPS.map((step, idx) => {
        const isActive   = !isCancelled && idx <= currentIdx;
        const isCancStep = isCancelled && idx === 0;

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

export default function TrackOrderPage() {
  const [searchParams] = useSearchParams();
  const [orderInput, setOrderInput] = useState('');
  const [loading, setLoading]       = useState(false);
  const [searched, setSearched]     = useState(false);
  const [tracking, setTracking]     = useState(null);
  const [notFound, setNotFound]     = useState(false);
  const [errorMsg, setErrorMsg]     = useState('');

  // ── Single doc fetch for orderTracking/{orderNumber} ──────────────────────
  const fetchTracking = async (numberToFetch) => {
    const cleanNumber = (numberToFetch || '').trim().toUpperCase();
    if (!cleanNumber) return;

    setLoading(true);
    setSearched(true);
    setErrorMsg('');
    setNotFound(false);
    setTracking(null);

    try {
      // NOTE: Single document get ONLY — never a list or query, matching Firestore security rules
      const docRef = doc(db, 'orderTracking', cleanNumber);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        setTracking(snap.data());
        setNotFound(false);
      } else {
        setTracking(null);
        setNotFound(true);
      }
    } catch (err) {
      console.error('Error fetching order tracking doc:', err);
      setErrorMsg('Unable to retrieve tracking information at this moment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-search if order number provided in URL query string (?order=... or ?number=...)
  useEffect(() => {
    const param = searchParams.get('order') || searchParams.get('number');
    if (param) {
      const normalized = param.trim().toUpperCase();
      setOrderInput(normalized);
      fetchTracking(normalized);
    }
  }, [searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchTracking(orderInput);
  };

  return (
    <>
      <StoreNav backLabel="Back to Shop" backTo="/" />

      <main className="track-page">
        <div className="container" style={{ maxWidth: '720px' }}>
          
          {/* ── Page Header ────────────────────────────────────── */}
          <div className="track-header">
            <div className="track-eyebrow">Real-Time Tracking</div>
            <h1 className="track-title">Track Your Order</h1>
            <p className="track-subtitle">
              Enter your full Denver order number below to check the real-time fulfillment,
              packaging, and islandwide courier dispatch status.
            </p>
          </div>

          {/* ── Search Bar Form ────────────────────────────────── */}
          <form className="track-search-card" onSubmit={handleSubmit}>
            <div className="track-input-wrap">
              <Search size={18} className="track-search-icon" />
              <input
                id="track-order-input"
                type="text"
                className="track-input"
                placeholder="Order Number (e.g. DNV-1004-1PIL)"
                value={orderInput}
                onChange={e => setOrderInput(e.target.value.toUpperCase())}
                autoFocus
                required
              />
            </div>
            <button
              id="track-submit-btn"
              type="submit"
              className="btn-primary track-btn"
              disabled={loading || !orderInput.trim()}
            >
              {loading ? 'Searching…' : 'Track Order'}
            </button>
          </form>

          {/* ── Error Banner ───────────────────────────────────── */}
          {errorMsg && (
            <div className="track-alert track-alert-error">
              <AlertCircle size={18} />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* ── Friendly Not Found Message ──────────────────────── */}
          {searched && !loading && notFound && (
            <div className="track-alert track-alert-warning">
              <AlertCircle size={20} className="track-alert-icon" />
              <div className="track-alert-body">
                <div className="track-alert-title">Order not found, or not confirmed yet</div>
                <p className="track-alert-desc">
                  We couldn't locate active tracking details for <strong>{orderInput.trim().toUpperCase()}</strong>.
                </p>
                <ul className="track-alert-list">
                  <li>Please ensure the order number is typed exactly as shown in your confirmation (e.g. <code>DNV-XXXX-XXXX</code>).</li>
                  <li>If your order was placed recently, please allow a short time for our team to verify and confirm your order in the system.</li>
                  <li>If you need immediate assistance, please reach out via our WhatsApp support.</li>
                </ul>
              </div>
            </div>
          )}

          {/* ── Tracking Result Card ────────────────────────────── */}
          {searched && !loading && tracking && (
            <div className="track-result-card">
              
              {/* Result Header */}
              <div className="track-result-header">
                <div>
                  <div className="track-result-tag">Denver Apparels</div>
                  <div className="track-result-number">{tracking.orderNumber}</div>
                  {tracking.updatedAt && (
                    <div className="track-result-time">
                      <Clock size={12} style={{ display: 'inline', marginRight: '5px', verticalAlign: '-1px' }} />
                      Status Updated: {formatDate(tracking.updatedAt)}
                    </div>
                  )}
                </div>

                <span className={`status-badge status-${tracking.status}`}>
                  {STATUS_LABELS[tracking.status] || tracking.status}
                </span>
              </div>

              {/* Status Timeline */}
              <div className="track-timeline-wrap">
                <StatusTimeline status={tracking.status} />
              </div>

              {/* Status Message */}
              <div className="track-status-summary">
                {tracking.status === 'pending' && (
                  <p>Your order has been recorded and is currently awaiting staff confirmation and stock verification.</p>
                )}
                {tracking.status === 'confirmed' && (
                  <p>Your order has been verified and stock has been reserved. It is queued for packing.</p>
                )}
                {tracking.status === 'packed' && (
                  <p>Your items have been carefully inspected, packaged, and are ready for courier pickup.</p>
                )}
                {tracking.status === 'shipped' && (
                  <p>Your package has been dispatched with our courier partner and is en route to your delivery address.</p>
                )}
                {tracking.status === 'delivered' && (
                  <p>Your order has been marked as successfully delivered. Thank you for choosing Denver!</p>
                )}
                {tracking.status === 'cancelled' && (
                  <p style={{ color: '#fc8181' }}>This order has been cancelled. Please contact support if you have questions.</p>
                )}
              </div>

              {/* Courier Information Block */}
              {(tracking.courierName || tracking.trackingNumber || tracking.trackingUrl) && (
                <div className="track-courier-box">
                  <div className="track-courier-icon">
                    <Truck size={20} />
                  </div>
                  <div className="track-courier-info">
                    <div className="track-courier-title">Dispatch & Courier Information</div>
                    <div className="track-courier-meta">
                      {tracking.courierName && (
                        <div>Courier: <strong>{tracking.courierName}</strong></div>
                      )}
                      {tracking.trackingNumber && (
                        <div>Waybill / Tracking No: <strong>{tracking.trackingNumber}</strong></div>
                      )}
                    </div>
                  </div>

                  {tracking.trackingUrl && (
                    <div className="track-courier-action">
                      <a
                        id="open-courier-tracking-btn"
                        href={tracking.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-track"
                      >
                        Open Courier Tracking
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Support Callout */}
              <div className="track-footer-callout">
                <span>Questions about your shipment?</span>
                <Link to="/#contact" className="track-support-link">Contact Denver Support</Link>
              </div>

            </div>
          )}

        </div>
      </main>
    </>
  );
}
