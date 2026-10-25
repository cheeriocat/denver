// src/admin/orders/OrderDetailPanel.jsx
// Slide-over panel for a single order: details, status update, courier fields,
// total mismatch warning, and cost info.

import { useState, useEffect } from 'react';
import { X, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react';
import { changeOrderStatus } from './orderActions';

const STATUS_FLOW = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];
const ALL_STATUSES = [...STATUS_FLOW, 'cancelled'];

const STATUS_LABELS = {
  pending:   'Pending',
  confirmed: 'Confirmed',
  packed:    'Packed',
  shipped:   'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

/** Statuses that can be transitioned to from a given current status */
function allowedTransitions(current) {
  if (current === 'cancelled' || current === 'delivered') return [];
  const idx = STATUS_FLOW.indexOf(current);
  const next = STATUS_FLOW.slice(idx + 1);
  return [...next, 'cancelled'];
}

function fmtRs(n) {
  return n != null ? `Rs. ${Number(n).toLocaleString('en-LK')}` : '-';
}

function formatDate(ts) {
  if (!ts) return '-';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-LK', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function OrderDetailPanel({ order, onClose }) {
  const [courierName,    setCourierName]    = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl,    setTrackingUrl]    = useState('');
  const [newStatus,      setNewStatus]      = useState('');
  const [saving,         setSaving]         = useState(false);
  const [saveError,      setSaveError]      = useState('');
  const [saveSuccess,    setSaveSuccess]    = useState('');
  const [mismatch,       setMismatch]       = useState(null); // { totalMismatch, recalcTotal }

  useEffect(() => {
    if (!order) return;
    setCourierName(order.courierName    || '');
    setTrackingNumber(order.trackingNumber || '');
    setTrackingUrl(order.trackingUrl    || '');
    setNewStatus('');
    setSaveError('');
    setSaveSuccess('');
    setMismatch(null);
  }, [order?.id]);

  if (!order) return null;

  const allowed = allowedTransitions(order.status);

  const handleUpdate = async () => {
    if (!newStatus) { setSaveError('Select a new status first.'); return; }
    setSaveError('');
    setSaveSuccess('');
    setMismatch(null);
    setSaving(true);

    try {
      const courierFields = {
        courierName:    courierName.trim(),
        trackingNumber: trackingNumber.trim(),
        trackingUrl:    trackingUrl.trim(),
      };

      const result = await changeOrderStatus(order, newStatus, courierFields);
      setSaveSuccess(`Status updated to "${STATUS_LABELS[newStatus]}".`);
      setNewStatus('');

      if (result?.totalMismatch) {
        setMismatch(result);
      }
    } catch (err) {
      console.error('order status update failed:', err);
      setSaveError(err.message || 'Update failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const customer = order.customer || {};
  const items    = order.items    || [];

  return (
    <div className="adm-panel-overlay" onClick={onClose}>
      <div className="adm-panel" onClick={e => e.stopPropagation()}>

        {/* ── Header ───────────────────────────────────── */}
        <div className="adm-panel-header">
          <div>
            <div className="adm-panel-eyebrow">Order</div>
            <h2 className="adm-panel-title">{order.orderNumber}</h2>
            <div className="adm-panel-sub">{formatDate(order.createdAt)}</div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span className={`adm-status-badge ${order.status}`}>
              {STATUS_LABELS[order.status] || order.status}
            </span>
            <button className="adm-icon-btn" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="adm-panel-body">

          {/* ── Total mismatch warning ────────────────────── */}
          {(order.totalMismatch || mismatch?.totalMismatch) && (
            <div className="adm-warn-banner">
              <AlertTriangle size={14} />
              <span>
                Total mismatch detected.
                {' '}Stored: {fmtRs(order.total)}
                {' '}· Recalculated: {fmtRs(mismatch?.recalcTotal ?? order.recalcTotal)}.
                {' '}Check item prices manually.
              </span>
            </div>
          )}

          {/* ── Save feedback ─────────────────────────────── */}
          {saveError   && <div className="admin-error-banner">{saveError}</div>}
          {saveSuccess && (
            <div className="adm-success-banner">
              <CheckCircle size={14} /> {saveSuccess}
            </div>
          )}

          {/* ── Customer ──────────────────────────────────── */}
          <div className="adm-panel-section">
            <div className="adm-panel-section-title">Customer</div>
            <div className="adm-info-grid">
              <div className="adm-info-row"><span>Name</span><span>{customer.name || '-'}</span></div>
              <div className="adm-info-row"><span>Phone</span><span>{customer.phone || '-'}</span></div>
              <div className="adm-info-row"><span>Email</span><span>{customer.email || '-'}</span></div>
              <div className="adm-info-row"><span>City</span><span>{customer.city || '-'}</span></div>
              <div className="adm-info-row" style={{ gridColumn: '1/-1' }}>
                <span>Address</span><span>{customer.address || '-'}</span>
              </div>
              {customer.notes && (
                <div className="adm-info-row" style={{ gridColumn: '1/-1' }}>
                  <span>Notes</span><span style={{ color: 'var(--adm-gold)' }}>{customer.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Items ─────────────────────────────────────── */}
          <div className="adm-panel-section">
            <div className="adm-panel-section-title">Items</div>
            <table className="adm-table" style={{ marginTop: '4px' }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Size</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Unit Price</th>
                  <th style={{ textAlign: 'right' }}>Unit Cost</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {item.image && (
                          <img src={item.image} alt={item.name}
                            style={{ width: 32, height: 32, objectFit: 'cover', border: '1px solid var(--adm-border)', flexShrink: 0 }} />
                        )}
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td>{item.size}</td>
                    <td style={{ textAlign: 'right' }}>{item.qty}</td>
                    <td style={{ textAlign: 'right' }}>{fmtRs(item.unitPrice)}</td>
                    <td style={{ textAlign: 'right', color: item.unitCost ? 'var(--adm-muted)' : 'var(--adm-border2)' }}>
                      {item.unitCost != null ? fmtRs(item.unitCost) : '-'}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--adm-gold)' }}>
                      {fmtRs(item.unitPrice * item.qty)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="adm-order-totals">
              <div className="adm-info-row">
                <span>Subtotal</span>
                <span>{fmtRs(order.subtotal)}</span>
              </div>
              <div className="adm-info-row">
                <span>Shipping</span>
                <span>{order.shipping === 0 ? 'Free' : fmtRs(order.shipping)}</span>
              </div>
              <div className="adm-info-row adm-total-row">
                <span>Total</span>
                <span>{fmtRs(order.total)}</span>
              </div>
              <div className="adm-info-row">
                <span>Payment</span>
                <span>
                  {order.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Cash on Delivery'}
                  {' '}<span className={`adm-pay-status ${order.paymentStatus}`}>
                    {order.paymentStatus || 'unpaid'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* ── Courier info ──────────────────────────────── */}
          <div className="adm-panel-section">
            <div className="adm-panel-section-title">Courier &amp; Tracking</div>
            <div className="adm-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="od-courier">Courier Name</label>
                <input
                  id="od-courier"
                  className="form-input"
                  value={courierName}
                  onChange={e => setCourierName(e.target.value)}
                  placeholder="e.g. DHL, Domex"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="od-tracking-num">Tracking Number</label>
                <input
                  id="od-tracking-num"
                  className="form-input"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label" htmlFor="od-tracking-url">Tracking URL</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    id="od-tracking-url"
                    className="form-input"
                    value={trackingUrl}
                    onChange={e => setTrackingUrl(e.target.value)}
                    placeholder="https://…"
                    style={{ flex: 1 }}
                  />
                  {trackingUrl && (
                    <a
                      href={trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="adm-icon-btn"
                      title="Open tracking URL"
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Status update ─────────────────────────────── */}
          <div className="adm-panel-section">
            <div className="adm-panel-section-title">Update Status</div>

            {allowed.length === 0 ? (
              <p style={{ fontFamily: 'var(--adm-font)', fontSize: '12px', color: 'var(--adm-muted)' }}>
                This order cannot be advanced further.
              </p>
            ) : (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  className="form-input adm-select"
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  style={{ maxWidth: '200px' }}
                  id="od-status-select"
                >
                  <option value="">- Choose new status -</option>
                  {allowed.map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>

                {newStatus === 'confirmed' && order.status === 'pending' && (
                  <span style={{ fontFamily: 'var(--adm-font)', fontSize: '11px', color: 'var(--adm-gold)', letterSpacing: '0.05em' }}>
                    Will deduct stock &amp; snapshot costs
                  </span>
                )}
                {newStatus === 'cancelled' && ['confirmed', 'packed', 'shipped'].includes(order.status) && (
                  <span style={{ fontFamily: 'var(--adm-font)', fontSize: '11px', color: '#fc8181', letterSpacing: '0.05em' }}>
                    Will restore stock
                  </span>
                )}

                <button
                  id="od-update-btn"
                  className="adm-btn-primary"
                  onClick={handleUpdate}
                  disabled={saving || !newStatus}
                >
                  {saving ? 'Saving…' : 'Update Order'}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
