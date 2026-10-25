// src/pages/OrderSuccessPage.jsx
// Shown after a successful order placement.
// orderNumber comes from URL param; extra details (total, paymentMethod, settings)
// come from router state (navigate(..., { state: {...} })).

import { useParams, useLocation, Link } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';

export default function OrderSuccessPage() {
  const { orderNumber } = useParams();
  const { state } = useLocation();
  const { settings: storeSettings } = useSettings();

  const finalOrderNumber = orderNumber || state?.orderNumber || '';
  const total            = state?.total;
  const paymentMethod    = state?.paymentMethod;
  const settings         = state?.settings || storeSettings;

  const fmtRs = (n) => (n != null ? `Rs. ${Number(n).toLocaleString('en-LK')}` : '');

  return (
    <div className="order-success-page">
      {/* Checkmark */}
      <div className="order-success-icon">✓</div>

      {/* Title */}
      <h1 className="order-success-title">Order Placed!</h1>
      <div className="order-success-number">{finalOrderNumber}</div>

      <p className="order-success-msg">
        Thank you for shopping with Denver. We've received your order and will
        begin processing it shortly. You'll find your order details in{' '}
        <Link to="/account/orders" className="auth-link">My Orders</Link>.
      </p>

      {/* Bank Transfer instructions */}
      {paymentMethod === 'bank_transfer' && settings && (
        <div className="order-success-bank">
          <div className="bank-title">Complete Your Bank Transfer</div>
          <div>Bank: <strong>{settings.bankName}</strong></div>
          <div>Account Name: <strong>{settings.bankAccountName}</strong></div>
          <div>Account No: <strong>{settings.bankAccountNumber}</strong></div>
          <div>Branch: <strong>{settings.bankBranch}</strong></div>
          {settings.bankSwiftCode && <div>Swift: <strong>{settings.bankSwiftCode}</strong></div>}
          {total != null && (
            <div style={{ marginTop: '12px', fontSize: '14px' }}>
              Amount: <strong style={{ color: 'var(--gold)' }}>{fmtRs(total)}</strong>
            </div>
          )}
          <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--white-muted)', letterSpacing: '0.05em' }}>
            Use your order number <strong style={{ color: 'var(--white)' }}>{finalOrderNumber}</strong> as the
            transfer reference. Your order will be dispatched after payment is verified.
          </div>
        </div>
      )}

      {paymentMethod === 'cod' && (
        <p style={{
          fontFamily: 'var(--font-primary)',
          fontSize: '13px',
          color: 'var(--white-muted)',
          marginBottom: '40px',
          letterSpacing: '0.05em',
        }}>
          Payment: Cash on Delivery
          {total != null && <> - <strong style={{ color: 'var(--white)' }}>{fmtRs(total)}</strong> due on arrival</>}
        </p>
      )}

      {/* Actions */}
      <div className="order-success-actions">
        <Link id="view-orders-btn" to="/account/orders" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
          View My Orders
        </Link>
        <Link id="continue-shopping-btn" to="/" className="btn-outline" style={{ textDecoration: 'none', display: 'inline-block' }}>
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
